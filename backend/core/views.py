from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Settore,
    User,
    EventoCalendario,
    TodoList,
    TodoItem,
    TicketAssistenza,
    TicketImmagine,
    TicketMessaggio,
    Comunicazione,
)
from .serializers import (
    SettoreSerializer,
    UserSerializer,
    EventoCalendarioSerializer,
    TodoListSerializer,
    TodoItemSerializer,
    TicketAssistenzaSerializer,
    TicketImmagineSerializer,
    TicketMessaggioSerializer,
    ComunicazioneSerializer,
)


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    identifier = (request.data.get('email') or request.data.get('username') or '').strip()
    password = request.data.get('password') or ''

    if not identifier or not password:
        return Response(
            {'detail': 'Inserire email e password per accedere.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_obj = User.objects.filter(
        Q(email__iexact=identifier) | Q(username__iexact=identifier)
    ).first()

    user = None
    if user_obj:
        user = authenticate(request, username=user_obj.username, password=password)

    if not user:
        return Response(
            {'detail': 'Credenziali non valide. Verifica email e password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {'detail': 'Utente disabilitato. Contattare l\'amministratore.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)


def get_comunicazioni_for_user(user, show_all_for_admin=False):
    if show_all_for_admin and user.is_staff:
        return Comunicazione.objects.select_related(
            'autore', 'settore_destinatario', 'utente_destinatario'
        ).all()

    query = Q(tipo_destinatario='TUTTI') | Q(
        tipo_destinatario='UTENTE', utente_destinatario=user
    )
    if user.settore_id:
        query |= Q(tipo_destinatario='SETTORE', settore_destinatario_id=user.settore_id)

    return Comunicazione.objects.select_related(
        'autore', 'settore_destinatario', 'utente_destinatario'
    ).filter(query).distinct()


def get_eventi_for_user(user):
    query = Q(visibilita='ENTE') | Q(creato_da=user)
    if user.settore_id:
        query |= Q(visibilita='SETTORE', settore_id=user.settore_id)
    return EventoCalendario.objects.select_related('creato_da', 'settore').filter(query).distinct()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_summary_view(request):
    user = request.user

    # Ensure default todo lists exist for the user
    if not TodoList.objects.filter(utente=user).exists():
        for idx, name in enumerate(['Da Fare', 'In Corso', 'Completati']):
            TodoList.objects.create(nome=name, ordine=idx, utente=user)

    todo_da_fare_count = TodoItem.objects.filter(utente=user, completato=False).count()
    todo_completati_count = TodoItem.objects.filter(utente=user, completato=True).count()

    miei_ticket_aperti = TicketAssistenza.objects.filter(
        utente=user, stato__in=['APERTO', 'IN_ELABORAZIONE']
    ).count()

    totale_ticket_aperti_ente = TicketAssistenza.objects.filter(
        stato__in=['APERTO', 'IN_ELABORAZIONE']
    ).count()

    ultime_comunicazioni = get_comunicazioni_for_user(user)[:3]
    eventi = get_eventi_for_user(user)
    todo_con_scadenza = TodoItem.objects.select_related('lista').filter(
        utente=user, scadenza__isnull=False
    )

    return Response({
        'todo_da_fare_count': todo_da_fare_count,
        'todo_completati_count': todo_completati_count,
        'ticket_aperti_count': miei_ticket_aperti,
        'totale_ticket_aperti_ente': totale_ticket_aperti_ente,
        'ultime_comunicazioni': ComunicazioneSerializer(ultime_comunicazioni, many=True).data,
        'eventi': EventoCalendarioSerializer(eventi, many=True).data,
        'todo_scadenze': TodoItemSerializer(todo_con_scadenza, many=True).data,
    })


class SettoreViewSet(viewsets.ModelViewSet):
    queryset = Settore.objects.all()
    serializer_class = SettoreSerializer
    permission_classes = [IsStaffOrReadOnly]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('settore').all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


class EventoCalendarioViewSet(viewsets.ModelViewSet):
    serializer_class = EventoCalendarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return get_eventi_for_user(self.request.user)

    def perform_create(self, serializer):
        visibilita = serializer.validated_data.get('visibilita', 'PERSONALE')
        settore = serializer.validated_data.get('settore')
        if visibilita == 'SETTORE' and not settore and self.request.user.settore:
            settore = self.request.user.settore
        serializer.save(creato_da=self.request.user, settore=settore)

    @action(detail=False, methods=['get'])
    def con_scadenze(self, request):
        eventi = self.get_queryset()
        todo_scadenze = TodoItem.objects.select_related('lista').filter(
            utente=request.user, scadenza__isnull=False
        )
        return Response({
            'eventi': EventoCalendarioSerializer(eventi, many=True).data,
            'todo_scadenze': TodoItemSerializer(todo_scadenze, many=True).data,
        })


class TodoListViewSet(viewsets.ModelViewSet):
    serializer_class = TodoListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not TodoList.objects.filter(utente=user).exists():
            for idx, name in enumerate(['Da Fare', 'In Corso', 'Completati']):
                TodoList.objects.create(nome=name, ordine=idx, utente=user)
        return TodoList.objects.prefetch_related('items').filter(utente=user)

    def perform_create(self, serializer):
        count = TodoList.objects.filter(utente=self.request.user).count()
        serializer.save(utente=self.request.user, ordine=count)


class TodoItemViewSet(viewsets.ModelViewSet):
    serializer_class = TodoItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TodoItem.objects.select_related('lista').filter(utente=self.request.user)

    def perform_create(self, serializer):
        serializer.save(utente=self.request.user)


class TicketAssistenzaViewSet(viewsets.ModelViewSet):
    serializer_class = TicketAssistenzaSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = TicketAssistenza.objects.select_related(
            'utente', 'utente__settore'
        ).prefetch_related('immagini', 'messaggi', 'messaggi__autore')

        tutti = self.request.query_params.get('tutti', 'false').lower() == 'true'
        if user.is_staff and tutti:
            return qs.all()
        if user.is_staff and self.action in ['retrieve', 'update', 'partial_update', 'aggiungi_messaggio', 'aggiorna_stato']:
            return qs.all()
        return qs.filter(utente=user)

    def perform_create(self, serializer):
        ticket = serializer.save(utente=self.request.user)
        files = self.request.FILES.getlist('immagini_files')
        for f in files:
            TicketImmagine.objects.create(ticket=ticket, immagine=f)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_immagini(self, request, pk=None):
        ticket = self.get_object()
        files = request.FILES.getlist('immagini_files')
        created = []
        for f in files:
            img = TicketImmagine.objects.create(ticket=ticket, immagine=f)
            created.append(TicketImmagineSerializer(img).data)
        return Response(created, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def aggiungi_messaggio(self, request, pk=None):
        ticket = self.get_object()
        testo = (request.data.get('messaggio') or '').strip()
        nuovo_stato = request.data.get('stato')

        if not testo and not nuovo_stato:
            return Response(
                {'detail': 'Inserire un messaggio o selezionare uno stato.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if nuovo_stato and request.user.is_staff:
            valid_states = dict(TicketAssistenza.STATO_CHOICES).keys()
            if nuovo_stato in valid_states:
                ticket.stato = nuovo_stato
                ticket.save(update_fields=['stato', 'updated_at'])

        if testo:
            TicketMessaggio.objects.create(
                ticket=ticket,
                autore=request.user,
                messaggio=testo,
            )
            ticket.save(update_fields=['updated_at'])

        ticket.refresh_from_db()
        return Response(TicketAssistenzaSerializer(ticket).data)

    @action(detail=True, methods=['patch', 'post'])
    def aggiorna_stato(self, request, pk=None):
        if not request.user.is_staff:
            return Response(
                {'detail': 'Solo gli amministratori possono modificare lo stato del ticket.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        ticket = self.get_object()
        nuovo_stato = request.data.get('stato')
        messaggio = (request.data.get('messaggio') or '').strip()

        valid_states = dict(TicketAssistenza.STATO_CHOICES).keys()
        if nuovo_stato in valid_states:
            ticket.stato = nuovo_stato
            ticket.save(update_fields=['stato', 'updated_at'])

        if messaggio:
            TicketMessaggio.objects.create(
                ticket=ticket,
                autore=request.user,
                messaggio=messaggio,
            )

        ticket.refresh_from_db()
        return Response(TicketAssistenzaSerializer(ticket).data)


class ComunicazioneViewSet(viewsets.ModelViewSet):
    serializer_class = ComunicazioneSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        tutte = self.request.query_params.get('tutte', 'false').lower() == 'true'
        return get_comunicazioni_for_user(self.request.user, show_all_for_admin=tutte)

    def perform_create(self, serializer):
        serializer.save(autore=self.request.user)
