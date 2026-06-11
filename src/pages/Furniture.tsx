import {
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    X
} from "lucide-react";

import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { getLocalPublishedListings } from "../lib/api";
import ProductCard from "../components/Books/ProductCard";
import { parsePrice } from "../lib/utils";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../components/ui/select";

function FilterSection({
    title,
    children
}: {
    title: String,
    children: React.ReactNode
}) {
    return (
        <div className="pb-6 border-b border-gray-200">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                {title}
            </h3>

            <div className="space-y-3">
                {children}
            </div>
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

            <label className="text-sm text-gray-600 cursor-pointer">
                {label}
            </label>
        </div>
    );
}

const Furniture = () => {
    const location = useLocation();
    const palette = new URLSearchParams(location.search)
        .get("palette")
        ?.split(",")
        .map((hex) => hex.trim().toLowerCase())
        .filter(Boolean) || [];
    const paletteActive = palette.length > 0;
    const [showFilters, setShowFilters] = useState(false);
    const [localPublished, setLocalPublished] = useState<any[]>([]);
    const [filters, setFilters] = useState<{ type: string[]; material: string[] }>({
        type: [],
        material: [],
    });
    const [appliedFilters, setAppliedFilters] = useState<{ type: string[]; material: string[] }>(filters);
    const [priceRange, setPriceRange] = useState(5000);
    const [appliedPriceRange, setAppliedPriceRange] = useState(priceRange);
    const [sortBy, setSortBy] = useState<"newest" | "popular" | "price-low" | "price-high">("newest");

    useEffect(() => {
        const loadLocal = () => {
            setLocalPublished(
                getLocalPublishedListings("furniture").map((listing) => ({
                    id: listing.id,
                    title: listing.name,
                    author: listing.description,
                    price: listing.price.toFixed(2),
                    type: listing.tags?.[0] || "User Listing",
                    material: listing.currency,
                    image: listing.images?.[0]?.url || "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop",
                    listingId: listing.id,
                }))
            )
        }

        loadLocal()
        window.addEventListener("listings-changed", loadLocal)
        return () => window.removeEventListener("listings-changed", loadLocal)
    }, [])

    const toggleFilter = (type: "type" | "material", value: string) => {
        setFilters((prev) => {
            const exists = prev[type].includes(value);

            return {
                ...prev,
                [type]: exists
                    ? prev[type].filter((v) => v !== value) // remove
                    : [...prev[type], value], // add
            };
        });
    };

    const products = [
        {
            id: 1,
            title: "Aeron-Style Task Chair",
            author: "Sustainable Mesh • 8-Point Adjustment",
            price: "Rs. 549.00",
            type: "Seating",
            material: "Fabric",
            image:
                "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=1200&auto=format&fit=crop",
            featured: true,
            colors: ["#334155", "#CBD5E1"],
        },
        {
            id: 2,
            title: "Scandi Oak Workstation",
            author: "Solid White Oak • Integrated Power",
            price: "Rs. 1,290.00",
            type: "Desks",
            material: "Wood",
            image:
                "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
            colors: ["#F8F1E5", "#8B5E3C"],
        },
        {
            id: 3,
            title: "Helix Brass Floor Lamp",
            author: "Brushed Brass • Smart Dimmer",
            price: "Rs. 245.00",
            type: "Lighting",
            material: "Metal",
            image:
                "https://images.squarespace-cdn.com/content/v1/65cabb74f8143c0156bd41ce/6567cdd4-09c3-4386-b508-c95cfe6dad8f/Helix+Floor+Pink_20130729444_extended+background-web.jpg",
            colors: ["#B8860B", "#F5F1E0"],
        },
        {
            id: 4,
            title: "Orbital Side Table",
            author: "Walnut Veneer • Silent Glide Drawer",
            price: "Rs. 180.00",
            type: "Storage",
            material: "Wood",
            image:
                "https://tomschneider.co.uk/cdn/shop/files/Orbitbedside_table_Walnut_tom_schneider-04_7dee3cef-25e5-4063-b6d1-7858656d82b8.jpg?v=1723189476",
            colors: ["#7C3AED", "#F1E9D2"],
        },
        {
            id: 5,
            title: "Velvet Lounge Shell",
            author: "Emerald Performance Velvet • Gold Legs",
            price: "Rs. 890.00",
            type: "Seating",
            material: "Fabric",
            image:
                "https://5.imimg.com/data5/SELLER/Default/2024/7/438972460/XQ/AD/SD/8956285/image-0901-500x500.jpg",
            colors: ["#134E4A", "#FDE68A"],
        },
        {
            id: 6,
            title: "Industrial Grid Bookshelf",
            author: "Powder-Coated Steel • Modular",
            price: "Rs. 420.00",
            type: "Storage",
            material: "Metal",
            image:
                "https://modernindustrialfurniture.com/cdn/shop/files/IMG_2440-SQ-1080_1080x.jpg?v=1771212803",
            colors: ["#262626", "#D4D4D8"],
        },
    ];

    const filteredProducts = products.filter((product) => {
        const price = parsePrice(product.price);
        const matchesType = appliedFilters.type.length === 0 || appliedFilters.type.includes(product.type || "");
        const matchesMaterial = appliedFilters.material.length === 0 || appliedFilters.material.includes(product.material || "");
        const matchesPalette =
            palette.length === 0 ||
            (product.colors?.some((color: string) => palette.includes(color.toLowerCase())) ?? false);

        return price <= appliedPriceRange && matchesType && matchesMaterial && matchesPalette;
    });

    const displayProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === "popular") {
            const aRating = (a as any).rating || 0;
            const bRating = (b as any).rating || 0;
            return bRating - aRating;
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

            <div className="max-w-7xl mx-auto">

                {localPublished.length > 0 && (
                    <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Your published furniture</p>
                                <h2 className="text-2xl font-semibold text-gray-900">Live furniture listings</h2>
                            </div>
                            <Link to="/my-listings" className="text-sm font-medium text-[var(--primary-color)] hover:text-[var(--primary-color)]">
                                Manage drafts & published items
                            </Link>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {localPublished.map((product) => (
                                <div key={product.id} className="rounded-3xl border border-gray-200 overflow-hidden">
                                    <img src={product.image} alt={product.title} className="h-44 w-full object-cover" />
                                    <div className="p-4">
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Your listing</p>
                                        <h3 className="mt-2 text-lg font-semibold text-gray-900">{product.title}</h3>
                                        <div className="mt-2 text-sm text-gray-600 line-clamp-2">{product.author}</div>
                                        <div className="mt-4 flex items-center justify-between gap-4">
                                            <span className="text-base font-bold text-gray-900">Rs. {product.price}</span>
                                            <Link to={`/listings/${product.listingId}`} className="text-sm font-semibold text-[var(--primary-color)]">
                                                View listing
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Mobile Filter Button */}
                <div className="lg:hidden mb-6">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setShowFilters(true)}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                    </Button>
                </div>

                <div className="flex gap-6">

                    {/* Mobile Overlay */}
                    {showFilters && (
                        <div
                            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                            onClick={() => setShowFilters(false)}
                        />
                    )}

                    {/* Sidebar */}
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

                        {/* Mobile Header */}
                        <div className="flex items-center justify-between mb-8 lg:hidden">
                            <h1 className="text-xl font-semibold">
                                Filters
                            </h1>

                            <button onClick={() => setShowFilters(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Desktop Header */}
                        <h1 className="hidden lg:block text-2xl font-semibold text-gray-900 mb-8">
                            Filters
                        </h1>



                        <div className="space-y-8">
                            <FilterSection title="Genre">
                                {["Desks", "Seating", "Lighting", "Storage"].map((item) => (
                                    <FilterCheckbox
                                        key={item}
                                        label={item}
                                        checked={filters.type.includes(item)}
                                        onChange={() => toggleFilter("type", item)}
                                    />
                                ))}
                            </FilterSection>

                            <FilterSection title="Material">
                                {["Wood", "Metal", "Fabric"].map((item) => (
                                    <FilterCheckbox
                                        key={item}
                                        label={item}
                                        checked={filters.material.includes(item)}
                                        onChange={() => toggleFilter("material", item)}
                                    />
                                ))}
                            </FilterSection>

                            <FilterSection title="Price Range">
                                <div className="pt-2">
                                    <input
                                        type="range"
                                        min={50}
                                        max={5000}
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(Number(e.target.value))}
                                        className="w-full accent-(--primary-color)"
                                    />

                                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                                        <span>Rs. 50</span>
                                        <span>Rs. 5,000+</span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-700">Showing up to Rs. {priceRange}</div>

                                    <button
                                        className="w-full mt-6 py-3 rounded-xl text-white font-medium"
                                        style={{
                                            backgroundColor: "var(--primary-color)"
                                        }}
                                        onClick={() => {
                                            setAppliedFilters(filters);
                                            setAppliedPriceRange(priceRange);
                                            setShowFilters(false);
                                        }}
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </FilterSection>
                        </div>
                    </aside>

                    {/* Content */}
                    <main className="flex-1 min-w-0">

                        {/* Top Bar */}
                        <div className="bg-white rounded-xl py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <p className="text-sm text-gray-500">
                                {paletteActive ? "Showing products matched to your palette" : `Showing ${displayProducts.length} premium titles`}
                            </p>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="text-sm text-gray-500 whitespace-nowrap">
                                    Sort by:
                                </span>

                                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                                    <SelectTrigger className="w-full sm:w-52">
                                        <SelectValue placeholder="Sort" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="newest">
                                            Newest Arrivals
                                        </SelectItem>

                                        <SelectItem value="popular">
                                            Most Popular
                                        </SelectItem>

                                        <SelectItem value="price-low">
                                            Price: Low to High
                                        </SelectItem>

                                        <SelectItem value="price-high">
                                            Price: High to Low
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {displayProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-12">
                            <Button
                                variant="outline"
                                size="icon"
                                className="bg-white"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <Button className="bg-(--primary-color) hover:bg-(--primary-color)/90 text-white w-9 h-9">
                                1
                            </Button>

                            <Button variant="ghost" className="w-9 h-9">
                                2
                            </Button>

                            <Button variant="ghost" className="w-9 h-9">
                                3
                            </Button>

                            <span className="text-gray-400 px-1">
                                ...
                            </span>

                            <Button
                                variant="outline"
                                size="icon"
                                className="bg-white"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}

export default Furniture