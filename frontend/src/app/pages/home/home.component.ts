import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import {
  DashboardSummary,
  EventoCalendario,
  TodoItem,
} from '../../models/api.models';

interface MiniDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  eventsCount: number;
  todosCount: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1 class="classic-title">Riepilogo Operativo</h1>
          <p class="page-subtitle">
            Benvenuto, {{ auth.currentUser()?.first_name }} {{ auth.currentUser()?.last_name }}
            @if (auth.currentUser()?.settore_nome) {
              <span> · {{ auth.currentUser()?.settore_nome }}</span>
            }
          </p>
        </div>
      </header>

      <!-- Indicatori principali: Numero cose da fare & Numero ticket aperti -->
      <div class="metrics-grid">
        <a routerLink="/todo" class="metric-card card">
          <div class="metric-label">Attività da completare (To-Do)</div>
          <div class="metric-value classic-title">{{ summary()?.todo_da_fare_count ?? 0 }}</div>
          <div class="metric-meta">
            {{ summary()?.todo_completati_count ?? 0 }} attività già completate · Vai alla Kanban Board →
          </div>
        </a>

        <a routerLink="/assistenza" class="metric-card card">
          <div class="metric-label">Ticket di Assistenza Aperti</div>
          <div class="metric-value classic-title">{{ summary()?.ticket_aperti_count ?? 0 }}</div>
          <div class="metric-meta">
            @if (auth.isAdmin()) {
              <span>Totale Ente in lavorazione/aperti: {{ summary()?.totale_ticket_aperti_ente ?? 0 }} · </span>
            }
            Gestisci segnalazioni →
          </div>
        </a>
      </div>

      <!-- Griglia Principale: Piccola View del Calendario & Ultime Tre Comunicazioni -->
      <div class="home-main-grid">
        <!-- Piccola View del Calendario -->
        <section class="card mini-calendar-section">
          <div class="section-header">
            <h2 class="classic-title">Calendario e Scadenze</h2>
            <a routerLink="/calendario" class="btn btn-sm">Apri Calendario</a>
          </div>

          <div class="mini-cal-nav">
            <button type="button" class="btn btn-sm" (click)="changeMonth(-1)">‹</button>
            <span class="mini-cal-month">{{ currentMonthLabel() }}</span>
            <button type="button" class="btn btn-sm" (click)="changeMonth(1)">›</button>
          </div>

          <div class="mini-cal-grid">
            @for (wd of weekDays; track wd) {
              <div class="mini-cal-weekday">{{ wd }}</div>
            }
            @for (day of miniCalendarDays(); track day.date.toISOString()) {
              <button
                type="button"
                class="mini-cal-day"
                [class.other-month]="!day.isCurrentMonth"
                [class.is-today]="day.isToday"
                [class.is-selected]="day.isSelected"
                (click)="selectDate(day.date)"
              >
                <span>{{ day.dayNumber }}</span>
                <div class="day-dots">
                  @if (day.eventsCount > 0) {
                    <span class="dot dot-event" title="Eventi"></span>
                  }
                  @if (day.todosCount > 0) {
                    <span class="dot dot-todo" title="Scadenze To-Do"></span>
                  }
                </div>
              </button>
            }
          </div>

          <div class="selected-day-agenda">
            <div class="agenda-title">
              Impegni e scadenze del {{ selectedDate() | date:'dd/MM/yyyy' }}
            </div>

            @if (selectedDayEvents().length === 0 && selectedDayTodos().length === 0) {
              <p class="empty-hint">Nessun evento o scadenza in questa data.</p>
            }

            @for (ev of selectedDayEvents(); track ev.id) {
              <div class="agenda-item">
                <span class="badge">{{ ev.visibilita }}</span>
                <div class="agenda-item-body">
                  <div class="agenda-item-title">{{ ev.titolo }}</div>
                  @if (ev.descrizione) {
                    <div class="agenda-item-desc">{{ ev.descrizione }}</div>
                  }
                </div>
              </div>
            }

            @for (td of selectedDayTodos(); track td.id) {
              <div class="agenda-item">
                <span class="badge badge-progress">Scadenza To-Do</span>
                <div class="agenda-item-body">
                  <div class="agenda-item-title" [class.done-text]="td.completato">{{ td.titolo }}</div>
                  @if (td.descrizione) {
                    <div class="agenda-item-desc">{{ td.descrizione }}</div>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Ultime Tre Comunicazioni -->
        <section class="card comunicazioni-section">
          <div class="section-header">
            <h2 class="classic-title">Ultime Tre Comunicazioni</h2>
            <a routerLink="/comunicazioni" class="btn btn-sm">Tutte le comunicazioni</a>
          </div>

          @if ((summary()?.ultime_comunicazioni?.length ?? 0) === 0) {
            <p class="empty-hint">Nessuna comunicazione presente.</p>
          }

          <div class="comm-list">
            @for (comm of summary()?.ultime_comunicazioni; track comm.id) {
              <article class="comm-item">
                <div class="comm-meta">
                  <span class="badge">
                    @if (comm.tipo_destinatario === 'TUTTI') {
                      Circolare Ente
                    } @else if (comm.tipo_destinatario === 'SETTORE') {
                      Settore: {{ comm.settore_destinatario_nome }}
                    } @else {
                      Comunicazione Personale
                    }
                  </span>
                  @if (comm.importante) {
                    <span class="badge badge-progress">In Evidenza</span>
                  }
                  <span class="comm-date">{{ comm.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <h3 class="comm-title classic-title">{{ comm.titolo }}</h3>
                <p class="comm-excerpt">{{ comm.contenuto }}</p>
                <div class="comm-author">Da: {{ comm.autore_nome }}</div>
              </article>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header h1 {
      font-size: 1.65rem;
      margin-bottom: 0.2rem;
    }
    .page-subtitle {
      color: var(--text-secondary);
      font-size: 13.5px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }
    .metric-card {
      text-decoration: none;
      color: inherit;
      transition: border-color 0.15s ease, background-color 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .metric-card:hover {
      border-color: #9ca3af;
      background-color: #fcfcfd;
    }
    .metric-label {
      font-size: 12.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }
    .metric-value {
      font-size: 2.35rem;
      line-height: 1.1;
      color: var(--text-primary);
    }
    .metric-meta {
      font-size: 12.5px;
      color: var(--text-secondary);
      margin-top: 0.2rem;
    }
    .home-main-grid {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 1.25rem;
      align-items: start;
    }
    @media (max-width: 980px) {
      .home-main-grid {
        grid-template-columns: 1fr;
      }
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .section-header h2 {
      font-size: 1.15rem;
    }
    .mini-cal-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .mini-cal-month {
      font-weight: 500;
      font-size: 14px;
      text-transform: capitalize;
    }
    .mini-cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      margin-bottom: 1rem;
    }
    .mini-cal-weekday {
      text-align: center;
      font-size: 11.5px;
      color: var(--text-muted);
      padding: 0.3rem 0;
      font-weight: 500;
    }
    .mini-cal-day {
      aspect-ratio: 1;
      border: 1px solid transparent;
      background: transparent;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12.5px;
      position: relative;
    }
    .mini-cal-day:hover {
      background: var(--bg-hover);
    }
    .mini-cal-day.other-month {
      color: #d1d5db;
    }
    .mini-cal-day.is-today {
      border-color: var(--border-focus);
      font-weight: 600;
    }
    .mini-cal-day.is-selected {
      background: var(--accent-primary);
      color: #ffffff;
    }
    .day-dots {
      display: flex;
      gap: 3px;
      margin-top: 2px;
      height: 5px;
    }
    .dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
    }
    .dot-event {
      background: #4b5563;
    }
    .dot-todo {
      background: #b45309;
    }
    .mini-cal-day.is-selected .dot-event,
    .mini-cal-day.is-selected .dot-todo {
      background: #ffffff;
    }
    .selected-day-agenda {
      border-top: 1px solid var(--border-subtle);
      padding-top: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .agenda-title {
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .agenda-item {
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
      padding: 0.5rem;
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      background: var(--bg-page);
    }
    .agenda-item-title {
      font-size: 13px;
      font-weight: 500;
    }
    .agenda-item-desc {
      font-size: 12px;
      color: var(--text-secondary);
    }
    .done-text {
      text-decoration: line-through;
      color: var(--text-muted);
    }
    .comm-list {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }
    .comm-item {
      padding: 0.95rem;
      border: 1px solid var(--border-subtle);
      border-radius: 5px;
      background: var(--bg-page);
    }
    .comm-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-bottom: 0.45rem;
    }
    .comm-date {
      font-size: 12px;
      color: var(--text-muted);
      margin-left: auto;
    }
    .comm-title {
      font-size: 1.05rem;
      margin-bottom: 0.35rem;
    }
    .comm-excerpt {
      font-size: 13.5px;
      color: var(--text-secondary);
      margin-bottom: 0.45rem;
    }
    .comm-author {
      font-size: 12px;
      color: var(--text-muted);
    }
    .empty-hint {
      font-size: 13px;
      color: var(--text-muted);
      padding: 0.5rem 0;
    }
  `]
})
export class HomeComponent implements OnInit {
  summary = signal<DashboardSummary | null>(null);
  viewDate = signal<Date>(new Date());
  selectedDate = signal<Date>(new Date());
  weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  currentMonthLabel = computed(() => {
    return this.viewDate().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  });

  miniCalendarDays = computed<MiniDay[]>(() => {
    const current = this.viewDate();
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const startDate = new Date(year, month, 1 - startOffset);

    const events = this.summary()?.eventi ?? [];
    const todos = this.summary()?.todo_scadenze ?? [];
    const todayStr = this.toDateKey(new Date());
    const selStr = this.toDateKey(this.selectedDate());

    const days: MiniDay[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const key = this.toDateKey(d);
      const evCount = events.filter((e) => this.toDateKey(new Date(e.data_inizio)) === key).length;
      const tdCount = todos.filter((t) => t.scadenza && this.toDateKey(new Date(t.scadenza)) === key).length;

      days.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: key === todayStr,
        isSelected: key === selStr,
        eventsCount: evCount,
        todosCount: tdCount,
      });
    }
    return days;
  });

  selectedDayEvents = computed<EventoCalendario[]>(() => {
    const key = this.toDateKey(this.selectedDate());
    return (this.summary()?.eventi ?? []).filter(
      (e) => this.toDateKey(new Date(e.data_inizio)) === key
    );
  });

  selectedDayTodos = computed<TodoItem[]>(() => {
    const key = this.toDateKey(this.selectedDate());
    return (this.summary()?.todo_scadenze ?? []).filter(
      (t) => t.scadenza && this.toDateKey(new Date(t.scadenza)) === key
    );
  });

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.api.getDashboardSummary().subscribe({
      next: (data) => this.summary.set(data),
    });
  }

  changeMonth(delta: number): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
  }

  private toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
