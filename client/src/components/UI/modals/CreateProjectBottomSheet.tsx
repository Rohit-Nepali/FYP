import React, { useCallback, useMemo, useRef } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

interface CreateProjectBottomSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  projectTitle: string;
  projectDescription: string;
  creating: boolean;
  onChangeProjectTitle: (value: string) => void;
  onChangeProjectDescription: (value: string) => void;
  onCreateProject: () => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  submitIcon?: keyof typeof Ionicons.glyphMap;
}

export default function CreateProjectBottomSheet({
  sheetRef,
  projectTitle,
  projectDescription,
  creating,
  onChangeProjectTitle,
  onChangeProjectDescription,
  onCreateProject,
  onClose,
  title = "Create New Project",
  subtitle = "Organize your tasks into a new project.",
  submitLabel = "Create",
  submitIcon = "add-outline",
}: CreateProjectBottomSheetProps) {
  const titleInputRef = useRef<any>(null);
  const sheetIndexRef = useRef(-1);
  const snapPoints = useMemo(() => ["30%", "80%"], []);

  const handleSheetChange = useCallback((index: number) => {
    const wasClosed = sheetIndexRef.current < 0;
    if (wasClosed && index >= 0) {
      setTimeout(() => {
        titleInputRef.current?.focus?.();
      }, 80);
    }
    sheetIndexRef.current = index;
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      enableContentPanningGesture={false}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleIndicatorStyle={{ backgroundColor: "transparent" }}
      backgroundStyle={{
        backgroundColor: "#111827",
        borderTopWidth: 1,
        borderTopColor: "rgba(55, 65, 81, 0.5)",
      }}
    >
      <BottomSheetView className="bg-gray-900 rounded-t-3xl">
        <View className="w-10 h-1 bg-gray-600 rounded-full self-center mt-3 mb-2" />

        <View className="px-6 pt-2 pb-8">
          <Text className="text-white text-xl font-bold mb-1">{title}</Text>
          <Text className="text-gray-400 text-sm mb-6">{subtitle}</Text>

          <Text className="text-gray-300 text-sm font-medium mb-2">
            Project Title <Text className="text-red-400">*</Text>
          </Text>
          <BottomSheetTextInput
            ref={titleInputRef}
            value={projectTitle}
            onChangeText={onChangeProjectTitle}
            placeholder="Enter project title"
            placeholderTextColor="#4B5563"
            className="bg-gray-800 text-white rounded-xl px-4 py-3.5 mb-4 border border-gray-700/50"
          />

          <Text className="text-gray-300 text-sm font-medium mb-2">
            Description <Text className="text-gray-500 font-normal">(Optional)</Text>
          </Text>
          <BottomSheetTextInput
            value={projectDescription}
            onChangeText={onChangeProjectDescription}
            placeholder="Add a brief description"
            placeholderTextColor="#4B5563"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="bg-gray-800 text-white rounded-xl px-4 py-3.5 mb-6 border border-gray-700/50 min-h-[80px]"
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3.5 rounded-xl bg-gray-800 border border-gray-700/50 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-gray-300 font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCreateProject}
              disabled={creating || !projectTitle.trim()}
              className={`flex-1 py-3.5 rounded-xl items-center flex-row justify-center ${
                creating || !projectTitle.trim() ? "bg-blue-600/50" : "bg-blue-600"
              }`}
              activeOpacity={0.7}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name={submitIcon} size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-1">{submitLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
