const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000); // Wait for lattice to load
  
  await page.screenshot({ 
    path: 'lattice-screenshot.png',
    fullPage: true
  });
  
  console.log('Screenshot saved as lattice-screenshot.png');
  await browser.close();
})();