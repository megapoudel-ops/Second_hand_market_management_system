import { Link } from "react-router-dom"

const Footer = () => {
    return (
        <footer className="w-full border-t mt-16">
            <div className="max-w-7xl mx-auto px-6 xl:px-0 py-8">

                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

                    {/* Logo + Copyright */}
                    <div className="flex flex-col items-center lg:items-start gap-2 text-center lg:text-left">
                        <h3 className="text-2xl font-semibold">
                            Second Sync
                        </h3>

                        <h6 className="text-sm text-gray-600">
                            &copy; 2026 Second Sync. All rights reserved.
                        </h6>
                    </div>

                    {/* Footer Links */}
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-center">
                        <Link
                            to="/about-us"
                            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            About Us
                        </Link>

                        <span
                            className="text-sm text-gray-400 cursor-not-allowed"
                            aria-disabled="true"
                        >
                            Support
                        </span>

                        <span
                            className="text-sm text-gray-400 cursor-not-allowed"
                            aria-disabled="true"
                        >
                            Terms of Service
                        </span>

                        <span
                            className="text-sm text-gray-400 cursor-not-allowed"
                            aria-disabled="true"
                        >
                            Privacy Policy
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer