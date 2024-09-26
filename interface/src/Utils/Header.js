import React from "react";
import "./Header.css";
import ThemeController from "./ThemeController";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Header = ({ currentUser, setCurrentUser, isDark, setIsDark }) => {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate("/login");
      })
      .catch((error) => {
        console.error("Logout Failed", error);
      });
  };

  return (
    <div>
      <div className=" bg-primary shadow-sm sticky top-0 z-20 hidden items-center gap-2 bg-opacity-60 px-4 py-2 backdrop-blur lg:flex header">
        <div className="flex justify-center items-center pl-4">
          <ThemeController isDark={isDark} setIsDark={setIsDark} />
          <div
            className="text-2xl font-bold ml-2 cursor-pointer hover:opacity-80"
            onClick={() => {
              navigate("/dashboard");
            }}
          >
            OptiMUS
          </div>
        </div>
        <div className="flex-1 px-2 mx-2"></div>
        <div className="flex-none hidden lg:block">
          <ul className="menu menu-horizontal">
            {currentUser && (
              <li>
                <button
                  className="btn btn-ghost btn-sm rounded-btn"
                  onClick={handleLogout}
                >
                  Logout
                  <i className="fas fa-sign-out-alt ml-2"></i>
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
