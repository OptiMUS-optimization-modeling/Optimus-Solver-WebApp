import React, { useState } from "react";

const ConstraintRow = ({
    constraintKey,
    constraint,
    updateConstraint,
    project_id,
    updateProject,
}) => {
    // define variables for the elements
    const [tmpDescription, setTmpDescription] = useState(
        constraint.description
    );
    const [buttonContent, setButtonContent] = useState(
        <i className="fa fa-trash"></i>
    );

    const deleteConstraint = () => {
        // send a request to the backend to delete the constraint

        setButtonContent(
            <div className="loading loading-sm loading-white"></div>
        );

        try {
            fetch(process.env.REACT_APP_BACKEND_URL + "/deleteConstraint", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    project_id: project_id,
                    constraint_id: constraintKey,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log("Deleted Constraint:", data);
                    updateProject();
                });
        } catch (error) {
            console.error("Error deleting constraint:", error);
            setButtonContent(<i className="fa fa-trash"></i>);
        }
    };

    return (
        <tr>
            <td className="descriptionColumn">
                <input
                    type="text"
                    placeholder="The firm must produce at least min_{i} units of product i"
                    value={tmpDescription}
                    className="input input-bordered input-xs fullWidthInput"
                    onChange={(e) => {
                        setTmpDescription(e.target.value);
                    }}
                    onBlur={() => {
                        updateConstraint(
                            constraintKey,
                            "description",
                            tmpDescription
                        );
                    }}
                />
            </td>
            <td className="actionColumn">
                <button
                    className="btn btn-sm btn-error"
                    onClick={() => {
                        deleteConstraint(constraintKey);
                    }}
                >
                    {buttonContent}
                </button>
            </td>
        </tr>
    );
};

export default ConstraintRow;
