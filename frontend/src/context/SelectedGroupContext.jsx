import { createContext, useContext, useState, useEffect } from "react";

const SelectedGroupContext = createContext();

export const SelectedGroupProvider = ({ children }) => {
  const [selectedGroup, setSelectedGroup] = useState(() => {
    const stored = localStorage.getItem("selectedGroup");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (selectedGroup) {
      localStorage.setItem("selectedGroup", JSON.stringify(selectedGroup));
    } else {
      localStorage.removeItem("selectedGroup");
    }
  }, [selectedGroup]);

  return (
    <SelectedGroupContext.Provider value={{ selectedGroup, setSelectedGroup }}>
      {children}
    </SelectedGroupContext.Provider>
  );
};

export const useSelectedGroup = () => useContext(SelectedGroupContext);
