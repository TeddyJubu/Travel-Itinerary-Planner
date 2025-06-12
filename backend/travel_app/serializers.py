from rest_framework import serializers
from .models import Itinerary

class ItinerarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Itinerary
        fields = ['id', 'destination', 'days', 'result', 'created_at']

class ItineraryCreateSerializer(serializers.Serializer):
    destination = serializers.CharField(max_length=100)
    days = serializers.IntegerField(min_value=1) 