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

  if (loading) return <p>טוען אירועים...</p>
  if (error) return <p>{error}</p>

  return (
    <div>
      <div>
        <h1>{canManage ? 'כל האירועים' : 'האירועים שלי'}</h1>
        {canManage && <Button onClick={() => navigate('/events/new')}>+ אירוע חדש</Button>}
      </div>

      {events.length === 0 ? (
        <Card>
          <p>{canManage ? 'אין אירועים עדיין' : 'אין אירועים שאת/ה משתתף/ת בהם'}</p>
          {canManage && <Button onClick={() => navigate('/events/new')}>צור אירוע ראשון</Button>}
        </Card>
      ) : (
        <div>
          {events.map(event => {
            const myParticipant = event.participants?.find(
              p => p.appUserId === userId || p.email?.toLowerCase() === username?.toLowerCase()
            )
            return (
              <Card key={event.id} onClick={() => navigate(`/events/${event.id}`)} style={{ cursor: 'pointer' }}>
                <div>
                  <h2>{event.title}</h2>
                  <StatusBadge status={event.status} />
                </div>
                <div>
                  {event.eventDate && <p>📅 {new Date(event.eventDate).toLocaleDateString('he-IL')}</p>}
                  {event.location && <p>📍 {event.location}</p>}
                  <p>👥 {event.participants?.length ?? 0} משתתפים</p>
                  {event.pricePerParticipant != null && event.pricePerParticipant > 0 && (
                    <p>💰 ₪{event.pricePerParticipant} לאדם</p>
                  )}
                </div>
                {myParticipant && (
                  <span>
                    {myParticipant.isAttending === true ? '✓ אישרתי' : myParticipant.isAttending === false ? '✕ דחיתי' : '? טרם הגבתי'}
                  </span>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
