import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import {
  Settore,
  User,
  TicketAssistenza,
  Comunicazione,
} from '../../models/api.models';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="admin-header card">
        <div>
          <h1 class="classic-title">Pannello di Amministrazione Ente</h1>
          <p class="header-subtitle">
            Gestione centralizzata di utenti, settori, stato ticket di assistenza e invio comunicazioni.
          </p>
        </div>

        <a href="/admin/" target="_blank" rel="noopener" class="btn">
          Apri Django Admin Nativo (/admin/) ↗
        </a>
      </header>

      <!-- Navigazione Sezioni Admin -->
      <div class="admin-tabs">
        <button
          type="button"
          class="btn"
          [class.btn-primary]="activeTab() === 'TICKETS'"
          (click)="activeTab.set('TICKETS')"
        >
          1. Gestione Ticket Assistenza ({{ allTickets().length }})
        </button>
        <button
          type="button"
          class="btn"
          [class.btn-primary]="activeTab() === 'COMUNICAZIONI'"
          (click)="activeTab.set('COMUNICAZIONI')"
        >
          2. Invio Comunicazioni ({{ allComunicazioni().length }})
        </button>
        <button
          type="button"
          class="btn"
          [class.btn-primary]="activeTab() === 'UTENTI'"
          (click)="activeTab.set('UTENTI')"
        >
          3. Anagrafica Utenti e Settori ({{ utenti().length }})
        </button>
      </div>

      @if (feedbackMessage()) {
        <div class="feedback-banner">
          {{ feedbackMessage() }}
        </div>
      }

      <!-- TAB 1: GESTIONE TICKET ASSISTENZA -->
      @if (activeTab() === 'TICKETS') {
        <div class="admin-tickets-grid">
          <div class="card tickets-table-card">
            <h2 class="classic-title section-title">Tutti i Ticket dell'Ente</h2>

            <div class="tickets-list">
              @for (tk of allTickets(); track tk.id) {
                <div
                  class="admin-tk-row"
                  [class.selected]="selectedAdminTicket()?.id === tk.id"
                  (click)="selectAdminTicket(tk)"
                >
                  <div class="admin-tk-top">
                    <strong>#{{ tk.id }} — {{ tk.titolo }}</strong>
                    <span
                      class="badge"
                      [class.badge-open]="tk.stato === 'APERTO'"
                      [class.badge-progress]="tk.stato === 'IN_ELABORAZIONE'"
                      [class.badge-done]="tk.stato === 'RISOLTO' || tk.stato === 'CHIUSO'"
                    >
                      {{ tk.stato_display }}
                    </span>
                  </div>
                  <div class="admin-tk-sub">
                    Richiedente: {{ tk.utente_nome }} ({{ tk.utente_settore }}) · Tel: {{ tk.utente_telefono || 'N/D' }}
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="card ticket-manage-card">
            @if (!selectedAdminTicket()) {
              <p class="empty-hint">Seleziona un ticket per aggiornare lo stato o inviare un messaggio all'utente.</p>
            } @else {
              @if (selectedAdminTicket(); as tk) {
                <h2 class="classic-title section-title">Gestione Ticket #{{ tk.id }}</h2>
                <div class="tk-summary-box">
                  <div><strong>Titolo:</strong> {{ tk.titolo }}</div>
                  <div><strong>Utente:</strong> {{ tk.utente_nome }} ({{ tk.utente_email }} · Tel. {{ tk.utente_telefono }})</div>
                  <div><strong>Settore:</strong> {{ tk.utente_settore }}</div>
                  <div style="margin-top: 0.45rem;"><strong>Descrizione:</strong> {{ tk.descrizione }}</div>
                </div>

                @if (tk.immagini.length > 0) {
                  <div style="margin: 0.85rem 0;">
                    <div class="form-label">Immagini allegate dall'utente:</div>
                    <div class="admin-img-row">
                      @for (img of tk.immagini; track img.id) {
                        <a [href]="img.immagine_url" target="_blank" rel="noopener">
                          <img [src]="img.immagine_url" alt="Allegato" />
                        </a>
                      }
                    </div>
                  </div>
                }

                <form (ngSubmit)="updateTicketAdmin()" style="margin-top: 1rem;">
                  <div class="form-group">
                    <label class="form-label">Aggiorna Stato di Elaborazione / Risoluzione</label>
                    <select class="form-control" [(ngModel)]="adminTicketStato" name="stato">
                      <option value="APERTO">Aperto</option>
                      <option value="IN_ELABORAZIONE">In Elaborazione</option>
                      <option value="RISOLTO">Risolto</option>
                      <option value="CHIUSO">Chiuso</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Lascia un messaggio per l'utente sul ticket</label>
                    <textarea
                      rows="3"
                      class="form-control"
                      [(ngModel)]="adminTicketMessage"
                      name="messaggio"
                      placeholder="Scrivi qui la risposta tecnica o l'esito della risoluzione..."
                    ></textarea>
                  </div>

                  <button type="submit" class="btn btn-primary">
                    Salva Stato e Invia Messaggio all'Utente
                  </button>
                </form>

                @if (tk.messaggi.length > 0) {
                  <div style="margin-top: 1.25rem; padding-top: 0.85rem; border-top: 1px solid var(--border-subtle);">
                    <div class="form-label" style="margin-bottom: 0.5rem;">Storico Messaggi sul Ticket:</div>
                    @for (m of tk.messaggi; track m.id) {
                      <div class="mini-msg">
                        <strong>{{ m.autore_nome }}</strong> ({{ m.created_at | date:'dd/MM/yyyy HH:mm' }}):
                        <div>{{ m.messaggio }}</div>
                      </div>
                    }
                  </div>
                }
              }
            }
          </div>
        </div>
      }

      <!-- TAB 2: INVIO COMUNICAZIONI -->
      @if (activeTab() === 'COMUNICAZIONI') {
        <div class="admin-comm-grid">
          <div class="card">
            <h2 class="classic-title section-title">Invia Nuova Comunicazione</h2>
            <p class="section-desc">
              Destina la comunicazione a tutti gli utenti presenti nel DB, a uno specifico settore o a una singola persona.
            </p>

            <form (ngSubmit)="sendComunicazione()">
              <div class="form-group">
                <label class="form-label">Destinatari della Comunicazione *</label>
                <select
                  class="form-control"
                  [(ngModel)]="commForm.tipo_destinatario"
                  name="tipo_destinatario"
                  required
                >
                  <option value="TUTTI">Tutti gli utenti presenti nel DB (Circolare Ente)</option>
                  <option value="SETTORE">Uno specifico Settore dell'Ente</option>
                  <option value="UTENTE">Una singola persona (Utente specifico)</option>
                </select>
              </div>

              @if (commForm.tipo_destinatario === 'SETTORE') {
                <div class="form-group">
                  <label class="form-label">Seleziona il Settore destinatario *</label>
                  <select
                    class="form-control"
                    [(ngModel)]="commForm.settore_destinatario"
                    name="settore_destinatario"
                    required
                  >
                    @for (s of settori(); track s.id) {
                      <option [ngValue]="s.id">{{ s.nome }} ({{ s.codice }})</option>
                    }
                  </select>
                </div>
              }

              @if (commForm.tipo_destinatario === 'UTENTE') {
                <div class="form-group">
                  <label class="form-label">Seleziona l'Utente destinatario *</label>
                  <select
                    class="form-control"
                    [(ngModel)]="commForm.utente_destinatario"
                    name="utente_destinatario"
                    required
                  >
                    @for (u of utenti(); track u.id) {
                      <option [ngValue]="u.id">
                        {{ u.first_name }} {{ u.last_name }} — {{ u.email }} ({{ u.settore_nome }})
                      </option>
                    }
                  </select>
                </div>
              }

              <div class="form-group">
                <label class="form-label">Oggetto / Titolo *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="commForm.titolo"
                  name="titolo"
                  placeholder="Oggetto della comunicazione ufficiale..."
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Testo della Comunicazione *</label>
                <textarea
                  rows="4"
                  class="form-control"
                  [(ngModel)]="commForm.contenuto"
                  name="contenuto"
                  placeholder="Scrivi il contenuto integrale..."
                  required
                ></textarea>
              </div>

              <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 13.5px;">
                  <input type="checkbox" [(ngModel)]="commForm.importante" name="importante" />
                  Contrassegna come comunicazione importante / in evidenza
                </label>
              </div>

              <button type="submit" class="btn btn-primary">Pubblica e Invia Comunicazione</button>
            </form>
          </div>

          <div class="card">
            <h2 class="classic-title section-title">Storico Comunicazioni Inviate</h2>
            <div class="sent-comm-list">
              @for (c of allComunicazioni(); track c.id) {
                <div class="sent-comm-item">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                    <div>
                      <span class="badge">
                        @if (c.tipo_destinatario === 'TUTTI') {
                          Tutti
                        } @else if (c.tipo_destinatario === 'SETTORE') {
                          Settore: {{ c.settore_destinatario_nome }}
                        } @else {
                          Utente: {{ c.utente_destinatario_nome }}
                        }
                      </span>
                      <strong style="display: block; margin-top: 0.3rem;">{{ c.titolo }}</strong>
                    </div>
                    <button
                      type="button"
                      class="btn btn-sm btn-danger-outline"
                      (click)="removeComunicazione(c.id)"
                    >
                      Elimina
                    </button>
                  </div>
                  <p style="font-size: 12.5px; color: var(--text-secondary); margin-top: 0.3rem;">
                    {{ c.contenuto }}
                  </p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: REGISTRAZIONE UTENTI E SETTORI -->
      @if (activeTab() === 'UTENTI') {
        <div class="admin-users-grid">
          <div class="card">
            <h2 class="classic-title section-title">Registra Nuovo Utente nel DB</h2>
            <p class="section-desc">
              Gli utenti registrati qui possono accedere con email e password al gestionale.
            </p>

            <form (ngSubmit)="registerNewUser()">
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Nome *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="userForm.first_name"
                    name="first_name"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Cognome *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="userForm.last_name"
                    name="last_name"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Email istituzionale *</label>
                <input
                  type="email"
                  class="form-control"
                  [(ngModel)]="userForm.email"
                  name="email"
                  placeholder="nome.cognome@ente.gov.it"
                  required
                />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Numero di Telefono *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="userForm.telefono"
                    name="telefono"
                    placeholder="Es. 06 5550 210"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Settore di Appartenenza *</label>
                  <select class="form-control" [(ngModel)]="userForm.settore" name="settore" required>
                    @for (s of settori(); track s.id) {
                      <option [ngValue]="s.id">{{ s.nome }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Password Iniziale *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="userForm.password"
                    name="password"
                    required
                  />
                </div>
                <div class="form-group" style="justify-content: flex-end; padding-bottom: 0.4rem;">
                  <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 13.5px;">
                    <input type="checkbox" [(ngModel)]="userForm.is_staff" name="is_staff" />
                    Abilita privilegi Amministratore
                  </label>
                </div>
              </div>

              <button type="submit" class="btn btn-primary">Registra Utente nel Database</button>
            </form>

            <!-- Aggiunta Rapida Nuovo Settore -->
            <div style="margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--border-subtle);">
              <h3 class="classic-title" style="font-size: 1.05rem; margin-bottom: 0.65rem;">
                Aggiungi Nuovo Settore dell'Ente
              </h3>
              <form (ngSubmit)="createSettore()" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <input
                  type="text"
                  class="form-control"
                  style="flex: 2;"
                  [(ngModel)]="newSettoreNome"
                  name="newSettoreNome"
                  placeholder="Nome settore (es. Polizia Locale)"
                  required
                />
                <input
                  type="text"
                  class="form-control"
                  style="flex: 1;"
                  [(ngModel)]="newSettoreCodice"
                  name="newSettoreCodice"
                  placeholder="Codice (es. PL)"
                />
                <button type="submit" class="btn">+ Settore</button>
              </form>
            </div>
          </div>

          <div class="card">
            <h2 class="classic-title section-title">Utenti Registrati ({{ utenti().length }})</h2>
            <div class="users-table-wrap">
              <table class="minimal-table">
                <thead>
                  <tr>
                    <th>Nome e Cognome</th>
                    <th>Email / Telefono</th>
                    <th>Settore</th>
                    <th>Ruolo</th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of utenti(); track u.id) {
                    <tr>
                      <td><strong>{{ u.first_name }} {{ u.last_name }}</strong></td>
                      <td>
                        <div>{{ u.email }}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">{{ u.telefono || '—' }}</div>
                      </td>
                      <td><span class="badge">{{ u.settore_nome }}</span></td>
                      <td>
                        @if (u.is_staff) {
                          <span class="badge badge-progress">Admin</span>
                        } @else {
                          <span class="badge">Utente</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }
    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .admin-header h1 {
      font-size: 1.5rem;
      margin-bottom: 0.2rem;
    }
    .header-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
    }
    .admin-tabs {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .feedback-banner {
      padding: 0.7rem 1rem;
      background: var(--status-done-bg);
      color: var(--status-done-text);
      border: 1px solid #a7f3d0;
      border-radius: 5px;
      font-size: 13.5px;
    }
    .section-title {
      font-size: 1.2rem;
      margin-bottom: 0.45rem;
    }
    .section-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }
    .admin-tickets-grid, .admin-comm-grid, .admin-users-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      align-items: start;
    }
    @media (max-width: 980px) {
      .admin-tickets-grid, .admin-comm-grid, .admin-users-grid {
        grid-template-columns: 1fr;
      }
    }
    .tickets-list, .sent-comm-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-height: 70vh;
      overflow-y: auto;
    }
    .admin-tk-row, .sent-comm-item {
      padding: 0.8rem;
      border: 1px solid var(--border-subtle);
      border-radius: 5px;
      background: var(--bg-page);
      cursor: pointer;
    }
    .admin-tk-row.selected {
      border-color: var(--accent-primary);
      background: #ffffff;
    }
    .admin-tk-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .admin-tk-sub {
      font-size: 12px;
      color: var(--text-secondary);
    }
    .tk-summary-box {
      padding: 0.85rem;
      background: var(--bg-page);
      border: 1px solid var(--border-subtle);
      border-radius: 5px;
      font-size: 13.5px;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .admin-img-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.35rem;
    }
    .admin-img-row img {
      width: 90px;
      height: 65px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid var(--border-subtle);
    }
    .mini-msg {
      padding: 0.55rem;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 12.5px;
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .users-table-wrap {
      overflow-x: auto;
    }
    .minimal-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .minimal-table th, .minimal-table td {
      text-align: left;
      padding: 0.65rem 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .minimal-table th {
      font-weight: 500;
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
    }
    .empty-hint {
      color: var(--text-muted);
      font-size: 13.5px;
    }
  `]
})
export class AdminPanelComponent implements OnInit {
  activeTab = signal<'TICKETS' | 'COMUNICAZIONI' | 'UTENTI'>('TICKETS');
  feedbackMessage = signal('');

  allTickets = signal<TicketAssistenza[]>([]);
  selectedAdminTicket = signal<TicketAssistenza | null>(null);
  adminTicketStato = 'IN_ELABORAZIONE';
  adminTicketMessage = '';

  allComunicazioni = signal<Comunicazione[]>([]);
  settori = signal<Settore[]>([]);
  utenti = signal<User[]>([]);

  commForm: {
    titolo: string;
    contenuto: string;
    tipo_destinatario: 'TUTTI' | 'SETTORE' | 'UTENTE';
    settore_destinatario: number | null;
    utente_destinatario: number | null;
    importante: boolean;
  } = {
    titolo: '',
    contenuto: '',
    tipo_destinatario: 'TUTTI',
    settore_destinatario: null,
    utente_destinatario: null,
    importante: false,
  };

  userForm = {
    first_name: '',
    last_name: '',
    email: '',
    telefono: '',
    settore: null as number | null,
    password: 'Utente2026!',
    is_staff: false,
  };

  newSettoreNome = '';
  newSettoreCodice = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadAllAdminData();
  }

  loadAllAdminData(): void {
    this.api.getTickets(true).subscribe((res) => {
      this.allTickets.set(res);
      if (!this.selectedAdminTicket() && res.length > 0) {
        this.selectAdminTicket(res[0]);
      }
    });
    this.api.getComunicazioni(true).subscribe((res) => this.allComunicazioni.set(res));
    this.api.getSettori().subscribe((res) => {
      this.settori.set(res);
      if (res.length > 0 && !this.userForm.settore) {
        this.userForm.settore = res[0].id;
        this.commForm.settore_destinatario = res[0].id;
      }
    });
    this.api.getUtenti().subscribe((res) => {
      this.utenti.set(res);
      if (res.length > 0 && !this.commForm.utente_destinatario) {
        this.commForm.utente_destinatario = res[0].id;
      }
    });
  }

  private notify(msg: string): void {
    this.feedbackMessage.set(msg);
    setTimeout(() => this.feedbackMessage.set(''), 4000);
  }

  selectAdminTicket(tk: TicketAssistenza): void {
    this.selectedAdminTicket.set(tk);
    this.adminTicketStato = tk.stato;
    this.adminTicketMessage = '';
  }

  updateTicketAdmin(): void {
    const tk = this.selectedAdminTicket();
    if (!tk) return;
    this.api.aggiornaStatoTicket(tk.id, this.adminTicketStato, this.adminTicketMessage).subscribe({
      next: (updated) => {
        this.selectedAdminTicket.set(updated);
        this.adminTicketMessage = '';
        this.notify(`Ticket #${tk.id} aggiornato con successo.`);
        this.api.getTickets(true).subscribe((res) => this.allTickets.set(res));
      },
    });
  }

  sendComunicazione(): void {
    if (!this.commForm.titolo.trim() || !this.commForm.contenuto.trim()) return;
    const payload: Partial<Comunicazione> = {
      titolo: this.commForm.titolo.trim(),
      contenuto: this.commForm.contenuto.trim(),
      tipo_destinatario: this.commForm.tipo_destinatario,
      importante: this.commForm.importante,
      settore_destinatario:
        this.commForm.tipo_destinatario === 'SETTORE' ? this.commForm.settore_destinatario : null,
      utente_destinatario:
        this.commForm.tipo_destinatario === 'UTENTE' ? this.commForm.utente_destinatario : null,
    };

    this.api.createComunicazione(payload).subscribe({
      next: () => {
        this.commForm.titolo = '';
        this.commForm.contenuto = '';
        this.commForm.importante = false;
        this.notify('Comunicazione inviata con successo.');
        this.api.getComunicazioni(true).subscribe((res) => this.allComunicazioni.set(res));
      },
    });
  }

  removeComunicazione(id: number): void {
    this.api.deleteComunicazione(id).subscribe({
      next: () => {
        this.api.getComunicazioni(true).subscribe((res) => this.allComunicazioni.set(res));
      },
    });
  }

  registerNewUser(): void {
    if (!this.userForm.email.trim() || !this.userForm.first_name.trim() || !this.userForm.last_name.trim()) {
      return;
    }
    this.api.createUtente({
      first_name: this.userForm.first_name.trim(),
      last_name: this.userForm.last_name.trim(),
      email: this.userForm.email.trim(),
      telefono: this.userForm.telefono.trim(),
      settore: this.userForm.settore,
      password: this.userForm.password || 'Utente2026!',
      is_staff: this.userForm.is_staff,
    }).subscribe({
      next: (created) => {
        this.notify(`Utente ${created.first_name} ${created.last_name} registrato nel database.`);
        this.userForm.first_name = '';
        this.userForm.last_name = '';
        this.userForm.email = '';
        this.userForm.telefono = '';
        this.userForm.is_staff = false;
        this.api.getUtenti().subscribe((res) => this.utenti.set(res));
      },
    });
  }

  createSettore(): void {
    if (!this.newSettoreNome.trim()) return;
    this.api.createSettore({
      nome: this.newSettoreNome.trim(),
      codice: this.newSettoreCodice.trim(),
    }).subscribe({
      next: () => {
        this.newSettoreNome = '';
        this.newSettoreCodice = '';
        this.notify('Nuovo settore aggiunto.');
        this.api.getSettori().subscribe((res) => this.settori.set(res));
      },
    });
  }
}
