# ✅ Setup Checklist

ใช้ checklist นี้เพื่อตรวจสอบว่าคุณได้ตั้งค่าทุกอย่างถูกต้องแล้ว

## 📋 Pre-Deployment Checklist

### 1. Supabase Setup

- [ ] สร้าง Supabase account แล้ว
- [ ] สร้าง Project ใหม่แล้ว
- [ ] รัน SQL จากไฟล์ `supabase-schema.sql` แล้ว
- [ ] ตรวจสอบว่า 6 ตารางถูกสร้างแล้ว:
  - [ ] cash_accounts
  - [ ] stocks
  - [ ] crypto
  - [ ] liabilities
  - [ ] wealth_history
  - [ ] price_cache
- [ ] คัดลอก Project URL แล้ว
- [ ] คัดลอก anon/public key แล้ว

### 2. Environment Variables

- [ ] เปิดไฟล์ `.env.local`
- [ ] แก้ไข `NEXT_PUBLIC_SUPABASE_URL` ใส่ URL ของคุณ
- [ ] แก้ไข `NEXT_PUBLIC_SUPABASE_ANON_KEY` ใส่ key ของคุณ
- [ ] บันทึกไฟล์
- [ ] ตรวจสอบว่าไม่มี space หรือ quote (" ') พิเศษ

### 3. Local Testing

- [ ] รัน `npm install` (ถ้ายังไม่ได้รัน)
- [ ] รัน `npm run dev`
- [ ] เปิด http://localhost:3000
- [ ] ไม่มี error ใน browser console
- [ ] เห็นหน้า Dashboard

### 4. Test Basic Features

- [ ] เพิ่มบัญชีเงินสดได้
- [ ] บันทึกข้อมูลลง database สำเร็จ
- [ ] แก้ไขข้อมูลได้
- [ ] ลบข้อมูลได้
- [ ] ดึงข้อมูลจาก database มาแสดงได้

### 5. Test API Integration

- [ ] เพิ่มหุ้น/ETF ได้
- [ ] คลิก "รีเฟรชราคา" แล้วดึงราคาจาก Yahoo Finance ได้
- [ ] เพิ่ม Crypto ได้
- [ ] ดึงราคา Crypto จาก Bitkub หรือ API อื่นได้

---

## 🚀 Deployment Checklist (Vercel)

### 1. Prepare Repository

- [ ] Push โค้ดขึ้น GitHub/GitLab/Bitbucket
- [ ] ตรวจสอบว่า `.env.local` **ไม่ได้** commit ขึ้นไป (อยู่ใน .gitignore)
- [ ] ตรวจสอบว่า `node_modules/` ไม่ได้ commit

### 2. Vercel Setup

- [ ] สมัคร/Login Vercel
- [ ] Import repository
- [ ] ตั้งค่า Framework: Next.js
- [ ] ใส่ Environment Variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Deploy

- [ ] คลิก Deploy
- [ ] รอจน deployment สำเร็จ
- [ ] เปิด URL ที่ Vercel ให้มา
- [ ] ทดสอบ features พื้นฐาน

### 4. Post-Deployment

- [ ] ลองเพิ่มข้อมูลบน production
- [ ] ตรวจสอบว่าบันทึกได้
- [ ] ตรวจสอบว่าดึงราคาได้
- [ ] Share URL กับคนอื่นได้

---

## 🐛 Troubleshooting Checklist

### หากเว็บไม่เปิด / มี Error

- [ ] ตรวจสอบ `.env.local` มี URL และ key ถูกต้อง
- [ ] Restart dev server (`Ctrl+C` แล้ว `npm run dev` ใหม่)
- [ ] เช็ค browser console (F12) ว่ามี error อะไร
- [ ] เช็ค terminal ว่ามี error อะไร

### หากบันทึกข้อมูลไม่ได้

- [ ] เช็คว่า Supabase project ยังเปิดอยู่
- [ ] เช็คว่ารัน SQL สร้างตารางแล้ว
- [ ] ลอง query ใน Supabase SQL Editor: `SELECT * FROM cash_accounts;`
- [ ] เช็ค browser console ดู error message

### หากดึงราคาไม่ได้

- [ ] เช็คว่าต่ออินเทอร์เน็ต
- [ ] ลองรอ 1-2 นาที แล้วรีเฟรชใหม่
- [ ] เช็ค API endpoints ยังใช้ได้อยู่หรือไม่
- [ ] ดู cache ว่ามีราคาเก่าไหม

### หาก Build ไม่สำเร็จ

- [ ] ลบ `.next` folder
- [ ] รัน `npm install` ใหม่
- [ ] รัน `npm run build`
- [ ] อ่าน error message ดูว่า missing อะไร

---

## 📝 Optional Enhancements Checklist

### Features คุณอาจอยากเพิ่ม:

- [ ] Authentication (Login/Register)
- [ ] Multi-user support
- [ ] Email notifications
- [ ] Export to CSV/Excel
- [ ] Dark mode
- [ ] More chart types
- [ ] Mobile app (React Native)
- [ ] Scheduled price updates (cron job)
- [ ] Alert system (price targets)

### Improvements:

- [ ] Add more bank logos
- [ ] Add more data sources
- [ ] Optimize API calls
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Add unit tests
- [ ] Add E2E tests

---

## 🎯 Production Ready Checklist

### Performance

- [ ] Enable Vercel Analytics
- [ ] Monitor response times
- [ ] Check database query performance
- [ ] Optimize images (if any)

### Security

- [ ] Enable Supabase RLS policies
- [ ] Rotate Supabase keys ทุก 3-6 เดือน
- [ ] Monitor for suspicious activities
- [ ] Backup database เป็นประจำ

### Monitoring

- [ ] ตั้งค่า error tracking (Sentry)
- [ ] ดู Vercel logs เป็นประจำ
- [ ] Monitor API rate limits
- [ ] Check database usage

---

## ✨ You're All Set!

เมื่อทำครบทุก checkbox แล้ว คุณพร้อมใช้งาน Wealth Portfolio Tracker แล้ว! 🎉

### Quick Reference:

- **Dev Server**: `npm run dev` → http://localhost:3000
- **Production Build**: `npm run build`
- **Documentation**: 
  - [README.md](./README.md)
  - [QUICKSTART.md](./QUICKSTART.md)
  - [DEPLOYMENT.md](./DEPLOYMENT.md)
  - [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

---

**Happy Wealth Tracking! 💰📈**
