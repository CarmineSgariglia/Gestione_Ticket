import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { TicketAssistenza } from '../../models/api.models';

@Component({
  selector: 'app-assistenza',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="assistenza-header card">
        <div>
          <h1 class="classic-title">Assistenza Tecnica e Segnalazioni</h1>
          <p class="header-subtitle">
            Consulta lo stato dei tuoi ticket aperti, leggi le risposte del supporto o invia una nuova segnalazione con immagini.
          </p>
        </div>

        <button type="button" class="btn btn-primary" (click)="openNewTicketModal()">
          + Apri Nuovo Ticket
        </button>
      </header>

      <!-- Filtri Stato -->
      <div class="filter-bar">
        <button
          type="button"
          class="btn btn-sm"
          [class.btn-primary]="statusFilter() === 'ACTIVE'"
          (click)="statusFilter.set('ACTIVE')"
        >
          Ticket Aperti / In Elaborazione ({{ activeCount() }})
        </button>
        <button
          type="button"
          class="btn btn-sm"
          [class.btn-primary]="statusFilter() === 'ALL'"
          (click)="statusFilter.set('ALL')"
        >
          Tutti i Ticket ({{ tickets().length }})
        </button>
        <button
          type="button"
          class="btn btn-sm"
          [class.btn-primary]="statusFilter() === 'RESOLVED'"
          (click)="statusFilter.set('RESOLVED')"
        >
          Risolti / Chiusi
        </button>
      </div>

      <div class="tickets-layout">
        <!-- Elenco Ticket a sinistra -->
        <div class="tickets-list-col card">
          @if (filteredTickets().length === 0) {
            <p class="empty-hint">Nessun ticket trovato per il filtro selezionato.</p>
          }

          @for (t of filteredTickets(); track t.id) {
            <div
              class="ticket-row"
              [class.selected]="selectedTicket()?.id === t.id"
              (click)="selectTicket(t)"
            >
              <div class="ticket-row-top">
                <span class="ticket-id">#{{ t.id }}</span>
                <span
                  class="badge"
                  [class.badge-open]="t.stato === 'APERTO'"
                  [class.badge-progress]="t.stato === 'IN_ELABORAZIONE'"
                  [class.badge-done]="t.stato === 'RISOLTO' || t.stato === 'CHIUSO'"
                >
                  {{ t.stato_display }}
                </span>
              </div>
              <div class="ticket-row-title classic-title">{{ t.titolo }}</div>
              <div class="ticket-row-meta">
                <span>Priorità: {{ t.priorita_display }}</span>
                <span>{{ t.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              @if (t.immagini.length > 0 || t.messaggi.length > 0) {
                <div class="ticket-row-indicators">
                  @if (t.immagini.length > 0) {
                    <span>{{ t.immagini.length }} allegat{{ t.immagini.length === 1 ? 'o' : 'i' }}</span>
                  }
                  @if (t.messaggi.length > 0) {
                    <span>{{ t.messaggi.length }} messaggi{{ t.messaggi.length === 1 ? 'o' : '' }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Dettaglio Ticket selezionato a destra -->
        <div class="ticket-detail-col card">
          @if (!selectedTicket()) {
            <div class="empty-detail">
              Seleziona un ticket dall'elenco a sinistra per visualizzarne lo stato di avanzamento, le immagini allegate e i messaggi dell'amministrazione.
            </div>
          } @else {
            @if (selectedTicket(); as tk) {
              <div class="detail-top">
                <div>
                  <div class="detail-badges">
                    <span class="badge">Ticket #{{ tk.id }}</span>
                    <span
                      class="badge"
                      [class.badge-open]="tk.stato === 'APERTO'"
                      [class.badge-progress]="tk.stato === 'IN_ELABORAZIONE'"
                      [class.badge-done]="tk.stato === 'RISOLTO' || tk.stato === 'CHIUSO'"
                    >
                      Stato: {{ tk.stato_display }}
                    </span>
                    <span class="badge">Priorità {{ tk.priorita_display }}</span>
                  </div>
                  <h2 class="classic-title detail-title">{{ tk.titolo }}</h2>
                  <div class="detail-submeta">
                    Aperto da {{ tk.utente_nome }} ({{ tk.utente_settore }}) il {{ tk.created_at | date:'dd/MM/yyyy HH:mm' }}
                  </div>
                </div>
              </div>

              <!-- Barra di Stato Visuale -->
              <div class="status-stepper">
                <div class="step" [class.active]="tk.stato === 'APERTO'">1. Aperto</div>
                <div class="step" [class.active]="tk.stato === 'IN_ELABORAZIONE'">2. In Elaborazione</div>
                <div class="step" [class.active]="tk.stato === 'RISOLTO' || tk.stato === 'CHIUSO'">3. Risolto</div>
              </div>

              <div class="detail-section">
                <div class="section-label">Descrizione del problema</div>
                <p class="detail-description">{{ tk.descrizione }}</p>
              </div>

              <!-- Immagini Allegate -->
              @if (tk.immagini.length > 0) {
                <div class="detail-section">
                  <div class="section-label">Immagini allegate ({{ tk.immagini.length }})</div>
                  <div class="images-grid">
                    @for (img of tk.immagini; track img.id) {
                      <a
                        [href]="img.immagine_url"
                        target="_blank"
                        rel="noopener"
                        class="image-thumb-card"
                        title="Clicca per ingrandire l'immagine"
                      >
                        <img [src]="img.immagine_url" [alt]="img.didascalia || 'Immagine Ticket'" />
                      </a>
                    }
                  </div>
                </div>
              }

              <!-- Conversazione / Messaggi con l'Admin -->
              <div class="detail-section">
                <div class="section-label">Comunicazioni e Risposte sul Ticket</div>

                @if (tk.messaggi.length === 0) {
                  <p class="empty-hint">
                    Nessun messaggio ancora presente. L'amministratore aggiornerà qui lo stato della richiesta.
                  </p>
                }

                <div class="messages-thread">
                  @for (msg of tk.messaggi; track msg.id) {
                    <div class="msg-bubble" [class.msg-admin]="msg.autore_is_admin">
                      <div class="msg-header">
                        <strong>
                          {{ msg.autore_nome }}
                          @if (msg.autore_is_admin) {
                            <span class="badge" style="margin-left: 0.35rem;">Supporto Admin</span>
                          }
                        </strong>
                        <span class="msg-date">{{ msg.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      <p class="msg-body">{{ msg.messaggio }}</p>
                    </div>
                  }
                </div>

                <!-- Form aggiunta messaggio / nota sul ticket -->
                <form (ngSubmit)="sendReply()" class="reply-form">
                  <div class="form-group" style="margin-bottom: 0.5rem;">
                    <label class="form-label">Aggiungi un messaggio o chiarimento sul ticket</label>
                    <textarea
                      rows="2"
                      class="form-control"
                      [(ngModel)]="replyText"
                      name="replyText"
                      placeholder="Scrivi qui un aggiornamento..."
                    ></textarea>
                  </div>
                  <div style="display: flex; justify-content: flex-end;">
                    <button type="submit" class="btn btn-sm btn-primary" [disabled]="!replyText.trim()">
                      Invia Messaggio
                    </button>
                  </div>
                </form>
              </div>
            }
          }
        </div>
      </div>

      <!-- Modal Apertura Nuovo Ticket con Upload Immagini -->
      @if (showNewTicketModal()) {
        <div class="modal-backdrop" (click)="showNewTicketModal.set(false)">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <h2 class="classic-title" style="margin-bottom: 1rem;">Nuovo Ticket di Assistenza</h2>

            <form (ngSubmit)="submitNewTicket()">
              <div class="form-group">
                <label class="form-label">Titolo del problema *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="newTicket.titolo"
                  name="titolo"
                  placeholder="Es. Problema accesso software protocollo / Stampante di rete"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Priorità</label>
                <select class="form-control" [(ngModel)]="newTicket.priorita" name="priorita">
                  <option value="BASSA">Bassa</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta / Bloccante</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Descrizione dettagliata *</label>
                <textarea
                  rows="4"
                  class="form-control"
                  [(ngModel)]="newTicket.descrizione"
                  name="descrizione"
                  placeholder="Descrivi il problema riscontrato, il codice di errore o la postazione interessata..."
                  required
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Allega immagini per mostrare il problema (opzionale, anche più file)</label>
                <input
                  type="file"
                  class="form-control"
                  accept="image/*"
                  multiple
                  (change)="onFilesSelected($event)"
                />
                @if (selectedFiles.length > 0) {
                  <div class="selected-files-list">
                    {{ selectedFiles.length }} immagin{{ selectedFiles.length === 1 ? 'e selezionata' : 'i selezionate' }}:
                    @for (f of selectedFiles; track f.name) {
                      <span class="badge">{{ f.name }}</span>
                    }
                  </div>
                }
              </div>

              <div class="modal-actions">
                <button type="button" class="btn" (click)="showNewTicketModal.set(false)">Annulla</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                  {{ submitting() ? 'Invio in corso...' : 'Invia Segnalazione' }}
                </button>
              </div>
            </form>
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
    .assistenza-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .assistenza-header h1 {
      font-size: 1.5rem;
      margin-bottom: 0.2rem;
    }
    .header-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
    }
    .filter-bar {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .tickets-layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 1.25rem;
      align-items: start;
    }
    @media (max-width: 960px) {
      .tickets-layout {
        grid-template-columns: 1fr;
      }
    }
    .tickets-list-col {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      max-height: 75vh;
      overflow-y: auto;
    }
    .ticket-row {
      padding: 0.85rem;
      border: 1px solid var(--border-subtle);
      border-radius: 5px;
      background: var(--bg-page);
      cursor: pointer;
      transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .ticket-row:hover {
      background: var(--bg-hover);
    }
    .ticket-row.selected {
      border-color: var(--accent-primary);
      background: #ffffff;
    }
    .ticket-row-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
    }
    .ticket-id {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .ticket-row-title {
      font-size: 1rem;
      margin-bottom: 0.35rem;
    }
    .ticket-row-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      color: var(--text-secondary);
    }
    .ticket-row-indicators {
      display: flex;
      gap: 0.65rem;
      margin-top: 0.4rem;
      font-size: 11.5px;
      color: var(--text-muted);
    }
    .empty-detail {
      padding: 2.5rem 1rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 13.5px;
    }
    .detail-badges {
      display: flex;
      gap: 0.45rem;
      margin-bottom: 0.5rem;
    }
    .detail-title {
      font-size: 1.35rem;
      margin-bottom: 0.25rem;
    }
    .detail-submeta {
      font-size: 12.5px;
      color: var(--text-muted);
    }
    .status-stepper {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin: 1.15rem 0;
    }
    .step {
      padding: 0.45rem;
      text-align: center;
      font-size: 12px;
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      background: var(--bg-page);
      color: var(--text-muted);
    }
    .step.active {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
      font-weight: 500;
    }
    .detail-section {
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }
    .section-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      margin-bottom: 0.55rem;
      font-weight: 500;
    }
    .detail-description {
      font-size: 14px;
      white-space: pre-line;
      color: var(--text-primary);
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.75rem;
    }
    .image-thumb-card {
      display: block;
      border: 1px solid var(--border-subtle);
      border-radius: 5px;
      overflow: hidden;
      background: var(--bg-page);
    }
    .image-thumb-card img {
      width: 100%;
      height: 110px;
      object-fit: cover;
      display: block;
    }
    .messages-thread {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-bottom: 1rem;
    }
    .msg-bubble {
      padding: 0.75rem 0.9rem;
      border: 1px solid var(--border-subtle);
      border-radius: 5px;
      background: var(--bg-page);
    }
    .msg-bubble.msg-admin {
      background: #f8fafc;
      border-left: 3px solid var(--accent-primary);
    }
    .msg-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12.5px;
      margin-bottom: 0.3rem;
    }
    .msg-date {
      color: var(--text-muted);
      font-size: 11.5px;
    }
    .msg-body {
      font-size: 13.5px;
      white-space: pre-line;
    }
    .selected-files-list {
      margin-top: 0.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      font-size: 12px;
      color: var(--text-secondary);
      align-items: center;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.65rem;
      margin-top: 1.25rem;
      padding-top: 0.9rem;
      border-top: 1px solid var(--border-subtle);
    }
    .empty-hint {
      font-size: 13px;
      color: var(--text-muted);
    }
  `]
})
export class AssistenzaComponent implements OnInit {
  tickets = signal<TicketAssistenza[]>([]);
  statusFilter = signal<'ACTIVE' | 'ALL' | 'RESOLVED'>('ACTIVE');
  selectedTicket = signal<TicketAssistenza | null>(null);

  showNewTicketModal = signal(false);
  submitting = signal(false);

  newTicket = {
    titolo: '',
    descrizione: '',
    priorita: 'MEDIA',
  };
  selectedFiles: File[] = [];
  replyText = '';

  activeCount = computed(() =>
    this.tickets().filter((t) => t.stato === 'APERTO' || t.stato === 'IN_ELABORAZIONE').length
  );

  filteredTickets = computed(() => {
    const f = this.statusFilter();
    const list = this.tickets();
    if (f === 'ACTIVE') {
      return list.filter((t) => t.stato === 'APERTO' || t.stato === 'IN_ELABORAZIONE');
    }
    if (f === 'RESOLVED') {
      return list.filter((t) => t.stato === 'RISOLTO' || t.stato === 'CHIUSO');
    }
    return list;
  });

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.api.getTickets(false).subscribe({
      next: (data) => {
        this.tickets.set(data);
        const cur = this.selectedTicket();
        if (cur) {
          const updated = data.find((t) => t.id === cur.id);
          if (updated) this.selectedTicket.set(updated);
        } else if (data.length > 0) {
          this.selectedTicket.set(data[0]);
        }
      },
    });
  }

  selectTicket(t: TicketAssistenza): void {
    this.selectedTicket.set(t);
    this.replyText = '';
  }

  openNewTicketModal(): void {
    this.newTicket = { titolo: '', descrizione: '', priorita: 'MEDIA' };
    this.selectedFiles = [];
    this.showNewTicketModal.set(true);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  submitNewTicket(): void {
    if (!this.newTicket.titolo.trim() || !this.newTicket.descrizione.trim()) return;
    this.submitting.set(true);

    const formData = new FormData();
    formData.append('titolo', this.newTicket.titolo.trim());
    formData.append('descrizione', this.newTicket.descrizione.trim());
    formData.append('priorita', this.newTicket.priorita);
    for (const file of this.selectedFiles) {
      formData.append('immagini_files', file);
    }

    this.api.createTicket(formData).subscribe({
      next: (created) => {
        this.submitting.set(false);
        this.showNewTicketModal.set(false);
        this.statusFilter.set('ACTIVE');
        this.selectedTicket.set(created);
        this.loadTickets();
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }

  sendReply(): void {
    const tk = this.selectedTicket();
    if (!tk || !this.replyText.trim()) return;
    this.api.aggiungiMessaggioTicket(tk.id, this.replyText.trim()).subscribe({
      next: (updated) => {
        this.replyText = '';
        this.selectedTicket.set(updated);
        this.loadTickets();
      },
    });
  }
}
