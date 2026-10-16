import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card card">
        <div class="login-header">
          <span class="ente-tag">PORTALE ISTITUZIONALE INTERNO</span>
          <h1 class="classic-title">Gestionale Smart Ente</h1>
          <p class="login-subtitle">Accedi con le credenziali assegnate dall'Amministrazione</p>
        </div>

        @if (errorMessage()) {
          <div class="error-box">
            {{ errorMessage() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label" for="email">Email istituzionale o nome utente</label>
            <input
              id="email"
              type="text"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              placeholder="nome.cognome@ente.gov.it"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn btn-primary login-submit" [disabled]="loading()">
            {{ loading() ? 'Accesso in corso...' : 'Accedi al Gestionale' }}
          </button>
        </form>

        <div class="demo-credentials">
          <div class="demo-label">Accesso rapido profili pre-registrati:</div>
          <div class="demo-buttons">
            <button type="button" class="btn btn-sm" (click)="fillDemo('admin@ente.gov.it', 'Admin2026!')">
              Admin CED (Marco Rossi)
            </button>
            <button type="button" class="btn btn-sm" (click)="fillDemo('laura.bianchi@ente.gov.it', 'Utente2026!')">
              Protocollo (Laura Bianchi)
            </button>
            <button type="button" class="btn btn-sm" (click)="fillDemo('giuseppe.verdi@ente.gov.it', 'Utente2026!')">
              Uff. Tecnico (G. Verdi)
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: var(--bg-page);
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 2.25rem 2rem;
    }
    .login-header {
      margin-bottom: 1.75rem;
      text-align: left;
    }
    .ente-tag {
      display: inline-block;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .login-header h1 {
      font-size: 1.65rem;
      margin-bottom: 0.35rem;
    }
    .login-subtitle {
      font-size: 13.5px;
      color: var(--text-secondary);
    }
    .error-box {
      padding: 0.65rem 0.85rem;
      border: 1px solid #fecaca;
      background: var(--danger-soft);
      color: var(--danger-text);
      border-radius: 5px;
      font-size: 13px;
      margin-bottom: 1rem;
    }
    .login-submit {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.6rem;
    }
    .demo-credentials {
      margin-top: 1.75rem;
      padding-top: 1.15rem;
      border-top: 1px solid var(--border-subtle);
    }
    .demo-label {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 0.55rem;
    }
    .demo-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  fillDemo(email: string, pass: string): void {
    this.email = email;
    this.password = pass;
    this.onSubmit();
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Inserire email e password.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.error?.detail || 'Impossibile effettuare il login. Verificare le credenziali.'
        );
      }
    });
  }
}
