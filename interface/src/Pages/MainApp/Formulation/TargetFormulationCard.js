import React, { useState, useEffect } from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { getScoreColor } from "../../../Services/api";

const TargetFormulationCard = ({
  targetKey,
  target,
  updateTarget,
  targetType,
  isAnyLoading,
  handleFormulateClick,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tmpFormulation, setTmpFormulation] = useState(target.formulation);

  useEffect(() => {
    setTmpFormulation(target.formulation);
  }, [target.formulation]);

  return (
    <div className="flex flex-row w-full">
      <div className="flex flex-col w-1/2 bg-base-300 border rounded-box p-4 mt-2">
        <div className="flex flex-row justify-center items-between">
          <input
            type="text"
            placeholder="Type here"
            value={target.description}
            disabled
            className="input input-sm input-bordered w-full mr-4"
          />
          <div className="w-1/5 flex justify-end items-center">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setIsLoading(true);
                handleFormulateClick(target, targetType, {})
                  .then(() => {
                    setIsLoading(false);
                  })
                  .catch(() => {
                    setIsLoading(false);
                  });
              }}
              disabled={isAnyLoading}
            >
              {isLoading ? (
                <span className="loading loading-dots loading-lg"></span>
              ) : (
                "Formulate"
              )}
            </button>
          </div>
        </div>
        <textarea
          placeholder="\sum_{i=1}^{n} x_i"
          value={tmpFormulation}
          onChange={(e) => {
            setTmpFormulation(e.target.value);
          }}
          onBlur={() => {
            updateTarget(targetKey, "formulation", tmpFormulation);
          }}
          className="textarea textarea-bordered mt-2 w-full"
          rows="3"
        ></textarea>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs mr-2">
            Confidence:{" "}
            <span className="font-bold">
              {target.formulationConfidence
                ? target.formulationConfidence
                : "?"}
              /5
            </span>
          </span>
          <progress
            className={`progress w-1/2 progress-${getScoreColor(
              target.formulationConfidence
            )}`}
            value={
              isLoading
                ? null
                : target.formulationConfidence
                ? target.formulationConfidence
                : isAnyLoading
                ? null
                : 0
            }
            max="5"
          ></progress>
        </div>
      </div>
      {/* wrap if overflow on x */}
      <div className="flex flex-col w-1/2 items-start justify-center max-w-1/2 border rounded-box p-4 mt-2 ml-4 overflow-x-auto">
        {tmpFormulation ? (
          <div key={target.id}>
            <BlockMath math={tmpFormulation} />
          </div>
        ) : (
          <div className="flex justify-center items-center w-full text-gray-500">
            <span>
              The formulation is empty{" "}
              <i class="fa-regular fa-face-grin-beam"></i>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TargetFormulationCard;
