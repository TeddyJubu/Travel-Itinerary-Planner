from django.urls import path
from .views import ItineraryView, HistoryView, index

urlpatterns = [
    path('', index, name='index'),
    path('itinerary/', ItineraryView.as_view(), name='itinerary'),
    path('history/', HistoryView.as_view(), name='history'),
] 