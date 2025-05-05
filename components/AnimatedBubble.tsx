import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { colors as Colors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

interface AnimatedBubbleProps {
  isActive: boolean;
  size: number;
}

const AnimatedBubble: React.FC<AnimatedBubbleProps> = ({ isActive, size }) => {
  // Ensure the bubble size is responsive to screen size
  const responsiveSize = Math.min(size, width * 0.3, height * 0.2);
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnim1 = useRef(new Animated.Value(0)).current;
  const bubbleAnim2 = useRef(new Animated.Value(0)).current;
  const bubbleAnim3 = useRef(new Animated.Value(0)).current;
  
  // Derived animated values
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Start animations
  useEffect(() => {
    // Continuous pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Continuous slow rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    // Bubble animations
    startBubbleAnimations();
    
    return () => {
      // Cleanup animations if needed
    };
  }, []);
  
  // Additional animation when active
  useEffect(() => {
    if (isActive) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);
  
  const startBubbleAnimations = () => {
    // Bubble 1 animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleAnim1, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleAnim1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    ).start();
    
    // Bubble 2 animation with delay
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bubbleAnim2, {
            toValue: 1,
            duration: 2500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bubbleAnim2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(800),
        ])
      ).start();
    }, 500);
    
    // Bubble 3 animation with delay
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bubbleAnim3, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bubbleAnim3, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(1200),
        ])
      ).start();
    }, 1000);
  };
  
  // Bubble opacity and transform based on animation
  const bubble1Opacity = bubbleAnim1.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1, 0],
  });
  
  const bubble1Transform = bubbleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -responsiveSize * 0.4],
  });
  
  const bubble2Opacity = bubbleAnim2.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1, 0],
  });
  
  const bubble2Transform = bubbleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -responsiveSize * 0.5],
  });
  
  const bubble3Opacity = bubbleAnim3.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1, 0],
  });
  
  const bubble3Transform = bubbleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -responsiveSize * 0.3],
  });
  
  return (
    <View style={styles.container}>
      {/* Rising bubbles */}
      <Animated.View
        style={[
          styles.bubble,
          {
            width: responsiveSize * 0.1,
            height: responsiveSize * 0.1,
            borderRadius: responsiveSize * 0.05,
            left: responsiveSize * 0.2,
            opacity: bubble1Opacity,
            transform: [{ translateY: bubble1Transform }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bubble,
          {
            width: responsiveSize * 0.08,
            height: responsiveSize * 0.08,
            borderRadius: responsiveSize * 0.04,
            left: responsiveSize * 0.5,
            opacity: bubble2Opacity,
            transform: [{ translateY: bubble2Transform }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bubble,
          {
            width: responsiveSize * 0.06,
            height: responsiveSize * 0.06,
            borderRadius: responsiveSize * 0.03,
            left: responsiveSize * 0.7,
            opacity: bubble3Opacity,
            transform: [{ translateY: bubble3Transform }],
          },
        ]}
      />
      
      {/* Main bubble */}
      <Animated.View
        style={[
          styles.mainBubble,
          {
            width: responsiveSize,
            height: responsiveSize,
            borderRadius: responsiveSize / 2,
            transform: [
              { scale: pulseAnim },
              { rotate },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: responsiveSize * 0.85,
              height: responsiveSize * 0.85,
              borderRadius: responsiveSize * 0.425,
            },
          ]}
        >
          <View
            style={[
              styles.coreCircle,
              {
                width: responsiveSize * 0.6,
                height: responsiveSize * 0.6,
                borderRadius: responsiveSize * 0.3,
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  mainBubble: {
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  innerCircle: {
    backgroundColor: `${Colors.primary}30`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  coreCircle: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  bubble: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: `${Colors.primary}60`,
    zIndex: -1,
  },
});

export default AnimatedBubble;
