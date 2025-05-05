import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Moon, Bell, Globe, Lock, Info, ChevronRight } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { useChatStore } from '@/store/chat-store';
import { SUPPORTED_LANGUAGES } from '@/config/env';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function SettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // If preferences is undefined, show loading state
  if (!preferences) {
    return <LoadingOverlay message="Loading settings..." />;
  }
  
  // Language names mapping
  const languageNames: Record<string, string> = {
    en: 'English',
    ar: 'Arabic',
    fr: 'French',
    es: 'Spanish',
    hi: 'Hindi'
  };
  
  const handleLanguageChange = (language: string) => {
    updatePreferences({ language });
    Alert.alert('Language Updated', `App language has been changed to ${languageNames[language] || language}`);
  };
  
  const handleNotificationsToggle = () => {
    if (preferences.notifications) {
      updatePreferences({
        notifications: {
          ...preferences.notifications,
          matches: !preferences.notifications.matches
        }
      });
    }
  };
  
  const handleBiometricToggle = () => {
    updatePreferences({
      biometricAuth: !preferences.biometricAuth
    });
  };
  
  const handleDarkModeToggle = () => {
    updatePreferences({
      darkMode: !preferences.darkMode
    });
  };
  
  const handleClearData = () => {
    Alert.alert(
      'Clear App Data',
      'Are you sure you want to clear all app data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            setIsLoading(true);
            // Clear app data logic would go here
            setTimeout(() => {
              setIsLoading(false);
              Alert.alert('Data Cleared', 'All app data has been cleared successfully.');
            }, 1000);
          }
        }
      ]
    );
  };
  
  if (isLoading) {
    return <LoadingOverlay message="Clearing data..." />;
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Moon size={20} color={Colors.text} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch
                value={preferences.darkMode || false}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={preferences.darkMode ? Colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Globe size={20} color={Colors.text} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Language</Text>
              <View style={styles.settingAction}>
                <Text style={styles.settingValue}>
                  {languageNames[preferences.language] || preferences.language || 'English'}
                </Text>
                <ChevronRight size={20} color={Colors.textLight} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Bell size={20} color={Colors.text} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Property Matches</Text>
              <Switch
                value={preferences.notifications?.matches || false}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={preferences.notifications?.matches ? Colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Bell size={20} color={Colors.text} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Market Updates</Text>
              <Switch
                value={preferences.notifications?.marketUpdates || false}
                onValueChange={() => {
                  if (preferences.notifications) {
                    updatePreferences({
                      notifications: {
                        ...preferences.notifications,
                        marketUpdates: !preferences.notifications.marketUpdates
                      }
                    });
                  }
                }}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={preferences.notifications?.marketUpdates ? Colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Bell size={20} color={Colors.text} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>New Listings</Text>
              <Switch
                value={preferences.notifications?.newListings || false}
                onValueChange={() => {
                  if (preferences.notifications) {
                    updatePreferences({
                      notifications: {
                        ...preferences.notifications,
                        newListings: !preferences.notifications.newListings
                      }
                    });
                  }
                }}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={preferences.notifications?.newListings ? Colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
        
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Lock size={20} color={Colors.text} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Biometric Authentication</Text>
              <Switch
                value={preferences.biometricAuth || false}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={preferences.biometricAuth ? Colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/auth/change-password')}
          >
            <View style={styles.settingIconContainer}>
              <Lock size={20} color={Colors.text} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <ChevronRight size={20} color={Colors.textLight} />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/legal/terms')}
          >
            <View style={styles.settingIconContainer}>
              <Info size={20} color={Colors.text} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Terms of Service</Text>
              <ChevronRight size={20} color={Colors.textLight} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/legal/privacy')}
          >
            <View style={styles.settingIconContainer}>
              <Info size={20} color={Colors.text} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <ChevronRight size={20} color={Colors.textLight} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/how-we-work')}
          >
            <View style={styles.settingIconContainer}>
              <Info size={20} color={Colors.text} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>How We Work</Text>
              <ChevronRight size={20} color={Colors.textLight} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/version')}
          >
            <View style={styles.settingIconContainer}>
              <Info size={20} color={Colors.text} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleClearData}
          >
            <View style={styles.settingContent}>
              <Text style={styles.dangerText}>Clear App Data</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: Colors.textLight,
    marginRight: 8,
  },
  dangerText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '500',
  },
});