export interface Settore {
  id: number;
  nome: string;
  codice: string;
  descrizione: string;
  utenti_count?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono: string;
  settore: number | null;
  settore_nome: string;
  settore_dettaglio?: Settore;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
}

export interface EventoCalendario {
  id: number;
  titolo: string;
  descrizione: string;
  data_inizio: string;
  data_fine: string;
  tutto_il_giorno: boolean;
  visibilita: 'PERSONALE' | 'SETTORE' | 'ENTE';
  settore?: number | null;
  settore_nome?: string | null;
  creato_da?: number;
  creato_da_nome?: string;
  created_at?: string;
}

export interface TodoItem {
  id: number;
  lista: number;
  lista_nome?: string;
  utente?: number;
  titolo: string;
  descrizione: string;
  completato: boolean;
  scadenza: string | null;
  ordine: number;
  created_at?: string;
}

export interface TodoList {
  id: number;
  nome: string;
  ordine: number;
  utente?: number;
  items: TodoItem[];
  created_at?: string;
}

export interface TicketImmagine {
  id: number;
  ticket: number;
  immagine: string;
  immagine_url: string;
  didascalia: string;
  uploaded_at: string;
}

export interface TicketMessaggio {
  id: number;
  ticket: number;
  autore: number;
  autore_nome: string;
  autore_is_admin: boolean;
  autore_settore: string;
  messaggio: string;
  created_at: string;
}

export interface TicketAssistenza {
  id: number;
  titolo: string;
  descrizione: string;
  stato: 'APERTO' | 'IN_ELABORAZIONE' | 'RISOLTO' | 'CHIUSO';
  stato_display: string;
  priorita: 'BASSA' | 'MEDIA' | 'ALTA';
  priorita_display: string;
  utente: number;
  utente_nome: string;
  utente_email: string;
  utente_telefono: string;
  utente_settore: string;
  immagini: TicketImmagine[];
  messaggi: TicketMessaggio[];
  created_at: string;
  updated_at: string;
}

export interface Comunicazione {
  id: number;
  titolo: string;
  contenuto: string;
  tipo_destinatario: 'TUTTI' | 'SETTORE' | 'UTENTE';
  tipo_destinatario_display: string;
  settore_destinatario: number | null;
  settore_destinatario_nome: string | null;
  utente_destinatario: number | null;
  utente_destinatario_nome: string | null;
  autore: number | null;
  autore_nome: string;
  importante: boolean;
  created_at: string;
}

export interface DashboardSummary {
  todo_da_fare_count: number;
  todo_completati_count: number;
  ticket_aperti_count: number;
  totale_ticket_aperti_ente: number;
  ultime_comunicazioni: Comunicazione[];
  eventi: EventoCalendario[];
  todo_scadenze: TodoItem[];
}
