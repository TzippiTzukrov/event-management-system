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

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>טוען אירועים...</p>
      </div>
    )
  }

  if (error) return <div className="alert alert--error">{error}</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{canManage ? 'כל האירועים' : 'האירועים שלי'}</h1>
          <p className="page-subtitle">{events.length} אירועים</p>
        </div>
        {canManage && <Button onClick={() => navigate('/events/new')}>אירוע חדש</Button>}
      </div>

      {events.length === 0 ? (
        <Card>
          <div className="empty-state">
            <p>{canManage ? 'אין אירועים עדיין' : 'אין אירועים שאת/ה משתתף/ת בהם'}</p>
            {canManage && (
              <div style={{ marginTop: '1rem' }}>
                <Button onClick={() => navigate('/events/new')}>צור אירוע ראשון</Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="events-grid">
          {events.map(event => {
            const myParticipant = event.participants?.find(
              p => p.appUserId === userId || p.email?.toLowerCase() === username?.toLowerCase()
            )
            return (
              <Card key={event.id} interactive className="event-card" onClick={() => navigate(`/events/${event.id}`)}>
                <div className="event-card-top">
                  <h2 className="event-card-title">{event.title}</h2>
                  <StatusBadge status={event.status} />
                </div>
                <div className="event-card-meta">
                  {event.eventDate && (
                    <div className="event-meta-item">
                      <span className="event-meta-label">תאריך</span>
                      {new Date(event.eventDate).toLocaleDateString('he-IL')}
                    </div>
                  )}
                  {event.location && (
                    <div className="event-meta-item">
                      <span className="event-meta-label">מיקום</span>
                      {event.location}
                    </div>
                  )}
                  <div className="event-meta-item">
                    <span className="event-meta-label">משתתפים</span>
                    {event.participants?.length ?? 0}
                  </div>
                  {event.pricePerParticipant != null && event.pricePerParticipant > 0 && (
                    <div className="event-meta-item">
                      <span className="event-meta-label">מחיר</span>
                      ₪{event.pricePerParticipant} לאדם
                    </div>
                  )}
                </div>
                {myParticipant && (
                  <div className={`event-rsvp ${
                    myParticipant.isAttending === true ? 'event-rsvp--yes'
                      : myParticipant.isAttending === false ? 'event-rsvp--no'
                      : 'event-rsvp--pending'
                  }`}>
                    {myParticipant.isAttending === true ? 'אישרת הגעה'
                      : myParticipant.isAttending === false ? 'דחית הגעה'
                      : 'טרם הגבת'}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
