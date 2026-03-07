import { useState, useCallback, ReactElement } from "react";
import { CustomAlert } from "../components/UI/CustomAlert";

export type AlertType = "default" | "success" | "error" | "warning" | "info";

export interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
}

export function useAlert() {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    title: "",
    message: "",
    type: "default",
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setOptions({
      ...options,
      type: options.type || "default",
    });
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  // Helper methods for common alert types
  const showError = useCallback(
    (message: string, title = "Error") => {
      showAlert({ title, message, type: "error" });
    },
    [showAlert]
  );

  const showSuccess = useCallback(
    (message: string, title = "Success") => {
      showAlert({ title, message, type: "success" });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (message: string, title = "Warning") => {
      showAlert({ title, message, type: "warning" });
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (message: string, title = "Info") => {
      showAlert({ title, message, type: "info" });
    },
    [showAlert]
  );

  const showConfirm = useCallback(
    (
      message: string,
      onConfirm: () => void,
      title = "Confirm",
      confirmText = "Yes",
      cancelText = "Cancel"
    ) => {
      showAlert({
        title,
        message,
        type: "default",
        showCancel: true,
        confirmText,
        cancelText,
        onConfirm,
      });
    },
    [showAlert]
  );

  const showValidationError = useCallback(
    (message: string) => {
      showAlert({ title: "Validation Error", message, type: "error" });
    },
    [showAlert]
  );

  const AlertComponent: ReactElement = (
    <CustomAlert
      visible={visible}
      title={options.title}
      message={options.message}
      type={options.type || "default"}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      showCancel={options.showCancel || false}
      onClose={hideAlert}
      onConfirm={options.onConfirm}
    />
  );

  return {
    // State
    visible,
    // Methods
    showAlert,
    hideAlert,
    // Helper methods
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showConfirm,
    showValidationError,
    // Component to render
    AlertComponent,
  };
}

export default useAlert;
