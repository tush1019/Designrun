# 🚀 DESIGNRUN ko Internet par Live kaise karein

Aapki site ek **Node.js server** hai (`backend/server.js`) jo **website + API dono** ek
hi process me serve karta hai. Isliye sirf `backend/` folder deploy karna hai —
koi alag frontend hosting nahi chahiye. Free hostal par bas **npm install + npm start**
chalega.

---

## ✅ Option A — Render.com (sabse aasan, free tier)

1. Code ko **GitHub par push** karo (neeche "GitHub par daalna" dekho).
2. [render.com](https://render.com) par jaao → **New +** → **Web Service**.
3. GitHub repo connect karo aur yeh settings do:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. **Environment Variables** me ek add karo (production ke liye zaroori):
   - `JWT_SECRET` = koi bhi lamba random secret (e.g. 32+ characters)
5. **Create Web Service** dabao. Thodi der me aapko ek URL milega jaise
   `https://designrun.onrender.com` — bas yahi aapki live site hai. 🌐

> Note: Free tier me server thodi der idle rahe to "sleep" ho jaata hai; pehla
> request slow ho sakta hai (cold start). Production ke liye paid plan le lo.

---

## ✅ Option B — Railway.app

1. [railway.app](https://railway.app) par **New Project** → **Deploy from GitHub**.
2. Repo select karo. `railway.json` already configured hai.
3. **Variables** me `JWT_SECRET` set karo.
4. **Settings** me **Root Directory = `backend`** confirm karo.
5. Deploy hone par ek domain generate ho jayega.

---

## ✅ Option C — Vercel (serverless)

`backend/vercel.json` already hai. Vercel dashboard me:
1. Import GitHub repo.
2. **Root Directory:** `backend`
3. Framework preset: **Other** (koi build nahi).
4. Deploy.

> Vercel serverless hai — SQLite file storage restart par reset ho sakti hai.
> Isliye **Render ya Railway better hain** (unme persistent disk milta hai).

---

## 🔑 JWT_SECRET kyun zaroori hai?

- `JWT_SECRET` set karne se **saare sessions secure** rehte hain.
- Agar set nahi kiya to server khud ek secret generate karke `backend/data/` me
  save kar leta hai — local/dev ke liye theek hai, par **production me env var use karo**.

Ek strong secret banane ke liye terminal me:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📦 GitHub par daalna (agar git nahi hai)

Aapke system par git abhi installed nahi tha. Install karo:
👉 https://git-scm.com/download/win

Phir project folder me:
```bash
cd "c:\Users\tusha\OneDrive\Desktop\STURCTURE"
git init
git add .
git commit -m "DESIGNRUN ready to deploy"
```

GitHub par:
1. [github.com](https://github.com) par **New repository** banao (naam: `designrun`).
2. Uske commands copy karke yahan chalao:
```bash
git remote add origin https://github.com/<aapka-username>/designrun.git
git branch -M main
git push -u origin main
```

> `.gitignore` already lagaya hai — database, secret key, `node_modules` push
> **nahi** honge (safe hai).

---

## ✔️ Deploy se pehle checklist

- [x] `backend/server.js` `PORT` env var use karta hai (auto)
- [x] `0.0.0.0` par bind karta hai (hosting ke liye sahi)
- [x] Static files serve karta hai + SPA fallback
- [x] `JWT_SECRET` env support
- [x] Cache headers (assets hard-cache, HTML no-cache)
- [x] `.gitignore`, `render.yaml`, `railway.json`, `vercel.json` ready
- [x] `npm run smoke` → 27 passed

---

## 🧪 Locally test karna

```bash
cd backend
npm install
npm start
```
Phir browser me: **http://localhost:3000**
