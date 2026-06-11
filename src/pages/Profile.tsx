import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { updateProfile } from "../lib/api";
import { User, Mail, Phone, MapPin, Edit, LogOut, Settings, Lock, Shield, Package, Heart, Bell } from "lucide-react";

const getLocalListings = () => {
  try {
    return JSON.parse(localStorage.getItem("second-sync-listings") || "[]") as any[];
  } catch {
    return [];
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [listingCount, setListingCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshListingCounts = () => {
    const listings = getLocalListings();
    setListingCount(listings.length);
    setDraftCount(listings.filter((listing) => listing.savedAsDraft).length);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/auth");
      return;
    }

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setEditData(parsedUser);
      } catch {
        console.error("Failed to parse user data");
      }
    }

    refreshListingCounts();
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const onListingsChanged = () => refreshListingCounts();
    window.addEventListener("listings-changed", onListingsChanged);
    return () => window.removeEventListener("listings-changed", onListingsChanged);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
    navigate("/auth");
    window.dispatchEvent(new Event("auth-changed"));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token") || "";
      const response = await updateProfile(token, editData);
      const updatedUser = response?.user || editData;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditData(updatedUser);
      setAvatarPreview(updatedUser.avatar || updatedUser.profileImage || updatedUser.avatarUrl || updatedUser.photo || null);
      setIsEditing(false);
      window.dispatchEvent(new Event("auth-changed"));
    } catch (error) {
      console.error("Failed to save profile", error);
      localStorage.setItem("user", JSON.stringify(editData));
      setUser(editData);
      setEditData(editData);
      setIsEditing(false);
      window.dispatchEvent(new Event("auth-changed"));
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditData({
      ...editData,
      [field]: value,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    setEditData((prev: any) => ({ ...prev, avatar: url }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="text-gray-500">Loading Profile...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No user data found</p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const avatarUrl =
    user.avatar ||
    user.profileImage ||
    user.avatarUrl ||
    user.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name || user.username || user.email || "User"
    )}&background=14a17a&color=ffffff&size=256`;

  const initials = (
    user.name || user.username || user.email || "U"
  )
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0d7a5f] to-[#14a17a] text-white py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white bg-opacity-20 backdrop-blur-md rounded-full overflow-hidden border-2 border-white border-opacity-30">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-3xl font-bold">
                    {initials}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user.username || user.name || "User"}</h1>
                <p className="text-white text-opacity-80">{user.email}</p>
              </div>
            </div>
            <Link to="/settings/security" className="p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg transition">
              <Settings size={24} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {!isEditing ? (
          <>
            {/* Profile Info Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Main Info */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Account Information</h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Edit size={18} />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Full Name</p>
                      <p className="text-lg font-medium text-gray-800">{user.name || user.username || "Not set"}</p>
                    </div>
                    <User size={24} className="text-[var(--primary-color)]" />
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Email Address</p>
                      <p className="text-lg font-medium text-gray-800">{user.email}</p>
                    </div>
                    <Mail size={24} className="text-[var(--primary-color)]" />
                  </div>

                  {/* Phone */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Phone Number</p>
                      <p className="text-lg font-medium text-gray-800">{user.phone || "Not provided"}</p>
                    </div>
                    <Phone size={24} className="text-[var(--primary-color)]" />
                  </div>

                  {/* Location */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                      <p className="text-lg font-medium text-gray-800">{user.location || "Not provided"}</p>
                    </div>
                    <MapPin size={24} className="text-[var(--primary-color)]" />
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Listings</p>
                      <p className="text-2xl font-bold">{listingCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Bell size={24} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Drafts</p>
                      <p className="text-2xl font-bold">{draftCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Heart size={24} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Saved Items</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Member Since</p>
                      <p className="text-sm font-bold">{new Date().getFullYear()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 mb-6">
              <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/create-listing"
                  className="p-4 border-2 border-[var(--primary-color)] border-opacity-20 rounded-lg hover:border-opacity-100 hover:bg-[var(--primary-color)] hover:bg-opacity-5 transition"
                >
                  <Package size={24} className="text-[var(--primary-color)] mb-2" />
                  <p className="font-semibold text-sm">Create Listing</p>
                  <p className="text-xs text-gray-500">Sell an item</p>
                </Link>

                <Link
                  to="/messages"
                  className="p-4 border-2 border-[var(--primary-color)] border-opacity-20 rounded-lg hover:border-opacity-100 hover:bg-[var(--primary-color)] hover:bg-opacity-5 transition"
                >
                  <Mail size={24} className="text-[var(--primary-color)] mb-2" />
                  <p className="font-semibold text-sm">Messages</p>
                  <p className="text-xs text-gray-500">Chat with users</p>
                </Link>

                <Link
                  to="/notifications"
                  className="p-4 border-2 border-[var(--primary-color)] border-opacity-20 rounded-lg hover:border-opacity-100 hover:bg-[var(--primary-color)] hover:bg-opacity-5 transition"
                >
                  <Bell size={24} className="text-[var(--primary-color)] mb-2" />
                  <p className="font-semibold text-sm">Notifications</p>
                  <p className="text-xs text-gray-500">Check updates</p>
                </Link>

                <Link
                  to="/my-listings"
                  className="p-4 border-2 border-[var(--primary-color)] border-opacity-20 rounded-lg hover:border-opacity-100 hover:bg-[var(--primary-color)] hover:bg-opacity-5 transition"
                >
                  <Package size={24} className="text-[var(--primary-color)] mb-2" />
                  <p className="font-semibold text-sm">My Listings</p>
                  <p className="text-xs text-gray-500">Manage drafts & published items</p>
                </Link>

                <Link
                  to="/settings/security"
                  className="p-4 border-2 border-[var(--primary-color)] border-opacity-20 rounded-lg hover:border-opacity-100 hover:bg-[var(--primary-color)] hover:bg-opacity-5 transition"
                >
                  <Lock size={24} className="text-[var(--primary-color)] mb-2" />
                  <p className="font-semibold text-sm">Security</p>
                  <p className="text-xs text-gray-500">Manage security</p>
                </Link>
              </div>
            </div>

            {/* Logout Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition font-medium"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </>
        ) : (
          // Edit Mode
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                <div className="flex flex-col gap-3 sm:flex-row items-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-50">
                        <span className="text-lg font-semibold">{initials}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <input
                      ref={(node) => {
                        fileInputRef.current = node
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition"
                    >
                      Upload Photo
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarPreview(null)
                          setEditData((prev: any) => ({ ...prev, avatar: undefined }))
                        }}
                        className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editData?.name || editData?.username || ""}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={editData?.email || ""}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="Email cannot be changed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editData?.phone || ""}
                  onChange={(e) => handleEditChange("phone", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={editData?.location || ""}
                  onChange={(e) => handleEditChange("location", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  placeholder="Enter your location"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-[var(--primary-color)] text-white rounded-lg font-medium hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(user);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;