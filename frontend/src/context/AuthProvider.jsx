import { createContext, useState, useEffect, useCallback } from "react";
import api from "../api/axiosInstance";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Manage the current JWT access token and the decoded user profile
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

// Login
  const login = async (email, password) => {
    // Authenticate user credentials and update global auth state
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.accessToken;

      // Update state and configure Axios default headers for subsequent requests
      setAccessToken(token);
      api.defaults.headers.Authorization = `Bearer ${token}`;

      // Decode payload to populate user profile without extra API call
      const decoded = jwtDecode(token);
      setUser(decoded);

      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: err.response?.data?.message };
    }
  };

// Logout
  const logout = async () => {
    // Notify backend to invalidate session and clear local auth state
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error(err);
    }
    setAccessToken(null);
    setUser(null);
  };

// Refresh token
  const refreshToken = useCallback(async () => {
    // Prevent refresh logic during development with mock tokens
    //TEMPORARY
    if (accessToken === "fake.jwt.token") return;

    try {
      // Exchange refresh cookie for a new access token
      const res = await api.post("/auth/refresh");
      const token = res.data.accessToken;

      // Synchronize new token with state and Axios interceptors
      setAccessToken(token);
      api.defaults.headers.Authorization = `Bearer ${token}`;

      const decoded = jwtDecode(token);
      setUser(decoded);

    } catch (err) {
      console.error("Refresh token failed:", err);
      // Force logout if the refresh cycle fails (e.g., expired refresh token)
      logout();
    }
  }, [accessToken, logout]);

  // Silently restore session on page load using the HttpOnly refresh cookie
  useEffect(() => {
    api.post("/auth/refresh")
      .then(res => {
        const token = res.data.accessToken;
        setAccessToken(token);
        api.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(jwtDecode(token));
      })
      .catch(() => {
        // No valid refresh cookie — user must log in
      })
      .finally(() => setLoading(false));
  }, []);

  // Refresh token every 15 min
  useEffect(() => {
    // Setup a recurring timer to rotate the access token before expiration
    if (!accessToken) return;
    const interval = setInterval(() => {
      refreshToken();
    }, REFRESH_INTERVAL);

    // Clean up interval on unmount or when token changes
    return () => clearInterval(interval);
  }, [refreshToken]);

  // Attaching access token to all requests
  useEffect(() => {
    // Inject the Bearer token into the headers of every outgoing Axios request
    const interceptor = api.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Remove interceptor to prevent memory leaks or stale token usage
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [accessToken]);

  //TEMPORARY
  const mockAdminLogin = () => {
    // Bypass real authentication for rapid development/testing
    console.log("MOCK ADMIN LOGIN CLICKED");

    const fakeToken =
      "fake.jwt.token"; 

    const fakeUser = {
      id: 1,
      role: "ADMIN",
      email: "admin@example.com",
      name: "Dev Admin",
    };

    setAccessToken(fakeToken);
    setUser(fakeUser);
    setLoading(false);
  };

  return (
    // Provide authentication state and methods to the entire application tree
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        logout,
        mockAdminLogin, //TEMPORARY
        isAuthenticated: !!accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
