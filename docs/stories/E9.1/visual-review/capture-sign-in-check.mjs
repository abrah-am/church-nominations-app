export default async function run(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForSelector('.login-form');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('visual-review-only');
  const measurements = [];
  for (const [width, height] of [[1280, 800], [390, 844]]) {
    await page.setViewportSize({ width, height });
    const layout = await page.evaluate(() => {
      const masthead = document.querySelector('.access-masthead').getBoundingClientRect();
      const card = document.querySelector('.login-card').getBoundingClientRect();
      return {
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        mastheadCenter: Math.round(masthead.left + masthead.width / 2),
        cardTop: Math.round(card.top),
        mastheadBottom: Math.round(masthead.bottom),
        verticalGap: Math.round(card.top - masthead.bottom),
      };
    });
    await page.screenshot({ path: `/Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/stories/E9.1/visual-review/react-sign-in-${width}.png`, fullPage: true });
    measurements.push({ requestedWidth: width, ...layout });
  }
  return measurements;
}
