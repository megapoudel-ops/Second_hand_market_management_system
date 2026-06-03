import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
    const navigate = useNavigate();

    return (
        <div className="w-full min-h-screen pt-8 sm:pt-12 px-4 sm:px-6 xl:px-0">

            <h1 className="text-3xl sm:text-4xl font-semibold mb-8">
                Your Cart
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Item 1 */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-5">

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

                            {/* Left */}
                            <div className="flex flex-col sm:flex-row items-start gap-4">

                                <img
                                    src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop"
                                    alt="MacBook"
                                    className="w-full sm:w-28 h-52 sm:h-28 object-cover rounded-xl"
                                />

                                <div className="min-w-0">
                                    <h2 className="font-medium text-lg">
                                        MacBook Pro 14" (2023)
                                    </h2>

                                    <p className="text-gray-500 text-sm mt-1">
                                        Silver • 512GB SSD • 16GB RAM
                                    </p>

                                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                        <button className="text-red-500">
                                            Remove
                                        </button>

                                        <button className="text-gray-500">
                                            Save for later
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">

                                <div className="flex items-center gap-2">
                                    <button className="px-2 py-1 border rounded">
                                        -
                                    </button>

                                    <span>1</span>

                                    <button className="px-2 py-1 border rounded">
                                        +
                                    </button>
                                </div>

                                <p className="text-lg font-medium">
                                    Rs. 1,899.00
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Item 2 */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-5">

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

                            {/* Left */}
                            <div className="flex flex-col sm:flex-row items-start gap-4">

                                <img
                                    src="https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1200&auto=format&fit=crop"
                                    alt="Chair"
                                    className="w-full sm:w-28 h-52 sm:h-28 object-cover rounded-xl"
                                />

                                <div className="min-w-0">
                                    <h2 className="font-medium text-lg">
                                        Herman Miller Aeron
                                    </h2>

                                    <p className="text-gray-500 text-sm mt-1">
                                        Graphite • Size B • Renewed
                                    </p>

                                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                        <button className="text-red-500">
                                            Remove
                                        </button>

                                        <button className="text-gray-500">
                                            Save for later
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">

                                <div className="flex items-center gap-2">
                                    <button className="px-2 py-1 border rounded">
                                        -
                                    </button>

                                    <span>2</span>

                                    <button className="px-2 py-1 border rounded">
                                        +
                                    </button>
                                </div>

                                <p className="text-lg font-medium">
                                    Rs. 1,350.00
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Continue Shopping */}
                    <button
                        onClick={() => navigate("/laptops")}
                        className="mt-2 text-sm cursor-pointer text-(--primary-color) flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Continue Shopping
                    </button>
                </div>

                {/* Order Summary */}
                <div className="bg-white border border-gray-100 p-6 rounded-2xl h-fit sticky top-6">

                    <h2 className="text-xl font-semibold mb-5">
                        Order Summary
                    </h2>

                    <div className="space-y-3 text-sm">

                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>Rs. 3,249.00</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Estimated Shipping</span>

                            <span className="text-green-600">
                                FREE
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>Tax</span>
                            <span>Rs. 268.05</span>
                        </div>
                    </div>

                    <hr className="my-5" />

                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>Rs. 3,517.05</span>
                    </div>

                    <button
                        className="mt-6 w-full py-3 flex items-center justify-center gap-2 rounded-xl text-white"
                        style={{
                            backgroundColor: "var(--primary-color)"
                        }}
                    >
                        Proceed to Checkout

                        <ArrowRight size={16} />
                    </button>

                    <p className="text-xs text-gray-500 mt-3 text-center leading-relaxed">
                        Taxes and shipping calculated at final step of checkout.
                    </p>

                    {/* Promo */}
                    <div className="mt-6">

                        <label className="text-sm font-medium">
                            Promo Code
                        </label>

                        <div className="flex mt-2">
                            <input
                                type="text"
                                placeholder="Enter code"
                                className="flex-1 border px-3 py-2 rounded-l-md outline-none text-sm"
                            />

                            <button className="px-4 bg-gray-200 rounded-r-md text-sm">
                                Apply
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-gray-500 mt-5">
                        <span>Secure Payment</span>
                        <span>Free Delivery</span>
                    </div>
                </div>
            </div>
        </div>
    );
}``