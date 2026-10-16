import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { CalendarioComponent } from './pages/calendario/calendario.component';
import { TodoComponent } from './pages/todo/todo.component';
import { AssistenzaComponent } from './pages/assistenza/assistenza.component';
import { ComunicazioniComponent } from './pages/comunicazioni/comunicazioni.component';
import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: HomeComponent, canActivate: [authGuard] },
  { path: 'calendario', component: CalendarioComponent, canActivate: [authGuard] },
  { path: 'todo', component: TodoComponent, canActivate: [authGuard] },
  { path: 'assistenza', component: AssistenzaComponent, canActivate: [authGuard] },
  { path: 'comunicazioni', component: ComunicazioniComponent, canActivate: [authGuard] },
  { path: 'admin-panel', component: AdminPanelComponent, canActivate: [adminGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
