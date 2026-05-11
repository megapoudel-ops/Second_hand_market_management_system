import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import ProductCard from "../components/Books/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

function FilterSection({ title, children }: { title: String, children: React.ReactNode }) {
    return (
        <div className="pb-6 border-b border-gray-200">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                {title}
            </h3>

            <div className="space-y-3">{children}</div>
        </div>
    );
}

function FilterCheckbox({ label, checked = false }: { label: String, checked?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <Checkbox checked={checked} />

            <label className="text-sm text-gray-600 cursor-pointer">
                {label}
            </label>
        </div>
    );
}

const Books = () => {
    const products = [
        {
            id: 1,
            title: "The Minimalist Mindset",
            author: "Elena Vance",
            price: "$34.99",
            image:
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
            featured: true,
        },
        {
            id: 2,
            title: "Fluid Architecture",
            author: "Marcus Thorne",
            price: "$89.00",
            image:
                "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop",
        },
        {
            id: 3,
            title: "Systems of Nature",
            author: "Dr. Sarah Laine",
            price: "$28.50",
            image:
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop",
        },
        {
            id: 4,
            title: "Digital Design Ethos",
            author: "Julian Wright",
            price: "$45.00",
            image:
                "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop",
        },
        {
            id: 5,
            title: "The Art of Negotiation",
            author: "Robert Sterling",
            price: "$52.00",
            image:
                "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800&auto=format&fit=crop",
        },
        {
            id: 6,
            title: "Future Education",
            author: "Clara Moss",
            price: "$19.99",
            image:
                "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop",
        },
    ];

    return (
        <div className="min-h-screen py-6">
            <div className="max-w-7xl mx-auto flex gap-6">

                {/* Sidebar */}
                <aside className="w-64 shrink-0">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-8">
                        Filters
                    </h1>

                    <div className="space-y-6">
                        <FilterSection title="Genre">
                            <FilterCheckbox label="Fiction" />
                            <FilterCheckbox label="Tech" checked />
                            <FilterCheckbox label="Business" />
                            <FilterCheckbox label="Arts" />
                        </FilterSection>

                        <FilterSection title="Format">
                            <FilterCheckbox label="Hardcover" />
                            <FilterCheckbox label="Paperback" checked />
                            <FilterCheckbox label="E-book" />
                        </FilterSection>

                        <FilterSection title="Price Range">
                            <div className="pt-2">
                                <input
                                    type="range"
                                    className="w-full accent-(--primary-color)"
                                />

                                <div className="flex justify-between mt-2 text-xs text-gray-500">
                                    <span>$0</span>
                                    <span>$200+</span>
                                </div>
                            </div>
                        </FilterSection>
                    </div>
                </aside>

                {/* Content */}
                <main className="flex-1">

                    {/* Top Bar */}
                    <div className="bg-white rounded-xl py-4 flex items-center justify-between mb-6">
                        <p className="text-sm text-gray-500">
                            Showing 24 premium titles
                        </p>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">Sort by:</span>

                            <Select defaultValue="newest">
                                <SelectTrigger className="w-45">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-2 mt-12">
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

                        <span className="text-gray-400 px-1">...</span>

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
    )
}

export default Books