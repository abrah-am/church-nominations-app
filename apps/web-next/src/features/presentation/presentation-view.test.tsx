import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { createExperiencePreview } from '../../data/experience-preview'
import { PresentationView } from './presentation-view'

describe('PresentationView', () => {
  it('renders a hidden-results state and links to the visible mock preview', () => {
    const preview = createExperiencePreview()
    render(
      <MemoryRouter>
        <PresentationView preview={preview} resultsVisibility="hidden" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Please wait for the next instruction.' })).toBeInTheDocument()
    expect(screen.getByText('Results are hidden')).toBeInTheDocument()
    expect(screen.getByText(/Active session · Open/)).toBeInTheDocument()
    expect(screen.getByText(/Poll status: Open/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Preview visible-results layout' }))
      .toHaveAttribute('href', '/presentation/preview?results=visible')
    expect(screen.getByRole('link', { name: 'Preview hidden-results layout' }))
      .toHaveAttribute('aria-current', 'page')
    expect(screen.queryByText('Marcus Hill')).not.toBeInTheDocument()
    expect(screen.queryByText('Priya Nair')).not.toBeInTheDocument()
  })

  it('shows the shared aggregate snapshot with ballots-cast percentages and optional participation', async () => {
    const preview = createExperiencePreview()
    render(
      <MemoryRouter>
        <PresentationView preview={preview} resultsVisibility="visible" />
      </MemoryRouter>,
    )

    const results = screen.getByRole('list', { name: 'Aggregate candidate results' })
    const rows = within(results).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Marcus Hill')
    expect(rows[0]).toHaveTextContent(/3 votes\s*·\s*75%/)
    expect(rows[1]).toHaveTextContent('Priya Nair')
    expect(rows[1]).toHaveTextContent(/1 vote\s*·\s*25%/)
    expect(within(results).getAllByRole('progressbar').map((bar) => bar.getAttribute('aria-valuenow')))
      .toEqual(['75', '25'])

    expect(screen.getByRole('link', { name: 'Preview visible-results layout' }))
      .toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Preview hidden-results layout' }))
      .toHaveAttribute('href', '/presentation/preview?results=hidden')
    expect(screen.queryByText(/ballots cast in this poll/)).not.toBeInTheDocument()

    await screen.getByRole('button', { name: 'Preview ballots-cast count' }).click()
    expect(screen.getByText('4', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('ballots cast in this poll')).toBeInTheDocument()
  })

  it('does not expose nomination submission or ballot/voter identity data', () => {
    const preview = createExperiencePreview()
    render(
      <MemoryRouter>
        <PresentationView preview={preview} resultsVisibility="visible" />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Elaine Brooks')).not.toBeInTheDocument()
    expect(screen.queryByText('Robert James')).not.toBeInTheDocument()
    expect(screen.queryByText('Sofia Martinez')).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain('s-27-1')
    expect(document.body.textContent).not.toMatch(/voter name|submitted by/i)
  })

  it('keeps preview navigation view-only and does not persist or mutate the shared context', () => {
    const preview = createExperiencePreview()
    const before = structuredClone(preview)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const fetch = vi.spyOn(globalThis, 'fetch')

    const { rerender } = render(
      <MemoryRouter>
        <PresentationView preview={preview} resultsVisibility="hidden" />
      </MemoryRouter>,
    )
    rerender(
      <MemoryRouter>
        <PresentationView preview={preview} resultsVisibility="visible" />
      </MemoryRouter>,
    )

    expect(preview).toEqual(before)
    expect(setItem).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Preview hidden-results layout' }))
      .toHaveAttribute('href', '/presentation/preview?results=hidden')

    setItem.mockRestore()
    fetch.mockRestore()
  })
})
