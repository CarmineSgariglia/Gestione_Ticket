from django.db import models
from django.contrib.auth.models import AbstractUser


class Settore(models.Model):
    nome = models.CharField(max_length=120, unique=True, verbose_name="Nome Settore")
    codice = models.CharField(max_length=25, blank=True, verbose_name="Codice Ufficio")
    descrizione = models.TextField(blank=True, verbose_name="Descrizione")

    class Meta:
        verbose_name = "Settore"
        verbose_name_plural = "Settori"
        ordering = ['nome']

    def __str__(self):
        return f"{self.nome} ({self.codice})" if self.codice else self.nome


class User(AbstractUser):
    email = models.EmailField(unique=True, verbose_name="Indirizzo Email")
    first_name = models.CharField(max_length=100, verbose_name="Nome")
    last_name = models.CharField(max_length=100, verbose_name="Cognome")
    telefono = models.CharField(max_length=35, blank=True, verbose_name="Numero di Telefono")
    settore = models.ForeignKey(
        Settore,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='utenti',
        verbose_name="Settore di Appartenenza"
    )

    class Meta:
        verbose_name = "Utente"
        verbose_name_plural = "Utenti"
        ordering = ['last_name', 'first_name']

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return f"{full_name} ({self.email})" if full_name else self.email


class EventoCalendario(models.Model):
    VISIBILITA_CHOICES = [
        ('PERSONALE', 'Personale'),
        ('SETTORE', 'Settore di Appartenenza'),
        ('ENTE', 'Tutto l\'Ente'),
    ]

    titolo = models.CharField(max_length=200, verbose_name="Titolo")
    descrizione = models.TextField(blank=True, verbose_name="Descrizione")
    data_inizio = models.DateTimeField(verbose_name="Data e Ora Inizio")
    data_fine = models.DateTimeField(verbose_name="Data e Ora Fine")
    tutto_il_giorno = models.BooleanField(default=False, verbose_name="Tutto il giorno")
    visibilita = models.CharField(
        max_length=20,
        choices=VISIBILITA_CHOICES,
        default='PERSONALE',
        verbose_name="Visibilità"
    )
    settore = models.ForeignKey(
        Settore,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='eventi',
        verbose_name="Settore (se condiviso per settore)"
    )
    creato_da = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='eventi_creati',
        verbose_name="Creato da"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Evento Calendario"
        verbose_name_plural = "Eventi Calendario"
        ordering = ['data_inizio']

    def __str__(self):
        return f"{self.titolo} ({self.data_inizio.strftime('%d/%m/%Y')})"


class TodoList(models.Model):
    nome = models.CharField(max_length=120, verbose_name="Nome Lista")
    ordine = models.IntegerField(default=0, verbose_name="Ordine")
    utente = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='todo_lists',
        verbose_name="Utente"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Lista To-Do"
        verbose_name_plural = "Liste To-Do"
        ordering = ['ordine', 'id']

    def __str__(self):
        return f"{self.nome} - {self.utente.email}"


class TodoItem(models.Model):
    lista = models.ForeignKey(
        TodoList,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="Lista"
    )
    utente = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='todo_items',
        verbose_name="Utente"
    )
    titolo = models.CharField(max_length=200, verbose_name="Titolo")
    descrizione = models.TextField(blank=True, verbose_name="Descrizione")
    completato = models.BooleanField(default=False, verbose_name="Completato")
    scadenza = models.DateTimeField(null=True, blank=True, verbose_name="Scadenza")
    ordine = models.IntegerField(default=0, verbose_name="Ordine")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Attività To-Do"
        verbose_name_plural = "Attività To-Do"
        ordering = ['completato', 'ordine', '-created_at']

    def __str__(self):
        return self.titolo


class TicketAssistenza(models.Model):
    STATO_CHOICES = [
        ('APERTO', 'Aperto'),
        ('IN_ELABORAZIONE', 'In Elaborazione'),
        ('RISOLTO', 'Risolto'),
        ('CHIUSO', 'Chiuso'),
    ]
    PRIORITA_CHOICES = [
        ('BASSA', 'Bassa'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
    ]

    titolo = models.CharField(max_length=200, verbose_name="Titolo Problema")
    descrizione = models.TextField(verbose_name="Descrizione Dettagliata")
    stato = models.CharField(
        max_length=25,
        choices=STATO_CHOICES,
        default='APERTO',
        verbose_name="Stato"
    )
    priorita = models.CharField(
        max_length=15,
        choices=PRIORITA_CHOICES,
        default='MEDIA',
        verbose_name="Priorità"
    )
    utente = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tickets',
        verbose_name="Richiedente"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data Apertura")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ultimo Aggiornamento")

    class Meta:
        verbose_name = "Ticket di Assistenza"
        verbose_name_plural = "Ticket di Assistenza"
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.id} - {self.titolo} ({self.get_stato_display()})"


class TicketImmagine(models.Model):
    ticket = models.ForeignKey(
        TicketAssistenza,
        on_delete=models.CASCADE,
        related_name='immagini',
        verbose_name="Ticket"
    )
    immagine = models.ImageField(upload_to='tickets/%Y/%m/', verbose_name="Immagine Allegata")
    didascalia = models.CharField(max_length=200, blank=True, verbose_name="Didascalia")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Immagine Ticket"
        verbose_name_plural = "Immagini Ticket"


class TicketMessaggio(models.Model):
    ticket = models.ForeignKey(
        TicketAssistenza,
        on_delete=models.CASCADE,
        related_name='messaggi',
        verbose_name="Ticket"
    )
    autore = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='messaggi_ticket',
        verbose_name="Autore"
    )
    messaggio = models.TextField(verbose_name="Messaggio")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data Invio")

    class Meta:
        verbose_name = "Messaggio Ticket"
        verbose_name_plural = "Messaggi Ticket"
        ordering = ['created_at']

    def __str__(self):
        return f"Messaggio su #{self.ticket_id} da {self.autore.email}"


class Comunicazione(models.Model):
    TIPO_DESTINATARIO_CHOICES = [
        ('TUTTI', 'Tutti gli utenti dell\'Ente'),
        ('SETTORE', 'Specifico Settore'),
        ('UTENTE', 'Singolo Utente'),
    ]

    titolo = models.CharField(max_length=220, verbose_name="Oggetto / Titolo")
    contenuto = models.TextField(verbose_name="Testo della Comunicazione")
    tipo_destinatario = models.CharField(
        max_length=15,
        choices=TIPO_DESTINATARIO_CHOICES,
        default='TUTTI',
        verbose_name="Destinatari"
    )
    settore_destinatario = models.ForeignKey(
        Settore,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='comunicazioni',
        verbose_name="Settore Destinatario"
    )
    utente_destinatario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='comunicazioni_personali',
        verbose_name="Utente Destinatario"
    )
    autore = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='comunicazioni_inviate',
        verbose_name="Inviato da"
    )
    importante = models.BooleanField(default=False, verbose_name="In Evidenza / Urgente")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data Pubblicazione")

    class Meta:
        verbose_name = "Comunicazione"
        verbose_name_plural = "Comunicazioni"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.titolo} ({self.get_tipo_destinatario_display()})"
