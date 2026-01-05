import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";

const Toast = ({ message, type = "info", onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Wait for animation
    };

    const styles = {
        success: "bg-emerald-50 border-emerald-200 text-emerald-800",
        error: "bg-red-50 border-red-200 text-red-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-600" />,
        error: <AlertCircle className="w-5 h-5 text-red-600" />,
        info: <Info className="w-5 h-5 text-blue-600" />,
    };

    return (
        <div
            className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full transition-all duration-300 transform
        ${styles[type] || styles.info}
        ${isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0 animate-in slide-in-from-right-4"}
      `}
        >
            {icons[type]}
            <p className="text-sm font-medium flex-1">{message}</p>
            <button
                onClick={handleClose}
                className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
                <X className="w-4 h-4 opacity-60" />
            </button>
        </div>
    );
};

export default Toast;
