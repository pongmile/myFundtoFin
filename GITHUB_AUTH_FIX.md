# 🔐 แก้ปัญหา GitHub Authentication

## ปัญหาที่เจอ
```
Permission denied to pongmile/myFundtoFin.git
```

## วิธีแก้ไข (เลือก 1 จาก 2 วิธี)

### วิธีที่ 1: ใช้ GitHub CLI (แนะนำ - ง่ายที่สุด) ⭐

1. **ติดตั้ง GitHub CLI:**
   - ดาวน์โหลดจาก: https://cli.github.com/
   - หรือใช้ winget: `winget install --id GitHub.cli`

2. **Login:**
   ```bash
   gh auth login
   ```
   - เลือก: GitHub.com
   - เลือก: HTTPS
   - Authenticate with browser: Yes
   - Follow the instructions in browser

3. **ตั้งค่า git credential helper:**
   ```bash
   gh auth setup-git
   ```

4. **Push อีกครั้ง:**
   ```bash
   git push
   ```

---

### วิธีที่ 2: ใช้ Personal Access Token (PAT)

1. **สร้าง Personal Access Token:**
   - ไปที่ GitHub.com
   - คลิกรูปโปรไฟล์ → Settings
   - Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - ตั้งชื่อ: "Vercel Deploy Token"
   - เลือก scopes:
     - ✅ repo (ทั้งหมด)
     - ✅ workflow
   - Generate token
   - **คัดลอกทันที!** (จะไม่เห็นอีกครั้ง)

2. **ใช้ Token แทนรหัสผ่าน:**
   ```bash
   # ลบ credential เก่า
   git config --global --unset credential.helper
   
   # ตั้งค่าใหม่
   git config --global credential.helper manager-core
   
   # Push (จะถามรหัสผ่าน ให้ใส่ Token แทน)
   git push
   ```
   
   - Username: `pongmile`
   - Password: `<paste your token here>`

3. **หรือใช้ Token ใน URL:**
   ```bash
   git remote set-url origin https://<YOUR_TOKEN>@github.com/pongmile/myFundtoFin.git
   git push
   ```

---

### วิธีที่ 3: ใช้ SSH (สำหรับผู้ใช้ขั้นสูง)

1. **สร้าง SSH Key:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **เพิ่ม SSH Key ใน GitHub:**
   ```bash
   # คัดลอก public key
   cat ~/.ssh/id_ed25519.pub
   ```
   - ไปที่ GitHub → Settings → SSH and GPG keys
   - New SSH key → Paste

3. **เปลี่ยน remote เป็น SSH:**
   ```bash
   git remote set-url origin git@github.com:pongmile/myFundtoFin.git
   git push
   ```

---

## Quick Fix: ใช้ GitHub Desktop (ง่ายสุด!)

1. ดาวน์โหลด **GitHub Desktop**: https://desktop.github.com/
2. Login ด้วย GitHub account
3. Add Local Repository → เลือกโฟลเดอร์โปรเจค
4. Push to origin ด้วย UI

---

## หลังจากแก้ไขแล้ว

```bash
# ตรวจสอบว่า push ได้
git push

# ถ้าสำเร็จจะเห็น
# Enumerating objects...
# Writing objects: 100% 
# Total XX (delta XX), reused 0 (delta 0)
# To https://github.com/pongmile/myFundtoFin.git
#    abc1234..def5678  main -> main
```

ตอนนี้พร้อม deploy บน Vercel แล้ว! ไปต่อที่ VERCEL_DEPLOYMENT.md
