import React, { useState, useEffect, useCallback } from "react";
import "./DataProcessing.css";

const DataProcessingPage = ({
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
  // dataButtonContent,
  // setDataButtonContent,
  project,
  updateProject,
}) => {
  // const [isLoading, setIsLoading] = useState(false);
  const [allPass, setAllPass] = useState(false);
  const [boxContent, setBoxContent] = useState("");

  const generateArray = useCallback((shape) => {
    // shape is an array of numbers
    if (shape.length === 0) {
      return Math.floor(Math.random() * 10) + 1;
    }
    let arr = [];
    for (let i = 0; i < shape[0]; i++) {
      arr.push(generateArray(shape.slice(1)));
    }
    return arr;
  }, []);

  const getDummyData = useCallback(() => {
    let dummy_data = {};
    // for parameters that are scalars (shape = []) generate a random number between 2 and 5
    Object.entries(project.parameters).forEach(([key, param]) => {
      if (param.shape.length === 0) {
        dummy_data[param.symbol] = Math.floor(Math.random() * 5 + 2);
      }
    });

    // for other parameters, generate a random number between 1 and 10 for each element
    Object.entries(project.parameters).forEach(([key, param]) => {
      if (param.shape.length > 0) {
        let shape = param.shape.map((item) => dummy_data[item]);
        dummy_data[param.symbol] = generateArray(shape);
      }
    });

    return dummy_data;
  }, [project.parameters, generateArray]);

  const getBoxContent = useCallback(() => {
    let all_defined = true;

    Object.entries(project.parameters).forEach(([key, param]) => {
      if (param.definition === "") {
        console.log("PARAM: ", param.shape.length, param.definition);
        all_defined = false;
      }
    });

    console.log("ALL DEFINED: ", all_defined);
    if (Object.keys(project.parameters).length === 0) {
      return (
        <div className=" my-10">
          <p className="text-error text-xl">
            {" "}
            Please go to the parameters section and add at least one parameter!
          </p>
        </div>
      );
    }
    if (!all_defined) {
      return (
        <div>
          <p>
            {" "}
            Please go to the parameters page and add the shapes and definitions
            of all parameters! These items are not defined yet:
          </p>
          <ul>
            {Object.entries(project.parameters).map(([key, param]) => (
              <li>
                {param.shape.length === 0 && param.definition === "" && (
                  <p>{param.symbol}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    console.log("DATA: ", data);
    if (Object.keys(data).length === 0) {
      setData(getDummyData());
    }

    return (
      <div className="w-full">
        <p> You can either upload your own data or generate dummy data.</p>
        <br />
        {getJsonString(data)}
        <br />
      </div>
    );
  }, [project.parameters, data, getDummyData, setData]);

  useEffect(() => {
    console.log("DATA: ", data);
    setBoxContent(getBoxContent());
  }, [data, getBoxContent]);

  useEffect(() => {
    let all_pass = true;
    console.log("PARAMETERS: ", project.parameters);
    Object.entries(project.parameters).forEach(([key, param]) => {
      if (
        param.shape.length === 0 ||
        param.definition === ""
        // param.status != "pass"
      ) {
        all_pass = false;
      }
    });

    setAllPass(all_pass);
  }, [project.parameters]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    // Check if the file is a JSON file
    if (!file || file.type !== "application/json") {
      setModalTitle("Error");
      setModalContent("Please upload a JSON file.");
      document.getElementById("my_modal_2").showModal();
      // clean the input
      event.target.value = null;
      return;
    }

    try {
      const fileContent = await readFile(file);
      data = JSON.parse(fileContent);

      // Validate the keys in your JSON file
      const isValid = validateJsonKeys(data);
      if (!isValid) {
        event.target.value = null;
        return;
      }

      // show a modal saying "processing the file" + "spinner" for 1 second
      setModalTitle("Data file received!");
      setModalContent(
        <div className="flex flex-row justify-center items-center">
          <span class="loading loading-spinner loading-lg mr-5"></span>
          <span>Processing the file</span>
        </div>
      );
      document.getElementById("my_modal_2").showModal();

      // wait for 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Send file to the backend
      const response = await sendFileToBackend(file);
      if ("error" in response) {
        throw new Error(response.error);
      }
      console.log("GEGEG ", response);
      event.target.value = null;
      // response is a json: return jsonify({"all_pass": all_pass, "parameters": parameters}), 200

      let all_pass = response.all_pass;

      if (!all_pass) {
        setModalTitle("Error");
        setModalContent(
          "Some parameters failed the tests! Please check the table."
        );
        document.getElementById("my_modal_2").showModal();
      } else {
        setModalTitle("Success");
        setData(data);
        setBoxContent(getBoxContent());
        setModalContent(
          <div>
            <div className="flex flex-row justify-center items-center mb-5">
              <span class="fa fa-check-circle fa-lg mr-2 text-success"></span>
              <span>The file passed the validity tests! </span>
            </div>
            <div className="flex items-center justify-center">
              <button
                className="btn btn-secondary btn-sm w-1/4"
                onClick={() => handleNextClick()}
                disabled={!allPass}
              >
                Next
                <i className="fas fa-arrow-right fa-xl"></i>
              </button>
            </div>
          </div>
        );
        // change "Contuinue with dummy data" to "Continue with the uploaded data"
        document.getElementById("my_modal_2").showModal();
      }
      console.log(response.parameters);
      // setParameters(response.parameters);
      // close the modal
      // document.getElementById("my_modal_2").close();
    } catch (error) {
      event.target.value = null;
      setModalTitle("Error");
      setModalContent(`Error: ${error.message}`);
      document.getElementById("my_modal_2").showModal();
    }
  };

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const validateJsonKeys = (jsonData) => {
    // go throguh all parameters and create a list of their symbols
    const requiredKeys = project.parameters.map((param) => param.symbol);

    // check if all required keys are in the JSON file, and alert the ones that are missing
    const missingKeys = requiredKeys.filter((key) => !(key in jsonData));
    if (missingKeys.length > 0) {
      setModalTitle("Error");
      setModalContent(
        <div>
          <p className="mb-2">
            The following keys are missing from the JSON file:{" "}
          </p>
          <ul>
            {missingKeys.map((key) => (
              <li>- {key}</li>
            ))}
          </ul>
        </div>
      );
      document.getElementById("my_modal_2").showModal();
      return false;
    }
    return true;
  };

  const sendFileToBackend = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    // add parameters to the formData
    formData.append("parameters", JSON.stringify(project.parameters));

    // Replace with your API endpoint
    const response = await fetch(
      process.env.REACT_APP_BACKEND_URL + "/uploadData",
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(
        "An error occurred while uploading the file. Error code: " +
          response.status +
          " " +
          response.statusText
      );
    }

    return await response.json();
  };

  const handleNextClick = () => {
    setCurrentStep(6);
    // close the modal
    document.getElementById("my_modal_2").close();
    // scroll to top
    window.scrollTo(0, 0);
  };

  const getJsonString = (dict) => {
    const formatValue = (value) => {
      if (Array.isArray(value)) {
        // Format single-level arrays in one line
        if (value.every((item) => !Array.isArray(item))) {
          return JSON.stringify(value);
        }
        // Format multi-level arrays (matrices) with line breaks
        return (
          "[\n    " +
          value.map((subArray) => JSON.stringify(subArray)).join(",\n    ") +
          "\n  ]"
        );
      }
      return JSON.stringify(value, null, 2);
    };

    const formattedJsonString = (obj) => {
      let result = "{\n";
      Object.entries(obj).forEach(([key, value]) => {
        result += `  "${key}": ${formatValue(value)},\n`;
      });
      result = result.slice(0, -2); // Remove the last comma and newline
      result += "\n}";
      return result;
    };

    const jsonString = formattedJsonString(dict);

    return (
      <div className="data-box bg-base-200 overflow-y-scroll border border-base-300 rounded-box table-container p-4">
        <pre>{jsonString}</pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row w-ninety justify-between mt-5">
        <h1 className="text-xl ">Data</h1>
      </div>

      <div className="flex flex-row w-ninety justify-center items-center my-5">
        {boxContent}
      </div>
      <div className="flex flex-row justify-center items-center w-ninety mt-5">
        <div className="flex justify-start items-center w-2/3">
          <input
            type="file"
            className="file-input file-input-bordered file-input-primary w-2/5 max-w-xs file-input mr-10"
            onChange={handleFileChange}
            accept=".json"
          />
          <button
            className="btn btn-primary w-2/5 "
            onClick={() => {
              setData(getDummyData());
            }}
          >
            Generate Dummy Data
          </button>
        </div>

        <div className=" flex justify-end items-center w-1/2">
          <button
            className="btn btn-secondary w-1/2"
            onClick={() => {
              if (Object.keys(data).length === 0) {
                setData(getDummyData());
              }

              handleNextClick();
            }}
          >
            Continue with this data
          </button>
        </div>
      </div>
      {/* 
            <div className="flex flex-row w-ninety mt-10 justify-end">
                <button
                    className="btn btn-primary w-1/4"
                    onClick={() => callUploadGuide()}
                >
                    Select Data
                </button>
            </div> */}

      {/* a row with items */}
      {/* <div className="flex flex-row w-ninety mt-20 justify-end">
                <div className="flex flex-col w-1/6">
                    <div
                        className="tooltip tooltip-left tooltip-accent w-full"
                        data-tip="Please upload a data file that matches the parameters to proceed to the next step."
                    >
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
            </div> */}

      {/* <dialog id="my_modal_2" class="modal ">
                <div class="modal-box w-1/2 max-w-5xl max-h-1/2">
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

export default DataProcessingPage;
