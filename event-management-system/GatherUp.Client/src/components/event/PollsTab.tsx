import { useState } from 'react'
import { eventsApi } from '../../api/events'
import type { GatherEvent, Poll, PollQuestion } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { useAuth } from '../../context/AuthContext'

interface Props { event: GatherEvent; onReload: () => void }

interface QuestionForm {
  questionText: string
  options: string[]
}

export function PollsTab({ event, onReload }: Props) {
  const { canManage, username } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [results, setResults] = useState<Record<string, Record<string, number>>>({})
  const [pending, setPending] = useState<Record<string, string>>({})
  const [voteLoading, setVoteLoading] = useState<Record<string, boolean>>({})
  const [voteMsg, setVoteMsg] = useState<Record<string, { ok: boolean; text: string }>>({})
  const [voted, setVoted] = useState<Record<string, string>>({})
  const [pollForm, setPollForm] = useState({
    title: '',
    description: '',
    closesAt: '',
    questions: [{ questionText: '', options: ['', ''] }] as QuestionForm[],
  })

  const polls: Poll[] = event.polls ?? []

  const currentParticipant = event.participants?.find(
    p =>
      p.name?.toLowerCase() === username?.toLowerCase() ||
      p.email?.toLowerCase() === username?.toLowerCase()
  )

  function isPollClosed(poll: Poll): boolean {
    if (!poll.closesAt) return false
    return new Date(poll.closesAt) < new Date()
  }

  function selectOption(pollId: string, questionId: string, opt: string) {
    const key = `${pollId}_${questionId}`
    setPending(prev => ({ ...prev, [key]: opt }))
    setVoteMsg(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  async function submitVote(pollId: string, questionId: string) {
    const key = `${pollId}_${questionId}`
    const answer = pending[key]
    if (!answer) return

    if (!currentParticipant) {
      setVoteMsg(prev => ({ ...prev, [key]: { ok: false, text: 'אינך רשום/ה כמשתתף/ת באירוע זה' } }))
      return
    }

    setVoteLoading(prev => ({ ...prev, [key]: true }))
    try {
      await eventsApi.vote(event.id, pollId, questionId, {
        participantId: currentParticipant.id,
        answer,
      })
      setVoted(prev => ({ ...prev, [key]: answer }))
      setVoteMsg(prev => ({ ...prev, [key]: { ok: true, text: `הצבעתך נרשמה: "${answer}"` } }))
      await loadResults(pollId, questionId)
      onReload()
    } catch (e) {
      setVoteMsg(prev => ({
        ...prev,
        [key]: { ok: false, text: e instanceof Error ? e.message : 'שגיאה בהצבעה' },
      }))
    } finally {
      setVoteLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  async function loadResults(pollId: string, questionId: string) {
    try {
      const res = await eventsApi.getResults(event.id, pollId, questionId)
      setResults(prev => ({ ...prev, [`${pollId}_${questionId}`]: res }))
    } catch { /* ignore */ }
  }

  function addQuestion() {
    setPollForm(f => ({ ...f, questions: [...f.questions, { questionText: '', options: ['', ''] }] }))
  }
  function updateQuestion(qi: number, value: string) {
    setPollForm(f => {
      const questions = [...f.questions]
      questions[qi] = { ...questions[qi], questionText: value }
      return { ...f, questions }
    })
  }
  function addOption(qi: number) {
    setPollForm(f => {
      const questions = [...f.questions]
      questions[qi] = { ...questions[qi], options: [...questions[qi].options, ''] }
      return { ...f, questions }
    })
  }
  function updateOption(qi: number, oi: number, value: string) {
    setPollForm(f => {
      const questions = [...f.questions]
      const options = [...questions[qi].options]
      options[oi] = value
      questions[qi] = { ...questions[qi], options }
      return { ...f, questions }
    })
  }

  async function handleCreate() {
    setCreateError('')
    setCreateLoading(true)
    try {
      await eventsApi.createPoll(event.id, {
        title: pollForm.title,
        description: pollForm.description,
        closesAt: pollForm.closesAt ? new Date(pollForm.closesAt).toISOString() : undefined,
        questions: pollForm.questions
          .filter(q => q.questionText.trim())
          .map(q => ({
            questionText: q.questionText,
            options: q.options.filter(o => o.trim()),
          })) as never,
      })
      setShowCreate(false)
      setPollForm({ title: '', description: '', closesAt: '', questions: [{ questionText: '', options: ['', ''] }] })
      onReload()
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setCreateLoading(false)
    }
  }

  function renderResults(q: PollQuestion, res: Record<string, number> | undefined, selected?: string) {
    return (
      <div>
        {q.options.map(opt => {
          const count = res?.[opt] ?? 0
          const total = res ? Object.values(res).reduce((a, b) => a + b, 0) : 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={opt} className="poll-bar-row">
              <span className="poll-bar-label">{opt === selected ? `${opt} ✓` : opt}</span>
              <div className="poll-bar-track">
                <div className={`poll-bar-fill${opt === selected ? ' poll-bar-fill--selected' : ''}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <span className="poll-bar-count">{res ? `${count} (${pct}%)` : '—'}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="card-title">סקרים</h2>
        {canManage && <Button onClick={() => setShowCreate(true)}>סקר חדש</Button>}
      </div>

      {!canManage && !currentParticipant && (
        <div className="alert alert--warning mb-4">
          אינך רשום/ה כמשתתף/ת באירוע זה — לא ניתן להצביע
        </div>
      )}

      {polls.length === 0 ? (
        <Card><div className="empty-state">אין סקרים עדיין</div></Card>
      ) : (
        <div className="poll-list">
          {polls.map(poll => {
            const closed = isPollClosed(poll)
            return (
              <Card key={poll.id} className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title">{poll.title}</h3>
                  <Badge variant={closed ? 'closed' : 'open'}>{closed ? 'סגור' : 'פתוח'}</Badge>
                </div>
                {poll.description && <p className="text-sm text-muted mb-4">{poll.description}</p>}
                {poll.closesAt && (
                  <p className="text-sm text-muted mb-4">
                    {closed ? 'נסגר ב' : 'נסגר ב'}: {new Date(poll.closesAt).toLocaleDateString('he-IL')}
                  </p>
                )}

                <div className="space-y-4">
                  {poll.questions?.map((q: PollQuestion) => {
                    const key = `${poll.id}_${q.id}`
                    const selected = pending[key]
                    const msg = voteMsg[key]
                    const isLoading = voteLoading[key]
                    const res = results[key]
                    const alreadyVoted = voted[key]

                    return (
                      <div key={q.id} className="poll-question">
                        <p className="poll-question-title">{q.questionText}</p>

                        {closed ? (
                          <div>
                            {renderResults(q, res)}
                            {!res && (
                              <button type="button" className="link-btn mt-4" onClick={() => loadResults(poll.id, q.id)}>
                                טען תוצאות
                              </button>
                            )}
                          </div>
                        ) : alreadyVoted ? (
                          <div>
                            <div className="poll-voted-tag">הצבעת: "{alreadyVoted}"</div>
                            {res && renderResults(q, res, alreadyVoted)}
                          </div>
                        ) : (
                          <div>
                            <div className="poll-options">
                              {q.options.map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => selectOption(poll.id, q.id, opt)}
                                  className={`poll-option${selected === opt ? ' poll-option--selected' : ''}`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              {currentParticipant && (
                                <Button
                                  onClick={() => submitVote(poll.id, q.id)}
                                  loading={isLoading}
                                  disabled={!selected || isLoading}
                                  variant={selected ? 'primary' : 'secondary'}
                                >
                                  שלח הצבעה
                                </Button>
                              )}
                              {msg && (
                                <span className={`text-sm ${msg.ok ? 'text-success' : 'text-danger'}`}>
                                  {msg.text}
                                </span>
                              )}
                            </div>
                            {canManage && !res && (
                              <button type="button" className="link-btn mt-4" onClick={() => loadResults(poll.id, q.id)}>
                                הצג תוצאות
                              </button>
                            )}
                            {canManage && !alreadyVoted && res && renderResults(q, res)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {showCreate && (
        <Modal title="סקר חדש" onClose={() => setShowCreate(false)} size="lg">
          <div className="form-stack">
            <Input label="כותרת הסקר *" value={pollForm.title}
              onChange={e => setPollForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            <Input label="תיאור" value={pollForm.description}
              onChange={e => setPollForm(f => ({ ...f, description: e.target.value }))} />
            <Input label="תאריך סגירה" type="date" value={pollForm.closesAt}
              onChange={e => setPollForm(f => ({ ...f, closesAt: e.target.value }))} />

            {pollForm.questions.map((q, qi) => (
              <div key={qi} className="poll-question">
                <Input label={`שאלה ${qi + 1}`} value={q.questionText}
                  onChange={e => updateQuestion(qi, e.target.value)} />
                <div className="form-stack mt-4">
                  {q.options.map((opt, oi) => (
                    <Input key={oi} placeholder={`אפשרות ${oi + 1}`} value={opt}
                      onChange={e => updateOption(qi, oi, e.target.value)} />
                  ))}
                </div>
                <button type="button" className="link-btn mt-4" onClick={() => addOption(qi)}>
                  הוסף אפשרות
                </button>
              </div>
            ))}

            <button type="button" className="link-btn" onClick={addQuestion}>
              הוסף שאלה
            </button>

            {createError && <div className="alert alert--error">{createError}</div>}
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>ביטול</Button>
              <Button onClick={handleCreate} loading={createLoading} disabled={!pollForm.title.trim()}>
                צור סקר
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
