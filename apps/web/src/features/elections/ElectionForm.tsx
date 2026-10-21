import { FormEvent, useState } from 'react';
import { Election, ElectionConfiguration } from '../../api/elections';

type FormPosition = { id?: string; name: string; openingCount: string };

export type ElectionFormProps = {
  initialElection: Election | null;
  isSaving: boolean;
  onSave: (configuration: ElectionConfiguration) => void;
};

export function ElectionForm({ initialElection, isSaving, onSave }: ElectionFormProps) {
  const [departmentName, setDepartmentName] = useState(initialElection?.departmentName ?? '');
  const [positions, setPositions] = useState<FormPosition[]>(initialElection
    ? [...initialElection.positions].sort((a, b) => a.sequence - b.sequence).map(({ id, name, openingCount }) => ({ id, name, openingCount: String(openingCount) }))
    : [{ name: '', openingCount: '1' }]);

  function updatePosition(index: number, field: keyof FormPosition, value: string) {
    setPositions((current) => current.map((position, positionIndex) => positionIndex === index ? { ...position, [field]: value } : position));
  }

  function movePosition(index: number, offset: number) {
    setPositions((current) => {
      const next = [...current];
      const target = index + offset;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      departmentName: departmentName.trim(),
      positions: positions.map((position) => ({
        ...(position.id !== undefined ? { id: position.id } : {}),
        name: position.name.trim(),
        openingCount: Number(position.openingCount),
      })),
    });
  }

  return (
    <form className="election-form" onSubmit={submit}>
      <div className="form-intro">
        <p className="eyebrow">Configuration</p>
        <h2>{initialElection ? 'Update election setup' : 'Configure an election'}</h2>
        <p>Set the department and add positions in the order they will be managed.</p>
      </div>
      <label htmlFor="department-name">Department name</label>
      <input id="department-name" value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} required maxLength={120} />
      <div className="positions-form-heading">
        <div><h3>Positions</h3><p>The first position is first to manage.</p></div>
      </div>
      <ol className="position-editor-list">
        {positions.map((position, index) => (
          <li className="position-editor" key={index}>
            <div className="editor-title"><span className="sequence-number">{index + 1}</span><strong>Position {index + 1}</strong></div>
            <div className="editor-fields">
              <div className="field-group">
                <label htmlFor={`position-name-${index}`}>Position name</label>
                <input id={`position-name-${index}`} value={position.name} onChange={(event) => updatePosition(index, 'name', event.target.value)} required maxLength={120} />
              </div>
              <div className="field-group opening-field">
                <label htmlFor={`opening-count-${index}`}>Openings</label>
                <input id={`opening-count-${index}`} type="number" min="1" step="1" inputMode="numeric" value={position.openingCount} onChange={(event) => updatePosition(index, 'openingCount', event.target.value)} required />
              </div>
            </div>
            <div className="position-controls">
              <button type="button" className="icon-button" aria-label={`Move ${position.name || `position ${index + 1}`} up`} disabled={index === 0} onClick={() => movePosition(index, -1)}>↑</button>
              <button type="button" className="icon-button" aria-label={`Move ${position.name || `position ${index + 1}`} down`} disabled={index === positions.length - 1} onClick={() => movePosition(index, 1)}>↓</button>
              <button type="button" className="remove-button" disabled={positions.length === 1} onClick={() => setPositions((current) => current.filter((_, positionIndex) => positionIndex !== index))}>Remove</button>
            </div>
          </li>
        ))}
      </ol>
      <button className="add-button" type="button" onClick={() => setPositions((current) => [...current, { name: '', openingCount: '1' }])}>＋ <span>Add position</span></button>
      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : initialElection ? 'Save changes' : 'Create election'}</button>
      </div>
    </form>
  );
}