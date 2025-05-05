import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Info, Mail, Phone, Globe, Package, Code, Server } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import { APP_VERSION, BUILD_NUMBER } from '@/config/env';
import { useSupportStore } from '@/store/support-store';

export default function VersionScreen() {
  const { supportInfo } = useSupportStore();
  
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const sendEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <Stack.Screen 
        options={{
          title: 'App Information',
          headerTitleStyle: { color: Colors.text },
        }}
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Info size={60} color={Colors.primary} />
          <Text style={styles.appName}>Ella AI</Text>
          <Text style={styles.tagline}>First AI Real Estate Broker Specialist in the World</Text>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{APP_VERSION}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>{BUILD_NUMBER}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Environment</Text>
            <Text style={styles.infoValue}>{__DEV__ ? 'Development' : 'Production'}</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity 
          style={styles.supportItem}
          onPress={() => sendEmail(supportInfo.email)}
        >
          <Mail size={24} color={Colors.primary} />
          <View style={styles.supportItemContent}>
            <Text style={styles.supportItemTitle}>Email Support</Text>
            <Text style={styles.supportItemValue}>{supportInfo.email}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.supportItem}
          onPress={() => callPhone(supportInfo.phone)}
        >
          <Phone size={24} color={Colors.primary} />
          <View style={styles.supportItemContent}>
            <Text style={styles.supportItemTitle}>Phone Support</Text>
            <Text style={styles.supportItemValue}>{supportInfo.phone}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.supportItem}
          onPress={() => openLink(`https://${supportInfo.website}`)}
        >
          <Globe size={24} color={Colors.primary} />
          <View style={styles.supportItemContent}>
            <Text style={styles.supportItemTitle}>Website</Text>
            <Text style={styles.supportItemValue}>{supportInfo.website}</Text>
          </View>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Legal</Text>
        
        <TouchableOpacity 
          style={styles.legalItem}
          onPress={() => openLink('https://ellaai.com/terms')}
        >
          <Text style={styles.legalItemText}>Terms of Service</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.legalItem}
          onPress={() => openLink('https://ellaai.com/privacy')}
        >
          <Text style={styles.legalItemText}>Privacy Policy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.legalItem}
          onPress={() => openLink('https://ellaai.com/licenses')}
        >
          <Text style={styles.legalItemText}>Open Source Licenses</Text>
        </TouchableOpacity>
        
        <Text style={styles.copyright}>
          © {new Date().getFullYear()} Ella AI. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.background, // Changed from Colors.secondary to white
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.textLight,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  supportItemContent: {
    marginLeft: 16,
    flex: 1,
  },
  supportItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  supportItemValue: {
    fontSize: 14,
    color: Colors.primary,
  },
  legalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legalItemText: {
    fontSize: 16,
    color: Colors.primary,
  },
  copyright: {
    marginTop: 32,
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
