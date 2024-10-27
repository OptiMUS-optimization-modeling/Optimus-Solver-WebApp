import Navigator from "../../Utils/Navigator.js";
import MainContainer from "./MainContainer.js";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";

import { auth } from "../../Services/firebaseConfig.js"; // Adjust the path as necessary
import { onAuthStateChanged } from "firebase/auth";

import "./MainApp.css";

function MainApp({ isDark, setIsDark }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        console.log(user);
      } else {
        // User is signed out
        console.log("User is signed out");
      }
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);
  const [currentStep, setCurrentStep] = useState(0);

  // get project_id from path="/project/:project_id"
  const { project_id } = useParams();
  const [project, setProject] = useState({});
  const [dummyState, setDummyState] = useState(false); // Dummy state to force re-render

  const updateProject = useCallback(async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Wait for 0.5 seconds
      const response = await fetch(
        process.env.REACT_APP_BACKEND_URL + "/projects/getProject",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ project_id }),
        }
      );
      const data = await response.json();
      console.log("Project:", data["project"]);
      setProject(data["project"]);
      setDummyState((prev) => !prev); // Toggle dummy state to force re-render
      return data["project"];
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  }, [project_id]);

  useEffect(() => {
    updateProject();
  }, [project_id, updateProject]);

  const [data, setData] = useState(
    () => JSON.parse(localStorage.getItem("data")) || {}
  );

  useEffect(() => {
    localStorage.setItem("data", JSON.stringify(data));
  }, [data]);

  const [results, setResults] = useState(
    () => JSON.parse(localStorage.getItem("results")) || ""
  );

  const resetState = () => {
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/projects/resetProject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          project_id: project.id,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Reset Project:", data);
          updateProject();
        });
    } catch (error) {
      console.error("Error resetting project:", error);
    }
  };

  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center ">
        <MainContainer
          isDark={isDark}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          data={data}
          setData={setData}
          results={results}
          setResults={setResults}
          resetState={resetState}
          project={project}
          updateProject={updateProject}
        />
      </div>

      <div className="drawer-side h-100">
        <label
          htmlFor="my-drawer-2"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <aside className="bg-base-100 w-70 justify-between flex flex-col h-full ">
          <div>
            <div className="h-4"> </div>
            <div className="flex flex-col justify-center pl-10">
              <Navigator
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
              />
            </div>
          </div>
          <div className="flex flex-col justify-center items-center mb-5 ml-5">
            <div className="flex flex-row justify-between items-center mt-3">
              <div className="flex flex-row justify-center items-center mt-2 mx-2">
                <a
                  href="https://github.com/OptiMUS-optimization-modeling/Optimus-Solver-WebApp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-github fa-2x"></i> {/* GitHub icon */}
                </a>
              </div>
              <p className="text-md mx-2">
                {" "}
                <a
                  className="link"
                  href="mailto:teshnizi@stanford.edu"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Have Feedback?
                </a>
              </p>
            </div>

            <div className="flex flex-row justify-center items-center mt-2">
              <p className="text-sm">
                Made with{" "}
                <span role="img" aria-label="heart">
                  ❤️
                </span>{" "}
                at{" "}
                <a
                  className="link link-hover"
                  href="https://web.stanford.edu/~udell/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Udell Lab
                </a>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default MainApp;
