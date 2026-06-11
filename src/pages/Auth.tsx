import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { addLocalNotification, loginUser, signupUser, getProfile, saveAuthenticatedUser } from "../lib/api";

const AUTH_URL = import.meta.env.VITE_AUTH_API_URL;

const Auth = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Signup State
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const data = await loginUser(loginEmail, loginPassword);

      if (!data.token) {
        throw new Error(data.error || data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);

      let authUser = data.user;
      if (!authUser) {
        const profile = await getProfile(data.token);
        authUser = profile.user;
      }

      if (!authUser) {
        throw new Error("Unable to load user profile after login.");
      }

      saveAuthenticatedUser(authUser);
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }

      addLocalNotification({
        title: "Login successful",
        message: `You are logged in with ${authUser.email || loginEmail}`,
        type: "info",
        createdAt: new Date().toISOString(),
        isRead: false,
      })

      window.dispatchEvent(new Event("auth-changed"));
      navigate("/profile");
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Signup Handler
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError("");

    const isValidGmail = (value: string) =>
      /^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(value.trim());

    if (!isValidGmail(signupEmail)) {
      setSignupError("Please sign up with a valid Gmail address.");
      setSignupLoading(false);
      return;
    }

    try {
      // Step 1: Register
      const data = await signupUser(signupName, signupEmail, signupPassword);

      if (data.verificationToken) {
        // Step 2: Auto verify email
        const verifyRes = await fetch(`${AUTH_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: signupEmail,
            verificationToken: data.verificationToken,
          }),
        });
        const verifyData = await verifyRes.json();

        if (verifyData.message) {
          // Step 3: Auto login
          const loginRes = await fetch(`${AUTH_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: signupEmail,
              password: signupPassword,
            }),
          });
          const loginData = await loginRes.json();

          if (loginData.token) {
            localStorage.setItem("token", loginData.token);
            if (loginData.user) {
              saveAuthenticatedUser(loginData.user);
            } else {
              const profile = await getProfile(loginData.token);
              if (profile.user) {
                saveAuthenticatedUser(profile.user);
              }
            }
            window.dispatchEvent(new Event("auth-changed"));
            navigate("/");
          } else {
            setSignupError("Account created! Please login.");
            setActiveTab("login");
          }
        } else {
          setSignupError(verifyData.error || "Verification failed.");
        }
      } else if (data.token) {
        localStorage.setItem("token", data.token);
        if (data.user) {
          saveAuthenticatedUser(data.user);
        } else {
          const profile = await getProfile(data.token);
          if (profile.user) {
            saveAuthenticatedUser(profile.user);
          }
        }
        window.dispatchEvent(new Event("auth-changed"));
        navigate("/");
      } else {
        setSignupError(data.error || data.message || "Signup failed. Try again.");
      }
    } catch {
      setSignupError("Something went wrong. Try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100svh-96px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-7xl min-h-[680px] overflow-hidden rounded-2xl bg-white shadow-2xl grid md:grid-cols-2">
        {/* Left Side - Branding */}
        <div
          className="relative flex-col justify-between p-10 text-white hidden md:flex"
          style={{
            background:
              "linear-gradient(to bottom right, #062c36, var(--primary-color))",
          }}
        >
          <div>
            <h2 className="text-2xl font-medium mb-14">Second Sync</h2>
            <h1 className="text-5xl font-semibold leading-tight max-w-md">
              Precision meets fluid commerce.
            </h1>
            <p className="mt-6 text-neutral-300 text-sm max-w-sm leading-relaxed">
              Join our exclusive marketplace where luxury items find their second
              rhythm.
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

        {/* Right Side - Auth Forms */}
        <div className="flex items-center justify-center p-8 md:p-12 bg-white">
          <div className="w-full max-w-md">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
              <button
                onClick={() => setActiveTab("login")}
                className={`flex-1 text-center pb-3 text-sm font-semibold transition ${
                  activeTab === "login"
                    ? "border-b-2 text-[var(--primary-color)]"
                    : "text-gray-400"
                }`}
                style={
                  activeTab === "login"
                    ? { borderBottomColor: "var(--primary-color)" }
                    : {}
                }
              >
                LOGIN
              </button>
              <button
                onClick={() => setActiveTab("signup")}
                className={`flex-1 text-center pb-3 text-sm font-semibold transition ${
                  activeTab === "signup"
                    ? "border-b-2 text-[var(--primary-color)]"
                    : "text-gray-400"
                }`}
                style={
                  activeTab === "signup"
                    ? { borderBottomColor: "var(--primary-color)" }
                    : {}
                }
              >
                SIGN UP
              </button>
            </div>

            {/* LOGIN FORM */}
            {activeTab === "login" && (
              <>
                {loginError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="mr-2 rounded"
                      />
                      Remember me
                    </label>
                    <a
                      href="#"
                      className="text-sm text-[var(--primary-color)] hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-2.5 bg-green-900 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {loginLoading ? "Logging in..." : "Login"}
                  </button>
                </form>
              </>
            )}

            {/* SIGNUP FORM */}
            {activeTab === "signup" && (
              <>
                {signupError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                    {signupError}
                  </div>
                )}

                <form onSubmit={handleSignup} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <Label className="mb-2">Full Name</Label>
                    <Input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="mb-2">Gmail Address</Label>
                    <Input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="your@gmail.com"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We use Gmail for secure verification
                    </p>
                  </div>

                  {/* Password */}
                  <div>
                    <Label className="mb-2">Password</Label>
                    <Input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Enter a strong password"
                      required
                    />
                  </div>

                  {/* Terms */}
                  <p className="text-xs text-gray-500">
                    By signing up, you agree to our Terms of Service and Privacy
                    Policy
                  </p>

                  {/* Signup Button */}
                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full py-2.5 bg-green-900 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {signupLoading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
