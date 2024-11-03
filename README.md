# OptiMUS Solver

This repo contains the code for backend and frontend of [OptiMUS Solver Web App](https://optimus-solver.com/). For OptiMUS paper repositories, see [OptiMUS GitHub Repository](https://github.com/teshnizi/OptiMUS).

![image](https://github.com/user-attachments/assets/64837284-6f78-4158-90b3-4dae76e6e426)

## Structure

The backend, built with Flask, is located in the [`api/`](api/) directory. The frontend, a React application, can be found in the [`app/`](app/) directory.

## Dataset

You can download the dataset from [https://huggingface.co/datasets/udell-lab/NLP4LP](https://huggingface.co/datasets/udell-lab/NLP4LP). Please note that NLP4LP is intended and licensed for research use only. The dataset is CC BY NC 4.0 (allowing only non-commercial use) and models trained using the dataset should not be used outside of research purposes (The updated version will be added soon).

## Contribution

To contribute to the web app, please open an issue or a pull request. All code functionalities are in the [`/api/app/functionalities`](api/app/functionalities) directory.

## Adding New Solvers

To add new a new solver, please follow these steps:

1. Create a coding prompt file SOLVER_NAME.py in [Coding Prompts](https://github.com/OptiMUS-optimization-modeling/Optimus-Solver-WebApp/tree/main/api/app/functionalities/coding/prompts)
2. Create a formulation prompt file SOLVER_NAME.py in [Formulation Prompts](https://github.com/OptiMUS-optimization-modeling/Optimus-Solver-WebApp/tree/main/api/app/functionalities/formulation/prompts)
3. Create a debugging prompt file SOLVER_NAME.py in [Debugging Prompts](https://github.com/OptiMUS-optimization-modeling/Optimus-Solver-WebApp/tree/main/api/app/functionalities/debugging/prompts)
 
4. Add the solver to the dropdown list in the front end [Analysis Page](https://github.com/OptiMUS-optimization-modeling/Optimus-Solver-WebApp/blob/main/interface/src/Pages/MainApp/Analysis/AnalysisPage.js). For example for cvxpy, you should add this line  `<option value="cvxpy">cvxpy</option>`

Create a PR request to merge the code. You can look at the existing prompt files for gurobipy for reference. 

# Privacy Policy

The data uploaded to the web app is not used for any commercial purposes. The usage data can be used by in the future to 1) improve the web app and 2) do academic user studies on how people model and solve optimization problems.
