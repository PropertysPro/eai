import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as Colors } from '@/constants/colors';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last Updated: June 1, 2023</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing or using the Ella AI application ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            Ella AI is an artificial intelligence real estate broker assistant that provides property recommendations, market insights, and real estate advice. The App uses machine learning algorithms to analyze user preferences and provide personalized recommendations.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            To access certain features of the App, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Content</Text>
          <Text style={styles.paragraph}>
            By submitting content to the App, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute your content in any existing or future media.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content, features, and functionality of the App, including but not limited to text, graphics, logos, icons, and software, are the exclusive property of Ella AI and are protected by copyright, trademark, and other intellectual property laws.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            The App and its content are provided on an "as is" basis. We make no warranties, expressed or implied, and hereby disclaim all warranties, including without limitation, implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Indemnification</Text>
          <Text style={styles.paragraph}>
            You agree to indemnify and hold harmless Ella AI, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) that arise from or relate to your use of the App.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates, without regard to its conflict of law provisions.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these Terms at any time. We will provide notice of any material changes by updating the "Last Updated" date at the top of these Terms. Your continued use of the App after such modifications will constitute your acknowledgment and agreement to the modified Terms.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms, please contact us at support@ella-ai.com.
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
});