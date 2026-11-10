export interface MockPositionContext {
  id: string
  label: string
}

export interface MockDepartmentContext {
  id: string
  label: string
  positions: MockPositionContext[]
}

export interface MockTermContext {
  id: string
  label: string
  departments: MockDepartmentContext[]
}

export interface MockChurchContext {
  id: string
  label: string
  terms: MockTermContext[]
}

export interface ViewingContextSelection {
  churchId: string | null
  termId: string | null
  departmentId: string | null
  positionId: string | null
}

/** Explicit local UI fixtures only; these are not API responses or election data. */
export const mockChurchContexts: MockChurchContext[] = [
  {
    id: 'church-riverside',
    label: 'Riverside Seventh-day Adventist Church',
    terms: [
      {
        id: 'term-riverside-2027',
        label: '2027 Church Board',
        departments: [
          {
            id: 'department-riverside-ministry',
            label: 'Ministry',
            positions: [
              { id: 'position-riverside-elder', label: 'Church Elder' },
              { id: 'position-riverside-secretary', label: 'Secretary' },
            ],
          },
          {
            id: 'department-riverside-worship',
            label: 'Worship',
            positions: [
              { id: 'position-riverside-treasurer', label: 'Treasurer' },
              { id: 'position-riverside-coordinator', label: 'Coordinator' },
            ],
          },
        ],
      },
      {
        id: 'term-riverside-2028',
        label: '2028 Church Board',
        departments: [
          {
            id: 'department-riverside-2028-ministry',
            label: 'Ministry',
            positions: [{ id: 'position-riverside-2028-elder', label: 'Church Elder' }],
          },
        ],
      },
    ],
  },
  {
    id: 'church-cedar-grove',
    label: 'Cedar Grove Community Church',
    terms: [
      {
        id: 'term-cedar-2027',
        label: '2027 Church Board',
        departments: [
          {
            id: 'department-cedar-outreach',
            label: 'Outreach',
            positions: [{ id: 'position-cedar-coordinator', label: 'Coordinator' }],
          },
          {
            id: 'department-cedar-worship',
            label: 'Worship',
            positions: [{ id: 'position-cedar-treasurer', label: 'Treasurer' }],
          },
        ],
      },
    ],
  },
]

export const initialViewingContext: ViewingContextSelection = {
  churchId: 'church-riverside',
  termId: 'term-riverside-2027',
  departmentId: 'department-riverside-ministry',
  positionId: 'position-riverside-elder',
}
