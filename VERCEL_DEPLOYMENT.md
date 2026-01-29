# 🚀 Deploy to Vercel - คู่มือฉบับสมบูรณ์

## 📋 เตรียมตัวก่อน Deploy

### ✅ Checklist
- [ ] มี GitHub account
- [ ] โค้ดอยู่บน GitHub repository แล้ว
- [ ] มี Supabase project (ได้ URL และ Keys แล้ว)
- [ ] ได้อ่านไฟล์นี้จบ

---

## 🎯 ขั้นตอนที่ 1: Push โค้ดขึ้น GitHub

```bash
# ตรวจสอบว่ามี git init แล้วหรือยัง
git status

# ถ้ายังไม่มี ให้ init
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit
git commit -m "Initial commit - Ready for Vercel deployment"

# เชื่อมต่อกับ GitHub repository (ถ้ายังไม่ได้ทำ)
git remote add origin https://github.com/pongmile/myFundtoFin.git

# Push ขึ้น GitHub
git push -u origin main
```

**หมายเหตุ:** ถ้า remote มีอยู่แล้ว แค่ใช้ `git push`

---

## 🎯 ขั้นตอนที่ 2: สร้าง Vercel Account และ Deploy

### 2.1 สร้างบัญชี Vercel

1. ไปที่ **[vercel.com](https://vercel.com)**
2. คลิก **"Sign Up"**
3. เลือก **"Continue with GitHub"** (แนะนำ)
4. อนุญาต Vercel เข้าถึง GitHub

### 2.2 Import Project

1. ในหน้า Vercel Dashboard คลิก **"Add New..."** → **"Project"**
2. เลือก repository **"pongmile/myFundtoFin"**
3. คลิก **"Import"**

### 2.3 Configure Project

**Framework Preset:** Next.js (ควรเลือกอัตโนมัติ)

**Build and Output Settings:** (ใช้ค่า default)
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm install`

**Root Directory:** `./` (default)

---

## 🎯 ขั้นตอนที่ 3: ตั้งค่า Environment Variables (สำคัญมาก!)

### 3.1 เพิ่ม Environment Variables

ใน Configuration section คลิก **"Environment Variables"** แล้วเพิ่ม:

| Name | Value | Description |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://posxvcdusimhewzfxofe.supabase.co` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (คัดลอกจาก .env.local) | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` (คัดลอกจาก .env.local) | Supabase Service Role Key |
| `CRON_SECRET` | สร้างรหัสลับใหม่ เช่น `MySecureKey2026!` | สำหรับ Cron security |

**วิธีเพิ่ม Environment Variable:**
1. พิมพ์ชื่อใน "Name"
2. วาง value ใน "Value"
3. เลือก Environment: **Production, Preview, Development** (ทั้ง 3)
4. คลิก **"Add"**
5. ทำซ้ำสำหรับ variable ทั้งหมด

### 3.2 คัดลอก Keys จาก .env.local

```bash
# เปิดไฟล์ .env.local และคัดลอกค่าต่างๆ
cat .env.local
```

---

## 🎯 ขั้นตอนที่ 4: Deploy!

1. คลิก **"Deploy"** button
2. รอประมาณ 2-5 นาที (Vercel จะ build และ deploy)
3. เมื่อเสร็จจะได้ URL เช่น `https://my-fundto-fin.vercel.app`

---

## 🎯 ขั้นตอนที่ 5: ตรวจสอบการ Deploy

### 5.1 ทดสอบเว็บไซต์

1. เปิด URL ที่ได้รับ
2. ตรวจสอบว่า Dashboard แสดงข้อมูลถูกต้อง
3. ลองเพิ่ม/ลบข้อมูลทดสอบ

### 5.2 ทดสอบ Cron Job (บันทึกอัตโนมัติทุกวัน)

**ตรวจสอบว่า Cron ทำงานหรือไม่:**

```bash
# ทดสอบด้วย curl (แทน YOUR_APP_URL และ YOUR_CRON_SECRET)
curl -X POST https://your-app.vercel.app/api/wealth-history/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**หรือใช้ PowerShell:**
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_CRON_SECRET"
}
Invoke-WebRequest -Uri "https://your-app.vercel.app/api/wealth-history/cron" -Method POST -Headers $headers | Select-Object -ExpandProperty Content
```

**ตรวจสอบ Cron Settings ใน Vercel:**
1. ไปที่ Project Settings → Crons
2. ควรเห็น `/api/wealth-history/cron` scheduled ที่ `0 0 * * *`

---

## 🎯 ขั้นตอนที่ 6: ตั้งค่า Auto Deploy (ทำอัตโนมัติอยู่แล้ว!)

Vercel ตั้งค่า auto-deploy ให้อัตโนมัติ! 🎉

### ทุกครั้งที่คุณ push ไป GitHub:

```bash
git add .
git commit -m "Update feature"
git push
```

Vercel จะ:
1. ✅ รับ notification จาก GitHub อัตโนมัติ
2. ✅ Build โปรเจคใหม่
3. ✅ Deploy เวอร์ชันใหม่ (ใช้เวลา 2-5 นาที)
4. ✅ ส่ง notification ให้คุณทาง email/Discord (ถ้าตั้งค่า)

### ดูสถานะ Deploy

1. ไปที่ **[vercel.com/dashboard](https://vercel.com/dashboard)**
2. เลือก project
3. ดูที่ tab **"Deployments"** จะเห็นประวัติทั้งหมด

---

## 🔧 การตั้งค่าเพิ่มเติม

### Custom Domain (ถ้าต้องการ)

1. ไปที่ Project Settings → Domains
2. เพิ่ม domain ของคุณ เช่น `myfund.com`
3. ตั้งค่า DNS ตามที่ Vercel บอก

### Notifications

1. ไปที่ Account Settings → Notifications
2. เลือกว่าอยากได้ notification แบบไหน:
   - Email
   - Discord
   - Slack

---

## 🐛 Troubleshooting

### ❌ Build Failed

**สาเหตุที่พบบ่อย:**
1. Environment Variables ไม่ครบ → เพิ่มให้ครบทั้ง 4 ตัว
2. Syntax error ในโค้ด → ดู Build Logs
3. Dependencies ขาด → ตรวจสอบ package.json

**วิธีแก้:**
1. ไปที่ Deployment ที่ล้มเหลว
2. คลิก "View Build Logs"
3. อ่าน error message
4. แก้ไข → Push ใหม่

### ❌ Dashboard ไม่แสดงข้อมูล

**ตรวจสอบ:**
1. Environment Variables ถูกต้องหรือไม่
2. Supabase database มีตารางครบหรือยัง (รัน schema)
3. เปิด Browser Console ดู error (F12)

### ❌ Cron ไม่ทำงาน

**ตรวจสอบ:**
1. `CRON_SECRET` ใน Vercel ตรงกับที่ใช้ test หรือไม่
2. ไฟล์ `vercel.json` ถูก deploy ไปด้วยหรือไม่
3. ดู Cron Logs ใน Vercel Dashboard

---

## 📊 Monitoring & Logs

### ดู Logs แบบ Real-time

1. ไปที่ Project → Deployments
2. คลิก deployment ล่าสุด
3. คลิก "Runtime Logs" หรือ "Build Logs"

### ดู Cron Execution Logs

1. Project Settings → Crons
2. คลิกที่ cron job
3. ดู execution history

---

## 💰 Pricing

### Free Plan (Hobby)
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions
- ✅ Cron jobs (จำกัดเวลา)
- ✅ เพียงพอสำหรับ personal use

### Pro Plan ($20/month)
- ✅ ทุกอย่างใน Hobby
- ✅ Team collaboration
- ✅ Advanced analytics
- ✅ Cron jobs แบบเต็มรูปแบบ
- ✅ Priority support

**สำหรับแอพนี้:** **Free Plan เพียงพอแล้ว!**

---

## ✅ Checklist หลัง Deploy

- [ ] เว็บเปิดได้ปกติ
- [ ] Dashboard แสดงข้อมูลถูกต้อง
- [ ] เพิ่ม/ลบข้อมูลได้
- [ ] Cron job ทำงาน (ทดสอบด้วย manual call)
- [ ] Auto-deploy ทำงาน (ลอง push commit ทดสอบ)
- [ ] บันทึก production URL ไว้
- [ ] ตั้งค่า notifications (ถ้าต้องการ)

---

## 🎉 เสร็จสิ้น!

ตอนนี้แอพของคุณ:
- ✅ Deploy บน Vercel แล้ว
- ✅ Auto-deploy ทุกครั้งที่ push ไป GitHub
- ✅ มี Cron job บันทึก wealth history ทุกวันเที่ยงคืน
- ✅ เข้าถึงได้จากทุกที่ทุกเวลา

**Production URL:** `https://your-app.vercel.app`

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🆘 Need Help?

1. Vercel Discord: [discord.gg/vercel](https://discord.gg/vercel)
2. Vercel Support: [vercel.com/support](https://vercel.com/support)
3. Check Build Logs ใน Vercel Dashboard
