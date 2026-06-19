# Atlas | Backend API Documentation

Welcome to the Atlas API. This is a secure, RESTful backend built with Node.js, Express, and MongoDB.

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root and add:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_secret_key
   JWT_EXPIRE=30d
   ```

3. **Run the Server**
   ```bash
   node index.js
   ```

---

## 🛠️ Architecture (MVC)
- `models/`: Database schemas (Mongoose)
- `controllers/`: Logic for handling requests
- `routes/`: URL path definitions
- `middleware/`: Security and helper functions
- `config/`: Configuration (Database, etc.)

---

## 🔐 API Endpoints

### 1. Authentication
| Action | Method | URL | Access | Body |
| :--- | :--- | :--- | :--- | :--- |
| Register User | `POST` | `/api/auth/register` | Public | `{ name, email, password }` |
| Login User | `POST` | `/api/auth/login` | Public | `{ email, password }` |
| Get My Profile | `GET` | `/api/auth/me` | Private | N/A (Requires Bearer Token) |

### 2. Request Examples
#### Register a User
- **URL**: `http://localhost:5000/api/auth/register`
- **Body**:
```json
{
  "name": "Alex Atlas",
  "email": "alex@Atlas.ai",
  "password": "password123"
}
```

#### Get My Profile (Protected)
- **URL**: `http://localhost:5000/api/auth/me`
- **Header**: `Authorization: Bearer <your_token_here>`

---

## 🛡️ Security Features
- **Password Hashing**: Bcryptjs (10 salts)
- **State Management**: JWT (JSON Web Tokens)
- **Validation**: Mongoose-built validation for emails and password length.
