const AUTH_URL = import.meta.env.VITE_AUTH_API_URL
const PAYMENT_URL = import.meta.env.VITE_PAYMENT_API_URL
const WALLET_URL = import.meta.env.VITE_WALLET_API_URL
const NOTIF_URL = (import.meta.env.VITE_NOTIFICATION_API_URL || AUTH_URL || '').replace(/\/$/, '')
const NOTIF_API_PREFIX = `${NOTIF_URL}/api/v1/notifications`

const LOCAL_AUTH_USERS_KEY = "second-sync-local-users"
const CURRENT_USER_KEY = "second-sync-current-user"
const LOCAL_NOTIFICATIONS_KEY = "second-sync-local-notifications"
const LOCAL_LISTINGS_KEY = "second-sync-listings"

type LocalNotification = {
  _id: string
  title: string
  message: string
  createdAt: string
  isRead: boolean
  type?: string
  status?: string
  data?: any
  source?: string
}

export type ListingCategory = "laptop" | "furniture" | "books"

export type LocalListing = {
  id: string
  name: string
  description: string
  category: ListingCategory
  price: number
  currency: string
  tags: string[]
  images: {
    file_id: string
    url: string
    filename: string
    isLocal?: boolean
  }[]
  condition: string
  yearOfPurchase: string
  warrantyStatus: string
  sellerName?: string
  sellerEmail?: string
  createdAt: string
  savedAsDraft: boolean
  backendError?: string
}

type LocalUser = {
  id: string
  name: string
  email: string
  password: string
  token: string
  avatar?: string
  phone?: string
  location?: string
  pin?: string
}

type StoredUser = {
  id?: string
  _id?: string
  name: string
  email: string
  avatar?: string
  phone?: string
  location?: string
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const isValidGmail = (email: string) => /^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(email.trim())

export function normalizeAuthUser(user: any): StoredUser | null {
  if (!user) return null
  const normalizedId = user.id || user._id || user.email || ""
  return {
    ...user,
    id: normalizedId,
    _id: user._id || user.id,
  }
}

export function saveAuthenticatedUser(user: any): StoredUser | null {
  const normalized = normalizeAuthUser(user)
  if (!normalized) return null
  saveCurrentUser(normalized)
  localStorage.setItem("user", JSON.stringify(normalized))
  return normalized
}

const loadLocalUsers = (): LocalUser[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_AUTH_USERS_KEY) || "[]") as LocalUser[]
  } catch {
    return []
  }
}

const saveLocalUsers = (users: LocalUser[]) => {
  localStorage.setItem(LOCAL_AUTH_USERS_KEY, JSON.stringify(users))
}

const createLocalToken = (email: string) => `local-${email}-${Date.now()}-${Math.random().toString(36).slice(2)}`

const findLocalUser = (email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email)
  return loadLocalUsers().find(
    (user) => user.email === normalizedEmail && user.password === password
  )
}

const findLocalUserByToken = (token: string) =>
  loadLocalUsers().find((user) => user.token === token)

const localSignup = (name: string, email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email)

  if (!isValidGmail(normalizedEmail)) {
    return { error: "Please sign up using a valid Gmail address." }
  }

  const users = loadLocalUsers()
  if (users.some((user) => user.email === normalizedEmail)) {
    return { error: "This email is already registered. Please login." }
  }

  const token = createLocalToken(normalizedEmail)
  const newUser: LocalUser = {
    id: crypto.randomUUID(),
    name: name.trim() || "Gmail User",
    email: normalizedEmail,
    password,
    token,
    avatar: undefined,
    phone: undefined,
    location: undefined,
    pin: undefined,
  }

  users.push(newUser)
  saveLocalUsers(users)

  return {
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      phone: newUser.phone,
      location: newUser.location,
    },
  }
}

const localLogin = (email: string, password: string) => {
  const user = findLocalUser(email, password)

  if (!user) {
    return { error: "Login failed. Check your credentials." }
  }

  const token = createLocalToken(user.email)
  const users = loadLocalUsers().map((stored) =>
    stored.email === user.email ? { ...stored, token } : stored
  )
  saveLocalUsers(users)

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      location: user.location,
    },
  }
}

const localGetProfile = (token: string) => {
  const user = findLocalUserByToken(token)
  if (!user) {
    return { error: "Invalid token." }
  }
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      location: user.location,
    },
  }
}

const localLogout = (token: string) => {
  const users = loadLocalUsers().map((user) =>
    user.token === token ? { ...user, token: "" } : user
  )
  saveLocalUsers(users)
  return { message: "Logout successful." }
}

const localUpdateProfile = (token: string, profile: Partial<LocalUser>) => {
  const user = findLocalUserByToken(token)
  if (!user) {
    return { error: "Invalid token." }
  }
  const users = loadLocalUsers().map((stored) =>
    stored.token === token ? { ...stored, ...profile } : stored
  )
  saveLocalUsers(users)
  const updatedUser = users.find((stored) => stored.token === token)
  if (!updatedUser) {
    return { error: "Failed to update profile." }
  }
  return {
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      phone: updatedUser.phone,
      location: updatedUser.location,
    },
  }
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email)

  if (AUTH_URL) {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })
      const data = await res.json()
      return data
    } catch {
      return localLogin(normalizedEmail, password)
    }
  }

  return localLogin(normalizedEmail, password)
}

export async function signupUser(name: string, email: string, password: string) {
  const normalizedEmail = normalizeEmail(email)

  if (!isValidGmail(normalizedEmail)) {
    return { error: "Please sign up using a valid Gmail address." }
  }

  if (AUTH_URL) {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: normalizedEmail, password }),
      })
      const data = await res.json()
      return data
    } catch {
      return localSignup(name, normalizedEmail, password)
    }
  }

  return localSignup(name, normalizedEmail, password)
}

export function saveCurrentUser(user: StoredUser) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
}

export function loadCurrentUser(): StoredUser | null {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null") as StoredUser | null
  } catch {
    return null
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY)
}

export async function getProfile(token: string) {
  if (AUTH_URL) {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      return data
    } catch {
      return localGetProfile(token)
    }
  }

  return localGetProfile(token)
}

export async function logoutUser(token: string) {
  if (AUTH_URL) {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      return data
    } catch {
      return localLogout(token)
    }
  }

  return localLogout(token)
}

const localSetSecurityPin = (pin: string, token: string) => {
  const users = loadLocalUsers()
  const updatedUsers = users.map((user) =>
    user.token === token ? { ...user, pin } : user
  )
  saveLocalUsers(updatedUsers)
  return { success: true, message: "PIN set locally." }
}

const localVerifySecurityPin = (pin: string, token: string) => {
  const user = findLocalUserByToken(token)
  if (!user) {
    return { error: "Invalid token." }
  }
  if (user.pin === pin) {
    return { success: true, message: "PIN verified locally." }
  }
  return { error: "Invalid PIN." }
}

const localChangePassword = (currentPassword: string, newPassword: string, token: string) => {
  const user = findLocalUserByToken(token)
  if (!user) {
    return { error: "Invalid token." }
  }
  if (user.password !== currentPassword) {
    return { error: "Current password does not match." }
  }
  const users = loadLocalUsers().map((stored) =>
    stored.token === token ? { ...stored, password: newPassword } : stored
  )
  saveLocalUsers(users)
  return { success: true, message: "Password changed locally." }
}

export async function getWalletBalance(token: string) {
  const res = await fetch(`${WALLET_URL}/wallet/balance`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function getTransactions(token: string) {
  const res = await fetch(`${PAYMENT_URL}/api/transactions`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}
export async function verifyEmail(token: string) {
  const res = await fetch(`${AUTH_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  })
  return res.json()
}

export async function setSecurityPin(pin: string, token: string) {
  if (AUTH_URL) {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/security/pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin }),
      })
      return res.json()
    } catch {
      return localSetSecurityPin(pin, token)
    }
  }

  return localSetSecurityPin(pin, token)
}

export async function verifySecurityPin(pin: string, token: string) {
  if (AUTH_URL) {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/security/verify-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin }),
      })
      return res.json()
    } catch {
      return localVerifySecurityPin(pin, token)
    }
  }

  return localVerifySecurityPin(pin, token)
}

export async function changePassword(currentPassword: string, newPassword: string, token: string) {
  if (AUTH_URL) {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/security/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      return res.json()
    } catch {
      return localChangePassword(currentPassword, newPassword, token)
    }
  }

  return localChangePassword(currentPassword, newPassword, token)
}

export async function updateProfile(token: string, profileData: Partial<StoredUser>) {
  if (AUTH_URL) {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })
      const data = await res.json()
      return data
    } catch {
      return localUpdateProfile(token, profileData as Partial<LocalUser>)
    }
  }

  return localUpdateProfile(token, profileData as Partial<LocalUser>)
}

const loadLocalListings = (): LocalListing[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_LISTINGS_KEY) || "[]") as LocalListing[]
  } catch {
    return []
  }
}

const saveLocalListings = (listings: LocalListing[]) => {
  localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(listings))
}

export const getLocalListings = (): LocalListing[] => loadLocalListings()

export const getLocalListingById = (id: string): LocalListing | undefined =>
  loadLocalListings().find((listing) => listing.id === id)

export const getLocalPublishedListings = (category?: ListingCategory): LocalListing[] =>
  loadLocalListings().filter(
    (listing) => !listing.savedAsDraft && (!category || listing.category === category)
  )

export const deleteLocalListing = (id: string) => {
  const listings = loadLocalListings().filter((listing) => listing.id !== id)
  saveLocalListings(listings)
}

// Notifications
const loadLocalNotifications = (): LocalNotification[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_NOTIFICATIONS_KEY) || "[]") as LocalNotification[]
  } catch {
    return []
  }
}

const saveLocalNotifications = (notifications: LocalNotification[]) => {
  localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notifications))
}

export const addLocalNotification = (notification: Omit<LocalNotification, '_id'>) => {
  const newNotification: LocalNotification = {
    ...notification,
    _id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    source: 'local',
  }
  const notifications = [newNotification, ...loadLocalNotifications()]
  saveLocalNotifications(notifications)
  return newNotification
}

const getLocalNotifications = () => {
  return loadLocalNotifications().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

const getLocalNotificationStats = () => {
  const notifications = loadLocalNotifications()
  const total = notifications.length
  const unread = notifications.filter((n) => !n.isRead).length
  const read = total - unread
  const byType = notifications.reduce((acc: any, notification) => {
    const key = notification.type || 'general'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return {
    total,
    unread,
    read,
    byType: Object.entries(byType).map(([type, count]) => ({ _id: type, count })),
  }
}

const markLocalNotification = (id: string, isRead: boolean) => {
  const notifications = loadLocalNotifications().map((notification) =>
    notification._id === id
      ? { ...notification, isRead, ...(!isRead ? { readAt: undefined } : {}) }
      : notification
  )
  saveLocalNotifications(notifications)
  return notifications.find((notification) => notification._id === id)
}

const markAllLocalNotifications = () => {
  const notifications = loadLocalNotifications().map((notification) => ({
    ...notification,
    isRead: true,
  }))
  saveLocalNotifications(notifications)
  return notifications
}

export async function getNotifications(token: string, page = 1, limit = 20, params = {}) {
  const local = getLocalNotifications()
  const query = new URLSearchParams({ page: String(page), limit: String(limit), ...params } as any)

  try {
    const res = await fetch(`${NOTIF_API_PREFIX}?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()

    if (!data || !Array.isArray(data.data)) {
      return {
        success: true,
        data: local,
        page,
        limit,
        total: local.length,
        pages: Math.ceil(local.length / limit),
      }
    }

    const merged = [...local, ...data.data].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return {
      ...data,
      data: merged,
      total: merged.length,
      pages: Math.ceil(merged.length / limit),
    }
  } catch {
    return {
      success: true,
      data: local,
      page,
      limit,
      total: local.length,
      pages: Math.ceil(local.length / limit),
    }
  }
}

const mergeByType = (remoteByType: any[] = [], localByType: any[] = []) => {
  const counts = new Map<string, number>()

  remoteByType.forEach((item) => {
    const type = item._id || 'general'
    counts.set(type, (counts.get(type) || 0) + item.count)
  })

  localByType.forEach((item) => {
    const type = item._id || 'general'
    counts.set(type, (counts.get(type) || 0) + item.count)
  })

  return Array.from(counts.entries()).map(([type, count]: [string, number]) => ({ _id: type, count }))
}

export async function getNotificationStats(token: string) {
  const localStats = getLocalNotificationStats()

  try {
    const res = await fetch(`${NOTIF_API_PREFIX}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()

    if (!data || !data.data) {
      return { success: true, data: localStats }
    }

    return {
      ...data,
      data: {
        total: data.data.total + localStats.total,
        unread: data.data.unread + localStats.unread,
        read: data.data.read + localStats.read,
        byType: mergeByType(data.data.byType, localStats.byType),
      },
    }
  } catch {
    return { success: true, data: localStats }
  }
}

export async function markNotificationRead(token: string, id: string) {
  if (id?.startsWith('local-')) {
    return { success: true, data: markLocalNotification(id, true) }
  }

  try {
    const res = await fetch(`${NOTIF_API_PREFIX}/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  } catch {
    return { success: true, data: markLocalNotification(id, true) }
  }
}

export async function markNotificationUnread(token: string, id: string) {
  if (id?.startsWith('local-')) {
    return { success: true, data: markLocalNotification(id, false) }
  }

  try {
    const res = await fetch(`${NOTIF_API_PREFIX}/${id}/unread`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  } catch {
    return { success: true, data: markLocalNotification(id, false) }
  }
}

export async function markAllNotificationsRead(token: string) {
  const localUpdated = markAllLocalNotifications()

  try {
    const res = await fetch(`${NOTIF_API_PREFIX}/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
    await res.json()
  } catch {
    // ignore remote failure, local notifications were already updated
  }

  return { success: true, data: { modifiedCount: localUpdated.length } }
}

export async function deleteNotification(token: string, id: string) {
  if (id?.startsWith('local-')) {
    const notifications = loadLocalNotifications().filter((notification) => notification._id !== id)
    saveLocalNotifications(notifications)
    return { success: true, data: null }
  }

  const res = await fetch(`${NOTIF_API_PREFIX}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function createNotification(token: string, payload: any) {
  const res = await fetch(`${NOTIF_API_PREFIX}/bulk`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res.json()
}

export async function createBulkNotifications(token: string, payload: any) {
  const res = await fetch(`${NOTIF_URL}/notifications/bulk`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res.json()
}