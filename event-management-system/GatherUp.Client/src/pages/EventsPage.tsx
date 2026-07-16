import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsApi } from '../api/events'
import type { GatherEvent } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'

export function EventsPage() {
  const [events, setEvents] = useState<GatherEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { canManage, userId, username } = useAuth()

  useEffect(() => {
    eventsApi.getAll()
      .then(all => {
        if (canManage) {
          setEvents(all)
        } else {
          // Participant ו-Host רואים רק אירועים שהם שייכים אליהם
          const mine = all.filter(ev =>
            ev.participants?.some(p => p.appUserId === userId || p.email?.toLowerCase() === username?.toLowerCase()) ||
            ev.host?.appUserId === userId
          )
          setEvents(mine)
        }
      })
      .catch(() => setError('שגיאה בטעינת האירועים'))
      .finally(() => setLoading(false))
  }, [canManage, userId, username])

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">טוען אירועים...</p>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-6 text-center">{error}</div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {canManage ? 'כל האירועים' : 'האירועים שלי'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {events.length > 0 ? `${events.length} אירועים` : ''}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => navigate('/events/new')} size="lg">
            + אירוע חדש
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <Card className="p-16 text-center">
          <div className="text-6xl mb-5">📅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {canManage ? 'אין אירועים עדיין' : 'אין אירועים שאת/ה משתתף/ת בהם'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {canManage ? 'צור את האירוע הראשון שלך' : 'כשמנהל יוסיף אותך לאירוע, הוא יופיע כאן'}
          </p>
          {canManage && (
            <Button onClick={() => navigate('/events/new')}>צור אירוע ראשון</Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map(event => {
            const myParticipant = event.participants?.find(
              p => p.appUserId === userId || p.email?.toLowerCase() === username?.toLowerCase()
            )
            return (
              <Card
                key={event.id}
                className="p-6 cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/50 transition-all duration-200"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-violet-700 transition-colors">
                    {event.title}
                  </h2>
                  <StatusBadge status={event.status} />
                </div>

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  {event.eventDate && (
                    <p className="flex items-center gap-2">
                      <span className="w-5 text-center">📅</span>
                      {new Date(event.eventDate).toLocaleDateString('he-IL')}
                    </p>
                  )}
                  {event.location && (
                    <p className="flex items-center gap-2">
                      <span className="w-5 text-center">📍</span>
                      {event.location}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <span className="w-5 text-center">👥</span>
                    {event.participants?.length ?? 0} משתתפים
                  </p>
                  {event.pricePerParticipant != null && event.pricePerParticipant > 0 && (
                    <p className="flex items-center gap-2">
                      <span className="w-5 text-center">💰</span>
                      ₪{event.pricePerParticipant} לאדם
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-violet-500 font-semibold group-hover:text-violet-700 transition-colors">
                    {canManage ? 'לניהול ←' : 'לפרטים ←'}
                  </span>
                  {myParticipant && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      myParticipant.isAttending === true
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : myParticipant.isAttending === false
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {myParticipant.isAttending === true ? '✓ אישרתי' : myParticipant.isAttending === false ? '✕ דחיתי' : '? טרם הגבתי'}
                    </span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
