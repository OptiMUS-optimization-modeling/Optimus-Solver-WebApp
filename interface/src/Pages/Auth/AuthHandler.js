import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../Services/firebaseConfig";

const AuthHandler = ({ children }) => {
  let navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("User:", user);
      if (!user && !["/login", "/signup"].includes(window.location.pathname)) {
        navigate("/login");
      } else if (
        user &&
        ["/login", "/signup"].includes(window.location.pathname)
      ) {
        navigate("/dashboard");
      }
      console.log("User:", user);
    });

    return () => unsubscribe();
  }, [navigate]);

  return children;
};

export default AuthHandler;
