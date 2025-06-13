from django.db import models

# Create your models here.

class Itinerary(models.Model):
    destination = models.CharField(max_length=100)
    days = models.PositiveIntegerField()
    result = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    user_email = models.EmailField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.destination} ({self.days} days) - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
