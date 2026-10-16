from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    login_view,
    me_view,
    dashboard_summary_view,
    SettoreViewSet,
    UserViewSet,
    EventoCalendarioViewSet,
    TodoListViewSet,
    TodoItemViewSet,
    TicketAssistenzaViewSet,
    ComunicazioneViewSet,
)

router = DefaultRouter()
router.register(r'settori', SettoreViewSet, basename='settori')
router.register(r'utenti', UserViewSet, basename='utenti')
router.register(r'eventi', EventoCalendarioViewSet, basename='eventi')
router.register(r'todo-lists', TodoListViewSet, basename='todo-lists')
router.register(r'todo-items', TodoItemViewSet, basename='todo-items')
router.register(r'tickets', TicketAssistenzaViewSet, basename='tickets')
router.register(r'comunicazioni', ComunicazioneViewSet, basename='comunicazioni')

urlpatterns = [
    path('auth/login/', login_view, name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/me/', me_view, name='auth-me'),
    path('dashboard/', dashboard_summary_view, name='dashboard-summary'),
    path('', include(router.urls)),
]
