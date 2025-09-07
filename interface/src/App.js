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
import TermsOfService from "./Pages/TermsOfService";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import { AuthProvider } from "./Services/AuthContext";

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

  // Auth state handled globally in AuthProvider

  return (
    <AuthProvider>
      <Router>
        <Header isDark={isDark} setIsDark={setIsDark} />
        <AuthHandler>
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
    </AuthProvider>
  );
}

export default App;
