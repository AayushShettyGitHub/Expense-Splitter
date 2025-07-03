import { createContext, useContext, useState } from "react";

const SelectedGroupContext = createContext();

export const SelectedGroupProvider = ({ children }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <SelectedGroupContext.Provider value={{ selectedGroup, setSelectedGroup }}>
      {children}
    </SelectedGroupContext.Provider>
  );
};

export const useSelectedGroup = () => useContext(SelectedGroupContext);
