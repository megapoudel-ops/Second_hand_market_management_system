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
    checked = false
}: {
    label: String,
    checked?: boolean
}) {
    return (
        <div className="flex items-center gap-3">
            <Checkbox checked={checked} />

            <label className="text-sm text-gray-600 cursor-pointer">
                {label}
            </label>
        </div>
    );
}

const Furniture = () => {
    const [showFilters, setShowFilters] = useState(false);


    const products = [
        {
            id: 1,
            title: "Aeron-Style Task Chair",
            author: "Sustainable Mesh • 8-Point Adjustment",
            price: "Rs. 549.00",
            image:
                "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=1200&auto=format&fit=crop",
            featured: true,
        },
        {
            id: 2,
            title: "Scandi Oak Workstation",
            author: "Solid White Oak • Integrated Power",
            price: "Rs. 1,290.00",
            image:
                "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
        },
        {
            id: 3,
            title: "Helix Brass Floor Lamp",
            author: "Brushed Brass • Smart Dimmer",
            price: "Rs. 245.00",
            image:
                "https://images.squarespace-cdn.com/content/v1/65cabb74f8143c0156bd41ce/6567cdd4-09c3-4386-b508-c95cfe6dad8f/Helix+Floor+Pink_20130729444_extended+background-web.jpg",
        },
        {
            id: 4,
            title: "Orbital Side Table",
            author: "Walnut Veneer • Silent Glide Drawer",
            price: "Rs. 180.00",
            image:
                "https://tomschneider.co.uk/cdn/shop/files/Orbitbedside_table_Walnut_tom_schneider-04_7dee3cef-25e5-4063-b6d1-7858656d82b8.jpg?v=1723189476",
        },
        {
            id: 5,
            title: "Velvet Lounge Shell",
            author: "Emerald Performance Velvet • Gold Legs",
            price: "Rs. 890.00",
            image:
                "https://5.imimg.com/data5/SELLER/Default/2024/7/438972460/XQ/AD/SD/8956285/image-0901-500x500.jpg",
        },
        {
            id: 6,
            title: "Industrial Grid Bookshelf",
            author: "Powder-Coated Steel • Modular",
            price: "Rs. 420.00",
            image:
                "https://modernindustrialfurniture.com/cdn/shop/files/IMG_2440-SQ-1080_1080x.jpg?v=1771212803",
        },
    ];

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



                        <div className="space-y-8">

                            <FilterSection title="Type">
                                <FilterCheckbox label="Desks" />
                                <FilterCheckbox label="Seating" checked />
                                <FilterCheckbox label="Lighting" />
                                <FilterCheckbox label="Storage" />
                            </FilterSection>

                            <FilterSection title="Material">
                                <FilterCheckbox label="Wood" />
                                <FilterCheckbox label="Metal" />
                                <FilterCheckbox label="Fabric" />
                            </FilterSection>

                            <FilterSection title="Price Range">
                                <div className="pt-2">
                                    <input
                                        type="range"
                                        className="w-full accent-(--primary-color)"
                                    />

                                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                                        <span>Rs. 50</span>
                                        <span>Rs. 5,000+</span>
                                    </div>

                                    <button
                                        className="w-full mt-6 py-3 rounded-xl text-white font-medium"
                                        style={{
                                            backgroundColor: "var(--primary-color)"
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

export default Furniture