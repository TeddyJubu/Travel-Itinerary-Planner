# Performance Optimization Opportunities

## Algorithm Improvements

### Frontend Bundle Optimization
```javascript
// Current: Large bundle without code splitting
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import History from './components/History';

// Suggested: Lazy loading with code splitting
import { lazy, Suspense } from 'react';
const Home = lazy(() => import('./components/Home'));
const History = lazy(() => import('./components/History'));

// Wrap routes in Suspense
<Suspense fallback={<div>Loading...</div>}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/history" element={<History />} />
  </Routes>
</Suspense>
```

### PDF Generation Optimization
```javascript
// Current: Synchronous PDF generation blocks UI
const exportToPDF = () => {
  const element = document.getElementById('itinerary-content');
  html2pdf().from(element).save();
};

// Suggested: Asynchronous with progress indicator
const exportToPDF = async () => {
  setExporting(true);
  try {
    const element = document.getElementById('itinerary-content');
    await html2pdf().from(element).save();
  } finally {
    setExporting(false);
  }
};
```

## Database Query Optimizations

| Query | Issue | Suggestion | Impact |
|-------|-------|------------|--------|
| `Itinerary.objects.filter(user_email=email)` | No pagination | Add LIMIT/OFFSET | Reduces memory usage |
| Missing database indexes | Slow email lookups | Add index on user_email | 10x faster queries |
| No query optimization | N+1 problem potential | Use select_related() | Reduces DB calls |

### Recommended Database Changes
```python
# Add to models.py
class Itinerary(models.Model):
    user_email = models.EmailField(db_index=True)  # Add index
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-created_at']  # Default ordering
        indexes = [
            models.Index(fields=['user_email', '-created_at']),
        ]

# Update views.py for pagination
from django.core.paginator import Paginator

def get(self, request):
    user_email = request.GET.get('user_email')
    page = request.GET.get('page', 1)
    
    itineraries = Itinerary.objects.filter(user_email=user_email)
    paginator = Paginator(itineraries, 10)  # 10 per page
    page_obj = paginator.get_page(page)
    
    return Response({
        'results': ItinerarySerializer(page_obj, many=True).data,
        'has_next': page_obj.has_next(),
        'total_pages': paginator.num_pages
    })
```

## Caching Opportunities

### GROQ API Response Caching
```python
# Install: pip install django-redis
# Add to settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Update views.py
from django.core.cache import cache
import hashlib

def post(self, request):
    serializer = ItinerarySerializer(data=request.data)
    if serializer.is_valid():
        destination = serializer.validated_data['destination']
        days = serializer.validated_data['days']
        
        # Create cache key
        cache_key = hashlib.md5(f"{destination}_{days}".encode()).hexdigest()
        cached_result = cache.get(cache_key)
        
        if cached_result:
            return Response({'result': cached_result})
        
        # Generate new itinerary
        result = self.generate_itinerary(destination, days)
        
        # Cache for 24 hours
        cache.set(cache_key, result, 86400)
        
        return Response({'result': result})
```

### Frontend Caching Strategy
```javascript
// Implement React Query for API caching
// npm install @tanstack/react-query

import { useQuery } from '@tanstack/react-query';

const useItineraries = (userEmail) => {
  return useQuery({
    queryKey: ['itineraries', userEmail],
    queryFn: () => fetchItineraries(userEmail),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

## Resource Usage Optimizations

### Memory Leak Prevention
```javascript
// Current: Potential memory leaks
useEffect(() => {
  document.addEventListener('keydown', handleEscapeKey);
}, []);

// Fixed: Proper cleanup
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape') setSelectedItinerary(null);
  };
  
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, []);
```

### Component Re-render Optimization
```javascript
// Current: Unnecessary re-renders
const AuthContext = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const value = {
    currentUser,
    login,
    signup,
    logout,
    signInWithGoogle
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Optimized: Memoized context value
import { useMemo } from 'react';

const AuthContext = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const value = useMemo(() => ({
    currentUser,
    login,
    signup,
    logout,
    signInWithGoogle
  }), [currentUser]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

## Network Optimization

### API Request Optimization
```javascript
// Current: No request deduplication
const generateItinerary = async (destination, days) => {
  const response = await fetch('/api/itinerary/', {
    method: 'POST',
    body: JSON.stringify({ destination, days })
  });
};

// Optimized: Request deduplication and retry logic
const generateItinerary = async (destination, days, retries = 3) => {
  const controller = new AbortController();
  
  try {
    const response = await fetch('/api/itinerary/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, days }),
      signal: controller.signal,
      timeout: 30000 // 30 second timeout
    });
    
    if (!response.ok && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateItinerary(destination, days, retries - 1);
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request cancelled');
    }
    throw error;
  }
};
```

## Performance Metrics Targets

| Metric | Current | Target | Strategy |
|--------|---------|--------|---------|
| Bundle Size | ~2MB | <500KB | Code splitting, tree shaking |
| API Response Time | 5-10s | <3s | Caching, optimization |
| Page Load Time | 3-5s | <2s | Lazy loading, compression |
| Memory Usage | Unknown | <50MB | Cleanup, optimization |
| Database Query Time | Unknown | <100ms | Indexing, pagination |

## Implementation Priority

1. **High Impact, Low Effort**
   - Add database indexes
   - Implement component memoization
   - Add proper cleanup in useEffect

2. **High Impact, Medium Effort**
   - Implement API response caching
   - Add pagination to history view
   - Optimize bundle with code splitting

3. **Medium Impact, High Effort**
   - Implement Redis caching
   - Add comprehensive performance monitoring
   - Optimize PDF generation with web workers

## Monitoring Recommendations

```javascript
// Add performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === 'navigation') {
      console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart);
    }
  });
});

performanceObserver.observe({ entryTypes: ['navigation', 'measure'] });
```

## Expected Performance Gains

- **Bundle Size**: 75% reduction (2MB → 500KB)
- **API Response Time**: 60% improvement (10s → 4s with caching)
- **Page Load Time**: 50% improvement (4s → 2s)
- **Database Query Time**: 90% improvement with proper indexing
- **Memory Usage**: 40% reduction with proper cleanup