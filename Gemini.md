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
   * ตั้งค่า `allowDangerousEmailAccountLinking: true` สำหรับ Google/GitHub/LINE ใน `src/lib/auth.ts` เพื่อให้บัญชีเชื่อมต่อเข้าด้วยกันได้อย่างปลอดภัยหากใช้ Email เดียวกัน
5. **Notifications:**
   * **Email:** Resend (React Email Templates อยู่ใน `src/emails`)
   * **LINE:** `@line/bot-sdk` (ยิงผ่าน Push Message APIไปยัง LINE User ID)

---

## 📁 โครงสร้างโฟลเดอร์สำคัญ (Key Directories)
* `src/app/` -> หน้าหลักและ API Routes ทั้งหมด (Next.js App Router)
  * `src/app/page.tsx` -> หน้า Frontend Dashboard หลักและ Modals ทั้งหมด (รวมถึงฟอร์มและปุ่มกด Edit/Delete/Logout ต่างๆ)
  * `src/app/api/tasks/route.ts` -> API จัดการข้อมูล Task และ Project (รองรับ GET, POST, PUT, DELETE)
  * `src/app/api/notifications/send/route.ts` -> API ยิงส่งการแจ้งเตือน
  * `src/app/api/webhooks/line/route.ts` -> Webhook รองรับการแชทคุยกับบอท LINE
* `src/lib/` -> ไฟล์คอนฟิกและเครื่องมือแชร์ร่วมกัน
  * `src/lib/auth.ts` -> คอนฟิก NextAuth, Providers และระบบ Account Linking
  * `src/lib/db.ts` -> Prisma Client Instantiation (รองรับการทำ Connection Pooling ร่วมกับ Supabase)
* `src/components/` -> UI Components ที่นำกลับมาใช้ซ้ำ (เช่น `CustomSelect.tsx`, `Modal.tsx`)
* `prisma/schema.prisma` -> Schema ฐานข้อมูลหลักของระบบ

---

## ⚙️ การตั้งค่าสภาพแวดล้อม (.env Configuration)
แอปพลิเคชันนี้ใช้ตัวแปรสภาพแวดล้อมหลักดังนี้:
* `DATABASE_URL` -> ลิงก์เชื่อมฐานข้อมูล PostgreSQL (สำหรับการใช้บน Production เช่น Supabase ให้ใช้ Connection Pool URL และระบุ `?pgbouncer=true`)
* `DIRECT_URL` -> ลิงก์เชื่อมฐานข้อมูล PostgreSQL ตรงไปยังฐานข้อมูลหลัก (สำหรับใช้ทำ Prisma Migrate / Push ข้อมูลบน Production)
* `NEXTAUTH_URL` -> ลิงก์หลักของเว็บ (Local ใช้ `http://localhost:3000` | Production ใช้โดเมนจริงของ Vercel)
* `NEXTAUTH_SECRET` -> รหัสลับคีย์หลักในการลงรหัส Token ของ NextAuth.js
* `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` -> รับจาก Google Cloud Console (สำหรับการล็อกอิน Google)
* `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` -> รับจาก GitHub Developer Settings (สำหรับการล็อกอิน GitHub)
* `NEXT_PUBLIC_LINE_BOT_ID` -> ID ของ LINE Official Account (เช่น `@yourbot`)
* `LINE_CLIENT_ID` & `LINE_CLIENT_SECRET` -> รับจาก LINE Login (ใช้สำหรับการเชื่อมต่อผูกบัญชีในเว็บ)
* `LINE_CHANNEL_ACCESS_TOKEN` & `LINE_CHANNEL_SECRET` -> รับจาก Messaging API (ใช้สำหรับยิง Push Message แจ้งเตือนเข้าแชท)
* `RESEND_API_KEY` -> ใช้ส่ง Email

---

## 💡 แนวปฏิบัติสำหรับ AI (Developer & AI Instructions)
1. **หลีกเลี่ยงการใช้ TailwindCSS:** เว็บนี้ดีไซน์ด้วย Vanilla CSS แบบแฮนด์เมดทั้งหมดใน `globals.css` ห้ามสร้างคลาสยูทิลิตี้แบบ Tailwind เว้นแต่จะได้รับคำสั่ง
2. **ใช้ CustomSelect เสมอ:** ห้ามใช้แท็ก `<select>` และ `<option>` ดั้งเดิมของเบราว์เซอร์ในส่วนของ Modal ให้เรียกใช้ `<CustomSelect>` จาก `src/components/CustomSelect` เสนอเพื่อรักษาดีไซน์ให้กลมกลืน
3. **ระมัดระวังเรื่องประเภทข้อมูล NextAuth:** session user อาจเป็น undefined ได้ในบางคอมโพเนนต์ ให้เรียกใช้งานแบบ Optional Chaining (`session?.user?.id`) เสมอเพื่อเลี่ยงปัญหาการคอมไพล์ TypeScript ไม่ผ่าน
4. **ปุ่มการทำงานแบบโต้ตอบ (Interactions):**
   - ปุ่มลบงาน (Delete Task) และปุ่มแก้ไขงาน (Edit Task) บนการ์ดจะมีดีไซน์แบบซ่อนตัว (`opacity: 0` และ `scale(0.8)`) และจะปรากฏขึ้นเมื่อผู้ใช้เลื่อนเมาส์ไปชี้ที่การ์ดตัวนั้น (Hover) เท่านั้นเพื่อความคลีนของอินเตอร์เฟส
   - ปุ่มแก้ไขข้อมูลโครงการมีอยู่ในป๊อปอัปโครงการ (Project Modal) โดยแสดงลิสต์จัดการโครงการทั้งหมดที่ด้านล่าง สามารถกดปุ่มดินสอเพื่อแก้ไข และเมื่อกดลบระบบจะทำงานลบแบบ Cascade และต้องส่งกล่องคำเตือนยืนยันให้ผู้ใช้ก่อน
   - การออกจากระบบจะผ่านการยืนยันบน **Logout Confirmation Modal** เสมอเพื่อป้องกันไม่ให้ผู้ใช้คลิกโดนโดยไม่ได้ตั้งใจ

---

## 🚀 คู่มือการดีพลอยขึ้นใช้งานจริง (Vercel & Supabase Deployment Guide)
เมื่อนำระบบขึ้นใช้งานจริง ให้ตั้งค่าตามขั้นตอนดังนี้:

### 1. การตั้งค่าฐานข้อมูลบน Supabase
1. สร้างโปรเจกต์ใหม่บน Supabase
2. ไปที่ **Settings > Database > Connection Strings**
3. คัดลอก **Transaction connection string** (สำหรับ `DATABASE_URL` โดยระบุพารามิเตอร์ `?pgbouncer=true` ต่อท้าย)
4. คัดลอก **Session connection string** (สำหรับ `DIRECT_URL`)
5. รันคำสั่งพุชสคีมาขึ้นฐานข้อมูลจริง:
   ```bash
   npx prisma db push
   ```

### 2. การตั้งค่าบน Vercel
1. นำเข้าโปรเจกต์ Git ของคุณไปยังหน้า Vercel Dashboard
2. ตั้งค่า **Environment Variables** บน Vercel ให้ตรงตามรายการในหัวข้อ `⚙️ การตั้งค่าสภาพแวดล้อม` ด้านบน
3. ตั้งค่า OAuth Redirect URIs บน Developer Consoles ของ LINE, Google, และ GitHub ให้ชี้มายัง Callback URL ของโดเมนจริง เช่น:
   - Google: `https://yourdomain.vercel.app/api/auth/callback/google`
   - GitHub: `https://yourdomain.vercel.app/api/auth/callback/github`
   - LINE Login Callback: `https://yourdomain.vercel.app/api/auth/callback/line`
4. ดีพลอยโปรเจกต์
