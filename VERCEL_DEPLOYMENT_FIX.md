# Vercel Deployment Fix

## Issue
The error `sh: line 1: vite: command not found` occurs because Vercel is trying to build from the root directory, but Vite is installed in the frontend directory.

## Solution

### Option 1: Use Root Directory Configuration (Recommended)

1. **Updated `vercel.json`** in root directory:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "npm install",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "@vite_api_base_url"
  }
}
```

2. **Updated `package.json`** build script:
```json
{
  "scripts": {
    "build": "cd frontend && npm install && npm run build"
  }
}
```

### Option 2: Deploy Frontend Directory Only

If Option 1 doesn't work, deploy only the frontend directory:

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Change "Root Directory" to `frontend`
   - Set "Build Command" to `npm run build`
   - Set "Output Directory" to `dist`

2. **Or use Vercel CLI:**
```bash
cd frontend
vercel --prod
```

### Option 3: Manual Vercel Configuration

1. **In Vercel Dashboard:**
   - Go to Project Settings → Build & Development Settings
   - Set the following:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

## Environment Variables

Make sure to set these in Vercel Dashboard → Settings → Environment Variables:

- `VITE_API_BASE_URL`: Your backend API URL (e.g., `https://your-backend.railway.app/api`)

## Testing the Fix

1. **Commit and push your changes:**
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

2. **Redeploy in Vercel:**
   - Go to your Vercel dashboard
   - Click "Redeploy" on the latest deployment

3. **Check the build logs** to ensure the build completes successfully.

## Alternative: Use Vercel CLI

If the dashboard approach doesn't work, use the Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel --prod

# Or deploy from root with proper config
cd ..
vercel --prod
```

## Troubleshooting

### If build still fails:

1. **Check Node.js version:**
   - Vercel uses Node.js 18.x by default
   - Add `.nvmrc` file in frontend directory with your Node version

2. **Check package.json:**
   - Ensure all dependencies are listed
   - Check for any missing peer dependencies

3. **Check Vite config:**
   - Ensure `vite.config.ts` is properly configured
   - Check for any build errors locally first

### Local Testing:
```bash
# Test the build locally
cd frontend
npm install
npm run build

# Check if dist folder is created
ls -la dist/
```

## Expected Result

After the fix, your Vercel deployment should:
1. ✅ Install dependencies successfully
2. ✅ Build the frontend without errors
3. ✅ Deploy to a public URL
4. ✅ Serve the React application correctly

Your ChatTrain frontend will be live at: `https://your-project.vercel.app`
