import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { TodoList, TodoItem } from '../../models/api.models';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Header Board -->
      <header class="board-header card no-print">
        <div>
          <h1 class="classic-title">Lavagna To-Do (Kanban Board)</h1>
          <p class="board-subtitle">
            Organizza le attività in liste, imposta le scadenze collegate al Calendario o stampa i riepiloghi.
          </p>
        </div>

        <div class="board-header-actions">
          <div class="new-list-inline">
            <input
              type="text"
              class="form-control"
              [(ngModel)]="newListName"
              placeholder="Nome nuova lista..."
              (keyup.enter)="addList()"
            />
            <button type="button" class="btn" (click)="addList()">+ Nuova Lista</button>
          </div>

          <button type="button" class="btn btn-primary" (click)="printEntireBoard()">
            Stampa Intera Schermata
          </button>
        </div>
      </header>

      <!-- Intestazione visibile in fase di stampa -->
      <div class="print-only-header">
        <h1 class="classic-title">Riepilogo Attività To-Do — Ente Pubblico</h1>
        <p>Stampato il {{ currentDate | date:'dd/MM/yyyy HH:mm' }}</p>
      </div>

      <!-- Kanban Columns -->
      <div class="kanban-board" [class.single-print-mode]="printingListId() !== null">
        @for (list of lists(); track list.id) {
          <section
            class="kanban-column card"
            [class.print-hidden]="printingListId() !== null && printingListId() !== list.id"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event, list.id)"
          >
            <div class="kanban-col-header">
              <div class="col-title-wrap">
                <h2 class="classic-title">{{ list.nome }}</h2>
                <span class="badge">{{ list.items.length }}</span>
              </div>

              <div class="col-actions no-print">
                <button
                  type="button"
                  class="btn btn-sm"
                  title="Stampa solo questa lista"
                  (click)="printSingleList(list.id)"
                >
                  Stampa Lista
                </button>
                <button
                  type="button"
                  class="btn btn-sm"
                  title="Aggiungi attività in questa lista"
                  (click)="openNewItemModal(list.id)"
                >
                  + To-Do
                </button>
                @if (lists().length > 1) {
                  <button
                    type="button"
                    class="btn btn-sm btn-danger-outline"
                    title="Elimina lista"
                    (click)="removeList(list.id)"
                  >
                    ×
                  </button>
                }
              </div>
            </div>

            <!-- Items nella lista -->
            <div class="kanban-items">
              @if (list.items.length === 0) {
                <div class="empty-col-placeholder no-print">
                  Nessuna attività in "{{ list.nome }}". Clicca "+ To-Do" o trascina qui una scheda.
                </div>
              }

              @for (item of list.items; track item.id) {
                <article
                  class="todo-card"
                  [class.todo-completed]="item.completato"
                  draggable="true"
                  (dragstart)="onDragStart($event, item)"
                >
                  <div class="todo-card-top">
                    <label class="todo-checkbox-label">
                      <input
                        type="checkbox"
                        [checked]="item.completato"
                        (change)="toggleComplete(item)"
                      />
                      <span class="todo-title">{{ item.titolo }}</span>
                    </label>

                    <div class="todo-card-btns no-print">
                      <button
                        type="button"
                        class="icon-btn"
                        title="Modifica o imposta scadenza"
                        (click)="openEditItemModal(item)"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        class="icon-btn danger"
                        title="Elimina To-Do"
                        (click)="removeItem(item.id)"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  @if (item.descrizione) {
                    <p class="todo-desc">{{ item.descrizione }}</p>
                  }

                  <div class="todo-card-footer">
                    @if (item.scadenza) {
                      <span class="badge badge-progress" title="Visibile anche nel Calendario">
                        Scadenza: {{ item.scadenza | date:'dd/MM/yyyy HH:mm' }}
                      </span>
                    } @else {
                      <span class="no-deadline-text no-print">Nessuna scadenza</span>
                    }

                    <select
                      class="move-select no-print"
                      [ngModel]="item.lista"
                      (ngModelChange)="moveItemToList(item, $event)"
                      title="Sposta in un'altra lista"
                    >
                      @for (targetList of lists(); track targetList.id) {
                        <option [ngValue]="targetList.id">{{ targetList.nome }}</option>
                      }
                    </select>
                  </div>
                </article>
              }
            </div>
          </section>
        }
      </div>

      <!-- Modal Creazione / Modifica To-Do Item -->
      @if (showItemModal()) {
        <div class="modal-backdrop no-print" (click)="showItemModal.set(false)">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <h2 class="classic-title" style="margin-bottom: 1rem;">
              {{ editingItemId() ? 'Modifica Attività To-Do' : 'Nuova Attività To-Do' }}
            </h2>

            <form (ngSubmit)="saveTodoItem()">
              <div class="form-group">
                <label class="form-label">Lista di appartenenza *</label>
                <select class="form-control" [(ngModel)]="itemForm.lista" name="lista" required>
                  @for (l of lists(); track l.id) {
                    <option [ngValue]="l.id">{{ l.nome }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Titolo attività *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="itemForm.titolo"
                  name="titolo"
                  placeholder="Es. Predisposizione determina di impegno..."
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Descrizione (visibile anche nel Calendario se ha scadenza)</label>
                <textarea
                  rows="3"
                  class="form-control"
                  [(ngModel)]="itemForm.descrizione"
                  name="descrizione"
                  placeholder="Inserisci dettagli o note operative..."
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Scadenza (opzionale — compare automaticamente nel Calendario)</label>
                <div style="display: flex; gap: 0.5rem;">
                  <input
                    type="datetime-local"
                    class="form-control"
                    style="flex: 1;"
                    [(ngModel)]="itemForm.scadenza"
                    name="scadenza"
                  />
                  @if (itemForm.scadenza) {
                    <button type="button" class="btn btn-sm" (click)="itemForm.scadenza = ''">
                      Rimuovi data
                    </button>
                  }
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn" (click)="showItemModal.set(false)">Annulla</button>
                <button type="submit" class="btn btn-primary">Salva To-Do</button>
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
      gap: 1.25rem;
    }
    .board-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .board-header h1 {
      font-size: 1.5rem;
      margin-bottom: 0.2rem;
    }
    .board-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
    }
    .board-header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .new-list-inline {
      display: flex;
      gap: 0.45rem;
    }
    .print-only-header {
      display: none;
    }
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 1.15rem;
      align-items: start;
    }
    .kanban-column {
      background: var(--bg-surface);
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      min-height: 260px;
    }
    .kanban-col-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .col-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .col-title-wrap h2 {
      font-size: 1.1rem;
    }
    .col-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .kanban-items {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .empty-col-placeholder {
      padding: 1.25rem 0.75rem;
      border: 1px dashed var(--border-subtle);
      border-radius: 5px;
      text-align: center;
      font-size: 12.5px;
      color: var(--text-muted);
    }
    .todo-card {
      padding: 0.85rem;
      border: 1px solid var(--border-subtle);
      border-radius: 5px;
      background: var(--bg-page);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      cursor: grab;
      transition: border-color 0.15s ease;
    }
    .todo-card:hover {
      border-color: #cbd5e1;
    }
    .todo-card.todo-completed {
      opacity: 0.7;
      background: #f9fafb;
    }
    .todo-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .todo-checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
      cursor: pointer;
      font-weight: 500;
      font-size: 13.5px;
      line-height: 1.35;
    }
    .todo-checkbox-label input {
      margin-top: 3px;
    }
    .todo-completed .todo-title {
      text-decoration: line-through;
      color: var(--text-muted);
    }
    .todo-card-btns {
      display: flex;
      gap: 0.25rem;
    }
    .icon-btn {
      border: 1px solid transparent;
      background: transparent;
      cursor: pointer;
      padding: 0 0.35rem;
      border-radius: 4px;
      color: var(--text-secondary);
      font-size: 13px;
    }
    .icon-btn:hover {
      background: var(--bg-hover);
      border-color: var(--border-subtle);
    }
    .icon-btn.danger:hover {
      color: var(--danger-text);
      background: var(--danger-soft);
    }
    .todo-desc {
      font-size: 12.5px;
      color: var(--text-secondary);
      padding-left: 1.45rem;
    }
    .todo-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding-left: 1.45rem;
      margin-top: 0.15rem;
    }
    .no-deadline-text {
      font-size: 11.5px;
      color: var(--text-muted);
    }
    .move-select {
      font-size: 11.5px;
      padding: 0.15rem 0.35rem;
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      background: #ffffff;
      color: var(--text-secondary);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.65rem;
      margin-top: 1.25rem;
      padding-top: 0.9rem;
      border-top: 1px solid var(--border-subtle);
    }
    @media print {
      .print-only-header {
        display: block !important;
        margin-bottom: 1.25rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #000;
      }
      .print-hidden {
        display: none !important;
      }
      .kanban-board.single-print-mode {
        display: block !important;
      }
      .todo-card {
        break-inside: avoid;
        background: #ffffff !important;
      }
    }
  `]
})
export class TodoComponent implements OnInit {
  lists = signal<TodoList[]>([]);
  newListName = '';
  printingListId = signal<number | null>(null);
  currentDate = new Date();

  showItemModal = signal(false);
  editingItemId = signal<number | null>(null);
  draggedItem: TodoItem | null = null;

  itemForm = {
    lista: 0,
    titolo: '',
    descrizione: '',
    scadenza: '',
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadLists();
  }

  loadLists(): void {
    this.api.getTodoLists().subscribe({
      next: (data) => this.lists.set(data),
    });
  }

  addList(): void {
    const name = this.newListName.trim();
    if (!name) return;
    this.api.createTodoList(name).subscribe({
      next: () => {
        this.newListName = '';
        this.loadLists();
      },
    });
  }

  removeList(listId: number): void {
    this.api.deleteTodoList(listId).subscribe({
      next: () => this.loadLists(),
    });
  }

  openNewItemModal(listId: number): void {
    this.editingItemId.set(null);
    this.itemForm = {
      lista: listId,
      titolo: '',
      descrizione: '',
      scadenza: '',
    };
    this.showItemModal.set(true);
  }

  openEditItemModal(item: TodoItem): void {
    this.editingItemId.set(item.id);
    let formattedScadenza = '';
    if (item.scadenza) {
      const d = new Date(item.scadenza);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      formattedScadenza = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    }
    this.itemForm = {
      lista: item.lista,
      titolo: item.titolo,
      descrizione: item.descrizione || '',
      scadenza: formattedScadenza,
    };
    this.showItemModal.set(true);
  }

  saveTodoItem(): void {
    if (!this.itemForm.titolo.trim() || !this.itemForm.lista) return;
    const payload: Partial<TodoItem> = {
      lista: this.itemForm.lista,
      titolo: this.itemForm.titolo.trim(),
      descrizione: this.itemForm.descrizione.trim(),
      scadenza: this.itemForm.scadenza ? new Date(this.itemForm.scadenza).toISOString() : null,
    };

    const editId = this.editingItemId();
    if (editId) {
      this.api.updateTodoItem(editId, payload).subscribe({
        next: () => {
          this.showItemModal.set(false);
          this.loadLists();
        },
      });
    } else {
      this.api.createTodoItem(payload).subscribe({
        next: () => {
          this.showItemModal.set(false);
          this.loadLists();
        },
      });
    }
  }

  toggleComplete(item: TodoItem): void {
    this.api.updateTodoItem(item.id, { completato: !item.completato }).subscribe({
      next: () => this.loadLists(),
    });
  }

  moveItemToList(item: TodoItem, targetListId: number): void {
    if (item.lista === targetListId) return;
    this.api.updateTodoItem(item.id, { lista: targetListId }).subscribe({
      next: () => this.loadLists(),
    });
  }

  removeItem(itemId: number): void {
    this.api.deleteTodoItem(itemId).subscribe({
      next: () => this.loadLists(),
    });
  }

  onDragStart(event: DragEvent, item: TodoItem): void {
    this.draggedItem = item;
    event.dataTransfer?.setData('text/plain', String(item.id));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, targetListId: number): void {
    event.preventDefault();
    if (this.draggedItem && this.draggedItem.lista !== targetListId) {
      this.moveItemToList(this.draggedItem, targetListId);
    }
    this.draggedItem = null;
  }

  printEntireBoard(): void {
    this.currentDate = new Date();
    this.printingListId.set(null);
    setTimeout(() => {
      window.print();
    }, 50);
  }

  printSingleList(listId: number): void {
    this.currentDate = new Date();
    this.printingListId.set(listId);
    setTimeout(() => {
      window.print();
      this.printingListId.set(null);
    }, 80);
  }
}
