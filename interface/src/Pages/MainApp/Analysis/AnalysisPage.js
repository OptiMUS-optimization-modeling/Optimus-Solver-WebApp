import React, { useState, useEffect } from "react";

import examples from "../../../Utils/Examples";
import sendPollingRequest from "../../../Utils/Communication";

const AnalysisContainer = ({
  setCurrentStep,
  resetState,
  isAnyLoading,
  setIsAnyLoading,
  setModalTitle,
  setModalContent,
  project,
  updateProject,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tmpDescription, setTmpDescription] = useState("");

  // set tmpDescription to project.tmpDescription on load
  useEffect(() => {
    setTmpDescription(project.problemDescription);
  }, [project.problemDescription]);

  const handleAnalyzeClick = () => {
    // resetState();

    setIsLoading(true);
    setIsAnyLoading(true);

    // set problemDescription to the value of the textarea
    // setProblemDescription(tmpDescription);

    setModalTitle(
      <div className="flex-row flex">
        <div className="loading loading-lg loading-primary"></div>
        <div className="w-1/2 ml-4 text-lg flex justify-left items-center">
          Analyzing...
        </div>
      </div>
    );
    setModalContent(
      <div>
        <div className="w-1/2 ml-2 text-md">
          This may take around 30 seconds...
        </div>
      </div>
    );
    document.getElementById("my_modal_2").showModal();

    let callback = (data) => {
      console.log("Success:", data);
      updateProject();
      setIsLoading(false);
      setIsAnyLoading(false);
      document.getElementById("my_modal_2").close();

      setCurrentStep(1);
    };

    let errorCallback = (error) => {
      console.error("Error:", error);
      // alert("Can't fetch the results :( Error: " + error);
      setIsLoading(false);
      setIsAnyLoading(false);
      document.getElementById("my_modal_2").close();
    };
    console.log(project);

    sendPollingRequest(
      {
        "Content-Type": "application/json",
      },
      {
        project_id: project.id,
        problemDescription: tmpDescription,
      },
      "/extract_params",
      "POST",
      callback,
      errorCallback
    );
  };

  return (
    <div className="flex flex-col items-center ">
      <div className="flex flex-row w-ninety justify-start mt-10">
        <h1 className="text-xl w-3/4">Problem Description</h1>
      </div>
      <textarea
        placeholder="Problem description"
        value={tmpDescription}
        onChange={(e) => setTmpDescription(e.target.value)}
        className="textarea textarea-bordered w-ninety mt-2"
        rows="15"
      ></textarea>

      <div className="flex flex-row w-ninety justify-center mt-10">
        <button
          className="btn btn-secondary w-1/4 mx-10"
          onClick={() => {
            setTmpDescription(
              examples[Math.floor(Math.random() * examples.length)]
            );
          }}
        >
          I'm feeling lucky!
        </button>
        <div></div>
        <button
          className="btn btn-primary w-1/4 mx-10"
          onClick={handleAnalyzeClick}
          disabled={isLoading || isAnyLoading}
        >
          {isLoading ? (
            <span className="loading loading-dots loading-lg mt-1"></span>
          ) : (
            "Analyze"
          )}
        </button>
      </div>
    </div>
  );
};

export default AnalysisContainer;
