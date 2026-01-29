# 🚀 Quick Start: Deploy to Vercel

## ⚡ ทำตามนี้เลย (5 นาทีเสร็จ!)

### Step 1: แก้ปัญหา GitHub Push ก่อน ⚠️

คุณเจอ error: `Permission denied` ต้องแก้ก่อน

**วิธีที่เร็วที่สุด:**

```powershell
# 1. ติดตั้ง GitHub CLI
winget install --id GitHub.cli

# 2. Login
gh auth login
# เลือก: GitHub.com → HTTPS → Login via browser

# 3. ตั้งค่า git
gh auth setup-git

# 4. Push อีกครั้ง
git push
```

หรือดูวิธีอื่นๆ ที่ [GITHUB_AUTH_FIX.md](GITHUB_AUTH_FIX.md)

---

### Step 2: ไป Vercel

1. เปิด **https://vercel.com**
2. คลิก **Sign Up** → Continue with GitHub
3. คลิก **Add New...** → Project
4. Import **pongmile/myFundtoFin**

---

### Step 3: ใส่ Environment Variables (คัดลอกจาก .env.local)

```powershell
# ดูค่าใน .env.local
cat .env.local
```

**ใส่ใน Vercel:**

| Name | Value (คัดลอกจาก .env.local) |
|------|------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://posxvcdusimhewzfxofe.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJhbGc... (คัดลอกทั้งหมด) |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGc... (คัดลอกทั้งหมด) |
| `CRON_SECRET` | สร้างใหม่ เช่น `MySecret2026!` |

**สำคัญ!** เลือก Environment: **Production, Preview, Development** ทั้ง 3 ช่อง

---

### Step 4: Deploy!

1. คลิก **Deploy**
2. รอ 3-5 นาที ☕
3. เสร็จแล้ว! คุณจะได้ URL เช่น `https://my-fundto-fin.vercel.app`

---

### Step 5: ทดสอบ

**เปิดเว็บ:**
```
https://your-app.vercel.app
```

**ทดสอบ Cron (บันทึกอัตโนมัติ):**
```powershell
$headers = @{ "Authorization" = "Bearer YOUR_CRON_SECRET" }
Invoke-WebRequest -Uri "https://your-app.vercel.app/api/wealth-history/cron" -Method POST -Headers $headers
```

---

## ✅ เสร็จแล้ว!

ตอนนี้:
- ✅ เว็บออนไลน์แล้ว
- ✅ ทุกครั้งที่ `git push` → Vercel deploy อัตโนมัติ
- ✅ Cron บันทึก wealth history ทุกวันเที่ยงคืน

---

## 🔄 การอัพเดทต่อไปนี้

```bash
# แก้โค้ด
# ...

# Commit และ Push
git add .
git commit -m "Update feature"
git push

# Vercel จะ deploy อัตโนมัติภายใน 3-5 นาที!
```

ดู deployment status: https://vercel.com/dashboard

---

## 📚 อ่านเพิ่มเติม

- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - คู่มือฉบับสมบูรณ์
- [DAILY_SNAPSHOT_SETUP.md](DAILY_SNAPSHOT_SETUP.md) - ตั้งค่า Cron แบบอื่นๆ
- [GITHUB_AUTH_FIX.md](GITHUB_AUTH_FIX.md) - แก้ปัญหา GitHub authentication
