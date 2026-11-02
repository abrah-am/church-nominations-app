export default async function run(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('file:///Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/prototype/prototype.html?view=admin');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#admin-dashboard:not([hidden])').waitFor();

  const capture = async (tag) => {
    const captures = [];
    for (const viewport of [
      { width: 1280, height: 800, suffix: 'desktop' },
      { width: 390, height: 844, suffix: 'mobile' },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const path = `/Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/prototype/screenshots/${tag}-${viewport.suffix}.png`;
      await page.screenshot({ path, fullPage: true });
      captures.push(`${tag}-${viewport.suffix}`);
    }
    await page.setViewportSize({ width: 1280, height: 800 });
    return captures;
  };
  const captured = [];
  captured.push(...await capture('P01-admin-dashboard'));
  await page.locator('.open-election').first().click();
  await page.locator('#admin-election:not([hidden])').waitFor();
  captured.push(...await capture('P02-election-overview'));
  await page.locator('[data-open-election-flow]').first().click();
  await page.locator('#election-flow:not([hidden])').waitFor();
  await page.locator('#admin-intake-setup:not([hidden])').waitFor();
  captured.push(...await capture('P03-position-setup'));
  await page.locator('#open-intake').click();
  await page.locator('#admin-intake-active:not([hidden])').waitFor();
  captured.push(...await capture('P04-intake-open-empty'));
  await page.evaluate(() => {
    const key = 'church-nominations-three-experience-mock-v1';
    const state = JSON.parse(localStorage.getItem(key));
    Object.assign(state, {
      phase: 'intake-submitted',
      nominationSubmitted: true,
      participantNominationSubmitted: true,
      nominees: ['Taylor Reed', 'Casey Lin', 'Emerson Brooks', 'Nia Carter', 'Alex Morgan'],
    });
    localStorage.setItem(key, JSON.stringify(state));
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(state) }));
  });
  await page.locator('#admin-intake-active:not([hidden])').waitFor();
  captured.push(...await capture('P04-intake-open-submitted'));
  await page.locator('#close-intake').click();
  await page.locator('#admin-intake-review:not([hidden])').waitFor();
  captured.push(...await capture('P05-intake-closed-review'));
  await page.locator('#admin-review-names input[aria-label="Edit nominee 1"]').fill('Taylor Reed Corrected');
  captured.push(...await capture('P05b-review-name-edited'));
  await page.getByRole('button', { name: 'Save correction for Taylor Reed' }).click();
  await page.locator('#confirm-nominations').click();
  await page.locator('#admin-intake-confirmed:not([hidden])').waitFor();
  captured.push(...await capture('P06-list-confirmed'));
  await page.locator('#toggle-workflow-presentation').check();
  captured.push(...await capture('P07-nominations-shared'));
  await page.locator('#prepare-round').click();
  await page.locator('#admin-progress:not([hidden])').waitFor();
  captured.push(...await capture('P08-round-draft'));
  await page.locator('#open-voting').click();
  await page.locator('#admin-active:not([hidden])').waitFor();
  captured.push(...await capture('P09-voting-active'));
  return { captured, total: captured.length };
}
