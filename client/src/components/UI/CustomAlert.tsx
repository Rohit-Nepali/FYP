import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../config/theme";

const { width } = Dimensions.get("window");

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: "default" | "success" | "error" | "warning" | "info";
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = "default",
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
}) => {
  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      case "warning":
        return "warning";
      case "info":
        return "information-circle";
      default:
        return "alert-circle";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return theme.status.success;
      case "error":
        return theme.status.error;
      case "warning":
        return theme.status.warning;
      case "info":
        return theme.status.info;
      default:
        return theme.icon.accent;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* FIX: Use transparent overlay without gradient */}
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* FIX: Apply gradient only to the card */}
          <LinearGradient
            colors={theme.background.gradient}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <Ionicons
                  name={getIconName()}
                  size={32}
                  color={getIconColor()}
                />
                <Text style={styles.title}>{title}</Text>
              </View>

              <Text style={styles.message}>{message}</Text>

              <View style={styles.buttonContainer}>
                {showCancel && (
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent backdrop
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    // Content container inside gradient
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.text.primary,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
  message: {
    fontSize: theme.typography.sizes.base,
    color: theme.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: theme.button.primary.background,
  },
  confirmButtonText: {
    color: theme.button.primary.text,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.medium,
  },
  cancelButton: {
    backgroundColor: theme.button.secondary.background,
    borderColor: theme.button.secondary.border,
    borderWidth: 1,
  },
  cancelButtonText: {
    color: theme.button.secondary.text,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.medium,
  },
});

export default CustomAlert;
