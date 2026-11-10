import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../app/App'

describe('admin viewing context selectors', () => {
  it('clears dependent choices when a parent selection changes', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    const church = screen.getByRole('combobox', { name: 'Church' })
    const term = screen.getByRole('combobox', { name: 'Term' })
    const department = screen.getByRole('combobox', { name: 'Department' })
    const position = screen.getByRole('combobox', { name: 'Position' })

    expect(church).toHaveTextContent('Riverside Seventh-day Adventist Church')
    expect(term).toHaveTextContent('2027 Church Board')
    expect(department).toHaveTextContent('Ministry')
    expect(position).toHaveTextContent('Church Elder')

    await user.click(church)
    await user.click(
      await screen.findByRole('option', {
        name: 'Cedar Grove Community Church',
      }),
    )
    expect(term).toHaveTextContent('Select a term')
    expect(department).toHaveTextContent('Select a department')
    expect(position).toHaveTextContent('Select a position')

    await user.click(term)
    await user.click(
      await screen.findByRole('option', { name: '2027 Church Board' }),
    )
    expect(department).toHaveTextContent('Select a department')
    expect(position).toHaveTextContent('Select a position')

    await user.click(department)
    await user.click(await screen.findByRole('option', { name: 'Worship' }))
    expect(position).toHaveTextContent('Select a position')

    await user.click(position)
    expect(
      await screen.findByRole('option', { name: 'Treasurer' }),
    ).toBeInTheDocument()
  })

  it('keeps context changes viewing-only and does not expose election/session actions', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    const department = screen.getByRole('combobox', { name: 'Department' })
    await user.click(department)
    await user.click(await screen.findByRole('option', { name: 'Worship' }))

    expect(screen.getByText(/context changes only what is viewed/i)).toBeInTheDocument()
    expect(screen.queryByText(/active participant session/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /activate|open session|record|share/i })).toBeNull()
    expect(screen.queryByText(/poll history|ballots cast|candidate results/i)).toBeNull()
  })
})
