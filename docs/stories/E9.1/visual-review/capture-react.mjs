export default async function run(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const elections = [
    { id: 'e-admin', departmentName: 'Administration', status: 'IN_PROGRESS', positions: [
      { id: 'p-director', name: 'Director', openingCount: 1, sequence: 1, progressStatus: 'ROUND_ACTIVE', nextAction: 'MONITOR_VOTING', roundNumber: 1 },
      { id: 'p-subdirector', name: 'Subdirector', openingCount: 1, sequence: 2, progressStatus: 'NOT_STARTED', nextAction: 'SET_UP_NOMINATIONS', roundNumber: null },
    ] },
    { id: 'e-community', departmentName: 'Community Services', status: 'COMPLETE', positions: [
      { id: 'p-outreach', name: 'Outreach Coordinator', openingCount: 1, sequence: 1, progressStatus: 'COMPLETE', nextAction: 'COMPLETE', roundNumber: null },
      { id: 'p-facilities', name: 'Facilities Lead', openingCount: 1, sequence: 2, progressStatus: 'COMPLETE', nextAction: 'COMPLETE', roundNumber: null },
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
  let intakeCreated = false;
  let intakeClosed = false;
  const nominations = () => ({
    id: 'intake-director', accessToken: 'visual-review-only', nameLimit: 5,
    status: intakeClosed ? 'CLOSED' : 'OPEN', sharedListRevision: 0, currentContributorCount: 3,
    listCreated: intakeClosed, revealed: false, submissions: [
      { id: 'submission-1', name: 'Taylor Reed' },
      { id: 'submission-2', name: 'Casey Lin' },
      { id: 'submission-3', name: 'Emerson Brooks' },
      { id: 'submission-4', name: 'Nia Carter' },
      { id: 'submission-5', name: 'Alex Morgan' },
    ], consolidatedNames: intakeClosed ? ['Alex Morgan', 'Casey Lin', 'Emerson Brooks'] : null,
    sharedList: intakeClosed ? [
      { id: 'candidate-1', name: 'Alex Morgan', sequence: 1, active: true },
      { id: 'candidate-2', name: 'Casey Lin', sequence: 2, active: true },
      { id: 'candidate-3', name: 'Emerson Brooks', sequence: 3, active: true },
    ] : [],
    removedEntries: [], changeEvents: [],
  });
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
    else if (url.pathname.endsWith('/rounds') && request.method() === 'GET') body = [];
    else if (url.pathname.endsWith('/nominations') && request.method() === 'GET') {
      if (!intakeCreated) {
        await route.fulfill({ status: 404, headers: { 'Access-Control-Allow-Origin': origin } });
        return;
      }
      body = nominations();
    } else if (url.pathname.endsWith('/nominations') && request.method() === 'POST') {
      intakeCreated = true;
      body = nominations();
    } else if (url.pathname.endsWith('/nominations/close') && request.method() === 'POST') {
      intakeClosed = true;
      body = nominations();
    }
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
  await page.getByLabel('Password').evaluate((input) => input.blur());
  await capture('react-sign-in', 1280, 800);
  await capture('react-sign-in', 390, 844);
  await page.locator('.login-form').evaluate((form) => form.requestSubmit());
  await page.getByRole('heading', { name: 'Administrator Workspace' }).waitFor();
  await page.getByRole('button', { name: /Elections 2026/ }).click();
  await page.getByRole('heading', { name: 'Department elections' }).waitFor();
  await page.waitForTimeout(300);
  await page.locator('.election-overview-item').nth(1).locator('.election-accordion-toggle').click();
  await page.getByRole('button', { name: 'Review: Outreach Coordinator' }).waitFor();
  await capture('react-dashboard', 1280, 800);
  await capture('react-dashboard', 390, 844);
  await page.locator('.election-overview-item').nth(1).locator('.election-accordion-toggle').click();
  await page.getByRole('button', { name: 'Start: Subdirector' }).click();
  await page.getByRole('navigation', { name: 'Election workflow breadcrumb' }).waitFor();
  await page.getByRole('heading', { name: 'Open nomination intake' }).waitFor();
  await capture('react-position-setup', 1280, 800);
  await capture('react-position-setup', 390, 844);
  await page.getByRole('button', { name: 'Open nomination intake' }).click();
  await page.getByLabel('Maximum names per visitor').waitFor();
  await page.getByRole('button', { name: 'Create intake' }).click();
  await page.getByRole('heading', { name: 'Nomination intake is open' }).waitFor();
  await page.waitForTimeout(300);
  await capture('react-position-workflow', 1280, 800);
  await capture('react-position-workflow', 390, 844);
  await page.getByRole('button', { name: 'Close nominations' }).click();
  await page.getByRole('dialog', { name: 'Close nominations?' }).getByRole('button', { name: 'Close nominations' }).click();
  await page.locator('.workflow-stage-group.is-intake-closed').waitFor({ timeout: 5000 }).catch(() => undefined);
  await page.waitForTimeout(300);
  await capture('react-position-closed-review', 1280, 800);
  await capture('react-position-closed-review', 390, 844);
  return {
    title: await page.title(),
    departments: await page.locator('.election-overview-item').count(),
    positionRows: await page.locator('.position-overview-row').count(),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  };
}
