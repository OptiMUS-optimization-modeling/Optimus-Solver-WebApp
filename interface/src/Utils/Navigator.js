import "./Navigator.css";

function Navigator({ currentStep, setCurrentStep }) {
  const steps = [
    { label: "Description", color: currentStep >= 0 ? "primary" : "" },
    { label: "Parameters", color: currentStep >= 1 ? "primary" : "" },
    {
      label: "Claues",
      color: currentStep >= 2 ? "primary" : "",
    },
    {
      label: "Formulation",
      color: currentStep >= 3 ? "primary" : "",
    },
    { label: "Coding", color: currentStep >= 4 ? "primary" : "" },
    { label: "Data", color: currentStep >= 5 ? "primary" : "" },
    { label: "Testing", color: currentStep >= 6 ? "primary" : "" },
  ];

  return (
    <div className="text-sm">
      <ul className="steps steps-vertical">
        {steps.map((step, index) => (
          <li
            key={index}
            className={`step step-${step.color}`}
            onClick={() => {
              setCurrentStep(index);
              // scroll to top
              window.scrollTo(0, 0);
            }}
          >
            {step.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Navigator;
