import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Status, createStatus } from "../../services/statusService";
import { Priority, createPriority } from "../../services/priorityService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Task, uploadAttachments } from "@/src/services/taskService";
import { on } from "events";

interface InitialValues {
  title?: string;
  description?: string;
  statusId?: string;
  priorityId?: string;
  dueDate?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    description?: string;
    statusId: string;
    priorityId: string;
    dueDate?: string;
  }) => Promise<Task>;
  initialValues?: InitialValues;
  statuses: Status[];
  // setStatuses: (s: Status[]) => void;
  setStatuses: React.Dispatch<React.SetStateAction<Status[]>>;
  priorities: Priority[];
  // setPriorities: (p: Priority[]) => void;
  setPriorities: React.Dispatch<React.SetStateAction<Priority[]>>;
}

interface Attachment {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export default function TaskModal({
  visible,
  onClose,
  onSave,
  initialValues,
  statuses,
  setStatuses,
  priorities,
  setPriorities,
}: Props) {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [statusId, setStatusId] = useState<string>(initialValues?.statusId || "");
  const [priorityId, setPriorityId] = useState<string>(initialValues?.priorityId || "");
  const [dueDate, setDueDate] = useState<Date | null>(
    initialValues?.dueDate ? new Date(initialValues.dueDate) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [saving, setSaving] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [newPriorityName, setNewPriorityName] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    setTitle(initialValues?.title || "");
    setDescription(initialValues?.description || "");
    setStatusId(initialValues?.statusId || (statuses[0]?.id ?? ""));
    setPriorityId(initialValues?.priorityId || (priorities[0]?.id ?? ""));
    setDueDate(initialValues?.dueDate ? new Date(initialValues.dueDate) : null);

  }, [initialValues, visible, statuses, priorities]);

  useEffect(() => {
    if (visible) {
      setAttachments([]);
    }
  }, [visible]);

  const handlePickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const files = result.assets.map((file) => ({
          uri: file.uri,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
        }));

        setAttachments((prev) => [...prev, ...files]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Please enter a task title");
      return;
    }
    if (!statusId) {
      Alert.alert("Validation", "Please select a status");
      return;
    }
    if (!priorityId) {
      Alert.alert("Validation", "Please select a priority");
      return;
    }

    try {
      setSaving(true);
      const task = await onSave({
        title: title.trim(),
        description: description?.trim() || undefined,
        statusId,
        priorityId,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      });

      //upload attachments logic can be added here
      if (attachments.length > 0 && task?.id) {
        await uploadAttachments(task.id, attachments);
      }

      onClose();
      Alert.alert("Success", "Task created successfully");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatusName.trim()) {
      Alert.alert("Error", "Status name is required");
      return;
    }
    try {
      const newStatus = await createStatus({ name: newStatusName.trim() });
      setStatuses((prev) => [...prev, newStatus]);
      setStatusId(newStatus.id);
      setStatusModalVisible(false);
      setNewStatusName("");
      Alert.alert("Success", "Status added!");
    } catch (err) {
      Alert.alert("Error", "Failed to create status");
    }
  };

  const handleCreatePriority = async () => {
    if (!newPriorityName.trim()) {
      Alert.alert("Error", "Priority name is required");
      return;
    }
    try {
      const newPriority = await createPriority({ name: newPriorityName.trim() });
      setPriorities((prev) => [...prev, newPriority]);
      setPriorityId(newPriority.id);
      setPriorityModalVisible(false);
      setNewPriorityName("");
      Alert.alert("Success", "Priority added!");
    } catch (err) {
      Alert.alert("Error", "Failed to create priority");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="max-h-[80%] "
        >
          <LinearGradient colors={["#1F2937", "#111827"]} className="rounded-t-2xl  p-4">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-2">
                <Ionicons name="add-circle" size={24} color="#60A5FA" />
                <Text className="text-2xl font-bold text-white">New Task</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View className="mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="document-text-outline" size={16} color="#60A5FA" />
                  <Text className="text-gray-300 font-medium">Title *</Text>
                </View>
                <TextInput
                  className="bg-gray-800 rounded-lg px-4 py-3 text-gray-200 border border-gray-700"
                  placeholder="Enter task title"
                  placeholderTextColor="#6B7280"
                  value={title}
                  onChangeText={setTitle}
                  editable={!saving}
                />
              </View>

              <View className="mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="chatbox-outline" size={16} color="#60A5FA" />
                  <Text className="text-gray-300 font-medium">Description</Text>
                </View>
                <TextInput
                  className="bg-gray-800 rounded-lg px-4 py-3 text-gray-200 border border-gray-700 min-h-[80px]"
                  placeholder="Add optional description..."
                  placeholderTextColor="#6B7280"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  editable={!saving}
                />
              </View>

              <View className="mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="flag-outline" size={16} color="#60A5FA" />
                  <Text className="text-gray-300 font-medium">Status *</Text>
                </View>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {statuses.map((status) => (
                    <TouchableOpacity
                      key={status.id}
                      onPress={() => setStatusId(status.id)}
                      className={`px-4 py-2 rounded-lg border-2 ${statusId === status.id ? "bg-blue-600 border-blue-400" : "bg-gray-800 border-gray-700"
                        }`}
                    >
                      <Text className={`text-sm font-medium ${statusId === status.id ? "text-white" : "text-gray-300"}`}>
                        {status.name}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity onPress={() => setStatusModalVisible(true)} className="px-4 py-2 rounded-lg border-2 border-dashed border-gray-600 items-center">
                    <Ionicons name="add-outline" size={16} color="#60A5FA" />
                    <Text className="text-sm text-gray-400 ml-1">Add New</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="alert-circle-outline" size={16} color="#60A5FA" />
                  <Text className="text-gray-300 font-medium">Priority *</Text>
                </View>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {priorities.map((priority) => (
                    <TouchableOpacity
                      key={priority.id}
                      onPress={() => setPriorityId(priority.id)}
                      className={`px-4 py-2 rounded-lg border-2 ${priorityId === priority.id ? "bg-blue-600 border-blue-400" : "bg-gray-800 border-gray-700"
                        }`}
                    >
                      <Text className={`text-sm font-medium ${priorityId === priority.id ? "text-white" : "text-gray-300"}`}>
                        {priority.name}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity onPress={() => setPriorityModalVisible(true)} className="px-4 py-2 rounded-lg border-2 border-dashed border-gray-600 items-center">
                    <Ionicons name="add-outline" size={16} color="#60A5FA" />
                    <Text className="text-sm text-gray-400 ml-1">Add New</Text>
                  </TouchableOpacity>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-300 mb-2 font-medium">Due Date</Text>

                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700 flex-row items-center justify-between"
                    disabled={saving}
                  >
                    <Text className="text-gray-200">
                      {dueDate ? dueDate.toISOString().split("T")[0] : "Select a date (optional)"}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={dueDate ?? new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setDueDate(selectedDate);
                        }
                      }}
                    />
                  )}
                </View>

                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Ionicons name="attach-outline" size={16} color="#60A5FA" />
                    <Text className="text-gray-300 font-medium">Attachments</Text>
                  </View>

                  {/* Attach Button */}
                  <TouchableOpacity
                    onPress={handlePickAttachment}
                    disabled={saving}
                    className="flex-row items-center justify-center gap-2 bg-gray-800 border border-dashed border-gray-600 rounded-lg py-3 mb-3"
                  >
                    <Ionicons name="add-outline" size={18} color="#60A5FA" />
                    <Text className="text-gray-400">Add Attachment</Text>
                  </TouchableOpacity>

                  {/* Attached Files List */}
                  {attachments.map((file, index) => (
                    <View
                      key={index}
                      className="flex-row items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-2"
                    >
                      <View className="flex-row items-center gap-2 flex-1">
                        <Ionicons name="document-outline" size={18} color="#9CA3AF" />
                        <Text className="text-gray-300 text-sm flex-shrink">
                          {file.name}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() =>
                          setAttachments((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
        <View className="px-6 pb-6 pt-4 border-t border-gray-700 bg-gray-900">
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={handleSubmit} disabled={saving} className="flex-1 bg-blue-600 rounded-lg py-3 items-center flex-row justify-center gap-2">
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text className="text-white font-semibold">Create</Text>
              </>}
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} disabled={saving} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg py-3 items-center">
              <Text className="text-gray-300 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Mini-Modal for Adding Status */}
      <Modal visible={statusModalVisible} animationType="slide" transparent={true} onRequestClose={() => setStatusModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-gray-800 rounded-t-2xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-white">New Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <TextInput className="bg-gray-700 rounded-lg px-4 py-3 text-white mb-4" placeholder="Enter status name (e.g., Blocked)" placeholderTextColor="#6B7280" value={newStatusName} onChangeText={setNewStatusName} />
            <TouchableOpacity onPress={handleCreateStatus} className="bg-blue-600 rounded-lg py-3 items-center">
              <Text className="text-white font-semibold">Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Mini-Modal for Adding Priority */}
      <Modal visible={priorityModalVisible} animationType="slide" transparent={true} onRequestClose={() => setPriorityModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-gray-800 rounded-t-2xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-white">New Priority</Text>
              <TouchableOpacity onPress={() => setPriorityModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <TextInput className="bg-gray-700 rounded-lg px-4 py-3 text-white mb-4" placeholder="Enter priority name (e.g., Critical)" placeholderTextColor="#6B7280" value={newPriorityName} onChangeText={setNewPriorityName} />
            <TouchableOpacity onPress={handleCreatePriority} className="bg-blue-600 rounded-lg py-3 items-center">
              <Text className="text-white font-semibold">Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
