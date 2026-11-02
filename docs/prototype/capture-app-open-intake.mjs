export default async function run(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const election = {
    id: 'e-demo', departmentName: 'Administration', status: 'IN_PROGRESS', positions: [
      { id: 'p-director', name: 'Director', openingCount: 1, sequence: 1, progressStatus: 'NOMINATIONS_OPEN', nextAction: 'CLOSE_NOMINATIONS', roundNumber: null },
    ],
  };
  const intake = {
    id: 'intake-demo', accessToken: 'visual-review-only', nameLimit: 5, status: 'OPEN',
    sharedListRevision: 0, currentContributorCount: 1, listCreated: false, revealed: false,
    submissions: [
      { id: 's1', name: 'Taylor Reed' },
      { id: 's2', name: 'Casey Lin' },
      { id: 's3', name: 'Emerson Brooks' },
      { id: 's4', name: 'Nia Carter' },
      { id: 's5', name: 'Alex Morgan' },
    ], consolidatedNames: null, sharedList: [], removedEntries: [], changeEvents: [],
  };
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
    else if (url.pathname === '/api/elections') body = [election];
    else if (url.pathname === '/api/elections/e-demo') body = election;
    else if (url.pathname.endsWith('/nominations') && request.method() === 'GET') body = intake;
    else if (url.pathname.endsWith('/nominations/stream')) {
      await route.fulfill({ status: 404, headers: { 'Access-Control-Allow-Origin': origin } });
      return;
    } else if (url.pathname.endsWith('/rounds') && request.method() === 'GET') body = [];
    await route.fulfill({ status: 200, contentType: 'application/json', headers: {
      'Access-Control-Allow-Origin': origin, 'Cache-Control': 'no-store',
    }, body: JSON.stringify(body) });
  });

  await page.goto('http://localhost:5173/');
  await page.getByRole('region', { name: 'Sign in to your church' }).waitFor();
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('visual-review-only');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('heading', { name: 'Administrator Workspace' }).waitFor();
  await page.getByRole('button', { name: /Elections 2026/ }).click();
  await page.getByRole('heading', { name: 'Department elections' }).waitFor();
  await page.getByRole('button', { name: 'Start: Director' }).click();
  await page.getByRole('heading', { name: 'Nomination intake is open' }).waitFor();
  await page.getByRole('list', { name: 'Submitted nomination names' }).waitFor();
  const captures = [];
  for (const viewport of [
    { width: 1280, height: 800, suffix: 'desktop' },
    { width: 390, height: 844, suffix: 'mobile' },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const path = `/Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/prototype/screenshots/app-open-intake-${viewport.suffix}.png`;
    await page.screenshot({ path, fullPage: true });
    captures.push(path);
  }
  return {
    captured: captures,
    heading: await page.getByRole('heading', { name: 'Nomination intake is open' }).count(),
    listNames: await page.locator('[aria-label="Submitted nomination names"] li').allTextContents(),
    broadcastDisabled: await page.getByRole('button', { name: 'Broadcast list' }).isDisabled(),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  };
}
