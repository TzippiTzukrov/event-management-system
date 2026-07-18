import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventsApi } from '../api/events'
import type { GatherEvent } from '../types'
import { EventStatus } from '../types'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { ParticipantsTab } from '../components/event/ParticipantsTab'
import { PollsTab } from '../components/event/PollsTab'
import { FinanceTab } from '../components/event/FinanceTab'
import { SettingsTab } from '../components/event/SettingsTab'

type Tab = 'participants' | 'polls' | 'finance' | 'settings'

const allTabs: { id: Tab; label: string; managerOnly?: boolean }[] = [
  { id: 'participants', label: 'משתתפים' },
  { id: 'polls',        label: 'סקרים' },
  { id: 'finance',      label: 'פיננסים' },
  { id: 'settings',     label: 'הגדרות', managerOnly: true },
]

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canManage } = useAuth()
  const [event, setEvent] = useState<GatherEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('participants')
  const [statusLoading, setStatusLoading] = useState(false)

  const tabs = allTabs.filter(t => !t.managerOnly || canManage)

  function reload() {
    if (!id) return
    eventsApi.getById(id).then(setEvent).catch(() => navigate('/events'))
  }

  useEffect(() => {
    if (!id) return
    eventsApi.getById(id)
      .then(setEvent)
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  async function changeStatus(status: EventStatus) {
    if (!event) return
    setStatusLoading(true)
    try {
      await eventsApi.updateStatus(event.id, status)
      setEvent(prev => prev ? { ...prev, status } : prev)
    } finally {
      setStatusLoading(false)
    }
  }

  async function sendInvitations() {
    if (!event) return
    await eventsApi.sendInvitations(event.id)
    alert('הזמנות נשלחו!')
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>טוען אירוע...</p>
      </div>
    )
  }

  if (!event) return null

  return (
    <div dir="rtl" className="page">
      <button type="button" className="back-link" onClick={() => navigate('/events')}>
        ← חזרה לאירועים
      </button>

      <div className="event-hero">
        <div className="event-hero-top">
          <div>
            <div className="event-hero-title">
              <h1>{event.title}</h1>
              <StatusBadge status={event.status} />
            </div>
            <div className="event-hero-meta">
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
          </div>

          {canManage && (
            <div className="event-hero-actions">
              {event.status === EventStatus.Draft && (
                <Button variant="secondary" size="sm" onClick={() => changeStatus(EventStatus.PollOpen)} loading={statusLoading}>
                  פתח סקר
                </Button>
              )}
              {event.status === EventStatus.PollOpen && (
                <Button variant="secondary" size="sm" onClick={() => changeStatus(EventStatus.PollClosed)} loading={statusLoading}>
                  סגור סקר
                </Button>
              )}
              {(event.status === EventStatus.PollClosed || event.status === EventStatus.Draft) && (
                <Button variant="secondary" size="sm" onClick={sendInvitations}>שלח הזמנות</Button>
              )}
              {event.status === EventStatus.InvitationsSent && (
                <Button variant="success" size="sm" onClick={() => changeStatus(EventStatus.Active)} loading={statusLoading}>
                  הפעל אירוע
                </Button>
              )}
              {event.status === EventStatus.Active && (
                <Button variant="secondary" size="sm" onClick={() => changeStatus(EventStatus.Completed)} loading={statusLoading}>
                  סיים אירוע
                </Button>
              )}
              {event.status !== EventStatus.Cancelled && event.status !== EventStatus.Completed && (
                <Button variant="danger" size="sm" onClick={() => changeStatus(EventStatus.Cancelled)} loading={statusLoading}>
                  בטל
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`tab${activeTab === tab.id ? ' tab--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'participants' && <ParticipantsTab event={event} onReload={reload} />}
      {activeTab === 'polls'        && <PollsTab event={event} onReload={reload} />}
      {activeTab === 'finance'      && <FinanceTab event={event} onReload={reload} />}
      {activeTab === 'settings'     && <SettingsTab event={event} onReload={reload} />}
    </div>
  )
}
