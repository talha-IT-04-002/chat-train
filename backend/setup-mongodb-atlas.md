# Setting Up MongoDB Atlas (Cloud Database)

## Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose "Free" tier (M0)

## Step 2: Create a Cluster
1. Click "Build a Database"
2. Choose "FREE" tier
3. Select a cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to you
5. Click "Create"

## Step 3: Set Up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a username and password (save these!)
4. Select "Read and write to any database"
5. Click "Add User"

## Step 4: Set Up Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

## Step 5: Get Connection String
1. Go back to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string

## Step 6: Update Your .env File
Replace the MONGODB_URI in your .env file:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-train?retryWrites=true&w=majority
```
Replace `username`, `password`, and `cluster` with your actual values.

## Step 7: Restart Your Server
```bash
npm run dev
```

Your data will now be stored in the cloud and accessible from anywhere!
