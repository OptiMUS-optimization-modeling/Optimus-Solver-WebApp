import React, { useEffect, useState } from "react";
import AceEditor from "react-ace";

import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-tomorrow_night";

const TargetCodingCard = ({
  isDark,
  targetKey,
  target,
  updateTarget,
  targetType,
  isAnyLoading,
  isCodeAllLoading,
  handleCodeClick,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tmpCode, setTmpCode] = useState(target.code);

  useEffect(() => {
    setTmpCode(target.code);
  }, [target.code]);

  const theme = isDark ? "tomorrow_night" : "tomorrow";

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-row w-full mb-5">
        <div className="flex flex-col w-1/2 items-start justify-center max-w-1/2 border rounded-box p-4 mt-2 mr-4 overflow-x-auto">
          <div className="flex flex-col w-full items-start justify-center max-w-1/2 overflow-x-auto">
            <div key={targetKey}>
              <BlockMath math={target.formulation} />
            </div>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setIsLoading(true);
              handleCodeClick(target, targetType)
                .then(() => {
                  setIsLoading(false);
                })
                .catch(() => {
                  setIsLoading(false);
                });
            }}
            disabled={isAnyLoading || isCodeAllLoading}
          >
            {isAnyLoading || isCodeAllLoading ? (
              <span className="loading loading-dots loading-lg"></span>
            ) : (
              "Generate Code"
            )}
          </button>
        </div>

        <div className="flex flex-col w-1/2 h-100">
          <div className="w-full bg-base-300 border rounded-box p-4 mt-2 h-full">
            <AceEditor
              mode="python"
              theme={theme}
              onChange={(e) => {
                setTmpCode(e);
              }}
              onBlur={() => {
                updateTarget(targetKey, "code", tmpCode);
              }}
              name={targetKey}
              editorProps={{ $blockScrolling: true }}
              value={tmpCode}
              style={{ height: "100%", width: "100%" }} // set the height to 100% to make it responsive
              wrapEnabled={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetCodingCard;
