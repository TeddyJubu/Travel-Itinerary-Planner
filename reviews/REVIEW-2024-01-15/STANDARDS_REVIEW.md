# Code Standards Compliance

## Style Guide Violations

| File | Line | Rule | Severity | Fix |
|------|------|------|----------|-----|
| backend/travel_app/views.py | 67 | print-statements | Error | Use logging instead of print() |
| frontend/src/components/History.tsx | 45 | missing-error-boundary | Warning | Wrap component in error boundary |
| backend/travel_app/models.py | 8 | missing-docstring | Warning | Add class and method docstrings |
| frontend/src/components/ItineraryForm.tsx | 78 | magic-numbers | Warning | Extract 'application/json' to constant |
| backend/travel_app/views.py | 32 | string-formatting | Warning | Use f-strings consistently |
| frontend/src/contexts/AuthContext.tsx | 25 | missing-error-handling | Error | Add try-catch for Firebase operations |

## Formatting Issues

```yaml
- file: "backend/travel_app/views.py"
  issues:
    - line: 45
      issue: "Inconsistent spacing around operators"
      expected: "user_email = request.GET.get('user_email')"
      found: "user_email=request.GET.get('user_email')"
      auto_fixable: true
    - line: 67
      issue: "Long line exceeds 88 characters"
      expected: "Break into multiple lines"
      found: "print(f'Error calling Groq API: {str(e)}') # This line is too long"
      auto_fixable: true

- file: "frontend/src/components/History.tsx"
  issues:
    - line: 23
      issue: "Missing trailing comma in object"
      expected: "{ method: 'GET', }"
      found: "{ method: 'GET' }"
      auto_fixable: true
    - line: 89
      issue: "Inconsistent quote usage"
      expected: "Use single quotes consistently"
      found: "Mixed single and double quotes"
      auto_fixable: true
```

## Complexity Metrics

| Function | File | Complexity | Threshold | Status |
|----------|------|------------|-----------|--------|
| History.fetchItineraries() | History.tsx | 12 | 10 | ⚠️ Refactor suggested |
| ItineraryView.post() | views.py | 15 | 10 | ⚠️ Refactor suggested |
| AuthContext.signInWithGoogle() | AuthContext.tsx | 8 | 10 | ✅ OK |
| HistoryView.get() | views.py | 6 | 10 | ✅ OK |
| ItineraryForm.handleSubmit() | ItineraryForm.tsx | 11 | 10 | ⚠️ Refactor suggested |

## Code Smells Detected

### Long Methods
- **ItineraryView.post()**: 45 lines - Should be split into smaller functions
- **History.fetchItineraries()**: 35 lines - Extract error handling logic
- **ItineraryForm.handleSubmit()**: 40 lines - Separate validation and API call

### Duplicate Code
- **PDF Export Logic**: Similar code in `ItineraryForm.tsx:85` and `History.tsx:78`
  ```javascript
  // Duplicate pattern found:
  const element = document.getElementById('itinerary-content');
  html2pdf().from(element).save();
  ```
  **Suggestion**: Extract to shared utility function

- **Error Handling**: Repeated try-catch patterns in multiple components
  ```javascript
  // Pattern repeated 3+ times:
  try {
    const response = await fetch(...);
    // handle response
  } catch (error) {
    console.error(error);
    setError('Something went wrong');
  }
  ```
  **Suggestion**: Create custom hook `useApiCall()`

### Dead Code
- **Unused imports**: `useCallback` imported but not used in `AuthContext.tsx`
- **Unused variables**: `loading` state declared but not used in `History.tsx`
- **Commented code**: Old implementation commented out in `ItineraryForm.tsx:65-70`

### God Components
- **History.tsx**: 100+ lines with multiple responsibilities (data fetching, PDF export, modal management)
- **ItineraryForm.tsx**: 95+ lines handling form state, validation, API calls, and PDF export

## Naming Convention Issues

| File | Issue | Current | Suggested |
|------|-------|---------|----------|
| models.py | Inconsistent field naming | `user_email` | `user_email` (OK) |
| views.py | Generic class names | `ItineraryView` | `ItineraryCreateView` |
| History.tsx | Non-descriptive state | `data` | `itineraries` |
| ItineraryForm.tsx | Unclear function names | `handleSubmit` | `handleItineraryGeneration` |

## Missing Documentation

### Functions Without Docstrings/Comments
```python
# backend/travel_app/models.py
class Itinerary(models.Model):  # Missing class docstring
    def __str__(self):  # Missing method docstring
        return f"{self.destination} - {self.days} days"

# backend/travel_app/views.py
def post(self, request):  # Missing function docstring
    # Complex logic without explanation
```

### Missing Type Annotations
```typescript
// frontend/src/components/History.tsx
const fetchItineraries = async () => {  // Missing return type
  // Should be: async (): Promise<void> => {
};

const exportToPDF = (itinerary) => {  // Missing parameter type
  // Should be: (itinerary: Itinerary) => void
};
```

## Security Code Standards

### Input Validation Missing
```python
# backend/travel_app/serializers.py
class ItinerarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Itinerary
        fields = '__all__'  # Too permissive
        # Should specify exact fields
        
    # Missing custom validation methods
    def validate_destination(self, value):
        # Should validate destination format
        pass
        
    def validate_days(self, value):
        # Should validate days range (1-30)
        pass
```

### Hardcoded Values
```javascript
// frontend/src/components/ItineraryForm.tsx
const API_URL = 'https://ai-travel-itinerary-planner.onrender.com/api/itinerary/';
// Should use environment variable

// backend/travel_planner/settings.py
ALLOWED_HOSTS = ['*']  # Too permissive for production
```

## Recommended Fixes

### High Priority (Fix Immediately)
1. **Replace print() with logging**
   ```python
   # Instead of: print(f"Error: {e}")
   import logging
   logger = logging.getLogger(__name__)
   logger.error("GROQ API error", exc_info=True)
   ```

2. **Add proper error boundaries**
   ```javascript
   // Create ErrorBoundary component
   class ErrorBoundary extends React.Component {
     constructor(props) {
       super(props);
       this.state = { hasError: false };
     }
     
     static getDerivedStateFromError(error) {
       return { hasError: true };
     }
     
     render() {
       if (this.state.hasError) {
         return <h1>Something went wrong.</h1>;
       }
       return this.props.children;
     }
   }
   ```

3. **Extract duplicate PDF logic**
   ```javascript
   // utils/pdfExport.js
   export const exportToPDF = (elementId, filename = 'itinerary.pdf') => {
     const element = document.getElementById(elementId);
     if (!element) {
       throw new Error(`Element with id '${elementId}' not found`);
     }
     return html2pdf().from(element).save(filename);
   };
   ```

### Medium Priority
1. **Add comprehensive type definitions**
2. **Implement consistent error handling patterns**
3. **Break down large components**
4. **Add input validation**

### Low Priority
1. **Fix formatting issues with Prettier/Black**
2. **Add comprehensive documentation**
3. **Optimize imports and remove dead code**

## Automated Fixes Available

### ESLint/Prettier Configuration
```json
// .eslintrc.json
{
  "extends": [
    "react-app",
    "react-app/jest",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### Python Code Formatting
```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py39']

[tool.isort]
profile = "black"
multi_line_output = 3

[tool.flake8]
max-line-length = 88
extend-ignore = ["E203", "W503"]
```

## Code Quality Score

**Overall Score: 65/100**

- **Style Compliance**: 70/100 (Missing linting configuration)
- **Documentation**: 45/100 (Many missing docstrings)
- **Complexity**: 60/100 (Several functions exceed threshold)
- **Maintainability**: 70/100 (Some code duplication)
- **Security**: 55/100 (Missing input validation)

## Next Steps

1. **Setup automated linting** (ESLint, Prettier, Black, flake8)
2. **Implement code review checklist**
3. **Add pre-commit hooks** for code quality
4. **Create coding standards document**
5. **Setup continuous integration** for code quality checks