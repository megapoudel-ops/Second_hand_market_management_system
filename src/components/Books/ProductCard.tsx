import { ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";

type ProductCardProps = {
    product: {
        image: string;
        title: string;
        author: string;
        price: string;
        featured?: boolean;
    }
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="relative">
                <img
                    src={product.image}
                    alt={product.title}
                    className="h-72 w-full object-cover"
                />

                {product.featured && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold tracking-wide bg-white text-(--primary-color) px-2 py-1 rounded">
                        FEATURED
                    </span>
                )}
            </div>

            <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900">
                    {product.title}
                </h3>

                <p className="text-sm text-gray-500 mt-1">{product.author}</p>

                <div className="flex items-center justify-between mt-4">
                    <span className="text-(--primary-color) font-medium">
                        {product.price}
                    </span>

                    <Button className="bg-(--primary-color) py-5 hover:bg-(--primary-color)/90 text-white">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                    </Button>
                </div>
            </div>
        </div>
    );
}
