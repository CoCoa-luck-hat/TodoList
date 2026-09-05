const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, '../docs/images');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function captureTeamChat() {
  console.log('Launching browser to capture Team Chat...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Perform login
  console.log('Performing login...');
  await page.type('input[type="email"]', 'test@example.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // Switch to Team Workspace
  console.log('Switching to Developer Team workspace...');
  await page.evaluate(() => {
    // Open workspace switcher
    const switcherTrigger = document.querySelector('.workspace-switcher .custom-select-trigger');
    if (switcherTrigger) switcherTrigger.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    // Click Developer Team option
    const options = Array.from(document.querySelectorAll('.workspace-switcher .custom-select-option'));
    const teamOption = options.find(el => el.textContent.includes('Developer Team'));
    if (teamOption) teamOption.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Now click Chat menu item
  console.log('Navigating to Team Chat...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.menu-item'));
    const chatItem = items.find(el => el.textContent.includes('แชท') || el.textContent.includes('Chat'));
    if (chatItem) {
      chatItem.click();
      console.log('Clicked Chat menu item');
    } else {
      console.error('Chat menu item not found');
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // Screenshot Team Chat
  const destPath = path.join(OUTPUT_DIR, 'fig3_8_team_chat.png');
  await page.screenshot({ path: destPath });
  console.log('Successfully saved real Team Chat screenshot to:', destPath);

  await browser.close();
}

captureTeamChat().catch(err => {
  console.error('Error capturing team chat:', err);
  process.exit(1);
});
