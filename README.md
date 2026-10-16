# Gestionale Smart — Ente Pubblico

Applicazione web full-stack per la gestione di **Calendario**, **Lavagna To-Do (Kanban)**, **Ticket di Assistenza (con allegati fotografici)** e **Comunicazioni Istituzionali** per un Ente Pubblico.

## Architettura e Infrastruttura Docker

L'intera infrastruttura è orchestrata tramite **Docker Compose** su una rete interna dedicata (`gestionale_net`) composta da 4 container separati:

1. **`nginx` (`gestionale_reverse_proxy`)**: Reverse Proxy esposto verso l'esterno (`http://localhost` / `http://localhost:8080`) che smista le richieste verso il frontend Angular e il backend Django/API/Media.
2. **`frontend` (`gestionale_frontend`)**: Applicazione SPA **Angular 19 + TypeScript** compilata e servita internamente sulla porta `4200`.
3. **`backend` (`gestionale_backend`)**: Backend **Django 5 + Django REST Framework + SimpleJWT + Gunicorn** sulla porta interna `8000`.
4. **`db` (`gestionale_db`)**: Database relazionale **PostgreSQL 16** sulla porta interna `5432` con volume persistente.

---

## Avvio Rapido con Docker

Dalla radice del progetto eseguire:

```bash
docker compose up --build -d
```

Al primo avvio il container `backend` esegue automaticamente:
- Le migrazioni del database PostgreSQL (`makemigrations` + `migrate`)
- La raccolta dei file statici (`collectstatic`)
- Il popolamento automatico dei dati dimostrativi (`python manage.py seed_data`)

### Punti di Accesso
- **Applicazione Web (Reverse Proxy Nginx)**: `http://localhost:8080` (oppure `http://localhost`)
- **Pannello Admin Integrato Angular**: `http://localhost:8080/admin-panel`
- **Pannello Django Admin Nativo**: `http://localhost:8080/admin/`

---

## Credenziali Pre-Registrate di Default

| Ruolo | Nome e Cognome | Settore | Email / Username | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Amministratore** | Marco Rossi | Sistemi Informativi (CED) | `admin@ente.gov.it` | `Admin2026!` |
| **Utente Dipendente** | Laura Bianchi | Affari Generali e Protocollo | `laura.bianchi@ente.gov.it` | `Utente2026!` |
| **Utente Dipendente** | Giuseppe Verdi | Ufficio Tecnico e Lavori Pubblici | `giuseppe.verdi@ente.gov.it` | `Utente2026!` |
| **Utente Dipendente** | Elena Ferrari | Servizi Demografici | `elena.ferrari@ente.gov.it` | `Utente2026!` |

---

## Funzionalità Principali

- **Autenticazione e Profilo Ente**: Accesso riservato agli utenti preventivamente registrati nel DB con *Nome, Cognome, Email, Numero di Telefono e Settore di Appartenenza*.
- **Menu Laterale e Home (Dashboard)**: Menu laterale a sinistra con accesso a *Home, Calendario, To-Do, Assistenza, Comunicazioni* e *Pannello Admin*. La vista Home mostra una mini-view interattiva del calendario, il conteggio dei To-Do da completare, il numero di ticket aperti e le ultime 3 comunicazioni.
- **Calendario (Stile Google Calendar)**: Griglia mensile e vista agenda con creazione di eventi (personali, di settore o d'ente) e visualizzazione automatica delle **scadenze dei To-Do** con le rispettive descrizioni.
- **To-Do (Stile Kanban / Canva Board)**: Suddivisione in liste personalizzabili con creazione, spunta di completamento, eliminazione, impostazione scadenza, drag & drop tra liste e **stampa della singola lista o dell'intera schermata**.
- **Assistenza (Helpdesk Ticket)**: Apertura ticket con titolo, descrizione, priorità e caricamento di una o più immagini; monitoraggio stato (`Aperto`, `In Elaborazione`, `Risolto`, `Chiuso`) e scambio messaggi con l'amministratore.
- **Comunicazioni Mirate**: Invio da parte dell'Admin e ricezione lato utente di comunicazioni destinate a *Tutti gli utenti del DB*, a uno *Specifico Settore* o a una *Singola Persona*.