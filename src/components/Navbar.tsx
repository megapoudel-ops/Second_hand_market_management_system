import { Bell, Menu, ShoppingCart, User, Wallet, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false)

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
                        <Link
                            to='/laptops'
                            className='hover:text-(--primary-color) transition'
                        >
                            Laptops
                        </Link>

                        <Link
                            to='/books'
                            className='hover:text-(--primary-color) transition'
                        >
                            Books
                        </Link>

                        <Link
                            to='/furniture'
                            className='hover:text-(--primary-color) transition'
                        >
                            Furniture
                        </Link>
                    </ul>
                </div>

                {/* Desktop Right Side */}
                <div className='hidden md:flex items-center gap-4 text-(--primary-color)'>
                    <Link
                        to='/payments'
                        className='flex items-center gap-2'
                    >
                        <Wallet className='size-5' />
                        <span className='text-sm font-semibold'>
                            RS 1,200.00
                        </span>
                    </Link>

                    <Link to='/notifications'>
                        <Bell className='size-5' strokeWidth={2.5} />
                    </Link>

                    <Link to='/cart'>
                        <ShoppingCart className='size-5' strokeWidth={2.5} />
                    </Link>

                    <Link to={'/login'}><User className='text-black border rounded-full p-1 size-8' /></Link>

                    <Link to='/create-listing'>
                        <button className='text-sm bg-green-900 text-white rounded-md px-4 py-2 hover:opacity-90 transition'>
                            Add Post
                        </button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className='md:hidden'
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className='md:hidden px-6 pb-6'>
                    <div className='flex flex-col gap-4 text-sm text-neutral-700'>

                        <Link
                            to='/laptops'
                            className='hover:text-(--primary-color)'
                            onClick={() => setIsOpen(false)}
                        >
                            Laptops
                        </Link>

                        <Link
                            to='/books'
                            className='hover:text-(--primary-color)'
                            onClick={() => setIsOpen(false)}
                        >
                            Books
                        </Link>

                        <Link
                            to='/furniture'
                            className='hover:text-(--primary-color)'
                            onClick={() => setIsOpen(false)}
                        >
                            Furniture
                        </Link>

                        <hr />

                        <Link
                            to='/payments'
                            className='flex items-center gap-2 text-(--primary-color)'
                        >
                            <Wallet className='size-5' />
                            <span className='font-semibold'>
                                RS 1,200.00
                            </span>
                        </Link>

                        <Link
                            to='/notifications'
                            className='flex items-center gap-2 text-(--primary-color)'
                        >
                            <Bell className='size-5' />
                            Notifications
                        </Link>

                        <Link
                            to='/cart'
                            className='flex items-center gap-2 text-(--primary-color)'
                        >
                            <ShoppingCart className='size-5' />
                            Cart
                        </Link>

                        <div className='flex items-center gap-2'>
                            <User className='text-black border rounded-full p-1 size-8' />
                            <span>Profile</span>
                        </div>

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