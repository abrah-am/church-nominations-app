export default async function run(page) {
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const capture = async (name, width, height) => {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: `/Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/stories/E9.1/visual-review/${name}-${width}.png`, fullPage: true });
  };

  await page.locator('#admin-dashboard:not([hidden])').waitFor();
  await capture('prototype-dashboard', 1280, 800);
  await capture('prototype-dashboard', 390, 844);
  await page.locator('.open-election').first().evaluate((button) => button.click());
  await page.locator('.open-election-term[data-term="2026"]').click();
  await page.locator('#admin-election:not([hidden])').waitFor();
  await capture('prototype-election-overview', 1280, 800);
  await capture('prototype-election-overview', 390, 844);
  await page.locator('[data-open-election-flow]').first().evaluate((button) => button.click());
  await page.evaluate(() => {
    document.body.dataset.adminScreen = 'workflow';
    document.querySelector('#admin-home').hidden = true;
    document.querySelector('#election-flow').hidden = false;
    document.querySelector('#admin-intake-setup').hidden = true;
    document.querySelector('#admin-intake-active').hidden = false;
    document.querySelector('#admin-task-title').textContent = 'Manage nomination list';
    document.querySelector('#admin-status').textContent = 'Intake open';
    document.querySelector('#admin-instruction').textContent = 'Review the working list, edit or remove names, and broadcast updates when ready.';
  });
  await page.locator('#election-flow:not([hidden])').waitFor();
  await page.locator('#admin-intake-active:not([hidden])').waitFor();
  await capture('prototype-position-navigation', 1280, 800);
  await capture('prototype-position-navigation', 390, 844);
  return { title: await page.title(), positionRows: await page.locator('.position-row').count() };
}
