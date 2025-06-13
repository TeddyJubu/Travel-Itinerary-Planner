from rest_framework import serializers
from .models import Itinerary

class ItinerarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Itinerary
        fields = ['id', 'destination', 'days', 'result', 'created_at', 'user_email']

class ItineraryCreateSerializer(serializers.Serializer):
    destination = serializers.CharField(max_length=100)
    days = serializers.IntegerField(min_value=1)
    user_email = serializers.EmailField() 