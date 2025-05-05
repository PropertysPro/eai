import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as Colors } from '@/constants/colors';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last Updated: June 1, 2023</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            This Privacy Policy explains how Ella AI ("we", "us", or "our") collects, uses, and shares your personal information when you use our mobile application ("the App"). We respect your privacy and are committed to protecting your personal information.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect the following types of information:
          </Text>
          <Text style={styles.bulletPoint}>• Personal Information: Name, email address, phone number, and other contact details you provide when creating an account.</Text>
          <Text style={styles.bulletPoint}>• Property Preferences: Information about your property preferences, including location, budget, property type, and other criteria.</Text>
          <Text style={styles.bulletPoint}>• Usage Data: Information about how you use the App, including chat history, property views, and search queries.</Text>
          <Text style={styles.bulletPoint}>• Device Information: Information about your device, including device type, operating system, and unique device identifiers.</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use your information for the following purposes:
          </Text>
          <Text style={styles.bulletPoint}>• To provide and improve the App's services, including property recommendations and market insights.</Text>
          <Text style={styles.bulletPoint}>• To personalize your experience and deliver content relevant to your interests.</Text>
          <Text style={styles.bulletPoint}>• To communicate with you about the App, including updates, promotions, and responses to your inquiries.</Text>
          <Text style={styles.bulletPoint}>• To analyze usage patterns and improve the App's functionality and user experience.</Text>
          <Text style={styles.bulletPoint}>• To comply with legal obligations and protect our rights and interests.</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Information Sharing</Text>
          <Text style={styles.paragraph}>
            We may share your information with:
          </Text>
          <Text style={styles.bulletPoint}>• Service Providers: Third-party vendors who provide services on our behalf, such as hosting, data analysis, and customer service.</Text>
          <Text style={styles.bulletPoint}>• Business Partners: Real estate agencies, property developers, and other partners who may provide services or properties that match your preferences.</Text>
          <Text style={styles.bulletPoint}>• Legal Authorities: When required by law, court order, or governmental regulation.</Text>
          <Text style={styles.bulletPoint}>• Business Transfers: In connection with a merger, acquisition, or sale of assets.</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Rights</Text>
          <Text style={styles.paragraph}>
            Depending on your location, you may have the following rights regarding your personal information:
          </Text>
          <Text style={styles.bulletPoint}>• Access: The right to request access to your personal information.</Text>
          <Text style={styles.bulletPoint}>• Correction: The right to request correction of inaccurate personal information.</Text>
          <Text style={styles.bulletPoint}>• Deletion: The right to request deletion of your personal information.</Text>
          <Text style={styles.bulletPoint}>• Restriction: The right to request restriction of processing of your personal information.</Text>
          <Text style={styles.bulletPoint}>• Data Portability: The right to receive your personal information in a structured, commonly used format.</Text>
          <Text style={styles.bulletPoint}>• Objection: The right to object to processing of your personal information.</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            The App is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at privacy@ella-ai.com.
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
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 8,
  },
});