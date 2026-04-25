import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Linking,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Status, createStatus } from "../../../services/statusService";
import { Priority, createPriority } from "../../../services/priorityService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Task, uploadAttachments } from "@/src/services/taskService";
import useAlert from "@/src/hooks/useAlert";
import { resolveFileUrl } from "@/src/utils/url";
import { LinearGradient } from "expo-linear-gradient";
import { AddChip, RowDivider, RowIcon, SelectionChip } from "@/src/components/common";
import MiniInputModal from "@/src/components/modals/MiniInputModal";
import { APP_THEME } from "@/src/constants/theme";
import { chipDotColor, COLORS } from "@/src/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface InitialValues {
  title?: string;
  description?: string;
  statusId?: string;
  priorityId?: string;
  dueDate?: string;
  assigneeId?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    description?: string;
    statusId?: string;
    priorityId?: string;
    dueDate?: string;
  }) => Promise<Task>;
  initialValues?: InitialValues;
  statuses: Status[];
  setStatuses: React.Dispatch<React.SetStateAction<Status[]>>;
  priorities: Priority[];
  setPriorities: React.Dispatch<React.SetStateAction<Priority[]>>;
  projectId?: string;
  projectMembers?: Array<{
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  }>;
}

interface Attachment {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;
const TASK_MODAL_MAX_HEIGHT_RATIO = 0.85;

const getStartOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const setToEndOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ─── TaskModal ────────────────────────────────────────────────────────────────
export default function TaskModal({
  visible,
  onClose,
  onSave,
  initialValues,
  statuses,
  setStatuses,
  priorities,
  setPriorities,
  projectId,
  projectMembers = [],
}: Props) {


  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [statusId, setStatusId] = useState<string>(initialValues?.statusId || "");
  const [priorityId, setPriorityId] = useState<string>(initialValues?.priorityId || "");
  const [assigneeId, setAssigneeId] = useState<string | undefined>(initialValues?.assigneeId);
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
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [creatingStatus, setCreatingStatus] = useState(false);
  const [creatingPriority, setCreatingPriority] = useState(false);
  const wasVisibleRef = useRef(false);

  const { showAlert, showError, showSuccess, showValidationError, hideAlert, AlertComponent } = useAlert();

  useEffect(() => {
    const justOpened = visible && !wasVisibleRef.current;
    const justClosed = !visible && wasVisibleRef.current;

    if (justOpened) {
      setTitle(initialValues?.title || "");
      setDescription(initialValues?.description || "");
      setStatusId(initialValues?.statusId || "");
      setPriorityId(initialValues?.priorityId || "");
      setAssigneeId(initialValues?.assigneeId);
      setDueDate(initialValues?.dueDate ? new Date(initialValues.dueDate) : null);
      setAttachments([]);
      setPreviewAttachment(null);
      hideAlert();
      setShowDatePicker(false);
      setStatusModalVisible(false);
      setPriorityModalVisible(false);
      setSaving(false);
      setCreatingStatus(false);
      setCreatingPriority(false);
      setNewStatusName("");
      setNewPriorityName("");
    }

    if (justClosed) {
      hideAlert();
      setPreviewAttachment(null);
      setShowDatePicker(false);
      setStatusModalVisible(false);
      setPriorityModalVisible(false);
      setSaving(false);
      setCreatingStatus(false);
      setCreatingPriority(false);
    }

    wasVisibleRef.current = visible;
  }, [visible, initialValues, hideAlert]);

  const handlePickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
      if (!result.canceled) {
        setAttachments((prev) => [
          ...prev,
          ...result.assets.map((f) => ({ uri: f.uri, name: f.name, size: f.size, mimeType: f.mimeType })),
        ]);
      }
    } catch { showError("Failed to pick file"); }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { showValidationError("Please enter a task title"); return; }
    try {
      setSaving(true);
      const task = await onSave({
        title: title.trim(),
        description: description?.trim() || undefined,
        ...(statusId ? { statusId } : {}),
        ...(priorityId ? { priorityId } : {}),
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      });
      if (attachments.length > 0 && task?.id) await uploadAttachments(task.id, attachments);
      showAlert({
        title: "Success",
        message: "Task created successfully.",
        type: "success",
        confirmText: "OK",
        onConfirm: onClose,
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally { setSaving(false); }
  };

  const handleOpenAttachment = async () => {
    if (!previewAttachment?.uri) return;
    try { await Linking.openURL(previewAttachment.uri); }
    catch { showError("Failed to open attachment"); }
  };

  const handleCreateStatus = async () => {
    if (creatingStatus) return;
    if (!newStatusName.trim()) { showValidationError("Status name is required"); return; }
    try {
      setCreatingStatus(true);
      const newS = await createStatus(projectId, { name: newStatusName.trim() });
      setStatuses((prev) => [...prev, newS]);
      setStatusId(newS.id);
      setStatusModalVisible(false);
      setNewStatusName("");
      showSuccess("Status added!");
    } catch { showError("Failed to create status"); }
    finally { setCreatingStatus(false); }
  };

  const handleCreatePriority = async () => {
    if (creatingPriority) return;
    if (!newPriorityName.trim()) { showValidationError("Priority name is required"); return; }
    try {
      setCreatingPriority(true);
      const newP = await createPriority(projectId, { name: newPriorityName.trim() });
      setPriorities((prev) => [...prev, newP]);
      setPriorityId(newP.id);
      setPriorityModalVisible(false);
      setNewPriorityName("");
      showSuccess("Priority added!");
    } catch { showError("Failed to create priority"); }
    finally { setCreatingPriority(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View className={`flex-1 justify-end bg-black/40`}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          // className="max-h-[85%]"
        >
          <LinearGradient
            colors={[APP_THEME.colors.surfaceAlt, APP_THEME.colors.bg]}
            className=" overflow-hidden rounded-t-[20px] border-x border-t border-[#4B5563] "
            style={{ maxHeight: SCREEN_HEIGHT * TASK_MODAL_MAX_HEIGHT_RATIO }}
          >

            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-[#374151] px-[18px] pb-[14px] pt-[18px]">
              <Text className="text-base font-bold text-[#F3F4F6]">New Task</Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="h-7 w-7 items-center justify-center rounded-full border border-[#4B5563] bg-[#374151]"
              >
                <Ionicons name="close" size={15} color={COLORS.textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }}>

              {/* Title + Description — single card, no label overhead */}
              <View className="mb-[14px] mt-[14px] mx-[18px] overflow-hidden rounded-xl border border-[#4B5563] bg-[#374151]">
                <TextInput
                  className="px-[14px] pb-[10px] pt-3 text-[15px] font-semibold text-[#F3F4F6]"
                  placeholder="Task title"
                  placeholderTextColor={COLORS.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  editable={!saving}
                />
                <View className="mx-[14px] h-px bg-[#4B5563]" />
                <TextInput
                  className="min-h-[52px] px-[14px] pb-3 pt-[10px] text-[13px] text-[#9CA3AF]"
                  placeholder="Description (optional)"
                  placeholderTextColor={COLORS.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  editable={!saving}
                />
              </View>

              <RowDivider />

              {/* Status */}
              <View className="flex-row items-center gap-3 px-[18px] py-[13px]">
                <RowIcon name="flag-outline" />
                <Text className="flex-1 text-[13px] font-medium text-[#F3F4F6]">Status{projectId ? " *" : ""}</Text>
              </View>
              <View className="flex-row flex-wrap gap-[6px] pb-[14px] pl-[58px] pr-[18px]">
                {statuses.map((st) => (
                  <SelectionChip
                    key={st.id}
                    label={st.name}
                    selected={statusId === st.id}
                    onPress={() => setStatusId(st.id)}
                    disabled={saving}
                    dotColor={chipDotColor(st.name)}
                  />
                ))}
                <AddChip onPress={() => setStatusModalVisible(true)} disabled={saving || creatingStatus} />
              </View>

              <RowDivider />

              {/* Priority */}
              <View className="flex-row items-center gap-3 px-[18px] py-[13px]">
                <RowIcon name="alert-circle-outline" />
                <Text className="flex-1 text-[13px] font-medium text-[#F3F4F6]">Priority{projectId ? " *" : ""}</Text>
              </View>
              <View className="flex-row flex-wrap gap-[6px] pb-[14px] pl-[58px] pr-[18px]">
                {priorities.map((pr) => (
                  <SelectionChip
                    key={pr.id}
                    label={pr.name}
                    selected={priorityId === pr.id}
                    onPress={() => setPriorityId(pr.id)}
                    disabled={saving}
                    dotColor={chipDotColor(pr.name)}
                  />
                ))}
                <AddChip onPress={() => setPriorityModalVisible(true)} disabled={saving || creatingPriority} />
              </View>

              <RowDivider />

              {/* Assignee */}
              {projectMembers.length > 0 && (
                <>
                  <View className="flex-row items-center gap-3 px-[18px] py-[13px]">
                    <RowIcon name="person-outline" />
                    <Text className="flex-1 text-[13px] font-medium text-[#F3F4F6]">Assignee</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="flex-row gap-2 pb-[14px] pl-[58px] pr-[18px]"
                  >
                    <TouchableOpacity
                      onPress={() => setAssigneeId(undefined)}
                      activeOpacity={0.7}
                      className={`min-w-[58px] items-center rounded-[10px] border px-[10px] py-2 ${
                        !assigneeId ? "border-[#2563EB] bg-[#1E3A8A]" : "border-[#4B5563] bg-[#374151]"
                      }`}
                    >
                      <View className="mb-1 h-8 w-8 items-center justify-center rounded-full bg-[#1F2937]">
                        <Ionicons name="person-outline" size={14} color={!assigneeId ? COLORS.accent : COLORS.textSub} />
                      </View>
                      <Text className={`text-[11px] ${!assigneeId ? "font-medium text-[#F3F4F6]" : "text-[#9CA3AF]"}`}>
                        None
                      </Text>
                    </TouchableOpacity>

                    {projectMembers.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setAssigneeId(m.id)}
                        activeOpacity={0.7}
                        className={`min-w-[58px] items-center rounded-[10px] border px-[10px] py-2 ${
                          assigneeId === m.id ? "border-[#2563EB] bg-[#1E3A8A]" : "border-[#4B5563] bg-[#374151]"
                        }`}
                      >
                        {m.profileImage ? (
                          <Image source={{ uri: resolveFileUrl(m.profileImage) }} className="mb-1 h-8 w-8 rounded-full" />
                        ) : (
                          <View className="mb-1 h-8 w-8 items-center justify-center rounded-full bg-[#1F2937]">
                            <Text className={`text-[13px] font-semibold ${assigneeId === m.id ? "text-[#3B82F6]" : "text-[#9CA3AF]"}`}>
                              {m.name?.charAt(0)?.toUpperCase() || "?"}
                            </Text>
                          </View>
                        )}
                        <Text
                          className={`text-[11px] ${assigneeId === m.id ? "font-medium text-[#F3F4F6]" : "text-[#9CA3AF]"}`}
                          numberOfLines={1}
                        >
                          {m.name || m.email}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <RowDivider />
                </>
              )}

              {/* Due Date */}
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                disabled={saving}
                activeOpacity={0.7}
                className="flex-row items-center gap-3 px-[18px] py-[13px]"
              >
                <RowIcon name="calendar-outline" />
                <Text className="flex-1 text-[13px] font-medium text-[#F3F4F6]">Due date</Text>
                <Text className={`text-[13px] ${dueDate ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                  {dueDate ? formatLocalDate(dueDate) : "Select"}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={dueDate ?? new Date()}
                  minimumDate={getStartOfToday()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, d) => { setShowDatePicker(false); if (d) setDueDate(setToEndOfDay(d)); }}
                />
              )}

              <RowDivider />

              {/* Attachments */}
              <TouchableOpacity
                onPress={handlePickAttachment}
                disabled={saving}
                activeOpacity={0.7}
                className="flex-row items-center gap-3 px-[18px] py-[13px]"
              >
                <RowIcon name="attach-outline" />
                <Text className="flex-1 text-[13px] font-medium text-[#F3F4F6]">Attachments</Text>
                {attachments.length > 0 ? (
                  <View className="rounded-[10px] bg-[#1E3A8A] px-2 py-[2px]">
                    <Text className="text-xs font-semibold text-[#3B82F6]">{attachments.length}</Text>
                  </View>
                ) : (
                  <Text className="text-[13px] text-[#6B7280]">Add files</Text>
                )}
                <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
              </TouchableOpacity>

              {attachments.length > 0 && (
                <View className="gap-[6px] pb-[10px] pl-[58px] pr-[18px]">
                  {attachments.map((file, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setPreviewAttachment(file)}
                      activeOpacity={0.8}
                      className="flex-row items-center gap-2 rounded-lg border border-[#4B5563] bg-[#374151] px-[10px] py-2"
                    >
                      <Ionicons name="document-outline" size={14} color={COLORS.accent} />
                      <Text className="flex-1 text-xs text-[#9CA3AF]" numberOfLines={1}>{file.name}</Text>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <Ionicons name="close-circle" size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View className="h-2" />
            </ScrollView>

            {/* Footer */}
            <View className={`gap-2 border-t border-[#374151] bg-transparent px-[18px] pt-[14px] ${Platform.OS === "ios" ? "pb-[34px]" : "pb-5"}`}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={saving}
                activeOpacity={0.85}
                className={`flex-row items-center justify-center gap-[7px] rounded-xl bg-[#3B82F6] py-[14px] ${saving ? "opacity-70" : "opacity-100"}`}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                      <Text className="text-[15px] font-bold text-white">Create Task</Text>
                    </>
                  )
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} disabled={saving} activeOpacity={0.7} className="items-center py-[6px]">
                <Text className="text-[13px] text-[#9CA3AF]">Cancel</Text>
              </TouchableOpacity>
            </View>

          </LinearGradient>
        </KeyboardAvoidingView>
      </View>

      {/* New Status */}
      <MiniInputModal
        visible={statusModalVisible}
        title="New Status"
        placeholder="e.g. Blocked, In Review..."
        value={newStatusName}
        onChange={setNewStatusName}
        onConfirm={handleCreateStatus}
        onDismiss={() => setStatusModalVisible(false)}
        loading={creatingStatus}
        confirmLabel="Create Status"
      />

      {/* New Priority */}
      <MiniInputModal
        visible={priorityModalVisible}
        title="New Priority"
        placeholder="e.g. Critical, Blocker..."
        value={newPriorityName}
        onChange={setNewPriorityName}
        onConfirm={handleCreatePriority}
        onDismiss={() => setPriorityModalVisible(false)}
        loading={creatingPriority}
        confirmLabel="Create Priority"
      />

      {/* Attachment preview */}
      <Modal visible={!!previewAttachment} animationType="fade" transparent onRequestClose={() => setPreviewAttachment(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setPreviewAttachment(null)} className="flex-1 items-center justify-center bg-black/70 px-6">
          <TouchableOpacity activeOpacity={1} className="w-full rounded-2xl border border-[#4B5563] bg-[#1F2937] p-5">
            <View className="mb-[14px] flex-row items-center justify-between">
              <Text className="mr-3 flex-1 text-[15px] font-bold text-[#F3F4F6]" numberOfLines={1}>
                {previewAttachment?.name}
              </Text>
              <TouchableOpacity onPress={() => setPreviewAttachment(null)}>
                <Ionicons name="close" size={18} color={COLORS.textSub} />
              </TouchableOpacity>
            </View>
            <View className="mb-[14px] h-[200px] items-center justify-center overflow-hidden rounded-[10px] border border-[#4B5563] bg-[#111827]">
              {previewAttachment?.mimeType?.startsWith("image/") ? (
                <Image source={{ uri: previewAttachment.uri }} className="h-full w-full" resizeMode="contain" />
              ) : (
                <Ionicons name="document-outline" size={48} color={COLORS.textSub} />
              )}
            </View>
            <View className="flex-row gap-[10px]">
              <TouchableOpacity onPress={handleOpenAttachment} className="flex-1 flex-row items-center justify-center gap-[6px] rounded-[10px] bg-[#3B82F6] py-3">
                <Ionicons name="open-outline" size={15} color="#fff" />
                <Text className="text-sm font-semibold text-white">Open</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPreviewAttachment(null)}
                className="flex-1 items-center justify-center rounded-[10px] border border-[#4B5563] bg-[#374151] py-3"
              >
                <Text className="text-sm font-semibold text-[#9CA3AF]">Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {AlertComponent}
    </Modal>
  );
}