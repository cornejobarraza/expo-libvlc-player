import React, { createContext, ReactNode, useContext, useState } from "react";

interface PlayerContextProps {
  show: boolean;
  toggle: () => void;
}

const PlayerContext = createContext<PlayerContextProps | null>(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used within an PlayerProvider");
  }

  return context;
};

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [show, setShow] = useState<boolean>(false);

  const toggle = () => setShow((prev) => !prev);

  return (
    <PlayerContext.Provider
      value={{
        show,
        toggle,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
