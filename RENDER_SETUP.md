# 🔧 Render Backend Setup - Step by Step

## Complete Environment Variables for Render

When deploying your backend on Render, you need to add these environment variables:

### 1. Go to Render Dashboard
- Visit: https://dashboard.render.com
- Click on your service (e.g., `urbanpulse-api`)
- Click **"Environment"** in the left sidebar

### 2. Add These Environment Variables

Click **"Add Environment Variable"** for each of these:

#### Required Variables:

**NODE_ENV**
```
production
```

**PORT**
```
5000
```

**MONGO_URI**
```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/urbanpulse?retryWrites=true&w=majority
```
*Replace with your actual MongoDB Atlas connection string*

**JWT_SECRET**
```
your_super_secret_random_string_min_32_characters_long
```
*Generate a random string - use this: https://randomkeygen.com/*

**JWT_EXPIRE**
```
30d
```

**MAPTILER_API_KEY**
```
SrsUHeeinODG2rHz40GE
```

**FRONTEND_URL** ⭐ **THIS IS WHERE YOU ADD YOUR VERCEL URL**
```
https://your-project-name.vercel.app
```
*Replace with your actual Vercel deployment URL*

---

## 📸 Visual Guide

### Step 1: Find Environment Section
```
Render Dashboard → Your Service → Environment (left sidebar)
```

### Step 2: Add Variable
```
Click "Add Environment Variable" button
```

### Step 3: Fill in Details
```
Key: FRONTEND_URL
Value: https://your-project-name.vercel.app
```

### Step 4: Save
```
Click "Save Changes" button at the bottom
```

### Step 5: Redeploy
```
Render will automatically redeploy your service
Wait 3-5 minutes for deployment to complete
```

---

## ✅ Complete Environment Variables List

Copy this checklist and fill in your values:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/urbanpulse?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_random_secret_here_min_32_chars
JWT_EXPIRE=30d

# External APIs
MAPTILER_API_KEY=SrsUHeeinODG2rHz40GE

# Frontend URL (YOUR VERCEL DEPLOYMENT)
FRONTEND_URL=https://your-project-name.vercel.app
```

---

## 🔍 How to Find Your Vercel URL

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Look for the **"Domains"** section
4. Copy the URL (e.g., `https://urbanpulse-abc123.vercel.app`)
5. Paste it as the `FRONTEND_URL` value in Render

---

## 🚨 Common Mistakes

### ❌ Wrong:
```
FRONTEND_URL=your-project-name.vercel.app
```
*Missing https://*

### ❌ Wrong:
```
FRONTEND_URL=https://your-project-name.vercel.app/
```
*Has trailing slash*

### ✅ Correct:
```
FRONTEND_URL=https://your-project-name.vercel.app
```

---

## 🧪 Testing After Setup

### 1. Check Deployment Status
- Go to Render Dashboard → Your Service
- Wait for "Live" status (green dot)

### 2. Test Health Endpoint
Visit in browser:
```
https://your-backend.onrender.com/api/health
```

Should return:
```json
{
  "success": true,
  "message": "UrbanPulse API is running",
  "version": "2.1"
}
```

### 3. Test CORS
- Open your Vercel frontend
- Open browser console (F12)
- Try to login or search
- Should see NO CORS errors

---

## 🔄 If You Need to Update Vercel URL Later

1. Go to Render Dashboard
2. Click your service
3. Click "Environment"
4. Find `FRONTEND_URL`
5. Click the pencil icon to edit
6. Update the value
7. Click "Save Changes"
8. Wait for automatic redeploy

---

## 📋 Quick Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `MONGO_URI` | Database connection | `mongodb+srv://...` |
| `JWT_SECRET` | Auth token secret | Random 32+ chars |
| `JWT_EXPIRE` | Token expiry | `30d` |
| `MAPTILER_API_KEY` | Map API key | `SrsUHeeinODG2rHz40GE` |
| `FRONTEND_URL` | Your Vercel URL | `https://your-app.vercel.app` |

---

## 🆘 Troubleshooting

### Deployment Failed
**Check Render Logs:**
1. Dashboard → Your Service → Logs
2. Look for error messages
3. Common issues:
   - Missing environment variables
   - Invalid MongoDB connection string
   - Syntax errors in code

### CORS Errors
**Solution:**
1. Verify `FRONTEND_URL` is set correctly
2. No trailing slash in URL
3. Includes `https://`
4. Matches your actual Vercel domain

### Can't Connect to Database
**Solution:**
1. Check MongoDB Atlas network access (0.0.0.0/0)
2. Verify connection string format
3. Ensure password doesn't have special characters (or URL encode them)

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **Render Support**: https://render.com/docs/support
- **Check Logs**: Dashboard → Service → Logs tab

---

*Last Updated: May 2, 2026*
