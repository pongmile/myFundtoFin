# ตั้งค่าการบันทึกประวัติ Wealth อัตโนมัติทุกวัน

## ปัญหา
ตอนนี้แอพยังไม่มีระบบบันทึกประวัติ Wealth อัตโนมัติทุกวัน คุณต้องบันทึกข้อมูลด้วยตัวเอง

## วิธีแก้ไข: เลือก 1 จาก 3 วิธี

### วิธีที่ 1: ใช้ Vercel Cron (แนะนำสำหรับผู้ใช้ Vercel) ⭐

**ขั้นตอน:**

1. **เพิ่ม Environment Variable ใน Vercel:**
   - ไปที่ Project Settings → Environment Variables
   - เพิ่ม `CRON_SECRET` = สร้างรหัสลับยาวๆ (เช่น `my_super_secret_key_123456`)

2. **Deploy โปรเจค:**
   ```bash
   git add .
   git commit -m "Add daily wealth history cron"
   git push
   ```

3. **เปิดใช้งาน Cron:**
   - Vercel จะอ่านไฟล์ `vercel.json` อัตโนมัติ
   - Cron จะทำงานทุกวันเวลา 00:00 UTC (07:00 น. เวลาไทย)

4. **ทดสอบ:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/wealth-history/cron \
     -H "Authorization: Bearer your_cron_secret"
   ```

**ข้อดี:** ง่าย ฟรี ไม่ต้องตั้งค่าอะไรเพิ่ม  
**ข้อจำกัด:** ต้อง deploy บน Vercel (Pro plan สำหรับ production)

---

### วิธีที่ 2: ใช้ GitHub Actions (ใช้กับ hosting ใดก็ได้)

**ขั้นตอน:**

1. **เพิ่ม Secrets ใน GitHub:**
   - ไปที่ Repository → Settings → Secrets and variables → Actions
   - เพิ่ม:
     - `CRON_SECRET` = รหัสลับของคุณ
     - `APP_URL` = URL ของแอพ (เช่น https://myfundtofin.vercel.app)

2. **เพิ่ม CRON_SECRET ใน .env.local:**
   ```env
   CRON_SECRET=your_secret_key_here
   ```

3. **Deploy โปรเจค:**
   ```bash
   git add .
   git commit -m "Add GitHub Actions daily snapshot"
   git push
   ```

4. **ทดสอบ Manual Run:**
   - ไปที่ GitHub → Actions → Daily Wealth History Snapshot
   - คลิก "Run workflow"

**ข้อดี:** ฟรี ใช้กับ hosting ใดก็ได้  
**ข้อเสีย:** ต้อง setup GitHub Secrets

---

### วิธีที่ 3: ใช้ External Cron Service

**ใช้บริการ:** [cron-job.org](https://cron-job.org) (ฟรี)

**ขั้นตอน:**

1. **เพิ่ม CRON_SECRET ใน .env.local:**
   ```env
   CRON_SECRET=your_secret_key_here
   ```

2. **Deploy แอพ**

3. **สร้าง Cron Job:**
   - สมัคร cron-job.org
   - สร้าง job ใหม่:
     - URL: `https://your-app.vercel.app/api/wealth-history/cron`
     - Schedule: `0 0 * * *` (ทุกวัน เที่ยงคืน)
     - Method: POST
     - Headers: 
       ```
       Authorization: Bearer your_cron_secret
       ```

**ข้อดี:** ใช้กับ hosting ใดก็ได้ มี UI ง่าย  
**ข้อเสีย:** พึ่งบริการภายนอก

---

## การบันทึกด้วยตัวเองตอนนี้

ถ้ายังไม่ได้ตั้งค่า Cron คุณสามารถบันทึกด้วยตัวเองได้:

```bash
# ใช้ curl
curl -X POST http://localhost:3000/api/wealth-history/save

# หรือเปิดใน Browser
http://localhost:3000/api/wealth-history/save
```

---

## ตรวจสอบว่าวันนี้บันทึกแล้วหรือยัง

```bash
curl http://localhost:3000/api/wealth-history/cron
```

---

## API Endpoints ที่สร้างใหม่

1. **POST** `/api/wealth-history/save` - บันทึก snapshot วันนี้ (สำหรับใช้ด้วยตัวเอง)
2. **POST** `/api/wealth-history/cron` - Cron endpoint (ต้องมี Authorization header)
3. **GET** `/api/wealth-history/cron` - ตรวจสอบสถานะวันนี้

---

## สรุป

✅ สร้าง API endpoint สำหรับบันทึกอัตโนมัติแล้ว  
✅ รองรับ 3 วิธีในการตั้งค่า Cron  
✅ มี Security ด้วย CRON_SECRET  
⚠️ ต้องเลือก 1 วิธีและตั้งค่าเพิ่มเติม

**แนะนำ:** ถ้า deploy บน Vercel ใช้ **วิธีที่ 1** (ง่ายที่สุด)
