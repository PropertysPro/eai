import { useContext } from 'react';
import { NetworkContext } from '@/context/network-context';

export const useNetworkStatus = () => {
  const networkContext = useContext(NetworkContext);
  
  if (!networkContext) {
    throw new Error('useNetworkStatus must be used within a NetworkProvider');
  }
  
  return networkContext;
};