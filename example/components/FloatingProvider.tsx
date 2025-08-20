import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface FloatingContextProps {
  open: boolean;
  toggle: () => void;
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
  const [open, setOpen] = useState<boolean>(false);

  const toggle = () => setOpen((prev) => !prev);

  return (
    <FloatingContext.Provider
      value={{
        open,
        toggle,
      }}
    >
      {children}
    </FloatingContext.Provider>
  );
};
