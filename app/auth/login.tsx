import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';
import SocialLoginButton from '@/components/SocialLoginButton';
import { useAuth } from '@/context/auth-context';
import AnimatedBubble from '@/components/AnimatedBubble';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithApple, loginWithFacebook, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };
  
  const validatePassword = () => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };
  
  const handleLogin = async () => {
    // Reset errors
    setLoginError('');
    
    // Validate inputs
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    try {
      await login({ email, password });
      console.log("Login successful, navigating to home page");
      router.replace('/(tabs)');
    } catch (error: any) {
      setLoginError(error.message || 'Login failed. Please try again.');
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Facebook Login Failed', error.message);
    }
  };

  
  const handleAppleLogin = async () => {
    try {
      await loginWithApple();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Apple Login Failed', error.message);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => {
          try {
            // Try to go back, but if it fails (no screen to go back to),
            // navigate to splash screen instead
            router.canGoBack() ? router.back() : router.replace('/splash');
          } catch (error) {
            // Fallback if router.canGoBack() is not available or fails
            router.replace('/splash');
          }
        }}
      >
        <ArrowLeft size={24} color={Colors.text} />
      </TouchableOpacity>
      {/* Adjust keyboardVerticalOffset to match your header/nav height if needed */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0} // 40 is a safe default for iOS header
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollViewContent, { flexGrow: 1, justifyContent: 'center', minHeight: 500 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bubbleContainer}>
            <AnimatedBubble isActive={true} size={120} />
          </View>
          
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          
          {loginError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{loginError}</Text>
            </View>
          ) : null}
          
          <View style={styles.inputContainer}>
            <Mail size={20} color={Colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.input.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onBlur={validateEmail}
            />
          </View>
          {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          
          <View style={styles.inputContainer}>
            <Lock size={20} color={Colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.input.placeholder}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onBlur={validatePassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={Colors.textLight} />
              ) : (
                <Eye size={20} color={Colors.textLight} />
              )}
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.socialButtonsContainer}>
            <SocialLoginButton 
              provider="google"
              onPress={handleGoogleLogin}
              isLoading={isLoading}
            />
            <SocialLoginButton 
              provider="facebook"
              onPress={handleFacebookLogin}
              isLoading={isLoading}
            />
            {Platform.OS === 'ios' && (
              <SocialLoginButton 
                provider="apple"
                onPress={handleAppleLogin}
                isLoading={isLoading}
              />
            )}
          </View>
          
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center', // Ensures content is centered if short
    minHeight: 500, // Ensures enough space for all fields
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  bubbleContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Colors.input.text,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  fieldError: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textLight,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButtonsContainer: {
    marginBottom: 32,
    gap: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  registerText: {
    color: Colors.textLight,
    fontSize: 14,
  },
  registerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
