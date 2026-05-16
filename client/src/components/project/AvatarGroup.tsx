import { ProjectMember } from "@/src/app/projects/[id]";
import { resolveFileUrl } from "@/src/utils/url";
import { Image, Text, View } from "react-native";

export function AvatarGroup({
    members,
    maxVisible = 4,
  }: {
    members: ProjectMember[];
    maxVisible?: number;
  }) {
    const visible = members.slice(0, maxVisible);
    const extra = members.length - visible.length;
  
    const getInitials = (member: ProjectMember) => {
      const name = member.name || member.fullName || member.username || "?";
      const parts = name.trim().split(" ");
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (
        parts[0].charAt(0).toUpperCase() +
        parts[parts.length - 1].charAt(0).toUpperCase()
      );
    };
  
    const getColor = (name?: string) => {
      if (!name) return "#6B7280";
      const colors = [
        "#60A5FA",
        "#34D399",
        "#F472B6",
        "#A78BFA",
        "#FBBF24",
        "#F87171",
      ];
      const index = name
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[index % colors.length];
    };
  
    return (
      <View className="flex-row items-center">
        {visible.map((member, index) => {
          const name =
            member.name || member.fullName || member.username || "User";
          return (
            <View
              key={member.id ?? index}
              style={{
                marginLeft: index === 0 ? 0 : -10,
                zIndex: visible.length - index,
              }}
            >
              {member.avatarUrl ? (
                <Image
                  source={{ uri: resolveFileUrl(member.avatarUrl) }}
                  className="w-8 h-8 rounded-full border-2 border-gray-900"
                />
              ) : (
                <View
                  className="w-8 h-8 rounded-full border-2 border-gray-900 items-center justify-center"
                  style={{ backgroundColor: `${getColor(name)}30` }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: getColor(name) }}
                  >
                    {getInitials(member)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
        {extra > 0 && (
          <View
            className="w-8 h-8 rounded-full bg-gray-700/80 border-2 border-gray-900 items-center justify-center"
            style={{ marginLeft: -10 }}
          >
            <Text className="text-xs text-gray-300 font-semibold">
              +{extra}
            </Text>
          </View>
        )}
      </View>
    );
  }