import React from "react";
import AnalysisContainer from "./Analysis/AnalysisPage";
import ParametersPage from "./Parameters/ParametersPage";
import TargetExtractionPage from "./Targets/Targets";
import FormulationPage from "./Formulation/FormulationPage";
import CodingPage from "./Coding/CodingPage";
import TestingPage from "./Testing/TestingPage";
import DataProcessingPage from "./DataProcessing/DataProcessing";

import "./MainContainer.css";

const MainContainer = ({
  isDark,
  currentStep,
  setCurrentStep,
  problemDescription,
  setProblemDescription,
  formattedDescription,
  setFormattedDescription,
  parameters,
  setParameters,
  constraints,
  setConstraints,
  objective,
  setObjective,
  background,
  setBackground,
  variables,
  setVariables,
  data,
  setData,
  results,
  setResults,
  resetState,
  dataButtonContent,
  setDataButtonContent,
  project,
  updateProject,
}) => {
  const [isAnyLoading, setIsAnyLoading] = React.useState(false);
  const [modalTitle, setModalTitle] = React.useState("");
  const [modalContent, setModalContent] = React.useState("");

  const updateVariable = (key, field, value) => {
    // send a request to update the variable
    // then fetch the updated list of variables
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/updateVariable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          project_id: project.id,
          variable_id: key,
          field: field,
          value: value,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Updated Variable:", data);
          updateProject();
        });
    } catch (error) {
      console.error("Error updating variable:", error);
    }
  };

  const updateObjective = (field, value) => {
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/updateObjective", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          project_id: project.id,
          field: field,
          value: value,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            alert(data.error);
            return;
          }
          console.log("Success:", data);
          updateProject();
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Can't fetch the results :( Error: " + error);
        });
    } catch (error) {
      console.error("Error updating background:", error);
      alert("Error updating background!");
    }
  };

  const updateBackground = (description) => {
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/updateBackground", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include this line to send cookies with the request
        body: JSON.stringify({
          project_id: project.id,
          background: description,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            alert(data.error);
            return;
          }
          console.log("Success:", data);
          updateProject();
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Can't fetch the results :( Error: " + error);
        });
    } catch (error) {
      console.error("Error updating background:", error);
      alert("Error updating background!");
    }
  };

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

  const updateConstraint = (key, field, value) => {
    // send a request to update the constraint
    // then fetch the updated list of constraints
    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/updateConstraint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          project_id: project.id,
          constraint_id: key,
          field: field,
          value: value,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Updated Constraint:", data);
          updateProject();
        });
    } catch (error) {
      console.error("Error updating constraint:", error);
    }
  };

  return (
    <div className="flex-box mx-auto w-full mb-20 mt-5 px-10">
      <div>
        {currentStep === 0 && (
          <div className={currentStep === 0 ? "fade-in" : ""}>
            <AnalysisContainer
              setCurrentStep={setCurrentStep}
              resetState={resetState}
              isAnyLoading={isAnyLoading}
              setIsAnyLoading={setIsAnyLoading}
              setModalTitle={setModalTitle}
              setModalContent={setModalContent}
              project={project}
              updateProject={updateProject}
            />
          </div>
        )}
        {currentStep === 1 && (
          <div className={currentStep === 1 ? "fade-in" : ""}>
            <ParametersPage
              isAnyLoading={isAnyLoading}
              setIsAnyLoading={setIsAnyLoading}
              setCurrentStep={setCurrentStep}
              data={data}
              setData={setData}
              setModalTitle={setModalTitle}
              setModalContent={setModalContent}
              project={project}
              updateProject={updateProject}
              shapeValid={shapeValid}
            />
          </div>
        )}
        {currentStep === 2 && (
          <div className={currentStep === 2 ? "fade-in" : ""}>
            <TargetExtractionPage
              setCurrentStep={setCurrentStep}
              isAnyLoading={isAnyLoading}
              setIsAnyLoading={setIsAnyLoading}
              project={project}
              updateProject={updateProject}
              updateConstraint={updateConstraint}
              updateObjective={updateObjective}
              updateBackground={updateBackground}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className={currentStep === 3 ? "fade-in" : ""}>
            <FormulationPage
              isAnyLoading={isAnyLoading}
              setIsAnyLoading={setIsAnyLoading}
              setCurrentStep={setCurrentStep}
              // constraints={constraints}
              // setConstraints={setConstraints}
              // objective={objective}
              // setObjective={setObjective}
              // background={background}
              parameters={parameters}
              variables={variables}
              // setVariables={setVariables}
              // modalTitle={modalTitle}
              setModalTitle={setModalTitle}
              // modalContent={modalContent}
              setModalContent={setModalContent}
              project={project}
              updateProject={updateProject}
              updateObjective={updateObjective}
              updateConstraint={updateConstraint}
              updateVariable={updateVariable}
              shapeValid={shapeValid}
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className={currentStep === 4 ? "fade-in" : ""}>
            <CodingPage
              isAnyLoading={isAnyLoading}
              setIsAnyLoading={setIsAnyLoading}
              isDark={isDark}
              setCurrentStep={setCurrentStep}
              // constraints={constraints}
              // setConstraints={setConstraints}
              // objective={objective}
              // setObjective={setObjective}
              // background={background}
              // parameters={parameters}
              // variables={variables}
              // setVariables={setVariables}
              // modalTitle={modalTitle}
              setModalTitle={setModalTitle}
              // modalContent={modalContent}
              setModalContent={setModalContent}
              project={project}
              updateProject={updateProject}
              updateObjective={updateObjective}
              updateConstraint={updateConstraint}
              updateVariable={updateVariable}
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className={currentStep === 1 ? "fade-in" : ""}>
            <DataProcessingPage
              setCurrentStep={setCurrentStep}
              // formattedDescription={formattedDescription}
              // setFormattedDescription={setFormattedDescription}
              // parameters={parameters}
              // setParameters={setParameters}
              data={data}
              setData={setData}
              // modalTitle={modalTitle}
              setModalTitle={setModalTitle}
              // modalContent={modalContent}
              setModalContent={setModalContent}
              dataButtonContent={dataButtonContent}
              setDataButtonContent={setDataButtonContent}
              project={project}
              updateProject={updateProject}
            />
          </div>
        )}

        {currentStep === 6 && (
          <div className={currentStep === 4 ? "fade-in" : ""}>
            <TestingPage
              isDark={isDark}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              // constraints={constraints}
              // setConstraints={setConstraints}
              // objective={objective}
              // setObjective={setObjective}
              // background={background}
              // parameters={parameters}
              // variables={variables}
              // setVariables={setVariables}
              data={data}
              results={results}
              setResults={setResults}
              // modalTitle={modalTitle}
              setModalTitle={setModalTitle}
              // modalContent={modalContent}
              setModalContent={setModalContent}
              project={project}
              updateProject={updateProject}
            />
          </div>
        )}
      </div>
      <dialog id="my_modal_2" className="modal ">
        <div className="modal-box w-1/2 max-w-5xl max-h-1/2">
          <h3 className="font-bold text-lg text-secondary">{modalTitle}</h3>
          <div className="divider my-0"></div>
          <p className="py-4">{modalContent}</p>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default MainContainer;
