# E5.1 Results Prototype References

These screenshots capture the canonical prototype's active voting, close, and reveal experience after the prototype-only ballot simulation was added. The sample round has 18 ballots with two selections per ballot; candidate support is shown as a percentage of ballots cast, not a percentage of all selections. Results are ordered by votes descending and alphabetically for ties.

| State | Desktop | Mobile |
| --- | --- | --- |
| Voting active, simulated submissions | [PNG](../../../prototype/screenshots/P16-voting-active-simulated-desktop.png) | [PNG](../../../prototype/screenshots/P16-voting-active-simulated-mobile.png) |
| Closed, admin preview only | [PNG](../../../prototype/screenshots/P17-voting-closed-preview-desktop.png) | [PNG](../../../prototype/screenshots/P17-voting-closed-preview-mobile.png) |
| Results released to viewers | [PNG](../../../prototype/screenshots/P18-voting-results-released-desktop.png) | [PNG](../../../prototype/screenshots/P18-voting-results-released-mobile.png) |

Regenerate these references with `node docs/stories/E5.1/capture-results-reference.mjs` using the browser capture runner. The mock state is local to the prototype and does not demonstrate API behavior. The active voting state shows submission progress only, without candidate totals or bars.
