import { useContext } from 'react';
import { HiveContext } from '../context/HiveContext';

export const useHive = () => {
  const context = useContext(HiveContext);
  if (!context) {
    throw new Error('useHive must be used within a HiveProvider');
  }
  return context;
};
