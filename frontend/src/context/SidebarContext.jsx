import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  // Manage the expanded/collapsed state of the sidebar for desktop views
  const [desktopOpen, setDesktopOpen] = useState(true);

  return (
    // Provide the sidebar state and its setter to the component tree
    <SidebarContext.Provider value={{ desktopOpen, setDesktopOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Custom hook to access the global sidebar state
export function useSidebar() {
  // Consume the SidebarContext to provide access to toggle functions and expansion state
  return useContext(SidebarContext);
}
