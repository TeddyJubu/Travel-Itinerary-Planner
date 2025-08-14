# API Reference

## Backend API Endpoints

### Base URL
- **Development**: `http://localhost:8000/api`
- **Production**: `https://ai-travel-itinerary-planner.onrender.com/api`

---

## Public Functions/Methods

### 1. Create Itinerary

**Endpoint**: `POST /itinerary/`

**Purpose**: Generate a new AI-powered travel itinerary

**Request Headers**:
```http
Content-Type: application/json
```

**Parameters**:
- `destination` (string, required): Travel destination name
  - Constraints: Max 100 characters
  - Example: "Tokyo, Japan"
- `days` (integer, required): Number of travel days
  - Constraints: Minimum 1, maximum not specified
  - Example: 7
- `user_email` (string, required): User's email address
  - Constraints: Valid email format
  - Example: "user@example.com"

**Request Body Example**:
```json
{
  "destination": "Paris, France",
  "days": 5,
  "user_email": "traveler@email.com"
}
```

**Response (201 Created)**:
```json
{
  "id": 123,
  "destination": "Paris, France",
  "days": 5,
  "result": "# 5-Day Paris Itinerary\n\n## Day 1: Arrival and City Center...\n",
  "created_at": "2024-01-15T10:30:00Z",
  "user_email": "traveler@email.com"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input data
```json
{
  "destination": ["This field is required."],
  "days": ["Ensure this value is greater than or equal to 1."]
}
```
- `500 Internal Server Error`: AI API failure
```json
{
  "error": "Failed to generate itinerary",
  "details": "GROQ API error message"
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/itinerary/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    destination: 'Tokyo, Japan',
    days: 7,
    user_email: 'user@example.com'
  })
});

const itinerary = await response.json();
```

---

### 2. Get User History

**Endpoint**: `GET /history/`

**Purpose**: Retrieve all itineraries for a specific user

**Query Parameters**:
- `user_email` (string, required): User's email address
  - Example: `?user_email=user@example.com`

**Request Example**:
```http
GET /api/history/?user_email=traveler@email.com
```

**Response (200 OK)**:
```json
[
  {
    "id": 123,
    "destination": "Paris, France",
    "days": 5,
    "result": "# 5-Day Paris Itinerary...",
    "created_at": "2024-01-15T10:30:00Z",
    "user_email": "traveler@email.com"
  },
  {
    "id": 124,
    "destination": "Tokyo, Japan",
    "days": 7,
    "result": "# 7-Day Tokyo Itinerary...",
    "created_at": "2024-01-10T14:20:00Z",
    "user_email": "traveler@email.com"
  }
]
```

**Error Responses**:
- `400 Bad Request`: Missing user_email parameter
```json
{
  "error": "user_email is required"
}
```

**Usage Example**:
```javascript
const response = await fetch(`/api/history/?user_email=${encodeURIComponent(userEmail)}`);
const itineraries = await response.json();
```

---

## Frontend API Functions

### Authentication Context

#### `useAuth()` Hook

**Purpose**: Access authentication state and methods

**Returns**:
```typescript
interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  loading: boolean;
}
```

**Usage Example**:
```typescript
const { currentUser, login, logout, loading } = useAuth();

// Login
try {
  await login(email, password);
  // User logged in successfully
} catch (error) {
  // Handle login error
}

// Logout
await logout();
```

#### `login(email, password)`

**Parameters**:
- `email` (string): User's email address
- `password` (string): User's password

**Returns**: `Promise<UserCredential>`

**Exceptions**:
- Firebase authentication errors
- Network errors

#### `signup(email, password)`

**Parameters**:
- `email` (string): User's email address
- `password` (string): User's password (min 6 characters)

**Returns**: `Promise<UserCredential>`

**Exceptions**:
- Firebase authentication errors
- Weak password errors
- Email already in use errors

#### `signInWithGoogle()`

**Parameters**: None

**Returns**: `Promise<UserCredential>`

**Exceptions**:
- Google authentication errors
- Popup blocked errors

---

## Internal APIs

### Django Models

#### `Itinerary` Model

**Fields**:
- `id`: AutoField (Primary Key)
- `destination`: CharField(max_length=100)
- `days`: PositiveIntegerField
- `result`: TextField
- `created_at`: DateTimeField(auto_now_add=True)
- `user_email`: EmailField(max_length=255, null=True, blank=True)

**Methods**:
- `__str__()`: Returns formatted string representation

**Usage Example**:
```python
# Create new itinerary
itinerary = Itinerary.objects.create(
    destination="Rome, Italy",
    days=4,
    result="Generated itinerary content...",
    user_email="user@example.com"
)

# Query user's itineraries
user_itineraries = Itinerary.objects.filter(
    user_email="user@example.com"
).order_by('-created_at')
```

### Serializers

#### `ItinerarySerializer`

**Purpose**: Serialize Itinerary model for API responses

**Fields**: `['id', 'destination', 'days', 'result', 'created_at', 'user_email']`

#### `ItineraryCreateSerializer`

**Purpose**: Validate input for itinerary creation

**Fields**:
- `destination`: CharField(max_length=100)
- `days`: IntegerField(min_value=1)
- `user_email`: EmailField()

---

## Event System

### Frontend Events

#### Authentication Events
- `onAuthStateChanged`: Firebase auth state changes
- Handled automatically by AuthContext

#### Component Events
- Form submissions
- PDF generation events
- Modal open/close events

### Backend Events
- No custom event system implemented
- Standard Django request/response cycle

---

## Hooks/Callbacks

### React Hooks Used

#### `useState`
- Form data management
- Loading states
- Error handling

#### `useEffect`
- Data fetching on component mount
- Authentication state monitoring

#### `useContext`
- Authentication context access

#### `useRef`
- PDF export DOM references

### Custom Hooks

#### `useAuth()`
- Provides authentication context
- Throws error if used outside AuthProvider

**Usage Example**:
```typescript
function MyComponent() {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <div>Please log in</div>;
  
  return <div>Welcome, {currentUser.email}!</div>;
}
```

---

## Error Handling

### Backend Error Responses

#### Validation Errors (400)
```json
{
  "field_name": ["Error message"]
}
```

#### Server Errors (500)
```json
{
  "error": "Error description",
  "details": "Detailed error information"
}
```

### Frontend Error Handling

#### API Call Errors
```typescript
try {
  const response = await axios.post('/api/itinerary/', data);
  setResult(response.data.result);
} catch (error) {
  setError('Failed to generate itinerary. Please try again.');
  console.error(error);
}
```

#### Authentication Errors
```typescript
try {
  await login(email, password);
} catch (error) {
  if (error.code === 'auth/user-not-found') {
    setError('No account found with this email.');
  } else if (error.code === 'auth/wrong-password') {
    setError('Incorrect password.');
  } else {
    setError('Login failed. Please try again.');
  }
}
```

---

## Rate Limits and Quotas

### GROQ API Limits
- **Rate Limit**: Varies by plan
- **Token Limit**: 2000 tokens per request (configured)
- **Cost**: Pay-per-token pricing

### Firebase Limits
- **Authentication**: 10,000 verifications/month (free tier)
- **Concurrent Connections**: 100 (free tier)

### Recommendations
- Implement request caching for repeated destinations
- Add user rate limiting to prevent abuse
- Monitor API usage and costs