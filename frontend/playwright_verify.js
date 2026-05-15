const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('--- STARTING VERIFICATION ---');

  try {
    // 1) Redirect Check
    console.log('1) Checking redirect from /meal-plans?kind=meal');
    await page.goto('https://rencipe.renstoolbox.com/meal-plans?kind=meal');
    await page.waitForURL(url => url.pathname === '/my-work' && url.searchParams.get('kind') === 'meals', { timeout: 10000 });
    console.log('PASS: Redirected to /my-work?kind=meals');
  } catch (e) {
    console.log('FAIL: Redirect check failed or timed out. Current URL:', page.url());
  }

  try {
    // Sign in as admin
    console.log('Signing in...');
    await page.goto('https://rencipe.renstoolbox.com/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index', { timeout: 10000 }).catch(() => {}); // Wait for login
  } catch (e) {
    console.log('Login failed, proceeding anyway...');
  }

  try {
    // 2) Create Meal & Draft Mode Check
    console.log('2) Checking New Meal Draft behavior');
    let postFired = false;
    page.on('request', request => {
      if (request.url().includes('/api/meal-plans') && request.method() === 'POST') {
        postFired = true;
      }
    });

    await page.goto('https://rencipe.renstoolbox.com/my-work?kind=meals');
    const createBtn = page.locator('button:has-text("Create"), a:has-text("Create")').first();
    await createBtn.click();
    
    await page.waitForURL('**/meal-plans/new', { timeout: 10000 });
    console.log('PASS: Landed on /meal-plans/new');
    console.log('POST /api/meal-plans fired:', postFired ? 'YES (FAIL)' : 'NO (PASS)');

  } catch (e) {
    console.log('FAIL: Draft mode check failed.', e.message);
  }

  // 3) & 4) Add recipe and check transition / Back behavior
  try {
    console.log('3 & 4) Adding recipe and checking navigation');
    // Assuming there's a search or add recipe button
    await page.click('button:has-text("Add Recipe")'); 
    await page.fill('input[placeholder*="Search"]', 'Pasta'); // Placeholder guess
    await page.keyboard.press('Enter');
    await page.click('.recipe-item >> text=Select'); // Selector guess

    await page.waitForURL(url => /\/meal-plans\/\d+/.test(url.pathname), { timeout: 10000 });
    console.log('PASS: Transitioned to real meal route:', page.url());

    console.log('4) Checking footer back button');
    await page.click('button:has-text("Leave"), button:has-text("Back")'); 
    await page.waitForTimeout(2000);
    console.log('Current URL after footer click:', page.url());
  } catch (e) {
    console.log('FAIL: Recipe add or footer transition failed. Likely selector mismatch.');
  }

  // 5) Recipe Edit Autosave Block
  try {
    console.log('5) Checking autosave block on missing fields');
    await page.goto('https://rencipe.renstoolbox.com/recipes');
    await page.locator('a:has-text("Edit")').first().click();
    
    let putFired = false;
    page.on('request', request => {
      if (request.url().includes('/api/recipes/') && request.method() === 'PUT') {
        putFired = true;
      }
    });

    const descField = page.locator('textarea[name="description"], [data-testid="description-input"]');
    await descField.fill('');
    await page.waitForTimeout(3000); // Debounce wait

    console.log('PUT /api/recipes fired:', putFired ? 'YES (FAIL)' : 'NO (PASS)');
    const msg = await page.locator('text=Save paused, text=Missing required').isVisible();
    console.log('Blocked/Paused message visible:', msg ? 'YES (PASS)' : 'NO (FAIL)');

  } catch (e) {
    console.log('FAIL: Autosave check failed.', e.message);
  }

  await browser.close();
})();
