import { useState, useRef, useEffect } from "react";
import { Upload, Camera, Download, CheckCircle, AlertTriangle, X } from "lucide-react";

export default function AIDamageDetection() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzed, setAnalyzed] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const DAMAGE_API_URL = import.meta.env.VITE_DAMAGE_API_URL || "http://localhost:5001";

    const handleImageUpload = (file: File) => {
        setUploadedFile(file);
        setAnalyzed(false);
        setResult(null);
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            setUploadedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const analyzeImageFile = async (file?: File) => {
        const targetFile = file || uploadedFile;
        if (!targetFile) return;

        setAnalyzing(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("image", targetFile);

            const response = await fetch(`${DAMAGE_API_URL}/detect`, {
                method: "POST",
                body: formData,
            });

            const responseText = await response.text();

            if (!response.ok) {
                const message = responseText || "Detection failed";
                throw new Error(message);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error("Invalid response from damage detection server.");
            }

            setResult(data);
            setAnalyzed(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Detection failed. Make sure the damage detection server is running.";
            setError(message);
        } finally {
            setAnalyzing(false);
        }
    };

    const startCamera = async () => {
        setCameraError(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError("Camera is not supported in this browser.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            streamRef.current = stream;
            setCameraActive(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (err) {
            setCameraError("Unable to access camera. Please allow camera permission.");
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const captureFromCamera = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (!blob) {
                setError("Could not capture image from camera.");
                return;
            }
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
            handleImageUpload(file);
            stopCamera();
            analyzeImageFile(file);
        }, "image/jpeg", 0.92);
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const handleAnalyze = async () => {
        await analyzeImageFile();
    };

    const getConditionColor = (condition: string) => {
        switch (condition?.toLowerCase()) {
            case "good": return "text-green-600";
            case "fair": return "text-yellow-600";
            case "damaged": return "text-orange-600";
            case "severely damaged": return "text-red-600";
            default: return "text-gray-600";
        }
    };

    const getConditionBg = (condition: string) => {
        switch (condition?.toLowerCase()) {
            case "good": return "bg-green-100";
            case "fair": return "bg-yellow-100";
            case "damaged": return "bg-orange-100";
            case "severely damaged": return "bg-red-100";
            default: return "bg-gray-100";
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">

            {/* Header */}
            <div className="mb-6">
                <p className="text-sm font-medium text-gray-700">Detection Detailed Analysis</p>
                <p className="text-xs text-gray-400">
                    Upload an image to detect damage on books, furniture, or laptops using AI.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

                {/* Left - Image Upload */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="relative">
                        {uploadedImage ? (
                            <>
                                <img
                                    src={uploadedImage}
                                    alt="Product"
                                    className="w-full h-72 object-cover"
                                />
                                {analyzed && result && (
                                    <div
                                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
                                        style={{ backgroundColor: "var(--primary-color)" }}
                                    >
                                        ▲ {result.overall_assessment}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-72 flex flex-col items-center justify-center gap-3 bg-gray-50">
                                <Upload className="w-10 h-10 text-gray-300" />
                                <p className="text-sm text-gray-400">Upload an image to analyze</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 text-sm text-white rounded-lg"
                                        style={{ backgroundColor: "var(--primary-color)" }}
                                    >
                                        Upload Image
                                    </button>
                                    <button
                                        onClick={startCamera}
                                        className="px-4 py-2 text-sm border rounded-lg flex items-center gap-2"
                                    >
                                        <Camera className="w-4 h-4" />
                                        Camera
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hidden inputs */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                        }}
                    />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                        }}
                    />

                    {cameraActive && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                            <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden">
                                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                    <div>
                                        <p className="text-sm font-semibold">Camera Capture</p>
                                        <p className="text-xs text-gray-500">Take a photo of the product to detect damage.</p>
                                    </div>
                                    <button onClick={stopCamera} className="text-gray-500 hover:text-gray-800">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="relative bg-black">
                                    <video ref={videoRef} className="w-full h-[420px] object-cover" playsInline muted autoPlay />
                                    {cameraError && (
                                        <div className="absolute inset-x-0 top-0 p-4 text-xs text-red-500 bg-white/80 text-center">
                                            {cameraError}
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                                        <button
                                            onClick={captureFromCamera}
                                            className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-full"
                                        >
                                            Capture
                                        </button>
                                        <button
                                            onClick={stopCamera}
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-full"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom buttons */}
                    {uploadedImage && (
                        <div className="p-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-3">
                                <span>CAPTURED: {new Date().toLocaleDateString()}</span>
                                <span>LIGHTING: Standard Studio (5500K)</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 py-2 text-xs border rounded-lg flex items-center justify-center gap-1 hover:bg-gray-50"
                                >
                                    <Upload className="w-3 h-3" />
                                    Upload New
                                </button>
                                <button
                                    onClick={startCamera}
                                    className="flex-1 py-2 text-xs border rounded-lg flex items-center justify-center gap-1 hover:bg-gray-50"
                                >
                                    <Camera className="w-3 h-3" />
                                    Camera
                                </button>
                                <button
                                    className="flex-1 py-2 text-xs border rounded-lg flex items-center justify-center gap-1 hover:bg-gray-50"
                                    onClick={() => {
                                        if (uploadedImage) {
                                            const a = document.createElement("a");
                                            a.href = uploadedImage;
                                            a.download = "damage-report.jpg";
                                            a.click();
                                        }
                                    }}
                                >
                                    <Download className="w-3 h-3" />
                                    Download
                                </button>
                            </div>

                            {!analyzed && (
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="w-full mt-3 py-2.5 text-sm text-white rounded-lg font-medium"
                                    style={{ backgroundColor: "var(--primary-color)" }}
                                >
                                    {analyzing ? "Analyzing with AI..." : "🔍 Analyze Damage"}
                                </button>
                            )}

                            {error && (
                                <div className="mt-3 p-3 bg-red-50 rounded-lg text-xs text-red-500 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right - Detection Report */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex justify-between items-center mb-5">
                        <p className="text-sm font-semibold text-gray-700">Detection Report</p>
                        {(analyzing || analyzed) && (
                            <span
                                className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                                style={{ backgroundColor: "var(--primary-color)" }}
                            >
                                {analyzing ? "SCANNING..." : "ACTIVESCAN"}
                            </span>
                        )}
                    </div>

                    {!analyzed && !analyzing && (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <p className="text-sm">Upload an image to see results</p>
                        </div>
                    )}

                    {analyzing && (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <div className="w-10 h-10 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin mb-3"></div>
                            <p className="text-sm">AI is analyzing your image...</p>
                        </div>
                    )}

                    {analyzed && result && (
                        <>
                            <table className="w-full text-sm mb-5">
                                <tbody>
                                    <tr className="border-t border-gray-100">
                                        <td className="py-3 text-gray-400 text-xs">Overall</td>
                                        <td className="py-3 text-gray-700 text-xs font-medium">
                                            {result.overall_assessment}
                                        </td>
                                    </tr>
                                    <tr className="border-t border-gray-100">
                                        <td className="py-3 text-gray-400 text-xs">Sellable</td>
                                        <td className="py-3 text-xs">
                                            <span className={`font-medium ${result.sellable_overall ? "text-green-600" : "text-red-500"}`}>
                                                {result.sellable_overall ? "✅ Yes" : "❌ No"}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="border-t border-gray-100">
                                        <td className="py-3 text-gray-400 text-xs">Summary</td>
                                        <td className="py-3 text-gray-700 text-xs">
                                            {result.summary}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <button
                                className="w-full py-3 text-white text-sm rounded-xl flex items-center justify-center gap-2 font-medium"
                                style={{ backgroundColor: "var(--primary-color)" }}
                                onClick={() => {
                                    setUploadedImage(null);
                                    setAnalyzed(false);
                                    setResult(null);
                                    setUploadedFile(null);
                                }}
                            >
                                <CheckCircle className="w-4 h-4" />
                                Approve & Scan New
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom - Items Detected */}
            {analyzed && result && result.items_detected && (
                <div className="mt-6 space-y-4">
                    <h3 className="font-semibold text-gray-700">Items Detected</h3>
                    {result.items_detected.map((item: any, i: number) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ backgroundColor: "var(--primary-color)" }}
                                    >
                                        AI
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{item.item}</p>
                                        <p className="text-xs text-gray-400">Neural network analysis</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getConditionBg(item.condition)} ${getConditionColor(item.condition)}`}>
                                    {item.condition}
                                </span>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p
                                        className="text-xs font-bold uppercase tracking-wider mb-2"
                                        style={{ color: "var(--primary-color)" }}
                                    >
                                        Damage Description
                                    </p>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        {item.damage_description}
                                    </p>
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Condition</span>
                                            <span className="font-medium">{item.condition_percentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${item.condition_percentage}%`,
                                                    backgroundColor: "var(--primary-color)"
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                                        Assessment Summary
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Sellable</span>
                                            <span className={`font-medium ${item.sellable ? "text-green-600" : "text-red-500"}`}>
                                                {item.sellable ? "Yes" : "No"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Price Reduction</span>
                                            <span className="font-medium text-orange-500">
                                                {item.suggested_price_reduction}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}