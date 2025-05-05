import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Image, View, ActivityIndicator } from 'react-native';
import { colors as Colors } from '@/constants/colors';

interface SocialLoginButtonProps {
  provider: 'google' | 'apple' | 'facebook';
  onPress: () => void;
  isLoading: boolean;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ provider, onPress, isLoading }) => {
  const getButtonStyle = () => {
    if (provider === 'google') {
      return styles.googleButton;
    } else if (provider === 'apple') {
      return styles.appleButton;
    } else if (provider === 'facebook') {
      return styles.facebookButton;
    }
    return {};
  };
  
  const getTextStyle = () => {
    if (provider === 'google') {
      return styles.googleText;
    } else if (provider === 'apple') {
      return styles.appleText;
    } else if (provider === 'facebook') {
      return styles.facebookText;
    }
    return {};
  };
  
  const getButtonText = () => {
    if (provider === 'google') {
      return 'Continue with Google';
    } else if (provider === 'apple') {
      return 'Continue with Apple';
    } else if (provider === 'facebook') {
      return 'Continue with Facebook';
    }
    return '';
  };
  
  const getIcon = () => {
    if (provider === 'google') {
      return 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg';
    } else if (provider === 'apple') {
      return 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg';
    } else if (provider === 'facebook') {
      return 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png';
    }
    return '';
  };
  
  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), isLoading && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={provider === 'apple' ? '#fff' : '#333'} />
      ) : (
        <>
          <Image
            source={{ uri: getIcon() }}
            style={styles.icon}
          />
          <Text style={[styles.text, getTextStyle()]}>{getButtonText()}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  facebookButton: {
    backgroundColor: '#1877f3',
    borderColor: '#1877f3',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  googleText: {
    color: '#333',
  },
  appleText: {
    color: '#fff',
  },
  facebookText: {
    color: '#fff',
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
});

export default SocialLoginButton;