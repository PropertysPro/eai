import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Mail, X, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';

interface EmailVerificationBannerProps {
  onDismiss?: () => void;
}

export interface RestrictedRouteProps {
  restrictedRoutes: string[];
  currentPath: string;
}

export default function EmailVerificationBanner({ 
  onDismiss,
  restrictedRoutes = ['/chat', '/add-edit-property', '/distressed-deals'],
  currentPath = ''
}: EmailVerificationBannerProps & Partial<RestrictedRouteProps>) {
  const { user, resendVerificationEmail } = useAuth();
  const router = useRouter();
  const [isResending, setIsResending] = React.useState(false);
  const [resendMessage, setResendMessage] = React.useState('');
  
  // Check if current path is restricted
  const isRestricted = React.useMemo(() => {
    if (!currentPath) return false;
    return restrictedRoutes.some(route => currentPath.includes(route));
  }, [currentPath, restrictedRoutes]);

  // Don't show the banner if the user is not logged in or email is already verified
  if (!user || user.email_verified) {
    return null;
  }

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      setResendMessage('');

      // Use the resendVerificationEmail function from the auth context
      const { success, message } = await resendVerificationEmail(user.email);
      
      if (!success) {
        console.error('Error resending verification email:', message);
        setResendMessage(`Error: ${message}`);
      } else {
        setResendMessage(message);
      }
    } catch (err: any) {
      console.error('Error resending verification email:', err.message);
      setResendMessage(`Error: ${err.message}`);
    } finally {
      setIsResending(false);
    }
  };

  // Show alert for restricted routes
  React.useEffect(() => {
    if (isRestricted && !user?.email_verified) {
      Alert.alert(
        "Email Verification Required",
        "You need to verify your email to access this feature. Please check your inbox for a verification link or request a new one.",
        [
          { 
            text: "Go Back", 
            onPress: () => router.back(),
            style: "cancel"
          },
          {
            text: "Resend Email",
            onPress: handleResendEmail
          }
        ]
      );
    }
  }, [isRestricted, user?.email_verified]);

  return (
    <>
      {isRestricted && !user?.email_verified ? (
        <View style={styles.restrictedContainer}>
          <AlertTriangle size={60} color="#FF6B6B" />
          <Text style={styles.restrictedTitle}>Email Verification Required</Text>
          <Text style={styles.restrictedMessage}>
            You need to verify your email to access this feature.
          </Text>
          <TouchableOpacity 
            style={styles.verifyButton} 
            onPress={handleResendEmail}
            disabled={isResending}
          >
            <Text style={styles.verifyButtonText}>
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Mail size={20} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Please verify your email</Text>
            <Text style={styles.message}>
              Check your inbox for a verification link. {resendMessage}
            </Text>
            {!resendMessage && (
              <TouchableOpacity 
                style={styles.resendButton} 
                onPress={handleResendEmail}
                disabled={isResending}
              >
                <Text style={styles.resendButtonText}>
                  {isResending ? 'Sending...' : 'Resend verification email'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {onDismiss && (
            <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
              <X size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  restrictedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  restrictedMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  verifyButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6200EE',
  },
  backButtonText: {
    color: '#6200EE',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconContainer: {
    backgroundColor: '#6200EE',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666666',
  },
  closeButton: {
    padding: 4,
  },
  resendButton: {
    marginTop: 8,
  },
  resendButtonText: {
    color: '#6200EE',
    fontWeight: '600',
    fontSize: 14,
  },
});
