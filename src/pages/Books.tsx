import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    ShoppingCart,
    SlidersHorizontal,
    X
} from "lucide-react";

import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getLocalPublishedListings } from "../lib/api";

import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
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

const Books = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const { addToCart } = useCart();

    const palette = new URLSearchParams(location.search)
        .get("palette")
        ?.split(",")
        .map((hex) => hex.trim().toLowerCase())
        .filter(Boolean) || [];
    const paletteActive = palette.length > 0;

    const [showFilters, setShowFilters] = useState(false);
    const [localPublished, setLocalPublished] = useState<any[]>([]);

    const [filters, setFilters] = useState<{ genre: string[]; format: string[] }>({
        genre: [],
        format: [],
    });
    const [appliedFilters, setAppliedFilters] = useState<{ genre: string[]; format: string[] }>(filters);
    const [priceRange, setPriceRange] = useState(200);
    const [appliedPriceRange, setAppliedPriceRange] = useState(200);
    const [sortBy, setSortBy] = useState<"newest" | "popular" | "price-low" | "price-high">("newest");
    const [editableSpecs, setEditableSpecs] = useState<{ [key: number]: { [key: string]: string } }>({});

    useEffect(() => {
        const loadLocal = () => {
            setLocalPublished(
                getLocalPublishedListings("books").map((listing) => ({
                    id: listing.id,
                    title: listing.name,
                    author: listing.description,
                    price: listing.price.toFixed(2),
                    genre: "User Listing",
                    format: listing.currency,
                    image: listing.images?.[0]?.url || "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop",
                    description: listing.description,
                    listingId: listing.id,
                }))
            )
        }

        loadLocal()
        window.addEventListener("listings-changed", loadLocal)
        return () => window.removeEventListener("listings-changed", loadLocal)
    }, [])

    const products = [
        {
            id: 1,
            title: "Atomic Habits",
            author: "James Clear",
            price: "34.99",
            genre: "Business",
            format: "Paperback",
            image: "https://cultivatewhatmatters.com/cdn/shop/articles/atomic-habits.jpg?v=1624827508",
            featured: true,
            colors: ["Primary #604020, Secondary #c0c0c0, Accent #a0a0a0, Neutral #808060, Complement #c0c0e0, Highlight #a0a080"],
            specs: [
                { label: "FORMAT", value: "Paperback" },
                { label: "LANGUAGE", value: "English" },
                { label: "PAGES", value: "320" },
                { label: "PUBLISHER", value: "Penguin Random House" },
                { label: "Color Palette", value: "Primary #604020, Secondary #c0c0c0, Accent #a0a0a0, Neutral #808060, Complement #c0c0e0, Highlight #a0a080" },
            ],
        },
        {
            id: 2,
            title: "The Art of Seduction",
            author: "Robert Green",
            price: "89.00",
            genre: "Business",
            format: "Hardcover",
            image: "https://static-01.daraz.com.np/p/8e2dd76b6e94043075c53a7fca216779.jpg",
            colors: ["Primary #103050, Secondary #002040, Accent #ff3070, Neutral #002050, Complement #ff2070, Highlight #a0a090, Color 7 #b0b0a0, Color 8 #b0a090"],
            specs: [
                { label: "FORMAT", value: "Hardcover" },
                { label: "LANGUAGE", value: "English" },
                { label: "PAGES", value: "448" },
                { label: "PUBLISHER", value: "Profile Books" },
                { label: "Color Palette", value: "Primary #103050, Secondary #002040, Accent #ff3070, Neutral #002050, Complement #ff2070, Highlight #a0a090, Color 7 #b0b0a0, Color 8 #b0a090" },
            ],
        },
        {
            id: 3,
            title: "The Art Of War",
            author: "Sun Tzu",
            price: "28.50",
            genre: "Arts",
            format: "Paperback",
            image: "https://www.bookgeeks.in/wp-content/uploads/2022/11/The-Art-of-War-by-Sun-Tzu-Book.jpg",
            colors: ["Primary #c03020, Secondary #b03020, Accent #a02020, Neutral #704030, Complement #b02020, Highlight #603020, Color 7 #701010, Color 8 #503020"],
            specs: [
                { label: "FORMAT", value: "Paperback" },
                { label: "LANGUAGE", value: "English" },
                { label: "PAGES", value: "128" },
                { label: "PUBLISHER", value: "Oxford" },
                { label: "Color Palette", value: "Primary #c03020, Secondary #b03020, Accent #a02020, Neutral #704030, Complement #b02020, Highlight #603020, Color 7 #701010, Color 8 #503020" },
            ],
        },
        {
            id: 4,
            title: "It Starts With US",
            author: "Colleen Hoover",
            price: "45.00",
            genre: "Fiction",
            format: "Hardcover",
            image: "https://udreview.com/wp-content/uploads/2023/10/it-starts-with-us-EMILY-MATEJA-1024x683.jpeg",
            colors: ["Primary #70e0f0, Secondary #90f0ff, Accent #b0b0c0, Neutral #40a0b0, Complement #60e0f0, Highlight #202020, Color 7 #a0f0ff, Color 8 #80e0f0"],
            specs: [
                { label: "FORMAT", value: "Hardcover" },
                { label: "LANGUAGE", value: "English" },
                { label: "PAGES", value: "384" },
                { label: "PUBLISHER", value: "Atria Books" },
                { label: "Color Palette", value: "Primary #70e0f0, Secondary #90f0ff, Accent #b0b0c0, Neutral #40a0b0, Complement #60e0f0, Highlight #202020, Color 7 #a0f0ff, Color 8 #80e0f0" },
            ],
        },
        {
            id: 5,
            title: "The Metamorphosis",
            author: "Franz Kafka",
            price: "52.00",
            genre: "Fiction",
            format: "Paperback",
            image: "https://mir-s3-cdn-cf.behance.net/project_modules/fs/3bac8717144475.562b65a5ad602.jpg",
            colors: ["Primary #c0c0c0, Secondary #b02020, Accent #e06060, Neutral #b0b0b0, Complement #d0d0d0, Highlight #e05050, Color 7 #c03030, Color 8 #e0e0e0"],
            specs: [
                { label: "FORMAT", value: "Paperback" },
                { label: "LANGUAGE", value: "English" },
                { label: "PAGES", value: "201" },
                { label: "PUBLISHER", value: "Vintage" },
                { label: "Color Palette", value: "Primary #c0c0c0, Secondary #b02020, Accent #e06060, Neutral #b0b0b0, Complement #d0d0d0, Highlight #e05050, Color 7 #c03030, Color 8 #e0e0e0" },
            ],
        },
        {
            id: 6,
            title: "It Ends With US",
            author: "Colleen Hoover",
            price: "19.99",
            genre: "Fiction",
            format: "Paperback",
            image: "https://miro.medium.com/1*wNyDXngQmFzzfRcwS3CBKg.jpeg",
            colors: ["Primary #f0e0d0, Secondary #e0d0c0, Accent #808080, Neutral #606060, Complement #909090, Highlight #707070, Color 7 #a0a0a0, Color 8 #803050"],
            specs: [
                { label: "FORMAT", value: "Paperback" },
                { label: "LANGUAGE", value: "English" },
                { label: "PAGES", value: "384" },
                { label: "PUBLISHER", value: "Atria Books" },
                { label: "Color Palette", value: "Primary #f0e0d0, Secondary #e0d0c0, Accent #808080, Neutral #606060, Complement #909090, Highlight #707070, Color 7 #a0a0a0, Color 8 #803050" },
            ],
        },
    ];

    const selectedId = params.id;
    const productFromState = (location.state as { product?: any })?.product;
    let selectedProduct =
        productFromState ||
        (selectedId ? products.find((product) => String(product.id) === selectedId) : undefined);

    // Apply editable specs to selected product
    if (selectedProduct && editableSpecs[selectedProduct.id]) {
        const editedSpecs = editableSpecs[selectedProduct.id];
        selectedProduct = {
            ...selectedProduct,
            specs: selectedProduct.specs?.map((spec: any) => ({
                ...spec,
                value: editedSpecs[spec.label] ?? spec.value,
            })) || [],
        };
    }

    const updateColorPalette = (productId: number, newValue: string) => {
        setEditableSpecs((prev) => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                "Color Palette": newValue,
            },
        }));
    };

    const filteredProducts = products.filter((product) => {
        const price = parsePrice(product.price);
        const matchesPrice = price <= appliedPriceRange;
        const matchesGenre =
            appliedFilters.genre.length === 0 || appliedFilters.genre.includes(product.genre || "");
        const matchesFormat =
            appliedFilters.format.length === 0 || appliedFilters.format.includes(product.format || "");
        const matchesPalette =
            palette.length === 0 ||
            (product.colors?.some((color: string) => palette.includes(color.toLowerCase())) ?? false);

        return matchesPrice && matchesGenre && matchesFormat && matchesPalette;
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

    const handleAddToCart = (product: any) => {
        addToCart({
            id: product.id,
            title: product.title,
            description: product.author,
            price: product.price.replace(/[^0-9.]/g, ""),
            image: product.image,
        });
        navigate("/cart");
    };

    const handleBuyNow = (product: any) => {
        navigate("/payments", {
            state: {
                buyNow: true,
                product: {
                    id: product.id,
                    title: product.title,
                    price: product.price.replace(/[^0-9.]/g, ""),
                    image: product.image,
                },
            },
        });
    };

    const toggleFilter = (type: "genre" | "format", value: string) => {
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

    if (selectedProduct) {
        return (
            <div className="min-h-screen bg-gray-50 px-4 py-8 max-w-6xl mx-auto">
                <button
                    onClick={() => navigate("/books")}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Books
                </button>

                <div className="grid md:grid-cols-2 gap-10 bg-white rounded-2xl p-8 shadow-sm">
                    <div>
                        <img
                            src={selectedProduct.image}
                            alt={selectedProduct.title}
                            className="w-full h-96 object-cover rounded-xl"
                        />
                        <div className="flex gap-3 mt-4">
                            <img
                                src={selectedProduct.image}
                                alt="thumb"
                                className="w-20 h-16 object-cover rounded-lg border-2 cursor-pointer"
                                style={{ borderColor: "var(--primary-color)" }}
                            />
                            <div className="w-20 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                                No image
                            </div>
                            <div className="w-20 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                                No image
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex gap-2">
                            <span
                                className="text-xs font-semibold px-3 py-1 rounded-full"
                                style={{ backgroundColor: "#e6f4f1", color: "var(--primary-color)" }}
                            >
                                PRE-OWNED PREMIUM
                            </span>
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                                Used: 6 months
                            </span>
                        </div>

                        <h1 className="text-3xl font-semibold text-gray-900 mt-4">
                            {selectedProduct.title}
                        </h1>
                        <p className="text-gray-500 mt-1">by {selectedProduct.author}</p>

                        <p className="text-4xl font-bold text-gray-900 mt-6">
                            Rs. {selectedProduct.price.replace(/[^0-9.]/g, "")}
                        </p>
                        <p className="text-sm mt-1" style={{ color: "var(--primary-color)" }}>
                            Inclusive of all taxes
                        </p>

                        <div className="flex flex-col gap-3 mt-8">
                            <Button
                                className="w-full py-6 text-white text-base rounded-xl"
                                style={{ backgroundColor: "var(--primary-color)" }}
                                onClick={() => {
                                    if (editableSpecs[selectedProduct.id]) {
                                        const updatedProduct = {
                                            ...selectedProduct,
                                            specs: selectedProduct.specs?.map((spec: any) => ({
                                                ...spec,
                                                value: editableSpecs[selectedProduct.id][spec.label] ?? spec.value,
                                            })) || [],
                                        };
                                        handleBuyNow(updatedProduct);
                                    } else {
                                        handleBuyNow(selectedProduct);
                                    }
                                }}
                            >
                                Buy Now
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full py-6 text-base rounded-xl"
                                onClick={() => {
                                    if (editableSpecs[selectedProduct.id]) {
                                        const updatedProduct = {
                                            ...selectedProduct,
                                            specs: selectedProduct.specs?.map((spec: any) => ({
                                                ...spec,
                                                value: editableSpecs[selectedProduct.id][spec.label] ?? spec.value,
                                            })) || [],
                                        };
                                        handleAddToCart(updatedProduct);
                                    } else {
                                        handleAddToCart(selectedProduct);
                                    }
                                }}
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Add to Cart
                            </Button>
                        </div>

                        <div className="mt-8 rounded-xl overflow-hidden border border-gray-100">
                            <div className="bg-gray-50 px-4 py-3">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Technical Specifications
                                </h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {(selectedProduct.specs || selectedProduct.specifications || [
                                        { label: "FORMAT", value: "Hardcover" },
                                        { label: "LANGUAGE", value: "English" },
                                        { label: "PAGES", value: "320" },
                                        { label: "PUBLISHER", value: "Penguin Business" },
                                    ]).map((spec: any, idx: number) => (
                                        <tr key={(spec.label || idx) + idx} className="border-t border-gray-100">
                                            <td className="px-4 py-3 text-gray-400 font-medium w-1/3">
                                                {spec.label}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {spec.label === "Color Palette" ? (
                                                    <input
                                                        type="text"
                                                        value={(editableSpecs[selectedProduct.id] && editableSpecs[selectedProduct.id]["Color Palette"]) || spec.value}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateColorPalette(selectedProduct.id, e.target.value)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-gray-700"
                                                        placeholder="Enter color palette"
                                                    />
                                                ) : (
                                                    spec.value
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm mt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Description</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Experience the transformative power of small changes with this book.
                        This used copy, carefully maintained for 6 months, offers the same
                        life-changing wisdom as a brand-new edition.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed mt-4">
                        Whether you're looking to break bad habits or build good ones, this book
                        offers practical strategies that work. This specific edition is in premium
                        pre-owned condition, ensuring a clean reading experience while supporting
                        a more sustainable book marketplace.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="text-2xl mb-3">✅</div>
                        <h4 className="font-semibold text-gray-800">Certified Quality</h4>
                        <p className="text-sm text-gray-500 mt-2">
                            Every book undergoes a thorough inspection by our curators to ensure a flawless reading experience.
                        </p>
                    </div>
                    <div
                        className="rounded-2xl p-6 shadow-sm text-white"
                        style={{ backgroundColor: "var(--primary-color)" }}
                    >
                        <div className="text-2xl mb-3">♻️</div>
                        <h4 className="font-semibold">Sustainability First</h4>
                        <p className="text-sm mt-2 text-white/80">
                            Buying pre-owned saves significant carbon emissions compared to printing and shipping new copies.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="text-2xl mb-3">📖</div>
                        <h4 className="font-semibold text-gray-800">Quick Insights</h4>
                        <p className="text-sm text-gray-500 mt-2">
                            Structured for easy digestion with actionable summaries at the end of every chapter.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-6 px-4 sm:px-6 xl:px-0">
            <div className="max-w-7xl mx-auto">
                {localPublished.length > 0 && (
                    <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Your published books</p>
                                <h2 className="text-2xl font-semibold text-gray-900">Your live book listings</h2>
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
                                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{product.description}</p>
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
                            <FilterSection title="Genre">
                                {["Fiction", "Tech", "Business", "Arts"].map((item) => (
                                    <FilterCheckbox
                                        key={item}
                                        label={item}
                                        checked={filters.genre.includes(item)}
                                        onChange={() => toggleFilter("genre", item)}
                                    />
                                ))}
                            </FilterSection>

                            <FilterSection title="Format">
                                {["Hardcover", "Paperback", "E-book"].map((item) => (
                                    <FilterCheckbox
                                        key={item}
                                        label={item}
                                        checked={filters.format.includes(item)}
                                        onChange={() => toggleFilter("format", item)}
                                    />
                                ))}
                            </FilterSection>

                            <FilterSection title="Price Range">
                                <div className="pt-2">
                                    <input
                                        type="range"
                                        min={0}
                                        max={200}
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(Number(e.target.value))}
                                        className="w-full accent-(--primary-color)"
                                    />
                                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                                        <span>Rs. 0</span>
                                        <span>Rs. 200+</span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-700">
                                        Showing up to Rs. {priceRange}
                                    </div>
                                </div>

                                <button
                                    className="w-full mt-6 py-3 rounded-xl text-white font-medium"
                                    style={{ backgroundColor: "var(--primary-color)" }}
                                    onClick={() => {
                                        setAppliedFilters(filters);
                                        setAppliedPriceRange(priceRange);
                                        setShowFilters(false);
                                    }}
                                >
                                    Apply Filters
                                </button>
                            </FilterSection>
                        </div>
                    </aside>

                    <main className="flex-1 min-w-0">
                        <div className="bg-white rounded-xl py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <p className="text-sm text-gray-500">
                                {paletteActive ? "Showing titles that best match your extracted palette" : `Showing ${displayProducts.length} premium titles`}
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
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 mt-12">
                            <Button variant="outline" size="icon" className="bg-white">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button className="bg-(--primary-color) hover:bg-(--primary-color)/90 text-white w-9 h-9">1</Button>
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
        </div>
    );
}

export default Books;