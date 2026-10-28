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
      await route.fulfill({ status: 204, headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization,content-type,accept',
      } });
      return;
    }
    let body = {};
    if (url.pathname === '/api/auth/me') body = { id: 'account-1', email: 'admin@example.com' };
    else if (url.pathname === '/api/churches/my') body = [{ id: 'church-1', name: 'Grace Community Church' }];
    else if (url.pathname === '/api/elections') body = elections;
    else if (url.pathname === '/api/elections/e-admin') body = elections[0];
    else if (url.pathname.includes('/nominations')) body = {
      state: 'NOT_STARTED', maxNamesPerVisitor: 5, participantCount: 0,
      revealed: false, submissions: [], sharedList: [],
    };
    await route.fulfill({ status: 200, contentType: 'application/json', headers: {
      'Access-Control-Allow-Origin': origin, 'Cache-Control': 'no-store',
    }, body: JSON.stringify(body) });
  });

  const capture = async (name, width, height) => {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: `/Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/stories/E9.1/visual-review/${name}-${width}.png`, fullPage: true });
  };

  await page.waitForSelector('.login-form');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('visual-review-only');
  await capture('react-sign-in', 1280, 800);
  await capture('react-sign-in', 390, 844);
  await page.locator('.login-form').evaluate((form) => form.requestSubmit());
  await page.getByRole('heading', { name: 'Grace Community Church' }).waitFor();
  await page.waitForTimeout(300);
  await capture('react-dashboard', 1280, 800);
  await capture('react-dashboard', 390, 844);
  await page.getByRole('button', { name: 'Monitor voting: Director' }).click();
  await page.getByRole('navigation', { name: 'Election positions' }).waitFor();
  await page.waitForTimeout(300);
  await capture('react-position-navigation', 1280, 800);
  await capture('react-position-navigation', 390, 844);
  return {
    title: await page.title(),
    departments: await page.locator('.election-overview-item').count(),
    positionRows: await page.locator('.position-stepper-item').count(),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  };
}
