import React, { useState, useEffect, useCallback } from "react";
import "./DataProcessing.css";

const DataProcessingPage = ({
  setCurrentStep,
  data,
  setData,
  setModalTitle,
  setModalContent,
  project,
  updateProject,
}) => {
  const [allPass, setAllPass] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [errors, setErrors] = useState([]);

  const generateArray = useCallback((shape) => {
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
    Object.entries(project.parameters).forEach(([key, param]) => {
      if (param.shape.length === 0) {
        dummy_data[param.symbol] = Math.floor(Math.random() * 5 + 2);
      }
    });

    Object.entries(project.parameters).forEach(([key, param]) => {
      if (param.shape.length > 0) {
        let shape = param.shape.map((item) => dummy_data[item]);
        dummy_data[param.symbol] = generateArray(shape);
      }
    });

    return dummy_data;
  }, [project.parameters, generateArray]);

  useEffect(() => {
    console.log("JSON INPUT: ", jsonInput);
    console.log("JSON STRING: ", getJsonString(data));
    setJsonInput(getJsonString(data));
  }, [data]);

  const validateJson = useCallback(
    (input) => {
      let parsedData;
      let validationErrors = [];

      // Syntax Validation
      try {
        parsedData = JSON.parse(input);
      } catch (e) {
        validationErrors.push("JSON is not formatted correctly.");
        setErrors(validationErrors);
        return;
      }

      // Structure Validation
      Object.entries(project.parameters).forEach(([key, param]) => {
        const dataValue = parsedData[param.symbol];

        console.log("Param: ", param.symbol, param.shape, dataValue);
        if (dataValue === undefined) {
          validationErrors.push(`Missing key: ${param.symbol}`);
          return;
        }

        const checkShape = (value, shape) => {
          if (shape.length === 0) {
            if (typeof value === "number") {
              return null;
            } else {
              return "Must be a number!";
            }
          }
          if (!Array.isArray(value)) {
            return "Must be an array!";
          }
          if (value.length !== parsedData[shape[0]]) {
            return `Incorrect shape! Dimension is ${value.length} instead of ${
              parsedData[shape[0]]
            }`;
          }
          for (let item of value) {
            let tmpRes = checkShape(item, shape.slice(1));
            if (tmpRes !== null) {
              return tmpRes;
            }
          }
          return null;
        };

        let res = checkShape(dataValue, param.shape);
        if (res !== null) {
          validationErrors.push(
            <div key={param.symbol}>
              Error for <strong>{param.symbol}:</strong> {res}
            </div>
          );
        }
      });

      setErrors(validationErrors);
      if (validationErrors.length === 0) {
        setData(parsedData);
      }
    },
    [project.parameters, setData]
  );

  const handleJsonChange = (e) => {
    setJsonInput(e.target.value);
    validateJson(e.target.value);
  };

  const getBoxContent = useCallback(() => {
    let all_defined = true;

    Object.entries(project.parameters).forEach(([key, param]) => {
      if (param.definition === "") {
        all_defined = false;
      }
    });

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
              <li key={key}>
                {param.shape.length === 0 && param.definition === "" && (
                  <p>{param.symbol}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (Object.keys(data).length === 0) {
      const dummy = getDummyData();
      setData(dummy);
      setJsonInput(getJsonString(dummy));
    }

    return (
      <div className="w-full">
        <p> You can either upload your own data or generate dummy data.</p>
        <br />
        <div className="data-box bg-base-200 overflow-y-scroll border border-base-300 rounded-box table-container p-4">
          <textarea
            className="w-full h-64 p-2 border border-gray-300 rounded"
            value={jsonInput}
            onChange={handleJsonChange}
            placeholder="Edit JSON data here..."
            rows="15"
          />
          {errors.length > 0 && (
            <div className="mt-2 text-red-500">
              <ul>
                {errors.map((error, index) => (
                  <li className="text-error" key={index}>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errors.length === 0 && <div className="mt-2 text-green-500"></div>}
        </div>
        <br />
      </div>
    );
  }, [project.parameters, data, getDummyData, setData, jsonInput]);

  useEffect(() => {
    let all_pass = true;

    Object.entries(project.parameters).forEach(([key, param]) => {
      if (param.shape.length === 0 || param.definition === "") {
        all_pass = false;
      }
    });

    setAllPass(all_pass);
  }, [project.parameters]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file || file.type !== "application/json") {
      setModalTitle("Error");
      setModalContent("Please upload a JSON file.");
      document.getElementById("my_modal_2").showModal();
      event.target.value = null;
      return;
    }

    try {
      const fileContent = await readFile(file);
      // Validate the JSON before setting data
      validateJson(fileContent);
      if (errors.length > 0) {
        throw new Error("JSON validation failed.");
      }

      const dummy_data = JSON.parse(fileContent);
      const response = await sendFileToBackend(file);
      if ("error" in response) {
        throw new Error(response.error);
      }

      event.target.value = null;

      let all_pass = response.all_pass;

      if (!all_pass) {
        setModalTitle("Error");
        setModalContent(
          "Some parameters failed the tests! Please check the table."
        );
        document.getElementById("my_modal_2").showModal();
      } else {
        setModalTitle("Success");
        setData(dummy_data);

        setModalContent(
          <div>
            <div className="flex flex-row justify-center items-center mb-5">
              <span className="fa fa-check-circle fa-lg mr-2 text-success"></span>
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
        document.getElementById("my_modal_2").showModal();
      }
      console.log(response.parameters);
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

  const sendFileToBackend = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("parameters", JSON.stringify(project.parameters));

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
    document.getElementById("my_modal_2").close();
    window.scrollTo(0, 0);
  };

  const getJsonString = (dict) => {
    const formatValue = (value, indentLevel = 2) => {
      const indent = " ".repeat(indentLevel);
      if (Array.isArray(value)) {
        if (value.every((item) => !Array.isArray(item))) {
          return JSON.stringify(value);
        }

        return (
          "[\n" +
          value
            .map((subArray) => indent + JSON.stringify(subArray))
            .join(",\n") +
          "\n" +
          " ".repeat(indentLevel - 2) +
          "]"
        );
      }

      return JSON.stringify(value, null, indentLevel);
    };

    const formattedJsonString = (obj) => {
      let result = "{\n";
      Object.entries(obj).forEach(([key, value]) => {
        result += `  "${key}": ${formatValue(value, 4)},\n`;
      });
      result = result.slice(0, -2);
      result += "\n}";
      return result;
    };

    return formattedJsonString(dict);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row w-ninety justify-between mt-5">
        <h1 className="text-xl ">Data</h1>
      </div>

      <div className="flex flex-row w-ninety justify-center items-center my-5">
        {getBoxContent()}
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
              const dummy = getDummyData();
              setData(dummy);
              console.log("JSON STRING: ", getJsonString(dummy));
              setJsonInput(getJsonString(dummy));
              validateJson(getJsonString(dummy));
              setErrors([]);
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
                const dummy = getDummyData();
                setData(dummy);
                setJsonInput(getJsonString(dummy));
                setErrors([]);
              }

              handleNextClick();
            }}
          >
            Continue with this data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataProcessingPage;
