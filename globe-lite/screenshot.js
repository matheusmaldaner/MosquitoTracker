import { chromium } from 'playwright';

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Capture globe.gov
  console.log('Capturing globe.gov...');
  const page1 = await context.newPage();
  await page1.goto('https://www.globe.gov/', { waitUntil: 'networkidle', timeout: 60000 });
  await page1.screenshot({ path: 'screenshots/globe-gov-full.png', fullPage: true });
  await page1.screenshot({ path: 'screenshots/globe-gov-viewport.png' });

  // Capture observer.globe.gov
  console.log('Capturing observer.globe.gov...');
  const page2 = await context.newPage();
  await page2.goto('https://observer.globe.gov/', { waitUntil: 'networkidle', timeout: 60000 });
  await page2.screenshot({ path: 'screenshots/observer-full.png', fullPage: true });
  await page2.screenshot({ path: 'screenshots/observer-viewport.png' });

  // Capture mobile views
  console.log('Capturing mobile views...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true
  });

  const mobilePage1 = await mobileContext.newPage();
  await mobilePage1.goto('https://www.globe.gov/', { waitUntil: 'networkidle', timeout: 60000 });
  await mobilePage1.screenshot({ path: 'screenshots/globe-gov-mobile.png', fullPage: true });

  const mobilePage2 = await mobileContext.newPage();
  await mobilePage2.goto('https://observer.globe.gov/', { waitUntil: 'networkidle', timeout: 60000 });
  await mobilePage2.screenshot({ path: 'screenshots/observer-mobile.png', fullPage: true });

  await browser.close();
  console.log('Done! Screenshots saved to ./screenshots/');
}

captureScreenshots().catch(console.error);
