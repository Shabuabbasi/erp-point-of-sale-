# Deploy Superstore ERP to Render

This project deploys as **two services** on [Render](https://render.com):

| Service | Type | Folder |
|---------|------|--------|
| `superstore-erp-api` | Node Web Service | `backend/` |
| `superstore-erp` | Static Site | `frontend/` |

Database: **MongoDB Atlas** (already configured in your `.env`).

---

## Before you deploy

### 1. Push code to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

Your repo: `https://github.com/Shabuabbasi/erp-point-of-sale-`

### 2. MongoDB Atlas — allow Render

In [MongoDB Atlas](https://cloud.mongodb.com):

1. Go to **Network Access**
2. Click **Add IP Address**
3. Choose **Allow Access from Anywhere** (`0.0.0.0/0`)

Render uses dynamic IPs on the free tier, so this is required.

### 3. Get your MongoDB connection string

Use the same URI from `backend/.env`, with the database name:

```text
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/superstore_erp?retryWrites=true&w=majority
```

---

## Option A — Deploy with Blueprint (recommended)

1. Go to [render.com/dashboard](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repo `erp-point-of-sale-`
4. Render reads `render.yaml` and creates both services
5. When prompted, set these **secret** environment variables:

**Backend (`superstore-erp-api`):**

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your Atlas connection string |
| `CLIENT_URL` | Leave empty for now — set after frontend deploys |

**Frontend (`superstore-erp`):**

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://superstore-erp-api.onrender.com/api` |

> Replace `superstore-erp-api` with your actual backend service URL from Render.

6. Wait for both services to finish deploying

### After first deploy

1. Copy your **frontend URL** (e.g. `https://superstore-erp.onrender.com`)
2. In Render → **Backend service** → **Environment** → set:
   ```text
   CLIENT_URL=https://superstore-erp.onrender.com
   ```
3. Backend will redeploy automatically

### Seed the database (one time)

1. Render Dashboard → **superstore-erp-api** → **Shell**
2. Run:
   ```bash
   npm run seed
   ```
3. Demo logins:
   - Admin: `admin@superstore.com` / `admin123`
   - Cashier: `cashier@superstore.com` / `cashier123`

---

## Option B — Manual deploy

### Backend (Web Service)

1. **New +** → **Web Service**
2. Connect GitHub repo
3. Settings:

| Setting | Value |
|---------|-------|
| Name | `superstore-erp-api` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | Free |

4. Environment variables:

```text
MONGODB_URI=mongodb+srv://...
JWT_SECRET=long_random_secret_string
JWT_EXPIRES_IN=7d
TAX_RATE=0
CLIENT_URL=https://your-frontend.onrender.com
```

### Frontend (Static Site)

1. **New +** → **Static Site**
2. Same GitHub repo

| Setting | Value |
|---------|-------|
| Name | `superstore-erp` |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

3. Environment variable (required at build time):

```text
VITE_API_URL=https://superstore-erp-api.onrender.com/api
```

4. **Redirects/Rewrites** (order matters — API rule MUST be first):

| Source | Destination |
|--------|-------------|
| `/api/*` | `https://superstore-erp-api.onrender.com/api/*` |
| `/*` | `/index.html` |

---

## Important notes

### Free tier cold starts
Render free services **sleep after 15 minutes** of inactivity. First request may take 30–60 seconds.

### Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `MONGODB_URI` | Backend | MongoDB Atlas connection |
| `JWT_SECRET` | Backend | Auth token signing |
| `CLIENT_URL` | Backend | CORS — your frontend URL |
| `VITE_API_URL` | Frontend | API base URL (set before build) |

### Local vs production

| | Local | Production |
|---|-------|------------|
| Frontend API | Vite proxy `/api` → localhost:5000 | `VITE_API_URL` env var |
| CORS | localhost allowed | `CLIENT_URL` required |

### If login returns 200 with empty body (most common bug)

**Symptom:** POST `/api/auth/login` on `superstore-erp.onrender.com` returns `200` but `content-length: 0`, login never redirects.

**Cause:** The frontend is calling itself (static site), not the backend. The SPA rewrite `/* → index.html` swallows API requests.

**Fix (do both):**

1. **Frontend env var** → Render → `superstore-erp` → Environment:
   ```text
   VITE_API_URL=https://superstore-erp-api.onrender.com/api
   ```
   Then click **Manual Deploy → Clear build cache & deploy** (Vite bakes this at build time).

2. **Add API proxy rewrite** → Render → `superstore-erp` → Redirects/Rewrites:
   | Source | Destination |
   |--------|-------------|
   | `/api/*` | `https://superstore-erp-api.onrender.com/api/*` |
   | `/*` | `/index.html` |

   The `/api/*` rule must be **above** the `/*` rule.

3. **Backend CORS** → Render → `superstore-erp-api` → Environment:
   ```text
   CLIENT_URL=https://superstore-erp.onrender.com
   ```

4. **Verify backend directly** — open in browser:
   ```text
   https://superstore-erp-api.onrender.com/
   ```
   Should show: `{"message":"Superstore ERP API is running"}`

### If login fails after deploy

1. Check backend URL opens: `https://superstore-erp-api.onrender.com/` → should show JSON message
2. Check `VITE_API_URL` ends with `/api` and frontend was **rebuilt** after setting it
3. Check `CLIENT_URL` matches frontend URL exactly (no trailing slash)
4. Run `npm run seed` in backend Shell if users don't exist
5. Check MongoDB Atlas Network Access allows `0.0.0.0/0`

---

## URLs after deploy

```text
Frontend:  https://superstore-erp.onrender.com
Backend:   https://superstore-erp-api.onrender.com
API:       https://superstore-erp-api.onrender.com/api
```

Replace with your actual Render service names.
