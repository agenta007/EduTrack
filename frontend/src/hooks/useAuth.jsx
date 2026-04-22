import { useContext } from "react";
import { AuthContext } from "../context/AuthProvider";

// Custom hook to access the global authentication state and user information
function useAuth() {
  // Consume the AuthContext to provide easy access to the JWT and user details throughout the app
  return useContext(AuthContext);
}

export default useAuth