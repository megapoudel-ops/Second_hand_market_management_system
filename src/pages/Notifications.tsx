import {
    CheckCheck,
    MessageSquare,
    Tag,
    CheckCircle,
    Info
} from "lucide-react";

import Header from "../components/Header";

export default function Notifications() {
    return (
        <div className="w-full min-h-screen py-8 px-4 sm:px-6 xl:px-0">

            <Header
                title="Notifications"
                subtitle="Stay updated with your latest activity and marketplace alerts."
            />

            <div className="mt-8 space-y-8">

                {/* TODAY */}
                <div>

                    {/* Section Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 tracking-wide">
                            TODAY
                        </h3>

                        <button className="flex items-center gap-2 text-sm text-(--primary-color)">
                            <CheckCheck size={16} />
                            Mark all as read
                        </button>
                    </div>

                    <div className="space-y-4">

                        {/* Price Drop */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100">

                            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">

                                <div className="flex gap-4">
                                    <Tag className="text-(--primary-color) p-3 bg-green-100 rounded-xl size-12 shrink-0" />

                                    <div className="min-w-0">
                                        <h4 className="font-medium">
                                            Price Drop Alert
                                        </h4>

                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            The{" "}
                                            <span className="font-medium">
                                                MacBook Pro M2
                                            </span>{" "}
                                            you're watching just dropped by{" "}
                                            <span className="text-(--primary-color) font-medium">
                                                $150
                                            </span>.
                                        </p>

                                        <div className="flex flex-wrap gap-3 mt-4">
                                            <button
                                                className="px-4 py-2 rounded-md text-white text-sm"
                                                style={{
                                                    backgroundColor:
                                                        "var(--primary-color)"
                                                }}
                                            >
                                                View Item
                                            </button>

                                            <button className="px-4 py-2 rounded-md border text-sm">
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    2m ago
                                </span>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100">

                            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">

                                <div className="flex gap-4">
                                    <MessageSquare className="p-3 bg-blue-100 rounded-xl size-12 shrink-0" />

                                    <div className="min-w-0">
                                        <h4 className="font-medium">
                                            New Message
                                        </h4>

                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            Sarah Jenkins sent you a message
                                            regarding your{" "}
                                            <span className="font-medium">
                                                Eames Lounge Chair
                                            </span>{" "}
                                            listing.
                                        </p>

                                        <div className="bg-gray-100 rounded-md p-3 mt-4 text-sm text-gray-600 leading-relaxed">
                                            "Is the leather still in good
                                            condition or are there visible
                                            cracks?"
                                        </div>

                                        <button className="mt-4 px-4 py-2 bg-black text-white rounded-md text-sm">
                                            Reply Now
                                        </button>
                                    </div>
                                </div>

                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    45m ago
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* YESTERDAY */}
                <div>

                    <h3 className="text-xs font-semibold text-gray-500 tracking-wide mb-4">
                        YESTERDAY
                    </h3>

                    <div className="space-y-4">

                        {/* Payment */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100">

                            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">

                                <div className="flex gap-4">
                                    <CheckCircle className="size-12 p-3 bg-green-100 rounded-xl shrink-0" />

                                    <div className="min-w-0">
                                        <h4 className="font-medium">
                                            Payment Successful
                                        </h4>

                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            Your payment of{" "}
                                            <span className="font-medium">
                                                $45.00
                                            </span>{" "}
                                            for "Vintage Camera" has been
                                            processed successfully.
                                        </p>
                                    </div>
                                </div>

                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    Yesterday, 4:20 PM
                                </span>
                            </div>
                        </div>

                        {/* System Update */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100">

                            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">

                                <div className="flex gap-4">
                                    <Info className="size-12 p-3 bg-gray-200 rounded-xl shrink-0" />

                                    <div className="min-w-0">
                                        <h4 className="font-medium">
                                            System Update
                                        </h4>

                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            Second Sync v2.4 is now live. Check
                                            out the new asymmetric grid layouts
                                            for better product visibility.
                                        </p>

                                        <button className="text-sm mt-3 text-(--primary-color)">
                                            Read Release Notes
                                        </button>
                                    </div>
                                </div>

                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    Yesterday, 10:15 AM
                                </span>
                            </div>
                        </div>

                        {/* Sale */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100">

                            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">

                                <div className="flex gap-4">
                                    <Tag className="size-12 p-3 bg-orange-100 rounded-xl shrink-0" />

                                    <div className="min-w-0">
                                        <h4 className="font-medium">
                                            You made a sale!
                                        </h4>

                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            Your listing "Minimalist Oak Desk"
                                            was purchased by @curator_jane.
                                            Print your shipping label to
                                            continue.
                                        </p>
                                    </div>
                                </div>

                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    Nov 12, 2:45 PM
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Button */}
                <div className="flex justify-center pt-2">
                    <button className="px-6 py-2.5 border rounded-lg text-sm hover:bg-gray-50 transition">
                        View all history
                    </button>
                </div>
            </div>
        </div>
    );
}