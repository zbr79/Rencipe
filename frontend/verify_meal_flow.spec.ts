import { test, expect } from '@playwright/test';

test.describe('Meal Flow Verification', () => {
  test('verify meal creation and behavior', async ({ page }) => {
    // 1. Log in
    await page.goto('https://rencipe.renstoolbox.com/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 2. Create a new meal
    await page.goto('https://rencipe.renstoolbox.com/meals');
    await page.click('button:has-text("Create Meal"), button:has-text("New Meal"), [aria-label="Create Meal"]');
    
    // Fill meal creation form (assuming title input is present in modal)
    const mealTitle = 'Test Meal ' + Date.now();
    await page.fill('input[placeholder*="Title"], input[name="title"]', mealTitle);
    await page.click('button:has-text("Create")');

    // Verification 1: Landing directly in edit mode
    // Check for meal settings inputs or "Save" button which usually indicates edit mode
    await expect(page).toHaveURL(/.*\/meals\/.*\/edit/);
    const settingsVisible = await page.isVisible('input[name="title"], .meal-settings');
    console.log('VERIFICATION_1: ' + (settingsVisible ? 'PASS' : 'FAIL') + ' - Landed in edit mode with inputs visible');

    const mealUrl = page.url();

    // Verification 3: Public checkbox shows confirmation modal
    const publicCheckbox = page.locator('input[type="checkbox"][name="isPublic"], label:has-text("Public") input');
    await publicCheckbox.click();
    const modalVisible = await page.isVisible('.modal, [role="dialog"]');
    console.log('VERIFICATION_3: ' + (modalVisible ? 'PASS' : 'FAIL') + ' - Public checkbox triggered modal');
    // Close modal if it appeared
    if (modalVisible) {
        await page.click('button:has-text("Cancel"), .modal button.close');
    }

    // Verification 4: Add-recipe picker behavior
    await page.click('button:has-text("Add Recipe")');
    const picker = page.locator('.recipe-picker, [role="dialog"]');
    const initialBox = await picker.boundingBox();
    
    await page.fill('input[placeholder*="Search"]', 'NonExistentRecipe' + Date.now());
    await page.waitForTimeout(1000); // Wait for search results
    const emptyBox = await picker.boundingBox();
    
    const centeredAndStable = initialBox && emptyBox && 
                               Math.abs(initialBox.x - emptyBox.x) < 5 && 
                               Math.abs(initialBox.width - emptyBox.width) < 5;
    const titleLarge = await page.evaluate(() => {
        const title = document.querySelector('.recipe-picker h2, .recipe-picker h1, [role="dialog"] h2');
        if (!title) return false;
        const fontSize = window.getComputedStyle(title).fontSize;
        return parseInt(fontSize) > 18;
    });
    console.log('VERIFICATION_4: ' + (centeredAndStable && titleLarge ? 'PASS' : 'FAIL') + ' - Picker stable: ' + centeredAndStable + ', Title large: ' + titleLarge);

    // Verification 2: Visiting normally after creation is read-only
    const viewUrl = mealUrl.replace('/edit', '');
    await page.goto(viewUrl);
    const isReadOnly = !(await page.isVisible('input[name="title"]'));
    const editButtonVisible = await page.isVisible('button:has-text("Edit meal")');
    console.log('VERIFICATION_2: ' + (isReadOnly && editButtonVisible ? 'PASS' : 'FAIL') + ' - Normal visit is read-only with Edit button');

    // Cleanup: Delete the meal
    await page.goto(mealUrl); // Back to edit or view
    await page.click('button:has-text("Delete"), button:has-text("Move to Trash")');
    await page.click('button:has-text("Confirm"), button:has-text("OK")');
  });
});
