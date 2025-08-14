# Testing Implementation Guide

*A beginner-friendly guide to adding comprehensive testing to your Travel Itinerary Planner*

## 🎯 Why Testing Matters

Testing helps you:
- **Catch bugs early** before users find them
- **Prevent regressions** when adding new features
- **Document how your code should work**
- **Build confidence** when making changes
- **Improve code quality** through better design

---

## Phase 1: Backend Testing Setup (Django)

### 1. Install Testing Dependencies

```bash
cd backend
pip install pytest pytest-django pytest-cov factory-boy
```

Add to `requirements.txt`:
```
pytest>=7.4.0
pytest-django>=4.5.0
pytest-cov>=4.1.0
factory-boy>=3.3.0
```

### 2. Create pytest Configuration

Create `backend/pytest.ini`:
```ini
[tool:pytest]
DJANGO_SETTINGS_MODULE = travel_planner.settings
addopts = 
    --cov=travel_app
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
    -v
    --tb=short
python_files = tests.py test_*.py *_tests.py
python_classes = Test*
python_functions = test_*
```

### 3. Create Test Structure

```bash
cd backend
mkdir -p travel_app/tests
touch travel_app/tests/__init__.py
touch travel_app/tests/test_models.py
touch travel_app/tests/test_views.py
touch travel_app/tests/test_serializers.py
touch travel_app/tests/test_utils.py
touch travel_app/tests/factories.py
```

### 4. Create Test Factories

Create `backend/travel_app/tests/factories.py`:
```python
"""
Test factories for creating test data.
Factories help create consistent test objects.
"""

import factory
from django.contrib.auth.models import User
from travel_app.models import Itinerary

class UserFactory(factory.django.DjangoModelFactory):
    """
    Factory for creating test users.
    """
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f"testuser{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')

class ItineraryFactory(factory.django.DjangoModelFactory):
    """
    Factory for creating test itineraries.
    """
    class Meta:
        model = Itinerary
    
    destination = factory.Faker('city')
    days = factory.Faker('random_int', min=1, max=14)
    user_email = factory.LazyAttribute(lambda obj: f"user{factory.Faker('random_int', min=1, max=1000).generate()}@example.com")
    result = factory.Faker('text', max_nb_chars=500)
```

### 5. Write Model Tests

Create `backend/travel_app/tests/test_models.py`:
```python
"""
Tests for Django models.
These tests verify that our data models work correctly.
"""

import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from travel_app.models import Itinerary
from .factories import ItineraryFactory

class TestItineraryModel(TestCase):
    """
    Test cases for the Itinerary model.
    """
    
    def test_create_itinerary_success(self):
        """
        Test that we can create a valid itinerary.
        """
        # Create an itinerary using our factory
        itinerary = ItineraryFactory(
            destination="Paris",
            days=5,
            user_email="test@example.com"
        )
        
        # Verify it was created correctly
        self.assertEqual(itinerary.destination, "Paris")
        self.assertEqual(itinerary.days, 5)
        self.assertEqual(itinerary.user_email, "test@example.com")
        self.assertIsNotNone(itinerary.created_at)
    
    def test_itinerary_string_representation(self):
        """
        Test the string representation of an itinerary.
        """
        itinerary = ItineraryFactory(
            destination="Tokyo",
            days=7,
            user_email="user@example.com"
        )
        
        expected_str = f"Tokyo - 7 days (user@example.com)"
        self.assertEqual(str(itinerary), expected_str)
    
    def test_itinerary_ordering(self):
        """
        Test that itineraries are ordered by creation date (newest first).
        """
        # Create multiple itineraries
        old_itinerary = ItineraryFactory(destination="London")
        new_itinerary = ItineraryFactory(destination="Berlin")
        
        # Get all itineraries
        itineraries = Itinerary.objects.all()
        
        # Verify ordering (newest first)
        self.assertEqual(itineraries[0], new_itinerary)
        self.assertEqual(itineraries[1], old_itinerary)
    
    def test_invalid_days_validation(self):
        """
        Test that invalid days values are rejected.
        """
        # Test negative days
        with self.assertRaises(ValidationError):
            itinerary = Itinerary(
                destination="Paris",
                days=-1,
                user_email="test@example.com",
                result="Test result"
            )
            itinerary.full_clean()  # This triggers validation
        
        # Test zero days
        with self.assertRaises(ValidationError):
            itinerary = Itinerary(
                destination="Paris",
                days=0,
                user_email="test@example.com",
                result="Test result"
            )
            itinerary.full_clean()
    
    def test_filter_by_user_email(self):
        """
        Test filtering itineraries by user email.
        """
        # Create itineraries for different users
        user1_itinerary = ItineraryFactory(user_email="user1@example.com")
        user2_itinerary = ItineraryFactory(user_email="user2@example.com")
        
        # Filter by user1's email
        user1_itineraries = Itinerary.objects.filter(user_email="user1@example.com")
        
        # Verify only user1's itinerary is returned
        self.assertEqual(user1_itineraries.count(), 1)
        self.assertEqual(user1_itineraries.first(), user1_itinerary)
```

### 6. Write View Tests

Create `backend/travel_app/tests/test_views.py`:
```python
"""
Tests for Django views (API endpoints).
These tests verify that our API works correctly.
"""

import json
from unittest.mock import patch, Mock
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework import status
from travel_app.models import Itinerary
from .factories import ItineraryFactory

class TestItineraryView(TestCase):
    """
    Test cases for the Itinerary API view.
    """
    
    def setUp(self):
        """
        Set up test data before each test.
        """
        self.client = Client()
        self.url = reverse('itinerary')  # Adjust based on your URL name
        
        # Mock Firebase token verification
        self.mock_verify_token_patcher = patch('travel_app.middleware.auth.verify_id_token')
        self.mock_verify_token = self.mock_verify_token_patcher.start()
        self.mock_verify_token.return_value = {
            'email': 'test@example.com',
            'uid': 'test-uid-123'
        }
    
    def tearDown(self):
        """
        Clean up after each test.
        """
        self.mock_verify_token_patcher.stop()
    
    @patch('travel_app.views.ItineraryView.generate_itinerary')
    def test_create_itinerary_success(self, mock_generate):
        """
        Test successful itinerary creation.
        """
        # Mock the AI response
        mock_generate.return_value = "Day 1: Visit Eiffel Tower\nDay 2: Louvre Museum"
        
        # Prepare request data
        data = {
            'destination': 'Paris',
            'days': 3
        }
        
        # Make the request with authentication
        response = self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer fake-token'
        )
        
        # Verify response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify itinerary was saved to database
        itinerary = Itinerary.objects.get(destination='Paris')
        self.assertEqual(itinerary.days, 3)
        self.assertEqual(itinerary.user_email, 'test@example.com')
        
        # Verify AI function was called
        mock_generate.assert_called_once()
    
    def test_create_itinerary_missing_auth(self):
        """
        Test that requests without authentication are rejected.
        """
        data = {
            'destination': 'Paris',
            'days': 3
        }
        
        # Make request without authentication
        response = self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Should be unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_itinerary_invalid_destination(self):
        """
        Test validation of destination input.
        """
        data = {
            'destination': 'A',  # Too short
            'days': 3
        }
        
        response = self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer fake-token'
        )
        
        # Should be bad request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())
    
    def test_create_itinerary_invalid_days(self):
        """
        Test validation of days input.
        """
        test_cases = [
            {'days': 0, 'description': 'zero days'},
            {'days': -1, 'description': 'negative days'},
            {'days': 31, 'description': 'too many days'},
            {'days': 'invalid', 'description': 'non-numeric days'}
        ]
        
        for case in test_cases:
            with self.subTest(case=case['description']):
                data = {
                    'destination': 'Paris',
                    'days': case['days']
                }
                
                response = self.client.post(
                    self.url,
                    data=json.dumps(data),
                    content_type='application/json',
                    HTTP_AUTHORIZATION='Bearer fake-token'
                )
                
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class TestHistoryView(TestCase):
    """
    Test cases for the History API view.
    """
    
    def setUp(self):
        """
        Set up test data before each test.
        """
        self.client = Client()
        self.url = reverse('history')  # Adjust based on your URL name
        
        # Mock Firebase token verification
        self.mock_verify_token_patcher = patch('travel_app.middleware.auth.verify_id_token')
        self.mock_verify_token = self.mock_verify_token_patcher.start()
        self.mock_verify_token.return_value = {
            'email': 'test@example.com',
            'uid': 'test-uid-123'
        }
    
    def tearDown(self):
        """
        Clean up after each test.
        """
        self.mock_verify_token_patcher.stop()
    
    def test_get_user_itineraries(self):
        """
        Test retrieving user's itinerary history.
        """
        # Create test itineraries
        user_itinerary = ItineraryFactory(user_email='test@example.com')
        other_user_itinerary = ItineraryFactory(user_email='other@example.com')
        
        # Make request
        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION='Bearer fake-token'
        )
        
        # Verify response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify only user's itineraries are returned
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], user_itinerary.id)
    
    def test_get_history_no_auth(self):
        """
        Test that history requires authentication.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

### 7. Write Utility Tests

Create `backend/travel_app/tests/test_utils.py`:
```python
"""
Tests for utility functions.
These test our helper functions and validation logic.
"""

import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from travel_app.utils import (
    sanitize_destination,
    sanitize_days,
    create_safe_prompt
)

class TestInputSanitization(TestCase):
    """
    Test cases for input sanitization functions.
    """
    
    def test_sanitize_destination_valid(self):
        """
        Test sanitization of valid destinations.
        """
        test_cases = [
            ('paris', 'Paris'),
            ('new york', 'New York'),
            ('  tokyo  ', 'Tokyo'),
            ('san francisco, ca', 'San Francisco, Ca'),
            ('london-england', 'London-England')
        ]
        
        for input_dest, expected in test_cases:
            with self.subTest(input=input_dest):
                result = sanitize_destination(input_dest)
                self.assertEqual(result, expected)
    
    def test_sanitize_destination_invalid(self):
        """
        Test rejection of invalid destinations.
        """
        invalid_cases = [
            '',  # Empty
            '   ',  # Only whitespace
            'A',  # Too short
            'X' * 101,  # Too long
            'Paris123',  # Contains numbers
            'Paris@#$',  # Contains special characters
            'Paris\nLondon',  # Contains newline
        ]
        
        for invalid_dest in invalid_cases:
            with self.subTest(input=invalid_dest):
                with self.assertRaises(ValidationError):
                    sanitize_destination(invalid_dest)
    
    def test_sanitize_days_valid(self):
        """
        Test sanitization of valid days values.
        """
        test_cases = [
            (1, 1),
            ('5', 5),
            (30, 30),
            ('15', 15)
        ]
        
        for input_days, expected in test_cases:
            with self.subTest(input=input_days):
                result = sanitize_days(input_days)
                self.assertEqual(result, expected)
    
    def test_sanitize_days_invalid(self):
        """
        Test rejection of invalid days values.
        """
        invalid_cases = [
            0,  # Zero
            -1,  # Negative
            31,  # Too many
            'abc',  # Non-numeric
            None,  # None
            '',  # Empty string
        ]
        
        for invalid_days in invalid_cases:
            with self.subTest(input=invalid_days):
                with self.assertRaises(ValidationError):
                    sanitize_days(invalid_days)
    
    def test_create_safe_prompt(self):
        """
        Test creation of safe AI prompts.
        """
        destination = "Paris"
        days = 5
        
        prompt = create_safe_prompt(destination, days)
        
        # Verify prompt contains expected elements
        self.assertIn("5-day", prompt)
        self.assertIn("Paris", prompt)
        self.assertIn("travel itinerary", prompt.lower())
        
        # Verify it's a string
        self.assertIsInstance(prompt, str)
        self.assertGreater(len(prompt), 50)  # Should be substantial
```

### 8. Run Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage report
pytest --cov=travel_app --cov-report=html

# Run specific test file
pytest travel_app/tests/test_models.py

# Run specific test
pytest travel_app/tests/test_models.py::TestItineraryModel::test_create_itinerary_success
```

---

## Phase 2: Frontend Testing Setup (React)

### 1. Install Testing Dependencies

```bash
cd frontend
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event jest-environment-jsdom
```

### 2. Create Test Setup

Create `frontend/src/setupTests.ts`:
```typescript
// Setup file for Jest tests
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  })),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signOut: jest.fn(),
}));

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:8000';
```

### 3. Create Component Tests

Create `frontend/src/components/__tests__/ItineraryForm.test.tsx`:
```typescript
/**
 * Tests for ItineraryForm component.
 * These tests verify that the form works correctly.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItineraryForm from '../ItineraryForm';
import { AuthContext } from '../../contexts/AuthContext';

// Mock fetch
global.fetch = jest.fn();

// Mock user for testing
const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  getIdToken: jest.fn().mockResolvedValue('fake-token'),
} as any;

// Helper function to render component with auth context
const renderWithAuth = (user = mockUser) => {
  const mockAuthValue = {
    currentUser: user,
    loading: false,
  };
  
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <ItineraryForm />
    </AuthContext.Provider>
  );
};

describe('ItineraryForm', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  test('renders form elements correctly', () => {
    renderWithAuth();
    
    // Check that form elements are present
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/days/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });
  
  test('shows login message when user is not authenticated', () => {
    renderWithAuth(null); // No user
    
    const submitButton = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });
  
  test('validates destination input', async () => {
    const user = userEvent.setup();
    renderWithAuth();
    
    const destinationInput = screen.getByLabelText(/destination/i);
    const submitButton = screen.getByRole('button', { name: /generate/i });
    
    // Try to submit with empty destination
    await user.click(submitButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/destination is required/i)).toBeInTheDocument();
    });
  });
  
  test('validates days input', async () => {
    const user = userEvent.setup();
    renderWithAuth();
    
    const destinationInput = screen.getByLabelText(/destination/i);
    const daysInput = screen.getByLabelText(/days/i);
    const submitButton = screen.getByRole('button', { name: /generate/i });
    
    // Fill in valid destination but invalid days
    await user.type(destinationInput, 'Paris');
    await user.clear(daysInput);
    await user.type(daysInput, '0');
    await user.click(submitButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/days must be between 1 and 30/i)).toBeInTheDocument();
    });
  });
  
  test('submits form successfully', async () => {
    const user = userEvent.setup();
    
    // Mock successful API response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'Day 1: Visit Eiffel Tower' }),
    });
    
    renderWithAuth();
    
    const destinationInput = screen.getByLabelText(/destination/i);
    const daysInput = screen.getByLabelText(/days/i);
    const submitButton = screen.getByRole('button', { name: /generate/i });
    
    // Fill in form
    await user.type(destinationInput, 'Paris');
    await user.clear(daysInput);
    await user.type(daysInput, '3');
    
    // Submit form
    await user.click(submitButton);
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/itinerary/',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token',
          }),
          body: JSON.stringify({
            destination: 'Paris',
            days: 3,
          }),
        })
      );
    });
    
    // Verify result is displayed
    await waitFor(() => {
      expect(screen.getByText(/Day 1: Visit Eiffel Tower/)).toBeInTheDocument();
    });
  });
  
  test('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });
    
    renderWithAuth();
    
    const destinationInput = screen.getByLabelText(/destination/i);
    const daysInput = screen.getByLabelText(/days/i);
    const submitButton = screen.getByRole('button', { name: /generate/i });
    
    // Fill and submit form
    await user.type(destinationInput, 'Paris');
    await user.clear(daysInput);
    await user.type(daysInput, '3');
    await user.click(submitButton);
    
    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });
  
  test('shows loading state during submission', async () => {
    const user = userEvent.setup();
    
    // Mock delayed API response
    (fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ result: 'Test result' }),
      }), 100))
    );
    
    renderWithAuth();
    
    const destinationInput = screen.getByLabelText(/destination/i);
    const daysInput = screen.getByLabelText(/days/i);
    const submitButton = screen.getByRole('button', { name: /generate/i });
    
    // Fill and submit form
    await user.type(destinationInput, 'Paris');
    await user.clear(daysInput);
    await user.type(daysInput, '3');
    await user.click(submitButton);
    
    // Verify loading state
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/test result/i)).toBeInTheDocument();
    }, { timeout: 200 });
  });
});
```

### 4. Create Context Tests

Create `frontend/src/contexts/__tests__/AuthContext.test.tsx`:
```typescript
/**
 * Tests for AuthContext.
 * These tests verify that authentication state management works correctly.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../AuthContext';

// Mock Firebase auth
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
};

jest.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
  onAuthStateChanged: (auth: any, callback: any) => {
    mockAuth.onAuthStateChanged = callback;
    return jest.fn(); // Unsubscribe function
  },
}));

// Test component that uses AuthContext
const TestComponent: React.FC = () => {
  const { currentUser, loading } = React.useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;
  if (currentUser) return <div>User: {currentUser.email}</div>;
  return <div>No user</div>;
};

describe('AuthContext', () => {
  test('provides initial loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  test('provides user when authenticated', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    };
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Simulate user authentication
    mockAuth.onAuthStateChanged(mockUser);
    
    await waitFor(() => {
      expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    });
  });
  
  test('provides no user when not authenticated', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Simulate no user
    mockAuth.onAuthStateChanged(null);
    
    await waitFor(() => {
      expect(screen.getByText('No user')).toBeInTheDocument();
    });
  });
});
```

### 5. Run Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test ItineraryForm.test.tsx
```

---

## Phase 3: Integration Testing

### 1. Create End-to-End Test

Create `backend/travel_app/tests/test_integration.py`:
```python
"""
Integration tests that test the full flow.
These tests verify that frontend and backend work together.
"""

import json
from unittest.mock import patch
from django.test import TestCase, Client
from django.urls import reverse
from travel_app.models import Itinerary

class TestFullItineraryFlow(TestCase):
    """
    Test the complete itinerary creation flow.
    """
    
    def setUp(self):
        self.client = Client()
        
        # Mock Firebase authentication
        self.mock_verify_token_patcher = patch('travel_app.middleware.auth.verify_id_token')
        self.mock_verify_token = self.mock_verify_token_patcher.start()
        self.mock_verify_token.return_value = {
            'email': 'integration@example.com',
            'uid': 'integration-uid-123'
        }
    
    def tearDown(self):
        self.mock_verify_token_patcher.stop()
    
    @patch('travel_app.views.ItineraryView.generate_itinerary')
    def test_complete_itinerary_workflow(self, mock_generate):
        """
        Test the complete workflow from creation to retrieval.
        """
        # Mock AI response
        mock_itinerary = "Day 1: Arrive in Tokyo\nDay 2: Visit temples\nDay 3: Shopping"
        mock_generate.return_value = mock_itinerary
        
        # Step 1: Create an itinerary
        create_url = reverse('itinerary')
        create_data = {
            'destination': 'Tokyo',
            'days': 3
        }
        
        create_response = self.client.post(
            create_url,
            data=json.dumps(create_data),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer fake-token'
        )
        
        # Verify creation was successful
        self.assertEqual(create_response.status_code, 201)
        self.assertIn('result', create_response.json())
        
        # Verify itinerary was saved to database
        itinerary = Itinerary.objects.get(destination='Tokyo')
        self.assertEqual(itinerary.user_email, 'integration@example.com')
        self.assertEqual(itinerary.days, 3)
        
        # Step 2: Retrieve user's history
        history_url = reverse('history')
        history_response = self.client.get(
            history_url,
            HTTP_AUTHORIZATION='Bearer fake-token'
        )
        
        # Verify history retrieval
        self.assertEqual(history_response.status_code, 200)
        history_data = history_response.json()
        self.assertEqual(len(history_data), 1)
        self.assertEqual(history_data[0]['destination'], 'Tokyo')
        self.assertEqual(history_data[0]['days'], 3)
        
        # Step 3: Create another itinerary for the same user
        create_data_2 = {
            'destination': 'Paris',
            'days': 5
        }
        
        create_response_2 = self.client.post(
            create_url,
            data=json.dumps(create_data_2),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer fake-token'
        )
        
        self.assertEqual(create_response_2.status_code, 201)
        
        # Step 4: Verify updated history
        history_response_2 = self.client.get(
            history_url,
            HTTP_AUTHORIZATION='Bearer fake-token'
        )
        
        history_data_2 = history_response_2.json()
        self.assertEqual(len(history_data_2), 2)
        
        # Verify ordering (newest first)
        self.assertEqual(history_data_2[0]['destination'], 'Paris')
        self.assertEqual(history_data_2[1]['destination'], 'Tokyo')
```

---

## Phase 4: Test Automation

### 1. Create GitHub Actions Workflow

Create `.github/workflows/test.yml`:
```yaml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run backend tests
      run: |
        cd backend
        pytest --cov=travel_app --cov-report=xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml
        flags: backend
  
  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./frontend/coverage/lcov.info
        flags: frontend
```

### 2. Create Test Scripts

Add to `package.json` (frontend):
```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:ci": "CI=true react-scripts test --coverage --watchAll=false"
  }
}
```

Create `backend/test.sh`:
```bash
#!/bin/bash
# Backend testing script

echo "🧪 Running backend tests..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run tests with coverage
echo "🔍 Running tests with coverage..."
pytest --cov=travel_app --cov-report=html --cov-report=term-missing

echo "✅ Backend tests complete!"
echo "📊 Coverage report available at htmlcov/index.html"
```

Create `frontend/test.sh`:
```bash
#!/bin/bash
# Frontend testing script

echo "🧪 Running frontend tests..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests with coverage
echo "🔍 Running tests with coverage..."
npm run test:coverage

echo "✅ Frontend tests complete!"
echo "📊 Coverage report available at coverage/lcov-report/index.html"
```

---

## Running All Tests

### Quick Test Commands

```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd frontend && npm test -- --watchAll=false

# Both with coverage
cd backend && pytest --cov=travel_app
cd frontend && npm run test:coverage
```

### Test Coverage Goals

- **Backend**: Aim for 80%+ coverage
- **Frontend**: Aim for 70%+ coverage
- **Critical paths**: 100% coverage (authentication, data validation)

---

## Next Steps

1. **Start with backend tests** - They're easier to write and debug
2. **Add tests gradually** - Don't try to test everything at once
3. **Focus on critical functionality** - Authentication, data validation, API endpoints
4. **Use TDD for new features** - Write tests first, then implement
5. **Set up CI/CD** - Automate testing on every commit

Remember: Good tests are your safety net when refactoring and adding new features!