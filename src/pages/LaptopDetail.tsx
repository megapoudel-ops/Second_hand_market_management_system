import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useCart } from "../context/CartContext";

export default function LaptopDetail() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const product = state?.product;

    if (!product) {
        navigate("/laptops");
        return null;
    }

    const handleSellerChat = () => {
        navigate(`/messages?contactId=seller-${encodeURIComponent(product.id)}&contactName=${encodeURIComponent(product.sellerName || "Seller")}`);
    };

    const handleAddToCart = () => {
        addToCart({
            id: product.id,
            title: product.title,
            description: product.description,
            price: product.price.replace(/[^0-9.]/g, ""),
            image: product.image,
        });
        navigate("/cart");
    };

    const handleBuyNow = () => {
        navigate("/payments", {
            state: {
                buyNow: true,
                product: {
                    id: product.id,
                    title: product.title,
                    price: product.price.replace(/[^0-9.]/g, ""),
                    image: product.image,
                }
            }
        });
    };

    const specs = (product.specs || product.specifications || [
        { label: "DISPLAY", value: "14.2-inch Liquid Retina XDR display" },
        { label: "PROCESSOR", value: "Apple M3 chip with 8-core CPU and 10-core GPU" },
        { label: "BATTERY LIFE", value: "Up to 22 hours Apple TV app movie playback" },
        { label: "GRAPHICS", value: "10-core GPU, Hardware-accelerated ray tracing" },
    ]).slice();

    const hasPalette = specs.some((spec: any) => spec.label === "Color Palette");
    if (!hasPalette && product.colors?.length) {
        specs.push({
            label: "Color Palette",
            value: product.colors.join(", "),
        });
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 max-w-6xl mx-auto">

            <button
                onClick={() => navigate("/laptops")}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Laptops
            </button>

            <div className="grid md:grid-cols-2 gap-10 bg-white rounded-2xl p-8 shadow-sm">

                {/* Left - Images */}
                <div>
                    <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-96 object-cover rounded-xl"
                    />
                    <div className="flex gap-3 mt-4">
                        <img
                            src={product.image}
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

                {/* Right - Details */}
                <div className="flex flex-col justify-between">
                    <div>
                        <span
                            className="text-xs font-semibold px-3 py-1 rounded-full"
                            style={{ backgroundColor: "#e6f4f1", color: "var(--primary-color)" }}
                        >
                            PRE-OWNED PREMIUM
                        </span>

                        <h1 className="text-3xl font-semibold text-gray-900 mt-4">
                            {product.title}
                        </h1>
                        <p className="text-gray-500 mt-1">{product.description}</p>

                        <p className="text-4xl font-bold text-gray-900 mt-6">
                            Rs. {product.price}
                        </p>
                        <p className="text-sm mt-1" style={{ color: "var(--primary-color)" }}>
                            Inclusive of all taxes
                        </p>

                        <div className="flex flex-col gap-3 mt-8">
                            <Button
                                className="w-full py-6 text-white text-base rounded-xl"
                                style={{ backgroundColor: "var(--primary-color)" }}
                                onClick={handleBuyNow}
                            >
                                Buy Now
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full py-6 text-base rounded-xl"
                                onClick={handleAddToCart}
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
                                    {specs.map((spec: any, idx: number) => (
                                        <tr key={(spec.label || idx) + idx} className="border-t border-gray-100">
                                            <td className="px-4 py-3 text-gray-400 font-medium w-1/3">
                                                {spec.label}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{spec.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="text-2xl mb-3">✅</div>
                    <h4 className="font-semibold text-gray-800">Certified Quality</h4>
                    <p className="text-sm text-gray-500 mt-2">
                        Every laptop undergoes a 50-point technical inspection by our certified specialists.
                    </p>
                </div>
                <div
                    className="rounded-2xl p-6 shadow-sm text-white"
                    style={{ backgroundColor: "var(--primary-color)" }}
                >
                    <div className="text-2xl mb-3">♻️</div>
                    <h4 className="font-semibold">Sustainability First</h4>
                    <p className="text-sm mt-2 text-white/80">
                        Buying pre-owned saves up to 80% of the carbon emissions compared to manufacturing a new device.
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="text-2xl mb-3">⚡</div>
                    <h4 className="font-semibold text-gray-800">Peak Performance</h4>
                    <p className="text-sm text-gray-500 mt-2">
                        Equipped with the latest M3 architecture for seamless multitasking and professional workflows.
                    </p>
                </div>
            </div>
        </div>
    );
}