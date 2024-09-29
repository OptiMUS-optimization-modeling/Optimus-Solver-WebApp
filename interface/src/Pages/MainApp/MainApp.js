import Navigator from "../../Utils/Navigator.js";
import MainContainer from "./MainContainer.js";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";

import { auth } from "../../Services/firebaseConfig.js"; // Adjust the path as necessary
import { onAuthStateChanged } from "firebase/auth";

import "./MainApp.css";

function MainApp({ isDark, setIsDark }) {
  // const [currentUser, setCurrentUser] = useState(null);
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

  const updateProject = useCallback(async () => {
    try {
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

  // // ================================================
  // // Results
  // // ================================================

  const [results, setResults] = useState(
    () => JSON.parse(localStorage.getItem("results")) || ""
  );

  // useEffect(() => {
  //     localStorage.setItem("results", JSON.stringify(results));
  // }, [results]);

  // // ================================================
  // // Unique user id (initialized as a random 32 character string)
  // // ================================================

  // const [userId, setUserId] = useState(
  //     () =>
  //         JSON.parse(localStorage.getItem("userId")) ||
  //         Math.random().toString(36).substr(2, 9)
  // );

  // useEffect(() => {
  //     localStorage.setItem("userId", JSON.stringify(userId));
  // }, [userId]);

  // ================================================
  // Project
  // ================================================

  // ================================================
  // Render
  // ================================================

  const resetState = () => {
    // send a request to reset the project
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

    // reset everything except dark mode
    // setProblemDescription("");
    // setFormattedDescription("");
    // setParameters({});
    // setConstraints([]);
    // setObjective([
    //     {
    //         id: 0,
    //         formulation: "",
    //         code: "",
    //         description: "",
    //     },
    // ]);
    // setBackground([]);
    // setCurrentStep(0);
    // setVariables({});
    // setData({});
    // setResults("");
    // setDataButtonContent("Continue with dummy data");
  };

  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center ">
        <MainContainer
          isDark={isDark}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          // problemDescription={problemDescription}
          // setProblemDescription={setProblemDescription}
          // formattedDescription={formattedDescription}
          // setFormattedDescription={setFormattedDescription}
          // parameters={parameters}
          // setParameters={setParameters}
          // constraints={constraints}
          // setConstraints={setConstraints}
          // objective={objective}
          // setObjective={setObjective}
          // background={background}
          // setBackground={setBackground}
          // variables={variables}
          // setVariables={setVariables}
          data={data}
          setData={setData}
          results={results}
          setResults={setResults}
          // userId={userId}
          resetState={resetState}
          // dataButtonContent={dataButtonContent}
          // setDataButtonContent={setDataButtonContent}
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
            {/* <button
                            className="btn btn-primary w-3/4"
                            onClick={() => {
                                resetState();
                                window.location.reload();
                            }}
                        >
                            Reset
                        </button> */}
            <div className="flex flex-row justify-between items-center mt-3">
              <div className="flex flex-row justify-center items-center mt-2 mx-2">
                <a
                  href="https://github.com/teshnizi/optimus"
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
            {/* a row with icons with links to github, X, etc. */}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default MainApp;
