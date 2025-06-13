# AI Travel Itinerary Planner

A web application that generates personalized travel itineraries using AI and maintains a history of past requests.

## Tech Stack

### Frontend 
- React.js
- TailwindCSS for styling
- Axios for API calls

### Backend
- Django (Python)
- Django REST Framework
- SQLite database
- Google Gemini 1.5 API for itinerary generation

## Features
- Input destination and number of days
- AI-generated daily itineraries
- History view of past requests
- Responsive design
- Clean and intuitive UI

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn
- Google AI Studio API key

### Backend Setup
1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file in the backend directory with:
```
GOOGLE_API_KEY=your_api_key_here
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Start the server:
```bash
python manage.py runserver
```

### Frontend Setup
1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

## API Documentation

### Endpoints
- POST `/api/itinerary/`
  - Request body: `{ "destination": string, "days": number }`
  - Returns generated itinerary

- GET `/api/history/`
  - Returns list of past itinerary requests

## LLM Integration
This project uses Google's Gemini 1.5 API for generating travel itineraries. The API is accessed through Google AI Studio's free tier.

[Google AI Studio Documentation](https://ai.google.dev/docs/gemini_api_overview)

## Project Structure
```
ai-travel-itinerary-planner/
├── backend/
│   ├── travel_planner/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
``` 
