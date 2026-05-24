import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import LaptopCard from "../components/Laptops/LaptopCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Header from "../components/Header";
import { useState, useEffect } from "react";

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
  checked = false,
}: {
  label: String;
  checked?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox checked={checked} />
      <label className="text-sm text-gray-600 cursor-pointer">{label}</label>
    </div>
  );
}

const AD_API_URL = import.meta.env.VITE_AD_API_URL

const Laptops = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
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
      .catch(() => setLoading(false))
  }, [])

  const fallbackProducts = [
    {
      id: 1,
      title: 'MacBook Pro 14" M3',
      description: "16GB RAM, 512GB SSD - Space Black",
      price: "1999.00",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Dell XPS 15 9530",
      description: "Core i9, 32GB RAM, RTX 4060",
      price: "2449.00",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 3,
      title: "ASUS ROG Zephyrus G14",
      description: "Ryzen 9, 16GB, RTX 4070 - Eclipse Gray",
      price: "1699.00",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 4,
      title: "Lenovo ThinkPad X1 Carbon",
      description: "Core i7, 32GB RAM, 1TB SSD",
      price: "1850.00",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 5,
      title: "Razer Blade 16",
      description: "Dual-mode Mini-LED, RTX 4080",
      price: "3299.00",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1504707748692-419802cf939d?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 6,
      title: 'MacBook Air 15" M3',
      description: "8-core CPU, 10-core GPU, 256GB",
      price: "1299.00",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop",
    },
  ]

  const displayProducts = products.length > 0 ? products.map((p: any) => ({
    id: p._id || p.id,
    title: p.name || p.title,
    description: p.description,
    price: `${p.price}`,
    rating: p.rating || 4.5,
    image: p.image || "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1200&auto=format&fit=crop"
  })) : fallbackProducts

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 xl:px-0">
      <Header
        title="Premium Laptops"
        subtitle="Discover synchronized performance and design."
      />

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
              <FilterCheckbox label="Apple" />
              <FilterCheckbox label="Dell" checked />
              <FilterCheckbox label="Lenovo" />
              <FilterCheckbox label="ASUS" />
            </FilterSection>

            <FilterSection title="Price Range">
              <div className="pt-2">
                <input type="range" className="w-full accent-(--primary-color)" />
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Rs. 500</span>
                  <span>Rs. 5,000+</span>
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

        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <p className="text-sm text-gray-500">
              {loading ? "Loading..." : `Showing ${displayProducts.length} products`}
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
              <Select defaultValue="newest">
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