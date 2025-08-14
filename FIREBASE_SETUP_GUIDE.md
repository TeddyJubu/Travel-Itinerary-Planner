# Firebase Authentication Setup Guide

This guide will help you set up Firebase authentication for the Travel Itinerary Planner application.

## Prerequisites

- Firebase project created at [Firebase Console](https://console.firebase.google.com/)
- Node.js and Python installed
- Basic understanding of Firebase concepts

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "travel-itinerary-planner")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication

1. In your Firebase project, go to **Authentication** > **Sign-in method**
2. Enable the following sign-in providers:
   - **Email/Password**: Click and toggle "Enable"
   - **Google**: Click, toggle "Enable", and configure OAuth consent
3. Click "Save"

### 1.3 Configure Authorized Domains

1. In **Authentication** > **Settings** > **Authorized domains**
2. Add your domains:
   - `localhost` (for development)
   - Your production domain (when deploying)

## Step 2: Backend Configuration

### 2.1 Create Service Account

1. Go to **Project Settings** (gear icon) > **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Rename it to `firebase-service-account.json`
5. Place it in the `backend/` directory

**⚠️ SECURITY WARNING**: Never commit this file to version control!

### 2.2 Configure Backend Environment

1. Copy the environment template:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` file:
   ```env
   # Firebase Configuration
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   
   # Other required variables
   SECRET_KEY=your-django-secret-key-here
   GROQ_API_KEY=your-groq-api-key-here
   DEBUG=True
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,[::1]
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

### 2.3 Install Dependencies

```bash
cd backend
pip3 install -r requirements.txt
```

### 2.4 Test Backend Setup

```bash
# Run migrations
python3 manage.py migrate

# Start development server
python3 manage.py runserver
```

The server should start without Firebase-related errors.

## Step 3: Frontend Configuration

### 3.1 Get Firebase Config

1. In Firebase Console, go to **Project Settings** > **General**
2. Scroll down to "Your apps" section
3. Click "Web app" icon (`</>`)
4. Register your app (name: "Travel Itinerary Frontend")
5. Copy the Firebase configuration object

### 3.2 Configure Frontend Environment

1. Create environment file:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your Firebase config:
   ```env
   # Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   
   # API Configuration
   REACT_APP_API_URL=http://localhost:8000/api
   ```

### 3.3 Update Firebase Configuration

Check that `frontend/src/firebase.ts` uses environment variables:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
```

### 3.4 Install Dependencies and Start

```bash
cd frontend
npm install
npm start
```

## Step 4: Testing the Setup

### 4.1 Test User Registration

1. Open frontend at `http://localhost:3000`
2. Go to Sign Up page
3. Create a new account with email/password
4. Verify you can log in

### 4.2 Test API Authentication

1. Log in to the frontend
2. Try creating a new itinerary
3. Check browser Network tab - requests should include `Authorization: Bearer <token>`
4. Verify itinerary is created and saved

### 4.3 Test History Retrieval

1. Go to History page
2. Verify your itineraries are displayed
3. Check that only your itineraries are shown

## Step 5: Production Deployment

### 5.1 Backend Production Settings

```env
# Production .env
DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECRET_KEY=your-production-secret-key
```

### 5.2 Frontend Production Settings

```env
# Production .env.production
REACT_APP_API_URL=https://api.yourdomain.com
# ... other Firebase config remains the same
```

### 5.3 Firebase Production Setup

1. Add production domains to Firebase **Authorized domains**
2. Update CORS settings in your hosting provider
3. Ensure HTTPS is enabled

## Troubleshooting

### Common Issues

#### "Firebase service account not found"
- Ensure `firebase-service-account.json` is in the correct location
- Check file permissions
- Verify the path in `.env` file

#### "Authentication failed" errors
- Check Firebase project ID matches
- Verify service account has correct permissions
- Ensure clock synchronization on server

#### CORS errors
- Add frontend domain to `CORS_ALLOWED_ORIGINS`
- Check Firebase authorized domains
- Verify API URL in frontend environment

#### "Invalid token" errors
- Check token expiration (tokens expire after 1 hour)
- Verify Firebase project configuration
- Ensure consistent project ID across frontend/backend

### Debug Commands

```bash
# Check Django logs
tail -f backend/logs/django.log

# Test Firebase connection
python backend/manage.py shell
>>> import firebase_admin
>>> print(firebase_admin.get_app())

# Check frontend Firebase config
console.log(process.env.REACT_APP_FIREBASE_PROJECT_ID)
```

## Security Best Practices

1. **Never commit secrets**: Add `.env` and `firebase-service-account.json` to `.gitignore`
2. **Use environment variables**: Never hardcode API keys
3. **Restrict API keys**: Configure Firebase API key restrictions
4. **Enable security rules**: Set up Firestore security rules if using database
5. **Monitor usage**: Set up Firebase usage alerts
6. **Regular rotation**: Rotate service account keys periodically

## Next Steps

After completing this setup:

1. **Add user profiles**: Extend user model with additional fields
2. **Implement email verification**: Enable email verification in Firebase
3. **Add password reset**: Implement forgot password functionality
4. **Set up monitoring**: Add error tracking and analytics
5. **Write tests**: Create integration tests for authentication flow

## Support

If you encounter issues:

1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Review the [Django Firebase Admin SDK docs](https://firebase.google.com/docs/admin/setup)
3. Check the project's GitHub issues
4. Ensure all dependencies are up to date

---

**Remember**: This setup enables secure, token-based authentication that scales with your application. The backend validates every request using Firebase tokens, ensuring only authenticated users can access their data.