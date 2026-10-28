export default async function run(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const elections = [
    { id: 'e-admin', departmentName: 'Administration', status: 'IN_PROGRESS', positions: [
      { id: 'p-director', name: 'Director', openingCount: 1, sequence: 1, progressStatus: 'ROUND_ACTIVE', nextAction: 'MONITOR_VOTING', roundNumber: 2 },
      { id: 'p-subdirector', name: 'Subdirector', openingCount: 1, sequence: 2, progressStatus: 'NOT_STARTED', nextAction: 'SET_UP_NOMINATIONS', roundNumber: null },
    ] },
    { id: 'e-community', departmentName: 'Community Services', status: 'COMPLETE', positions: [
      { id: 'p-outreach', name: 'Outreach Coordinator', openingCount: 1, sequence: 1, progressStatus: 'COMPLETE', nextAction: 'COMPLETE', roundNumber: null },
      { id: 'p-facilities', name: 'Facilities Lead', openingCount: 1, sequence: 2, progressStatus: 'NOT_STARTED', nextAction: 'SET_UP_NOMINATIONS', roundNumber: null },
    ] },
    { id: 'e-finance', departmentName: 'Finance', status: 'SETUP', positions: [
      { id: 'p-treasurer', name: 'Treasurer', openingCount: 1, sequence: 1, progressStatus: 'NOT_STARTED', nextAction: 'SET_UP_NOMINATIONS', roundNumber: null },
      { id: 'p-assistant', name: 'Assistant Treasurer', openingCount: 1, sequence: 2, progressStatus: 'NOT_STARTED', nextAction: 'SET_UP_NOMINATIONS', roundNumber: null },
    ] },
    { id: 'e-education', departmentName: 'Education', status: 'SETUP', positions: [
      { id: 'p-education', name: 'Education Director', openingCount: 1, sequence: 1, progressStatus: 'NOT_STARTED', nextAction: 'SET_UP_NOMINATIONS', roundNumber: null },
      { id: 'p-youth', name: 'Youth Coordinator', openingCount: 1, sequence: 2, progressStatus: 'NOT_STARTED', nextAction: 'SET_UP_NOMINATIONS', roundNumber: null },
    ] },
  ];
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const origin = new URL(page.url()).origin;
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'authorization,content-type,accept' } });
      return;
    }
    let body = {};
    if (url.pathname === '/api/auth/me') body = { id: 'account-1', email: 'admin@example.com' };
    else if (url.pathname === '/api/churches/my') body = [{ id: 'church-1', name: 'Grace Community Church' }];
    else if (url.pathname === '/api/elections') body = elections;
    else if (url.pathname.startsWith('/api/elections/')) body = elections[0];
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
  });
  await page.waitForSelector('.login-form');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('visual-review-only');
  await page.locator('.login-form').evaluate((form) => form.requestSubmit());
  await page.getByRole('heading', { name: 'Administrator Workspace', exact: true }).waitFor();
  const capture = async (name, width, height) => {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: `/Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/stories/E9.1/visual-review/${name}-${width}.png`, fullPage: true });
  };
  await capture('react-term-chooser', 1280, 800);
  await capture('react-term-chooser', 390, 844);
  await page.getByRole('button', { name: /Elections 2027/ }).click();
  await page.getByRole('heading', { name: 'Elections 2027', exact: true }).waitFor();
  await capture('react-election-accordion', 1280, 800);
  await capture('react-election-accordion', 390, 844);
  const toggle = page.getByRole('button', { name: 'Collapse positions' }).first();
  await toggle.click();
  const collapsed = await page.getByRole('button', { name: 'Expand positions' }).count();
  await page.getByRole('button', { name: 'Expand positions' }).first().click();
  return { term: await page.getByRole('heading', { name: 'Elections 2027', exact: true }).innerText(), departments: await page.locator('.election-overview-item').count(), mockLinkLabels: await page.locator('.demo-link-panel .demo-badge').allTextContents(), collapsedAccordionCount: collapsed, overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth) };
}
