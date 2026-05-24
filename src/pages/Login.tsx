import { ShieldCheck } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { loginUser } from "../lib/api"

const Login = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const savedEmail = localStorage.getItem("rememberedEmail")
        const savedPassword = localStorage.getItem("rememberedPassword")
        if (savedEmail && savedPassword) {
            setEmail(savedEmail)
            setPassword(savedPassword)
            setRememberMe(true)
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const data = await loginUser(email, password)

            if (data.token) {
                localStorage.setItem("token", data.token)

                if (rememberMe) {
                    localStorage.setItem("rememberedEmail", email)
                    localStorage.setItem("rememberedPassword", password)
                } else {
                    localStorage.removeItem("rememberedEmail")
                    localStorage.removeItem("rememberedPassword")
                }

                navigate("/")
            } else {
                setError(data.message || "Login failed. Check your credentials.")
            }
        } catch {
            setError("Something went wrong. Try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-[90svh] flex items-center justify-center ">
            <div className="w-full h-[70svh] overflow-hidden rounded-2xl bg-white shadow-2xl grid md:grid-cols-2">

                {/* Left Section */}
                <div
                    className="relative flex flex-col justify-between p-10 text-white"
                    style={{ background: 'linear-gradient(to bottom right, #062c36, var(--primary-color))' }}
                >
                    <div>
                        <h2 className="text-2xl font-medium mb-14">Second Sync</h2>
                        <h1 className="text-5xl font-semibold leading-tight max-w-md">
                            Precision meets fluid commerce.
                        </h1>
                        <p className="mt-6 text-neutral-300 text-sm max-w-sm leading-relaxed">
                            Join our exclusive marketplace where luxury items find their second rhythm.
                        </p>
                    </div>
                    <div className="space-y-4 mt-16">
                        <div className="flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-white/90">
                            <ShieldCheck className="size-5" />
                            Verified Members Only
                        </div>
                        <div className="flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-white/90">
                            <ShieldCheck className="size-5" />
                            Secure Transactions
                        </div>
                    </div>
                    <div className="absolute top-32 left-24 w-44 h-44 bg-white/10 blur-3xl rounded-full"></div>
                </div>

                {/* Right Section */}
                <div className="flex items-center justify-center p-8 md:p-12 bg-white">
                    <div className="w-full max-w-md">

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-8">
                            <Link to="/login"
                                className="flex-1 text-center pb-3 text-sm font-semibold border-b-2"
                                style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                            >
                                LOGIN
                            </Link>
                            <Link to="/signup" className="text-center flex-1 pb-3 text-sm font-semibold text-gray-400">
                                SIGN UP
                            </Link>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Login Form */}
                        <form className="space-y-5" onSubmit={handleSubmit}>

                            {/* Email */}
                            <div>
                                <Label className="mb-2">Email Address</Label>
                                <Input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="w-full py-6"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Password</Label>
                                    <a href="#" className="text-sm hover:underline" style={{ color: 'var(--primary-color)' }}>
                                        Forgot Password?
                                    </a>
                                </div>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full py-6"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="text-sm text-gray-600">Remember Me</span>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                className="w-full rounded-lg py-6"
                                style={{ backgroundColor: 'var(--primary-color)' }}
                                disabled={loading}
                            >
                                {loading ? "Logging in..." : "Log In"}
                            </Button>
                        </form>

                        {/* Footer */}
                        <p className="mt-10 text-center text-xs leading-relaxed text-gray-400">
                            By continuing, you agree to Second Sync's
                            <a href="#" className="font-medium text-gray-600"> Terms of Service </a>
                            and
                            <a href="#" className="font-medium text-gray-600"> Privacy Policy</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login