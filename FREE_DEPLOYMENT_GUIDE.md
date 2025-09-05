# ChatTrain Free Deployment Guide

## Overview

This guide will help you deploy your ChatTrain application to free hosting platforms. We'll cover multiple options including Vercel, Netlify, Railway, and Render.

## Prerequisites

- GitHub account
- Node.js installed locally
- Git installed
- Your ChatTrain project ready

## Option 1: Vercel (Recommended for Frontend)

### Step 1: Prepare Your Project

1. **Create a production build script** in `frontend/package.json`:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "dev": "vite"
  }
}
```

2. **Create `vercel.json`** in your frontend directory:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://your-backend-url.vercel.app/api"
  }
}
```

3. **Create `.env.production`** in frontend directory:
```env
VITE_API_BASE_URL=https://your-backend-url.vercel.app/api
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Set build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables:
   - `VITE_API_BASE_URL`: Your backend URL
7. Click "Deploy"

## Option 2: Railway (Recommended for Full-Stack)

### Step 1: Prepare Backend

1. **Create `railway.json`** in your project root:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **Update `backend/package.json`**:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

3. **Create `Procfile`** in backend directory:
```
web: npm start
```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect your Node.js app
6. Add environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret
   - `NODE_ENV`: `production`
7. Railway will automatically deploy

### Step 3: Deploy Frontend to Vercel

Follow the Vercel steps above, but use your Railway backend URL:
```env
VITE_API_BASE_URL=https://your-app.railway.app/api
```

## Option 3: Render (Full-Stack Option)

### Step 1: Prepare for Render

1. **Create `render.yaml`** in your project root:
```yaml
services:
  - type: web
    name: chattrain-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        fromDatabase:
          name: chattrain-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true

  - type: web
    name: chattrain-frontend
    env: static
    plan: free
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/dist
    envVars:
      - key: VITE_API_BASE_URL
        value: https://chattrain-backend.onrender.com/api

databases:
  - name: chattrain-db
    plan: free
```

### Step 2: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will read the `render.yaml` and deploy both services
6. Wait for deployment to complete

## Option 4: Netlify (Frontend Only)

### Step 1: Prepare for Netlify

1. **Create `netlify.toml`** in frontend directory:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  VITE_API_BASE_URL = "https://your-backend-url.vercel.app/api"
```

### Step 2: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Select your repository
5. Set build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add environment variables
7. Click "Deploy site"

## Database Options (Free)

### Option 1: MongoDB Atlas (Recommended)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free account
3. Create a free cluster (M0 Sandbox)
4. Get connection string
5. Use in your deployment environment variables

### Option 2: Railway PostgreSQL

1. In Railway dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Railway provides connection string automatically

## Environment Variables Setup

### Backend Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chattrain
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
```

### Frontend Environment Variables
```env
VITE_API_BASE_URL=https://your-backend-url.vercel.app/api
```

## Complete Deployment Steps

### 1. Prepare Your Repository

```bash
# Make sure your code is committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy Backend (Railway)

1. Go to Railway.app
2. Connect GitHub repository
3. Add environment variables
4. Deploy

### 3. Deploy Frontend (Vercel)

1. Go to Vercel.com
2. Import repository
3. Set build settings
4. Add backend URL to environment variables
5. Deploy

### 4. Update CORS Settings

In your backend, update CORS to allow your frontend domain:

```javascript
// backend/server.js
const cors = require('cors');

app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:3000' // for development
  ],
  credentials: true
}));
```

## Testing Your Deployment

### 1. Test Backend
```bash
curl https://your-backend-url.vercel.app/api/health
```

### 2. Test Frontend
1. Visit your frontend URL
2. Try to create a trainer
3. Test deployment functionality

### 3. Test Public Access
1. Deploy a trainer
2. Copy the public URL
3. Open in incognito mode
4. Verify it works without authentication

## Troubleshooting

### Common Issues

#### Build Failures
- Check Node.js version compatibility
- Ensure all dependencies are in package.json
- Verify build scripts are correct

#### CORS Errors
- Update CORS settings in backend
- Check environment variables
- Verify frontend URL is whitelisted

#### Database Connection Issues
- Verify MongoDB connection string
- Check database permissions
- Ensure network access is configured

#### Environment Variables Not Loading
- Check variable names (case-sensitive)
- Verify they're set in hosting platform
- Restart deployment after adding variables

### Debug Commands

```bash
# Check build locally
cd frontend && npm run build

# Test backend locally
cd backend && npm start

# Check environment variables
echo $VITE_API_BASE_URL
```

## Free Tier Limitations

### Vercel
- 100GB bandwidth/month
- 100 serverless function executions
- 1GB storage

### Railway
- $5 credit monthly
- 512MB RAM
- 1GB storage

### Render
- 750 hours/month
- 512MB RAM
- 1GB storage

### MongoDB Atlas
- 512MB storage
- Shared clusters
- Basic monitoring

## Scaling Considerations

### When to Upgrade
- Exceed free tier limits
- Need better performance
- Require more storage
- Need custom domains

### Upgrade Options
- Vercel Pro: $20/month
- Railway Pro: $5/month + usage
- Render Standard: $7/month
- MongoDB Atlas M10: $57/month

## Security Best Practices

### Environment Variables
- Never commit secrets to Git
- Use strong JWT secrets
- Rotate secrets regularly

### CORS Configuration
- Only allow necessary origins
- Use HTTPS in production
- Validate all inputs

### Database Security
- Use strong passwords
- Enable IP whitelisting
- Regular backups

## Monitoring Your Deployment

### Health Checks
```javascript
// Add to your backend
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});
```

### Logs
- Check hosting platform logs
- Monitor error rates
- Track performance metrics

## Backup Strategy

### Database Backups
- MongoDB Atlas provides automatic backups
- Export data regularly
- Test restore procedures

### Code Backups
- Use Git for version control
- Tag releases
- Keep local backups

---

## Quick Start Checklist

- [ ] Push code to GitHub
- [ ] Set up MongoDB Atlas
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Configure environment variables
- [ ] Test deployment
- [ ] Test public trainer access
- [ ] Set up monitoring
- [ ] Document your URLs

**Your ChatTrain app will be live and accessible to users worldwide!**

---

*This guide provides step-by-step instructions for deploying ChatTrain to free hosting platforms. Choose the option that best fits your needs.*
