import { FormEvent, useState } from 'react';
import { AnnualBoard, BoardSession } from '../../api/boards';

export type BoardScreen = 'list' | 'create' | 'detail';

export type BoardsWorkspaceProps = {
  boards: AnnualBoard[];
  selectedBoard: AnnualBoard | null;
  selectedSessionId: string | null;
  attendanceIds: string[];
  boardScreen: BoardScreen;
  isLoading: boolean;
  isSaving: boolean;
  onCreate: () => void;
  onOpen: (board: AnnualBoard) => void;
  onBack: () => void;
  onSaveBoard: (year: number, memberNames: string[]) => void;
  onSaveSession: (sessionDate: string) => void;
  onSelectSession: (session: BoardSession) => void;
  onToggleAttendance: (memberId: string, checked: boolean) => void;
  onSaveAttendance: () => void;
};

export function BoardsWorkspace({
  boards,
  selectedBoard,
  selectedSessionId,
  attendanceIds,
  boardScreen,
  isLoading,
  isSaving,
  onCreate,
  onOpen,
  onBack,
  onSaveBoard,
  onSaveSession,
  onSelectSession,
  onToggleAttendance,
  onSaveAttendance,
}: BoardsWorkspaceProps) {
  const selectedSession = selectedBoard?.sessions.find((session) => session.id === selectedSessionId) ?? null;

  return (
    <>
      {boardScreen === 'list' && (
        <section className="election-section" aria-labelledby="board-list-title">
          <div className="section-heading">
            <div><h2 id="board-list-title">Annual Boards</h2><p>{boards.length} {boards.length === 1 ? 'board' : 'boards'}</p></div>
            <button className="secondary-button" type="button" onClick={onCreate}>＋ <span>Create board</span></button>
          </div>
          {isLoading ? <p className="state-message" role="status">Loading annual boards…</p> : boards.length === 0 ? (
            <div className="empty-state">
              <span className="empty-rule" aria-hidden="true" />
              <h3>No annual boards yet</h3>
              <p>Create a board roster for a year, then record dated meeting attendance.</p>
              <button className="secondary-button" type="button" onClick={onCreate}>Create first board</button>
            </div>
          ) : (
            <ul className="election-list">
              {boards.map((board) => (
                <li key={board.id}>
                  <button className="election-row" type="button" onClick={() => onOpen(board)}>
                    <span className="election-row-copy">
                      <strong>{board.year} Annual Board</strong>
                      <span>{board.members.length} {board.members.length === 1 ? 'member' : 'members'} · {board.sessions.length} {board.sessions.length === 1 ? 'session' : 'sessions'}</span>
                    </span>
                    <span className="row-status">Roster</span>
                    <span className="row-arrow" aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {boardScreen === 'create' && (
        <section className="form-section">
          <button className="back-button" type="button" onClick={onBack}>← <span>All annual boards</span></button>
          <BoardCreateForm isSaving={isSaving} onSave={onSaveBoard} />
        </section>
      )}

      {boardScreen === 'detail' && (
        <section className="detail-section" aria-label="Annual board details">
          <div className="detail-actions">
            <button className="back-button" type="button" onClick={onBack}>← <span>All annual boards</span></button>
          </div>
          {isLoading || !selectedBoard ? <p className="state-message" role="status">Loading board…</p> : (
            <>
              <div className="row row-cols-1 row-cols-sm-3 g-3 board-summary">
                <div className="col"><div className="board-summary-item"><span className="summary-label">Board year</span><strong>{selectedBoard.year}</strong></div></div>
                <div className="col"><div className="board-summary-item"><span className="summary-label">Roster</span><strong>{selectedBoard.members.length} {selectedBoard.members.length === 1 ? 'member' : 'members'}</strong></div></div>
                <div className="col"><div className="board-summary-item"><span className="summary-label">Recorded sessions</span><strong>{selectedBoard.sessions.length}</strong></div></div>
              </div>
              <div className="row g-4 board-detail-grid">
                <div className="col-12 col-lg-6">
                  <div className="section-heading position-heading"><div><h2>Board roster</h2><p>Names only; no member credentials are collected.</p></div></div>
                  <ul className="member-list">
                    {selectedBoard.members.map((member) => <li key={member.id}>{member.name}</li>)}
                  </ul>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="section-heading position-heading"><div><h2>Sessions</h2><p>Record meeting dates and attendance.</p></div></div>
                  <form className="session-create" onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const sessionDate = String(formData.get('sessionDate') ?? '');
                    if (sessionDate) {
                      onSaveSession(sessionDate);
                      event.currentTarget.reset();
                    }
                  }}>
                    <label htmlFor="board-session-date">Session date</label>
                    <div className="session-date-controls">
                      <input id="board-session-date" name="sessionDate" type="date" required />
                      <button className="secondary-button" type="submit" disabled={isSaving}>{isSaving ? 'Adding…' : 'Add session'}</button>
                    </div>
                  </form>
                  {selectedBoard.sessions.length > 0 && (
                    <ul className="session-list list-group list-group-flush" aria-label="Board sessions">
                      {selectedBoard.sessions.map((session) => (
                        <li key={session.id}>
                          <button className="list-group-item list-group-item-action" type="button" aria-pressed={session.id === selectedSessionId} disabled={isSaving} onClick={() => onSelectSession(session)}>
                            <span>{session.sessionDate}</span>
                            <span>{session.attendedMemberIds.length} attended</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {selectedSession ? (
                <form className="attendance-editor" onSubmit={(event) => { event.preventDefault(); onSaveAttendance(); }}>
                  <div className="section-heading"><div><h2>Attendance for {selectedSession.sessionDate}</h2><p>Mark who attended this session. This is not a ballot or vote.</p></div></div>
                  <ul className="attendance-list list-group list-group-flush">
                    {selectedBoard.members.map((member) => (
                      <li className="list-group-item" key={member.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={attendanceIds.includes(member.id)}
                            disabled={isSaving}
                            onChange={(event) => onToggleAttendance(member.id, event.target.checked)}
                          />
                          <span>{member.name}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="form-actions"><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save attendance'}</button></div>
                </form>
              ) : <p className="state-message">Add a session to record attendance.</p>}
            </>
          )}
        </section>
      )}
    </>
  );
}

export type BoardCreateFormProps = {
  isSaving: boolean;
  onSave: (year: number, memberNames: string[]) => void;
};

export function BoardCreateForm({ isSaving, onSave }: BoardCreateFormProps) {
  const [memberNames, setMemberNames] = useState(['']);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const year = Number(formData.get('year'));
    const names = memberNames.map((name) => name.trim());
    if (names.length > 0 && names.every(Boolean)) onSave(year, names);
  }

  return (
    <form className="election-form" onSubmit={submit}>
      <div className="form-intro">
        <p className="eyebrow">Annual roster</p>
        <h2>Create an annual board</h2>
        <p>Add the board year and the names of its members. Member passwords are not requested.</p>
      </div>
      <label htmlFor="board-year">Year</label>
      <input id="board-year" name="year" type="number" min="1900" max="9999" defaultValue={new Date().getFullYear()} required />
      <div className="positions-form-heading"><div><h3>Members</h3><p>At least one member is required.</p></div></div>
      <ol className="member-editor-list">
        {memberNames.map((name, index) => (
          <li className="member-editor" key={index}>
            <div className="field-group">
              <label htmlFor={`board-member-${index}`}>Member {index + 1} name</label>
              <input id={`board-member-${index}`} value={name} onChange={(event) => setMemberNames((current) => current.map((member, memberIndex) => memberIndex === index ? event.target.value : member))} required maxLength={160} />
            </div>
            <button className="remove-button" type="button" disabled={memberNames.length === 1} onClick={() => setMemberNames((current) => current.filter((_, memberIndex) => memberIndex !== index))}>Remove</button>
          </li>
        ))}
      </ol>
      <button className="add-button" type="button" onClick={() => setMemberNames((current) => [...current, ''])}>＋ <span>Add member</span></button>
      <div className="form-actions"><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Creating…' : 'Create board'}</button></div>
    </form>
  );
}