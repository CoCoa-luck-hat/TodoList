const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'images');

async function renderHtmlToImage(htmlContent, outputPath, width = 1200, height = 800) {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Find the diagram container to screenshot tightly with padding
  const container = await page.$('#diagram-container');
  if (container) {
    await container.screenshot({ path: outputPath });
  } else {
    await page.screenshot({ path: outputPath, fullPage: true });
  }
  await browser.close();
  console.log(`Saved: ${outputPath}`);
}

async function generateContextDiagram() {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@500;600&display=swap" rel="stylesheet">
    <style>
      body {
        margin: 0;
        background: #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Sarabun', sans-serif;
      }
      #diagram-container {
        width: 1050px;
        padding: 40px;
        background: #ffffff;
        box-sizing: border-box;
      }
      .title {
        text-align: center;
        font-family: 'Prompt', sans-serif;
        font-size: 20px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 30px;
      }
      svg text {
        font-family: 'Sarabun', sans-serif;
      }
    </style>
  </head>
  <body>
    <div id="diagram-container">
      <div class="title">แผนภาพบริบท (Context Diagram) - ระบบเว็บแอปพลิเคชันบริหารจัดการและติดตามสถานะงาน</div>
      <svg width="970" height="520" viewBox="0 0 970 520">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" />
          </marker>
        </defs>

        <!-- Main Process Circle -->
        <circle cx="485" cy="260" r="130" fill="#f8fafc" stroke="#4f46e5" stroke-width="3" />
        <text x="485" y="220" text-anchor="middle" font-size="18" font-weight="700" fill="#4f46e5">0</text>
        <line x1="390" y1="230" x2="580" y2="230" stroke="#cbd5e1" stroke-width="1.5" />
        <text x="485" y="255" text-anchor="middle" font-size="15" font-weight="600" fill="#0f172a">ระบบเว็บแอปพลิเคชัน</text>
        <text x="485" y="278" text-anchor="middle" font-size="15" font-weight="600" fill="#0f172a">บริหารจัดการและติดตามสถานะงาน</text>
        <text x="485" y="300" text-anchor="middle" font-size="14" fill="#334155">สำหรับการทำงานร่วมกันเป็นทีม</text>
        <text x="485" y="320" text-anchor="middle" font-size="12" fill="#64748b">พร้อมระบบแจ้งเตือนไลน์และอีเมล</text>

        <!-- External Entity: User / Team Member (Top) -->
        <rect x="365" y="20" width="240" height="70" rx="8" fill="#ffffff" stroke="#334155" stroke-width="2.5" />
        <text x="485" y="50" text-anchor="middle" font-size="15" font-weight="600" fill="#0f172a">ผู้ใช้งาน / สมาชิกในทีม</text>
        <text x="485" y="70" text-anchor="middle" font-size="13" fill="#64748b">(Team Member)</text>

        <!-- Lines between User and Process -->
        <!-- User to Process (Left side) -->
        <path d="M 440 90 L 440 135" fill="none" stroke="#475569" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="430" y="115" text-anchor="end" font-size="11" fill="#334155">ข้อมูลล็อกอิน, อัปเดตงาน, ส่งแชท</text>

        <!-- Process to User (Right side) -->
        <path d="M 530 135 L 530 90" fill="none" stroke="#475569" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="540" y="115" text-anchor="start" font-size="11" fill="#334155">รายการงาน, สถานะ, แชท, สถิติ</text>

        <!-- External Entity: Team Owner / Admin (Left) -->
        <rect x="20" y="225" width="210" height="70" rx="8" fill="#ffffff" stroke="#334155" stroke-width="2.5" />
        <text x="125" y="255" text-anchor="middle" font-size="15" font-weight="600" fill="#0f172a">หัวหน้าทีม / ผู้ดูแล</text>
        <text x="125" y="275" text-anchor="middle" font-size="13" fill="#64748b">(Team Owner / Admin)</text>

        <!-- Lines between Owner and Process -->
        <path d="M 230 245 L 350 245" fill="none" stroke="#475569" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="290" y="238" text-anchor="middle" font-size="11" fill="#334155">สร้างทีม, มอบหมายงาน, จัดการโครงการ</text>

        <path d="M 350 275 L 230 275" fill="none" stroke="#475569" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="290" y="293" text-anchor="middle" font-size="11" fill="#334155">รายงานสรุป, สถิติภาพรวมโครงการ</text>

        <!-- External Entity: LINE Messaging API (Bottom Left) -->
        <rect x="180" y="430" width="220" height="65" rx="8" fill="#ffffff" stroke="#16a34a" stroke-width="2.5" />
        <text x="290" y="458" text-anchor="middle" font-size="14" font-weight="600" fill="#15803d">LINE Messaging API</text>
        <text x="290" y="478" text-anchor="middle" font-size="12" fill="#64748b">(ระบบแจ้งเตือนเข้าแอปพลิเคชัน LINE)</text>

        <!-- Line from Process to LINE -->
        <path d="M 405 350 L 320 430" fill="none" stroke="#475569" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="325" y="380" text-anchor="end" font-size="11" fill="#334155">ข้อความแจ้งเตือน Flex Message (มอบหมายงาน / เตือนดิว)</text>

        <!-- External Entity: Resend Email Platform (Bottom Right) -->
        <rect x="570" y="430" width="220" height="65" rx="8" fill="#ffffff" stroke="#2563eb" stroke-width="2.5" />
        <text x="680" y="458" text-anchor="middle" font-size="14" font-weight="600" fill="#1d4ed8">Resend Email Platform</text>
        <text x="680" y="478" text-anchor="middle" font-size="12" fill="#64748b">(ระบบจัดส่งจดหมายอิเล็กทรอนิกส์)</text>

        <!-- Line from Process to Email -->
        <path d="M 565 350 L 650 430" fill="none" stroke="#475569" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="640" y="380" text-anchor="start" font-size="11" fill="#334155">Transactional Email (งานใหม่ / สรุปประจำวัน)</text>
      </svg>
    </div>
  </body>
  </html>
  `;
  await renderHtmlToImage(html, path.join(OUTPUT_DIR, 'fig3_1_context_diagram.png'), 1100, 620);
}

async function generateDFDLevel1() {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@500;600&display=swap" rel="stylesheet">
    <style>
      body {
        margin: 0;
        background: #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Sarabun', sans-serif;
      }
      #diagram-container {
        width: 1100px;
        padding: 40px;
        background: #ffffff;
        box-sizing: border-box;
      }
      .title {
        text-align: center;
        font-family: 'Prompt', sans-serif;
        font-size: 20px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 25px;
      }
      svg text {
        font-family: 'Sarabun', sans-serif;
      }
    </style>
  </head>
  <body>
    <div id="diagram-container">
      <div class="title">แผนภาพการไหลของข้อมูลระดับที่ 1 (Data Flow Diagram: DFD Level 1)</div>
      <svg width="1020" height="660" viewBox="0 0 1020 660">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" />
          </marker>
        </defs>

        <!-- Entities Left -->
        <rect x="20" y="80" width="160" height="60" rx="6" fill="#f8fafc" stroke="#334155" stroke-width="2" />
        <text x="100" y="115" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">ผู้ใช้งาน / สมาชิก</text>

        <rect x="20" y="320" width="160" height="60" rx="6" fill="#f8fafc" stroke="#334155" stroke-width="2" />
        <text x="100" y="355" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">หัวหน้าทีม / ผู้ดูแล</text>

        <!-- Process 1.0 -->
        <circle cx="330" cy="90" r="45" fill="#eef2ff" stroke="#6366f1" stroke-width="2" />
        <text x="330" y="82" text-anchor="middle" font-size="13" font-weight="700" fill="#4338ca">1.0</text>
        <text x="330" y="102" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">ยืนยันตัวตน</text>

        <!-- Process 2.0 -->
        <circle cx="330" cy="220" r="45" fill="#eef2ff" stroke="#6366f1" stroke-width="2" />
        <text x="330" y="212" text-anchor="middle" font-size="13" font-weight="700" fill="#4338ca">2.0</text>
        <text x="330" y="232" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">จัดการทีม/สมาชิก</text>

        <!-- Process 3.0 -->
        <circle cx="330" cy="350" r="45" fill="#eef2ff" stroke="#6366f1" stroke-width="2" />
        <text x="330" y="342" text-anchor="middle" font-size="13" font-weight="700" fill="#4338ca">3.0</text>
        <text x="330" y="362" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">จัดการโครงการ/งาน</text>

        <!-- Process 4.0 -->
        <circle cx="330" cy="480" r="45" fill="#eef2ff" stroke="#6366f1" stroke-width="2" />
        <text x="330" y="472" text-anchor="middle" font-size="13" font-weight="700" fill="#4338ca">4.0</text>
        <text x="330" y="492" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">การแจ้งเตือนอัตโนมัติ</text>

        <!-- Process 5.0 -->
        <circle cx="330" cy="590" r="45" fill="#eef2ff" stroke="#6366f1" stroke-width="2" />
        <text x="330" y="582" text-anchor="middle" font-size="13" font-weight="700" fill="#4338ca">5.0</text>
        <text x="330" y="602" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">แชททีมและ Pomodoro</text>

        <!-- Data Stores Right -->
        <!-- D1: User / Account -->
        <g transform="translate(620, 70)">
          <path d="M 0 0 L 180 0 M 0 40 L 180 40" stroke="#0f172a" stroke-width="2" />
          <line x1="45" y1="0" x2="45" y2="40" stroke="#0f172a" stroke-width="2" />
          <text x="22" y="25" text-anchor="middle" font-size="13" font-weight="600">D1</text>
          <text x="110" y="25" text-anchor="middle" font-size="13">ข้อมูลผู้ใช้งาน (User)</text>
        </g>

        <!-- D2: Team / Member -->
        <g transform="translate(620, 200)">
          <path d="M 0 0 L 180 0 M 0 40 L 180 40" stroke="#0f172a" stroke-width="2" />
          <line x1="45" y1="0" x2="45" y2="40" stroke="#0f172a" stroke-width="2" />
          <text x="22" y="25" text-anchor="middle" font-size="13" font-weight="600">D2</text>
          <text x="110" y="25" text-anchor="middle" font-size="13">ข้อมูลทีม (Team)</text>
        </g>

        <!-- D3: Project / Task -->
        <g transform="translate(620, 330)">
          <path d="M 0 0 L 180 0 M 0 40 L 180 40" stroke="#0f172a" stroke-width="2" />
          <line x1="45" y1="0" x2="45" y2="40" stroke="#0f172a" stroke-width="2" />
          <text x="22" y="25" text-anchor="middle" font-size="13" font-weight="600">D3</text>
          <text x="110" y="25" text-anchor="middle" font-size="13">ข้อมูลงาน (Task/Project)</text>
        </g>

        <!-- D4: Chat / Setting -->
        <g transform="translate(620, 570)">
          <path d="M 0 0 L 180 0 M 0 40 L 180 40" stroke="#0f172a" stroke-width="2" />
          <line x1="45" y1="0" x2="45" y2="40" stroke="#0f172a" stroke-width="2" />
          <text x="22" y="25" text-anchor="middle" font-size="13" font-weight="600">D4</text>
          <text x="110" y="25" text-anchor="middle" font-size="13">แชทและการตั้งค่า</text>
        </g>

        <!-- External APIs on Bottom Right -->
        <rect x="850" y="440" width="150" height="50" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.8" />
        <text x="925" y="470" text-anchor="middle" font-size="12" font-weight="600" fill="#15803d">LINE Messaging API</text>

        <rect x="850" y="510" width="150" height="50" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="1.8" />
        <text x="925" y="540" text-anchor="middle" font-size="12" font-weight="600" fill="#1d4ed8">Resend Email API</text>

        <!-- Connectors -->
        <!-- User to P1 -->
        <path d="M 180 100 L 285 95" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)" />
        <text x="230" y="90" font-size="10" fill="#475569">เข้าสู่ระบบ</text>

        <!-- P1 to D1 -->
        <path d="M 375 90 L 620 90" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)" />
        <text x="490" y="85" font-size="10" fill="#475569">บันทึก/ดึงข้อมูลผู้ใช้</text>

        <!-- User / Admin to P2 -->
        <path d="M 180 340 L 290 240" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)" />
        <text x="210" y="270" font-size="10" fill="#475569">สร้างทีม/เชิญสมาชิก</text>

        <!-- P2 to D2 -->
        <path d="M 375 220 L 620 220" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)" />
        <text x="490" y="215" font-size="10" fill="#475569">บันทึก/ดึงข้อมูลทีม</text>

        <!-- User to P3 -->
        <path d="M 180 120 L 290 330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)" />
        <text x="220" y="190" font-size="10" fill="#475569">สร้าง/อัปเดตงาน</text>

        <!-- P3 to D3 -->
        <path d="M 375 350 L 620 350" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)" />
        <text x="490" y="345" font-size="10" fill="#475569">จัดเก็บ/อัปเดตสถานะงาน</text>

        <!-- P3 to P4 (Trigger Notification) -->
        <path d="M 330 395 L 330 435" fill="none" stroke="#e11d48" stroke-width="1.5" marker-end="url(#arrow)" />
        <text x="335" y="420" font-size="10" fill="#e11d48">เกิดเหตุการณ์มอบหมายงาน</text>

        <!-- P4 to D1 (fetch lineUserId/Email) -->
        <path d="M 375 470 L 650 470 L 650 110" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow)" />
        <text x="480" y="465" font-size="10" fill="#475569">ดึงช่องทางแจ้งเตือนผู้รับ</text>

        <!-- P4 to LINE / Resend -->
        <path d="M 375 480 L 850 465" fill="none" stroke="#16a34a" stroke-width="1.5" marker-end="url(#arrow)" />
        <path d="M 375 490 L 850 535" fill="none" stroke="#2563eb" stroke-width="1.5" marker-end="url(#arrow)" />

        <!-- User to P5 -->
        <path d="M 180 135 L 230 135 L 230 580 L 285 585" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)" />
        <text x="210" y="550" font-size="10" fill="#475569">ส่งแชท/ตั้งเวลา Pomodoro</text>

        <!-- P5 to D4 -->
        <path d="M 375 590 L 620 590" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)" />
        <text x="490" y="585" font-size="10" fill="#475569">บันทึกข้อความสนทนา</text>
      </svg>
    </div>
  </body>
  </html>
  `;
  await renderHtmlToImage(html, path.join(OUTPUT_DIR, 'fig3_2_dfd_level1.png'), 1150, 750);
}

async function generateERDiagram() {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@500;600&display=swap" rel="stylesheet">
    <style>
      body {
        margin: 0;
        background: #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Sarabun', sans-serif;
      }
      #diagram-container {
        width: 1250px;
        padding: 30px;
        background: #ffffff;
        box-sizing: border-box;
      }
      .title {
        text-align: center;
        font-family: 'Prompt', sans-serif;
        font-size: 20px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 20px;
      }
      .entity-box {
        fill: #ffffff;
        stroke: #cbd5e1;
        stroke-width: 1.5;
        rx: 6;
      }
      .entity-header {
        fill: #4f46e5;
      }
      .entity-title {
        fill: #ffffff;
        font-family: 'Prompt', sans-serif;
        font-size: 13px;
        font-weight: 600;
      }
      .field-pk {
        fill: #dc2626;
        font-weight: bold;
        font-size: 11px;
      }
      .field-fk {
        fill: #2563eb;
        font-weight: bold;
        font-size: 11px;
      }
      .field-name {
        fill: #1e293b;
        font-size: 11px;
      }
      .field-type {
        fill: #64748b;
        font-size: 10px;
      }
    </style>
  </head>
  <body>
    <div id="diagram-container">
      <div class="title">แผนภาพความสัมพันธ์ของข้อมูล (Entity-Relationship Diagram: ER-Diagram)</div>
      <svg width="1180" height="720" viewBox="0 0 1180 720">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 2 L 8 5 L 0 8 z" fill="#64748b" />
          </marker>
        </defs>

        <!-- USER Table -->
        <g transform="translate(30, 40)">
          <rect width="210" height="230" class="entity-box" />
          <path d="M 0 0 L 210 0 L 210 28 L 0 28 Z" class="entity-header" />
          <text x="105" y="19" text-anchor="middle" class="entity-title">User (ผู้ใช้งาน)</text>
          
          <text x="12" y="48" class="field-pk">PK</text><text x="36" y="48" class="field-name">id</text><text x="150" y="48" class="field-type">String(UUID)</text>
          <text x="12" y="68" class="field-name">email</text><text x="150" y="68" class="field-type">String (UQ)</text>
          <text x="12" y="88" class="field-name">password</text><text x="150" y="88" class="field-type">String</text>
          <text x="12" y="108" class="field-name">name</text><text x="150" y="108" class="field-type">String</text>
          <text x="12" y="128" class="field-name">image</text><text x="150" y="128" class="field-type">String</text>
          <text x="12" y="148" class="field-name">lineUserId</text><text x="150" y="148" class="field-type">String (UQ)</text>
          <text x="12" y="168" class="field-name">notifPrefs</text><text x="150" y="168" class="field-type">Json</text>
          <text x="12" y="188" class="field-name">createdAt</text><text x="150" y="188" class="field-type">DateTime</text>
          <text x="12" y="208" class="field-name">updatedAt</text><text x="150" y="208" class="field-type">DateTime</text>
        </g>

        <!-- TEAM Table -->
        <g transform="translate(340, 40)">
          <rect width="210" height="190" class="entity-box" />
          <path d="M 0 0 L 210 0 L 210 28 L 0 28 Z" class="entity-header" style="fill:#0891b2;" />
          <text x="105" y="19" text-anchor="middle" class="entity-title">Team (ทีมงาน)</text>

          <text x="12" y="48" class="field-pk">PK</text><text x="36" y="48" class="field-name">id</text><text x="150" y="48" class="field-type">String(UUID)</text>
          <text x="12" y="68" class="field-name">name</text><text x="150" y="68" class="field-type">String</text>
          <text x="12" y="88" class="field-name">description</text><text x="150" y="88" class="field-type">String</text>
          <text x="12" y="108" class="field-name">color</text><text x="150" y="108" class="field-type">String</text>
          <text x="12" y="128" class="field-name">inviteCode</text><text x="150" y="128" class="field-type">String (UQ)</text>
          <text x="12" y="148" class="field-fk">FK</text><text x="36" y="148" class="field-name">ownerId</text><text x="150" y="148" class="field-type">String</text>
          <text x="12" y="168" class="field-name">createdAt</text><text x="150" y="168" class="field-type">DateTime</text>
        </g>

        <!-- TEAM_MEMBER Table -->
        <g transform="translate(340, 270)">
          <rect width="210" height="150" class="entity-box" />
          <path d="M 0 0 L 210 0 L 210 28 L 0 28 Z" class="entity-header" style="fill:#0284c7;" />
          <text x="105" y="19" text-anchor="middle" class="entity-title">TeamMember (สมาชิกทีม)</text>

          <text x="12" y="48" class="field-pk">PK</text><text x="36" y="48" class="field-name">id</text><text x="150" y="48" class="field-type">String(UUID)</text>
          <text x="12" y="68" class="field-fk">FK</text><text x="36" y="68" class="field-name">userId</text><text x="150" y="68" class="field-type">String</text>
          <text x="12" y="88" class="field-fk">FK</text><text x="36" y="88" class="field-name">teamId</text><text x="150" y="88" class="field-type">String</text>
          <text x="12" y="108" class="field-name">role</text><text x="150" y="108" class="field-type">String</text>
          <text x="12" y="128" class="field-name">joinedAt</text><text x="150" y="128" class="field-type">DateTime</text>
        </g>

        <!-- PROJECT Table -->
        <g transform="translate(630, 40)">
          <rect width="210" height="160" class="entity-box" />
          <path d="M 0 0 L 210 0 L 210 28 L 0 28 Z" class="entity-header" style="fill:#7c3aed;" />
          <text x="105" y="19" text-anchor="middle" class="entity-title">Project (โครงการ)</text>

          <text x="12" y="48" class="field-pk">PK</text><text x="36" y="48" class="field-name">id</text><text x="150" y="48" class="field-type">String(UUID)</text>
          <text x="12" y="68" class="field-name">name</text><text x="150" y="68" class="field-type">String</text>
          <text x="12" y="88" class="field-name">color</text><text x="150" y="88" class="field-type">String</text>
          <text x="12" y="108" class="field-fk">FK</text><text x="36" y="108" class="field-name">userId</text><text x="150" y="108" class="field-type">String</text>
          <text x="12" y="128" class="field-fk">FK</text><text x="36" y="128" class="field-name">teamId</text><text x="150" y="128" class="field-type">String</text>
          <text x="12" y="148" class="field-name">createdAt</text><text x="150" y="148" class="field-type">DateTime</text>
        </g>

        <!-- TASK Table -->
        <g transform="translate(630, 240)">
          <rect width="220" height="260" class="entity-box" />
          <path d="M 0 0 L 220 0 L 220 28 L 0 28 Z" class="entity-header" style="fill:#db2777;" />
          <text x="110" y="19" text-anchor="middle" class="entity-title">Task (ภาระงาน/การ์ดงาน)</text>

          <text x="12" y="48" class="field-pk">PK</text><text x="36" y="48" class="field-name">id</text><text x="155" y="48" class="field-type">String(UUID)</text>
          <text x="12" y="68" class="field-name">title</text><text x="155" y="68" class="field-type">String</text>
          <text x="12" y="88" class="field-name">description</text><text x="155" y="88" class="field-type">String</text>
          <text x="12" y="108" class="field-name">status</text><text x="155" y="108" class="field-type">String</text>
          <text x="12" y="128" class="field-name">priority</text><text x="155" y="128" class="field-type">String</text>
          <text x="12" y="148" class="field-name">dueDate</text><text x="155" y="148" class="field-type">DateTime</text>
          <text x="12" y="168" class="field-fk">FK</text><text x="36" y="168" class="field-name">projectId</text><text x="155" y="168" class="field-type">String</text>
          <text x="12" y="188" class="field-fk">FK</text><text x="36" y="188" class="field-name">userId (creator)</text><text x="155" y="188" class="field-type">String</text>
          <text x="12" y="208" class="field-fk">FK</text><text x="36" y="208" class="field-name">assigneeId</text><text x="155" y="208" class="field-type">String</text>
          <text x="12" y="228" class="field-fk">FK</text><text x="36" y="228" class="field-name">teamId</text><text x="155" y="228" class="field-type">String</text>
          <text x="12" y="248" class="field-name">updatedAt</text><text x="155" y="248" class="field-type">DateTime</text>
        </g>

        <!-- SUBTASK Table -->
        <g transform="translate(630, 540)">
          <rect width="210" height="130" class="entity-box" />
          <path d="M 0 0 L 210 0 L 210 28 L 0 28 Z" class="entity-header" style="fill:#e11d48;" />
          <text x="105" y="19" text-anchor="middle" class="entity-title">SubTask (งานย่อย)</text>

          <text x="12" y="48" class="field-pk">PK</text><text x="36" y="48" class="field-name">id</text><text x="150" y="48" class="field-type">String(UUID)</text>
          <text x="12" y="68" class="field-name">title</text><text x="150" y="68" class="field-type">String</text>
          <text x="12" y="88" class="field-name">isCompleted</text><text x="150" y="88" class="field-type">Boolean</text>
          <text x="12" y="108" class="field-fk">FK</text><text x="36" y="108" class="field-name">taskId</text><text x="150" y="108" class="field-type">String</text>
        </g>

        <!-- CHAT_MESSAGE Table -->
        <g transform="translate(930, 40)">
          <rect width="210" height="160" class="entity-box" />
          <path d="M 0 0 L 210 0 L 210 28 L 0 28 Z" class="entity-header" style="fill:#16a34a;" />
          <text x="105" y="19" text-anchor="middle" class="entity-title">ChatMessage (แชททีม)</text>

          <text x="12" y="48" class="field-pk">PK</text><text x="36" y="48" class="field-name">id</text><text x="150" y="48" class="field-type">String(UUID)</text>
          <text x="12" y="68" class="field-name">text</text><text x="150" y="68" class="field-type">String</text>
          <text x="12" y="88" class="field-name">user</text><text x="150" y="88" class="field-type">String</text>
          <text x="12" y="108" class="field-fk">FK</text><text x="36" y="108" class="field-name">userId</text><text x="150" y="108" class="field-type">String</text>
          <text x="12" y="128" class="field-fk">FK</text><text x="36" y="128" class="field-name">teamId</text><text x="150" y="128" class="field-type">String</text>
          <text x="12" y="148" class="field-name">createdAt</text><text x="150" y="148" class="field-type">DateTime</text>
        </g>

        <!-- SETTING Table -->
        <g transform="translate(930, 250)">
          <rect width="210" height="150" class="entity-box" />
          <path d="M 0 0 L 210 0 L 210 28 L 0 28 Z" class="entity-header" style="fill:#d97706;" />
          <text x="105" y="19" text-anchor="middle" class="entity-title">Setting (การตั้งค่า)</text>

          <text x="12" y="48" class="field-pk">PK</text><text x="36" y="48" class="field-name">id</text><text x="150" y="48" class="field-type">String</text>
          <text x="12" y="68" class="field-name">lineToken</text><text x="150" y="68" class="field-type">String</text>
          <text x="12" y="88" class="field-name">emailRecipient</text><text x="150" y="88" class="field-type">String</text>
          <text x="12" y="108" class="field-name">pomodoroDuration</text><text x="150" y="108" class="field-type">Int</text>
          <text x="12" y="128" class="field-name">pomodoroBreak</text><text x="150" y="128" class="field-type">Int</text>
        </g>

        <!-- Relationships lines -->
        <!-- User to Team (Owner) -->
        <path d="M 240 70 L 340 70" fill="none" stroke="#64748b" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="290" y="65" text-anchor="middle" font-size="10" fill="#475569">1:N (Owner)</text>

        <!-- User to TeamMember -->
        <path d="M 140 270 L 140 330 L 340 330" fill="none" stroke="#64748b" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="240" y="325" text-anchor="middle" font-size="10" fill="#475569">1:N</text>

        <!-- Team to TeamMember -->
        <path d="M 445 230 L 445 270" fill="none" stroke="#64748b" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="460" y="255" font-size="10" fill="#475569">1:N</text>

        <!-- Team to Project -->
        <path d="M 550 90 L 630 90" fill="none" stroke="#64748b" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="590" y="85" text-anchor="middle" font-size="10" fill="#475569">1:N</text>

        <!-- Project to Task -->
        <path d="M 735 200 L 735 240" fill="none" stroke="#64748b" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="750" y="225" font-size="10" fill="#475569">1:N</text>

        <!-- Task to SubTask -->
        <path d="M 735 500 L 735 540" fill="none" stroke="#64748b" stroke-width="1.8" marker-end="url(#arrow)" />
        <text x="750" y="525" font-size="10" fill="#475569">1:N</text>

        <!-- Team to Chat -->
        <path d="M 550 150 L 930 150" fill="none" stroke="#64748b" stroke-width="1.8" stroke-dasharray="3,3" marker-end="url(#arrow)" />
        <text x="890" y="145" text-anchor="middle" font-size="10" fill="#475569">1:N</text>
      </svg>
    </div>
  </body>
  </html>
  `;
  await renderHtmlToImage(html, path.join(OUTPUT_DIR, 'fig3_3_er_diagram.png'), 1250, 750);
}

async function run() {
  console.log('Generating system diagrams...');
  await generateContextDiagram();
  await generateDFDLevel1();
  await generateERDiagram();
  console.log('All diagrams generated successfully!');
}

run().catch(console.error);
