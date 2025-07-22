import { test, expect } from '@playwright/test';

test.describe('Diamond Lattice Visualization', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Hello World React App/);
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Diamond Lattice Visualization');
  });

  test('should have a size slider', async ({ page }) => {
    await page.goto('/');
    
    // Check that the slider exists
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    
    // Check slider has correct attributes
    await expect(slider).toHaveAttribute('min', '1');
    await expect(slider).toHaveAttribute('max', '8');
    
    // Check initial value
    await expect(slider).toHaveValue('4');
  });

  test('should display size label', async ({ page }) => {
    await page.goto('/');
    
    // Check that size label shows current value
    await expect(page.locator('label')).toContainText('Size: 4');
  });

  test('should change size when slider is moved', async ({ page }) => {
    await page.goto('/');
    
    const slider = page.locator('input[type="range"]');
    const label = page.locator('label');
    
    // Move slider to different value
    await slider.fill('6');
    
    // Check that label updates
    await expect(label).toContainText('Size: 6');
  });

  test('should have 3D canvas for visualization', async ({ page }) => {
    await page.goto('/');
    
    // Check that Three.js canvas exists
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Canvas should have reasonable dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox.width).toBeGreaterThan(100);
    expect(canvasBox.height).toBeGreaterThan(100);
  });

  test('should have instruction text', async ({ page }) => {
    await page.goto('/');
    
    // Check for user instruction text
    await expect(page.getByText('Use mouse to rotate, zoom, and pan the lattice')).toBeVisible();
  });

  test('should update visualization when size changes', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initial render
    await page.waitForTimeout(1000);
    
    const slider = page.locator('input[type="range"]');
    
    // Change size and wait for re-render
    await slider.fill('2');
    await page.waitForTimeout(500);
    
    // Change to larger size
    await slider.fill('7');
    await page.waitForTimeout(500);
    
    // Canvas should still be visible after changes
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle edge cases for slider', async ({ page }) => {
    await page.goto('/');
    
    const slider = page.locator('input[type="range"]');
    const label = page.locator('label');
    
    // Test minimum value
    await slider.fill('1');
    await expect(label).toContainText('Size: 1');
    
    // Test maximum value
    await slider.fill('8');
    await expect(label).toContainText('Size: 8');
  });
});