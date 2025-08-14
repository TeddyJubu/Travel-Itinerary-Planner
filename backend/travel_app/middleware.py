import json
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from firebase_admin import auth, credentials, initialize_app
import os

# Initialize Firebase Admin SDK
FIREBASE_INITIALIZED = False
try:
    # Try to get the service account key from environment variable
    service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
    if service_account_path and os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        initialize_app(cred)
        FIREBASE_INITIALIZED = True
        logging.info("Firebase Admin SDK initialized successfully")
    else:
        logging.warning("Firebase service account key not found. Authentication will be disabled.")
except Exception as e:
    logging.error(f"Failed to initialize Firebase Admin SDK: {e}")

class FirebaseAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware to authenticate Firebase tokens for API requests.
    
    This middleware:
    1. Checks for Authorization header with Bearer token
    2. Validates the Firebase ID token
    3. Adds the authenticated user info to the request
    4. Allows unauthenticated access to specific endpoints
    """
    
    # Endpoints that don't require authentication
    EXEMPT_PATHS = [
        '/admin/',
        '/api/health/',  # Health check endpoint
    ]
    
    def process_request(self, request):
        """
        Process incoming request to validate Firebase authentication.
        
        Args:
            request: Django HTTP request object
            
        Returns:
            None if authentication passes, JsonResponse if it fails
        """
        # Skip authentication for exempt paths
        if any(request.path.startswith(path) for path in self.EXEMPT_PATHS):
            return None
            
        # Skip authentication for non-API requests (like static files)
        if not request.path.startswith('/api/'):
            return None
            
        # Skip authentication if Firebase is not initialized (development mode)
        if not FIREBASE_INITIALIZED:
            logging.info("Firebase not initialized - allowing unauthenticated access for development")
            # Add a mock user for development
            request.firebase_user = {
                'uid': 'dev-user',
                'email': 'dev@example.com',
                'email_verified': True,
                'name': 'Development User',
                'picture': None,
            }
            return None
            
        # Get the Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header:
            return JsonResponse({
                'error': 'Authorization header is required',
                'code': 'MISSING_AUTH_HEADER'
            }, status=401)
            
        # Extract the token from "Bearer <token>"
        try:
            token_type, token = auth_header.split(' ', 1)
            if token_type.lower() != 'bearer':
                raise ValueError("Invalid token type")
        except ValueError:
            return JsonResponse({
                'error': 'Invalid authorization header format. Use: Bearer <token>',
                'code': 'INVALID_AUTH_FORMAT'
            }, status=401)
            
        # Validate the Firebase token
        try:
            # Verify the ID token
            decoded_token = auth.verify_id_token(token)
            
            # Add user information to the request
            request.firebase_user = {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'email_verified': decoded_token.get('email_verified', False),
                'name': decoded_token.get('name'),
                'picture': decoded_token.get('picture'),
            }
            
            logging.info(f"Authenticated user: {request.firebase_user['email']}")
            return None
            
        except auth.InvalidIdTokenError:
            return JsonResponse({
                'error': 'Invalid or expired Firebase token',
                'code': 'INVALID_TOKEN'
            }, status=401)
        except auth.ExpiredIdTokenError:
            return JsonResponse({
                'error': 'Firebase token has expired',
                'code': 'EXPIRED_TOKEN'
            }, status=401)
        except Exception as e:
            logging.error(f"Firebase authentication error: {e}")
            return JsonResponse({
                'error': 'Authentication failed',
                'code': 'AUTH_FAILED'
            }, status=401)
            
    def process_response(self, request, response):
        """
        Process the response (optional cleanup).
        
        Args:
            request: Django HTTP request object
            response: Django HTTP response object
            
        Returns:
            The response object
        """
        return response