import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
    const navigate = useNavigate();

    return (
        <div className="w-full min-h-screen pt-12">
            <h1 className="text-3xl font-semibold mb-6">Your Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Item 1 */}
                    <div className="p-5 rounded-2xl flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <img
                                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop"
                                alt="MacBook"
                                className="size-28 object-cover"
                            />
                            <div>
                                <h2 className="font-medium text-lg">
                                    MacBook Pro 14" (2023)
                                </h2>
                                <p className="text-gray-500 text-sm">
                                    Silver • 512GB SSD • 16GB RAM
                                </p>
                                <div className="flex gap-4 mt-2 text-sm">
                                    <button className="text-red-500">Remove</button>
                                    <button className="text-gray-500">Save for later</button>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2 mb-2">
                                <button className="px-2 border rounded">-</button>
                                <span>1</span>
                                <button className="px-2 border rounded">+</button>
                            </div>
                            <p className="text-lg font-medium">$1,899.00</p>
                        </div>
                    </div>

                    {/* Item 2 */}
                    <div className="p-5 rounded-2xl flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <img
                                src="https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1200&auto=format&fit=crop"
                                alt="Chair"
                                className="size-28 object-cover rounded"
                            />
                            <div>
                                <h2 className="font-medium text-lg">
                                    Herman Miller Aeron
                                </h2>
                                <p className="text-gray-500 text-sm">
                                    Graphite • Size B • Renewed
                                </p>
                                <div className="flex gap-4 mt-2 text-sm">
                                    <button className="text-red-500">Remove</button>
                                    <button className="text-gray-500">Save for later</button>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2 mb-2">
                                <button className="px-2 border rounded">-</button>
                                <span>2</span>
                                <button className="px-2 border rounded">+</button>
                            </div>
                            <p className="text-lg font-medium">$1,350.00</p>
                        </div>
                    </div>

                    {/* Continue Shopping */}
                    <button
                        onClick={() => navigate("/laptops")}
                        className="mt-4 text-sm cursor-pointer text-(--primary-color) flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Continue Shopping
                    </button>
                </div>

                {/* Order Summary */}
                <div className="bg-white p-6 rounded-2xl h-fit">
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>$3,249.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Estimated Shipping</span>
                            <span className="text-green-600">FREE</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax</span>
                            <span>$268.05</span>
                        </div>
                    </div>

                    <hr className="my-4" />

                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>$3,517.05</span>
                    </div>

                    <button className="mt-6 w-full py-3 flex items-center justify-center gap-2 rounded-xl text-white"
                        style={{ backgroundColor: "var(--primary-color)" }}
                    >
                        Proceed to Checkout
                        <ArrowRight size={16} className="ml-2" />
                    </button>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                        Taxes and shipping calculated at final step of checkout.
                    </p>

                    {/* Promo */}
                    <div className="mt-6">
                        <label className="text-sm">Promo Code</label>
                        <div className="flex mt-2">
                            <input
                                type="text"
                                placeholder="Enter code"
                                className="flex-1 border px-3 py-2 rounded-l-md outline-none"
                            />
                            <button className="px-4 bg-gray-200 rounded-r-md">
                                Apply
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 mt-4">
                        <span>Secure Payment</span>
                        <span>Free Delivery</span>
                    </div>
                </div>
            </div>
        </div>
    );
}