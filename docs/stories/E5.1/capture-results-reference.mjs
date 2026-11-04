export default async function run(page) {
  const prototypeUrl = 'file:///Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/prototype/prototype.html';
  const screenshotDirectory = '/Users/abraham/Projects/ChurchNominationProject/church-nominations-app/docs/prototype/screenshots';
  const state = {
    phase: 'released',
    round: 1,
    selectionCount: '2',
    expectedVoters: 18,
    simulatedBallots: [
      ['Avery Bennett', 'Jordan Ellis'], ['Avery Bennett', 'Morgan Patel'],
      ['Avery Bennett', 'Riley Thompson'], ['Avery Bennett', 'Samira Okafor'],
      ['Avery Bennett', 'Jordan Ellis'], ['Avery Bennett', 'Morgan Patel'],
      ['Avery Bennett', 'Riley Thompson'], ['Avery Bennett', 'Samira Okafor'],
      ['Avery Bennett', 'Jordan Ellis'], ['Avery Bennett', 'Morgan Patel'],
      ['Avery Bennett', 'Riley Thompson'], ['Avery Bennett', 'Samira Okafor'],
      ['Jordan Ellis', 'Morgan Patel'], ['Jordan Ellis', 'Riley Thompson'],
      ['Jordan Ellis', 'Samira Okafor'], ['Morgan Patel', 'Riley Thompson'],
      ['Morgan Patel', 'Samira Okafor'], ['Riley Thompson', 'Samira Okafor'],
    ],
    nominationSubmitted: true,
    nominees: ['Avery Bennett', 'Jordan Ellis', 'Morgan Patel', 'Riley Thompson', 'Samira Okafor'],
    participantNominees: ['Avery Bennett', 'Jordan Ellis', 'Morgan Patel', 'Riley Thompson', 'Samira Okafor'],
    participantNominationSubmitted: true,
    candidates: ['Avery Bennett', 'Jordan Ellis', 'Morgan Patel', 'Riley Thompson', 'Samira Okafor'],
    participantListVisible: false,
    nominationChanges: [],
    submitted: false,
    selected: [],
    decisions: ['Avery Bennett'],
    released: true,
    winner: 'Avery Bennett',
    declinedCandidates: [],
    replacementCandidates: [],
    replacementTieBreak: false,
    presentationVisible: true,
  };
  const stages = [
    { tag: 'P16-voting-active-simulated', phase: 'active', presentationVisible: false, ballotCount: 9 },
    { tag: 'P17-voting-closed-preview', phase: 'closed' },
    { tag: 'P18-voting-results-released', phase: 'released' },
  ];
  const captured = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const stage of stages) {
    await page.goto(`${prototypeUrl}?view=admin&capture=${stage.tag}`);
    await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: 'church-nominations-three-experience-mock-v2',
      value: {
        ...state,
        phase: stage.phase,
        presentationVisible: stage.presentationVisible ?? true,
        simulatedBallots: state.simulatedBallots.slice(0, stage.ballotCount ?? state.simulatedBallots.length),
      },
    });
    await page.reload();
    await page.locator('#admin-dashboard:not([hidden])').waitFor();
    await page.locator('.open-election').first().click();
    await page.locator('[data-open-election-flow]').click();
    await page.locator('#election-flow').waitFor();
    if (stage.phase === 'active') {
      await page.locator('#admin-active:not([hidden])').waitFor();
      await page.waitForFunction((count) => document.querySelector('#received-count')?.textContent === String(count), stage.ballotCount);
    } else if (stage.phase === 'closed') {
      await page.locator('#admin-closed:not([hidden])').waitFor();
      await page.waitForFunction(() => document.querySelectorAll('#admin-preview .result-bar').length === 5);
    } else {
      await page.locator('#admin-decisions:not([hidden])').waitFor();
      await page.waitForFunction(() => document.querySelectorAll('#decision-controls .result-bar').length === 5);
    }
    for (const viewport of [
      { width: 1280, height: 1600, suffix: 'desktop' },
      { width: 390, height: 1600, suffix: 'mobile' },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.evaluate(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
      await page.waitForFunction(() => window.scrollY === 0);
      await page.screenshot({ path: `${screenshotDirectory}/${stage.tag}-${viewport.suffix}.png` });
      captured.push(`${stage.tag}-${viewport.suffix}`);
    }
  }
  return { captured, total: captured.length };
}
