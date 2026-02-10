# 🚀 Deployment Guide - JustBecause Platform

Complete guide to deploy the JustBecause platform with NestJS backend on Render and Next.js frontend on Vercel.

---

## 📋 Prerequisites

- MongoDB Atlas account (free tier works)
- Render account (for backend)
- Vercel account (for frontend)
- GitHub repository
- All API keys ready (Stripe, Razorpay, Cloudinary, Twilio, Resend, OpenAI)

---

## Part 1: Deploy NestJS Backend to Render

### Step 1: Push Code to GitHub

```bash
cd justbecuase
git add .
git commit -m "Add NestJS backend with deployment config"
git push origin main
```

### Step 2: Create Web Service on Render

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml`

### Step 3: Configure Environment Variables

In Render Dashboard, add these environment variables:

```bash
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/justbecause
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxx
RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=xxxxxxxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxx
FRONTEND_URL=https://justbecause.vercel.app
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for build
3. Your API will be live at: `https://your-app.onrender.com`

### Step 5: Test API

Visit: `https://your-app.onrender.com/api` (should return "JustBecause API")
Visit: `https://your-app.onrender.com/docs` (Swagger docs)

---

## Part 2: Update Next.js for Production

### Step 1: Update Environment Variables

Edit `.env.production.local`:

```env
NEXT_PUBLIC_API_URL=https://your-app.onrender.com/api
```

Replace `your-app` with your actual Render app name.

### Step 2: Verify API Client

The API client (`lib/api-client.ts`) automatically uses:
- **Development**: `http://localhost:5001/api`
- **Production**: Your Render URL from `NEXT_PUBLIC_API_URL`

### Step 3: Test Locally with Production API

```bash
cd ..  # Root directory
pnpm run dev
```

Your Next.js app will now connect to the production API!

---

## Part 3: Deploy Next.js to Vercel

### Step 1: Install Vercel CLI (Optional)

```bash
pnpm add -g vercel
```

### Step 2: Deploy

**Option A: Via GitHub (Recommended)**

1. Push to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Vercel auto-detects Next.js
5. Add environment variables in Vercel dashboard
6. Deploy!

**Option B: Via CLI**

```bash
cd ..  # Root directory
vercel
```

### Step 3: Configure Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-app.onrender.com/api
NEXT_PUBLIC_APP_URL=https://justbecause.vercel.app
MONGODB_URI=mongodb+srv://...
BETTER_AUTH_SECRET=your-production-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

### Step 4: Update Backend CORS

Update `FRONTEND_URL` in Render with your Vercel URL:

```
FRONTEND_URL=https://your-app.vercel.app
```

---

## 🧪 Testing the Full Stack

### Test Backend API

```bash
# Health check
curl https://your-app.onrender.com/api

# Register user
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User"}'

# Login
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Test Frontend

1. Open `https://your-app.vercel.app`
2. Register a new user
3. Complete onboarding
4. Browse projects
5. Test search
6. Send messages

---

## 📊 Monitoring

### Render

- View logs: Render Dashboard → Logs
- Metrics: Dashboard → Metrics
- Auto-redeploy on Git push

### Vercel

- View logs: Vercel Dashboard → Deployments → View Function Logs
- Analytics: Dashboard → Analytics
- Auto-redeploy on Git push

---

## 🔧 Troubleshooting

### Backend not starting

1. Check Render logs for errors
2. Verify MongoDB connection string
3. Ensure all required env vars are set
4. Check port is 5001 or use `process.env.PORT`

### CORS errors

1. Update `FRONTEND_URL` in Render to match your Vercel URL
2. Redeploy backend

### API client not working

1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check browser console for errors
3. Test API endpoint directly with curl

### Database connection issues

1. Whitelist 0.0.0.0/0 in MongoDB Atlas (Network Access)
2. Verify connection string format
3. Ensure database user has read/write permissions

---

## 🎯 Development vs Production

| Environment | Backend API | Frontend |
|-------------|-------------|----------|
| **Development** | http://localhost:5001/api | http://localhost:3000 |
| **Production** | https://your-app.onrender.com/api | https://your-app.vercel.app |

The `lib/api-client.ts` automatically switches based on `NEXT_PUBLIC_API_URL`.

---

## 📝 Quick Deploy Commands

### Update Backend
```bash
cd justbecuase
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys
```

### Update Frontend
```bash
cd ..
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend API responding at `/api`
- [ ] Swagger docs available at `/docs`
- [ ] MongoDB connected successfully
- [ ] Frontend connecting to backend API
- [ ] Authentication working (register/login)
- [ ] File uploads working (Cloudinary)
- [ ] Payments working (Stripe/Razorpay test)
- [ ] Email sending working (Resend)
- [ ] SMS sending working (Twilio)
- [ ] AI search working (OpenAI)
- [ ] Real-time messaging working

---

## 🔐 Security Notes

1. **Never commit .env files**
2. Use strong JWT secrets (min 32 chars)
3. Use production API keys in production
4. Enable MongoDB IP whitelist
5. Set up Render/Vercel monitoring
6. Use HTTPS only in production
7. Rotate secrets regularly

---

## 📞 Support

- Backend API: http://localhost:5001/docs (dev) or https://your-app.onrender.com/docs (prod)
- Issues: GitHub Issues
- Logs: Render Dashboard + Vercel Dashboard

**Deployment complete! 🎉**
