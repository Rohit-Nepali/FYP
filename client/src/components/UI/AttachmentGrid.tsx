import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Attachment, getAttachmentType, formatFileSize } from "../../services/attachmentService";
import { resolveFileUrl } from "@/src/utils/url";

interface AttachmentGridProps {
  attachments: Attachment[];
  onAttachmentPress: (attachment: Attachment) => void;
}

const { width } = Dimensions.get("window");
const gridWidth = width - 32; // 16px padding on each side
const itemSize = (gridWidth - 12) / 2; // 2 columns with 12px gap

export default function AttachmentGrid({
  attachments,
  onAttachmentPress,
}: AttachmentGridProps) {
  if (attachments.length === 0) {
    return null;
  }

  const getFileIcon = (fileType: string | null, size: number) => {
    const type = getAttachmentType(fileType);
    
    if (type === "image") {
      return (
        <Image
          source={require("../../../assets/images/partial-react-logo.png")}
          style={{ width: size * 0.5, height: size * 0.5, borderRadius: 4 }}
          resizeMode="contain"
        />
      );
    }
    
    if (type === "document") {
      if (fileType?.includes("pdf")) {
        return <Ionicons name="document-text-outline" size={size * 0.4} color="#EF4444" />;
      }
      return <Ionicons name="document-outline" size={size * 0.4} color="#60A5FA" />;
    }
    
    return <Ionicons name="attach-outline" size={size * 0.4} color="#9CA3AF" />;
  };

  return (
    <View style={styles.gridContainer}>
      {attachments.map((attachment) => {
        const isProjectAttachment = attachment.projectId !== null && attachment.taskId === "";
        const type = getAttachmentType(attachment.fileType);
        
        return (
          <TouchableOpacity
            key={attachment.id}
            style={[styles.attachmentCard, { width: itemSize }]}
            onPress={() => onAttachmentPress(attachment)}
            activeOpacity={0.7}
          >
            {/* Thumbnail */}
            <View style={styles.thumbnailContainer}>
              {type === "image" && attachment.fileUrl ? (
                <Image
                  source={{ uri: resolveFileUrl(attachment.fileUrl) }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.fileIconContainer}>
                  {getFileIcon(attachment.fileType, 48)}
                </View>
              )}
            </View>
            
            {/* Badge */}
            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.badge,
                  isProjectAttachment ? styles.projectBadge : styles.taskBadge,
                ]}
              >
                <Ionicons
                  name={isProjectAttachment ? "folder-outline" : "checkbox-outline"}
                  size={10}
                  color={isProjectAttachment ? "#60A5FA" : "#10B981"}
                />
                <Text style={styles.badgeText}>
                  {isProjectAttachment ? "Project" : "Task"}
                </Text>
              </View>
            </View>
            
            {/* File Info */}
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={2}>
                {attachment.fileName}
              </Text>
              <Text style={styles.fileSize}>
                {formatFileSize(attachment.fileSize)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  attachmentCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#374151",
  },
  thumbnailContainer: {
    width: "100%",
    height: 100,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  fileIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  badgeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  projectBadge: {
    backgroundColor: "rgba(96, 165, 250, 0.2)",
  },
  taskBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  badgeText: {
    fontSize: 10,
    color: "#fff",
    marginLeft: 2,
  },
  fileInfo: {
    padding: 8,
  },
  fileName: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
});
