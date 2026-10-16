import io
from datetime import timedelta
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone
from PIL import Image, ImageDraw

from core.models import (
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


def generate_demo_screenshot(title_text: str, subtitle_text: str) -> ContentFile:
    img = Image.new('RGB', (640, 360), color=(248, 249, 250))
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 20, 620, 340], outline=(210, 214, 220), width=2)
    draw.rectangle([20, 20, 620, 65], fill=(233, 236, 239))
    draw.text((40, 36), f"Segnalazione Tecnica - {title_text}", fill=(52, 58, 64))
    draw.text((40, 110), subtitle_text, fill=(73, 80, 87))
    draw.rectangle([40, 160, 580, 290], outline=(222, 226, 230), fill=(255, 255, 255))
    draw.text((60, 210), "Allegato Diagnostico Ente Pubblico - Sistema Informativo", fill=(108, 117, 125))

    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return ContentFile(buffer.getvalue(), name='segnalazione_allegato.png')


class Command(BaseCommand):
    help = 'Popola il database con settori, utenti demo, eventi, to-do, ticket e comunicazioni.'

    def handle(self, *args, **options):
        if User.objects.exists():
            self.stdout.write(self.style.SUCCESS('Database già popolato. Nessuna modifica effettuata.'))
            return

        self.stdout.write('Inizializzazione dati dimostrativi per Gestionale Ente Pubblico...')

        settori_data = [
            ('Affari Generali e Protocollo', 'AGP', 'Gestione protocollo informatico, delibere e segreteria generale'),
            ('Sistemi Informativi e Transizione Digitale (CED)', 'CED', 'Infrastruttura IT, reti, sicurezza e supporto tecnico'),
            ('Servizi Demografici e Stato Civile', 'DEM', 'Anagrafe, stato civile, elettorale e leva'),
            ('Ragioneria, Bilancio e Tributi', 'RAG', 'Contabilità finanziaria, economato e gestione tributi comunali'),
            ('Ufficio Tecnico e Lavori Pubblici', 'UTC', 'Urbanistica, edilizia privata, manutenzione e opere pubbliche'),
        ]
        settori = {}
        for nome, codice, desc in settori_data:
            s = Settore.objects.create(nome=nome, codice=codice, descrizione=desc)
            settori[codice] = s

        # 1. Utente Admin (Responsabile CED / Amministratore)
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@ente.gov.it',
            password='Admin2026!',
            first_name='Marco',
            last_name='Rossi',
            telefono='06 5550 101',
            settore=settori['CED'],
        )

        # 2. Utenti Dipendenti
        laura = User.objects.create_user(
            username='laura.bianchi',
            email='laura.bianchi@ente.gov.it',
            password='Utente2026!',
            first_name='Laura',
            last_name='Bianchi',
            telefono='06 5550 204',
            settore=settori['AGP'],
        )

        giuseppe = User.objects.create_user(
            username='giuseppe.verdi',
            email='giuseppe.verdi@ente.gov.it',
            password='Utente2026!',
            first_name='Giuseppe',
            last_name='Verdi',
            telefono='06 5550 312',
            settore=settori['UTC'],
        )

        elena = User.objects.create_user(
            username='elena.ferrari',
            email='elena.ferrari@ente.gov.it',
            password='Utente2026!',
            first_name='Elena',
            last_name='Ferrari',
            telefono='06 5550 418',
            settore=settori['DEM'],
        )

        now = timezone.now()

        # Creazione Liste To-Do e Items per Admin e Laura
        for u in [admin_user, laura, giuseppe, elena]:
            l_dafare = TodoList.objects.create(nome='Da Fare', ordine=0, utente=u)
            l_incorso = TodoList.objects.create(nome='In Corso', ordine=1, utente=u)
            l_completati = TodoList.objects.create(nome='Completati', ordine=2, utente=u)

            TodoItem.objects.create(
                lista=l_dafare,
                utente=u,
                titolo='Revisione determine dirigenziali trimestrali',
                descrizione='Controllare gli allegati contabili e inviare al protocollo entro la scadenza.',
                completato=False,
                scadenza=now + timedelta(days=2),
                ordine=0,
            )
            TodoItem.objects.create(
                lista=l_dafare,
                utente=u,
                titolo='Invio report monitoraggio PNRR',
                descrizione='Caricare la rendicontazione aggiornata sul portale istituzionale.',
                completato=False,
                scadenza=now + timedelta(days=5),
                ordine=1,
            )
            TodoItem.objects.create(
                lista=l_incorso,
                utente=u,
                titolo='Aggiornamento modulistica sportello cittadino',
                descrizione='Adeguamento dei moduli PDF secondo le nuove linee guida di accessibilità AgID.',
                completato=False,
                scadenza=now + timedelta(days=1),
                ordine=0,
            )
            TodoItem.objects.create(
                lista=l_completati,
                utente=u,
                titolo='Verifica firme digitali in scadenza',
                descrizione='Controllo completato per tutti gli operatori del settore.',
                completato=True,
                scadenza=now - timedelta(days=1),
                ordine=0,
            )

        # Creazione Eventi Calendario
        EventoCalendario.objects.create(
            titolo='Conferenza dei Servizi - Piano Triennale Opere Pubbliche',
            descrizione='Riunione plenaria presso Sala Consiliare con tutti i responsabili di settore.',
            data_inizio=now.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1),
            data_fine=now.replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=1),
            tutto_il_giorno=False,
            visibilita='ENTE',
            creato_da=admin_user,
        )
        EventoCalendario.objects.create(
            titolo='Finestra di Manutenzione Programmata Server Protocollo',
            descrizione='Aggiornamento di sicurezza sui nodi database e verifica backup.',
            data_inizio=now.replace(hour=14, minute=30, second=0, microsecond=0) + timedelta(days=3),
            data_fine=now.replace(hour=16, minute=30, second=0, microsecond=0) + timedelta(days=3),
            tutto_il_giorno=False,
            visibilita='ENTE',
            creato_da=admin_user,
        )
        EventoCalendario.objects.create(
            titolo='Allineamento Interno Ufficio Protocollo',
            descrizione='Verifica flussi PEC e smistamento posta in ingresso.',
            data_inizio=now.replace(hour=9, minute=30, second=0, microsecond=0) + timedelta(days=4),
            data_fine=now.replace(hour=10, minute=30, second=0, microsecond=0) + timedelta(days=4),
            tutto_il_giorno=False,
            visibilita='SETTORE',
            settore=settori['AGP'],
            creato_da=laura,
        )

        # Creazione Ticket di Assistenza
        t1 = TicketAssistenza.objects.create(
            titolo='Errore sincronizzazione lettore Smart Card CIE/CNS',
            descrizione='Dalla postazione n. 4 dello sportello il lettore di firma digitale non rileva il certificato CNS all\'apertura del software di protocollo.',
            stato='IN_ELABORAZIONE',
            priorita='ALTA',
            utente=laura,
        )
        img1 = generate_demo_screenshot('Errore Lettore CNS #402', 'Codice errore: PKCS11_TOKEN_NOT_PRESENT sulla porta USB')
        TicketImmagine.objects.create(ticket=t1, immagine=img1, didascalia='Schermata errore driver CNS')
        TicketMessaggio.objects.create(
            ticket=t1,
            autore=admin_user,
            messaggio='Buongiorno Laura, abbiamo preso in carico la segnalazione. Alle 14:00 un tecnico CED passerà in ufficio per aggiornare i driver Bit4id.',
        )

        t2 = TicketAssistenza.objects.create(
            titolo='Richiesta abilitazione cartella condivisa Progetti Urbanistica',
            descrizione='Necessito dei permessi di lettura e scrittura sulla directory di rete \\\\srv-nas\\urbanistica_2026 per il caricamento delle planimetrie.',
            stato='APERTO',
            priorita='MEDIA',
            utente=giuseppe,
        )

        t3 = TicketAssistenza.objects.create(
            titolo='Sostituzione toner stampante multifunzione Piano 1',
            descrizione='La stampante di rete Kyocera del primo piano segnala toner nero esaurito.',
            stato='RISOLTO',
            priorita='BASSA',
            utente=admin_user,
        )
        TicketMessaggio.objects.create(
            ticket=t3,
            autore=admin_user,
            messaggio='Toner sostituito e pagina di prova stampata correttamente.',
        )

        # Creazione Comunicazioni Ufficiali
        Comunicazione.objects.create(
            titolo='Adozione nuovo Piano Integrato di Attività e Organizzazione (PIAO)',
            contenuto=(
                'Si informa tutto il personale che con Delibera di Giunta n. 48 è stato approvato il nuovo PIAO. '
                'La documentazione completa è consultabile nella intranet dell\'Ente. Si invitano i referenti di '
                'settore a prendere visione degli obiettivi operativi assegnati.'
            ),
            tipo_destinatario='TUTTI',
            autore=admin_user,
            importante=True,
        )

        Comunicazione.objects.create(
            titolo='Aggiornamento piattaforma PagoPA e riconciliazione flussi',
            contenuto=(
                'Si comunica che nella giornata di venerdì verrà effettuato il passaggio alla nuova versione '
                'del connettore telematico. Tutte le postazioni saranno aggiornate automaticamente al riavvio.'
            ),
            tipo_destinatario='TUTTI',
            autore=admin_user,
            importante=False,
        )

        Comunicazione.objects.create(
            titolo='Nuove disposizioni per la protocollazione delle fatture elettroniche',
            contenuto=(
                'Per il Settore Affari Generali e Protocollo: a partire dal prossimo mese i flussi SDI dovranno '
                'essere associati al fascicolo annuale automatizzato prima dello smistamento agli uffici competenti.'
            ),
            tipo_destinatario='SETTORE',
            settore_destinatario=settori['AGP'],
            autore=admin_user,
            importante=True,
        )

        Comunicazione.objects.create(
            titolo='Conferma abilitazione credenziali Amministratore di Sistema',
            contenuto=(
                'Gentile Marco Rossi, ti confermiamo il rinnovo annuale delle abilitazioni per il coordinamento '
                'del presidio tecnico e gestione ticket di assistenza dell\'Ente.'
            ),
            tipo_destinatario='UTENTE',
            utente_destinatario=admin_user,
            autore=admin_user,
            importante=False,
        )

        self.stdout.write(self.style.SUCCESS('Dati dimostrativi creati con successo!'))
