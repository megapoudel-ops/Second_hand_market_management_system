import { CheckCheck, MessageSquare, Tag, CheckCircle, Info } from "lucide-react";
import Header from "../components/Header";

export default function Notifications() {
    return (
        <div className="w-full min-h-screen py-8">
            <Header
                title="Notifications"
                subtitle="Stay updated with your latest activity and marketplace alerts."
            />

            <div className="mt-6 space-y-6">
                {/* Today */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-gray-500">TODAY</h3>
                        <button className="flex items-center gap-2 text-sm text-(--primary-color)">
                            <CheckCheck size={16} /> Mark all as read
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Price Drop */}
                        <div className="bg-white py-5 flex justify-between">
                            <div className="flex gap-4">
                                <Tag className="text-(--primary-color) p-3 bg-green-100 rounded-lg size-10" />
                                <div>
                                    <h4 className="font-medium">Price Drop Alert</h4>
                                    <p className="text-sm text-gray-500">
                                        The <span className="font-medium">MacBook Pro M2</span>{" "}
                                        you're watching just dropped by{" "}
                                        <span className="text-(--primary-color) font-medium">
                                            $150
                                        </span>
                                        .
                                    </p>
                                    <div className="flex gap-3 mt-3">
                                        <button className="px-4 py-1.5 rounded-md text-white text-sm"
                                            style={{ backgroundColor: "var(--primary-color)" }}
                                        >
                                            View Item
                                        </button>
                                        <button className="px-4 py-1.5 rounded-md border text-sm">
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400">2m ago</span>
                        </div>

                        {/* Message */}
                        <div className="bg-white py-5">
                            <div className="flex justify-between">
                                <div className="flex gap-4">
                                    <MessageSquare className="p-3 bg-blue-100 rounded-lg size-10" />
                                    <div>
                                        <h4 className="font-medium">New Message</h4>
                                        <p className="text-sm text-gray-500">
                                            Sarah Jenkins sent you a message regarding your{" "}
                                            <span className="font-medium">Eames Lounge Chair</span>{" "}
                                            listing.
                                        </p>
                                        <div className="bg-gray-100 rounded-md p-3 mt-3 text-sm text-gray-600">
                                            "Is the leather still in good condition or are there visible cracks?"
                                        </div>
                                        <button className="mt-3 px-4 py-1.5 bg-black text-white rounded-md text-sm">
                                            Reply Now
                                        </button>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">45m ago</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Yesterday */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 mb-3">
                        YESTERDAY
                    </h3>

                    <div className="space-y-4">
                        <div className="bg-white py-5 flex justify-between">
                            <div className="flex gap-4">
                                <CheckCircle className="size-10 p-3 bg-green-100 rounded-lg" />
                                <div>
                                    <h4 className="font-medium">Payment Successful</h4>
                                    <p className="text-sm text-gray-500">
                                        Your payment of <span className="font-medium">$45.00</span>{" "}
                                        for "Vintage Camera" has been processed successfully.
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400">Yesterday, 4:20 PM</span>
                        </div>

                        <div className="bg-white py-5 flex justify-between">
                            <div className="flex gap-4">
                                <Info className="size-10 p-3 bg-gray-200 rounded-lg" />
                                <div>
                                    <h4 className="font-medium">System Update</h4>
                                    <p className="text-sm text-gray-500">
                                        Second Sync v2.4 is now live. Check out the new asymmetric grid
                                        layouts for better product visibility.
                                    </p>
                                    <button className="text-sm mt-2 text-(--primary-color)">
                                        Read Release Notes
                                    </button>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400">Yesterday, 10:15 AM</span>
                        </div>

                        <div className="bg-white py-5 flex justify-between">
                            <div className="flex gap-4">
                                <Tag className="size-10 p-3 bg-orange-100 rounded-lg" />
                                <div>
                                    <h4 className="font-medium">You made a sale!</h4>
                                    <p className="text-sm text-gray-500">
                                        Your listing "Minimalist Oak Desk" was purchased by
                                        @curator_jane. Print your shipping label to continue.
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400">Nov 12, 2:45 PM</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mt-6">
                    <button className="px-6 py-2 border rounded-lg text-sm">
                        View all history
                    </button>
                </div>
            </div>
        </div>
    );
}
