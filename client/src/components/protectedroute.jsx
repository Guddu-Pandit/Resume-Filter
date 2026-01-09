import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // const token = localStorage.getItem("token");
  // return token ? children : <Navigate to="/dashboard" replace />;
  return children;
};

export default ProtectedRoute;
