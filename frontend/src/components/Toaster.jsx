import { createContext, useContext, useState, useCallback } from "react";
import Toast from "./Toast.jsx";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      // Avoid stacking identical errors (e.g. repeated "Database unavailable")
      const withoutDupes = prev.filter(
        (t) => !(t.message === message && t.type === type)
      );
      return [...withoutDupes.slice(-2), { id, message, type, duration }];
    });
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-20 end-4 z-[60] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-2rem)]"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto animate-in">
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

