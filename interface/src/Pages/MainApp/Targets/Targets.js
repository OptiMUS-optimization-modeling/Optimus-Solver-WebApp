import React, { useState } from "react";
import "./Targets.css";
import ConstraintRow from "./ConstraintRow";
import sendPollingRequest from "../../../Utils/Communication";

const TargetExtractionPage = ({
  setCurrentStep,
  isAnyLoading,
  setIsAnyLoading,
  project,
  updateProject,
  updateObjective,
  updateBackground,
  updateConstraint,
}) => {
  const [tmpDescription, setTmpDescription] = useState(
    project.formattedDescription
  );
  const [tmpBackground, setTmpBackground] = useState(project.problemSummary);
  const [tmpObjectiveDescription, setTmpObjectiveDescription] = useState(
    project.objective[0].description
  );
  // const [tmpConstraints, setTmpConstraints] = useState(project.constraints);
  const [addButtonContent, setAddButtonContent] = useState(
    <i className="fa fa-plus"></i>
  );

  const [isLoading, setIsLoading] = useState(false);
  const [canMoveToNextStep, setCanMoveToNextStep] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  // can move to next step if none of the objective and constraint descriptions are empty
  React.useEffect(() => {
    console.log("project:", project);
    let canMove = true;
    project.objective.forEach((objective) => {
      if (objective.description === "") {
        canMove = false;
      }
    });
    project.constraints.forEach((constraint) => {
      if (constraint.description === "") {
        canMove = false;
      }
    });
    setCanMoveToNextStep(canMove);
  }, [project]);

  React.useEffect(() => {
    if (
      project.objective[0].description.length === 0 &&
      project.constraints.length === 0 &&
      project.background.length === 0
    ) {
      setCanEdit(false);
    } else {
      setCanEdit(true);
    }
  }, [project.objective, project.constraints, project.background]);

  const addConstraint = () => {
    // add a new parameter to the list of parameters
    setAddButtonContent(<i className="fa fa-spinner fa-spin"></i>);
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/addConstraint", {
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
          console.log("Added Constraint:", data);
          updateProject();
          setAddButtonContent(<i className="fa fa-plus"></i>);
        });
    } catch (error) {
      console.error("Error adding parameter:", error);
    }
  };

  const handleScanTargets = () => {
    setIsLoading(true);
    setIsAnyLoading(true);
    // setFormattedDescription(tmpDescription);
    // send the formatted description to the backend, and get the list of parameters as response

    let callback = (data) => {
      console.log("Success:", data);
      updateProject();

      setIsLoading(false);
      setIsAnyLoading(false);
      setTmpBackground(data.background);
      setTmpObjectiveDescription(data.objective[0].description);
    };

    let errorCallback = (error) => {
      console.error("Error:", error);
      // alert("Can't fetch the results :( Error: " + error);
      setIsLoading(false);
      setIsAnyLoading(false);
    };

    console.log(project);
    sendPollingRequest(
      {
        "Content-Type": "application/json",
      },
      {
        project_id: project.id,
        formattedDescription: tmpDescription,
      },
      "/new_api/extract_clauses",
      "POST",
      callback,
      errorCallback
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row w-ninety justify-between mt-10">
        <h1 className="text-xl ">Formatted Description</h1>
      </div>
      <div className="w-ninety">
        <textarea
          id="FormattedDescription"
          placeholder="Formatted description"
          value={tmpDescription}
          onChange={(e) => setTmpDescription(e.target.value)}
          className="textarea textarea-bordered w-full mt-2"
          rows="7"
        ></textarea>
      </div>

      <div className="flex flex-row w-ninety justify-end mt-2">
        <div className="flex flex-col w-1/3">
          <button
            className="btn btn-primary mt-2 w-full"
            onClick={handleScanTargets}
            disabled={isLoading || tmpDescription === "" || isAnyLoading}
          >
            {isLoading ? (
              <span className="loading loading-dots loading-lg mt-1"></span>
            ) : (
              "Extract Constraints and Objective"
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-row w-ninety justify-between mt-10">
        <div className="w-1/2 px-3">
          <h1 className="text-xl ">Objective</h1>
          <textarea
            placeholder="Objective"
            value={tmpObjectiveDescription}
            onChange={(e) => {
              setTmpObjectiveDescription(e.target.value);
            }}
            onBlur={() => {
              updateObjective("description", tmpObjectiveDescription);
            }}
            className="objective-text textarea textarea-bordered mt-2 w-full"
            rows="3"
            disabled={!canEdit || isAnyLoading}
          ></textarea>
        </div>
        <div className="w-1/2 px-3">
          <h1 className="text-xl ">Background</h1>
          <textarea
            placeholder="Background"
            value={tmpBackground}
            onChange={(e) => setTmpBackground(e.target.value)}
            onBlur={() => {
              // updateTargets();
              updateBackground(tmpBackground);
            }}
            className="background-text textarea textarea-bordered mt-2 w-full"
            rows="3"
            disabled={!canEdit || isAnyLoading}
          ></textarea>
        </div>
      </div>

      <div className="flex flex-row w-ninety justify-between mt-10">
        <h1 className="text-xl ">Constraints</h1>
      </div>

      <div
        className="w-ninety mt-2"
        data-tip="You can add/remove/modify the constraints if needed."
      >
        <div className="table-container border border-base-300">
          <table
            className="table table-sm table-pin-rows"
            id="constraint-table"
          >
            <thead>
              <tr className="bg-base-200">
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {project.constraints.map((constraint) => (
                <ConstraintRow
                  key={constraint.id}
                  constraintKey={constraint.id}
                  constraint={constraint}
                  updateConstraint={updateConstraint}
                  project_id={project.id}
                  updateProject={updateProject}
                />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="text-left">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={addConstraint}
                    disabled={!canEdit || isAnyLoading}
                  >
                    {addButtonContent}
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="flex flex-row w-ninety mt-10 justify-end">
        <div className="flex flex-col w-1/6">
          <div
            className="tooltip tooltip-top tooltip-accent w-full"
            data-tip="To move to the next step, make sure the objective, the background, and all the constraints are not empty."
          >
            <button
              className="btn btn-secondary w-full"
              onClick={() => {
                setCurrentStep(3);
                // scroll to top
                window.scrollTo(0, 0);
              }}
              disabled={!canMoveToNextStep}
            >
              Next
              <i className="fas fa-arrow-right fa-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetExtractionPage;
