import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Comunicazione } from '../../models/api.models';

@Component({
  selector: 'app-comunicazioni',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-container">
      <header class="comm-header card">
        <div>
          <h1 class="classic-title">Bacheca Comunicazioni</h1>
          <p class="header-subtitle">
            Comunicazioni ufficiali dell'Ente, avvisi del tuo Settore ({{ auth.currentUser()?.settore_nome || 'Generale' }}) e notifiche personali.
          </p>
        </div>

        @if (auth.isAdmin()) {
          <a routerLink="/admin-panel" class="btn btn-primary">
            + Invia Nuova Comunicazione (Admin)
          </a>
        }
      </header>

      <!-- Filtri per Destinatario -->
      <div class="comm-filters">
        <div class="filter-buttons">
          <button
            type="button"
            class="btn btn-sm"
            [class.btn-primary]="scopeFilter() === 'ALL'"
            (click)="scopeFilter.set('ALL')"
          >
            Tutte ({{ comunicazioni().length }})
          </button>
          <button
            type="button"
            class="btn btn-sm"
            [class.btn-primary]="scopeFilter() === 'TUTTI'"
            (click)="scopeFilter.set('TUTTI')"
          >
            Tutto l'Ente
          </button>
          <button
            type="button"
            class="btn btn-sm"
            [class.btn-primary]="scopeFilter() === 'SETTORE'"
            (click)="scopeFilter.set('SETTORE')"
          >
            Il Mio Settore
          </button>
          <button
            type="button"
            class="btn btn-sm"
            [class.btn-primary]="scopeFilter() === 'UTENTE'"
            (click)="scopeFilter.set('UTENTE')"
          >
            Personali
          </button>
        </div>

        <input
          type="text"
          class="form-control search-input"
          [(ngModel)]="searchQuery"
          placeholder="Cerca nelle comunicazioni..."
        />
      </div>

      <!-- Lista Comunicazioni -->
      <div class="comunicazioni-feed">
        @if (filteredComunicazioni().length === 0) {
          <div class="card empty-hint">
            Nessuna comunicazione trovata per i criteri selezionati.
          </div>
        }

        @for (c of filteredComunicazioni(); track c.id) {
          <article class="card comm-card" [class.comm-important]="c.importante">
            <div class="comm-card-top">
              <div class="comm-badges">
                @if (c.tipo_destinatario === 'TUTTI') {
                  <span class="badge">Tutti gli Utenti dell'Ente</span>
                } @else if (c.tipo_destinatario === 'SETTORE') {
                  <span class="badge badge-open">Settore: {{ c.settore_destinatario_nome }}</span>
                } @else {
                  <span class="badge badge-done">Comunicazione Personale ({{ c.utente_destinatario_nome }})</span>
                }

                @if (c.importante) {
                  <span class="badge badge-progress">Urgente / In Evidenza</span>
                }
              </div>

              <span class="comm-date">{{ c.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>

            <h2 class="classic-title comm-card-title">{{ c.titolo }}</h2>
            <p class="comm-card-body">{{ c.contenuto }}</p>

            <div class="comm-card-footer">
              <span>Pubblicato da: <strong>{{ c.autore_nome }}</strong></span>
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }
    .comm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .comm-header h1 {
      font-size: 1.5rem;
      margin-bottom: 0.2rem;
    }
    .header-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
    }
    .comm-filters {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .filter-buttons {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .search-input {
      width: 280px;
      max-width: 100%;
    }
    .comunicazioni-feed {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }
    .comm-card {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .comm-card.comm-important {
      border-left: 3px solid var(--accent-primary);
    }
    .comm-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .comm-badges {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
    }
    .comm-date {
      font-size: 12px;
      color: var(--text-muted);
    }
    .comm-card-title {
      font-size: 1.2rem;
    }
    .comm-card-body {
      font-size: 14px;
      color: var(--text-primary);
      white-space: pre-line;
      line-height: 1.6;
    }
    .comm-card-footer {
      margin-top: 0.35rem;
      padding-top: 0.65rem;
      border-top: 1px solid var(--border-subtle);
      font-size: 12px;
      color: var(--text-secondary);
    }
    .empty-hint {
      text-align: center;
      color: var(--text-muted);
      font-size: 13.5px;
      padding: 2rem;
    }
  `]
})
export class ComunicazioniComponent implements OnInit {
  comunicazioni = signal<Comunicazione[]>([]);
  scopeFilter = signal<'ALL' | 'TUTTI' | 'SETTORE' | 'UTENTE'>('ALL');
  searchQuery = '';

  filteredComunicazioni = computed(() => {
    const scope = this.scopeFilter();
    const q = this.searchQuery.trim().toLowerCase();
    return this.comunicazioni().filter((c) => {
      if (scope !== 'ALL' && c.tipo_destinatario !== scope) {
        return false;
      }
      if (q) {
        return (
          c.titolo.toLowerCase().includes(q) ||
          c.contenuto.toLowerCase().includes(q) ||
          (c.settore_destinatario_nome || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  });

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadComunicazioni();
  }

  loadComunicazioni(): void {
    this.api.getComunicazioni(false).subscribe({
      next: (data) => this.comunicazioni.set(data),
    });
  }
}
