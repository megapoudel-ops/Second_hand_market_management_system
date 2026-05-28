import { Camera, Upload, Copy } from "lucide-react";

const AiColorPalette = () => {
    const palettes = [
        {
            name: "Cyber Neon Flux",
            time: "4 colors • 2 hours ago",
            image: "https://i.pravatar.cc/300?img=12",
            colors: ["#2F6BFF", "#3CC7D6", "#A5B4FC", "#E5E7EB"],
        },
        {
            name: "Desert Terrazzo",
            time: "4 colors • 3 hours ago",
            image: "https://i.pravatar.cc/300?img=15",
            colors: ["#8B2E0F", "#E6B98C", "#D97706", "#E5E7EB"],
        },
        {
            name: "Moss & Canopy",
            time: "4 colors • 3 days ago",
            image: "https://i.pravatar.cc/300?img=18",
            colors: ["#0F5132", "#84CC16", "#166534", "#D1FAE5"],
        },
        {
            name: "Silver Minimalist",
            time: "4 colors • 3 days ago",
            image: "https://i.pravatar.cc/300?img=20",
            colors: ["#E5E7EB", "#CBD5E1", "#94A3B8", "#475569"],
        },
    ];
    return (
        <div className="w-full px-4 md:px-8 py-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-semibold">
                    AI Color Harmony
                </h1>
                <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
                    Extract intelligent color palettes from your environment or files.
                    Driven by Second Sync’s advanced vision API.
                </p>
            </div>

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT SIDE */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Camera Preview */}
                    <div className="bg-black rounded-xl h-[260px] md:h-[320px] flex items-center justify-center relative">
                        <div className="w-20 h-20 rounded-full border-4 border-gray-500 flex items-center justify-center">
                            <div className="w-6 h-6 bg-teal-500 rounded-full"></div>
                        </div>

                        {/* Camera Icon */}
                        <button className="absolute bottom-4 left-4 bg-white/20 p-2 rounded-full">
                            <Camera size={18} className="text-white" />
                        </button>

                        {/* Copy Icon */}
                        <button className="absolute bottom-4 right-4 bg-white/20 p-2 rounded-full">
                            <Copy size={18} className="text-white" />
                        </button>
                    </div>

                    {/* Upload Box */}
                    <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-gray-50 transition">
                        <div className="flex flex-col items-center gap-3">
                            <div className="bg-teal-100 p-3 rounded-full">
                                <Upload className="text-teal-600" size={20} />
                            </div>
                            <p className="font-medium">Upload an image to extract palette</p>
                            <p className="text-sm text-gray-400">
                                Supports PNG, JPG, WEBP (Max 10MB)
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="font-medium">Current Extraction</h2>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                            AI ANALYZED
                        </span>
                    </div>

                    {/* Colors */}
                    <div className="space-y-3">
                        {[
                            { name: "Primary", hex: "#006A61", color: "bg-teal-700" },
                            { name: "Accent", hex: "#86F2E4", color: "bg-teal-300" },
                            { name: "Neutral", hex: "#0B1C30", color: "bg-gray-900" },
                        ].map((c, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded ${c.color}`}></div>
                                <div>
                                    <p className="text-sm">{c.name}</p>
                                    <p className="text-xs text-gray-500">{c.hex}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <button className="w-full bg-black text-white py-2 rounded-md">
                        SAVE TO COLLECTION
                    </button>
                    <button className="w-full border py-2 rounded-md text-sm">
                        EXPORT AS CSS/SCSS
                    </button>
                </div>
            </div>

            {/* Gallery */}
            <div className="mt-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h2 className="font-semibold text-lg">Your Gallery</h2>
                        <p className="text-sm text-gray-500">
                            Previous extractions and community inspirations
                        </p>
                    </div>
                    <button className="text-sm text-teal-600 hover:underline">
                        View All Collections →
                    </button>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {palettes.map((palette, i) => (
                        <div
                            key={i}
                            className="bg-[#f9fafb] rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition"
                        >
                            {/* Image */}
                            <img
                                src={palette.image}
                                className="h-28 w-full object-cover"
                            />

                            {/* Color strip (WITH PADDING like image) */}
                            <div className="px-3 mt-2">
                                <div className="flex h-5 rounded overflow-hidden">
                                    {palette.colors.map((color, idx) => (
                                        <div
                                            key={idx}
                                            className="flex-1"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Text */}
                            <div className="p-3 pt-2">
                                <p className="text-sm font-medium text-gray-800">
                                    {palette.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {palette.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AiColorPalette;