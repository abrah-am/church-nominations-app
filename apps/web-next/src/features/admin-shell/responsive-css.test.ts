import { describe, expect, it } from 'vitest'
import stylesheet from '../../index.css?raw'

describe('compact responsive shell constraints', () => {
  it('does not impose a 320px minimum on the document when a vertical scrollbar reduces the layout viewport', () => {
    const htmlRules = stylesheet.match(/html\s*\{([^}]*)\}/)?.[1] ?? ''
    const bodyRules = stylesheet.match(/body\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(htmlRules).not.toMatch(/min-width\s*:/)
    expect(bodyRules).not.toMatch(/min-width\s*:/)
  })

  it('does not conceal horizontal overflow with a document-level overflow rule', () => {
    expect(stylesheet).not.toMatch(
      /(?:html|body)\s*\{[^}]*overflow-x\s*:\s*hidden/s,
    )
  })
})
