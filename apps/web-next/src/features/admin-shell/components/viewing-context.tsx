import {
  mockChurchContexts,
  type ViewingContextSelection,
} from '../../../data/mock-admin-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'

interface ViewingContextProps {
  selection: ViewingContextSelection
  onChange: (selection: ViewingContextSelection) => void
}

export function ViewingContext({ selection, onChange }: ViewingContextProps) {
  const church = mockChurchContexts.find((item) => item.id === selection.churchId)
  const term = church?.terms.find((item) => item.id === selection.termId)
  const department = term?.departments.find(
    (item) => item.id === selection.departmentId,
  )

  return (
    <section className="context-panel" aria-labelledby="context-heading">
      <div className="context-panel-heading">
        <h2 id="context-heading">Viewing context</h2>
        <p>Development mock context. Context changes only what is viewed.</p>
      </div>
      <div className="context-grid">
        <ContextSelect
          id="church-context"
          label="Church"
          value={selection.churchId}
          placeholder="Select a church"
          options={mockChurchContexts.map(({ id, label }) => ({ id, label }))}
          onValueChange={(churchId) =>
            onChange({
              churchId,
              termId: null,
              departmentId: null,
              positionId: null,
            })
          }
        />
        <ContextSelect
          id="term-context"
          label="Term"
          value={selection.termId}
          placeholder="Select a term"
          disabled={!church}
          options={church?.terms.map(({ id, label }) => ({ id, label })) ?? []}
          onValueChange={(termId) =>
            onChange({
              ...selection,
              termId,
              departmentId: null,
              positionId: null,
            })
          }
        />
        <ContextSelect
          id="department-context"
          label="Department"
          value={selection.departmentId}
          placeholder="Select a department"
          disabled={!term}
          options={
            term?.departments.map(({ id, label }) => ({ id, label })) ?? []
          }
          onValueChange={(departmentId) =>
            onChange({
              ...selection,
              departmentId,
              positionId: null,
            })
          }
        />
        <ContextSelect
          id="position-context"
          label="Position"
          value={selection.positionId}
          placeholder="Select a position"
          disabled={!department}
          options={
            department?.positions.map(({ id, label }) => ({ id, label })) ?? []
          }
          onValueChange={(positionId) =>
            onChange({ ...selection, positionId })
          }
        />
      </div>
    </section>
  )
}

interface ContextSelectProps {
  id: string
  label: string
  value: string | null
  placeholder: string
  disabled?: boolean
  options: { id: string; label: string }[]
  onValueChange: (value: string | null) => void
}

function ContextSelect({
  id,
  label,
  value,
  placeholder,
  disabled = false,
  options,
  onValueChange,
}: ContextSelectProps) {
  const labelId = `${id}-label`

  return (
    <div className="context-field">
      <span className="context-label" id={labelId}>
        {label}
      </span>
      <Select
        value={value}
        items={options.map((option) => ({
          value: option.id,
          label: option.label,
        }))}
        onValueChange={(nextValue) =>
          onValueChange(nextValue === null ? null : String(nextValue))
        }
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className="context-select-trigger"
          aria-labelledby={labelId}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
