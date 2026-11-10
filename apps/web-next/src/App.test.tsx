import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
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

function renderRoutes(initialPath = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppRoutes />
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
  it('renders the shell-only position destination and approved app navigation', () => {
    renderRoutes()

    expect(
      screen.getByRole('heading', { name: 'Position workspace', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText(/shell-only placeholder/i)).toBeInTheDocument()

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
    expect(screen.getByText(/development mock context/i)).toBeInTheDocument()
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
