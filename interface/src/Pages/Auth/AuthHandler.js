import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthHandler = ({ children, currentUser }) => {
  let navigate = useNavigate();

  useEffect(() => {
    const currentPath = window.location.pathname;
    const publicPaths = ["/login", "/signup", "/terms-of-service", "/privacy-policy"];
    const authPaths = ["/login", "/signup"];
    
    if (!currentUser && !publicPaths.includes(currentPath)) {
      navigate("/login");
    } else if (currentUser && authPaths.includes(currentPath)) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  return children;
};

export default AuthHandler;
