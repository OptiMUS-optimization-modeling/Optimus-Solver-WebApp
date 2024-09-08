import React from "react";
import AceEditor from "react-ace";

import sendPollingRequest from "../../../Utils/Communication";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-tomorrow_night";

import "./Testing.css";

const TestingPage = ({
    isDark,
    // parameters,
    // variables,
    // setVariables,
    currentStep,
    setCurrentStep,
    // constraints,
    // setConstraints,
    // objective,
    // setObjective,
    // background,
    data,
    results,
    setResults,
    // modalTitle,
    setModalTitle,
    // modalContent,
    setModalContent,
    project,
    updateProject,
}) => {
    const theme = isDark ? "tomorrow_night" : "tomorrow";
    const [isRunLoading, setIsRunLoading] = React.useState(false);
    const [isFixLoading, setIsFixLoading] = React.useState(false);

    let [code, setCode] = React.useState("");

    // fetch the code when currentStep changes to 5

    React.useEffect(() => {
        if (currentStep === 6) {
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
                    console.log("Success:", res);
                    setCode(res.code);
                })
                .catch((error) => {
                    console.error("Error:", error);
                    // alert("Can't fetch the results :( Error: " + error);
                });
        }
    }, [currentStep, data, project.id]); // Added 'data' and 'project.id' to the dependency array

    const handleRunCodeClick = () => {
        if (Object.keys(data).length === 0) {
            setModalTitle("Error");
            setModalContent(
                <div>
                    <p>
                        Please configure the data before running the code. You
                        can do so in the
                        <span
                            className="text-primary cursor-pointer"
                            onClick={() => {
                                setCurrentStep(5);
                                // close modal
                                let my_modal =
                                    document.getElementById("my_modal_2");
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
                data: data,
                project_id: project.id,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("Success:", JSON.stringify(data, null, 2));
                setIsRunLoading(false);
                if (data.run_result.success === false) {
                    // make the error message bold

                    let error_str =
                        "ERROR: " +
                        data.run_result.error_message +
                        '\n at "' +
                        data.run_result.error_line +
                        '"\n';

                    if (error_str) {
                        setResults(error_str);
                    } else {
                    }

                    // Removed unused variable 'state'
                    // let state = data.state;

                    // update the variables, constraints, and objective based on the state
                    updateProject();
                    // setVariables(state.variables);
                    // setConstraints(state.constraints);
                    // setObjective(state.objective);

                    return;
                } else {
                    let log_str = (
                        <div className="overflow-y-auto">
                            <p>Run Successful!</p>
                            <p>------</p>
                            <p>
                                Objective Value:{" "}
                                {data.run_result.obj_val.toFixed(4)}
                            </p>
                            <p>
                                Runtime:{" "}
                                {data.run_result.solving_info.runtime.toFixed(
                                    4
                                )}
                                s
                            </p>
                            <p>
                                Iteration Count:{" "}
                                {data.run_result.solving_info.iteration_count}
                            </p>
                            <p>------</p>
                            <p>Variables:</p>
                            <ul>
                                {data.run_result.solving_info.variables.map(
                                    (variable) => {
                                        return (
                                            <li>
                                                {variable.symbol}:{" "}
                                                {/* value with at most 4 decimal places */}
                                                {variable.value.toFixed(4)}
                                            </li>
                                        );
                                    }
                                )}
                            </ul>
                        </div>
                    );
                    setResults(log_str);
                }
            })
            .catch((error) => {
                setIsRunLoading(false);
                // alert("Can't fetch the results :( Error: " + error);
                console.error("Error:", error);
            });
    };

    const handleFixCodeClick = () => {
        setIsFixLoading(true);

        const callback = (data) => {
            // setParameters(data.parameters);

            console.log("Success:", data);
            // setVariables(data.variables);
            // setConstraints(data.constraints);
            // setObjective(data.objective);
            updateProject();
            setIsFixLoading(false);
            let explanation = data.bug_explanation;

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
            console.error("Error:", error);
            setIsFixLoading(false);
        };

        sendPollingRequest(
            {
                "Content-Type": "application/json",
            },
            {
                // parameters: parameters,
                // variables: variables,
                // constraints: constraints,
                // objective: objective,
                data: data,
            },
            "/fixCode",
            "POST",
            callback,
            errorCallback
        );
    };

    return (
        // put items at top
        <div className="flex flex-col items-center">
            <div className="flex flex-row justify-between items-start w-ninety mt-10">
                <div class="flex flex-col w-2/3 pr-10">
                    {/* print all ids of constriants */}

                    <div class="flex flex-col w-full">
                        <h1 className="text-xl mb-2">Full Code (Read Only)</h1>
                    </div>

                    <div className="code-box w-full bg-base-300 border rounded-box p-4 mt-2">
                        <AceEditor
                            mode="python"
                            theme={theme}
                            readOnly={true}
                            name="test"
                            editorProps={{ $blockScrolling: true }}
                            value={code}
                            style={{ height: "100%", width: "100%" }} // Set the fixed height here
                            wrapEnabled={true}
                        />
                    </div>
                </div>
                <div class="flex flex-col w-1/3">
                    <div class="flex flex-col w-full">
                        <h1 className="text-xl mb-2">Results</h1>
                        <div className="result-box  border rounded-box p-4 mt-2 text-sm  overflow-y-auto mockup-code w-full ">
                            <code className="overflow-y-auto">{results}</code>
                        </div>
                    </div>
                    <div class="flex flex-col w-full">
                        <h1 className="text-xl mb-2 mt-10">OptiMUS Log</h1>
                        <div className="result-box w-full bg-base-300 border rounded-box p-4 mt-2 flex justify-center items-center">
                            <h1>Will be added soon!</h1>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-row justify-between items-start w-ninety mt-10">
                <div class="flex flex-col w-2/3 pr-10">
                    {/* butotn for running the code */}
                    <button
                        className="btn btn-primary w-full"
                        onClick={handleRunCodeClick}
                        disabled={isRunLoading}
                    >
                        Run Code
                    </button>
                </div>
                <div class="flex flex-col w-1/3">
                    {/* butotn for running the code */}
                    <button
                        className="btn btn-primary w-full"
                        onClick={handleFixCodeClick}
                        disabled={isFixLoading}
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
