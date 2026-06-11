import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import LaptopCard from "../components/Laptops/LaptopCard";
import { parsePrice } from "../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Header from "../components/Header";
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { getLocalPublishedListings } from "../lib/api";

function FilterSection({
  title,
  children,
}: {
  title: String;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-6 border-b border-gray-200">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      onClick={onChange}
      className="flex items-center gap-3 cursor-pointer"
    >
      <Checkbox checked={checked} />
      <label className="text-sm text-gray-600 cursor-pointer">{label}</label>
    </div>
  );
}

const AD_API_URL = import.meta.env.VITE_AD_API_URL || "http://localhost:8000";

const Laptops = () => {
  const location = useLocation();
  const urlPalette = new URLSearchParams(location.search)
    .get("palette")
    ?.split(",")
    .map((hex) => hex.trim().toLowerCase())
    .filter(Boolean) || [];
  const [paletteInput, setPaletteInput] = useState(urlPalette.join(", "));
  const [appliedPalette, setAppliedPalette] = useState<string[]>(urlPalette);
  const paletteActive = appliedPalette.length > 0;

  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [localPublished, setLocalPublished] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ brand: string[]; processor: string[] }>({
    brand: [],
    processor: [],
  });
  const [appliedFilters, setAppliedFilters] = useState<{ brand: string[]; processor: string[] }>(filters);
  const [priceRange, setPriceRange] = useState(5000);
  const [appliedPriceRange, setAppliedPriceRange] = useState(priceRange);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "price-low" | "price-high">("newest");

 
  useEffect(() => {
    const token = localStorage.getItem("token")
    const loadLocal = () => {
      setLocalPublished(
        getLocalPublishedListings("laptop").map((listing) => ({
          id: listing.id,
          title: listing.name,
          description: listing.description,
          price: listing.price.toFixed(2),
          rating: 4.5,
          brand: listing.tags?.[0] || "Local",
          processor: listing.condition,
          image: listing.images?.[0]?.url || "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
          category: "laptop",
          listingId: listing.id,
        }))
      )
    }

    loadLocal()

    fetch(`${AD_API_URL}/ads?category=laptop`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.ads && data.ads.length > 0) {
          setProducts(data.ads)
        }
        setLoading(false)
      })
      .catch(() => {
        // API is down, just use fallback products
        setProducts([])
        setLoading(false)
      })

    window.addEventListener("listings-changed", loadLocal)
    return () => window.removeEventListener("listings-changed", loadLocal)
  }, [])
  
  const toggleFilter = (type: "brand" | "processor", value: string) => {
    setFilters((prev) => {
      const exists = prev[type].includes(value);

      return {
        ...prev,
        [type]: exists
          ? prev[type].filter((v) => v !== value)
          : [...prev[type], value],
      };
    });
  };

  const fallbackProducts = [
    {
      id: 1,
      title: 'MacBook Pro 14" M3',
      description: "16GB RAM, 512GB SSD - Space Black",
      price: "1999.00",
      rating: 4.9,
      brand: "Apple",
      processor: "Apple M3 Pro",
      image:
        "https://sm.mashable.com/mashable_sea/review/m/m3-macbook/m3-macbook-pro-14-inch-review-why-you-should-buy-this-apple_r785.jpg",
      colors: ["#000000", "#1F2937"],
    },
    {
      id: 2,
      title: "Dell XPS 15 9530",
      description: "Core i9, 32GB RAM, RTX 4060",
      price: "2449.00",
      rating: 4.8,
      brand: "Dell",
      processor: "Intel Core i9",
      image:
        "https://sm.pcmag.com/t/pcmag_au/review/d/dell-xps-1/dell-xps-15-9530-2023_6h7m.1920.jpg",
      colors: ["#111827", "#6B7280"],
    },
    {
      id: 3,
      title: "ASUS ROG Zephyrus G14",
      description: "Ryzen 9, 16GB, RTX 4070 - Eclipse Gray",
      price: "1699.00",
      rating: 4.7,
      brand: "ASUS",
      processor: "AMD Ryzen 9",
      image:
        "https://www.pcworld.com/wp-content/uploads/2025/04/G14_edited1.jpg?quality=50&strip=all",
      colors: ["#0F172A", "#64748B"],
    },
    {
      id: 4,
      title: "Lenovo ThinkPad X1 Carbon",
      description: "Core i7, 32GB RAM, 1TB SSD",
      price: "1850.00",
      rating: 4.9,
      brand: "Lenovo",
      processor: "Intel Core i7",
      image:
        "https://cdn.mos.cms.futurecdn.net/NEjTSZHivorAaAwbqtf3pf.jpg",
      colors: ["#111827", "#F8FAFC"],
    },
    {
      id: 5,
      title: "Razer Blade 16",
      description: "Dual-mode Mini-LED, RTX 4080",
      price: "3299.00",
      rating: 4.6,
      brand: "Razer",
      processor: "Intel Core i9",
      image:
        "https://static0.xdaimages.com/wordpress/wp-content/uploads/2022/11/razer-blade-16-1.jpg",
      colors: ["#050505", "#00FF9D"],
    },
    {
      id: 6,
      title: 'MacBook Air 15" M3',
      description: "8-core CPU, 10-core GPU, 256GB",
      price: "1299.00",
      rating: 4.8,
      brand: "Apple",
      processor: "Apple M3 Pro",
      image:
        "https://cdn.mos.cms.futurecdn.net/yg6EsCnDYstVq7RueGn68c.jpg",
      colors: ["#002B36", "#8B5CF6"],
    },
  ]

  const mappedProducts = products.length > 0 ? products.map((p: any) => ({
    id: p._id || p.id,
    title: p.name || p.title,
    description: p.description,
    price: `${p.price}`,
    rating: p.rating || 4.5,
    image: p.image || "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
    brand: p.brand || (typeof p.name === "string" ? p.name.split(" ")[0] : ""),
    processor:
      p.processor ||
      (typeof p.description === "string"
        ? p.description.includes("M3")
          ? "Apple M3 Pro"
          : p.description.includes("Core i7")
          ? "Intel Core i7"
          : p.description.includes("Core i5")
          ? "Intel Core i5"
          : ""
        : ""),
    colors: p.colors || [],
    specs: (p.specs || p.specifications || []).concat(
      (p.colors && p.colors.length)
        ? [{ label: "Color Palette", value: p.colors.join(", ") }]
        : []
    ),
  })) : fallbackProducts;

  const filteredProducts = mappedProducts.filter((product) => {
    const price = parsePrice(product.price);
    const matchesPrice = price <= appliedPriceRange;
    const matchesBrand =
      appliedFilters.brand.length === 0 || appliedFilters.brand.includes(product.brand || "");
    const matchesProcessor =
      appliedFilters.processor.length === 0 || appliedFilters.processor.includes(product.processor || "");
    const matchesPalette =
      appliedPalette.length === 0 ||
      (product.colors?.some((color: string) => appliedPalette.includes(color.toLowerCase())) ?? false);

    return matchesPrice && matchesBrand && matchesProcessor && matchesPalette;
  });

  const displayProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "popular") {
      return (b.rating || 0) - (a.rating || 0);
    }

    if (sortBy === "price-low") {
      return parsePrice(a.price) - parsePrice(b.price);
    }

    if (sortBy === "price-high") {
      return parsePrice(b.price) - parsePrice(a.price);
    }

    return 0;
  });

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 xl:px-0">
      <Header
        title="Premium Laptops"
        subtitle="Discover synchronized performance and design."
      />

      {localPublished.length > 0 && (
        <section className="mt-8 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Your published listings</p>
              <h2 className="text-2xl font-semibold text-gray-900">Live laptops from your account</h2>
            </div>
            <Link
              to="/my-listings"
              className="text-sm font-medium text-[var(--primary-color)] hover:text-[var(--primary-color)]"
            >
              View all my listings
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {localPublished.map((product) => (
              <div key={product.id} className="rounded-3xl border border-gray-200 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-44 w-full object-cover"
                />
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Your listing</p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{product.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="text-base font-bold text-gray-900">Rs. {product.price}</span>
                    <Link
                      to={`/listings/${product.listingId}`}
                      className="text-sm font-semibold text-[var(--primary-color)]"
                    >
                      View listing
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="lg:hidden mt-8 mb-4">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setShowFilters(true)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </Button>
      </div>

      <div className="mt-6 flex gap-6">
        {showFilters && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}

        <aside
          className={`
            fixed lg:static top-0 left-0 h-screen lg:h-auto
            w-72 lg:w-64 bg-white z-50 lg:z-auto
            p-6 lg:p-0 overflow-y-auto
            transition-transform duration-300
            ${showFilters ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 shrink-0
          `}
        >
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <h1 className="text-xl font-semibold">Filters</h1>
            <button onClick={() => setShowFilters(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <h1 className="hidden lg:block text-2xl font-semibold text-gray-900 mb-8">
            Filters
          </h1>

          <div className="space-y-6">
            <FilterSection title="Brand">
              {["Apple", "Dell", "Lenovo", "ASUS"].map((item) => (
                <FilterCheckbox
                  key={item}
                  label={item}
                  checked={filters.brand.includes(item)}
                  onChange={() => toggleFilter("brand", item)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Processor">
              {["Intel Core i5", "Intel Core i7", "Apple M3 Pro"].map((item) => (
                <FilterCheckbox
                  key={item}
                  label={item}
                  checked={filters.processor.includes(item)}
                  onChange={() => toggleFilter("processor", item)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Color Palette">
              <div>
                <input
                  value={paletteInput}
                  onChange={(e) => setPaletteInput(e.target.value)}
                  placeholder="#000000, #1f2937"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter comma-separated hex values to filter laptops by matching palette colors.
                </p>
              </div>
            </FilterSection>

            <FilterSection title="Price Range">
              <div className="pt-2">
                <input
                  type="range"
                  min={500}
                  max={5000}
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-(--primary-color)"
                />
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Rs. 500</span>
                  <span>Rs. 5,000+</span>
                </div>
                <div className="mt-2 text-sm text-gray-700">Showing up to Rs. {priceRange}</div>
              </div>

              <button
                className="w-full mt-6 py-3 rounded-xl text-white font-medium"
                style={{ backgroundColor: "var(--primary-color)" }}
                onClick={() => {
                  setAppliedFilters(filters);
                  setAppliedPriceRange(priceRange);
                  setAppliedPalette(
                    paletteInput
                      .split(",")
                      .map((hex) => hex.trim().toLowerCase())
                      .filter(Boolean)
                  );
                  setShowFilters(false);
                }}
              >
                Apply Filters
              </button>
            </FilterSection>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <p className="text-sm text-gray-500">
              {paletteActive ? "Showing products matched to your color palette" : loading ? "Loading..." : `Showing ${displayProducts.length} products`}
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest Arrivals</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayProducts.map((product) => (
              <LaptopCard key={product.id} product={product} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-12">
            <Button variant="outline" size="icon" className="bg-white">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button className="text-white w-9 h-9">1</Button>
            <Button variant="ghost" className="w-9 h-9">2</Button>
            <Button variant="ghost" className="w-9 h-9">3</Button>
            <span className="text-gray-400 px-1">...</span>
            <Button variant="outline" size="icon" className="bg-white">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Laptops;