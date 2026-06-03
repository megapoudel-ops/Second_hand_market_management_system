import { ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

type LaptopCardProps = {
    product: {
        id: number | string;
        image: string;
        title: string;
        description: string;
        price: string;
        featured?: boolean;
    }
}

export default function LaptopCard({ product }: LaptopCardProps) {
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const handleAddToCart = () => {
        addToCart({
            id: product.id,
            title: product.title,
            description: product.description,
            price: product.price,
            image: product.image,
        });
        navigate("/cart");
    };

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
                <h3 className="text-sm font-medium text-gray-900">{product.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                <div className="flex items-center justify-between mt-4">
                    <span className="font-medium">Rs. {product.price}</span>
                    <Button className="py-5 text-white" onClick={handleAddToCart}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                    </Button>
                </div>
            </div>
        </div>
    );
}