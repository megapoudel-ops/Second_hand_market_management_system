import { Bell, Menu, ShoppingCart, User, Wallet, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getNotificationStats, logoutUser, clearCurrentUser } from '../lib/api'

const buildAvatarUrl = (user: any) => {
    const fallbackName = user?.name || user?.username || user?.email || 'User'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=14a17a&color=ffffff&size=128`
}

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"))
    const [username, setUsername] = useState<string | null>(() => {
        const user = localStorage.getItem("user")
        if (user) {
            try {
                const parsedUser = JSON.parse(user)
                return parsedUser.username || parsedUser.name || null
            } catch {
                return null
            }
        }
        return null
    })
    const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
        const user = localStorage.getItem("user")
        if (!user) return null
        try {
            const parsedUser = JSON.parse(user)
            return parsedUser.avatar || parsedUser.profileImage || parsedUser.avatarUrl || parsedUser.photo || buildAvatarUrl(parsedUser)
        } catch {
            return null
        }
    })
    const isLoggedIn = !!token
    const [unreadCount, setUnreadCount] = useState<number>(0)

    useEffect(() => {
        const onAuthChanged = () => {
            setToken(localStorage.getItem("token"))
            const user = localStorage.getItem("user")
            if (user) {
                try {
                    const parsedUser = JSON.parse(user)
                    setUsername(parsedUser.username || parsedUser.name || null)
                    setAvatarUrl(parsedUser.avatar || parsedUser.profileImage || parsedUser.avatarUrl || parsedUser.photo || buildAvatarUrl(parsedUser))
                } catch {
                    setUsername(null)
                    setAvatarUrl(null)
                }
            } else {
                setUsername(null)
                setAvatarUrl(null)
            }
        }
        window.addEventListener("auth-changed", onAuthChanged)
        return () => window.removeEventListener("auth-changed", onAuthChanged)
    }, [])

    useEffect(() => {
        if (!token) return
        let mounted = true
        getNotificationStats(token)
            .then((res) => {
                if (!mounted) return
                if (res && res.data && typeof res.data.unread === 'number') {
                    setUnreadCount(res.data.unread)
                }
            })
            .catch(() => {})
        return () => { mounted = false }
    }, [token])

    const handleLogout = async () => {
        if (!token) return
        try {
            await logoutUser(token)
        } catch {}
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        clearCurrentUser()
        setToken(null)
        window.dispatchEvent(new Event("auth-changed"))
    }

    return (
        <nav className='w-full border-b bg-white'>
            <div className='flex items-center justify-between px-6 py-4 xl:px-0 xl:max-w-7xl w-full mx-auto'>
                {/* Logo */}
                <div className='flex items-center gap-8'>
                    <Link
                        to='/'
                        className='text-xl font-semibold focus:outline-none focus:ring-0'
                        onClick={(e) => e.currentTarget.blur()}
                        onBlur={(e) => e.currentTarget.blur()}
                        onMouseLeave={(e) => e.currentTarget.blur()}
                    >
                        Second Sync
                    </Link>

                    {/* Desktop Links */}
                    <ul className='hidden md:flex items-center gap-6 text-sm text-neutral-700'>
                        <li>
                            <Link to='/laptops' className='hover:text-[var(--primary-color)] transition'>
                                Laptops
                            </Link>
                        </li>
                        <li>
                            <Link to='/books' className='hover:text-[var(--primary-color)] transition'>
                                Books
                            </Link>
                        </li>
                        <li>
                            <Link to='/furniture' className='hover:text-[var(--primary-color)] transition'>
                                Furniture
                            </Link>
                        </li>
                        <li>
                            <Link to='/ai-color-palette' className='hover:text-[var(--primary-color)] transition'>
                                AI Color
                            </Link>
                        </li>
                        <li>
                            <Link to='/ai-damage-detection' className='hover:text-[var(--primary-color)] transition'>
                                AI Damage
                            </Link>
                        </li>
                        <li>
                            <Link to='/faq' className='hover:text-[var(--primary-color)] transition'>
                                FAQ Chat
                            </Link>
                        </li>
                        <li>
                            <Link to='/messages' className='hover:text-[var(--primary-color)] transition'>
                                Messages
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Desktop Right Side */}
                <div className='hidden md:flex items-center gap-4 text-[var(--primary-color)]'>
                    <Link to='/payments' className='flex items-center gap-2'>
                        <Wallet size={20} />
                        <span className='text-sm font-semibold'>RS 1,200.00</span>
                    </Link>

                    <Link to='/notifications'>
                        <div className='relative'>
                            <Bell size={20} strokeWidth={2.5} />
                            {unreadCount > 0 && (
                                <span className='absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5'>
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </Link>

                    <Link to='/cart'>
                        <ShoppingCart size={20} strokeWidth={2.5} />
                    </Link>

                    {isLoggedIn ? (
                        <Link to='/profile' className='flex items-center gap-2'>
                            <span className='rounded-full overflow-hidden border border-green-200 bg-green-100'>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt='Profile' className='w-10 h-10 object-cover' />
                                ) : (
                                    <span className='flex items-center justify-center w-10 h-10 text-green-900'>
                                        <User size={20} />
                                    </span>
                                )}
                            </span>
                            <span className='text-sm font-medium text-gray-700'>{username || 'Profile'}</span>
                        </Link>
                    ) : (
                        <Link to='/auth' className='flex items-center gap-2'>
                            <span className='text-black border rounded-full p-1 hover:bg-gray-100 transition'>
                                <User size={32} />
                            </span>
                        </Link>
                    )}

                    <Link to='/create-listing'>
                        <button className='text-sm bg-green-900 text-white rounded-md px-4 py-2 hover:opacity-90 transition'>
                            Add Post
                        </button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button className='md:hidden' onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className='md:hidden px-6 pb-6'>
                    <div className='flex flex-col gap-4 text-sm text-neutral-700'>
                        <Link to='/laptops' className='hover:text-[var(--primary-color)]' onClick={() => setIsOpen(false)}>Laptops</Link>
                        <Link to='/books' className='hover:text-[var(--primary-color)]' onClick={() => setIsOpen(false)}>Books</Link>
                        <Link to='/furniture' className='hover:text-[var(--primary-color)]' onClick={() => setIsOpen(false)}>Furniture</Link>
                        <Link to='/ai-color-palette' className='hover:text-[var(--primary-color)]' onClick={() => setIsOpen(false)}>AI Color</Link>
                        <Link to='/ai-damage-detection' className='hover:text-[var(--primary-color)]' onClick={() => setIsOpen(false)}>AI Damage</Link>
                        <Link to='/faq' className='hover:text-[var(--primary-color)]' onClick={() => setIsOpen(false)}>FAQ Chat</Link>
                        <Link to='/messages' className='hover:text-[var(--primary-color)]' onClick={() => setIsOpen(false)}>Messages</Link>

                        <hr />
                        <Link to='/payments' className='flex items-center gap-2 text-[var(--primary-color)]'>
                            <Wallet size={20} />
                            <span className='font-semibold'>RS 1,200.00</span>
                        </Link>
                        <Link to='/notifications' className='flex items-center gap-2 text-[var(--primary-color)]'>
                            <div className='relative flex items-center gap-2'>
                                <Bell size={20} />
                                Notifications
                                {unreadCount > 0 && (
                                    <span className='bg-red-600 text-white text-xs rounded-full px-1.5'>
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </Link>
                        <Link to='/cart' className='flex items-center gap-2 text-[var(--primary-color)]'>
                            <ShoppingCart size={20} />
                            Cart
                        </Link>
                        {isLoggedIn ? (
                            <div className='flex flex-col gap-2'>
                                <Link to='/profile' className='flex items-center gap-2'>
                                    <span className='rounded-full overflow-hidden border border-green-200 bg-green-100'>
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt='Profile' className='w-10 h-10 object-cover' />
                                        ) : (
                                            <span className='flex items-center justify-center w-10 h-10 text-green-900'>
                                                <User size={20} />
                                            </span>
                                        )}
                                    </span>
                                    <div>
                                        <span className='block font-semibold'>{username || 'User'}</span>
                                        <span className='text-xs text-gray-500'>My Profile</span>
                                    </div>
                                </Link>
                                <button onClick={handleLogout} className='text-sm text-[var(--primary-color)] text-left'>Logout</button>
                            </div>
                        ) : (
                            <Link to='/auth' className='flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50'>
                                <User size={20} />
                                <span className='font-semibold'>Login / Sign Up</span>
                            </Link>
                        )}
                        <button className='text-sm bg-green-900 text-white rounded-md px-4 py-2 w-full'>
                            Add Post
                        </button>
                    </div>
                </div>
            )}
        </nav>
    )
}

export default Navbar