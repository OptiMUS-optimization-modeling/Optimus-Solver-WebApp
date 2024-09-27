import React, { useState } from "react";

const ParameterRow = ({
  paramKey,
  data,
  // updateParameter,
  deleteParameter,
  // callUploadGuide,
  shapeValid,
  isAnyLoading,
  updateProject,
  project_id,
}) => {
  // define variables for the elements
  const [symbol, setSymbol] = useState(data.symbol);
  const [shape, setShape] = useState(
    `[${data.shape.map((item) => `"${item}"`).join(", ")}]`
  );
  const [definition, setDefinition] = useState(data.definition);
  const [shapeError, setShapeError] = useState(false);

  const [deleteButtonContent, setDeleteButtonContent] = useState(
    <i className="fa fa-trash"></i>
  );
  // update the parameters object on change of the input fields

  const updateParameter = (symbol, shape, definition) => {
    // send a request to the backend to update the parameter
    // then update the state

    if (shape.length === 0) {
      setShapeError(true);
      return;
    }

    if (!shapeValid(shape)) {
      setShapeError(true);
      return;
    } else {
      setShapeError(false);
    }

    console.log("Updating parameter...");
    try {
      // shape from string to array of strings
      const shapeArray = shape
        .replace(/['[\]]/g, "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      console.log("Shape array:", shapeArray);
      fetch(process.env.REACT_APP_BACKEND_URL + "/updateParameter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          project_id: project_id,
          parameter_id: paramKey,
          symbol: symbol,
          shape: shapeArray,
          definition: definition,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Updated parameter:", data);
          updateProject();
        });
    } catch (error) {
      console.error("Error updating parameter:", error);
      alert("Error updating parameter!");
    }
  };

  return (
    <tr>
      {JSON.stringify(data)}
      <th className="indexColumn">
        <input
          type="text"
          placeholder="Amount of material j required to produce 1 unit of i"
          value={symbol}
          className="input input-bordered input-xs fullWidthInput"
          onChange={(e) => {
            setSymbol(e.target.value);
          }}
          onBlur={() => {
            updateParameter(symbol, shape, definition);
          }}
        />
      </th>
      <td className="shapeColumn">
        <input
          type="text"
          placeholder="['M', 'N']"
          value={shape}
          // border shoudl be red if shapeError is true
          className={`input input-bordered input-xs fullWidthInput ${
            shapeError ? "border-error bg-error" : ""
          }`}
          onChange={(e) => {
            setShape(e.target.value);
          }}
          onBlur={() => {
            updateParameter(symbol, shape, definition);
          }}
        />
      </td>
      <td className="definitionColumn">
        <input
          type="text"
          placeholder="Amount of material j required to produce 1 unit of i"
          value={definition}
          className="input input-bordered input-xs fullWidthInput"
          onChange={(e) => {
            setDefinition(e.target.value);
          }}
          onBlur={() => {
            updateParameter(symbol, shape, definition);
          }}
        />
      </td>
      <td className="actionColumn">
        <button
          className="btn btn-sm btn-error"
          onClick={() => {
            setDeleteButtonContent(<i className="fa fa-spinner fa-spin"></i>);
            deleteParameter(paramKey);
          }}
          disabled={isAnyLoading}
        >
          {deleteButtonContent}
        </button>
      </td>
    </tr>
  );
};

export default ParameterRow;
