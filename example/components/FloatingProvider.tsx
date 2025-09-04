import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface FloatingContextProps {
  showFloating: boolean;
  toggleFloating: () => void;
}

const FloatingContext = createContext<FloatingContextProps | null>(null);

export const useFloating = () => {
  const context = useContext(FloatingContext);

  if (!context) {
    throw new Error("useFloating must be used within a FloatingProvider");
  }

  return context;
};

export const FloatingProvider = ({ children }: { children: ReactNode }) => {
  const [showFloating, setShowFloating] = useState<boolean>(false);

  const toggleFloating = () => setShowFloating((prev) => !prev);

  return (
    <FloatingContext.Provider
      value={{
        showFloating,
        toggleFloating,
      }}
    >
      {children}
    </FloatingContext.Provider>
  );
};
