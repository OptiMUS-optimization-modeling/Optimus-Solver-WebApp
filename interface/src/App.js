import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./Pages/Auth/Login"; // Your login component
import SignupPage from "./Pages/Auth/Signup"; // Your signup component
import MainApp from "./Pages/MainApp/MainApp"; // Your main component
import AuthHandler from "./Pages/Auth/AuthHandler"; // Import the AuthHandler component
import Dashboard from "./Pages/Dashboard/Dashboard"; // Your dashboard component
import { useState, useEffect } from "react";
import Header from "./Utils/Header.js";
import { getAuth, onAuthStateChanged } from "firebase/auth";

function App() {
  // ================================================
  // Dark mode
  // ================================================

  const [isDark, setIsDark] = useState(
    () => JSON.parse(localStorage.getItem("isDark")) || 0
  );
  useEffect(() => {
    localStorage.setItem("isDark", JSON.stringify(isDark));
  }, [isDark]);

  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user); // User is signed in
      } else {
        setCurrentUser(null); // User is signed out
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  return (
    <Router>
      <div className="h-5/6">
        <Header
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          isDark={isDark}
          setIsDark={setIsDark}
        />
        <AuthHandler>
          <Routes>
            <Route
              path="/signup"
              element={<SignupPage isDark={isDark} setIsDark={setIsDark} />}
            />
            <Route
              path="/login"
              element={<LoginPage isDark={isDark} setIsDark={setIsDark} />}
            />
            <Route
              path="/dashboard"
              element={<Dashboard isDark={isDark} setIsDark={setIsDark} />}
            />
            <Route
              path="/project/:project_id"
              element={<MainApp isDark={isDark} setIsDark={setIsDark} />}
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AuthHandler>
      </div>
    </Router>
  );
}

export default App;
