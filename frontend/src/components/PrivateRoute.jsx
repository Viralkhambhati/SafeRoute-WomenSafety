import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ==========================================================
// Private Route Component
// ==========================================================

// This component protects routes that require login.
const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-text text-xl font-medium">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default PrivateRoute;