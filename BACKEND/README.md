# NutriAlgerie Backend with Authentication

This is a Python FastAPI backend for nutrition tracking with user authentication.

## Features

- **User Authentication**: Registration and login with email/password
- **Nutrition Analysis**: Profile analysis and meal planning
- **Progress Tracking**: Health metrics monitoring
- **Mobile Dashboard**: Optimized for mobile app integration

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Nutrition
- `POST /analyse-profil` - Analyze user profile
- `POST /plan-semaine` - Generate weekly meal plan
- `GET /dashboard/{user_id}` - Get mobile dashboard

## Setup Instructions

### Prerequisites
- Python 3.8+
- SQLite (included with Python)

### Installation

1. Navigate to the backend directory:
```bash
cd "c:\Users\versaille\Downloads\BACKEXPO-main\BACKEXPO-main"
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the server:
```bash
python main.py
```

The server will start on `http://localhost:8000`

## Frontend Integration

The frontend is configured to connect to this backend at `http://localhost:8000`

### Authentication Flow

1. **Register**: Send user data to `/auth/register`
2. **Login**: Send credentials to `/auth/login`
3. **Token Storage**: User ID is used as authentication token
4. **API Calls**: Include token in requests for protected endpoints

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    nom TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

## Security Features

- **Password Hashing**: SHA-256 with salt
- **Email Validation**: Format validation and uniqueness
- **Input Validation**: Pydantic models for all inputs
- **Error Handling**: Proper HTTP status codes

## Testing

Test the endpoints:

```bash
# Health check
curl http://localhost:8000/health

# Register user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","email":"john@example.com","password":"password123"}'

# Login user
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## Development

The backend includes:
- **FastAPI**: Modern web framework
- **SQLite**: Lightweight database
- **Pydantic**: Data validation
- **Authentication**: Secure user management

## Mobile App Connection

Ensure your mobile app can reach `http://localhost:8000`:
- For Android emulator: Use `10.0.2.2:8000`
- For iOS simulator: Use `localhost:8000`
- For physical device: Use your computer's IP address
