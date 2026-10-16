import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { EventoCalendario, TodoItem } from '../../models/api.models';

interface CalendarDayCell {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: EventoCalendario[];
  todos: TodoItem[];
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Google Calendar Style Top Toolbar -->
      <header class="cal-toolbar card">
        <div class="cal-toolbar-left">
          <h1 class="classic-title">Calendario</h1>
          <button type="button" class="btn btn-sm" (click)="goToToday()">Oggi</button>
          <div class="cal-nav-arrows">
            <button type="button" class="btn btn-sm" (click)="changeMonth(-1)">‹</button>
            <button type="button" class="btn btn-sm" (click)="changeMonth(1)">›</button>
          </div>
          <span class="cal-current-period classic-title">{{ monthYearLabel() }}</span>
        </div>

        <div class="cal-toolbar-right">
          <div class="view-switcher">
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="viewMode() === 'MONTH'"
              (click)="viewMode.set('MONTH')"
            >
              Mese
            </button>
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="viewMode() === 'AGENDA'"
              (click)="viewMode.set('AGENDA')"
            >
              Agenda e Descrizioni
            </button>
          </div>
          <button type="button" class="btn btn-primary btn-sm" (click)="openNewEventModal()">
            + Nuovo Evento
          </button>
        </div>
      </header>

      <!-- Legenda minimalista -->
      <div class="cal-legend">
        <span class="legend-item"><span class="pill-indicator pill-ente"></span> Evento Ente / Condiviso</span>
        <span class="legend-item"><span class="pill-indicator pill-personal"></span> Evento Personale</span>
        <span class="legend-item"><span class="pill-indicator pill-todo"></span> Scadenza To-Do (con descrizione)</span>
      </div>

      @if (viewMode() === 'MONTH') {
        <!-- Google Calendar Monthly Grid -->
        <div class="gcal-board card">
          <div class="gcal-weekdays">
            @for (wd of weekDays; track wd) {
              <div class="gcal-weekday">{{ wd }}</div>
            }
          </div>

          <div class="gcal-grid">
            @for (cell of calendarCells(); track cell.dateKey) {
              <div
                class="gcal-cell"
                [class.other-month]="!cell.isCurrentMonth"
                [class.today-cell]="cell.isToday"
                (click)="openNewEventOnDate(cell.date, $event)"
              >
                <div class="gcal-cell-header">
                  <span class="gcal-day-number" [class.today-badge]="cell.isToday">
                    {{ cell.dayNumber }}
                  </span>
                </div>

                <div class="gcal-cell-items">
                  <!-- Eventi Calendario -->
                  @for (ev of cell.events; track ev.id) {
                    <div
                      class="gcal-pill"
                      [class.pill-ente]="ev.visibilita !== 'PERSONALE'"
                      [class.pill-personal]="ev.visibilita === 'PERSONALE'"
                      (click)="inspectEvent(ev, $event)"
                      [title]="ev.descrizione || ev.titolo"
                    >
                      <span class="pill-time">
                        {{ ev.tutto_il_giorno ? 'Tutto il gg' : (ev.data_inizio | date:'HH:mm') }}
                      </span>
                      <span class="pill-title">{{ ev.titolo }}</span>
                    </div>
                  }

                  <!-- Scadenze dei To-Do con descrizione -->
                  @for (td of cell.todos; track td.id) {
                    <div
                      class="gcal-pill pill-todo"
                      [class.pill-todo-done]="td.completato"
                      (click)="inspectTodo(td, $event)"
                      [title]="td.descrizione || td.titolo"
                    >
                      <div class="pill-todo-top">
                        <span class="pill-time">Scadenza To-Do</span>
                        <span class="pill-title">{{ td.titolo }}</span>
                      </div>
                      @if (td.descrizione) {
                        <div class="pill-todo-desc">{{ td.descrizione }}</div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- Vista Agenda Dettagliata con Descrizioni Complete -->
        <div class="card agenda-list-card">
          <h2 class="classic-title" style="margin-bottom: 1rem; font-size: 1.2rem;">
            Elenco Cronologico Eventi e Scadenze To-Do
          </h2>

          <div class="agenda-section">
            <h3 class="classic-title agenda-sub">Scadenze To-Do Impostate</h3>
            @if (todoScadenze().length === 0) {
              <p class="empty-hint">Nessun To-Do con scadenza impostata.</p>
            }
            @for (td of todoScadenze(); track td.id) {
              <div class="agenda-row" (click)="inspectTodo(td, $event)">
                <div class="agenda-date">{{ td.scadenza | date:'dd/MM/yyyy HH:mm' }}</div>
                <div class="agenda-content">
                  <div class="agenda-row-title">
                    <span class="badge badge-progress">To-Do · {{ td.lista_nome }}</span>
                    <strong [style.text-decoration]="td.completato ? 'line-through' : 'none'">
                      {{ td.titolo }}
                    </strong>
                  </div>
                  <p class="agenda-row-desc">
                    {{ td.descrizione || 'Nessuna descrizione aggiuntiva.' }}
                  </p>
                </div>
              </div>
            }
          </div>

          <div class="agenda-section" style="margin-top: 1.5rem;">
            <h3 class="classic-title agenda-sub">Eventi in Calendario</h3>
            @if (eventi().length === 0) {
              <p class="empty-hint">Nessun evento in calendario.</p>
            }
            @for (ev of eventi(); track ev.id) {
              <div class="agenda-row" (click)="inspectEvent(ev, $event)">
                <div class="agenda-date">{{ ev.data_inizio | date:'dd/MM/yyyy HH:mm' }}</div>
                <div class="agenda-content">
                  <div class="agenda-row-title">
                    <span class="badge">{{ ev.visibilita }}</span>
                    <strong>{{ ev.titolo }}</strong>
                  </div>
                  <p class="agenda-row-desc">
                    {{ ev.descrizione || 'Nessuna descrizione.' }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Modal Creazione Nuovo Evento -->
      @if (showNewModal()) {
        <div class="modal-backdrop" (click)="showNewModal.set(false)">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <h2 class="classic-title" style="margin-bottom: 1rem;">Nuovo Evento in Calendario</h2>

            <form (ngSubmit)="saveNewEvent()">
              <div class="form-group">
                <label class="form-label">Titolo dell'evento *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="newEvent.titolo"
                  name="titolo"
                  placeholder="Es. Riunione di Settore / Scadenza Bando"
                  required
                />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Data e Ora Inizio *</label>
                  <input
                    type="datetime-local"
                    class="form-control"
                    [(ngModel)]="newEvent.data_inizio"
                    name="data_inizio"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Data e Ora Fine *</label>
                  <input
                    type="datetime-local"
                    class="form-control"
                    [(ngModel)]="newEvent.data_fine"
                    name="data_fine"
                    required
                  />
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Visibilità Evento</label>
                  <select class="form-control" [(ngModel)]="newEvent.visibilita" name="visibilita">
                    <option value="PERSONALE">Personale (solo io)</option>
                    <option value="SETTORE">Condiviso con il mio Settore</option>
                    <option value="ENTE">Pubblico per tutto l'Ente</option>
                  </select>
                </div>
                <div class="form-group" style="justify-content: flex-end; padding-bottom: 0.4rem;">
                  <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 13.5px;">
                    <input
                      type="checkbox"
                      [(ngModel)]="newEvent.tutto_il_giorno"
                      name="tutto_il_giorno"
                    />
                    Evento giornaliero (tutto il giorno)
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Descrizione</label>
                <textarea
                  rows="3"
                  class="form-control"
                  [(ngModel)]="newEvent.descrizione"
                  name="descrizione"
                  placeholder="Dettagli, ordine del giorno o note operative..."
                ></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn" (click)="showNewModal.set(false)">Annulla</button>
                <button type="submit" class="btn btn-primary">Salva Evento</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal Dettaglio Evento o Scadenza To-Do -->
      @if (selectedEvent() || selectedTodo()) {
        <div class="modal-backdrop" (click)="closeDetailModal()">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            @if (selectedEvent(); as ev) {
              <div class="detail-header">
                <span class="badge">Evento · {{ ev.visibilita }}</span>
                <h2 class="classic-title" style="margin-top: 0.4rem;">{{ ev.titolo }}</h2>
              </div>
              <div class="detail-meta">
                <div><strong>Inizio:</strong> {{ ev.data_inizio | date:'dd/MM/yyyy HH:mm' }}</div>
                <div><strong>Fine:</strong> {{ ev.data_fine | date:'dd/MM/yyyy HH:mm' }}</div>
                @if (ev.creato_da_nome) {
                  <div><strong>Organizzatore:</strong> {{ ev.creato_da_nome }}</div>
                }
              </div>
              <div class="detail-desc-box">
                <div class="form-label">Descrizione:</div>
                <p>{{ ev.descrizione || 'Nessuna descrizione specificata.' }}</p>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-danger-outline" (click)="removeEvent(ev.id)">
                  Elimina Evento
                </button>
                <button type="button" class="btn btn-primary" (click)="closeDetailModal()">Chiudi</button>
              </div>
            }

            @if (selectedTodo(); as td) {
              <div class="detail-header">
                <span class="badge badge-progress">Scadenza To-Do · Lista: {{ td.lista_nome }}</span>
                <h2 class="classic-title" style="margin-top: 0.4rem;">{{ td.titolo }}</h2>
              </div>
              <div class="detail-meta">
                <div><strong>Scadenza:</strong> {{ td.scadenza | date:'dd/MM/yyyy HH:mm' }}</div>
                <div><strong>Stato:</strong> {{ td.completato ? 'Completato ✓' : 'Da completare' }}</div>
              </div>
              <div class="detail-desc-box">
                <div class="form-label">Descrizione del To-Do:</div>
                <p>{{ td.descrizione || 'Nessuna descrizione inserita per questo To-Do.' }}</p>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn" (click)="toggleTodoFromCalendar(td)">
                  {{ td.completato ? 'Segna come Da Fare' : 'Spunta come Completato ✓' }}
                </button>
                <button type="button" class="btn btn-primary" (click)="closeDetailModal()">Chiudi</button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .cal-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 0.9rem 1.25rem;
    }
    .cal-toolbar-left, .cal-toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .cal-toolbar-left h1 {
      font-size: 1.4rem;
      margin-right: 0.35rem;
    }
    .cal-nav-arrows {
      display: flex;
      gap: 0.25rem;
    }
    .cal-current-period {
      font-size: 1.15rem;
      text-transform: capitalize;
      margin-left: 0.25rem;
    }
    .view-switcher {
      display: flex;
      gap: 0.25rem;
    }
    .cal-legend {
      display: flex;
      gap: 1.25rem;
      flex-wrap: wrap;
      font-size: 12.5px;
      color: var(--text-secondary);
      padding: 0 0.25rem;
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .pill-indicator {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      display: inline-block;
    }
    .gcal-board {
      padding: 0;
      overflow: hidden;
    }
    .gcal-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-page);
    }
    .gcal-weekday {
      padding: 0.55rem;
      text-align: center;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .gcal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }
    .gcal-cell {
      min-height: 122px;
      border-right: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.35rem 0.4rem;
      cursor: pointer;
      transition: background-color 0.12s ease;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .gcal-cell:nth-child(7n) {
      border-right: none;
    }
    .gcal-cell:hover {
      background: #fafafa;
    }
    .gcal-cell.other-month {
      background: #fbfbfc;
      color: #9ca3af;
    }
    .gcal-cell-header {
      display: flex;
      justify-content: flex-end;
    }
    .gcal-day-number {
      font-size: 12px;
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .today-badge {
      background: var(--accent-primary);
      color: #ffffff;
      font-weight: 600;
    }
    .gcal-cell-items {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .gcal-pill {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11.5px;
      line-height: 1.3;
      cursor: pointer;
      border: 1px solid transparent;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pill-ente {
      background: #eef2ff;
      color: #3730a3;
      border-color: #e0e7ff;
    }
    .pill-personal {
      background: #f3f4f6;
      color: #1f2937;
      border-color: #e5e7eb;
    }
    .pill-todo {
      background: #fef9c3;
      color: #713f12;
      border-color: #fde047;
    }
    .pill-todo-done {
      opacity: 0.6;
      text-decoration: line-through;
    }
    .pill-time {
      font-weight: 600;
      margin-right: 4px;
      font-size: 10.5px;
    }
    .pill-todo-desc {
      font-size: 10.5px;
      color: #854d0e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
    }
    .agenda-sub {
      font-size: 1rem;
      margin-bottom: 0.65rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .agenda-row {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 1rem;
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
    }
    .agenda-row:hover {
      background: var(--bg-hover);
    }
    .agenda-date {
      font-size: 12.5px;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .agenda-row-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .agenda-row-desc {
      font-size: 13px;
      color: var(--text-secondary);
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.85rem;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.65rem;
      margin-top: 1.25rem;
      padding-top: 0.9rem;
      border-top: 1px solid var(--border-subtle);
    }
    .detail-meta {
      margin: 0.9rem 0;
      font-size: 13.5px;
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .detail-desc-box {
      padding: 0.85rem;
      background: var(--bg-page);
      border: 1px solid var(--border-subtle);
      border-radius: 5px;
      font-size: 13.5px;
    }
    .empty-hint {
      font-size: 13px;
      color: var(--text-muted);
    }
  `]
})
export class CalendarioComponent implements OnInit {
  viewDate = signal<Date>(new Date());
  viewMode = signal<'MONTH' | 'AGENDA'>('MONTH');
  eventi = signal<EventoCalendario[]>([]);
  todoScadenze = signal<TodoItem[]>([]);

  showNewModal = signal(false);
  selectedEvent = signal<EventoCalendario | null>(null);
  selectedTodo = signal<TodoItem | null>(null);

  weekDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  newEvent: {
    titolo: string;
    descrizione: string;
    data_inizio: string;
    data_fine: string;
    tutto_il_giorno: boolean;
    visibilita: 'PERSONALE' | 'SETTORE' | 'ENTE';
  } = {
    titolo: '',
    descrizione: '',
    data_inizio: '',
    data_fine: '',
    tutto_il_giorno: false,
    visibilita: 'PERSONALE',
  };

  monthYearLabel = computed(() => {
    return this.viewDate().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  });

  calendarCells = computed<CalendarDayCell[]>(() => {
    const cur = this.viewDate();
    const year = cur.getFullYear();
    const month = cur.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(year, month, 1 - offset);

    const todayKey = this.toDateKey(new Date());
    const evList = this.eventi();
    const tdList = this.todoScadenze();

    const cells: CalendarDayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const key = this.toDateKey(d);
      cells.push({
        date: d,
        dateKey: key,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: key === todayKey,
        events: evList.filter((e) => this.toDateKey(new Date(e.data_inizio)) === key),
        todos: tdList.filter((t) => t.scadenza && this.toDateKey(new Date(t.scadenza)) === key),
      });
    }
    return cells;
  });

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadCalendarData();
  }

  loadCalendarData(): void {
    this.api.getCalendarioConScadenze().subscribe({
      next: (res) => {
        this.eventi.set(res.eventi);
        this.todoScadenze.set(res.todo_scadenze);
      },
    });
  }

  changeMonth(delta: number): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  goToToday(): void {
    this.viewDate.set(new Date());
  }

  openNewEventModal(defaultDate?: Date): void {
    const base = defaultDate || new Date();
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const dd = String(base.getDate()).padStart(2, '0');

    this.newEvent = {
      titolo: '',
      descrizione: '',
      data_inizio: `${yyyy}-${mm}-${dd}T09:00`,
      data_fine: `${yyyy}-${mm}-${dd}T10:00`,
      tutto_il_giorno: false,
      visibilita: 'PERSONALE',
    };
    this.showNewModal.set(true);
  }

  openNewEventOnDate(date: Date, event: MouseEvent): void {
    event.stopPropagation();
    this.openNewEventModal(date);
  }

  saveNewEvent(): void {
    if (!this.newEvent.titolo || !this.newEvent.data_inizio || !this.newEvent.data_fine) {
      return;
    }
    this.api.createEvento({
      titolo: this.newEvent.titolo,
      descrizione: this.newEvent.descrizione,
      data_inizio: new Date(this.newEvent.data_inizio).toISOString(),
      data_fine: new Date(this.newEvent.data_fine).toISOString(),
      tutto_il_giorno: this.newEvent.tutto_il_giorno,
      visibilita: this.newEvent.visibilita,
    }).subscribe({
      next: () => {
        this.showNewModal.set(false);
        this.loadCalendarData();
      },
    });
  }

  inspectEvent(ev: EventoCalendario, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedTodo.set(null);
    this.selectedEvent.set(ev);
  }

  inspectTodo(td: TodoItem, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedEvent.set(null);
    this.selectedTodo.set(td);
  }

  closeDetailModal(): void {
    this.selectedEvent.set(null);
    this.selectedTodo.set(null);
  }

  removeEvent(id: number): void {
    this.api.deleteEvento(id).subscribe({
      next: () => {
        this.closeDetailModal();
        this.loadCalendarData();
      },
    });
  }

  toggleTodoFromCalendar(td: TodoItem): void {
    this.api.updateTodoItem(td.id, { completato: !td.completato }).subscribe({
      next: (updated) => {
        this.selectedTodo.set(updated);
        this.loadCalendarData();
      },
    });
  }

  private toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
