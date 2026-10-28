export default async function run(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForSelector('#login-form');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('visual-review-only');
  await page.locator('#login-form').evaluate((form) => form.requestSubmit());
  await page.locator('#admin-term-chooser').waitFor({ state: 'visible' });
  const capture = async (name, width, height) => {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: `/Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/stories/E9.1/visual-review/${name}-${width}.png`, fullPage: true });
  };
  await capture('prototype-term-chooser', 1280, 800);
  await capture('prototype-term-chooser', 390, 844);
  await page.getByRole('button', { name: 'Open election', exact: false }).last().click();
  await page.getByRole('heading', { name: 'Elections 2027' }).waitFor();
  await capture('prototype-election-accordion', 1280, 800);
  await capture('prototype-election-accordion', 390, 844);
  const firstDepartment = page.locator('.department-accordion').first();
  const firstSummary = firstDepartment.locator('summary');
  await firstSummary.click();
  const collapsed = !(await firstDepartment.locator('.department-content').isVisible());
  await firstSummary.click();
  const reopened = await firstDepartment.locator('.department-content').isVisible();
  return {
    title: await page.title(),
    term: await page.locator('#period-title').innerText(),
    departments: await page.locator('.department-accordion').count(),
    mockLinks: await page.locator('.demo-link, .access-tool').count(),
    accordionCollapsed: collapsed,
    accordionReopened: reopened,
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  };
}
