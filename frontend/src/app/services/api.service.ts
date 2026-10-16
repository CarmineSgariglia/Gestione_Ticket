import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Settore,
  User,
  EventoCalendario,
  TodoList,
  TodoItem,
  TicketAssistenza,
  Comunicazione,
  DashboardSummary,
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>('/api/dashboard/');
  }

  // Calendario (Eventi + Scadenze To-Do)
  getCalendarioConScadenze(): Observable<{ eventi: EventoCalendario[]; todo_scadenze: TodoItem[] }> {
    return this.http.get<{ eventi: EventoCalendario[]; todo_scadenze: TodoItem[] }>('/api/eventi/con_scadenze/');
  }

  createEvento(payload: Partial<EventoCalendario>): Observable<EventoCalendario> {
    return this.http.post<EventoCalendario>('/api/eventi/', payload);
  }

  updateEvento(id: number, payload: Partial<EventoCalendario>): Observable<EventoCalendario> {
    return this.http.patch<EventoCalendario>(`/api/eventi/${id}/`, payload);
  }

  deleteEvento(id: number): Observable<void> {
    return this.http.delete<void>(`/api/eventi/${id}/`);
  }

  // To-Do Kanban Board
  getTodoLists(): Observable<TodoList[]> {
    return this.http.get<TodoList[]>('/api/todo-lists/');
  }

  createTodoList(nome: string): Observable<TodoList> {
    return this.http.post<TodoList>('/api/todo-lists/', { nome });
  }

  updateTodoList(id: number, nome: string): Observable<TodoList> {
    return this.http.patch<TodoList>(`/api/todo-lists/${id}/`, { nome });
  }

  deleteTodoList(id: number): Observable<void> {
    return this.http.delete<void>(`/api/todo-lists/${id}/`);
  }

  createTodoItem(payload: Partial<TodoItem>): Observable<TodoItem> {
    return this.http.post<TodoItem>('/api/todo-items/', payload);
  }

  updateTodoItem(id: number, payload: Partial<TodoItem>): Observable<TodoItem> {
    return this.http.patch<TodoItem>(`/api/todo-items/${id}/`, payload);
  }

  deleteTodoItem(id: number): Observable<void> {
    return this.http.delete<void>(`/api/todo-items/${id}/`);
  }

  // Ticket di Assistenza
  getTickets(tutti = false): Observable<TicketAssistenza[]> {
    const query = tutti ? '?tutti=true' : '';
    return this.http.get<TicketAssistenza[]>(`/api/tickets/${query}`);
  }

  createTicket(formData: FormData): Observable<TicketAssistenza> {
    return this.http.post<TicketAssistenza>('/api/tickets/', formData);
  }

  aggiungiMessaggioTicket(
    ticketId: number,
    messaggio: string,
    stato?: string
  ): Observable<TicketAssistenza> {
    return this.http.post<TicketAssistenza>(`/api/tickets/${ticketId}/aggiungi_messaggio/`, {
      messaggio,
      stato,
    });
  }

  aggiornaStatoTicket(
    ticketId: number,
    stato: string,
    messaggio?: string
  ): Observable<TicketAssistenza> {
    return this.http.post<TicketAssistenza>(`/api/tickets/${ticketId}/aggiorna_stato/`, {
      stato,
      messaggio,
    });
  }

  // Comunicazioni
  getComunicazioni(tutte = false): Observable<Comunicazione[]> {
    const query = tutte ? '?tutte=true' : '';
    return this.http.get<Comunicazione[]>(`/api/comunicazioni/${query}`);
  }

  createComunicazione(payload: Partial<Comunicazione>): Observable<Comunicazione> {
    return this.http.post<Comunicazione>('/api/comunicazioni/', payload);
  }

  deleteComunicazione(id: number): Observable<void> {
    return this.http.delete<void>(`/api/comunicazioni/${id}/`);
  }

  // Amministrazione Utenti & Settori
  getSettori(): Observable<Settore[]> {
    return this.http.get<Settore[]>('/api/settori/');
  }

  createSettore(payload: Partial<Settore>): Observable<Settore> {
    return this.http.post<Settore>('/api/settori/', payload);
  }

  getUtenti(): Observable<User[]> {
    return this.http.get<User[]>('/api/utenti/');
  }

  createUtente(payload: Partial<User> & { password?: string }): Observable<User> {
    return this.http.post<User>('/api/utenti/', payload);
  }

  updateUtente(id: number, payload: Partial<User> & { password?: string }): Observable<User> {
    return this.http.patch<User>(`/api/utenti/${id}/`, payload);
  }

  deleteUtente(id: number): Observable<void> {
    return this.http.delete<void>(`/api/utenti/${id}/`);
  }
}
