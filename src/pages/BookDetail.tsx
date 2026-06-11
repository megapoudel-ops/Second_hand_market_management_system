import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useCart } from "../context/CartContext";

export default function BookDetail() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const product = state?.product;

    if (!product) {
        navigate("/books");
        return null;
    }

    const handleSellerChat = () => {
        navigate(`/messages?contactId=seller-${encodeURIComponent(product.id)}&contactName=${encodeURIComponent(product.sellerName || "Seller")}`);
    };

    const handleAddToCart = () => {
        addToCart({
            id: product.id,
            title: product.title,
            description: product.author,
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
        { label: "FORMAT", value: "Hardcover" },
        { label: "LANGUAGE", value: "English" },
        { label: "PAGES", value: "320" },
        { label: "PUBLISHER", value: "Penguin Business" },
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

            {/* Back Button */}
            <button
                onClick={() => navigate("/books")}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Books
            </button>

            <div className="grid md:grid-cols-2 gap-10 bg-white rounded-2xl p-8 shadow-sm">

                {/* Left - Image */}
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
                        {product.title}
                    </h1>
                    <p className="text-gray-500 mt-1">by {product.author}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSellerChat}
                            className="text-sm font-semibold text-[var(--primary-color)] hover:text-[var(--primary-color)]"
                        >
                            Seller: {product.sellerName || "Marketplace Seller"}
                        </button>
                        {product.sellerEmail && (
                            <a
                                href={`mailto:${product.sellerEmail}`}
                                className="text-sm text-gray-500 hover:underline"
                            >
                                {product.sellerEmail}
                            </a>
                        )}
                    </div>

                    <p className="text-4xl font-bold text-gray-900 mt-6">
                        Rs. {product.price.replace(/[^0-9.]/g, "")}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--primary-color)" }}>
                        Inclusive of all taxes
                    </p>

                    {/* Buttons */}
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

                    {/* Specs Table */}
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

            {/* Product Description */}
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

            {/* Bottom Cards */}
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