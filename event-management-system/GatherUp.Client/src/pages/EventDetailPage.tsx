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

const allTabs: { id: Tab; label: string; icon: string; managerOnly?: boolean }[] = [
  { id: 'participants', label: 'משתתפים', icon: '👥' },
  { id: 'polls',        label: 'סקרים',   icon: '📊' },
  { id: 'finance',      label: 'פיננסים', icon: '💰' },
  { id: 'settings',     label: 'הגדרות',  icon: '⚙️', managerOnly: true },
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
  }, [id])

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

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">טוען אירוע...</p>
    </div>
  )

  if (!event) return null

  return (
    <div dir="rtl">
      {/* Back */}
      <button onClick={() => navigate('/events')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-violet-600 mb-5 transition-colors group">
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        חזרה לאירועים
      </button>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 mb-6 text-white shadow-xl shadow-violet-200/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold border border-white/30">
                <StatusBadge status={event.status} />
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              {event.eventDate && <span>📅 {new Date(event.eventDate).toLocaleDateString('he-IL')}</span>}
              {event.location && <span>📍 {event.location}</span>}
              <span>👥 {event.participants?.length ?? 0} משתתפים</span>
              {event.pricePerParticipant && <span>💰 ₪{event.pricePerParticipant} לאדם</span>}
            </div>
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
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

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 mb-6 w-fit shadow-sm border border-gray-100">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'participants' && <ParticipantsTab event={event} onReload={reload} />}
      {activeTab === 'polls'        && <PollsTab event={event} onReload={reload} />}
      {activeTab === 'finance'      && <FinanceTab event={event} onReload={reload} />}
      {activeTab === 'settings'     && <SettingsTab event={event} onReload={reload} />}
    </div>
  )
}
