import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { deleteLocalListing, getLocalListings } from "../lib/api";
import type { LocalListing } from "../lib/api";

export default function MyListings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [listings, setListings] = useState<LocalListing[]>([]);
  const [toastMessage, setToastMessage] = useState<string>("");

  const refreshListings = () => {
    setListings(getLocalListings());
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    if (location.state && (location.state as any).toast) {
      showToast((location.state as any).toast);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  const handleDeleteListing = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      return
    }

    deleteLocalListing(id)
    refreshListings()
    window.dispatchEvent(new Event("listings-changed"))
    showToast("Listing deleted successfully.")
  };

  useEffect(() => {
    refreshListings();
    window.addEventListener("listings-changed", refreshListings);
    return () => window.removeEventListener("listings-changed", refreshListings);
  }, []);

  const drafts = listings.filter((listing) => listing.savedAsDraft);
  const published = listings.filter((listing) => !listing.savedAsDraft);

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 xl:px-0">
      <Header
        title="My Listings"
        subtitle="Review drafts and published products in one place."
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-3xl border border-green-200 bg-white px-4 py-3 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-lg">✅</span>
              <p className="text-sm font-semibold text-gray-900">{toastMessage}</p>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">Manage your saved drafts and published listings.</p>
            <h2 className="text-3xl font-semibold text-gray-900">Listings overview</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/create-listing"
              className="rounded-2xl border border-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white transition"
            >
              Create new listing
            </Link>
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Go to notifications
            </button>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            <p className="text-lg font-medium text-gray-900 mb-2">No listings yet</p>
            <p className="mb-6">Save a draft or publish a listing to see it here.</p>
            <Link
              to="/create-listing"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--primary-color)] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0f3b2c] transition"
            >
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Draft listings</p>
                  <h3 className="text-xl font-semibold text-gray-900">{drafts.length} draft{drafts.length === 1 ? "" : "s"}</h3>
                </div>
                <p className="text-sm text-gray-500">These drafts are saved locally and can be published later.</p>
              </div>
              {drafts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
                  No drafts yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {drafts.map((listing) => (
                    <article key={listing.id} className="overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
                      <div className="h-44 overflow-hidden bg-gray-100">
                        <img
                          src={listing.images?.[0]?.url || "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop"}
                          alt={listing.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">Draft</span>
                          <span className="text-xs text-gray-400">{new Date(listing.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">{listing.name}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base font-bold text-gray-900">Rs. {listing.price.toFixed(2)}</span>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/listings/${listing.id}`}
                              className="text-sm font-semibold text-[var(--primary-color)]"
                            >
                              View draft
                            </Link>
                            <button
                              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                              onClick={() => handleDeleteListing(listing.id)}
                              type="button"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Published listings</p>
                  <h3 className="text-xl font-semibold text-gray-900">{published.length} published item{published.length === 1 ? "" : "s"}</h3>
                </div>
                <p className="text-sm text-gray-500">These published listings are visible in category pages.</p>
              </div>
              {published.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
                  No published listings yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {published.map((listing) => (
                    <article key={listing.id} className="overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
                      <div className="h-44 overflow-hidden bg-gray-100">
                        <img
                          src={listing.images?.[0]?.url || "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop"}
                          alt={listing.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Published</span>
                          <span className="text-xs text-gray-400">{new Date(listing.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">{listing.name}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base font-bold text-gray-900">Rs. {listing.price.toFixed(2)}</span>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/listings/${listing.id}`}
                              className="text-sm font-semibold text-[var(--primary-color)]"
                            >
                              View listing
                            </Link>
                            <button
                              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                              onClick={() => handleDeleteListing(listing.id)}
                              type="button"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
