import {
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    X
} from "lucide-react";

import { useState } from "react";

import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import ProductCard from "../components/Books/ProductCard";

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

    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        genre: ["Tech"], // default checked
        format: ["Paperback"],
    });

    const products = [
        {
            id: 1,
            title: "Atomic Habits",
            author: "James Clear",
            price: "Rs. 34.99",
            image:
                "https://cultivatewhatmatters.com/cdn/shop/articles/atomic-habits.jpg?v=1624827508",
            featured: true,
        },
        {
            id: 2,
            title: "The Art of Seduction",
            author: "Robert Green",
            price: "Rs. 89.00",
            image:
                "https://static-01.daraz.com.np/p/8e2dd76b6e94043075c53a7fca216779.jpg",
        },
        {
            id: 3,
            title: "The Art Of War",
            author: "Sun Tzu",
            price: "Rs. 28.50",
            image:
                "https://www.bookgeeks.in/wp-content/uploads/2022/11/The-Art-of-War-by-Sun-Tzu-Book.jpg",
        },
        {
            id: 4,
            title: "It Starts With US",
            author: "Colleen Hoover",
            price: "Rs. 45.00",
            image:
                "https://udreview.com/wp-content/uploads/2023/10/it-starts-with-us-EMILY-MATEJA-1024x683.jpeg",
        },
        {
            id: 5,
            title: "The Metamorphosis",
            author: "Franz Kafka",
            price: "Rs. 52.00",
            image:
                "https://mir-s3-cdn-cf.behance.net/project_modules/fs/3bac8717144475.562b65a5ad602.jpg",
        },
        {
            id: 6,
            title: "It Ends With US",
            author: "Colleen Hoover",
            price: "Rs. 19.99",
            image:
                "https://miro.medium.com/1*wNyDXngQmFzzfRcwS3CBKg.jpeg",
        },
    ];

    const toggleFilter = (type: "genre" | "format", value: string) => {
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

    return (
        <div className="min-h-screen py-6 px-4 sm:px-6 xl:px-0">

            <div className="max-w-7xl mx-auto">

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
                                        className="w-full accent-(--primary-color)"
                                    />

                                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                                        <span>Rs. 0</span>
                                        <span>Rs. 200+</span>
                                    </div>
                                </div>

                                <button
                                    className="w-full mt-6 py-3 rounded-xl text-white font-medium"
                                    style={{
                                        backgroundColor: "var(--primary-color)"
                                    }}
                                >
                                    Apply Filters
                                </button>
                            </FilterSection>
                        </div>
                    </aside>

                    {/* Content */}
                    <main className="flex-1 min-w-0">

                        {/* Top Bar */}
                        <div className="bg-white rounded-xl py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <p className="text-sm text-gray-500">
                                Showing 24 premium titles
                            </p>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="text-sm text-gray-500 whitespace-nowrap">
                                    Sort by:
                                </span>

                                <Select defaultValue="newest">
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
                            {products.map((product) => (
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

export default Books