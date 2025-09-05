# Setting Up Local MongoDB

## Step 1: Download MongoDB Community Server
1. Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Select:
   - Version: Latest (7.0.x)
   - Platform: Windows
   - Package: MSI
3. Download and run the installer

## Step 2: Install MongoDB
1. Run the downloaded .msi file
2. Choose "Complete" installation
3. Install MongoDB Compass (GUI tool) when prompted
4. Complete the installation

## Step 3: Start MongoDB Service
1. Open Command Prompt as Administrator
2. Run: `net start MongoDB`
3. MongoDB should start automatically on boot

## Step 4: Verify Installation
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. You should see the connection successful

## Step 5: Your .env File is Already Correct
Your current .env file has:
```
MONGODB_URI=mongodb://localhost:27017/chat-train
```

## Step 6: Restart Your Server
```bash
npm run dev
```

## Data Storage Location
After installation, your data will be stored at:
```
C:\Program Files\MongoDB\Server\7.0\data\
```

## Benefits of Local MongoDB
- ✅ No internet required
- ✅ Faster for development
- ✅ Complete control over data
- ✅ No cloud costs

## Drawbacks
- ❌ Only accessible from your machine
- ❌ Need to manage backups yourself
- ❌ Requires installation and maintenance
