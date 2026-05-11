import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import LaptopCard from "../components/Laptops/LaptopCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import Header from "../components/Header";

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

const Laptops = () => {
  const products = [
    {
      id: 1,
      title: 'MacBook Pro 14" M3',
      description: "16GB RAM, 512GB SSD - Space Black",
      price: "$1,999.00",
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Dell XPS 15 9530",
      description: "Core i9, 32GB RAM, RTX 4060",
      price: "$2,449.00",
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 3,
      title: "ASUS ROG Zephyrus G14",
      description: "Ryzen 9, 16GB, RTX 4070 - Eclipse Gray",
      price: "$1,699.00",
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 4,
      title: "Lenovo ThinkPad X1 Carbon",
      description: "Core i7, 32GB RAM, 1TB SSD",
      price: "$1,850.00",
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 5,
      title: "Razer Blade 16",
      description: "Dual-mode Mini-LED, RTX 4080",
      price: "$3,299.00",
      rating: 4.6,
      image:
        "https://images.unsplash.com/photo-1504707748692-419802cf939d?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 6,
      title: 'MacBook Air 15" M3',
      description: "8-core CPU, 10-core GPU, 256GB",
      price: "$1,299.00",
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen py-6">

      <Header
        title="Premium Laptops"
        subtitle="Discover synchronized performance and design."
      />

      <div className="mt-12 flex gap-6">

        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">
            Filters
          </h1>

          <div className="space-y-6">
            <FilterSection title="Brand">
              <FilterCheckbox label="Apple" />
              <FilterCheckbox label="Dell" checked />
              <FilterCheckbox label="Lenovo" />
              <FilterCheckbox label="ASUS" />
            </FilterSection>

            <FilterSection title="Price Range">
              <div className="pt-2">
                <input
                  type="range"
                  className="w-full accent-(--primary-color)"
                />

                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>$500</span>
                  <span>$5,000+</span>
                </div>
              </div>
            </FilterSection>

            <FilterSection title="Processor">
              <FilterCheckbox label="Intel Core i5" />
              <FilterCheckbox label="Intel Core i7" checked />
              <FilterCheckbox label="Apple M3 Pro" />
            </FilterSection>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1">

          {/* Top Bar */}
          <div className="bg-white rounded-xl px-6 py-4 flex items-center justify-between mb-6">
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
              <LaptopCard key={product.id} product={product} />
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

            <Button className="text-white w-9 h-9">
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

export default Laptops