import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../Services/AuthContext";

const AuthHandler = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status, sessionReady } = useAuth();

  useEffect(() => {
    if (status === "loading") return;
    if (user && !sessionReady) return; // wait until server session is ready
    const publicPaths = [
      "/login",
      "/signup",
      "/terms-of-service",
      "/privacy-policy",
    ];
    const isPublic = publicPaths.includes(location.pathname);

    if (!user && !isPublic) {
      navigate("/login", { replace: true });
    } else if (user && ["/login", "/signup"].includes(location.pathname)) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, status, sessionReady, location, navigate]);

  if (status === "loading" || (user && !sessionReady)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return children;
};

export default AuthHandler;
