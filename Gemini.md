# Project Guideline (Gemini & AI Agents)

ไฟล์นี้สร้างขึ้นเพื่อช่วยนำทางและระบุแนวทางการพัฒนาของโปรเจกต์นี้ให้กับ Gemini และ AI Coding Assistants ตัวอื่นๆ เพื่อให้สามารถสืบค้น ค้นหาไฟล์ และเขียนโค้ดได้ตรงตามสถาปัตยกรรมของโปรเจกต์อย่างถูกต้อง

---

## 🚀 ข้อมูลโปรเจกต์ (Project Overview)
ระบบเว็บแอปพลิเคชันบริหารจัดการงานในรูปแบบกระดาน Kanban (ToDo List) ที่รองรับการทำงานร่วมกันเป็นทีม และมีระบบแจ้งเตือนผ่าน **Email (Resend)** และ **LINE (Messaging API / LINE Login)** แบบแยกหัวข้อแจ้งเตือนรายคน

---

## 🛠️ Stack เทคโนโลยีที่ใช้งาน
1. **Core:** React 19 / Next.js 15+ (App Router)
2. **Styling:** Vanilla CSS (เขียนควบคุมผ่าน `src/app/globals.css`)
3. **Database & ORM:** PostgreSQL / Prisma ORM
4. **Authentication:** NextAuth.js (v5 / Auth.js)
   * รองรับ Credentials (Email/Password), Google, GitHub, และ LINE Login (OAuth)
5. **Notifications:**
   * **Email:** Resend (React Email Templates อยู่ใน `src/emails`)
   * **LINE:** `@line/bot-sdk` (ยิงผ่าน Push Message API ไปยัง LINE User ID)

---

## 📁 โครงสร้างโฟลเดอร์สำคัญ (Key Directories)
* `src/app/` -> หน้าหลักและ API Routes ทั้งหมด (Next.js App Router)
  * `src/app/page.tsx` -> หน้า Frontend Dashboard หลักและ Modals ทั้งหมด
  * `src/app/api/notifications/send/route.ts` -> API ยิงส่งการแจ้งเตือน
  * `src/app/api/webhooks/line/route.ts` -> Webhook รองรับการแชทคุยกับบอท LINE
* `src/lib/` -> ไฟล์คอนฟิกและเครื่องมือแชร์ร่วมกัน
  * `src/lib/auth.ts` -> คอนฟิก NextAuth และ OAuth Providers
  * `src/lib/db.ts` -> Prisma Client Instantiation
* `src/components/` -> UI Components ที่นำกลับมาใช้ซ้ำ (เช่น `CustomSelect.tsx`)
* `prisma/schema.prisma` -> Schema ฐานข้อมูลหลักของระบบ

---

## ⚙️ การตั้งค่าสภาพแวดล้อม (.env Configuration)
แอปพลิเคชันนี้ใช้ตัวแปรสภาพแวดล้อมหลักดังนี้:
* `DATABASE_URL` -> ลิงก์เชื่อมฐานข้อมูล PostgreSQL
* `NEXTAUTH_URL` -> ลิงก์หลักของเว็บ (Local ใช้ `http://localhost:3000`)
* `NEXT_PUBLIC_LINE_BOT_ID` -> ID ของ LINE Official Account (เช่น `@yourbot`)
* `LINE_CLIENT_ID` & `LINE_CLIENT_SECRET` -> รับจาก LINE Login (ใช้สำหรับการเชื่อมต่อผูกบัญชีในเว็บ)
* `LINE_CHANNEL_ACCESS_TOKEN` & `LINE_CHANNEL_SECRET` -> รับจาก Messaging API (ใช้สำหรับยิง Push Message แจ้งเตือนเข้าแชท)
* `RESEND_API_KEY` -> ใช้ส่ง Email

---

## 💡 แนวปฏิบัติสำหรับ AI (Developer & AI Instructions)
1. **หลีกเลี่ยงการใช้ TailwindCSS:** เว็บนี้ดีไซน์ด้วย Vanilla CSS แบบแฮนด์เมดทั้งหมดใน `globals.css` ห้ามสร้างคลาสยูทิลิตี้แบบ Tailwind เว้นแต่จะได้รับคำสั่ง
2. **ใช้ CustomSelect เสมอ:** ห้ามใช้แท็ก `<select>` และ `<option>` ดั้งเดิมของเบราว์เซอร์ในส่วนของ Modal ให้เรียกใช้ `<CustomSelect>` จาก `src/components/CustomSelect` เสนอเพื่อรักษาดีไซน์ให้กลมกลืน
3. **ระมัดระวังเรื่องประเภทข้อมูล NextAuth:** session user อาจเป็น undefined ได้ในบางคอมโพเนนต์ ให้เรียกใช้งานแบบ Optional Chaining (`session?.user?.id`) เสมอเพื่อเลี่ยงปัญหาการคอมไพล์ TypeScript ไม่ผ่าน
