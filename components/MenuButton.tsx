import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View, Platform } from 'react-native';
import { Menu } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';

interface MenuButtonProps {
  onPress: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onPress }) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };
  
  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={[
          styles.button,
          isPressed && styles.buttonPressed
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Menu size={24} color={Colors.primary} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonPressed: {
    backgroundColor: 'rgba(98, 0, 238, 0.15)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MenuButton;
