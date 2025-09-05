# Chat Train Project Setup Guide

## Step 1: Create Environment Files

### Backend Environment File
Create a file named `.env` in the `backend` directory with the following content:

```env
# Environment Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/chat-train

# JWT Configuration
JWT_SECRET=chat-train-super-secret-jwt-key-2024-development
JWT_EXPIRE=30d

# Email Configuration (optional for development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# API Configuration
API_RATE_LIMIT=100
API_RATE_LIMIT_WINDOW=900000

# Security
CORS_ORIGIN=http://localhost:3000
```

### Frontend Environment File
Create a file named `.env` in the `frontend` directory with the following content:

```env
# Frontend Environment Configuration
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Chat Train
VITE_APP_VERSION=1.0.0

# Development Configuration
VITE_DEV_MODE=true
VITE_DEBUG_MODE=true
```

## Step 2: Database Setup Options

### Option A: MongoDB Atlas (Recommended for Development)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account
   - Create a new cluster (free tier is sufficient)

2. **Configure Database Access**
   - Go to Database Access
   - Create a new database user with read/write permissions
   - Remember username and password

3. **Configure Network Access**
   - Go to Network Access
   - Add your IP address or use 0.0.0.0/0 for all IPs (development only)

4. **Get Connection String**
   - Go to Clusters
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

5. **Update Backend .env**
   - Replace the MONGODB_URI in your backend .env file:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-train?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB Installation

1. **Download MongoDB Community Server**
   - Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Download MongoDB Community Server for Windows
   - Install with default settings

2. **Start MongoDB Service**
   - MongoDB should start automatically as a Windows service
   - Or manually start: `net start MongoDB`

3. **Verify Installation**
   - Open Command Prompt
   - Run: `mongosh` or `mongo`
   - You should see the MongoDB shell

## Step 3: Test Database Connection

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Test database connection**
   ```bash
   npm run test-db
   ```

3. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

## Step 4: Start the Application

1. **From the root directory**
   ```bash
   npm run dev
   ```

2. **Or start separately**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Step 5: Verify Setup

1. **Backend Health Check**
   - Open: http://localhost:5000/health
   - Should show: `{"status":"OK","message":"Chat Train API is running"}`

2. **Frontend Application**
   - Open: http://localhost:3000
   - Should show the Chat Train login page

3. **Database Connection**
   - Check backend console for: `📦 MongoDB Connected: ...`

## Troubleshooting

### Database Connection Issues
- Verify MongoDB is running
- Check MONGODB_URI in .env file
- Ensure network access is configured (for Atlas)
- Check firewall settings

### Port Issues
- Ensure ports 3000 and 5000 are available
- Check if other services are using these ports
- Update PORT in .env if needed

### Environment Variables
- Ensure .env files are in correct directories
- Restart the application after creating .env files
- Check for typos in variable names

## Next Steps

After successful setup:
1. Create your first user account
2. Set up an organization
3. Configure API keys for AI providers
4. Start building your first AI trainer