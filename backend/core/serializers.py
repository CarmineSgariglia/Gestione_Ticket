from rest_framework import serializers
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


class SettoreSerializer(serializers.ModelSerializer):
    utenti_count = serializers.IntegerField(source='utenti.count', read_only=True)

    class Meta:
        model = Settore
        fields = ['id', 'nome', 'codice', 'descrizione', 'utenti_count']


class UserSerializer(serializers.ModelSerializer):
    settore_dettaglio = SettoreSerializer(source='settore', read_only=True)
    settore_nome = serializers.CharField(source='settore.nome', read_only=True, default='Nessun Settore')
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'telefono',
            'settore',
            'settore_nome',
            'settore_dettaglio',
            'is_staff',
            'is_superuser',
            'is_active',
            'password',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password', None) or 'Ente2026!'
        if not validated_data.get('username'):
            validated_data['username'] = validated_data['email'].split('@')[0]
        # Ensure unique username
        base_username = validated_data['username']
        counter = 1
        while User.objects.filter(username=validated_data['username']).exists():
            validated_data['username'] = f"{base_username}{counter}"
            counter += 1

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Create default Kanban lists for new user
        default_lists = ['Da Fare', 'In Corso', 'Completati']
        for idx, list_name in enumerate(default_lists):
            TodoList.objects.create(nome=list_name, ordine=idx, utente=user)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class EventoCalendarioSerializer(serializers.ModelSerializer):
    creato_da_nome = serializers.SerializerMethodField()
    settore_nome = serializers.CharField(source='settore.nome', read_only=True, default=None)

    class Meta:
        model = EventoCalendario
        fields = [
            'id',
            'titolo',
            'descrizione',
            'data_inizio',
            'data_fine',
            'tutto_il_giorno',
            'visibilita',
            'settore',
            'settore_nome',
            'creato_da',
            'creato_da_nome',
            'created_at',
        ]
        read_only_fields = ['creato_da', 'created_at']

    def get_creato_da_nome(self, obj):
        if obj.creato_da:
            return f"{obj.creato_da.first_name} {obj.creato_da.last_name}".strip() or obj.creato_da.email
        return ''


class TodoItemSerializer(serializers.ModelSerializer):
    lista_nome = serializers.CharField(source='lista.nome', read_only=True)

    class Meta:
        model = TodoItem
        fields = [
            'id',
            'lista',
            'lista_nome',
            'utente',
            'titolo',
            'descrizione',
            'completato',
            'scadenza',
            'ordine',
            'created_at',
        ]
        read_only_fields = ['utente', 'created_at']


class TodoListSerializer(serializers.ModelSerializer):
    items = TodoItemSerializer(many=True, read_only=True)

    class Meta:
        model = TodoList
        fields = ['id', 'nome', 'ordine', 'utente', 'items', 'created_at']
        read_only_fields = ['utente', 'created_at']


class TicketImmagineSerializer(serializers.ModelSerializer):
    immagine_url = serializers.SerializerMethodField()

    class Meta:
        model = TicketImmagine
        fields = ['id', 'ticket', 'immagine', 'immagine_url', 'didascalia', 'uploaded_at']
        read_only_fields = ['uploaded_at']

    def get_immagine_url(self, obj):
        if obj.immagine:
            return obj.immagine.url
        return ''


class TicketMessaggioSerializer(serializers.ModelSerializer):
    autore_nome = serializers.SerializerMethodField()
    autore_is_admin = serializers.BooleanField(source='autore.is_staff', read_only=True)
    autore_settore = serializers.CharField(source='autore.settore.nome', read_only=True, default='')

    class Meta:
        model = TicketMessaggio
        fields = [
            'id',
            'ticket',
            'autore',
            'autore_nome',
            'autore_is_admin',
            'autore_settore',
            'messaggio',
            'created_at',
        ]
        read_only_fields = ['autore', 'created_at']

    def get_autore_nome(self, obj):
        if obj.autore:
            return f"{obj.autore.first_name} {obj.autore.last_name}".strip() or obj.autore.email
        return ''


class TicketAssistenzaSerializer(serializers.ModelSerializer):
    utente_nome = serializers.SerializerMethodField()
    utente_email = serializers.CharField(source='utente.email', read_only=True)
    utente_telefono = serializers.CharField(source='utente.telefono', read_only=True)
    utente_settore = serializers.CharField(source='utente.settore.nome', read_only=True, default='Non assegnato')
    stato_display = serializers.CharField(source='get_stato_display', read_only=True)
    priorita_display = serializers.CharField(source='get_priorita_display', read_only=True)
    immagini = TicketImmagineSerializer(many=True, read_only=True)
    messaggi = TicketMessaggioSerializer(many=True, read_only=True)

    class Meta:
        model = TicketAssistenza
        fields = [
            'id',
            'titolo',
            'descrizione',
            'stato',
            'stato_display',
            'priorita',
            'priorita_display',
            'utente',
            'utente_nome',
            'utente_email',
            'utente_telefono',
            'utente_settore',
            'immagini',
            'messaggi',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['utente', 'created_at', 'updated_at']

    def get_utente_nome(self, obj):
        if obj.utente:
            return f"{obj.utente.first_name} {obj.utente.last_name}".strip() or obj.utente.email
        return ''


class ComunicazioneSerializer(serializers.ModelSerializer):
    autore_nome = serializers.SerializerMethodField()
    settore_destinatario_nome = serializers.CharField(
        source='settore_destinatario.nome', read_only=True, default=None
    )
    utente_destinatario_nome = serializers.SerializerMethodField()
    tipo_destinatario_display = serializers.CharField(
        source='get_tipo_destinatario_display', read_only=True
    )

    class Meta:
        model = Comunicazione
        fields = [
            'id',
            'titolo',
            'contenuto',
            'tipo_destinatario',
            'tipo_destinatario_display',
            'settore_destinatario',
            'settore_destinatario_nome',
            'utente_destinatario',
            'utente_destinatario_nome',
            'autore',
            'autore_nome',
            'importante',
            'created_at',
        ]
        read_only_fields = ['autore', 'created_at']

    def get_autore_nome(self, obj):
        if obj.autore:
            return f"{obj.autore.first_name} {obj.autore.last_name}".strip() or obj.autore.email
        return 'Amministrazione'

    def get_utente_destinatario_nome(self, obj):
        if obj.utente_destinatario:
            return (
                f"{obj.utente_destinatario.first_name} {obj.utente_destinatario.last_name}".strip()
                or obj.utente_destinatario.email
            )
        return None
