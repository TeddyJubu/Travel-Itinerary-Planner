import logging
import os
import requests
import json
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from .models import Itinerary
from .serializers import ItinerarySerializer, ItineraryCreateSerializer
from .utils import (
    sanitize_destination, 
    sanitize_days, 
    create_safe_prompt, 
    validate_email_ownership,
    sanitize_user_input
)

# Set up logger for this module
logger = logging.getLogger(__name__)

def index(request):
    return render(request, 'index.html')

# Create your views here.

class ItineraryView(APIView):
    """
    API view for creating travel itineraries.
    
    This view:
    1. Validates Firebase authentication
    2. Sanitizes user inputs to prevent injection attacks
    3. Validates user email ownership
    4. Calls Groq API with safe prompts
    5. Saves itinerary to database
    """
    
    def post(self, request):
        """
        Create a new travel itinerary.
        
        Args:
            request: HTTP request with destination, days, and user_email
            
        Returns:
            Response: Created itinerary data or error message
        """
        try:
            # Check if user is authenticated via Firebase middleware
            if not hasattr(request, 'firebase_user'):
                logger.warning("Unauthenticated request to create itinerary")
                return Response({
                    'error': 'Authentication required',
                    'code': 'AUTHENTICATION_REQUIRED'
                }, status=401)
            
            # Get authenticated user email from Firebase token
            authenticated_email = request.firebase_user.get('email')
            if not authenticated_email:
                logger.error("Firebase user has no email")
                return Response({
                    'error': 'User email not found in authentication token',
                    'code': 'MISSING_USER_EMAIL'
                }, status=400)
            
            # Sanitize and validate input data
            try:
                sanitized_data = sanitize_user_input(request.data)
            except ValueError as e:
                logger.warning(f"Input validation failed: {e}")
                return Response({
                    'error': f'Invalid input: {str(e)}',
                    'code': 'INVALID_INPUT'
                }, status=400)
            
            # Extract sanitized values
            destination = sanitized_data.get('destination')
            days = sanitized_data.get('days')
            
            if not destination or not days:
                return Response({
                    'error': 'destination and days are required',
                    'code': 'MISSING_REQUIRED_FIELDS'
                }, status=400)
            
            # Validate email ownership if provided in request
            request_email = sanitized_data.get('user_email')
            if request_email and not validate_email_ownership(request_email, authenticated_email):
                logger.warning(f"Email ownership validation failed: {request_email} vs {authenticated_email}")
                return Response({
                    'error': 'You can only create itineraries for your own account',
                    'code': 'EMAIL_OWNERSHIP_VIOLATION'
                }, status=403)
            
            # Use authenticated email for database storage
            user_email = authenticated_email
            
            # Create safe prompt using sanitized inputs
            safe_prompt = create_safe_prompt(destination, days)
            
            # Call Groq API with safe prompt
            api_key = os.getenv('GROQ_API_KEY')
            if not api_key:
                logger.error("GROQ_API_KEY not configured")
                return Response({
                    'error': 'API configuration error',
                    'code': 'API_CONFIG_ERROR'
                }, status=500)
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            logger.info(f"Creating itinerary for {destination}, {days} days, user: {user_email}")
            
            try:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": "openai/gpt-oss-120b",
                        "messages": [
                            {
                                "role": "user",
                                "content": safe_prompt
                            }
                        ],
                        "temperature": 0.7,
                        "max_completion_tokens": 4000,  # Updated parameter name and increased limit
                        "reasoning_effort": "medium"  # Added reasoning effort parameter for GPT-OSS models
                    },
                    timeout=60  # Increased timeout for more complex model
                )
                
                if response.status_code != 200:
                    logger.error(f"Groq API error {response.status_code}: {response.text}")
                    return Response({
                        'error': 'Failed to generate itinerary',
                        'code': 'API_ERROR'
                    }, status=500)
                
                # Extract result from API response
                api_response = response.json()
                if 'choices' not in api_response or not api_response['choices']:
                    logger.error(f"Invalid API response format: {api_response}")
                    return Response({
                        'error': 'Invalid response from AI service',
                        'code': 'INVALID_API_RESPONSE'
                    }, status=500)
                
                result = api_response['choices'][0]['message']['content']
                
                # Save to database with authenticated user email
                itinerary = Itinerary.objects.create(
                    destination=destination,
                    days=days,
                    result=result,
                    user_email=user_email
                )
                
                logger.info(f"Successfully created itinerary {itinerary.id} for user {user_email}")
                return Response(ItinerarySerializer(itinerary).data, status=201)
                
            except requests.exceptions.Timeout:
                logger.error("Groq API request timeout")
                return Response({
                    'error': 'Request timeout - please try again',
                    'code': 'REQUEST_TIMEOUT'
                }, status=504)
            except requests.exceptions.RequestException as e:
                logger.error(f"Groq API request failed: {str(e)}")
                return Response({
                    'error': 'Failed to connect to AI service',
                    'code': 'API_CONNECTION_ERROR'
                }, status=503)
            except Exception as e:
                logger.error(f"Unexpected error calling Groq API: {str(e)}")
                return Response({
                    'error': 'Internal server error',
                    'code': 'INTERNAL_ERROR'
                }, status=500)
                
        except Exception as e:
            logger.error(f"Unexpected error in ItineraryView.post: {str(e)}")
            return Response({
                'error': 'Internal server error',
                'code': 'INTERNAL_ERROR'
            }, status=500)

class HistoryView(APIView):
    """
    API view for retrieving user's itinerary history.
    
    This view:
    1. Validates Firebase authentication
    2. Returns only the authenticated user's itineraries
    3. Implements proper error handling
    """
    
    def get(self, request):
        """
        Get itinerary history for the authenticated user.
        
        Args:
            request: HTTP request
            
        Returns:
            Response: List of user's itineraries or error message
        """
        try:
            # Check if user is authenticated via Firebase middleware
            if not hasattr(request, 'firebase_user'):
                logger.warning("Unauthenticated request to get history")
                return Response({
                    'error': 'Authentication required',
                    'code': 'AUTHENTICATION_REQUIRED'
                }, status=401)
            
            # Get authenticated user email from Firebase token
            authenticated_email = request.firebase_user.get('email')
            if not authenticated_email:
                logger.error("Firebase user has no email")
                return Response({
                    'error': 'User email not found in authentication token',
                    'code': 'MISSING_USER_EMAIL'
                }, status=400)
            
            # Optional: validate query parameter email matches authenticated user
            query_email = request.query_params.get('user_email')
            if query_email and not validate_email_ownership(query_email, authenticated_email):
                logger.warning(f"Email ownership validation failed in history: {query_email} vs {authenticated_email}")
                return Response({
                    'error': 'You can only access your own itinerary history',
                    'code': 'EMAIL_OWNERSHIP_VIOLATION'
                }, status=403)
            
            # Fetch itineraries for authenticated user only
            itineraries = Itinerary.objects.filter(
                user_email=authenticated_email
            ).order_by('-created_at')
            
            # Serialize data
            data = [
                {
                    'id': i.id,
                    'destination': i.destination,
                    'days': i.days,
                    'result': i.result,
                    'created_at': i.created_at,
                    'user_email': i.user_email,
                } for i in itineraries
            ]
            
            logger.info(f"Retrieved {len(data)} itineraries for user {authenticated_email}")
            return Response(data)
            
        except Exception as e:
            logger.error(f"Unexpected error in HistoryView.get: {str(e)}")
            return Response({
                'error': 'Internal server error',
                'code': 'INTERNAL_ERROR'
            }, status=500)
