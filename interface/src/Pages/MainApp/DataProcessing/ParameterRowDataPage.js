import React from "react";

const ParameterRow = ({
    paramKey,
    data,
    updateParameter,
    deleteParameter,
    callUploadGuide,
    shapeValid,
}) => {
    // define variables for the elements
    const { symbol, shape, definition } = data;
    

    return (
        <tr>
            <th className="indexColumn">{symbol}</th>
            <td className="shapeColumn">{shape}</td>
            <td className="definitionColumn">{definition}</td>
            <td className="statusColumn">
                {data.status === undefined || data.status === "" ? (
                    // on click, shows a modal to upload a file and verify the status
                    <span
                        className="text-warning font-bold"
                        onClick={callUploadGuide}
                    >
                        {/* <i className="fa fa-exclamation-circle mr-1"> </i> */}
                        {/* Unverified */}
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
                    <span
                        className="text-error font-bold"
                        onClick={callUploadGuide}
                    >
                        <i className="fa fa-times-circle mr-1"> </i>
                        {data.status}
                    </span>
                )}
            </td>
        </tr>
    );
};

export default ParameterRow;
