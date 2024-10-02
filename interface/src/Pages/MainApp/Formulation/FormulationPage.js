import React from "react";
import TargetFormulationCard from "./TargetFormulationCard.js";
import VariableRow from "./VariableRow.js";
import "./Formulation.css";
import sendPollingRequest from "../../../Utils/Communication";

const FormulationPage = ({
  isAnyLoading,
  setIsAnyLoading,
  setCurrentStep,
  // parameters,
  // variables,
  // setVariables,
  // setCurrentStep,
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
  updateObjective,
  updateConstraint,
  updateVariable,
  shapeValid,
}) => {
  const [canMoveToNextStep, setCanMoveToNextStep] = React.useState(false);
  const [addButtonContent, setAddButtonContent] = React.useState(
    <div className="fa fa-plus"></div>
  );

  React.useEffect(() => {
    let canMove = true;
    project.objective.forEach((objective) => {
      if (objective.formulation === "" || !objective.formulation) {
        canMove = false;
      }
    });
    project.constraints.forEach((constraint) => {
      if (constraint.formulation === "" || !constraint.formulation) {
        canMove = false;
      }
    });
    if (!project.variables || Object.keys(project.variables).length === 0) {
      canMove = false;
    } else {
      Object.entries(project.variables).forEach(([key, variable]) => {
        if (
          variable.symbol === "" ||
          variable.shape === "" ||
          variable.definition === "" ||
          !variable.symbol ||
          !variable.shape ||
          !variable.definition
        ) {
          canMove = false;
        }
      });
    }
    setCanMoveToNextStep(canMove);
  }, [project]);

  // const updateConstraint = (key, updatedConstraint) => {
  // return new Promise((resolve) => {
  //     setConstraints((prevConstraints) => {
  //         const updatedConstraints = [...prevConstraints];
  //         const index = updatedConstraints.findIndex(
  //             (constraint) => constraint.id === key
  //         );
  //         updatedConstraints[index] = updatedConstraint;
  //         resolve(); // Resolve the promise after setting the state
  //         return updatedConstraints;
  //     });
  // });
  // };

  // const updateObjective = (key, updatedObjective) => {
  // return new Promise((resolve) => {
  //     setObjective((prevObjectives) => {
  //         const updatedObjectives = [...prevObjectives];
  //         const index = updatedObjectives.findIndex(
  //             (objective) => objective.id === key
  //         );
  //         updatedObjectives[index] = updatedObjective;
  //         resolve(); // Resolve the promise after setting the state
  //         return updatedObjectives;
  //     });
  // });
  // };

  // const updateVariable = (key, updatedVariable) => {
  // return new Promise((resolve) => {
  //     setVariables((prevVariables) => {
  //         const newVariables = {
  //             ...prevVariables,
  //             [key]: updatedVariable,
  //         };
  //         resolve(); // Resolve the promise after setting the state
  //         return newVariables;
  //     });
  // });
  // };

  const addVariable = () => {
    setAddButtonContent(
      <div className="loading loading-sm loading-white"></div>
    );
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/addVariable", {
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
          updateProject();
          setAddButtonContent(<div className="fa fa-plus"></div>);
        });
    } catch (error) {
      console.error("Error:", error);
      setModalTitle("Error");
      setModalContent("Can't connect to the server :(");
      let modal = document.getElementById("my_modal_2");
      modal.showModal();
    }
  };

  const handleFormulateClick = (target, targetType, currentVariables) => {
    return new Promise((resolve, reject) => {
      // send a query to the backend to formulate the target
      setIsAnyLoading(true);
      let callback = (data) => {
        console.log("DONE FORMULATING");
        setTimeout(() => {
          updateProject();
          setIsAnyLoading(false);
          updateProject();
          resolve(); // Resolve the promise when the fetch is successfulresolve(); // Resolve the promise when the fetch is successful
        }, 500);
      };
      let errorCallback = (error) => {
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

      if (Object.keys(currentVariables).length === 0) {
        currentVariables = project.variables;
      }
      sendPollingRequest(
        {
          "Content-Type": "application/json",
        },
        {
          clause: target,
          clauseType: targetType,
          project_id: project.id,
          parameters: project.parameters,
          variables: currentVariables,
          background: project.background,
        },
        "/formulate_clause",
        "POST",
        callback,
        errorCallback
      );
    });
  };

  const formulateAll = async () => {
    setIsAnyLoading(true);
    let currentVariables = project.variables;
    try {
      for (const obj of project.objective) {
        await handleFormulateClick(obj, "objective", currentVariables);
        let new_project = await updateProject();
        currentVariables = new_project.variables;
      }
      for (const constraint of project.constraints) {
        await handleFormulateClick(constraint, "constraint", currentVariables);
        let new_project = await updateProject();
        currentVariables = new_project.variables;
      }
      // Ensure project is updated after all formulations
      await updateProject(); // Ensure this is awaited to get the latest project
    } catch (error) {
      setModalTitle("Error");
      setModalContent("Can't connect to the server :(");
      console.error("Error:", error);
    } finally {
      setIsAnyLoading(false);
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
              onClick={formulateAll}
              disabled={isAnyLoading}
            >
              <div>
                {isAnyLoading ? (
                  <span className="loading loading-dots loading-lg"></span>
                ) : (
                  <div>
                    <div className="fa fa-bolt fa-xl mr-2"></div>
                    Formulate All
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <div class="flex flex-col w-full">
              <div class="divider divider-start">
                <h1 className="text-xl mb-2">Objective</h1>
              </div>
            </div>
            {project.objective.map((objective) => (
              <TargetFormulationCard
                key={objective.id} // Use objective.id as the key
                targetKey={objective.id}
                target={objective}
                targetType="objective"
                updateTarget={(key, field, value) => {
                  updateObjective(field, value);
                }}
                handleFormulateClick={handleFormulateClick}
                isAnyLoading={isAnyLoading}
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
              <div className="flex flex-row w-full mb-5">
                <TargetFormulationCard
                  key={constraint.id}
                  targetKey={constraint.id}
                  target={constraint}
                  targetType="constraint"
                  updateTarget={(key, field, value) => {
                    updateConstraint(key, field, value);
                  }}
                  isAnyLoading={isAnyLoading}
                  handleFormulateClick={handleFormulateClick}
                />
              </div>
            ))}
          </div>

          <div class="mt-10">
            <div class="flex flex-col w-full">
              <div class="divider divider-start">
                <h1 className="text-xl mb-2">Variables</h1>
              </div>
            </div>
            <div
              className="tooltip tooltip-bottom tooltip-accent w-full mt-2"
              data-tip="OptiMUS automatically defines the variables, but you can see and modify them here if needed."
            >
              <div className="table-container border border-base-300">
                <table className="table table-sm table-pin-rows">
                  <thead>
                    <tr className="bg-base-200">
                      <th>Symbol</th>
                      <th>Shape</th>
                      <th>Definition</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* go through the parameters json and create an entry for each item */}
                    {Object.entries(project.variables).map(
                      ([key, variable]) => (
                        <VariableRow
                          key={key}
                          variableKey={key}
                          data={variable}
                          updateVariable={updateVariable}
                          project_id={project.id}
                          updateProject={updateProject}
                          shapeValid={shapeValid}
                        />
                      )
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      {/* centered button */}
                      <td colSpan="10" className="text-left">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            addVariable();
                          }}
                          disabled={isAnyLoading}
                        >
                          {addButtonContent}
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <div className="flex flex-row w-full mt-10 justify-end">
            <div className="flex flex-col w-1/3">
              <div
                className="tooltip tooltip-top tooltip-accent w-full"
                data-tip="Make sure the constraint and all of the constraints are formulated correctly before moving to the coding step."
              >
                <button
                  className="btn btn-secondary w-ninety"
                  onClick={() => {
                    setCurrentStep(4);
                    // scroll to top
                    window.scrollTo(0, 0);
                  }}
                  disabled={!canMoveToNextStep}
                >
                  Next &rarr;
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

export default FormulationPage;
