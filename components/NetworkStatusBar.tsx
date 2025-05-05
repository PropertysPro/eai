import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetwork } from '@/context/network-context';
import { Wifi, WifiOff } from 'lucide-react-native';
import { colors as Colors } from '@/constants/colors';

interface NetworkStatusBarProps {
  showOnlyWhenOffline?: boolean;
}

const NetworkStatusBar: React.FC<NetworkStatusBarProps> = ({ 
  showOnlyWhenOffline = true 
}) => {
  const { isConnected, isInternetReachable } = useNetwork();
  const translateY = React.useRef(new Animated.Value(-50)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    if (isConnected === false || (isInternetReachable === false && isConnected === true)) {
      // Show the status bar
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!showOnlyWhenOffline || isConnected === true) {
      // Hide the status bar
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isConnected, isInternetReachable, showOnlyWhenOffline]);
  
  // If we're only showing when offline and we're connected, don't render
  if (showOnlyWhenOffline && isConnected === true && isInternetReachable !== false) {
    return null;
  }
  
  const isOffline = isConnected === false || isInternetReachable === false;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        isOffline ? styles.offlineContainer : styles.onlineContainer,
        {
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      {isOffline ? (
        <>
          <WifiOff size={16} color="#fff" />
          <Text style={styles.statusText}>You're offline</Text>
        </>
      ) : (
        <>
          <Wifi size={16} color="#fff" />
          <Text style={styles.statusText}>Connected</Text>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    zIndex: 1000,
  },
  offlineContainer: {
    backgroundColor: Colors.error,
  },
  onlineContainer: {
    backgroundColor: Colors.success,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default NetworkStatusBar;