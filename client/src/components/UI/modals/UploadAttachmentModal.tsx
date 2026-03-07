import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { createProjectAttachment } from "../../../services/attachmentService";

interface UploadAttachmentModalProps {
  visible: boolean;
  projectId: string;
  projectTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedFile {
  name: string;
  uri: string;
  size: number | null;
  mimeType: string | null;
}

export default function UploadAttachmentModal({
  visible,
  projectId,
  projectTitle,
  onClose,
  onSuccess,
}: UploadAttachmentModalProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          name: asset.name,
          uri: asset.uri,
          size: asset.size || null,
          mimeType: asset.mimeType || null,
        });
        setError(null);
      }
    } catch (err) {
      setError("Failed to pick document");
      console.error("Document picker error:", err);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Build FormData compatible with our backend and axios services
      const formData = new FormData();
      formData.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || "application/octet-stream",
      } as any);

      await createProjectAttachment(projectId, formData);

      Alert.alert(
        "Success",
        "Attachment uploaded successfully",
        [{
          text: "OK", onPress: () => {
            setSelectedFile(null);
            onSuccess();
          }
        }]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setError(null);
      onClose();
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "Unknown";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Attachment</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Project Info */}
            <View style={styles.projectInfo}>
              <Ionicons name="folder-outline" size={16} color="#60A5FA" />
              <Text style={styles.projectText}>
                Adding to: <Text style={styles.projectName}>{projectTitle}</Text>
              </Text>
            </View>

            {/* Upload Area */}
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={handlePickDocument}
              disabled={uploading}
              activeOpacity={0.7}
            >
              {selectedFile ? (
                <View style={styles.selectedFile}>
                  <Ionicons
                    name="checkmark-circle"
                    size={48}
                    color="#10B981"
                  />
                  <Text style={styles.fileName} numberOfLines={2}>
                    {selectedFile.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {formatFileSize(selectedFile.size)}
                  </Text>
                  <Text style={styles.tapToChange}>Tap to change</Text>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={48} color="#6B7280" />
                  <Text style={styles.uploadText}>Tap to select a file</Text>
                  <Text style={styles.uploadSubtext}>
                    Images, documents, PDFs, etc.
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
              <Text style={styles.infoText}>
                The file will be attached directly to this project and visible in
                the Attachments section.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={uploading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.uploadButton,
                (!selectedFile || uploading) && styles.uploadButtonDisabled,
              ]}
              onPress={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={18} color="#fff" />
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#374151",
    maxHeight: "80%",
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
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  projectInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    borderRadius: 8,
  },
  projectText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  projectName: {
    color: "#60A5FA",
    fontWeight: "500",
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: "#374151",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
    backgroundColor: "#111827",
  },
  uploadPlaceholder: {
    alignItems: "center",
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  selectedFile: {
    alignItems: "center",
  },
  fileName: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    marginTop: 12,
    textAlign: "center",
  },
  fileSize: {
    fontSize: 12,
    color: "#10B981",
    marginTop: 4,
  },
  tapToChange: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    marginLeft: 8,
    flex: 1,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#374151",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  cancelButton: {
    backgroundColor: "#374151",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  uploadButton: {
    backgroundColor: "#60A5FA",
  },
  uploadButtonDisabled: {
    backgroundColor: "#374151",
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
});
