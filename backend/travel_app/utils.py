import re
import logging
from typing import Union, Optional

def sanitize_destination(destination: str) -> str:
    """
    Sanitize destination input to prevent injection attacks.
    
    This function:
    1. Removes potentially harmful characters
    2. Limits length to reasonable bounds
    3. Validates format for destination names
    
    Args:
        destination (str): Raw destination input from user
        
    Returns:
        str: Sanitized destination string
        
    Raises:
        ValueError: If destination is invalid or too long
    """
    if not destination or not isinstance(destination, str):
        raise ValueError("Destination must be a non-empty string")
    
    # Remove leading/trailing whitespace
    destination = destination.strip()
    
    # Check length limits (reasonable for city/country names)
    if len(destination) > 100:
        raise ValueError("Destination name is too long (max 100 characters)")
    
    if len(destination) < 2:
        raise ValueError("Destination name is too short (min 2 characters)")
    
    # Allow only letters, numbers, spaces, hyphens, apostrophes, and common punctuation
    # This prevents injection of special characters while allowing legitimate place names
    allowed_pattern = r"^[a-zA-Z0-9\s\-'.,()]+$"
    
    if not re.match(allowed_pattern, destination):
        raise ValueError("Destination contains invalid characters. Only letters, numbers, spaces, hyphens, apostrophes, and basic punctuation are allowed.")
    
    # Remove excessive whitespace and normalize
    destination = re.sub(r'\s+', ' ', destination)
    
    # Log the sanitized input for monitoring
    logging.info(f"Sanitized destination: {destination}")
    
    return destination

def sanitize_days(days: Union[str, int]) -> int:
    """
    Sanitize and validate the number of days for itinerary.
    
    Args:
        days (Union[str, int]): Number of days (can be string or int)
        
    Returns:
        int: Validated number of days
        
    Raises:
        ValueError: If days is invalid or out of reasonable range
    """
    try:
        # Convert to integer if it's a string
        if isinstance(days, str):
            days = int(days.strip())
        elif not isinstance(days, int):
            raise ValueError("Days must be a number")
            
    except (ValueError, TypeError):
        raise ValueError("Days must be a valid number")
    
    # Validate reasonable range for travel days
    if days < 1:
        raise ValueError("Number of days must be at least 1")
    
    if days > 30:
        raise ValueError("Number of days cannot exceed 30 (for reasonable itinerary planning)")
    
    logging.info(f"Sanitized days: {days}")
    
    return days

def create_safe_prompt(destination: str, days: int) -> str:
    """
    Create a safe prompt for the AI API by using sanitized inputs.
    
    This function creates a structured prompt that:
    1. Uses only sanitized inputs
    2. Follows a safe template format
    3. Prevents prompt injection by not allowing user input to modify the prompt structure
    
    Args:
        destination (str): Sanitized destination
        days (int): Sanitized number of days
        
    Returns:
        str: Safe prompt for AI API
    """
    # Use a safe template that doesn't allow user input to modify the prompt structure
    safe_prompt = f"""
Create a detailed travel itinerary for the following specifications:

Destination: {destination}
Duration: {days} days

Please provide:
1. Daily activities and attractions
2. Recommended restaurants for each day
3. Transportation suggestions
4. Estimated costs
5. Important travel tips

Format the response as a structured itinerary with clear day-by-day breakdown.
"""
    
    # Log the prompt creation for monitoring
    logging.info(f"Created safe prompt for destination: {destination}, days: {days}")
    
    return safe_prompt

def validate_email_ownership(request_email: str, authenticated_email: str) -> bool:
    """
    Validate that the user is requesting data for their own email.
    
    Args:
        request_email (str): Email from the request
        authenticated_email (str): Email from Firebase authentication
        
    Returns:
        bool: True if emails match, False otherwise
    """
    if not request_email or not authenticated_email:
        return False
        
    # Normalize emails for comparison (lowercase, strip whitespace)
    request_email = request_email.strip().lower()
    authenticated_email = authenticated_email.strip().lower()
    
    return request_email == authenticated_email

def sanitize_user_input(data: dict) -> dict:
    """
    Sanitize all user inputs in a request data dictionary.
    
    Args:
        data (dict): Request data containing user inputs
        
    Returns:
        dict: Sanitized data
        
    Raises:
        ValueError: If any input fails validation
    """
    sanitized_data = {}
    
    # Sanitize destination if present
    if 'destination' in data:
        sanitized_data['destination'] = sanitize_destination(data['destination'])
    
    # Sanitize days if present
    if 'days' in data:
        sanitized_data['days'] = sanitize_days(data['days'])
    
    # Copy other safe fields (add more as needed)
    safe_fields = ['user_email']  # This will be validated separately
    for field in safe_fields:
        if field in data:
            sanitized_data[field] = data[field]
    
    return sanitized_data