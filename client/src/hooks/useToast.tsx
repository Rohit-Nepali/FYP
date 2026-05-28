import { useState, useCallback, ReactElement } from "react";
import { Toast, ToastType } from "../components/UI/Toast";

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: "top" | "bottom";
}

export function useToast() {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ToastOptions>({
    message: "",
    type: "info",
    duration: 2500,
  });

  const showToast = useCallback((options: ToastOptions) => {
    setOptions({
      message: options.message,
      type: options.type || "info",
      duration: options.duration || 2500,
    });
    setVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  // Helper methods for common toast types
  const success = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: "success", duration });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: "error", duration });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: "info", duration });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      showToast({ message, type: "warning", duration });
    },
    [showToast]
  );

  const ToastComponent: ReactElement = (
    <Toast
      visible={visible}
      message={options.message}
      type={options.type || "info"}
      duration={options.duration || 2500}
      position={options.position || "bottom"}
      onDismiss={hideToast}
    />
  );

  return {
    // State
    visible,
    // Methods
    showToast,
    hideToast,
    // Helper methods
    success,
    error,
    info,
    warning,
    // Component to render
    ToastComponent,
  };
}

export default useToast;
