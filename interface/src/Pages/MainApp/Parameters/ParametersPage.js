import React, { useState, useEffect } from "react";
import ParameterRow from "./ParameterRow";
import "./Parameters.css";

const ParametersPage = ({
  isAnyLoading,
  setIsAnyLoading,
  setCurrentStep,
  // formattedDescription,
  // setFormattedDescription,
  // parameters,
  // setParameters,
  // setConstraints,
  data,
  setData,
  // modalTitle,
  setModalTitle,
  // modalContent,
  setModalContent,
  project,
  updateProject,
}) => {
  const [tmpDescription, setTmpDescription] = useState(
    project.formattedDescription
  );
  // const [isLoading, setIsLoading] = useState(false);
  const [allPass, setAllPass] = useState(false);
  // const [modalTitle, setModalTitle] = useState("Error");
  // const [modalValue, setModalContent] = useState("");

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
        all_pass = false;
      }
      if (!shapeValid(param.shape)) {
        all_pass = false;
      }
    });
    setAllPass(all_pass);
  }, [project.parameters]);

  const shapeValid = (shape) => {
    try {
      // replace single quotes with double quotes
      shape = shape.replace(/'/g, '"');
      const shapeList = JSON.parse(shape);
      console.log("Shape List:", shapeList);
      if (Array.isArray(shapeList)) {
        shapeList.forEach((element) => {
          if (typeof element !== "string") {
            throw new Error("Not a list of strings");
          }
        });
        return true;
      } else {
        throw new Error("Not a list");
      }
    } catch (error) {
      return false;
    }
  };

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
          // disabled={isLoading}
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
                  // updateParameter={updateParameter}
                  // callUploadGuide={callUploadGuide}
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

export default ParametersPage;
