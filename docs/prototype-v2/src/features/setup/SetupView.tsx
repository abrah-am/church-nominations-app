import { useEffect, useState } from 'react'
import { usePrototypeState } from '../../state/StateProvider'
import StatusBadge from '../../components/StatusBadge'
import { getCurrentCandidateStatus } from '../../model'

export default function SetupView({ view = 'term' }: { view?: 'term' | 'churches' | 'terms' }) {
  const { state, selectChurch, selectTerm, setPosition, addChurch, updateChurch, addTerm, updateTerm, addDepartment, updateDepartment, addPosition, updatePositionDetails } = usePrototypeState()
  const churchId = state.selectedChurchId
  const termId = state.selectedTermId
  const church = state.churches.find((item) => item.id === churchId)
  const terms = state.terms.filter((term) => term.churchId === churchId)
  const term = terms.find((item) => item.id === termId)
  const readOnly = term?.status === 'Historical'
  const departments = state.departments.filter((department) => department.termId === term?.id).sort((a, b) => a.order - b.order)
  const [notice, setNotice] = useState('')
  const [openDepartmentId, setOpenDepartmentId] = useState(departments[0]?.id ?? '')
  const [departmentEditorId, setDepartmentEditorId] = useState('')
  const [departmentName, setDepartmentName] = useState('')
  const [positionEditor, setPositionEditor] = useState<{ departmentId: string; positionId?: string } | null>(null)
  const [positionName, setPositionName] = useState('')
  const [openings, setOpenings] = useState('1')
  const [churchName, setChurchName] = useState('')
  const [churchAddress, setChurchAddress] = useState('')
  const [termName, setTermName] = useState('')
  const [termYear, setTermYear] = useState(String(new Date().getFullYear() + 1))
  const [editingId, setEditingId] = useState('')

  useEffect(() => { setOpenDepartmentId(departments[0]?.id ?? '') }, [termId])

  const showPositionEditor = (departmentId: string, positionId?: string) => {
    const position = state.positions.find((item) => item.id === positionId)
    setPositionName(position?.name ?? '')
    setOpenings(String(position?.openings ?? 1))
    setPositionEditor({ departmentId, positionId })
  }
  const savePosition = () => {
    if (!term || !positionEditor || !positionName.trim()) return
    const count = Math.max(1, Number(openings) || 1)
    if (positionEditor.positionId) updatePositionDetails(positionEditor.positionId, { name: positionName.trim(), openings: count, departmentId: positionEditor.departmentId })
    else addPosition({ termId: term.id, departmentId: positionEditor.departmentId, name: positionName.trim(), openings: count })
    setPositionEditor(null)
    setNotice(positionEditor.positionId ? 'Position updated. Existing election records were preserved.' : 'Position added.')
  }
  const editChurch = () => {
    if (!church || !churchName.trim()) return
    updateChurch(church.id, { name: churchName.trim(), address: churchAddress.trim() })
    setEditingId('')
    setNotice('Church details updated.')
  }
  const saveTerm = () => {
    const year = Number(termYear)
    if (!churchId || !termName.trim() || !Number.isInteger(year) || year < 1900) { setNotice('Enter a term name and valid year.'); return }
    if (editingId && term) {
      updateTerm(term.id, { name: termName.trim(), year })
      setNotice('Election term updated.')
    } else {
      addTerm({ churchId, name: termName.trim(), year, status: 'Preparing' })
      setNotice('Election term created. Add departments and positions in the term workspace.')
    }
    setEditingId('')
    setTermName('')
  }
  const createTerm = () => {
    const year = Number(termYear)
    if (!churchId || !termName.trim() || !Number.isInteger(year) || year < 1900) { setNotice('Enter a term name and valid year.'); return }
    addTerm({ churchId, name: termName.trim(), year, status: 'Preparing' })
    setTermName('')
    setNotice('Election term created. Add departments and positions in the term workspace.')
  }

  if (view === 'churches') return <section className="management-view">
    <div className="page-heading"><div><p className="eyebrow">Church settings</p><h1>Churches</h1><p className="lead-copy">Register a church or update its contact details.</p></div><a className="btn btn-outline-primary" href="/admin/setup">Back to term workspace</a></div>
    {notice && <div className="alert alert-info py-2" role="status">{notice}</div>}
    <label className="field-label management-current">Selected church<select className="form-select" value={churchId} onChange={(event) => selectChurch(event.target.value)}>{state.churches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    {church && <section className="management-form"><h2>Edit church</h2><label className="field-label">Church name<input className="form-control" value={editingId === church.id ? churchName : church.name} onChange={(event) => { setEditingId(church.id); setChurchName(event.target.value); setChurchAddress(church.address) }} /></label><label className="field-label">Address<input className="form-control" value={editingId === church.id ? churchAddress : church.address} onChange={(event) => { setEditingId(church.id); setChurchName(church.name); setChurchAddress(event.target.value) }} /></label><button className="btn btn-primary" onClick={editChurch}>Save church</button></section>}
    <section className="management-form"><h2>Register another church</h2><label className="field-label">Church name<input className="form-control" value={churchName} onChange={(event) => setChurchName(event.target.value)} placeholder="Church name" /></label><label className="field-label">Address<input className="form-control" value={churchAddress} onChange={(event) => setChurchAddress(event.target.value)} placeholder="Street, city, region" /></label><button className="btn btn-primary" disabled={!churchName.trim()} onClick={() => { const newId = addChurch({ name: churchName.trim(), address: churchAddress.trim() }); setChurchName(''); setChurchAddress(''); setNotice(`Church registered (${newId.slice(0, 8)}). Create a term to begin.`) }}>Register church</button></section>
  </section>

  if (view === 'terms') return <section className="management-view">
    <div className="page-heading"><div><p className="eyebrow">Term management</p><h1>Election terms</h1><p className="lead-copy">Review historical terms or manage the selected church’s terms.</p></div><a className="btn btn-outline-primary" href="/admin/setup">Back to term workspace</a></div>
    {notice && <div className="alert alert-info py-2" role="status">{notice}</div>}
    <label className="field-label management-current">Church<select className="form-select" value={churchId} onChange={(event) => selectChurch(event.target.value)}>{state.churches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <div className="term-list management-term-list">{terms.map((item) => <div className="term-management-row" key={item.id}><button className="term-option" onClick={() => selectTerm(item.id)}><span><strong>{item.name}</strong><small>{item.year}</small></span><StatusBadge status={item.status} /></button>{item.status !== 'Historical' && <button className="btn btn-sm btn-outline-secondary" onClick={() => { selectTerm(item.id); setEditingId(item.id); setTermName(item.name); setTermYear(String(item.year)) }}>Edit</button>}</div>)}</div>
    {editingId && term?.id === editingId && <section className="management-form"><h2>Edit {term.name}</h2><label className="field-label">Term name<input className="form-control" value={termName} onChange={(event) => setTermName(event.target.value)} /></label><label className="field-label">Year<input className="form-control" type="number" min="1900" value={termYear} onChange={(event) => setTermYear(event.target.value)} /></label><button className="btn btn-primary" onClick={saveTerm}>Save term</button><button className="btn btn-outline-secondary" onClick={() => setEditingId('')}>Cancel</button></section>}
    <section className="management-form"><h2>Create a term</h2><label className="field-label">Term name<input className="form-control" value={editingId ? '' : termName} onChange={(event) => setTermName(event.target.value)} placeholder="e.g. 2028 Church Board" /></label><label className="field-label">Year<input className="form-control" type="number" min="1900" value={termYear} onChange={(event) => setTermYear(event.target.value)} /></label><button className="btn btn-primary" onClick={createTerm}>Create term</button><p className="help-text">Departments and positions are created manually for each term. Nothing is copied from a previous term.</p></section>
  </section>

  return <section>
    <div className="page-heading"><div><p className="eyebrow">Election term workspace</p><h1>{term?.name ?? 'Select a term'}</h1><p className="lead-copy">{church?.name ?? 'Select a church'} · {term?.status === 'Historical' ? 'Historical term · read-only' : 'Prepare departments and positions, then open a position’s election workspace.'}</p></div><StatusBadge status={term?.status ?? 'Preparing'} /></div>
    {notice && <div role="status" className="alert alert-info py-2">{notice}</div>}
    <div className="term-context-bar">
      <label className="field-label">Church<select className="form-select" value={churchId} onChange={(event) => selectChurch(event.target.value)}>{state.churches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="field-label">Election term<select className="form-select" value={term?.id ?? ''} onChange={(event) => selectTerm(event.target.value)}>{terms.map((item) => <option key={item.id} value={item.id}>{item.name}{item.status === 'Historical' ? ' · Historical' : ''}</option>)}</select></label>
      <a className="management-link" href="/admin/setup/churches">Church settings</a><a className="management-link" href="/admin/setup/terms">Manage terms</a>
    </div>
    {readOnly && <div className="private-strip">Historical terms are read-only. Polls, results, candidates, and decisions remain available for review.</div>}
    <div className="term-summary-strip"><strong>{departments.length}</strong><span>departments</span><strong>{state.positions.filter((position) => position.termId === term?.id).length}</strong><span>positions</span><span className="ms-auto">{state.positions.filter((position) => position.termId === term?.id).reduce((count, item) => count + item.candidates.filter((candidate) => getCurrentCandidateStatus(item, candidate.id) === 'Elected').length, 0)} elected</span></div>

    <section className="term-departments">
      <div className="section-heading"><div><p className="eyebrow">Department structure</p><h2>Departments and positions</h2></div>{!readOnly && <button className="btn btn-outline-primary" onClick={() => { setDepartmentEditorId('new'); setDepartmentName('') }}>Add department</button>}</div>
      {departmentEditorId && <form className="focused-editor" onSubmit={(event) => { event.preventDefault(); if (!term || !departmentName.trim()) return; if (departmentEditorId === 'new') addDepartment({ termId: term.id, name: departmentName.trim() }); else updateDepartment(departmentEditorId, { name: departmentName.trim() }); setDepartmentEditorId(''); setNotice('Department saved.') }}><label className="field-label">Department name<input className="form-control" autoFocus value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} /></label><button className="btn btn-primary">Save department</button><button type="button" className="btn btn-outline-secondary" onClick={() => setDepartmentEditorId('')}>Cancel</button></form>}
      {departments.map((department) => {
        const positions = state.positions.filter((position) => position.departmentId === department.id)
        const expanded = openDepartmentId === department.id
        return <section className="department-accordion" key={department.id}>
          <div className="department-heading-row"><button className="department-toggle" aria-expanded={expanded} aria-controls={`department-${department.id}`} onClick={() => setOpenDepartmentId(expanded ? '' : department.id)}><span className="disclosure-mark" aria-hidden="true">{expanded ? '−' : '+'}</span><span><strong>{department.name}</strong><small>{positions.length} positions · {positions.reduce((count, item) => count + item.candidates.filter((candidate) => getCurrentCandidateStatus(item, candidate.id) === 'Elected').length, 0)} elected</small></span></button>{!readOnly && <details className="action-menu"><summary aria-label={`More actions for ${department.name}`}>More actions</summary><div className="action-menu-panel"><button onClick={() => { setDepartmentEditorId(department.id); setDepartmentName(department.name) }}>Edit department</button></div></details>}</div>
          {expanded && <div id={`department-${department.id}`} className="department-content"><div className="position-list">{positions.map((position) => {
            const latest = position.polls.at(-1)
            const elected = position.candidates.filter((candidate) => getCurrentCandidateStatus(position, candidate.id) === 'Elected').map((candidate) => candidate.name)
            return <div className="position-row-wrap" key={position.id}><a className="position-row-link" href="/admin" onClick={() => setPosition(position.id)}><span><strong>{position.name}</strong><small>{position.openings} opening{position.openings === 1 ? '' : 's'} · {latest ? `Poll ${latest.number} ${latest.status.toLowerCase()}` : position.phase === 'intake' ? 'Ready for nominations' : position.phase}</small>{elected.length > 0 && <small>Elected: {elected.join(', ')}</small>}</span><span className="position-primary-action">Open election <span aria-hidden="true">→</span></span></a>{!readOnly && <details className="action-menu position-action-menu"><summary aria-label={`More actions for ${position.name}`}>More actions</summary><div className="action-menu-panel"><button onClick={() => showPositionEditor(department.id, position.id)}>Edit position</button></div></details>}{positionEditor?.positionId === position.id && <form className="focused-editor position-focused-editor" onSubmit={(event) => { event.preventDefault(); savePosition() }}><label className="field-label">Position name<input className="form-control" autoFocus value={positionName} onChange={(event) => setPositionName(event.target.value)} /></label><label className="field-label">Openings<input className="form-control" type="number" min="1" value={openings} onChange={(event) => setOpenings(event.target.value)} /></label><label className="field-label">Department<select className="form-select" value={positionEditor.departmentId} onChange={(event) => setPositionEditor({ ...positionEditor, departmentId: event.target.value })}>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="btn btn-primary">Save position</button><button type="button" className="btn btn-outline-secondary" onClick={() => setPositionEditor(null)}>Cancel</button></form>}</div>
          })}</div>{!readOnly && <button className="btn btn-sm btn-outline-primary add-position-action" onClick={() => showPositionEditor(department.id)}>Add position</button>}{positionEditor?.departmentId === department.id && !positionEditor.positionId && <form className="focused-editor position-focused-editor" onSubmit={(event) => { event.preventDefault(); savePosition() }}><label className="field-label">Position name<input className="form-control" autoFocus value={positionName} onChange={(event) => setPositionName(event.target.value)} /></label><label className="field-label">Openings<input className="form-control" type="number" min="1" value={openings} onChange={(event) => setOpenings(event.target.value)} /></label><button className="btn btn-primary">Add position</button><button type="button" className="btn btn-outline-secondary" onClick={() => setPositionEditor(null)}>Cancel</button></form>}</div>}
        </section>
      })}
      {term && departments.length === 0 && <p className="empty-copy">No departments yet. Add one to organize positions for this term.</p>}
    </section>
  </section>
}
