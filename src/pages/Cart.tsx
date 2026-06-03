import { ArrowLeft, ArrowRight, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState } from "react";

type SavedItem = {
    id: number | string;
    title: string;
    description: string;
    price: string;
    image: string;
};

const VALID_PROMO_CODES: Record<string, number> = {
    "SECONDSYNC2025": 15,
};

export default function Cart() {
    const navigate = useNavigate();
    const { cart, removeFromCart, updateQuantity, addToCart } = useCart();

    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [promoInput, setPromoInput] = useState("");
    const [appliedDiscount, setAppliedDiscount] = useState(0);
    const [promoError, setPromoError] = useState("");
    const [promoSuccess, setPromoSuccess] = useState("");
    const [promoApplied, setPromoApplied] = useState(false);

    const parsePrice = (price: string) => {
        const cleaned = price.replace(/[^0-9,\.]/g, "");
        const noComma = cleaned.replace(/,/g, "");
        return parseFloat(noComma) || 0;
    };

    const subtotal = cart.reduce((sum, item) => {
        return sum + parsePrice(item.price) * item.quantity;
    }, 0);

    const discount = (subtotal * appliedDiscount) / 100;
    const tax = (subtotal - discount) * 0.08;
    const total = subtotal - discount + tax;

    const handleSaveForLater = (id: number | string) => {
        const item = cart.find(i => i.id === id);
        if (!item) return;
        setSavedItems(prev => [...prev, { ...item }]);
        removeFromCart(id);
    };

    const handleMoveToCart = (item: SavedItem) => {
        addToCart({ ...item });
        setSavedItems(prev => prev.filter(i => i.id !== item.id));
    };

    const handleRemoveSaved = (id: number | string) => {
        setSavedItems(prev => prev.filter(i => i.id !== id));
    };

    const handleApplyPromo = () => {
        const code = promoInput.trim().toUpperCase();
        if (promoApplied) return;
        if (VALID_PROMO_CODES[code]) {
            setAppliedDiscount(VALID_PROMO_CODES[code]);
            setPromoSuccess(`${VALID_PROMO_CODES[code]}% discount applied!`);
            setPromoError("");
            setPromoApplied(true);
        } else {
            setPromoError("Invalid promo code. Please try again.");
            setPromoSuccess("");
        }
    };

    return (
        <div className="w-full min-h-screen pt-8 sm:pt-12 px-4 sm:px-6 xl:px-0">
            <h1 className="text-3xl sm:text-4xl font-semibold mb-8">Your Cart</h1>

            {cart.length === 0 && savedItems.length === 0 ? (
                <div className="text-center py-24 text-gray-400">
                    <p className="text-lg">Your cart is empty.</p>
                    <button
                        onClick={() => navigate("/laptops")}
                        className="mt-4 text-sm text-(--primary-color) underline"
                    >
                        Continue Shopping
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-2 space-y-4">

                        {cart.map(item => (
                            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                                    <div className="flex flex-col sm:flex-row items-start gap-4">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full sm:w-28 h-52 sm:h-28 object-cover rounded-xl"
                                        />
                                        <div className="min-w-0">
                                            <h2 className="font-medium text-lg">{item.title}</h2>
                                            <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                                            <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                                <button
                                                    className="text-red-500"
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    Remove
                                                </button>
                                                <button
                                                    className="text-gray-500 flex items-center gap-1"
                                                    onClick={() => handleSaveForLater(item.id)}
                                                >
                                                    <Bookmark size={13} />
                                                    Save for later
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="px-2 py-1 border rounded"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            >
                                                -
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button
                                                className="px-2 py-1 border rounded"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <p className="text-lg font-medium">
                                            Rs. {(parsePrice(item.price) * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {savedItems.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                    Saved for Later ({savedItems.length})
                                </h2>
                                <div className="space-y-4">
                                    {savedItems.map(item => (
                                        <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                                    <img
                                                        src={item.image}
                                                        alt={item.title}
                                                        className="w-full sm:w-28 h-52 sm:h-28 object-cover rounded-xl"
                                                    />
                                                    <div className="min-w-0">
                                                        <h2 className="font-medium text-lg">{item.title}</h2>
                                                        <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                                                        <p className="text-lg font-medium mt-2">{item.price}</p>
                                                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                                            <button
                                                                className="text-red-500"
                                                                onClick={() => handleRemoveSaved(item.id)}
                                                            >
                                                                Remove
                                                            </button>
                                                            <button
                                                                className="text-(--primary-color) font-medium"
                                                                onClick={() => handleMoveToCart(item)}
                                                            >
                                                                Move to Cart
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => navigate("/laptops")}
                            className="mt-2 text-sm cursor-pointer text-(--primary-color) flex items-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Continue Shopping
                        </button>
                    </div>

                    <div className="bg-white border border-gray-100 p-6 rounded-2xl h-fit sticky top-6">
                        <h2 className="text-xl font-semibold mb-5">Order Summary</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>Rs. {subtotal.toFixed(2)}</span>
                            </div>
                            {appliedDiscount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount ({appliedDiscount}%)</span>
                                    <span>- Rs. {discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Estimated Shipping</span>
                                <span className="text-green-600">FREE</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (8%)</span>
                                <span>Rs. {tax.toFixed(2)}</span>
                            </div>
                        </div>
                        <hr className="my-5" />
                        <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span>Rs. {total.toFixed(2)}</span>
                        </div>

                        <button
                            className="mt-6 w-full py-3 flex items-center justify-center gap-2 rounded-xl text-white"
                            style={{ backgroundColor: "var(--primary-color)" }}
                        >
                            Proceed to Checkout
                            <ArrowRight size={16} />
                        </button>

                        <p className="text-xs text-gray-500 mt-3 text-center leading-relaxed">
                            Taxes and shipping calculated at final step of checkout.
                        </p>

                        <div className="mt-6">
                            <label className="text-sm font-medium">Promo Code</label>
                            {!promoApplied ? (
                                <div className="flex mt-2">
                                    <input
                                        type="text"
                                        placeholder="Enter code"
                                        value={promoInput}
                                        onChange={e => {
                                            setPromoInput(e.target.value);
                                            setPromoError("");
                                        }}
                                        className="flex-1 border px-3 py-2 rounded-l-md outline-none text-sm"
                                    />
                                    <button
                                        onClick={handleApplyPromo}
                                        className="px-4 bg-gray-200 rounded-r-md text-sm hover:bg-gray-300"
                                    >
                                        Apply
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-2 text-sm text-green-600 font-medium">
                                    ✓ Promo code applied
                                </div>
                            )}
                            {promoError && (
                                <p className="text-red-500 text-xs mt-1">{promoError}</p>
                            )}
                            {promoSuccess && (
                                <p className="text-green-600 text-xs mt-1">{promoSuccess}</p>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-gray-500 mt-5">
                            <span>Secure Payment</span>
                            <span>Free Delivery</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}