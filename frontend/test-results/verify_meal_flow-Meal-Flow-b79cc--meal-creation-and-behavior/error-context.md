# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verify_meal_flow.spec.ts >> Meal Flow Verification >> verify meal creation and behavior
- Location: verify_meal_flow.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="username"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: Rencipe
      - heading "Welcome back" [level=2] [ref=e7]
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Username
          - textbox "Username" [ref=e11]: admin
        - generic [ref=e12]:
          - generic [ref=e13]: Password
          - textbox "Password" [ref=e14]: admin
        - button "Sign in" [ref=e15] [cursor=pointer]
      - generic [ref=e16]:
        - button "Forgot password?" [ref=e17] [cursor=pointer]
        - button "Sign up" [ref=e18] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Meal Flow Verification', () => {
  4  |   test('verify meal creation and behavior', async ({ page }) => {
  5  |     // 1. Log in
  6  |     await page.goto('https://rencipe.renstoolbox.com/login');
> 7  |     await page.fill('input[name="username"]', 'admin');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8  |     await page.fill('input[name="password"]', 'admin');
  9  |     await page.click('button[type="submit"]');
  10 |     await page.waitForURL('**/dashboard');
  11 | 
  12 |     // 2. Create a new meal
  13 |     await page.goto('https://rencipe.renstoolbox.com/meals');
  14 |     await page.click('button:has-text("Create Meal"), button:has-text("New Meal"), [aria-label="Create Meal"]');
  15 |     
  16 |     // Fill meal creation form (assuming title input is present in modal)
  17 |     const mealTitle = 'Test Meal ' + Date.now();
  18 |     await page.fill('input[placeholder*="Title"], input[name="title"]', mealTitle);
  19 |     await page.click('button:has-text("Create")');
  20 | 
  21 |     // Verification 1: Landing directly in edit mode
  22 |     // Check for meal settings inputs or "Save" button which usually indicates edit mode
  23 |     await expect(page).toHaveURL(/.*\/meals\/.*\/edit/);
  24 |     const settingsVisible = await page.isVisible('input[name="title"], .meal-settings');
  25 |     console.log('VERIFICATION_1: ' + (settingsVisible ? 'PASS' : 'FAIL') + ' - Landed in edit mode with inputs visible');
  26 | 
  27 |     const mealUrl = page.url();
  28 | 
  29 |     // Verification 3: Public checkbox shows confirmation modal
  30 |     const publicCheckbox = page.locator('input[type="checkbox"][name="isPublic"], label:has-text("Public") input');
  31 |     await publicCheckbox.click();
  32 |     const modalVisible = await page.isVisible('.modal, [role="dialog"]');
  33 |     console.log('VERIFICATION_3: ' + (modalVisible ? 'PASS' : 'FAIL') + ' - Public checkbox triggered modal');
  34 |     // Close modal if it appeared
  35 |     if (modalVisible) {
  36 |         await page.click('button:has-text("Cancel"), .modal button.close');
  37 |     }
  38 | 
  39 |     // Verification 4: Add-recipe picker behavior
  40 |     await page.click('button:has-text("Add Recipe")');
  41 |     const picker = page.locator('.recipe-picker, [role="dialog"]');
  42 |     const initialBox = await picker.boundingBox();
  43 |     
  44 |     await page.fill('input[placeholder*="Search"]', 'NonExistentRecipe' + Date.now());
  45 |     await page.waitForTimeout(1000); // Wait for search results
  46 |     const emptyBox = await picker.boundingBox();
  47 |     
  48 |     const centeredAndStable = initialBox && emptyBox && 
  49 |                                Math.abs(initialBox.x - emptyBox.x) < 5 && 
  50 |                                Math.abs(initialBox.width - emptyBox.width) < 5;
  51 |     const titleLarge = await page.evaluate(() => {
  52 |         const title = document.querySelector('.recipe-picker h2, .recipe-picker h1, [role="dialog"] h2');
  53 |         if (!title) return false;
  54 |         const fontSize = window.getComputedStyle(title).fontSize;
  55 |         return parseInt(fontSize) > 18;
  56 |     });
  57 |     console.log('VERIFICATION_4: ' + (centeredAndStable && titleLarge ? 'PASS' : 'FAIL') + ' - Picker stable: ' + centeredAndStable + ', Title large: ' + titleLarge);
  58 | 
  59 |     // Verification 2: Visiting normally after creation is read-only
  60 |     const viewUrl = mealUrl.replace('/edit', '');
  61 |     await page.goto(viewUrl);
  62 |     const isReadOnly = !(await page.isVisible('input[name="title"]'));
  63 |     const editButtonVisible = await page.isVisible('button:has-text("Edit meal")');
  64 |     console.log('VERIFICATION_2: ' + (isReadOnly && editButtonVisible ? 'PASS' : 'FAIL') + ' - Normal visit is read-only with Edit button');
  65 | 
  66 |     // Cleanup: Delete the meal
  67 |     await page.goto(mealUrl); // Back to edit or view
  68 |     await page.click('button:has-text("Delete"), button:has-text("Move to Trash")');
  69 |     await page.click('button:has-text("Confirm"), button:has-text("OK")');
  70 |   });
  71 | });
  72 | 
```