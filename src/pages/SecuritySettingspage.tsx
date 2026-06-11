import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Shield, Lock, KeyRound, ArrowLeft } from "lucide-react"
import { setSecurityPin, verifySecurityPin, changePassword } from "../lib/api"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

const SecuritySettings = () => {
    const navigate = useNavigate()
    const token = localStorage.getItem("token") || ""

    const [pin, setPin] = useState("")
    const [pinMessage, setPinMessage] = useState("")
    const [pinError, setPinError] = useState("")
    const [pinLoading, setPinLoading] = useState(false)

    const [verifyPin, setVerifyPin] = useState("")
    const [verifyMessage, setVerifyMessage] = useState("")
    const [verifyError, setVerifyError] = useState("")
    const [verifyLoading, setVerifyLoading] = useState(false)

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [passwordMessage, setPasswordMessage] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [passwordLoading, setPasswordLoading] = useState(false)

    const handleSetPin = async (e: React.FormEvent) => {
        e.preventDefault()
        setPinLoading(true)
        setPinError("")
        setPinMessage("")
        try {
            const data = await setSecurityPin(pin, token)
            if (data.message || data.success) {
                setPinMessage("PIN set successfully! ✅")
                setPin("")
            } else {
                setPinError(data.error || "Failed to set PIN.")
            }
        } catch {
            setPinError("Something went wrong. Try again.")
        } finally {
            setPinLoading(false)
        }
    }

    const handleVerifyPin = async (e: React.FormEvent) => {
        e.preventDefault()
        setVerifyLoading(true)
        setVerifyError("")
        setVerifyMessage("")
        try {
            const data = await verifySecurityPin(verifyPin, token)
            if (data.message || data.success) {
                setVerifyMessage("PIN verified successfully! ✅")
                setVerifyPin("")
            } else {
                setVerifyError(data.error || "Invalid PIN.")
            }
        } catch {
            setVerifyError("Something went wrong. Try again.")
        } finally {
            setVerifyLoading(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordLoading(true)
        setPasswordError("")
        setPasswordMessage("")
        try {
            const data = await changePassword(currentPassword, newPassword, token)
            if (data.message || data.success) {
                setPasswordMessage("Password changed successfully! ✅")
                setCurrentPassword("")
                setNewPassword("")
            } else {
                setPasswordError(data.error || "Failed to change password.")
            }
        } catch {
            setPasswordError("Something went wrong. Try again.")
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate("/profile")}
                        className="p-2 rounded-full hover:bg-gray-200 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <Shield size={28} className="text-green-900" />
                        <h1 className="text-2xl font-bold text-gray-800">Security Settings</h1>
                    </div>
                </div>

                {/* Set PIN Section */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <KeyRound size={22} className="text-green-900" />
                        <h2 className="text-lg font-semibold text-gray-800">Set Security PIN</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Set a 4-6 digit PIN to protect your account.</p>

                    {pinMessage && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                            {pinMessage}
                        </div>
                    )}
                    {pinError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                            {pinError}
                        </div>
                    )}

                    <form onSubmit={handleSetPin} className="space-y-4">
                        <div>
                            <Label className="mb-2">Enter PIN</Label>
                            <Input
                                type="password"
                                placeholder="Enter 4-6 digit PIN"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                maxLength={6}
                                required
                                className="w-full py-5"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={pinLoading}
                            className="w-full py-5"
                            style={{ backgroundColor: 'var(--primary-color)' }}
                        >
                            {pinLoading ? "Setting PIN..." : "Set PIN"}
                        </Button>
                    </form>
                </div>

                {/* Verify PIN Section */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <KeyRound size={22} className="text-green-900" />
                        <h2 className="text-lg font-semibold text-gray-800">Verify Security PIN</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Verify your PIN to confirm your identity.</p>

                    {verifyMessage && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                            {verifyMessage}
                        </div>
                    )}
                    {verifyError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                            {verifyError}
                        </div>
                    )}

                    <form onSubmit={handleVerifyPin} className="space-y-4">
                        <div>
                            <Label className="mb-2">Enter PIN</Label>
                            <Input
                                type="password"
                                placeholder="Enter your PIN"
                                value={verifyPin}
                                onChange={(e) => setVerifyPin(e.target.value)}
                                maxLength={6}
                                required
                                className="w-full py-5"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={verifyLoading}
                            className="w-full py-5"
                            style={{ backgroundColor: 'var(--primary-color)' }}
                        >
                            {verifyLoading ? "Verifying..." : "Verify PIN"}
                        </Button>
                    </form>
                </div>

                {/* Change Password Section */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Lock size={22} className="text-green-900" />
                        <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Update your account password.</p>

                    {passwordMessage && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                            {passwordMessage}
                        </div>
                    )}
                    {passwordError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                            {passwordError}
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <Label className="mb-2">Current Password</Label>
                            <Input
                                type="password"
                                placeholder="Enter current password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full py-5"
                            />
                        </div>
                        <div>
                            <Label className="mb-2">New Password</Label>
                            <Input
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full py-5"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={passwordLoading}
                            className="w-full py-5"
                            style={{ backgroundColor: 'var(--primary-color)' }}
                        >
                            {passwordLoading ? "Changing..." : "Change Password"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default SecuritySettings