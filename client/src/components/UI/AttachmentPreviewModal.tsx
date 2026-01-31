import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Attachment, getAttachmentType, formatFileSize } from "../../services/attachmentService";

interface AttachmentPreviewModalProps {
  visible: boolean;
  attachment: Attachment | null;
  onClose: () => void;
  onDelete?: () => void;
}

export default function AttachmentPreviewModal({
  visible,
  attachment,
  onClose,
  onDelete,
}: AttachmentPreviewModalProps) {
  const [loading, setLoading] = React.useState(false);

  if (!attachment) return null;

  const type = getAttachmentType(attachment.fileType);
  const isProjectAttachment = attachment.projectId !== null && attachment.taskId === "";
  const fileDate = new Date(attachment.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleOpenExternal = async () => {
    setLoading(true);
    try {
      // Construct the full URL - adjust based on your server setup
      const fullUrl = attachment.fileUrl.startsWith("http") 
        ? attachment.fileUrl 
        : `http://localhost:3000${attachment.fileUrl}`;
      
      const supported = await Linking.canOpenURL(fullUrl);
      
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        // For local files, try to copy URL to clipboard or show options
        await Linking.openURL(fullUrl);
      }
    } catch (error) {
      console.error("Error opening file:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {attachment.fileName}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={styles.previewContainer}>
            {type === "image" && attachment.fileUrl ? (
              <Image
                source={{ uri: attachment.fileUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.filePreview}>
                <Ionicons
                  name={
                    type === "document"
                      ? "document-text-outline"
                      : "attach-outline"
                  }
                  size={80}
                  color={
                    type === "document"
                      ? attachment.fileType?.includes("pdf")
                        ? "#EF4444"
                        : "#60A5FA"
                      : "#9CA3AF"
                  }
                />
              </View>
            )}
          </View>

          {/* File Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>
                {attachment.fileType || "Unknown"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Size</Text>
              <Text style={styles.infoValue}>
                {formatFileSize(attachment.fileSize)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Added</Text>
              <Text style={styles.infoValue}>{fileDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Source</Text>
              <View style={styles.badge}>
                <Ionicons
                  name={isProjectAttachment ? "folder-outline" : "checkbox-outline"}
                  size={12}
                  color={isProjectAttachment ? "#60A5FA" : "#10B981"}
                />
                <Text style={styles.badgeText}>
                  {isProjectAttachment ? "Project" : "Task"}
                </Text>
              </View>
            </View>
            {attachment.task && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Task</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {attachment.task.title}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleOpenExternal}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="open-outline" size={20} color="#fff" />
                  <Text style={styles.actionText}>Open in External App</Text>
                </>
              )}
            </TouchableOpacity>

            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#374151",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
  previewContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  filePreview: {
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  infoValue: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "rgba(96, 165, 250, 0.2)",
  },
  badgeText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 4,
  },
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#374151",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  deleteText: {
    color: "#EF4444",
  },
});
