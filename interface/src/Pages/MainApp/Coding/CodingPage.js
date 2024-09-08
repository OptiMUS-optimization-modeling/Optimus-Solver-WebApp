import React from "react";
import TargetCodingCard from "./TargetCodingCard.js";
import "./Coding.css";
import sendPollingRequest from "../../../Utils/Communication";

const CodingPage = ({
    isAnyLoading,
    setIsAnyLoading,
    isDark,
    setCurrentStep,
    // parameters,
    // variables,
    // setVariables,
    // constraints,
    // setConstraints,
    // objective,
    // setObjective,
    // background,
    // modalTitle,
    setModalTitle,
    // modalContent,
    setModalContent,
    project,
    updateProject,
    updateConstraint,
    updateObjective,
    updateVariable,
}) => {
    const [canMoveToNextStep, setCanMoveToNextStep] = React.useState(false);
    // const [modalTitle, setModalTitle] = React.useState("");
    // const [modalValue, setModalContent] = React.useState("");
    const [isCodeAllLoading, setIsCodeAllLoading] = React.useState(false);

    // can move to next step if none of the objective and constraint codes are empty
    React.useEffect(() => {
        let canMove = true;
        project.objective.forEach((objective) => {
            if (objective.code === "") {
                canMove = false;
            }
        });
        project.constraints.forEach((constraint) => {
            if (constraint.code === "") {
                canMove = false;
            }
        });
        setCanMoveToNextStep(canMove);
    }, [project.objective, project.constraints]);

    // const updateConstraint = (key, updatedConstraint) => {
    //     return new Promise((resolve) => {
    //         setConstraints((prevConstraints) => {
    //             const updatedConstraints = [...prevConstraints];
    //             const index = updatedConstraints.findIndex(
    //                 (constraint) => constraint.id === key
    //             );
    //             updatedConstraints[index] = updatedConstraint;
    //             resolve(); // Resolve the promise after setting the state
    //             return updatedConstraints;
    //         });
    //     });
    // };

    // const updateObjective = (key, updatedObjective) => {
    //     return new Promise((resolve) => {
    //         setObjective((prevObjectives) => {
    //             const updatedObjectives = [...prevObjectives];
    //             const index = updatedObjectives.findIndex(
    //                 (objective) => objective.id === key
    //             );
    //             updatedObjectives[index] = updatedObjective;
    //             resolve(); // Resolve the promise after setting the state
    //             return updatedObjectives;
    //         });
    //     });
    // };

    // const updateTargets = async (target) => {
    //     // check target.id to see if it's an objective, a constraint, or a variable
    //     const key = target.id;
    //     if (objective.findIndex((objective) => objective.id === key) !== -1) {
    //         // it's an objective
    //         await updateObjective(key, {
    //             description: target.description,
    //             id: target.id,
    //             code: target.code,
    //             formulation: target.formulation,
    //             related_parameters: target.related_parameters,
    //             related_variables: target.related_variables,
    //         });
    //         return;
    //     } else if (
    //         constraints.findIndex((constraint) => constraint.id === key) !== -1
    //     ) {
    //         // it's a constraint
    //         await updateConstraint(key, {
    //             description: target.description,
    //             id: target.id,
    //             code: target.code,
    //             formulation: target.formulation,
    //             related_parameters: target.related_parameters,
    //             related_variables: target.related_variables,
    //         });
    //         return;
    //     }
    // };

    const handleCodeClick = (target, targetType) => {
        return new Promise((resolve, reject) => {
            // send a query to the backend to formulate the target
            setIsAnyLoading(true);
            const callback = (data) => {
                console.log("Success:", JSON.stringify(data));
                // updateTargets(data.target);
                // setVariables(data.variables);
                updateProject();
                setIsAnyLoading(false);
                resolve(data.variables); // Resolve the promise when the fetch is successful
            };
            const errorCallback = (error) => {
                setIsAnyLoading(false);
                console.error("Error:", error);
                setModalTitle("Error");
                setModalContent(
                    "Seems like the LLM is not able to formulate the given description  Please check the description and try again."
                );
                let modal = document.getElementById("my_modal_2");
                modal.showModal();
                reject(error); // Reject the promise on error
            };
            sendPollingRequest(
                {
                    "Content-Type": "application/json",
                },
                {
                    target: target,
                    target_type: targetType,
                    project_id: project.id,
                },
                "/codeTarget",
                "POST",
                callback,
                errorCallback
            );
        });
    };

    const codeAll = async () => {
        // do handleFormulateClick for all the targets in sequence (asynchronously)
        setIsCodeAllLoading(true);
        // let currentVariables = variables;
        // try {
        //     for (const obj of project.objective) {
        //         await handleCodeClick(obj, "objective");
        //     }
        //     for (const constraint of project.constraints) {
        //         await handleCodeClick(constraint, "constraint");
        //     }

        try {
            const objectivePromises = project.objective.map((obj) =>
                handleCodeClick(obj, "objective")
            );
            const constraintPromises = project.constraints.map((constraint) =>
                handleCodeClick(constraint, "constraint")
            );

            // Combine all promises into a single array
            const allPromises = [...objectivePromises, ...constraintPromises];

            // Use Promise.all to wait for all of them to complete
            await Promise.all(allPromises);
        } catch (error) {
            setModalTitle("Error");
            setModalContent("Can't connect to the server :(");
            console.error("Error:", error);
        } finally {
            setIsCodeAllLoading(false);
        }
    };

    return (
        // put items at top
        <div className="flex flex-col items-center">
            <div className="flex flex-row justify-between items-start w-ninety mt-10">
                <div className="flex flex-col w-full ">
                    <div class="flex flex-col w-full justify-center items-end">
                        <div
                            class="btn btn-primary w-1/5"
                            onClick={codeAll}
                            disabled={isAnyLoading || isCodeAllLoading}
                        >
                            <div>
                                {isAnyLoading ? (
                                    <span className="loading loading-dots loading-lg"></span>
                                ) : (
                                    <div>
                                        <div className="fa fa-bolt fa-xl mr-2"></div>
                                        Code All
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div>{isAnyLoading.toString()}</div>

                    <div>
                        <div class="flex flex-col w-full">
                            <div class="divider divider-start">
                                <h1 className="text-xl mb-2">Objective</h1>
                            </div>
                        </div>
                        {project.objective.map((objective) => (
                            <TargetCodingCard
                                isDark={isDark}
                                targetKey={objective.id}
                                target={objective}
                                targetType="objective"
                                updateTarget={(key, field, value) => {
                                    updateObjective(field, value);
                                }}
                                isAnyLoading={isAnyLoading}
                                isCodeAllLoading={isCodeAllLoading}
                                handleCodeClick={handleCodeClick}
                            />
                        ))}
                    </div>
                    <div class="mt-10">
                        <div class="flex flex-col w-full">
                            <div class="divider divider-start">
                                <h1 className="text-xl mb-2">Constraints</h1>
                            </div>
                        </div>

                        {project.constraints.map((constraint) => (
                            <TargetCodingCard
                                isDark={isDark}
                                // parameters={parameters}
                                // variables={variables}
                                key={constraint.id}
                                targetKey={constraint.id}
                                target={constraint}
                                targetType="constraint"
                                updateTarget={(key, field, value) => {
                                    updateConstraint(key, field, value);
                                }}
                                isAnyLoading={isAnyLoading}
                                isCodeAllLoading={isCodeAllLoading}
                                handleCodeClick={handleCodeClick}
                            />
                        ))}
                    </div>

                    <div className="flex flex-row w-full mt-10 justify-end">
                        <div className="flex flex-col w-1/3">
                            <div
                                className="tooltip tooltip-top tooltip-accent w-full"
                                data-tip="Make sure the objective and all the constraints are coded before moving to the next step."
                            >
                                <button
                                    className="btn btn-secondary w-ninety"
                                    onClick={() => {
                                        setCurrentStep(5);

                                        window.scrollTo(0, 0);
                                    }}
                                    disabled={!canMoveToNextStep}
                                >
                                    To Testing &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* <dialog id="my_modal_2" class="modal">
                <div class="modal-box">
                    <h3 class="font-bold text-lg text-secondary">
                        {modalTitle}
                    </h3>
                    <div className="divider my-0"></div>
                    <p class="py-4">{modalValue}</p>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog> */}
        </div>
    );
};

export default CodingPage;
