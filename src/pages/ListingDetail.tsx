import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import { deleteLocalListing, getLocalListingById } from "../lib/api";
import type { LocalListing } from "../lib/api";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<LocalListing | null>(null);

  useEffect(() => {
    if (!id) return;
    const found = getLocalListingById(id);
    setListing(found || null);
  }, [id]);

  if (!listing) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 xl:px-0">
        <div className="max-w-3xl mx-auto rounded-3xl border border-gray-200 bg-white p-10 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Listing not found</h1>
          <p className="text-sm text-gray-500 mb-6">We could not locate this listing. It may have been removed or saved under a different account.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate("/my-listings")}
              className="rounded-2xl bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f3b2c] transition"
            >
              Back to my listings
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Return to homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mainImage = listing.images?.[0]?.url || "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop";
  const categoryPath = listing.category === "books" ? "/books" : listing.category === "laptop" ? "/laptops" : "/furniture";

  const openSellerChat = () => {
    navigate(
      `/messages?contactId=${encodeURIComponent(listing.id)}&contactName=${encodeURIComponent(listing.sellerName || "Seller")}`
    );
  };

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 xl:px-0">
      <Header
        title={listing.name}
        subtitle={`${listing.savedAsDraft ? "Draft" : "Published"} • ${listing.category}`}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Saved on {new Date(listing.createdAt).toLocaleDateString()}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${listing.savedAsDraft ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"}`}>
                {listing.savedAsDraft ? "Draft" : "Published"}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">{listing.currency}</span>
              <button
                type="button"
                onClick={openSellerChat}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
              >
                Seller: {listing.sellerName || "Unknown"}
              </button>
            </div>
            {listing.sellerEmail && (
              <p className="text-sm text-gray-500">Seller email: {listing.sellerEmail}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(categoryPath)}
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Back to {listing.category}
            </button>
            <button
              type="button"
              onClick={() => navigate("/my-listings")}
              className="rounded-2xl bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3b2c] transition"
            >
              My Listings
            </button>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm("Delete this listing? This cannot be undone.")) return
                deleteLocalListing(listing.id)
                window.dispatchEvent(new Event("listings-changed"))
                navigate("/my-listings", { state: { toast: "Listing deleted successfully." } })
              }}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition"
            >
              🗑️ Delete listing
            </button>
            {listing.sellerEmail && (
              <a
                href={`mailto:${listing.sellerEmail}?subject=${encodeURIComponent(`Question about ${listing.name}`)}`}
                className="rounded-2xl border border-[var(--primary-color)] bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3b2c] transition"
              >
                Contact seller
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <img src={mainImage} alt={listing.name} className="h-96 w-full object-cover" />
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Condition</p>
                  <p className="text-sm font-semibold text-gray-900">{listing.condition}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Warranty</p>
                  <p className="text-sm font-semibold text-gray-900">{listing.warrantyStatus}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Category</p>
                  <p className="mt-2 font-semibold text-gray-900">{listing.category}</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Price</p>
                  <p className="mt-2 font-semibold text-gray-900">Rs. {listing.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-3xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Description</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{listing.description}</p>
              </div>

              <div className="rounded-3xl bg-white p-4 border border-gray-100">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Details</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {listing.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Images</h2>
              <div className="mt-4 grid gap-3">
                {listing.images.map((image) => (
                  <img key={image.file_id} src={image.url} alt={image.filename} className="h-28 w-full rounded-3xl object-cover" />
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Listing status</h2>
              <p className="mt-3 text-sm text-gray-600">
                {listing.savedAsDraft
                  ? "This item is currently saved as a draft and can be edited before publishing."
                  : listing.backendError
                    ? "This listing was saved locally because the backend was unavailable."
                    : "This listing was published and is visible in your category pages."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
