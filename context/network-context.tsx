import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextType {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: null,
  isInternetReachable: null,
});

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [networkState, setNetworkState] = useState<NetInfoState>({
    isConnected: null,
    isInternetReachable: null,
    type: null,
    details: null,
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log('[Network Context] Network state changed:', state);
      setNetworkState(state);
    });

    // Initial network check
    NetInfo.fetch().then((state) => {
      console.log('[Network Context] Initial network state:', state);
      setNetworkState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);

export default NetworkContext;