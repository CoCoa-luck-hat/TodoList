const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'images');

async function capture() {
  console.log('Launching browser for screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // 1. Capture Login Screen
  console.log('1. Capturing Login Screen...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.auth-card', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig3_4_login_screen.png') });
  console.log('Saved: fig3_4_login_screen.png');

  // 2. Perform Login
  console.log('Performing login...');
  await page.type('#auth-email', 'test@example.com');
  await page.type('#auth-password', 'password123');
  
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  console.log('Waiting for dashboard navigation...');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await page.waitForSelector('.sidebar, nav, .topbar-actions', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // Ensure Light Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  });
  await new Promise(r => setTimeout(r, 500));

  // 3. Capture Kanban Board View
  console.log('2. Capturing Kanban Board View...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.menu-item'));
    const kanbanItem = items.find(el => el.textContent.includes('กระดาน') || el.textContent.includes('Kanban'));
    if (kanbanItem) kanbanItem.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig3_5_kanban_board.png') });
  console.log('Saved: fig3_5_kanban_board.png');

  // 4. Capture Calendar View
  console.log('3. Capturing Calendar View...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.menu-item'));
    const calItem = items.find(el => el.textContent.includes('ปฏิทิน') || el.textContent.includes('Calendar'));
    if (calItem) calItem.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig3_6_calendar_view.png') });
  console.log('Saved: fig3_6_calendar_view.png');

  // 5. Capture Analytics & Stats View
  console.log('4. Capturing Analytics & Stats View...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.menu-item'));
    const statsItem = items.find(el => el.textContent.includes('สถิติ') || el.textContent.includes('Stats'));
    if (statsItem) statsItem.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig3_7_analytics_stats.png') });
  console.log('Saved: fig3_7_analytics_stats.png');

  // 6. Capture Team Chat View
  console.log('5. Capturing Team Chat View...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.menu-item'));
    const chatItem = items.find(el => el.textContent.includes('แชท') || el.textContent.includes('Chat'));
    if (chatItem) chatItem.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig3_8_team_chat.png') });
  console.log('Saved: fig3_8_team_chat.png');

  // 7. Capture Task Modal
  console.log('6. Capturing Task Modal...');
  // Switch back to Kanban
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.menu-item'));
    const kanbanItem = items.find(el => el.textContent.includes('กระดาน') || el.textContent.includes('Kanban'));
    if (kanbanItem) kanbanItem.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Click the topbar primary button (which opens Task Modal)
  await page.evaluate(() => {
    const btn = document.querySelector('.topbar-actions .btn-primary');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig3_9_task_modal.png') });
  console.log('Saved: fig3_9_task_modal.png');

  // Close Task Modal
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 800));

  // 8. Capture Notification Preferences Modal
  console.log('7. Capturing Notification Preferences Modal...');
  // Click Settings button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.topbar-actions button'));
    // Usually settings is the last button with Settings icon
    const settingsBtn = btns[btns.length - 1];
    if (settingsBtn) settingsBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Click Notifications Tab inside Settings Modal
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.settings-tab, button, [role="tab"]'));
    const notifTab = tabs.find(t => 
      t.textContent.includes('แจ้งเตือน') || 
      t.textContent.includes('Notifications') ||
      t.textContent.includes('Notification')
    );
    if (notifTab) notifTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig3_10_notification_modal.png') });
  console.log('Saved: fig3_10_notification_modal.png');

  // Close Settings Modal
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 800));

  // 9. Capture Floating Pomodoro Timer
  console.log('8. Capturing Floating Pomodoro Timer...');
  // Toggle Pomodoro to visible if it isn't
  await page.evaluate(() => {
    const pomodoroToggle = document.querySelector('.pomodoro-toggle-btn');
    if (pomodoroToggle) pomodoroToggle.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Now locate the floating pomodoro element
  const pomodoroWidget = await page.$('.floating-pomodoro-card, .floating-pomodoro, [class*="floating-pomodoro"], [class*="pomodoro-float"]');
  if (pomodoroWidget) {
    await pomodoroWidget.screenshot({ path: path.join(OUTPUT_DIR, 'fig3_11_floating_pomodoro.png') });
    console.log('Saved: fig3_11_floating_pomodoro.png (widget screenshot)');
  } else {
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig3_11_floating_pomodoro.png') });
    console.log('Saved: fig3_11_floating_pomodoro.png (screen screenshot)');
  }

  await browser.close();
  console.log('ALL 8 UI SCREENSHOTS CAPTURED PERFECTLY!');
}

capture().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
