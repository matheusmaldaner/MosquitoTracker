import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
};

async function analyzeGlobe() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Create directories
  fs.mkdirSync('screenshots/globe-analysis', { recursive: true });
  fs.mkdirSync('public/images', { recursive: true });

  // Analyze globe.gov
  console.log('Analyzing globe.gov...');
  const page1 = await context.newPage();
  await page1.goto('https://www.globe.gov/', { waitUntil: 'networkidle', timeout: 60000 });

  // Get hero section
  await page1.screenshot({ path: 'screenshots/globe-analysis/globe-hero.png', clip: { x: 0, y: 0, width: 1440, height: 600 } });

  // Get all images
  const globeImages = await page1.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight
    })).filter(img => img.src && img.width > 50);
  });
  console.log('Found images on globe.gov:', globeImages.length);
  fs.writeFileSync('screenshots/globe-analysis/globe-images.json', JSON.stringify(globeImages, null, 2));

  // Get colors
  const globeColors = await page1.evaluate(() => {
    const styles = getComputedStyle(document.body);
    return {
      bodyBg: styles.backgroundColor,
      bodyColor: styles.color
    };
  });
  console.log('Globe colors:', globeColors);

  // Screenshot specific sections
  const sections = await page1.locator('section, .portlet-content, .banner').all();
  for (let i = 0; i < Math.min(sections.length, 5); i++) {
    try {
      await sections[i].screenshot({ path: `screenshots/globe-analysis/globe-section-${i}.png` });
    } catch (e) {}
  }

  // Analyze observer.globe.gov
  console.log('Analyzing observer.globe.gov...');
  const page2 = await context.newPage();
  await page2.goto('https://observer.globe.gov/', { waitUntil: 'networkidle', timeout: 60000 });

  await page2.screenshot({ path: 'screenshots/globe-analysis/observer-hero.png', clip: { x: 0, y: 0, width: 1440, height: 600 } });

  const observerImages = await page2.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight
    })).filter(img => img.src && img.width > 50);
  });
  console.log('Found images on observer.globe.gov:', observerImages.length);
  fs.writeFileSync('screenshots/globe-analysis/observer-images.json', JSON.stringify(observerImages, null, 2));

  // Download key images
  console.log('Downloading key images...');
  const allImages = [...globeImages, ...observerImages];
  for (const img of allImages.slice(0, 10)) {
    try {
      const filename = path.basename(new URL(img.src).pathname);
      if (filename && !filename.includes('?')) {
        await downloadImage(img.src, `public/images/${filename}`);
        console.log(`Downloaded: ${filename}`);
      }
    } catch (e) {
      // Skip failed downloads
    }
  }

  // Take full page scroll screenshots
  await page1.evaluate(() => window.scrollTo(0, 0));
  for (let i = 0; i < 5; i++) {
    await page1.screenshot({ path: `screenshots/globe-analysis/globe-scroll-${i}.png` });
    await page1.evaluate(() => window.scrollBy(0, 800));
    await page1.waitForTimeout(500);
  }

  await page2.evaluate(() => window.scrollTo(0, 0));
  for (let i = 0; i < 5; i++) {
    await page2.screenshot({ path: `screenshots/globe-analysis/observer-scroll-${i}.png` });
    await page2.evaluate(() => window.scrollBy(0, 800));
    await page2.waitForTimeout(500);
  }

  await browser.close();
  console.log('Analysis complete! Check screenshots/globe-analysis/');
}

analyzeGlobe().catch(console.error);
