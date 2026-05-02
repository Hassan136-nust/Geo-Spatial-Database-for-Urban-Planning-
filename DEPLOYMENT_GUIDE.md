# UrbanPulse Deployment Guide

This guide will help you deploy your UrbanPulse application with the frontend on **Vercel** and the backend on **Render**.

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ GitHub account (to push your code)
2. ✅ Vercel account (sign up at https://vercel.com)
3. ✅ Render account (sign up at https://render.com)
4. ✅ MongoDB Atlas account (for production database)
5. ✅ MapTiler API key (you already have: `SrsUHeeinODG2rHz40GE`)

---

## 🗄️ Step 1: Setup MongoDB Atlas (Production Database)

### 1.1 Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign in or create a free account
3. Click **"Build a Database"**
4. Choose **"M0 FREE"** tier
5. Select a cloud provider and region (choose closest to your users)
6. Name your cluster (e.g., `urbanpulse-cluster`)
7. Click **"Create"**

### 1.2 Configure Database Access

1. In Atlas dashboard, go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `urbanpulse_user`
5. Password: Generate a strong password (save it!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### 1.3 Configure Network Access

1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Go to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://urbanpulse_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name before the `?`: 
   ```
   mongodb+srv://urbanpulse_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/urbanpulse?retryWrites=true&w=majority
   ```

---

## 🚀 Step 2: Deploy Backend to Render

### 2.1 Prepare Backend for Deployment

First, let's create a startup script for Render:

**File: `server/package.json`** - Ensure you have these scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 2.2 Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"

# Create a new repository on GitHub (https://github.com/new)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/urbanpulse.git
git branch -M main
git push -u origin main
```

### 2.3 Deploy on Render

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

   **Basic Settings:**
   - **Name**: `urbanpulse-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

   **Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://urbanpulse_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/urbanpulse?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_change_this_to_something_random
   JWT_EXPIRE=30d
   MAPTILER_API_KEY=SrsUHeeinODG2rHz40GE
   ```

5. Click **"Create Web Service"**
6. Wait for deployment (5-10 minutes)
7. Once deployed, copy your backend URL (e.g., `https://urbanpulse-api.onrender.com`)

### 2.4 Test Backend

Visit: `https://your-backend-url.onrender.com/api/health`

You should see:
```json
{
  "success": true,
  "message": "UrbanPulse API is running"
}
```

---

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Prepare Frontend Configuration

Create a Vercel configuration file:

**File: `vercel.json`** (in root directory):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-url.onrender.com/api/:path*"
    }
  ]
}
```

**Update your API base URL:**

**File: `src/services/mapsApi.js`** - Update the base URL:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

### 3.2 Create Environment File Template

**File: `.env.example`** (for documentation):
```
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_MAPTILER_KEY=SrsUHeeinODG2rHz40GE
```

### 3.3 Deploy on Vercel

#### Option A: Deploy via Vercel Dashboard

1. Go to https://vercel.com and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:

   **Framework Preset**: `Vite`
   
   **Root Directory**: `./` (leave as root)
   
   **Build Command**: `npm run build`
   
   **Output Directory**: `dist`
   
   **Install Command**: `npm install`

   **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   VITE_MAPTILER_KEY=SrsUHeeinODG2rHz40GE
   ```

5. Click **"Deploy"**
6. Wait for deployment (3-5 minutes)
7. Your app will be live at `https://your-project.vercel.app`

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? urbanpulse
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add VITE_API_URL
# Enter: https://your-backend-url.onrender.com/api

vercel env add VITE_MAPTILER_KEY
# Enter: SrsUHeeinODG2rHz40GE

# Deploy to production
vercel --prod
```

---

## 🔧 Step 4: Configure CORS on Backend

Update your backend to allow requests from your Vercel domain:

**File: `server/server.js`** - Update CORS configuration:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://your-project.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true
}));
```

Commit and push changes:
```bash
git add .
git commit -m "Update CORS for production"
git push
```

Render will automatically redeploy your backend.

---

## ✅ Step 5: Verify Deployment

### 5.1 Test Backend
- Visit: `https://your-backend-url.onrender.com/api/health`
- Should return success message

### 5.2 Test Frontend
- Visit: `https://your-project.vercel.app`
- Try searching for an area
- Check if map loads correctly
- Test user registration/login

### 5.3 Test Integration
- Open browser console (F12)
- Check for any API errors
- Verify data is loading from backend

---

## 🎯 Step 6: Custom Domain (Optional)

### For Vercel (Frontend):
1. Go to your project settings on Vercel
2. Click **"Domains"**
3. Add your custom domain (e.g., `urbanpulse.com`)
4. Follow DNS configuration instructions

### For Render (Backend):
1. Go to your service settings on Render
2. Click **"Custom Domains"**
3. Add your API subdomain (e.g., `api.urbanpulse.com`)
4. Follow DNS configuration instructions

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend not starting
- Check Render logs: Dashboard → Your Service → Logs
- Verify all environment variables are set correctly
- Ensure MongoDB connection string is correct

**Problem**: Database connection failed
- Check MongoDB Atlas network access (allow 0.0.0.0/0)
- Verify database user credentials
- Test connection string locally first

### Frontend Issues

**Problem**: API calls failing
- Check browser console for CORS errors
- Verify `VITE_API_URL` environment variable
- Ensure backend URL is correct and accessible

**Problem**: Map not loading
- Verify `VITE_MAPTILER_KEY` is set correctly
- Check MapTiler API quota/limits
- Open browser console for errors

### General Issues

**Problem**: 404 errors on page refresh
- Vercel: Should handle automatically with Vite
- Check `vercel.json` rewrites configuration

**Problem**: Environment variables not working
- Rebuild/redeploy after adding variables
- Vercel: Variables must start with `VITE_`
- Render: Restart service after adding variables

---

## 📊 Monitoring & Maintenance

### Render (Backend)
- **Logs**: Dashboard → Service → Logs
- **Metrics**: Dashboard → Service → Metrics
- **Free tier**: Spins down after 15 min inactivity (first request may be slow)

### Vercel (Frontend)
- **Analytics**: Dashboard → Project → Analytics
- **Logs**: Dashboard → Project → Deployments → View Function Logs
- **Free tier**: Unlimited bandwidth for personal projects

### MongoDB Atlas
- **Monitoring**: Dashboard → Metrics
- **Free tier**: 512 MB storage
- **Backup**: Set up automated backups in settings

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong JWT secret** - Generate random string
3. **Rotate API keys** - Periodically update MapTiler key
4. **Monitor usage** - Check MongoDB and MapTiler quotas
5. **Enable HTTPS** - Both Vercel and Render provide free SSL

---

## 💰 Cost Estimates

### Free Tier Limits:
- **Vercel**: Unlimited bandwidth, 100 GB-hours compute
- **Render**: 750 hours/month (enough for 1 service)
- **MongoDB Atlas**: 512 MB storage, shared cluster
- **MapTiler**: 100,000 free tile requests/month

### When to Upgrade:
- High traffic (>100k visitors/month)
- Need faster backend response (Render paid plans)
- More database storage (MongoDB paid tiers)
- More map requests (MapTiler paid plans)

---

## 🚀 Quick Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user and network access configured
- [ ] Code pushed to GitHub
- [ ] Backend deployed on Render
- [ ] Backend environment variables set
- [ ] Backend health check passing
- [ ] Frontend deployed on Vercel
- [ ] Frontend environment variables set
- [ ] CORS configured correctly
- [ ] Test user registration/login
- [ ] Test map functionality
- [ ] Test area search and analysis

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Vite Docs**: https://vitejs.dev/guide

---

## 🎉 Congratulations!

Your UrbanPulse application is now live! Share your deployment URL with your team members.

**Frontend**: `https://your-project.vercel.app`
**Backend**: `https://your-backend-url.onrender.com`

---

*Last Updated: May 2, 2026*
