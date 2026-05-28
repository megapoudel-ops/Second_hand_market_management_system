import { useLocation, useNavigate } from "react-router-dom";
import { HelpCircle, Camera } from "lucide-react";

const FloatingButton = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const isColorPalettePage = location.pathname === "/ai-color-palette";

    const handleClick = () => {
        if (isColorPalettePage) {
            // camera action
            console.log("Open camera");
        } else {
            // FAQ action
            navigate("/ai-color-palette");
        }
    };

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-6 right-6 bg-(--primary-color) text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform duration-200 z-50"
        >
            {isColorPalettePage ? (
                <Camera size={24} />
            ) : (
                <HelpCircle size={24} />
            )}
        </button>
    );
};

export default FloatingButton;