# Database Setup Guide

## Option 1: MongoDB Atlas (Recommended - Free Cloud Database)

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose "Free" tier (M0)

### Step 2: Create Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to you
5. Click "Create"

### Step 3: Set Up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Select "Read and write to any database"
6. Click "Add User"

### Step 4: Set Up Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go back to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string

### Step 6: Update Your Backend .env File
Replace the MONGODB_URI in your `backend/.env` file:

```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster.mongodb.net/chat-train?retryWrites=true&w=majority
```

Replace:
- `yourusername` with your database username
- `yourpassword` with your database password
- `cluster.mongodb.net` with your actual cluster URL

## Option 2: Local MongoDB Installation

### Step 1: Download MongoDB
1. Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Download "MongoDB Community Server" for Windows
3. Run the installer with default settings

### Step 2: Start MongoDB
1. MongoDB should start automatically as a Windows service
2. To verify, open Command Prompt and run: `mongosh`
3. If it doesn't work, start the service manually: `net start MongoDB`

## Test Database Connection

After setting up either option, test the connection:

```bash
cd backend
npm run test-db
```

You should see: "✅ Database connection successful"

## Next Steps

1. **Seed the database** (optional):
   ```bash
   cd backend
   npm run seed
   ```

2. **Start the application**:
   ```bash
   npm run dev
   ```

3. **Verify everything works**:
   - Backend: http://localhost:5000/health
   - Frontend: http://localhost:3000
