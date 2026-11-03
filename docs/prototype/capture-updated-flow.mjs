export default async function run(page) {
  const prototypeUrl = 'file:///Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/prototype/prototype.html';
  const screenshotDirectory = '/Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/prototype/screenshots';
  const candidates = ['Taylor Reed Jr.', 'Emerson Brooks', 'Nia Carter', 'Alex Morgan'];
  const changes = [
    'Name corrected: Taylor Reed → Taylor Reed Jr.',
    'Name removed: Casey Lin · Duplicate',
  ];
  const baseState = {
    phase: 'intake-active',
    round: 1,
    nominationSubmitted: true,
    nominees: ['Taylor Reed', 'Casey Lin', 'Emerson Brooks', 'Nia Carter', 'Alex Morgan'],
    participantNominees: ['Taylor Reed', 'Casey Lin', 'Emerson Brooks', 'Nia Carter', 'Alex Morgan'],
    participantNominationSubmitted: true,
    candidates: [...candidates],
    participantListVisible: false,
    nominationChanges: [],
    submitted: false,
    selected: [],
    decisions: [],
    released: false,
    winner: 'Avery Bennett',
    declinedCandidates: [],
    replacementCandidates: [],
    replacementTieBreak: false,
    presentationVisible: true,
  };
  const stages = [
    { tag: 'P10-intake-live', view: 'admin', state: { ...baseState, phase: 'intake-submitted', presentationVisible: true } },
    { tag: 'P11-consolidation-private', view: 'admin', state: { ...baseState, phase: 'intake-review', presentationVisible: false, participantListVisible: false, nominationChanges: changes } },
    { tag: 'P12-consolidation-published', view: 'admin', state: { ...baseState, phase: 'nominations-shared', nominees: candidates, presentationVisible: true, participantListVisible: true, nominationChanges: changes } },
    { tag: 'P13-presentation-live-intake', view: 'presentation', state: { ...baseState, phase: 'intake-submitted', presentationVisible: true } },
    { tag: 'P14-participant-published-list', view: 'voter', state: { ...baseState, phase: 'nominations-shared', nominees: candidates, presentationVisible: true, participantListVisible: true, nominationChanges: changes } },
    { tag: 'P15-voting-active-hidden-display', view: 'admin', state: { ...baseState, phase: 'active', presentationVisible: false, participantListVisible: false } },
  ];
  const captured = [];
  for (const stage of stages) {
    await page.goto(`${prototypeUrl}?view=${stage.view}&capture=${stage.tag}`);
    await page.evaluate((state) => {
      localStorage.setItem('church-nominations-three-experience-mock-v2', JSON.stringify(state));
    }, stage.state);
    await page.reload();
    if (stage.view === 'admin') {
      await page.locator('#admin-dashboard:not([hidden])').waitFor();
      await page.evaluate(() => {
        document.querySelector('#admin-dashboard .open-election').click();
        document.querySelector('[data-open-election-flow]').click();
      });
    }
    await page.locator(stage.view === 'admin' ? '#election-flow' : stage.view === 'voter' ? '#view-voter' : '#view-presentation').waitFor();
    if (stage.view === 'admin') {
      await page.locator('#admin-task-title').waitFor();
      await page.waitForFunction(() => document.querySelector('#admin-task-title')?.textContent === 'Review and consolidate' || document.querySelector('#admin-task-title')?.textContent === 'Monitor voting');
      await page.evaluate(() => {
        document.querySelector('#election-flow').scrollIntoView();
      });
    }
    for (const viewport of [
      { width: 1280, height: 1600, suffix: 'desktop' },
      { width: 390, height: 1600, suffix: 'mobile' },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const target = `${screenshotDirectory}/${stage.tag}-${viewport.suffix}.png`;
      await page.screenshot({ path: target });
      captured.push(`${stage.tag}-${viewport.suffix}`);
    }
  }
  return { captured, total: captured.length };
}
