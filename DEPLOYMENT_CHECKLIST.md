# 📋 UrbanPulse Deployment Checklist

Use this checklist to ensure a smooth deployment process.

---

## Pre-Deployment

### Code Preparation
- [ ] All code committed to Git
- [ ] `.env` files are in `.gitignore`
- [ ] No sensitive data in code
- [ ] All dependencies listed in `package.json`
- [ ] Build command works locally (`npm run build`)
- [ ] Server starts locally (`cd server && npm start`)

### Accounts Setup
- [ ] GitHub account created
- [ ] Vercel account created (https://vercel.com)
- [ ] Render account created (https://render.com)
- [ ] MongoDB Atlas account created (https://mongodb.com/cloud/atlas)

---

## Database Setup (MongoDB Atlas)

- [ ] MongoDB Atlas cluster created (M0 Free tier)
- [ ] Database user created with password
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied and saved
- [ ] Connection string tested locally

**Connection String Format:**
```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/urbanpulse?retryWrites=true&w=majority
```

---

## Backend Deployment (Render)

### Repository
- [ ] Code pushed to GitHub
- [ ] Repository is public or Render has access

### Render Configuration
- [ ] New Web Service created
- [ ] GitHub repository connected
- [ ] Root directory set to `server`
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Instance type: Free

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `MONGO_URI=<your-mongodb-atlas-connection-string>`
- [ ] `JWT_SECRET=<random-32-char-string>`
- [ ] `JWT_EXPIRE=30d`
- [ ] `MAPTILER_API_KEY=SrsUHeeinODG2rHz40GE`

### Verification
- [ ] Service deployed successfully
- [ ] Backend URL copied (e.g., `https://urbanpulse-api.onrender.com`)
- [ ] Health check endpoint works: `/api/health`
- [ ] No errors in Render logs

---

## Frontend Deployment (Vercel)

### Vercel Configuration
- [ ] New Project created
- [ ] GitHub repository connected
- [ ] Framework preset: Vite
- [ ] Root directory: `./`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`

### Environment Variables
- [ ] `VITE_API_URL=<your-render-backend-url>/api`
- [ ] `VITE_MAPTILER_KEY=SrsUHeeinODG2rHz40GE`

### Verification
- [ ] Frontend deployed successfully
- [ ] Frontend URL copied (e.g., `https://urbanpulse.vercel.app`)
- [ ] Website loads without errors
- [ ] No console errors in browser

---

## CORS Configuration

### Update Backend CORS
- [ ] `server/server.js` updated with Vercel URL
- [ ] CORS allows your Vercel domain
- [ ] Changes committed and pushed to GitHub
- [ ] Render auto-redeployed

**CORS Configuration:**
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

---

## Integration Testing

### Backend Tests
- [ ] Health endpoint: `GET /api/health`
- [ ] User registration: `POST /api/auth/register`
- [ ] User login: `POST /api/auth/login`
- [ ] Area search: `POST /api/areas/search`

### Frontend Tests
- [ ] Homepage loads
- [ ] Map displays correctly
- [ ] User can register
- [ ] User can login
- [ ] Area search works
- [ ] Analytics page loads
- [ ] Reports generate successfully

### Integration Tests
- [ ] Frontend connects to backend
- [ ] No CORS errors in console
- [ ] API calls succeed
- [ ] Data displays correctly
- [ ] Images and assets load

---

## Performance & Monitoring

### Render (Backend)
- [ ] Check deployment logs for errors
- [ ] Monitor response times
- [ ] Note: Free tier sleeps after 15 min inactivity

### Vercel (Frontend)
- [ ] Check deployment logs
- [ ] Enable Analytics (optional)
- [ ] Monitor build times

### MongoDB Atlas
- [ ] Check connection metrics
- [ ] Monitor storage usage (512 MB limit on free tier)
- [ ] Set up alerts (optional)

---

## Security Checklist

- [ ] JWT_SECRET is strong and random (min 32 characters)
- [ ] No API keys in frontend code
- [ ] Environment variables properly set
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] MongoDB network access configured
- [ ] No sensitive data in logs

---

## Documentation

- [ ] README.md updated with deployment URLs
- [ ] Team members have access to deployed app
- [ ] Environment variables documented
- [ ] Deployment process documented

---

## Post-Deployment

### Share with Team
- [ ] Frontend URL shared: `https://your-project.vercel.app`
- [ ] Backend URL shared: `https://your-backend.onrender.com`
- [ ] Login credentials shared (if needed)

### Monitor First 24 Hours
- [ ] Check for errors in logs
- [ ] Monitor user feedback
- [ ] Test all major features
- [ ] Fix any critical issues

---

## Troubleshooting Reference

### Backend Issues
| Issue | Solution |
|-------|----------|
| Service won't start | Check Render logs, verify env variables |
| Database connection failed | Verify MongoDB connection string, check network access |
| API returns 500 errors | Check Render logs for error details |

### Frontend Issues
| Issue | Solution |
|-------|----------|
| API calls fail | Check VITE_API_URL, verify CORS settings |
| Map doesn't load | Verify VITE_MAPTILER_KEY |
| 404 on page refresh | Check vercel.json rewrites |

### Integration Issues
| Issue | Solution |
|-------|----------|
| CORS errors | Update backend CORS with Vercel URL |
| Slow first load | Render free tier wakes from sleep (normal) |
| Authentication fails | Check JWT_SECRET matches on backend |

---

## Maintenance Schedule

### Weekly
- [ ] Check error logs
- [ ] Monitor API usage
- [ ] Check database storage

### Monthly
- [ ] Review MongoDB Atlas metrics
- [ ] Check MapTiler API usage
- [ ] Update dependencies if needed

---

## Upgrade Considerations

Consider upgrading when:
- [ ] Traffic exceeds 100k visitors/month
- [ ] Backend response time > 3 seconds consistently
- [ ] MongoDB storage > 400 MB (80% of free tier)
- [ ] MapTiler requests > 80k/month (80% of free tier)

---

## Emergency Contacts

- **Vercel Support**: https://vercel.com/support
- **Render Support**: https://render.com/docs/support
- **MongoDB Support**: https://support.mongodb.com

---

## Success Criteria

Your deployment is successful when:
- ✅ Backend health check returns 200 OK
- ✅ Frontend loads without errors
- ✅ Users can register and login
- ✅ Map displays correctly
- ✅ Area search returns results
- ✅ Analytics generate successfully
- ✅ No CORS errors in console
- ✅ All team members can access the app

---

## 🎉 Deployment Complete!

**Frontend**: `https://your-project.vercel.app`
**Backend**: `https://your-backend.onrender.com`

Share these URLs with your team and start using UrbanPulse!

---

*Last Updated: May 2, 2026*
