import { Camera, Upload, Copy } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { extractPaletteFromImage } from "../lib/ai";

const AiColorPalette = () => {

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [extractedColors, setExtractedColors] = useState([
        { name: "Primary", hex: "#006A61" },
        { name: "Accent", hex: "#86F2E4" },
        { name: "Neutral", hex: "#0B1C30" },
    ]);
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [showVideo, setShowVideo] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const COLOR_API_URL = import.meta.env.VITE_COLOR_API_URL || "http://localhost:5000";
    const categories = [
        { slug: "laptops", label: "Laptops" },
        { slug: "books", label: "Books" },
        { slug: "furniture", label: "Furniture" },
    ];

    const handleCategorySelect = (category: string) => {
        const palette = extractedColors.map((c) => c.hex).join(",");
        const params = new URLSearchParams({ palette });
        navigate(`/${category}?${params.toString()}`);
    };

    const normalizeColorArray = (colors: any): string[] => {
        if (!Array.isArray(colors)) return [];
        return colors
            .map((color) => {
                if (typeof color === "string") return color;
                if (color && typeof color.hex === "string") return color.hex;
                return null;
            })
            .filter((color): color is string => !!color);
    };

    const buildColorObjects = (colors: string[]) =>
        colors.map((hex, index) => ({
            name: [`Primary`, `Secondary`, `Accent`, `Neutral`, `Complement`, `Highlight`][index] || `Color ${index + 1}`,
            hex,
        }));

    const handleImageUpload = async (file: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            setCapturedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("image", file);
            const response = await fetch(`${COLOR_API_URL}/api/ai/palette`, {
                method: "POST",
                body: formData,
            });

            let palette: string[] = [];
            if (response.ok) {
                const data = await response.json();
                palette = normalizeColorArray(data.colors);
            }

            if (palette.length === 0) {
                palette = await extractPaletteFromImage(file);
            }

            setExtractedColors(buildColorObjects(palette));
        } catch (error) {
            console.log("API not available or failed, using local extraction", error);
            try {
                const palette = await extractPaletteFromImage(file);
                setExtractedColors(buildColorObjects(palette));
            } catch (fallbackError) {
                console.error("Color extraction failed:", fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
    };

    const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
    };

    const handleCopyColors = () => {
        const colorText = extractedColors.map((c) => `${c.name}: ${c.hex}`).join("\n");
        navigator.clipboard.writeText(colorText);
        alert("Colors copied to clipboard!");
    };

    const handleExportCSS = () => {
        const css = `:root {\n${extractedColors
            .map((c) => `  --color-${c.name.toLowerCase()}: ${c.hex};`)
            .join("\n")}\n}`;
        const blob = new Blob([css], { type: "text/css" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "colors.css";
        a.click();
    };

    return (
        <div className="w-full px-4 md:px-8 py-6">
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-semibold">
                    AI Color Harmony
                </h1>
                <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
                    Extract intelligent color palettes from your environment or files.
                    Driven by Second Sync's advanced vision API.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-black rounded-xl h-[260px] md:h-[320px] flex items-center justify-center relative overflow-hidden">
                        {showVideo ? (
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                        ) : capturedImage ? (
                            <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 text-center px-6">
                                <div className="w-20 h-20 rounded-full border-4 border-gray-500 flex items-center justify-center">
                                    <Camera size={28} className="text-teal-400" />
                                </div>
                                <p className="text-sm text-gray-300">Tap the camera button to capture a photo</p>
                                <p className="text-xs text-gray-500">Your image will appear here and be analyzed for color.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <p className="text-white text-sm">Extracting colors...</p>
                            </div>
                        )}

                        {/* Camera open / capture button */}
                        <button
                            type="button"
                            className="absolute bottom-4 left-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-500 transition z-20"
                            onClick={async (e) => {
                                e.preventDefault();
                                // Prefer getUserMedia (desktop & modern browsers). If it fails, fallback to file input capture.
                                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                                    try {
                                        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                                        streamRef.current = s;
                                        if (videoRef.current) {
                                            videoRef.current.srcObject = s;
                                            videoRef.current.muted = true;
                                            // some browsers require explicit play
                                            try { await videoRef.current.play(); } catch {}
                                        }
                                        setShowVideo(true);
                                        return;
                                    } catch (err) {
                                        console.warn('getUserMedia failed, falling back to file input', err);
                                    }
                                }

                                // fallback: trigger file input (works on many mobile browsers)
                                cameraInputRef.current?.click();
                            }}
                            aria-label="Open camera"
                        >
                            <Camera size={20} />
                        </button>

                        <button
                            type="button"
                            className="absolute bottom-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/40 transition z-20"
                            onClick={handleCopyColors}
                        >
                            <Copy size={18} className="text-white" />
                        </button>

                        {/* Capture and close controls shown only when video preview is active */}
                        {showVideo && (
                            <>
                                <button
                                    type="button"
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-500 transition z-30"
                                    onClick={async () => {
                                        // capture frame to canvas
                                        const video = videoRef.current;
                                        if (!video) return;
                                        const canvas = canvasRef.current || document.createElement('canvas');
                                        canvas.width = video.videoWidth || video.clientWidth;
                                        canvas.height = video.videoHeight || video.clientHeight;
                                        const ctx = canvas.getContext('2d');
                                        if (!ctx) return;
                                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                        canvas.toBlob((blob) => {
                                            if (!blob) return;
                                            const file = new File([blob], 'capture.jpg', { type: blob.type });
                                            handleImageUpload(file);
                                        }, 'image/jpeg', 0.95);

                                        // stop stream and hide video
                                        if (streamRef.current) {
                                            streamRef.current.getTracks().forEach((t) => t.stop());
                                            streamRef.current = null;
                                        }
                                        setShowVideo(false);
                                    }}
                                >
                                    Capture
                                </button>

                                <button
                                    type="button"
                                    className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/40 transition z-30"
                                    onClick={() => {
                                        if (streamRef.current) {
                                            streamRef.current.getTracks().forEach((t) => t.stop());
                                            streamRef.current = null;
                                        }
                                        setShowVideo(false);
                                    }}
                                >
                                    Close
                                </button>
                            </>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleCameraChange}
                        aria-hidden="true"
                    />

                    {/* hidden canvas for capturing video frames */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    <div
                        className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
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

                <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="font-medium">Current Extraction</h2>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                            AI ANALYZED
                        </span>
                    </div>

                    <div className="space-y-3">
                        {extractedColors.map((c, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded"
                                    style={{ backgroundColor: c.hex }}
                                ></div>
                                <div>
                                    <p className="text-sm">{c.name}</p>
                                    <p className="text-xs text-gray-500">{c.hex}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        className="w-full bg-black text-white py-2 rounded-md"
                        onClick={handleCopyColors}
                    >
                        SAVE TO COLLECTION
                    </button>
                    <button
                        className="w-full border py-2 rounded-md text-sm"
                        onClick={handleExportCSS}
                    >
                        EXPORT AS CSS/SCSS
                    </button>

                    <div className="bg-white rounded-xl p-5 space-y-4 mt-6">
                        <div>
                            <h3 className="text-lg font-semibold">Shop by category</h3>
                            <p className="text-sm text-gray-500">
                                Choose the item type that should match this extracted palette.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {categories.map((category) => (
                                <button
                                    key={category.slug}
                                    className="w-full rounded-lg py-3 text-sm font-semibold text-white bg-green-900 hover:bg-green-800 transition"
                                    onClick={() => handleCategorySelect(category.slug)}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiColorPalette;
