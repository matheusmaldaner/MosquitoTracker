import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function captureLocalScreenshots() {
  // Start preview server
  const server = spawn('npm', ['run', 'preview'], {
    stdio: 'pipe',
    shell: true
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  const browser = await chromium.launch();

  // Desktop screenshots
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  console.log('Capturing local pages...');

  // Index page
  const page1 = await desktopContext.newPage();
  await page1.goto('http://localhost:4321/', { waitUntil: 'networkidle', timeout: 30000 });
  await page1.screenshot({ path: 'screenshots/local-index-viewport.png' });
  await page1.screenshot({ path: 'screenshots/local-index-full.png', fullPage: true });

  // Observer page
  const page2 = await desktopContext.newPage();
  await page2.goto('http://localhost:4321/observer', { waitUntil: 'networkidle', timeout: 30000 });
  await page2.screenshot({ path: 'screenshots/local-observer-viewport.png' });
  await page2.screenshot({ path: 'screenshots/local-observer-full.png', fullPage: true });

  // Mobile screenshots
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true
  });

  const mobile1 = await mobileContext.newPage();
  await mobile1.goto('http://localhost:4321/', { waitUntil: 'networkidle', timeout: 30000 });
  await mobile1.screenshot({ path: 'screenshots/local-index-mobile.png', fullPage: true });

  const mobile2 = await mobileContext.newPage();
  await mobile2.goto('http://localhost:4321/observer', { waitUntil: 'networkidle', timeout: 30000 });
  await mobile2.screenshot({ path: 'screenshots/local-observer-mobile.png', fullPage: true });

  await browser.close();
  server.kill();

  console.log('Done! Local screenshots saved to ./screenshots/');
}

captureLocalScreenshots().catch(console.error);
