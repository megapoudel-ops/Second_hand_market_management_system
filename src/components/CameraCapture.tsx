import React, { useEffect, useRef } from "react";

type Props = {
  onCapture: (dataUrl: string) => void;
  onClose?: () => void;
};

const CameraCapture: React.FC<Props> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        streamRef.current = stream;
        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    start();

    return () => {
      mounted = false;
      stopStream();
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (onClose) onClose();
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCapture(dataUrl);
    // keep stream running; user can capture multiple times
  };

  return (
    <div className="w-full">
      <div className="rounded-xl overflow-hidden border bg-black">
        <video ref={videoRef} className="w-full h-64 object-cover" playsInline muted />
      </div>
      <div className="flex gap-3 mt-3">
        <button onClick={handleCapture} className="px-4 py-2 bg-teal-700 text-white rounded-xl">Capture</button>
        <button onClick={stopStream} className="px-4 py-2 border rounded-xl">Close Camera</button>
      </div>
    </div>
  );
};

export default CameraCapture;
