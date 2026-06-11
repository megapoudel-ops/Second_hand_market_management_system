import { Bot, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

type ProductCardProps = {
    product: {
        id: number | string;
        image: string;
        title: string;
        author: string;
        price: string;
        featured?: boolean;
    }
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanPrice = product.price.replace(/[^0-9.]/g, "");
        addToCart({
            id: product.id,
            title: product.title,
            description: product.author,
            price: cleanPrice,
            image: product.image,
        });
        navigate("/cart");
    };

    const handleCardClick = () => {
        navigate(`/books/${product.id}`, { state: { product } });
    };

    const handleAIDamageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate("/ai-damage-detection", {
            state: {
                productImage: product.image,
                productName: product.title,
            }
        });
    };

    return (
        <div
            onClick={handleCardClick}
            className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer"
        >
            <div className="relative">
                <img
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    className="h-72 w-full object-cover"
                />
                <button
                    type="button"
                    onClick={handleAIDamageClick}
                    className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-2 text-[var(--primary-color)] shadow-lg ring-1 ring-gray-200 hover:bg-white transition"
                    aria-label="Go to AI Damage Detection"
                >
                    <Bot className="h-4 w-4" />
                    <span className="text-[10px] font-semibold uppercase">AI</span>
                </button>
                {product.featured && (
                    <span className="absolute top-3 left-3 text-[10px] font-semibold tracking-wide bg-white text-[var(--primary-color)] px-2 py-1 rounded">
                        FEATURED
                    </span>
                )}
            </div>
            <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900">{product.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{product.author}</p>
                <div className="flex items-center justify-between mt-4">
                    <span className="text-[var(--primary-color)] font-medium">Rs. {product.price}</span>
                    <Button
                        className="bg-[var(--primary-color)] py-5 hover:opacity-90 text-white"
                        onClick={handleAddToCart}
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                    </Button>
                </div>
            </div>
        </div>
    );
}