# 📝 ToDo List & Kanban Board (Team Collaboration)

เว็บแอปพลิเคชันบริหารจัดการงานแบบกระดาน Kanban และ ToDo List สำหรับการทำงานร่วมกันเป็นทีม รองรับระบบจับเวลา Pomodoro และระบบแจ้งเตือนผ่าน Email (Resend) และ LINE Messaging API

---

## 🚀 เริ่มต้นใช้งานบนเครื่อง Local (Local Development)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าสภาพแวดล้อม (.env)
คัดลอกไฟล์ `.env.example` มาเป็น `.env` (หากยังไม่มี):
```bash
# ตัวอย่างการตั้งค่าสำหรับ Local Docker PostgreSQL
DATABASE_URL="postgresql://todo_user:todo_password@localhost:5432/todolist_db"
DIRECT_URL="postgresql://todo_user:todo_password@localhost:5432/todolist_db"
```

### 3. เริ่มต้นฐานข้อมูล Local ผ่าน Docker Compose
รันคำสั่งเพื่อเปิด PostgreSQL Container และ pgAdmin:
```bash
npm run db:up
```
> [!TIP]
> - **PostgreSQL:** `localhost:5432` (User: `todo_user`, Password: `todo_password`, DB: `todolist_db`)
> - **pgAdmin Web UI:** เปิดเข้าผ่านเบราว์เซอร์ที่ [http://localhost:5050](http://localhost:5050)
>   - Email: `admin@admin.com`
>   - Password: `admin`

### 4. ซิงค์โครงสร้างตารางฐานข้อมูล (Prisma Push)
```bash
npm run db:push
```

### 5. สร้างข้อมูลเริ่มต้นจำลอง (Seed Database)
```bash
npm run db:seed
```
ข้อมูลบัญชีทดสอบที่ถูกสร้างขึ้น:
* 👤 **User ทั่วไป:** `test@example.com` / รหัสผ่าน: `password123`
* 🛡️ **Admin User:** `admin@todolist.local` / รหัสผ่าน: `admin123`

### 6. เริ่มต้นรันเซิร์ฟเวอร์ Next.js
```bash
npm run dev
```
เปิดใช้งานเว็บผ่านเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## 🛠️ คำสั่งที่มีประโยชน์ (Helpful Scripts)

| คำสั่ง | คำอธิบาย |
| :--- | :--- |
| `npm run dev` | เริ่มต้นเซิร์ฟเวอร์สำหรับ Development |
| `npm run build` | คอมไพล์โปรเจกต์สำหรับ Production |
| `npm run db:up` | เริ่มต้น Docker Container สำหรับ PostgreSQL & pgAdmin |
| `npm run db:down` | ปิดและหยุดการทำงานของ Docker Container |
| `npm run db:push` | อัปเดตโครงสร้างตารางในฐานข้อมูลตาม `schema.prisma` |
| `npm run db:seed` | นำเข้าข้อมูลจำลอง (User, Team, Projects, Tasks) |
| `npm run db:studio`| เปิด Prisma Studio ผ่านเว็บเบราว์เซอร์เพื่อดูข้อมูลในฐานข้อมูล |

---

## ☁️ การสลับไปใช้งาน Cloud (Supabase / Production)
หากต้องการสลับไปเชื่อมต่อกับ Supabase ให้เปิดไฟล์ `.env` แล้วสลับไปใช้ Connection String ของ Supabase:
```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```
แล้วรัน `npx prisma db push` เพื่อปรับปรุงโครงสร้างตารางบน Cloud
