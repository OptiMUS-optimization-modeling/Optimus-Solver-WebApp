// In AuthHandler.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../Services/firebaseConfig";

const AuthHandler = ({ children }) => {
    let navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("User:", user);
            // if user is not logged in and the current route is not /login or /signup
            if (
                !user &&
                !["/login", "/signup"].includes(window.location.pathname)
            ) {
                navigate("/login");
            }
            // else if (
            //     user &&
            //     !user.emailVerified &&
            //     !["/login", "/signup"].includes(window.location.pathname)
            // ) {
            //     navigate("/login");
            // }
            else if (
                user &&
                ["/login", "/signup"].includes(window.location.pathname)
            ) {
                navigate("/dashboard");
            }

            // if (user) {
            //     // If the user is logged in, stay on the current page or redirect to home
            //     navigate("/");
            // } else {
            //     // If the user is not logged in, redirect to the login page
            //     navigate("/login");
            // }
            console.log("User:", user);
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, [navigate]);

    return children;
};

export default AuthHandler;
