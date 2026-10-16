import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (!auth.isAuthenticated()) {
      <router-outlet></router-outlet>
    } @else {
      <div class="app-shell">
        <!-- Menu Laterale a Sinistra -->
        <aside class="sidebar-nav no-print">
          <div class="sidebar-brand">
            <div class="brand-tag">ENTE PUBBLICO</div>
            <div class="brand-name classic-title">Gestionale Smart</div>
          </div>

          <nav class="nav-links">
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
              <span>Home</span>
            </a>
            <a routerLink="/calendario" routerLinkActive="active" class="nav-item">
              <span>Calendario</span>
            </a>
            <a routerLink="/todo" routerLinkActive="active" class="nav-item">
              <span>To-Do</span>
            </a>
            <a routerLink="/assistenza" routerLinkActive="active" class="nav-item">
              <span>Assistenza</span>
            </a>
            <a routerLink="/comunicazioni" routerLinkActive="active" class="nav-item">
              <span>Comunicazioni</span>
            </a>

            @if (auth.isAdmin()) {
              <div class="nav-divider"></div>
              <a routerLink="/admin-panel" routerLinkActive="active" class="nav-item nav-admin">
                <span>Pannello Admin</span>
              </a>
            }
          </nav>

          <div class="sidebar-user">
            @if (auth.currentUser(); as u) {
              <div class="user-info">
                <div class="user-fullname">{{ u.first_name }} {{ u.last_name }}</div>
                <div class="user-sector">{{ u.settore_nome }}</div>
                <div class="user-contact">{{ u.email }}</div>
                @if (u.telefono) {
                  <div class="user-contact">Tel. {{ u.telefono }}</div>
                }
              </div>
            }
            <button type="button" class="btn btn-sm logout-btn" (click)="auth.logout()">
              Esci dalla sessione
            </button>
          </div>
        </aside>

        <!-- Area Principale a Destra -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    }
  `,
  styles: [`
    .app-shell {
      display: flex;
      min-height: 100vh;
      background: var(--bg-page);
    }
    .sidebar-nav {
      width: 248px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 100;
    }
    .sidebar-brand {
      padding: 0 0.5rem 1.35rem 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 1.15rem;
    }
    .brand-tag {
      font-size: 10.5px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .brand-name {
      font-size: 1.35rem;
      color: var(--text-primary);
    }
    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.6rem 0.75rem;
      border-radius: 5px;
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      border: 1px solid transparent;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .nav-item:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
    .nav-item.active {
      background: var(--accent-primary);
      color: #ffffff;
    }
    .nav-divider {
      height: 1px;
      background: var(--border-subtle);
      margin: 0.6rem 0;
    }
    .sidebar-user {
      border-top: 1px solid var(--border-subtle);
      padding-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .user-info {
      padding: 0 0.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .user-fullname {
      font-weight: 600;
      font-size: 13.5px;
      color: var(--text-primary);
    }
    .user-sector {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .user-contact {
      font-size: 11.5px;
      color: var(--text-muted);
      word-break: break-all;
    }
    .logout-btn {
      width: 100%;
    }
    .main-content {
      flex: 1;
      margin-left: 248px;
      padding: 2rem 2.25rem;
      max-width: calc(100vw - 248px);
    }
    @media (max-width: 768px) {
      .app-shell {
        flex-direction: column;
      }
      .sidebar-nav {
        position: static;
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--border-subtle);
      }
      .main-content {
        margin-left: 0;
        max-width: 100%;
        padding: 1.25rem;
      }
    }
  `]
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
