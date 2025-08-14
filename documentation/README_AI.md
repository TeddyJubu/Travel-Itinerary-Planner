# Project: AI Travel Itinerary Planner

## Purpose
A full-stack web application that generates personalized travel itineraries using AI (GROQ API) and maintains user-specific history. The application provides detailed day-by-day travel plans with activities, timings, cost estimates, and local recommendations.

## Architecture Overview
**Pattern**: Client-Server Architecture with Microservices approach
- **Frontend**: React.js SPA with TypeScript
- **Backend**: Django REST API
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: Firebase Auth
- **AI Service**: GROQ API (Meta LLaMA model)
- **Deployment**: Docker containerization

## Key Components

### Frontend (React + TypeScript)
- **Authentication System**: Firebase-based user management
- **Itinerary Generator**: Form-based AI itinerary creation
- **History Management**: User-specific itinerary viewing and management
- **PDF Export**: HTML-to-PDF conversion functionality
- **Responsive UI**: TailwindCSS with dark theme

### Backend (Django REST Framework)
- **API Endpoints**: RESTful services for itinerary CRUD operations
- **AI Integration**: GROQ API client for itinerary generation
- **User Management**: Email-based user identification
- **Data Persistence**: PostgreSQL/SQLite database storage

## Data Flow
1. **User Authentication**: Firebase handles login/signup
2. **Itinerary Request**: Frontend sends destination + days to Django API
3. **AI Processing**: Django calls GROQ API with structured prompt
4. **Data Storage**: Generated itinerary saved with user email
5. **Response**: Formatted itinerary returned to frontend
6. **History Access**: Users can view/export past itineraries

## External Dependencies

### AI Service
- **GROQ API**: Meta LLaMA-4-Scout model for itinerary generation
- **Rate Limits**: Subject to GROQ API limitations
- **Cost**: Pay-per-token pricing model

### Authentication
- **Firebase Auth**: Google OAuth and email/password authentication
- **Security**: JWT token-based session management

### Infrastructure
- **Docker**: Containerized deployment
- **PostgreSQL**: Production database
- **Nginx**: Frontend serving (production)

## Quick Start Guide

### Prerequisites
- Docker and Docker Compose
- GROQ API key
- Firebase project configuration

### Environment Setup
1. Clone repository
2. Set environment variables:
   - `GROQ_API_KEY`: Your GROQ API key
   - Firebase config in `frontend/src/firebase.ts`
3. Run `docker-compose up`
4. Access application at `http://localhost:3000`

### Development Mode
```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm start
```

## Security Considerations
- Firebase API keys exposed in frontend (standard practice)
- GROQ API key properly secured in backend environment
- CORS configured for specific origins
- No sensitive data in version control

## Performance Characteristics
- **AI Response Time**: 2-5 seconds (GROQ API dependent)
- **Database Queries**: Simple CRUD operations, minimal optimization needed
- **Frontend Bundle**: ~2MB (React + dependencies)
- **Concurrent Users**: Limited by GROQ API rate limits

## Known Limitations
- No user authentication integration between Firebase and Django
- Limited error handling for AI API failures
- No caching mechanism for repeated requests
- PDF export quality depends on browser rendering