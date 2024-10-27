import React from "react";
import AceEditor from "react-ace";

import sendPollingRequest from "../../../Utils/Communication";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-tomorrow_night";

import "./Testing.css";

const TestingPage = ({
  isDark,
  currentStep,
  setCurrentStep,
  data,
  results,
  setResults,
  setModalTitle,
  setModalContent,
  project,
  updateProject,
}) => {
  const theme = isDark ? "tomorrow_night" : "tomorrow";
  const [isRunLoading, setIsRunLoading] = React.useState(false);
  const [isFixLoading, setIsFixLoading] = React.useState(false);
  const [isSynthesizeLoading, setIsSynthesizeLoading] = React.useState(false);

  let [code, setCode] = React.useState(project.code);

  const handleSynthesizeCodeClick = () => {
    setIsSynthesizeLoading(true);
    fetch(process.env.REACT_APP_BACKEND_URL + "/getFullCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        data: data,
        project_id: project.id,
      }),
    })
      .then((response) => response.json())
      .then((res) => {
        console.log("Synthesize Success:", res);
        setCode(res.code);
        updateProject();
        setIsSynthesizeLoading(false);
      })
      .catch((error) => {
        console.error("Synthesize Error:", error);
        setIsSynthesizeLoading(false);
      });
  };

  const handleRunCodeClick = () => {
    console.log("Running code with data:", data);
    if (Object.keys(data).length === 0) {
      setModalTitle("Error");
      setModalContent(
        <div>
          <p>
            Please configure the data before running the code. You can do so in
            the
            <span
              className="text-primary cursor-pointer"
              onClick={() => {
                setCurrentStep(5);
                // close modal
                let my_modal = document.getElementById("my_modal_2");
                my_modal.close();
              }}
            >
              {" "}
              Data Processing
            </span>{" "}
            step.
          </p>
        </div>
      );
      let my_modal = document.getElementById("my_modal_2");
      my_modal.showModal();
      return;
    }

    setIsRunLoading(true);
    fetch(process.env.REACT_APP_BACKEND_URL + "/runCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        code: code,
        data: data,
        project_id: project.id,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Run Success:", JSON.stringify(data, null, 2));
        setIsRunLoading(false);
        if (data.run_result.success === false) {
          let error_str =
            "ERROR: " +
            data.run_result.error_message +
            '\n at "' +
            data.run_result.error_line +
            '"\n';

          if (error_str) {
            setResults(error_str);
          }

          updateProject();

          return;
        } else {
          let log_str = (
            <div className="overflow-y-auto">
              <p>Run Successful!</p>
              <p>------</p>
              <p>Objective Value: {data.run_result.obj_val.toFixed(4)}</p>
              <p>Runtime: {data.run_result.solving_info.runtime.toFixed(4)}s</p>
              <p>
                Iteration Count: {data.run_result.solving_info.iteration_count}
              </p>
              <p>------</p>
              <p>Variables:</p>
              <ul>
                {data.run_result.solving_info.variables.map((variable) => {
                  return (
                    <li>
                      {variable.symbol}: {variable.value.toFixed(4)}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
          setResults(log_str);
        }
      })
      .catch((error) => {
        setIsRunLoading(false);
        console.error("Run Error:", error);
      });
  };

  const handleFixCodeClick = () => {
    setIsFixLoading(true);

    const callback = (data) => {
      console.log("Fix Success:", data);
      updateProject();
      setCode(data.code);
      setIsFixLoading(false);
      let explanation = data.reasoning;

      setModalTitle("Code Fix");
      let msg = (
        <div>
          <p>{explanation}</p>
          <p className="text-success mt-5">The code was updated!</p>
        </div>
      );

      setModalContent(msg);
      let my_modal = document.getElementById("my_modal_2");
      my_modal.showModal();
    };

    const errorCallback = (error) => {
      console.error("Fix Error:", error);
      setIsFixLoading(false);
    };

    sendPollingRequest(
      {
        "Content-Type": "application/json",
      },
      {
        // data: data,
        code: code,
        error_message: results,
        project_id: project.id,
      },
      "/fixCode",
      "POST",
      callback,
      errorCallback
    );
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  const handleCodeBlur = () => {
    fetch(process.env.REACT_APP_BACKEND_URL + "/updateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        code: code,
        project_id: project.id,
      }),
    })
      .then((response) => response.json())
      .then((res) => {
        console.log("Code Update Success:", res);
        updateProject();
      })
      .catch((error) => {
        console.error("Code Update Error:", error);
      });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row justify-between items-start w-ninety mt-10">
        <div className="flex flex-col w-2/3 pr-10">
          <div className="flex flex-col w-full">
            <h1 className="text-xl mb-2">Full Code</h1>
          </div>

          <div className="code-box w-full bg-base-300 border rounded-box p-4 mt-2">
            <AceEditor
              mode="python"
              theme={theme}
              readOnly={false}
              name="test"
              editorProps={{ $blockScrolling: true }}
              value={code}
              onChange={handleCodeChange}
              onBlur={handleCodeBlur}
              style={{ height: "100%", width: "100%" }}
              wrapEnabled={true}
            />
          </div>
        </div>
        <div className="flex flex-col w-1/3">
          <div className="flex flex-col w-full">
            <h1 className="text-xl mb-2">Results</h1>
            <div className="result-box border rounded-box p-4 mt-2 text-sm overflow-y-auto mockup-code w-full">
              <code className="overflow-y-auto">{results}</code>
            </div>
          </div>
          <div className="flex flex-col w-full">
            <h1 className="text-xl mb-2 mt-10">OptiMUS Log</h1>
            <div className="result-box w-full bg-base-300 border rounded-box p-4 mt-2 flex justify-center items-center">
              <h1>Will be added soon!</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row justify-between items-start w-ninety mt-10">
        <div className="flex flex-row justify-between w-2/3 pr-10">
          {/* Synthesize Code Button */}
          <button
            className="btn btn-secondary w-1/2"
            onClick={handleSynthesizeCodeClick}
            disabled={isSynthesizeLoading}
          >
            {isSynthesizeLoading ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : (
              "Synthesize Full Code from Clause Codes"
            )}
          </button>
          {/* Run Code Button */}
          <button
            className="btn btn-primary w-1/3"
            onClick={handleRunCodeClick}
            disabled={isRunLoading || !code}
          >
            {isRunLoading ? (
              <span className="loading loading-dots loading-lg mt-1"></span>
            ) : (
              "Run Code"
            )}
          </button>
        </div>
        <div className="flex flex-col w-1/3">
          {/* Fix Code Button */}
          <button
            className="btn btn-primary w-full"
            onClick={handleFixCodeClick}
            disabled={isFixLoading || !results}
          >
            {isFixLoading ? (
              <span className="loading loading-dots loading-lg mt-1"></span>
            ) : (
              "Fix Code"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestingPage;
