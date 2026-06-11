import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '../components/Header'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/api'

export default function Notifications() {
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<any[]>([])
    const [selectedNotification, setSelectedNotification] = useState<any | null>(null)
    const token = localStorage.getItem('token')

    useEffect(() => {
        if (!token) return

        getNotifications(token, 1, 50)
            .then((res) => {
                if (res && res.data) setNotifications(res.data)
            })
            .catch(() => {})
    }, [token])

    const handleMarkAll = () => {
        if (!token) return
        markAllNotificationsRead(token).then(() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
            if (selectedNotification) {
                setSelectedNotification({ ...selectedNotification, isRead: true })
            }
        })
    }

    const handleSelectNotification = async (notification: any) => {
        if (!token) return
        setSelectedNotification(notification)
        if (!notification.isRead) {
            const res = await markNotificationRead(token, notification._id)
            if (res && res.data) {
                setNotifications((prev) => prev.map((n) => (n._id === notification._id ? res.data : n)))
                setSelectedNotification(res.data)
                notification = res.data
            }
        }
        if (notification?.data?.listingId) {
            navigate(`/listings/${notification.data.listingId}`)
            return
        }
    }

    return (
        <div className="w-full min-h-screen py-8 px-4 sm:px-6 xl:px-0">
            <Header title="Notifications" subtitle="Stay updated with your latest activity and marketplace alerts." />

            <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate(-1)} className="text-sm text-[var(--primary-color)] font-medium">← Back</button>
                    <button onClick={handleMarkAll} className="text-sm text-[var(--primary-color)]">Mark all as read</button>
                </div>

                <div className="grid lg:grid-cols-[1.4fr_0.9fr] gap-6">
                    <div className="space-y-4">
                        {notifications.length === 0 && (
                            <div className="text-gray-500">No notifications</div>
                        )}

                        {notifications.map((n) => (
                            <button
                                type="button"
                                key={n._id}
                                onClick={() => handleSelectNotification(n)}
                                className={`w-full text-left bg-white rounded-2xl p-5 border transition ${n.isRead ? 'border-gray-200 opacity-80' : 'border-[var(--primary-color)] shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h4 className="font-medium text-gray-800">{n.title}</h4>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                                        <div className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
                                    </div>
                                    {!n.isRead ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">New</span>
                                    ) : null}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 min-h-[260px]">
                            {selectedNotification ? (
                                <>
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{selectedNotification.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(selectedNotification.createdAt).toLocaleString()}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${selectedNotification.isRead ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {selectedNotification.isRead ? 'Read' : 'Unread'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                        {selectedNotification.message}
                                    </div>
                                    {selectedNotification.data && (
                                        <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Change Details</h4>
                                            <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(selectedNotification.data, null, 2)}</pre>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                                    <p className="text-sm">Select a notification to see details here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}