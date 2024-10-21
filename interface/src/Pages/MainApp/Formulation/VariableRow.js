import React, { useState } from "react";

const VariableRow = ({
  variableKey,
  data,
  isAnyLoading,
  project_id,
  updateProject,
  shapeValid, // Ensure this prop is passed if shape validation is needed
}) => {
  const [symbol, setSymbol] = useState(data.symbol);
  const [shape, setShape] = useState(JSON.stringify(data.shape));
  const [definition, setDefinition] = useState(data.definition);
  const [type, setType] = useState(data.type);

  const [buttonContent, setButtonContent] = useState(
    <i className="fa fa-trash"></i>
  );

  // Add shape validation state
  const [shapeError, setShapeError] = useState(false);

  // Define the updateVariable function
  const updateVariable = (symbol, shape, definition, type) => {
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

    console.log("Updating variable...");
    try {
      const shapeArray = shape
        .replace(/['[\]]/g, "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      console.log("Shape array:", shapeArray);
      fetch(process.env.REACT_APP_BACKEND_URL + "/updateVariable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          project_id: project_id,
          variable_id: variableKey,
          symbol: symbol,
          shape: shapeArray,
          definition: definition,
          type: type,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Updated variable:", data);
          updateProject();
        });
    } catch (error) {
      console.error("Error updating variable:", error);
      alert("Error updating variable!");
    }
  };

  const deleteVariable = (variableKey) => {
    // send a request to the backend to delete the variable

    setButtonContent(<div className="loading loading-sm loading-white"></div>);

    try {
      fetch(process.env.REACT_APP_BACKEND_URL + "/deleteVariable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          project_id: project_id,
          variable_id: variableKey,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Deleted Variable:", data);
          updateProject();
        });
    } catch (error) {
      console.error("Error deleting variable:", error);
      setButtonContent(<i className="fa fa-trash"></i>);
    }
  };

  // Update the onBlur handlers to use the new updateVariable function
  return (
    <tr>
      <th className="indexColumn">
        <input
          type="text"
          placeholder="Buy_{i}"
          value={symbol}
          className="input input-bordered input-xs fullWidthInput"
          onChange={(e) => {
            setSymbol(e.target.value);
          }}
          onBlur={() => {
            updateVariable(symbol, shape, definition, type);
          }}
        />
      </th>

      <td className="shapeColumn">
        <input
          type="text"
          placeholder="['M', 'N']"
          value={shape}
          className={`input input-bordered input-xs fullWidthInput ${
            shapeError ? "border-error bg-error" : ""
          }`}
          onChange={(e) => {
            setShape(e.target.value);
          }}
          onBlur={() => {
            updateVariable(symbol, shape, definition, type);
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
            updateVariable(symbol, shape, definition, type);
          }}
        />
      </td>
      <td className="typeColumn">
        <select
          value={type}
          className="input input-bordered input-xs fullWidthInput"
          onChange={(e) => {
            setType(e.target.value);
          }}
          onBlur={() => {
            updateVariable(symbol, shape, definition, type);
          }}
        >
          <option value="BINARY">BINARY</option>
          <option value="INTEGER">INTEGER</option>
          <option value="CONTINUOUS">CONTINUOUS</option>
        </select>
      </td>
      <td className="actionColumn">
        <button
          className="btn btn-sm btn-error"
          onClick={() => {
            deleteVariable(variableKey);
          }}
          disabled={isAnyLoading}
        >
          {buttonContent}
        </button>
      </td>
    </tr>
  );
};

export default VariableRow;
