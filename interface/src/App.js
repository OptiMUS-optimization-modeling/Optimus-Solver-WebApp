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
import TermsOfService from "./Pages/TermsOfService";
import PrivacyPolicy from "./Pages/PrivacyPolicy";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <Router>
      <Header
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        isDark={isDark}
        setIsDark={setIsDark}
      />
      <AuthHandler currentUser={currentUser}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
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
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </AuthHandler>
    </Router>
  );
}

export default App;
