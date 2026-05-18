import { Bell, Menu, ShoppingCart, User, Wallet, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const navigate = useNavigate()
    const token = localStorage.getItem("token")
    const isLoggedIn = !!token

    const handleLogout = () => {
        localStorage.removeItem("token")
        navigate("/login")
    }

    return (
        <nav className='w-full border-b bg-white'>
            <div className='flex items-center justify-between px-6 py-4 xl:px-0 xl:max-w-7xl w-full'>

                {/* Logo */}
                <div className='flex items-center gap-8'>
                    <Link to='/' className='text-xl font-semibold'>
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
                    </ul>
                </div>

                {/* Desktop Right Side */}
                <div className='hidden md:flex items-center gap-4 text-[var(--primary-color)]'>
                    <Link to='/payments' className='flex items-center gap-2'>
                        <Wallet size={20} />
                        <span className='text-sm font-semibold'>RS 1,200.00</span>
                    </Link>

                    <Link to='/notifications'>
                        <Bell size={20} strokeWidth={2.5} />
                    </Link>

                    <Link to='/cart'>
                        <ShoppingCart size={20} strokeWidth={2.5} />
                    </Link>

                    {isLoggedIn ? (
                        <Link to='/profile'>
                            <span className='text-black border rounded-full p-1 bg-green-100 flex'>
                                <User size={32} />
                            </span>
                        </Link>
                    ) : (
                        <Link to='/login'>
                            <span className='text-black border rounded-full p-1'>
                                <User size={32} />
                            </span>
                        </Link>
                    )}

                    <button className='text-sm bg-green-900 text-white rounded-md px-4 py-2 hover:opacity-90 transition'>
                        Add Post
                    </button>
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
                        <hr />
                        <Link to='/payments' className='flex items-center gap-2 text-[var(--primary-color)]'>
                            <Wallet size={20} />
                            <span className='font-semibold'>RS 1,200.00</span>
                        </Link>
                        <Link to='/notifications' className='flex items-center gap-2 text-[var(--primary-color)]'>
                            <Bell size={20} />
                            Notifications
                        </Link>
                        <Link to='/cart' className='flex items-center gap-2 text-[var(--primary-color)]'>
                            <ShoppingCart size={20} />
                            Cart
                        </Link>
                        {isLoggedIn ? (
                            <Link to='/profile' className='flex items-center gap-2'>
                                <span className='border rounded-full p-1 bg-green-100'>
                                    <User size={32} />
                                </span>
                                <span>My Profile</span>
                            </Link>
                        ) : (
                            <Link to='/login' className='flex items-center gap-2'>
                                <User size={32} />
                                <span>Login</span>
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




























































































































