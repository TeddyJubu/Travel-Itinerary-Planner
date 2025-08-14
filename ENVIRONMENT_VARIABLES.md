# Environment Variables Documentation

This document provides a comprehensive guide to all environment variables used in the Travel Itinerary Planner application. All sensitive credentials and API keys have been moved to `.env` files for security.

## 🔒 Security Notice

**IMPORTANT**: Never commit `.env` files to version control! They contain sensitive information that should be kept private.

## 📁 File Structure

```
├── .env.example              # Root example file with all variables
├── backend/
│   ├── .env                  # Backend environment variables (DO NOT COMMIT)
│   └── .env.example          # Backend example file
└── frontend/
    ├── .env                  # Frontend environment variables (DO NOT COMMIT)
    └── .env.example          # Frontend example file
```

## 🚀 Quick Setup

1. Copy the example files:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Fill in your actual values in each `.env` file
3. Never commit `.env` files to version control

## 🔧 Backend Environment Variables

### Django Configuration

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `SECRET_KEY` | Django's cryptographic signing key | `django-insecure-abc123...` | ✅ |
| `DEBUG` | Enable/disable debug mode | `True` or `False` | ✅ |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed hostnames | `localhost,127.0.0.1,[::1]` | ✅ |

**Security Notes:**
- Generate a new `SECRET_KEY` for production using [djecrety.ir](https://djecrety.ir/)
- Set `DEBUG=False` in production
- Configure `DJANGO_ALLOWED_HOSTS` with your actual domain names

### Database Configuration

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `SQL_ENGINE` | Database backend engine | `django.db.backends.postgresql` | ✅ |
| `SQL_DATABASE` | Database name | `travel_planner` | ✅ |
| `SQL_USER` | Database username | `postgres` | ✅ |
| `SQL_PASSWORD` | Database password | `your-secure-password` | ✅ |
| `SQL_HOST` | Database host | `db` (Docker) or `localhost` | ✅ |
| `SQL_PORT` | Database port | `5432` | ✅ |
| `POSTGRES_DB` | PostgreSQL database name | `travel_planner` | ✅ |
| `POSTGRES_USER` | PostgreSQL username | `postgres` | ✅ |
| `POSTGRES_PASSWORD` | PostgreSQL password | `your-secure-password` | ✅ |

**Security Notes:**
- Use strong, unique passwords for database access
- In production, use managed database services when possible
- Ensure database connections are encrypted

### AI/ML API Keys

| Variable | Purpose | Where to Get | Required |
|----------|---------|--------------|----------|
| `GROQ_API_KEY` | AI-powered itinerary generation | [Groq Console](https://console.groq.com/) | ✅ |

**Security Notes:**
- Keep API keys confidential and rotate them regularly
- Monitor API usage to detect unauthorized access
- Use API key restrictions when available

## 🎨 Frontend Environment Variables

### Firebase Configuration

| Variable | Purpose | Where to Get | Required |
|----------|---------|--------------|----------|
| `REACT_APP_FIREBASE_API_KEY` | Firebase SDK authentication | [Firebase Console](https://console.firebase.google.com/) | ✅ |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain | Firebase Console | ✅ |
| `REACT_APP_FIREBASE_PROJECT_ID` | Unique Firebase project identifier | Firebase Console | ✅ |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Cloud storage bucket | Firebase Console | ✅ |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging | Firebase Console | ✅ |
| `REACT_APP_FIREBASE_APP_ID` | Unique Firebase app identifier | Firebase Console | ✅ |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | Google Analytics integration | Firebase Console | ❌ |

**Security Notes:**
- Firebase API keys are safe to expose in client-side code
- Configure Firebase security rules to protect your data
- Enable Firebase App Check for additional security

### API Configuration

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `REACT_APP_API_URL` | Backend API server URL | `http://localhost:8000/api` | ✅ |

### Development Configuration

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `CHOKIDAR_USEPOLLING` | Enable file watching polling | `true` | ❌ |
| `WATCHPACK_POLLING` | Enable Webpack polling | `true` | ❌ |

## 🐳 Docker Configuration

The `docker-compose.yml` file has been updated to use environment variables:

- Variables are loaded from `.env` files using `env_file` directive
- Default values are provided using `${VARIABLE:-default}` syntax
- Sensitive values are never hardcoded in the compose file

## 🔍 How to Get API Keys

### Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key to your `.env` file

### Firebase Configuration
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings > General
4. Scroll down to "Your apps" section
5. Click on the web app or create a new one
6. Copy the configuration values to your `.env` file

## 🛡️ Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong, unique passwords** for all services
3. **Rotate API keys regularly** and monitor usage
4. **Use environment-specific configurations** (dev, staging, prod)
5. **Enable two-factor authentication** on all service accounts
6. **Monitor logs** for suspicious activity
7. **Use managed services** in production when possible

## 🚨 Troubleshooting

### Common Issues

1. **"Environment variable not found" errors**
   - Ensure `.env` files exist in correct locations
   - Check variable names match exactly (case-sensitive)
   - Restart the application after adding new variables

2. **Firebase authentication errors**
   - Verify all Firebase configuration values
   - Check Firebase project settings
   - Ensure Firebase rules allow your operations

3. **Database connection errors**
   - Verify database credentials
   - Ensure database server is running
   - Check network connectivity

4. **API key errors**
   - Verify API keys are valid and active
   - Check API usage limits
   - Ensure proper permissions are set

### Getting Help

If you encounter issues:
1. Check this documentation first
2. Verify all environment variables are set correctly
3. Check application logs for specific error messages
4. Consult the service documentation (Firebase, Groq, etc.)

## 📝 Example Values

For development and testing, you can use the actual values provided in the `.env` files created during setup. For production, ensure you:

1. Generate new secret keys
2. Use production database credentials
3. Configure proper allowed hosts
4. Set debug mode to false
5. Use production-grade API keys

---

**Remember**: Security is paramount. Always follow best practices and never expose sensitive credentials in your code or version control system.