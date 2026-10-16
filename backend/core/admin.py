from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Settore,
    User,
    EventoCalendario,
    TodoList,
    TodoItem,
    TicketAssistenza,
    TicketImmagine,
    TicketMessaggio,
    Comunicazione,
)


@admin.register(Settore)
class SettoreAdmin(admin.ModelAdmin):
    list_display = ('nome', 'codice', 'descrizione')
    search_fields = ('nome', 'codice')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'telefono', 'settore', 'is_staff', 'is_active')
    list_filter = ('settore', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'first_name', 'last_name', 'telefono', 'username')
    ordering = ('last_name', 'first_name')

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Dati Ente Pubblico', {'fields': ('telefono', 'settore')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Dati Anagrafici e Settore', {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name', 'email', 'telefono', 'settore', 'is_staff'),
        }),
    )


@admin.register(EventoCalendario)
class EventoCalendarioAdmin(admin.ModelAdmin):
    list_display = ('titolo', 'data_inizio', 'data_fine', 'tutto_il_giorno', 'visibilita', 'settore', 'creato_da')
    list_filter = ('visibilita', 'settore', 'tutto_il_giorno')
    search_fields = ('titolo', 'descrizione')


class TodoItemInline(admin.TabularInline):
    model = TodoItem
    extra = 0


@admin.register(TodoList)
class TodoListAdmin(admin.ModelAdmin):
    list_display = ('nome', 'utente', 'ordine', 'created_at')
    list_filter = ('utente',)
    inlines = [TodoItemInline]


@admin.register(TodoItem)
class TodoItemAdmin(admin.ModelAdmin):
    list_display = ('titolo', 'lista', 'utente', 'completato', 'scadenza')
    list_filter = ('completato', 'utente')
    search_fields = ('titolo', 'descrizione')


class TicketImmagineInline(admin.TabularInline):
    model = TicketImmagine
    extra = 0


class TicketMessaggioInline(admin.TabularInline):
    model = TicketMessaggio
    extra = 1


@admin.register(TicketAssistenza)
class TicketAssistenzaAdmin(admin.ModelAdmin):
    list_display = ('id', 'titolo', 'utente', 'stato', 'priorita', 'created_at', 'updated_at')
    list_filter = ('stato', 'priorita', 'utente__settore')
    search_fields = ('titolo', 'descrizione', 'utente__email', 'utente__last_name')
    inlines = [TicketImmagineInline, TicketMessaggioInline]


@admin.register(Comunicazione)
class ComunicazioneAdmin(admin.ModelAdmin):
    list_display = (
        'titolo',
        'tipo_destinatario',
        'settore_destinatario',
        'utente_destinatario',
        'importante',
        'autore',
        'created_at',
    )
    list_filter = ('tipo_destinatario', 'importante', 'settore_destinatario')
    search_fields = ('titolo', 'contenuto')
