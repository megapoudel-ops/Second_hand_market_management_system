import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { addLocalNotification } from "../lib/api";
import type { LocalListing } from "../lib/api";
import { Upload, X, CheckCircle, AlertTriangle, Laptop, BookOpen, Sofa } from "lucide-react";

declare global {
  interface ImportMetaEnv {
    readonly VITE_AD_API_URL?: string;
    readonly VITE_MEDIA_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const AD_API = import.meta.env.VITE_AD_API_URL || "http://localhost:8000";
const MEDIA_API = import.meta.env.VITE_MEDIA_API_URL || "http://localhost:8001";
const LOCAL_LISTINGS_KEY = "second-sync-listings";

type Category = "laptop" | "furniture" | "books";
type Condition = "Brand New" | "Like New / Open Box" | "Gently Used" | "Well Loved";

interface UploadedImage {
  file_id: string;
  url: string;
  filename: string;
  isLocal?: boolean;
}

const getLocalListings = (): LocalListing[] =>
  JSON.parse(localStorage.getItem(LOCAL_LISTINGS_KEY) || "[]") as LocalListing[];

const saveLocalListings = (listings: LocalListing[]) =>
  localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(listings));

export default function CreateListing() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<Category>("laptop");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("0.00");
  const [currency, setCurrency] = useState("USD - United States Dollar");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [condition, setCondition] = useState<Condition>("Like New / Open Box");
  const [yearOfPurchase, setYearOfPurchase] = useState("");
  const [warrantyStatus, setWarrantyStatus] = useState("No warranty");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fraudWarning, setFraudWarning] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const categories = [
    {
      id: "laptop" as Category,
      label: "Laptops",
      sub: "Computers, tablets, and tech accessories.",
      icon: <Laptop size={28} strokeWidth={1.5} />,
    },
    {
      id: "books" as Category,
      label: "Books",
      sub: "Educational, fiction, and rare collections.",
      icon: <BookOpen size={28} strokeWidth={1.5} />,
    },
    {
      id: "furniture" as Category,
      label: "Furniture",
      sub: "Home decor, tables, and office setups.",
      icon: <Sofa size={28} strokeWidth={1.5} />,
    },
  ];

  const conditions: Condition[] = [
    "Brand New",
    "Like New / Open Box",
    "Gently Used",
    "Well Loved",
  ];

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${MEDIA_API}/api/media/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Image upload failed" }));
        throw new Error(err.detail || "Image upload failed");
      }

      const data = await res.json();
      return {
        file_id: data.file_id || `local-${crypto.randomUUID?.() ?? Date.now().toString()}`,
        url: `${MEDIA_API}${data.url || ""}`,
        filename: data.filename || file.name,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      console.warn("Media upload failed, using local preview.", message);
      return {
        file_id: `local-${crypto.randomUUID?.() ?? Date.now().toString()}`,
        url: URL.createObjectURL(file),
        filename: file.name,
        isLocal: true,
      };
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!token) {
      setError("You must be logged in to upload images.");
      return;
    }
    if (images.length + files.length > 10) {
      setError("Maximum 10 photos allowed.");
      return;
    }

    setUploading(true);
    setError(null);
    for (const file of Array.from(files)) {
      const uploaded = await uploadFile(file);
      setImages((prev) => [...prev, uploaded]);
      if (uploaded.isLocal) {
        setError("Image upload backend unavailable: using a local preview image.");
      }
    }
    setUploading(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const saveListingLocally = (savedAsDraft: boolean, backendError?: string, successText?: string) => {
    const autoTags = [
      category,
      condition.toLowerCase().replace(/\s*\/\s*/g, " "),
      yearOfPurchase ? `year-${yearOfPurchase}` : "no-year",
    ];

    const currentUser = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}") as { name?: string; email?: string };
      } catch {
        return {};
      }
    })();

    const listing: LocalListing = {
      id: `local-${crypto.randomUUID?.() ?? Date.now().toString()}`,
      name: title.trim() || "Untitled Listing",
      description: description.trim() || "No description provided.",
      category,
      price: Number(price) || 0,
      currency,
      tags: autoTags,
      images,
      condition,
      yearOfPurchase,
      warrantyStatus,
      sellerName: currentUser.name || currentUser.email || "Unknown Seller",
      sellerEmail: currentUser.email || "",
      createdAt: new Date().toISOString(),
      savedAsDraft,
      backendError,
    };

    const existing = getLocalListings();
    saveLocalListings([listing, ...existing]);
    setSuccess(true);
    setSuccessMessage(
      successText || (savedAsDraft ? "Draft saved locally." : backendError ? "Saved locally because the backend is unavailable." : "Listing saved locally.")
    );
    if (backendError) {
      setError(backendError);
    }

    return listing;
  };

  const handleSaveDraft = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const listing = saveListingLocally(true, undefined, "Draft saved locally.");
      addLocalNotification({
        title: "Draft saved",
        message: "Your listing draft has been saved successfully.",
        type: "listing",
        createdAt: new Date().toISOString(),
        isRead: false,
        data: {
          listingId: listing.id,
          category: listing.category,
          path: `/listings/${listing.id}`,
        },
      });
      window.dispatchEvent(new Event("listings-changed"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save draft.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const removeImage = (file_id: string) => {
    setImages((prev) => prev.filter((img) => img.file_id !== file_id));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!token) { setError("You must be logged in to post a listing."); return; }
    if (!title.trim()) { setError("Listing title is required."); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError("Enter a valid price greater than 0.");
      return;
    }
    if (!description.trim()) { setError("Description is required."); return; }

    // Build tags from category + condition + year
    const autoTags = [
      category,
      condition.toLowerCase().replace(/\s*\/\s*/g, " "),
      yearOfPurchase ? `year-${yearOfPurchase}` : "no-year",
    ];

    setSubmitting(true);
    try {
      const payload: any = {
        name: title.trim(),
        description: `${description.trim()}\n\nCondition: ${condition}${yearOfPurchase ? `\nYear of Purchase: ${yearOfPurchase}` : ""}\nWarranty: ${warrantyStatus}`,
        category,
        price: Number(price),
        currency,
        tags: autoTags,
      };

      if (images.length > 0) {
        payload.images = images.map((img) => img.url);
      }

      const res = await fetch(`${AD_API}/ads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to create listing" }));
        throw new Error(err.detail || "Failed to create listing");
      }

      const data = await res.json();
      if (data.fraud_flag) setFraudWarning(true);

      const listing = saveListingLocally(false, undefined, "Listing published successfully.");
      addLocalNotification({
        title: "Listing published",
        message: "Your listing has been published successfully.",
        type: "listing",
        createdAt: new Date().toISOString(),
        isRead: false,
        data: {
          listingId: listing.id,
          category: listing.category,
          path: `/listings/${listing.id}`,
        },
      });
      window.dispatchEvent(new Event("listings-changed"));
      setTimeout(() => navigate("/"), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      const shouldFallback = /fetch|network|failed to fetch|timeout/i.test(msg);
      if (shouldFallback) {
        const listing = saveListingLocally(false, `Backend unavailable: ${msg}`, "Saved locally because the backend is unavailable.");
        addLocalNotification({
          title: "Listing saved offline",
          message: "Your listing was saved locally because the marketplace service is unavailable.",
          type: "listing",
          createdAt: new Date().toISOString(),
          isRead: false,
          data: {
            listingId: listing.id,
            category: listing.category,
            path: `/listings/${listing.id}`,
          },
        });
        window.dispatchEvent(new Event("listings-changed"));
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──
  if (success) {
    return (
      <div style={{
        minHeight: "60vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <CheckCircle size={52} color="#134e4a" />
        <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
          {successMessage || "Listing Published!"}
        </p>
        {fraudWarning && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#fef9c3", border: "1px solid #fde047",
            borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#854d0e",
          }}>
            <AlertTriangle size={15} />
            Your listing was flagged for review before going live.
          </div>
        )}
        <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>Redirecting to home...</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 700, margin: "0 auto",
      padding: "32px 24px 80px",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#111827",
    }}>

      {/* Page title */}
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>
        Create a New Listing
      </h1>
      <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 36px" }}>
        Turn your pre-owned items into something new. Follow the steps below to showcase your listing to the Second Sync community.
      </p>

      {/* Not logged in */}
      {!token && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: 8, padding: "12px 16px", fontSize: 13,
          color: "#991b1b", marginBottom: 24,
        }}>
          You must be logged in to post a listing.{" "}
          <span onClick={() => navigate("/login")}
            style={{ textDecoration: "underline", cursor: "pointer", fontWeight: 600 }}>
            Login here
          </span>
        </div>
      )}

      {/* ── STEP 1: Category ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={stepBadge}>1</div>
          <h2 style={stepTitle}>Choose a Category</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                border: `1.5px solid ${category === cat.id ? "#134e4a" : "#e5e7eb"}`,
                borderRadius: 10, padding: "18px 16px",
                cursor: "pointer",
                background: category === cat.id ? "#f0fdf4" : "#fff",
                transition: "all 0.15s",
              }}
            >
              <div style={{ color: "#134e4a", marginBottom: 8 }}>{cat.icon}</div>
              <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 14 }}>{cat.label}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{cat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 2: Basic Information ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={stepBadge}>2</div>
          <h2 style={stepTitle}>Basic Information</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Listing Title */}
          <div>
            <label style={labelStyle}>LISTING TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MacBook Pro M1 2021 - Excellent Condition"
              style={inputStyle}
            />
          </div>

          {/* Price + Currency */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>PRICE ($)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>CURRENCY</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={inputStyle}
              >
                <option>USD - United States Dollar</option>
                <option>NPR - Nepalese Rupee</option>
                <option>INR - Indian Rupee</option>
                <option>EUR - Euro</option>
                <option>GBP - British Pound</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item's features, history, and why you are selling it..."
              rows={5}
              style={{ ...inputStyle, resize: "vertical", minHeight: 110 }}
            />
          </div>
        </div>
      </div>

      {/* ── STEP 3: Product Photography ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={stepBadge}>3</div>
          <h2 style={stepTitle}>Product Photography</h2>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragOver ? "#134e4a" : "#d1d5db"}`,
            borderRadius: 10, padding: "40px 24px",
            textAlign: "center", cursor: "pointer",
            background: dragOver ? "#f0fdf4" : "#fafafa",
            transition: "all 0.15s",
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: "1.5px solid #d1d5db",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <Upload size={20} color="#9ca3af" />
          </div>
          <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 14, color: "#374151" }}>
            {uploading ? "Uploading..." : "Drag and drop photos here"}
          </p>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#9ca3af" }}>
            Or click to browse from your computer (Max 10 photos)
          </p>
          <button
            type="button"
            style={{
              padding: "7px 18px", border: "1px solid #d1d5db",
              borderRadius: 6, background: "#fff", fontSize: 13,
              color: "#374151", cursor: "pointer", fontWeight: 500,
              pointerEvents: "none",
            }}
          >
            Select Files
          </button>
        </div>
        <input
          ref={fileInputRef} type="file"
          accept="image/*" multiple
          style={{ display: "none" }}
          onChange={handleFileInput}
          disabled={uploading || !token}
        />

        {/* Image previews */}
        {images.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {images.map((img) => (
              <div key={img.file_id} style={{ position: "relative" }}>
                <img
                  src={img.url} alt={img.filename}
                  style={{
                    width: 88, height: 88, objectFit: "cover",
                    borderRadius: 8, border: "1px solid #e5e7eb",
                  }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(img.file_id); }}
                  style={{
                    position: "absolute", top: -6, right: -6,
                    background: "#ef4444", border: "none", borderRadius: "50%",
                    width: 20, height: 20, display: "flex",
                    alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}
                >
                  <X size={11} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── STEP 4: Condition & Specifications ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={stepBadge}>4</div>
          <h2 style={stepTitle}>Condition & Specifications</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Condition radio */}
          <div>
            <label style={labelStyle}>ITEM CONDITION</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {conditions.map((c) => (
                <label
                  key={c}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    border: "1px solid #e5e7eb", borderRadius: 8,
                    padding: "10px 14px", cursor: "pointer",
                    background: condition === c ? "#f0fdf4" : "#fff",
                    fontSize: 14, color: "#374151",
                    fontWeight: condition === c ? 500 : 400,
                  }}
                >
                  <input
                    type="radio"
                    name="condition"
                    value={c}
                    checked={condition === c}
                    onChange={() => setCondition(c)}
                    style={{ accentColor: "#134e4a" }}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>

          {/* Year + Warranty */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>YEAR OF PURCHASE</label>
              <input
                type="text"
                value={yearOfPurchase}
                onChange={(e) => setYearOfPurchase(e.target.value)}
                placeholder="e.g. 2022"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>WARRANTY STATUS</label>
              <select
                value={warrantyStatus}
                onChange={(e) => setWarrantyStatus(e.target.value)}
                style={inputStyle}
              >
                <option>No warranty</option>
                <option>Under warranty</option>
                <option>Extended warranty</option>
                <option>Manufacturer warranty</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: 8, padding: "12px 16px",
          color: "#991b1b", fontSize: 13, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {/* Footer bar */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", borderTop: "1px solid #e5e7eb",
        paddingTop: 20, flexWrap: "wrap", gap: 12,
      }}>
        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
          By publishing, you agree to Second Sync's Community Guidelines.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => handleSaveDraft()}
            disabled={submitting}
            style={{
              padding: "10px 20px", border: "1px solid #d1d5db",
              borderRadius: 8, background: "#fff", fontSize: 14,
              color: "#374151", cursor: "pointer", fontWeight: 500,
            }}
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={submitting || !token}
            style={{
              padding: "10px 24px",
              background: submitting || !token ? "#d1d5db" : "#134e4a",
              color: "#fff", border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              cursor: submitting || !token ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Publishing..." : "Publish Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}

const stepBadge: React.CSSProperties = {
  width: 28, height: 28, borderRadius: "50%",
  background: "#134e4a", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 13, fontWeight: 700, flexShrink: 0,
};

const stepTitle: React.CSSProperties = {
  fontSize: 17, fontWeight: 700, margin: 0, color: "#111827",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#9ca3af", letterSpacing: "0.08em",
  textTransform: "uppercase", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "1px solid #e5e7eb", borderRadius: 8,
  padding: "10px 14px", fontSize: 14, outline: "none",
  color: "#374151", background: "#fff",
  fontFamily: "'Inter', system-ui, sans-serif",
};