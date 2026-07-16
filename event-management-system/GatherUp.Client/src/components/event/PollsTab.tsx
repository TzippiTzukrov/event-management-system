import { useState } from 'react'
import { eventsApi } from '../../api/events'
import type { GatherEvent, Poll, PollQuestion } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { useAuth } from '../../context/AuthContext'

interface Props { event: GatherEvent; onReload: () => void }

// טיפוס עזר לטופס — ללא id (השרת מייצר אותו)
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

  // בחירות ממתינות: מפתח = `${pollId}_${questionId}`, ערך = האופציה שנבחרה
  const [pending, setPending] = useState<Record<string, string>>({})
  // loading per question
  const [voteLoading, setVoteLoading] = useState<Record<string, boolean>>({})
  // הודעה per question
  const [voteMsg, setVoteMsg] = useState<Record<string, { ok: boolean; text: string }>>({})
  // הצבעות שכבר נשלחו בהצלחה — נועל את השאלה מפני הצבעה חוזרת
  const [voted, setVoted] = useState<Record<string, string>>({})
  const [pollForm, setPollForm] = useState<{
    title: string
    description: string
    closesAt: string
    questions: QuestionForm[]
  }>({
    title: '',
    description: '',
    closesAt: '',
    questions: [{ questionText: '', options: ['', ''] }],
  })

  const polls: Poll[] = event.polls ?? []

  // המשתתף המחובר — לפי שם משתמש (name) או email
  const currentParticipant = event.participants?.find(
    p =>
      p.name?.toLowerCase() === username?.toLowerCase() ||
      p.email?.toLowerCase() === username?.toLowerCase()
  )

  // isClosed מחושב בקליינט כי השרת לא שולח אותו (XmlIgnore)
  function isPollClosed(poll: Poll): boolean {
    if (!poll.closesAt) return false
    return new Date(poll.closesAt) < new Date()
  }

  function selectOption(pollId: string, questionId: string, opt: string) {
    const key = `${pollId}_${questionId}`
    setPending(prev => ({ ...prev, [key]: opt }))
    // נקה הודעה קודמת בעת שינוי בחירה
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
      // סמן שהמשתתף כבר הצביע על שאלה זו — נועל מהצבעה חוזרת
      setVoted(prev => ({ ...prev, [key]: answer }))
      setVoteMsg(prev => ({ ...prev, [key]: { ok: true, text: `✓ הצבעתך נרשמה: "${answer}"` } }))
      // טען תוצאות אוטומטית אחרי הצבעה מוצלחת
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

  // ── Create poll form helpers ────────────────────────────
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">סקרים</h2>
        {canManage && <Button onClick={() => setShowCreate(true)}>+ סקר חדש</Button>}
      </div>

      {/* הודעה אם המשתמש לא משתתף */}
      {!canManage && !currentParticipant && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg px-4 py-3 mb-4">
          ⚠️ אינך רשום/ה כמשתתף/ת באירוע זה — לא ניתן להצביע
        </div>
      )}

      {polls.length === 0 ? (
        <Card className="p-10 text-center text-gray-400">אין סקרים עדיין</Card>
      ) : (
        <div className="space-y-4">
          {polls.map(poll => {
            const closed = isPollClosed(poll)
            return (
              <Card key={poll.id} className="p-5">
                {/* כותרת סקר */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{poll.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    closed ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                  }`}>
                    {closed ? 'סגור' : 'פתוח'}
                  </span>
                </div>
                {poll.description && <p className="text-sm text-gray-500 mb-3">{poll.description}</p>}
                {poll.closesAt && (
                  <p className="text-xs text-gray-400 mb-4">
                    {closed ? 'נסגר ב' : 'נסגר ב'}: {new Date(poll.closesAt).toLocaleDateString('he-IL')}
                  </p>
                )}

                {/* שאלות */}
                <div className="space-y-5">
                  {poll.questions?.map((q: PollQuestion) => {
                    const key = `${poll.id}_${q.id}`
                    const selected = pending[key]
                    const msg = voteMsg[key]
                    const isLoading = voteLoading[key]
                    const res = results[key]
                    const alreadyVoted = voted[key] // האופציה שנשלחה בהצלחה

                    return (
                      <div key={q.id} className="bg-gray-50 rounded-xl p-4">
                        <p className="font-medium text-gray-700 mb-3">{q.questionText}</p>

                        {closed ? (
                          /* ── סקר סגור: תוצאות ── */
                          <div className="space-y-2">
                            {q.options.map(opt => {
                              const count = res?.[opt] ?? 0
                              const total = res ? Object.values(res).reduce((a, b) => a + b, 0) : 0
                              const pct = total > 0 ? Math.round((count / total) * 100) : 0
                              return (
                                <div key={opt} className="flex items-center gap-2 text-sm">
                                  <span className="w-28 text-gray-600 shrink-0 truncate">{opt}</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div className="bg-indigo-500 h-2 rounded-full transition-all"
                                      style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-gray-500 w-16 text-left text-xs shrink-0">
                                    {res ? `${count} (${pct}%)` : '—'}
                                  </span>
                                </div>
                              )
                            })}
                            {!res && (
                              <button onClick={() => loadResults(poll.id, q.id)}
                                className="text-xs text-indigo-500 hover:underline mt-1">
                                טען תוצאות
                              </button>
                            )}
                          </div>
                        ) : (
                          /* ── סקר פתוח: הצבעה ── */
                          <div>
                            {alreadyVoted ? (
                              /* כבר הצביע — נועל ומציג תוצאות */
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                    ✓ הצבעת: "{alreadyVoted}"
                                  </span>
                                  <span className="text-xs text-gray-400">לא ניתן לשנות הצבעה</span>
                                </div>
                                {/* תוצאות אחרי הצבעה */}
                                {res && (
                                  <div className="space-y-2">
                                    {q.options.map(opt => {
                                      const count = res[opt] ?? 0
                                      const total = Object.values(res).reduce((a, b) => a + b, 0)
                                      const pct = total > 0 ? Math.round((count / total) * 100) : 0
                                      return (
                                        <div key={opt} className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1 ${opt === alreadyVoted ? 'bg-indigo-50' : ''}`}>
                                          <span className="w-28 text-gray-600 shrink-0 truncate">
                                            {opt === alreadyVoted && '✓ '}{opt}
                                          </span>
                                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div className={`h-2 rounded-full transition-all ${opt === alreadyVoted ? 'bg-indigo-600' : 'bg-indigo-300'}`}
                                              style={{ width: `${pct}%` }} />
                                          </div>
                                          <span className="text-gray-500 w-16 text-left text-xs shrink-0">
                                            {count} ({pct}%)
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* טרם הצביע */
                              <>
                                {/* אופציות בחירה */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {q.options.map(opt => (
                                    <button
                                      key={opt}
                                      onClick={() => selectOption(poll.id, q.id, opt)}
                                      className={`px-4 py-2 rounded-lg text-sm border transition-all
                                        ${selected === opt
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                        }`}
                                    >
                                      {selected === opt && <span className="ml-1">✓ </span>}
                                      {opt}
                                    </button>
                                  ))}
                                </div>

                                {/* כפתור שלח + הודעה */}
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
                                    <span className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>
                                      {msg.text}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}

                            {/* תוצאות (Admin בלבד, לפני שהצביע) */}
                            {canManage && !alreadyVoted && (
                              <button onClick={() => loadResults(poll.id, q.id)}
                                className="text-xs text-indigo-500 hover:underline mt-3 block">
                                הצג תוצאות
                              </button>
                            )}
                            {canManage && !alreadyVoted && res && (
                              <div className="mt-3 space-y-1">
                                {Object.entries(res).map(([ans, count]) => {
                                  const total = Object.values(res).reduce((a, b) => a + b, 0)
                                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                                  return (
                                    <div key={ans} className="flex items-center gap-2 text-sm">
                                      <span className="w-24 text-gray-600 shrink-0 truncate">{ans}</span>
                                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div className="bg-indigo-500 h-2 rounded-full"
                                          style={{ width: `${pct}%` }} />
                                      </div>
                                      <span className="text-gray-500 w-16 text-left text-xs">{count} ({pct}%)</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
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

      {/* מודל יצירת סקר */}
      {showCreate && (
        <Modal title="סקר חדש" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <Input label="כותרת הסקר *" value={pollForm.title}
              onChange={e => setPollForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            <Input label="תיאור" value={pollForm.description}
              onChange={e => setPollForm(f => ({ ...f, description: e.target.value }))} />
            <Input label="תאריך סגירה" type="date" value={pollForm.closesAt}
              onChange={e => setPollForm(f => ({ ...f, closesAt: e.target.value }))} />

            <div className="space-y-4">
              {pollForm.questions.map((q, qi) => (
                <div key={qi} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <Input label={`שאלה ${qi + 1}`} value={q.questionText}
                    onChange={e => updateQuestion(qi, e.target.value)} />
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <Input key={oi} placeholder={`אפשרות ${oi + 1}`} value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)} />
                    ))}
                  </div>
                  <button onClick={() => addOption(qi)} className="text-xs text-indigo-500 hover:underline">
                    + הוסף אפשרות
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addQuestion} className="text-sm text-indigo-500 hover:underline">
              + הוסף שאלה
            </button>

            {createError && <p className="text-sm text-red-500">{createError}</p>}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>ביטול</Button>
              <Button onClick={handleCreate} loading={createLoading}
                disabled={!pollForm.title.trim()}>
                צור סקר
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
