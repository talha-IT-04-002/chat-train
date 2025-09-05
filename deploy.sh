#!/bin/bash

# ChatTrain Deployment Script
echo "🚀 ChatTrain Deployment Script"
echo "================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Please run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

# Check if code is committed
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Uncommitted changes detected. Committing..."
    git add .
    git commit -m "Deploy: $(date)"
fi

echo "✅ Code is committed and ready for deployment"
echo ""
echo "🌐 Choose your deployment platform:"
echo "1. Vercel (Frontend) + Railway (Backend) - Recommended"
echo "2. Render (Full-stack)"
echo "3. Netlify (Frontend) + Railway (Backend)"
echo "4. Manual deployment instructions"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🎯 Deploying to Vercel + Railway"
        echo ""
        echo "📋 Steps to follow:"
        echo "1. Go to https://railway.app and deploy your backend"
        echo "2. Go to https://vercel.com and deploy your frontend"
        echo "3. Set VITE_API_BASE_URL to your Railway backend URL"
        echo ""
        echo "🔗 Quick links:"
        echo "   Railway: https://railway.app/new"
        echo "   Vercel: https://vercel.com/new"
        ;;
    2)
        echo "🎯 Deploying to Render"
        echo ""
        echo "📋 Steps to follow:"
        echo "1. Go to https://render.com"
        echo "2. Create new Blueprint"
        echo "3. Connect your GitHub repository"
        echo "4. Render will auto-deploy using render.yaml"
        echo ""
        echo "🔗 Quick link: https://render.com/new/blueprint"
        ;;
    3)
        echo "🎯 Deploying to Netlify + Railway"
        echo ""
        echo "📋 Steps to follow:"
        echo "1. Go to https://railway.app and deploy your backend"
        echo "2. Go to https://netlify.com and deploy your frontend"
        echo "3. Set VITE_API_BASE_URL to your Railway backend URL"
        echo ""
        echo "🔗 Quick links:"
        echo "   Railway: https://railway.app/new"
        echo "   Netlify: https://netlify.com"
        ;;
    4)
        echo "📖 Manual deployment instructions:"
        echo ""
        echo "1. Push your code to GitHub:"
        echo "   git push origin main"
        echo ""
        echo "2. Set up MongoDB Atlas:"
        echo "   - Go to https://mongodb.com/atlas"
        echo "   - Create free cluster"
        echo "   - Get connection string"
        echo ""
        echo "3. Deploy backend:"
        echo "   - Use Railway, Render, or Heroku"
        echo "   - Set environment variables"
        echo ""
        echo "4. Deploy frontend:"
        echo "   - Use Vercel, Netlify, or GitHub Pages"
        echo "   - Set VITE_API_BASE_URL"
        echo ""
        echo "5. Test your deployment:"
        echo "   - Visit your frontend URL"
        echo "   - Create and deploy a trainer"
        echo "   - Test public access"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "📚 For detailed instructions, see: FREE_DEPLOYMENT_GUIDE.md"
echo "🎉 Happy deploying!"