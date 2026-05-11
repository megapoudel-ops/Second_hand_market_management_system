import { Link } from "react-router-dom"

const Footer = () => {
    return (
        <div className="w-full py-6 flex items-center justify-between">
            <h3 className='text-xl font-semibold'>Second Sync</h3>
            <div className="flex items-center gap-4">
                <Link
                    to={'/'}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                    About Us
                </Link>
                 <Link
                    to={'/'}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                    Support
                </Link>
                 <Link
                    to={'/'}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                    Terms of Service
                </Link>
                 <Link
                    to={'/'}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                    Privacy Policy
                </Link>
            </div>
            <h6 className="text-sm text-gray-600">
                &copy; 2023 Second Sync. All rights reserved.
            </h6>
        </div>
    )
}

export default Footer