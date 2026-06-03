import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User, Package, Heart, Settings, LogOut } from "lucide-react"
import { getProfile } from "../lib/api"

const Profile = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState<{ name: string; email: string } | null>(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            navigate("/login")
            return
        }
        getProfile(token).then((data) => {
            if (data.user) setUser(data.user)
        })
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem("token")
        navigate("/login")
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-3xl mx-auto">

                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow p-8 flex items-center gap-6 mb-6">
                    <div className="bg-green-900 rounded-full p-5">
                        <User size={48} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {user?.name || "Loading..."}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {user?.email || ""}
                        </p>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="bg-white rounded-2xl shadow divide-y">

                    <button
                        onClick={() => navigate("/cart")}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
                    >
                        <Package size={22} className="text-green-900" />
                        <span className="text-gray-700 font-medium">My Orders</span>
                    </button>

                    <button
                        onClick={() => navigate("/laptops")}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
                    >
                        <Heart size={22} className="text-green-900" />
                        <span className="text-gray-700 font-medium">Saved Items</span>
                    </button>

                    <button
                        onClick={() => navigate("/create-listing")}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
                    >
                        <Settings size={22} className="text-green-900" />
                        <span className="text-gray-700 font-medium">My Listings</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition"
                    >
                        <LogOut size={22} className="text-red-500" />
                        <span className="text-red-500 font-medium">Logout</span>
                    </button>

                </div>
            </div>
        </div>
    )
}

export default Profile