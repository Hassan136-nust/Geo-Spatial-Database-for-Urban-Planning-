# 🚀 Quick Deployment Guide - UrbanPulse

## 30-Minute Deployment Checklist

### 1️⃣ MongoDB Atlas (5 minutes)
```
1. Go to mongodb.com/cloud/atlas
2. Create free M0 cluster
3. Create database user: urbanpulse_user
4. Allow network access: 0.0.0.0/0
5. Copy connection string
```

**Connection String Format:**
```
mongodb+srv://urbanpulse_user:PASSWORD@cluster0.xxxxx.mongodb.net/urbanpulse?retryWrites=true&w=majority
```

---

### 2️⃣ Push to GitHub (2 minutes)
```bash
git init
git add .
git commit -m "Initial deployment"
git remote add origin https://github.com/YOUR_USERNAME/urbanpulse.git
git push -u origin main
```

---

### 3️⃣ Deploy Backend on Render (10 minutes)

**Go to:** https://render.com

**Settings:**
- **Service Type**: Web Service
- **Repository**: Your GitHub repo
- **Name**: urbanpulse-api
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment Variables:**
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://urbanpulse_user:PASSWORD@cluster0.xxxxx.mongodb.net/urbanpulse?retryWrites=true&w=majority
JWT_SECRET=change_this_to_random_string_min_32_chars
JWT_EXPIRE=30d
MAPTILER_API_KEY=SrsUHeeinODG2rHz40GE
```

**Test:** Visit `https://your-app.onrender.com/api/health`

---

### 4️⃣ Deploy Frontend on Vercel (10 minutes)

**Go to:** https://vercel.com

**Settings:**
- **Framework**: Vite
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Environment Variables:**
```env
VITE_API_URL=https://your-app.onrender.com/api
VITE_MAPTILER_KEY=SrsUHeeinODG2rHz40GE
```

**Deploy!** 🎉

---

### 5️⃣ Update CORS (3 minutes)

**File: `server/server.js`**
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-project.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true
}));
```

```bash
git add .
git commit -m "Update CORS"
git push
```

Render will auto-redeploy.

---

## ✅ Verification

1. **Backend Health**: `https://your-app.onrender.com/api/health`
2. **Frontend**: `https://your-project.vercel.app`
3. **Test Features**:
   - User registration
   - Map loading
   - Area search
   - Analytics generation

---

## 🆘 Common Issues

### Backend won't start
- Check Render logs
- Verify MongoDB connection string
- Ensure all env variables are set

### Frontend API errors
- Check browser console
- Verify VITE_API_URL is correct
- Check CORS settings

### Map not loading
- Verify VITE_MAPTILER_KEY
- Check browser console for errors

---

## 📱 Share Your App

**Frontend URL**: `https://your-project.vercel.app`

Give this URL to your team members!

---

## 💡 Pro Tips

1. **Free Tier Limits**:
   - Render: Sleeps after 15 min (first load slow)
   - Vercel: Unlimited for personal projects
   - MongoDB: 512 MB storage

2. **Custom Domain**:
   - Vercel: Settings → Domains
   - Render: Settings → Custom Domains

3. **Monitoring**:
   - Render: Check logs for errors
   - Vercel: Analytics tab
   - MongoDB: Metrics tab

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Full Guide**: See `DEPLOYMENT_GUIDE.md`

---

*Need help? Check the full DEPLOYMENT_GUIDE.md for detailed instructions!*
