import React, { useState, useEffect } from "react";
import ParameterRow from "./ParameterRow";
import "./Parameters.css";
import { marked } from "marked";
const ParametersPage = ({
  isAnyLoading,
  setIsAnyLoading,
  setCurrentStep,
  data,
  setData,
  project,
  updateProject,
  shapeValid,
  setModalTitle,
  setModalContent,
  lastShownProblemType,
  setLastShownProblemType,
}) => {
  const [tmpDescription, setTmpDescription] = useState(
    project.formattedDescription
  );
  const [allPass, setAllPass] = useState(false);
  const [addButtonContent, setAddButtonContent] = useState(
    <i className="fa fa-plus"></i>
  );

  // set allPass to true if all shapes are defined and valid, and all descriptions are non-empty
  useEffect(() => {
    let all_pass = true;
    Object.entries(project.parameters).forEach(([key, param]) => {
      if (
        param.symbol === "" ||
        param.shape === "" ||
        param.definition === ""
      ) {
        console.log("Parameter is empty", key, param);
        all_pass = false;
      }
      if (!shapeValid(param.shape)) {
        console.log("Shape is not valid", key, param);
        all_pass = false;
      }
    });
    setAllPass(all_pass);
  }, [project.parameters, shapeValid]);

  // Modified useEffect to show modal only once per unique structuredProblemType
  useEffect(() => {
    const currentProblemType = project.structuredProblemType;

    // Check if the current problem type is different from the last shown
    if (
      currentProblemType &&
      (!lastShownProblemType ||
        currentProblemType.explanation !== lastShownProblemType.explanation)
    ) {
      setModalContent(
        <div className="flex flex-col items-start px-10 ">
          <h1>
            It seems like your problem is an instance of{" "}
            <strong className="text-primary">{currentProblemType.type}.</strong>{" "}
            Consider using one of the relevant specific-purpose solvers instead
            of OptiMUS.
          </h1>
          <br />

          <div
            className="markdown-content"
            style={{
              color: "black",
              py: 0,
              px: 2,
              my: 1,
              borderRadius: "12px",
              maxWidth: "100%",
              "& a": {
                color: "lightblue", // Set link color to light blue
              },
            }}
            dangerouslySetInnerHTML={{
              __html: marked(project.structuredProblemType.explanation),
            }}
          />
        </div>
      );
      setModalTitle("Common Problem Type Detected");
      document.getElementById("my_modal_2").showModal();

      // Update the last shown problem type
      setLastShownProblemType(currentProblemType);
    }
  }, [
    project.structuredProblemType,
    setModalContent,
    setModalTitle,
    lastShownProblemType, // Add this dependency
  ]);

  const deleteParameter = (key) => {
    // send a request to delete the parameter
    // then fetch the updated list of parameters
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/deleteParameter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          project_id: project.id,
          parameter_id: key,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Deleted Parameter:", data);
          updateProject();
        });
    } catch (error) {
      console.error("Error deleting parameter:", error);
    }
  };

  const handleNextClick = () => {
    setCurrentStep(2);
    // scroll to top
    window.scrollTo(0, 0);
  };

  const addParameter = () => {
    // add a new parameter to the list of parameters
    setAddButtonContent(<i className="fa fa-spinner fa-spin"></i>);
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/addParameter", {
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
          console.log("Added Parameter:", data);
          updateProject();
          setAddButtonContent(<i className="fa fa-plus"></i>);
        });
    } catch (error) {
      console.error("Error adding parameter:", error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row w-ninety justify-between mt-10">
        <h1 className="text-xl ">Formatted Description</h1>
      </div>
      <div
        className="tooltip-bottom tooltip-accent w-ninety"
        data-tip="This box contains the formatted description. Use \param{...} to define parameters. Once you're done, click on the Scan for Parameters button to extract the parameters."
      >
        <textarea
          id="FormattedDescription"
          placeholder="Formatted description"
          value={tmpDescription}
          onChange={(e) => setTmpDescription(e.target.value)}
          disabled={true}
          className="textarea textarea-bordered w-full mt-2"
          rows="7"
        ></textarea>
      </div>

      <div className="flex flex-row w-ninety justify-left items-center mt-5">
        <h1 className="text-xl mx-2">Parameters</h1>
        <div
          className="tooltip"
          data-tip="Edit the parameters if needed. Click next after adding all the parameters."
        >
          <div className="fa fa-info-circle fa-lg"></div>
        </div>
        {/* info icon */}
      </div>
      <div
        className="tooltip-bottom tooltip-accent w-ninety mt-2"
        data-tip="Please use single quotes (') for parameter shapes (e.g. ['M', 'N'])."
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

              {Object.entries(project.parameters).map(([key, param]) => (
                <ParameterRow
                  key={key}
                  paramKey={key}
                  data={param}
                  project_id={project.id}
                  shapeValid={shapeValid}
                  deleteParameter={deleteParameter}
                  updateProject={updateProject}
                />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="10" className="text-left">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => {
                      addParameter();
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
      {/* a row with items */}
      <div className="flex flex-row w-ninety mt-20 justify-end">
        <div className="flex flex-col w-1/6">
          <button
            className="btn btn-secondary w-full"
            onClick={() => handleNextClick()}
            disabled={!allPass}
          >
            Next
            <i className="fas fa-arrow-right fa-xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParametersPage;
