import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from './app/App'

function BackButton() {
  const navigate = useNavigate()

  return (
    <button type="button" onClick={() => navigate(-1)}>
      Go back
    </button>
  )
}

function CurrentRoute() {
  const { pathname, search } = useLocation()

  return <output data-testid="current-route">{pathname}{search}</output>
}

function renderRoutes(initialPath = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppRoutes />
      <CurrentRoute />
      <BackButton />
    </MemoryRouter>,
  )
}

function expectOneCurrentDestination() {
  const navigations = screen.getAllByRole('navigation', { name: 'Application' })

  for (const navigation of navigations) {
    const currentLinks = within(navigation)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')

    expect(currentLinks).toHaveLength(1)
  }
}

function getPrimaryNavigation() {
  const [navigation] = screen.getAllByRole('navigation', { name: 'Application' })
  expect(navigation).toBeDefined()
  return navigation!
}

describe('admin shell routes', () => {
  it('renders the position workspace in the accepted shell and approved app navigation', async () => {
    renderRoutes()

    expect(await screen.findByRole('heading', { name: 'Position workspace', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Church Elder' })).toBeInTheDocument()
    expect(screen.getByText(/Development mock context/)).toBeInTheDocument()

    const navigation = getPrimaryNavigation()
    expect(
      within(navigation).getByRole('link', { name: 'Elections' }),
    ).toHaveAttribute('href', '/admin/setup')
    expect(
      within(navigation).getByRole('link', { name: 'Elections' }),
    ).toHaveAttribute('aria-current', 'page')
    expectOneCurrentDestination()
    expect(
      within(navigation).getByRole('link', { name: 'Church settings' }),
    ).toHaveAttribute('href', '/admin/setup/churches')
    expect(
      within(navigation).getByRole('link', { name: 'Term management' }),
    ).toHaveAttribute('href', '/admin/setup/terms')
    expect(within(navigation).queryByRole('link', { name: /dashboard/i })).toBeNull()
  })

  it('supports client navigation, deep-linked destinations, and browser-style back navigation', async () => {
    const user = userEvent.setup()
    renderRoutes('/admin/setup/churches')

    expect(
      screen.getByRole('heading', { name: 'Church settings', level: 1 }),
    ).toBeInTheDocument()
    expectOneCurrentDestination()

    await user.click(
      within(getPrimaryNavigation()).getByRole('link', {
        name: 'Term management',
      }),
    )
    expect(
      screen.getByRole('heading', { name: 'Term management', level: 1 }),
    ).toBeInTheDocument()
    expectOneCurrentDestination()

    await user.click(screen.getByRole('button', { name: 'Go back' }))
    expect(
      screen.getByRole('heading', { name: 'Church settings', level: 1 }),
    ).toBeInTheDocument()
    expectOneCurrentDestination()
  })

  it.each([
    ['/admin/setup/churches', 'Church settings'],
    ['/admin/setup/terms', 'Term management'],
  ])('marks only %s as current when directly loaded', (path, destination) => {
    renderRoutes(path)

    const navigation = getPrimaryNavigation()
    expect(
      within(navigation)
        .getAllByRole('link')
        .filter((link) => link.getAttribute('aria-current') === 'page')
        .map((link) => link.textContent?.trim()),
    ).toEqual([destination])
    expectOneCurrentDestination()
  })

  it('provides a skip link and semantic landmarks', () => {
    renderRoutes()

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(
      screen.getByRole('complementary', { name: 'Application sidebar' }),
    ).toBeInTheDocument()
    expectOneCurrentDestination()
    expect(screen.getByRole('main', { name: 'Main content' })).toHaveAttribute(
      'id',
      'main-content',
    )
  })
})

describe('responsive navigation', () => {
  it('opens a labeled dialog, contains keyboard focus, and returns focus after Escape', async () => {
    const user = userEvent.setup()
    renderRoutes()

    const trigger = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Church nominations' })
    expect(dialog).toBeInTheDocument()
    expect(dialog.contains(document.activeElement)).toBe(true)

    await act(async () => {
      await user.tab()
    })
    expect(dialog.contains(document.activeElement)).toBe(true)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})

describe('experience preview navigation', () => {
  it('navigates to the shared Voter workflow without changing Admin viewing context', async () => {
    const user = userEvent.setup()
    renderRoutes()

    const position = screen.getByRole('combobox', { name: 'Position' })
    await user.click(position)
    await user.click(await screen.findByRole('option', { name: 'Secretary' }))

    await user.click(
      within(getPrimaryNavigation()).getByRole('link', { name: 'Voter preview' }),
    )
    expect(screen.getByTestId('current-route')).toHaveTextContent(
      '/voter/preview?state=voting',
    )
    expect(screen.getByText('Mock active participant session · separate from the Admin viewing context')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Waiting for an active poll' })).toBeInTheDocument()
    expect(screen.getByText(/separate from Admin's viewed context/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Church nominations' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Admin preview' }))
    expect(screen.getByTestId('current-route')).toHaveTextContent('/admin')
    expect(screen.getByRole('combobox', { name: 'Position' })).toHaveTextContent(
      'Secretary',
    )
    expect(screen.getByText('Church Elder · Round 2 · Open')).toBeInTheDocument()
  })

  it('routes Presentation preview directly to the hidden-results state', async () => {
    const user = userEvent.setup()
    renderRoutes()

    await user.click(
      within(getPrimaryNavigation()).getByRole('link', {
        name: 'Presentation preview',
      }),
    )

    expect(screen.getByTestId('current-route')).toHaveTextContent(
      '/presentation/preview?results=hidden',
    )
    expect(screen.getByRole('link', { name: 'Church nominations' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Please follow the meeting instructions.' })).toBeInTheDocument()
  })

  it('shares nomination publication, voting results, and ballots-cast settings across routes', async () => {
    const user = userEvent.setup()
    renderRoutes()

    await user.click(screen.getByRole('button', { name: 'Create nomination intake' }))
    await user.click(screen.getByRole('button', { name: 'Open nomination intake' }))
    await user.click(screen.getByRole('link', { name: 'Voter preview' }))
    await user.type(screen.getByRole('textbox', { name: 'Name 1' }), 'Zoe Smith')
    await user.click(screen.getByRole('button', { name: 'Add another name' }))
    await user.type(screen.getByRole('textbox', { name: 'Name 2' }), 'Aaron James')
    await user.click(screen.getByRole('button', { name: 'Submit nominations' }))
    expect(screen.getByRole('region', { name: 'Your own submitted names' })).toHaveTextContent('Zoe Smith')
    expect(screen.getByRole('region', { name: 'Your own submitted names' })).toHaveTextContent('Aaron James')

    await user.click(screen.getByRole('link', { name: 'Presentation preview' }))
    expect(screen.queryByText('Zoe Smith')).not.toBeInTheDocument()
    expect(screen.queryByText('Aaron James')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Admin preview' }))
    await user.click(screen.getByRole('button', { name: 'Show live names on Presentation' }))
    await user.click(screen.getByRole('link', { name: 'Presentation preview' }))
    const liveNames = screen.getByRole('heading', { name: 'Names submitted so far' }).parentElement!
    expect(within(liveNames).getAllByRole('listitem').map((item) => item.textContent))
      .toEqual(['Aaron James', 'Zoe Smith'])

    await user.click(screen.getByRole('link', { name: 'Admin preview' }))
    await user.click(screen.getByRole('button', { name: 'Close nomination intake' }))
    await user.click(screen.getByRole('link', { name: 'Voter preview' }))
    expect(screen.getByRole('region', { name: 'Published nomination list' })).toHaveTextContent('Aaron James')
    await user.click(screen.getByRole('link', { name: 'Admin preview' }))
    await user.click(screen.getByRole('button', { name: 'Hide published nomination list' }))
    await user.click(screen.getByRole('link', { name: 'Presentation preview' }))
    expect(screen.queryByText('Aaron James')).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Admin preview' }))
    await user.click(screen.getByRole('button', { name: 'Confirm nominee roster' }))
    await user.click(screen.getByRole('button', { name: 'Publish nomination list' }))
    await user.click(screen.getByRole('button', { name: 'Create first voting poll' }))
    await user.click(screen.getByRole('button', { name: 'Open voting poll' }))

    await user.click(screen.getByRole('link', { name: 'Presentation preview' }))
    expect(screen.queryByText('Aaron James')).not.toBeInTheDocument()
    expect(screen.queryByText('Zoe Smith')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Please follow the meeting instructions.' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Admin preview' }))
    await user.click(screen.getByRole('button', { name: 'Show aggregate results' }))
    await user.click(screen.getByRole('link', { name: 'Voter preview' }))
    const aaronRadio = screen.getByRole('radio', { name: 'Aaron James' })
    const zoeRadio = screen.getByRole('radio', { name: 'Zoe Smith' })
    aaronRadio.focus()
    await user.keyboard(' ')
    zoeRadio.focus()
    await user.keyboard(' ')
    expect(screen.getByRole('radio', { name: 'Zoe Smith' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Aaron James' })).not.toBeChecked()
    aaronRadio.focus()
    await user.keyboard(' ')
    const reviewBallot = screen.getByRole('button', { name: 'Review ballot' })
    reviewBallot.focus()
    await user.keyboard('{Enter}')
    const confirmBallot = screen.getByRole('button', { name: 'Confirm and submit ballot' })
    confirmBallot.focus()
    await user.keyboard('{Enter}')

    await user.click(screen.getByRole('link', { name: 'Presentation preview' }))
    expect(screen.getByRole('list', { name: 'Aggregate candidate results' })).toHaveTextContent('Aaron James')
    expect(screen.getByText(/1 vote · 100%/)).toBeInTheDocument()
    expect(screen.queryByText('ballots cast in the current poll')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Admin preview' }))
    await user.click(screen.getByRole('button', { name: 'Show ballots-cast participation' }))
    await user.click(screen.getByRole('link', { name: 'Presentation preview' }))
    expect(screen.getByText('1', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('ballots cast in the current poll')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/eligible voters|voterId|participantId|submitted by|ballot-to-voter/i)
  })

  it('keeps the active M4 session independent from another viewed position in the same term', async () => {
    const user = userEvent.setup()
    renderRoutes()

    await user.click(screen.getByRole('button', { name: 'Create nomination intake' }))
    await user.click(screen.getByRole('button', { name: 'Open nomination intake' }))

    const position = screen.getByRole('combobox', { name: 'Position' })
    await user.click(position)
    await user.click(await screen.findByRole('option', { name: 'Secretary' }))
    expect(screen.getByText('Church Elder · Nomination Poll 2 · Open')).toBeInTheDocument()

    await user.click(position)
    await user.click(await screen.findByRole('option', { name: 'Church Elder' }))
    await user.click(screen.getByRole('button', { name: 'Close nomination intake' }))
    await user.click(position)
    await user.click(await screen.findByRole('option', { name: 'Secretary' }))
    expect(screen.getByText('No active participant session')).toBeInTheDocument()
  })
})
