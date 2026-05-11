import { Bell, ShoppingCart, User, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

const Navbar = () => {
    return (
        <div className='flex items-center justify-between py-4 w-full'>
            <div className='flex items-center gap-8'>
                <Link to='/' className='text-xl font-semibold'>
                    Second Sync
                </Link>
                <ul className='flex items-center gap-4 text-sm text-neutral-700'>
                    <Link to='/laptops' className='cursor-pointer hover:text-(--primary-color)'>Laptops</Link>
                    <Link to='/books' className='cursor-pointer hover:text-(--primary-color)'>Books</Link>
                    <Link to='/furniture' className='cursor-pointer hover:text-(--primary-color)'>Furniture</Link>
                </ul>
            </div>

            <div className='flex items-center gap-4 text-(--primary-color)'>
                <Link to={'/payments'} className='flex items-center gap-2'>
                    <Wallet className='size-5' />
                    <span className='text-sm font-semibold'>RS 1,200.00</span>
                </Link>
                <Link to={'/notifications'}><Bell className='size-5' strokeWidth={2.5} /></Link>
                <Link to={'/cart'}><ShoppingCart className='size-5' strokeWidth={2.5} /></Link>
                <User className='text-black border rounded-full p-1 size-7' />
                <button className='text-sm bg-green-900 text-white rounded-md px-3 py-2'>
                    Add Post
                </button>
            </div>
        </div>
    )
}

export default Navbar