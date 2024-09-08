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
    const [shape, setShape] = useState(data.shape);
    const [definition, setDefinition] = useState(data.definition);
    const [shapeError, setShapeError] = useState(false);

    const [deleteButtonContent, setDeleteButtonContent] = useState(
        <i className="fa fa-trash"></i>
    );
    // update the parameters object on change of the input fields

    // const updateParameters = (symbol, shape, definition) => {
    //     const updatedParam = {
    //         symbol: symbol,
    //         shape: shape,
    //         definition: definition,
    //     };
    //     updateParameter(paramKey, updatedParam);
    // };

    const handleShapeChange = (e) => {
        if (shapeValid(e.target.value)) {
            setShapeError(false);
        } else {
            setShapeError(true);
        }
        setShape(e.target.value);
        // updateParameter(symbol, e.target.value, definition);
    };

    // const handleDefinitionChange = (e) => {
    // setDefinition(e.target.value);
    // updateParameters(symbol, shape, e.target.value);
    // };

    // const handleSymbolChange = (e) => {
    // setSymbol(e.target.value);
    // updateParameters(e.target.value, shape, definition);
    // updateParameter(e.target.value, shape, definition);
    // };

    const updateParameter = (symbol, shape, definition) => {
        // send a request to the backend to update the parameter
        // then update the state
        console.log("Updating parameter...");
        try {
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
                    shape: shape,
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
                    onChange={handleShapeChange}
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
                        setDeleteButtonContent(
                            <i className="fa fa-spinner fa-spin"></i>
                        );
                        deleteParameter(paramKey);
                    }}
                    disabled={isAnyLoading}
                >
                    {deleteButtonContent}
                </button>
            </td>

            {/* <td className="statusColumn">
                {data.status === undefined || data.status === "" ? (
                    // on click, shows a modal to upload a file and verify the status

                    <span
                        className="text-warning font-bold"
                        onClick={callUploadGuide}
                    >
                        <i className="fa fa-exclamation-circle mr-1"> </i>
                        Unverified
                    </span>
                ) : data.status === "pass" ? (
                    <span
                        className="text-success font-bold"
                        onClick={callUploadGuide}
                    >
                        <i className="fa fa-check-circle mr-1"> </i>
                        Valid
                    </span>
                ) : (
                    // just use red text instead of badge
                    <span
                        className="text-error font-bold"
                        onClick={callUploadGuide}
                    >
                        <i className="fa fa-times-circle mr-1"> </i>
                        {data.status}
                    </span>
                )}
            </td> */}
        </tr>
    );
};

export default ParameterRow;
