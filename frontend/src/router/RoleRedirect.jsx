import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function RoleRedirect() {
  // Access the authenticated user from the AuthContext
  const { user } = useAuth();

  // Redirect to login page if no user session is found
  if (user === null) return <Navigate to="/login" />;

  // Map user roles to their respective dashboard routes
  const redirects = {
    ADMIN: "/admin",
    HEADMASTER: "/headmaster",
    TEACHER: "/teacher",
    STUDENT: "/student",
    PARENT: "/parent",
  };

  // Perform the role-based navigation
  return <Navigate to={redirects[user.role]} />;
}

export default RoleRedirect