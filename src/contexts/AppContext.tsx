import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

// Define the context type
interface AppContextType {
  isMobile: boolean;
}

// Create the context with default values
const AppContext = createContext<AppContextType>({
  isMobile: false
});

// Props for the provider component
interface AppProviderProps {
  children: ReactNode;
}

/**
 * Simple throttle function to limit execution frequency
 */
function throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Provider component that makes app-level state available
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Mobile detection state
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Detect mobile devices with throttled resize handler
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  // Create throttled version of checkMobile
  const throttledCheckMobile = useMemo(
    () => throttle(checkMobile, 200), 
    [checkMobile]
  );
  
  useEffect(() => {
    // Initial check
    checkMobile();
    
    // Listen for window resize with throttling to improve performance
    window.addEventListener('resize', throttledCheckMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', throttledCheckMobile);
  }, [checkMobile, throttledCheckMobile]);

  // Context value - memoize to prevent unnecessary re-renders
  const value = useMemo(() => ({
    isMobile
  }), [isMobile]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook to use the app context
 * @returns App context
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
}; 