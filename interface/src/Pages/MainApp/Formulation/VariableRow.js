import React, { useState } from "react";

const VariableRow = ({
    variableKey,
    data,
    updateVariable,
    isAnyLoading,
    project_id,
    updateProject,
}) => {
    const [symbol, setSymbol] = useState(data.symbol);
    const [shape, setShape] = useState(data.shape);
    const [definition, setDefinition] = useState(data.definition);
    const [buttonContent, setButtonContent] = useState(
        <i className="fa fa-trash"></i>
    );

    // const updateVariables = (symbol, shape, definition) => {
    //     const updatedParam = {
    //         symbol: symbol,
    //         shape: shape,
    //         definition: definition,
    //     };
    //     updateVariable(variableKey, updatedParam);
    // };

    const handleShapeChange = (e) => {
        setShape(e.target.value);
        updateVariable(variableKey, "shape", e.target.value);
        // updateVariables(symbol, e.target.value, definition);
    };

    const handleDefinitionChange = (e) => {
        setDefinition(e.target.value);
        updateVariable(variableKey, "definition", e.target.value);
        // updateVariables(symbol, shape, e.target.value);
    };

    const handleSymbolChange = (e) => {
        setSymbol(e.target.value);
        updateVariable(variableKey, "symbol", e.target.value);
        // updateVariables(e.target.value, shape, definition);
    };

    const deleteVariable = (variableKey) => {
        // send a request to the backend to delete the variable

        setButtonContent(
            <div className="loading loading-sm loading-white"></div>
        );

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

    return (
        <tr>
            <th className="indexColumn">
                <input
                    type="text"
                    placeholder="Buy_{i}"
                    value={symbol}
                    className="input input-bordered input-xs fullWidthInput"
                    onChange={handleSymbolChange}
                />
            </th>

            <td className="shapeColumn">
                <input
                    type="text"
                    placeholder="['M', 'N']"
                    value={shape}
                    className="input input-bordered input-xs fullWidthInput"
                    onChange={handleShapeChange}
                />
            </td>
            <td className="definitionColumn">
                <input
                    type="text"
                    placeholder="Amount of material j required to produce 1 unit of i"
                    value={definition}
                    className="input input-bordered input-xs fullWidthInput"
                    onChange={handleDefinitionChange}
                />
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
