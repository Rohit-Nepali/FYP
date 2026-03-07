import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getCalendarConnectionStatus,
  CalendarConnectionStatus,
} from '../../services/calendarService';

export default function CalendarSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [calendarStatus, setCalendarStatus] = useState<CalendarConnectionStatus>({
    connected: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load calendar connection status
  const loadCalendarStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = await getCalendarConnectionStatus();
      setCalendarStatus(status);
    } catch (error) {
      console.error('Error loading calendar status:', error);
      setCalendarStatus({ connected: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendarStatus();
  }, [loadCalendarStatus]);

  // Handle connect/disconnect
  const handleConnectCalendar = useCallback(async () => {
    try {
      setIsConnecting(true);
      await connectGoogleCalendar();
      await loadCalendarStatus();
      Alert.alert('Success', 'Google Calendar connected successfully!');
    } catch (error: any) {
      Alert.alert(
        'Connection Failed',
        error.message || 'Failed to connect to Google Calendar'
      );
    } finally {
      setIsConnecting(false);
    }
  }, [loadCalendarStatus]);

  const handleDisconnectCalendar = useCallback(() => {
    Alert.alert(
      'Disconnect Calendar',
      'Are you sure you want to disconnect Google Calendar? Your synced events will remain on Google Calendar.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsConnecting(true);
              await disconnectGoogleCalendar();
              await loadCalendarStatus();
              Alert.alert('Success', 'Google Calendar disconnected');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to disconnect');
            } finally {
              setIsConnecting(false);
            }
          },
        },
      ]
    );
  }, [loadCalendarStatus]);

  return (
    <LinearGradient colors={theme.background.gradient as any} className="flex-1">
      <View className="flex-1 px-6 pt-12">
        {/* Header */}
        <View className="flex-row items-center mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full bg-white/10"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white ml-4">
            Calendar Settings
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Calendar Connection Card */}
            <View className="bg-white/10 rounded-2xl p-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center mr-4">
                    <Ionicons name="calendar" size={24} color="white" />
                  </View>
                  <View>
                    <Text className="text-white text-lg font-semibold">
                      Google Calendar
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {calendarStatus.connected
                        ? `Connected as ${calendarStatus.email}`
                        : 'Sync your tasks with Google Calendar'}
                    </Text>
                  </View>
                </View>
                <View
                  className={`w-3 h-3 rounded-full ${
                    calendarStatus.connected ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
              </View>

              {calendarStatus.connected ? (
                <TouchableOpacity
                  onPress={handleDisconnectCalendar}
                  disabled={isConnecting}
                  className="bg-red-500/20 py-3 rounded-xl items-center"
                >
                  {isConnecting ? (
                    <ActivityIndicator size="small" color="#ff4444" />
                  ) : (
                    <Text className="text-red-400 font-semibold">
                      Disconnect
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleConnectCalendar}
                  disabled={isConnecting}
                  className="bg-blue-500 py-3 rounded-xl items-center"
                >
                  {isConnecting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-semibold">
                      Connect Google Calendar
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Info Section */}
            <View className="bg-white/5 rounded-2xl p-6 mb-6">
              <Text className="text-white font-semibold mb-4">
                How it works
              </Text>
              
              <View className="flex-row mb-4">
                <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                  <Text className="text-blue-400 font-bold">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-300 text-sm">
                    Connect your Google Calendar to sync tasks
                  </Text>
                </View>
              </View>

              <View className="flex-row mb-4">
                <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                  <Text className="text-blue-400 font-bold">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-300 text-sm">
                    Tasks with due dates will appear in Google Calendar
                  </Text>
                </View>
              </View>

              <View className="flex-row">
                <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                  <Text className="text-blue-400 font-bold">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-300 text-sm">
                    Calendar events can be viewed in Taskora
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
}
