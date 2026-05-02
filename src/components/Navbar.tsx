import { Bell, ShoppingCart, User, Wallet } from 'lucide-react'

const Navbar = () => {
    return (
        <div className='flex items-center justify-center pt-4'>
            <div className='flex items-end justify-between w-7xl'>
                <div className='flex items-center gap-8'>
                    <h3 className='text-lg font-semibold'>Second Sync</h3>
                    <ul className='flex items-center gap-4 text-sm font-light'>
                        <li>Laptops</li>
                        <li>Books</li>
                        <li>Furniture</li>
                    </ul>
                </div>

                <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2 bg-blue-100 px-2.5 py-2 rounded-full'>
                        <Wallet className='size-4' />
                        <span className='text-xs'>RS 1,200.00</span>
                    </div>
                    <Bell className='size-5' />
                    <ShoppingCart className='size-5'/>
                    <User className='border rounded-full p-1 size-6' />
                    <button className='text-xs bg-green-900 text-white rounded-md px-3 py-2'>
                        Add Post
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Navbar