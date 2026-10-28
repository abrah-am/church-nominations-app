export default async function run(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const board = {
    id: 'board-2026',
    year: 2026,
    members: [
      { id: 'member-1', name: 'Jordan Lee' },
      { id: 'member-2', name: 'Avery Chen' },
      { id: 'member-3', name: 'Morgan Williams' },
    ],
    sessions: [
      { id: 'session-1', sessionDate: '2026-10-09', attendedMemberIds: ['member-1', 'member-2'] },
      { id: 'session-2', sessionDate: '2026-10-16', attendedMemberIds: ['member-1'] },
    ],
  };
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
    else if (url.pathname === '/api/elections') body = [];
    else if (url.pathname === '/api/boards') body = [board];
    else if (url.pathname === '/api/boards/board-2026') body = board;
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
  });
  await page.waitForSelector('.login-form');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('visual-review-only');
  await page.locator('.login-form').evaluate((form) => form.requestSubmit());
  await page.getByRole('heading', { name: 'Administrator Workspace', exact: true }).waitFor();
  await page.getByRole('button', { name: /Elections 2026/ }).click();
  await page.getByRole('heading', { name: 'Department elections' }).waitFor();
  await page.getByRole('button', { name: 'Annual Boards' }).click();
  await page.getByRole('button', { name: /2026 Annual Board/ }).waitFor();
  await page.getByRole('button', { name: /2026 Annual Board/ }).click();
  await page.getByRole('heading', { name: 'Board roster' }).waitFor();

  const capture = async (width, height) => {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: `/Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/stories/E9.1/visual-review/react-annual-board-${width}.png`, fullPage: true });
    return page.evaluate(() => {
      const bounds = (selector) => {
        const { x, y, width: elementWidth, height: elementHeight } = document.querySelector(selector).getBoundingClientRect();
        return { x, y, width: elementWidth, height: elementHeight };
      };
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        roster: bounds('.board-detail-grid > div:first-child'),
        sessions: bounds('.board-detail-grid > div:last-child'),
        summary: bounds('.board-summary'),
        attendance: bounds('.attendance-editor'),
        attendanceChecks: document.querySelectorAll('.attendance-list input[type="checkbox"]').length,
      };
    });
  };

  const desktop = await capture(1280, 800);
  const mobile = await capture(390, 844);
  return { title: await page.title(), desktop, mobile };
}