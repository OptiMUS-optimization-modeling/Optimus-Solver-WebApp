prompt_template = """
You are an optimization expert good at identifying structure in optimization problems.

Given the following natural language description of an optimization problem, classify it into one of the known problem classes listed below. Consider the defining features of each problem class as described. If you believe the problem fits better into a different, well-known problem class not listed here, please identify it.

Problem Classes and Their Defining Features:

1. Traveling Salesman Problem (TSP):
- Objective: Find the most efficient route that visits a set of locations and returns to the starting point.
- Features:
	- Involves multiple locations or nodes.
	- Seeks to minimize total travel distance or cost.
	- Each location is typically visited once.

2. Boolean Satisfiability Problem (SAT):
- Objective: Determine if there is a way to assign truth values to variables that satisfy all given logical conditions.
- Features:
	- Involves variables that can be true or false.
 	- Contains logical expressions or constraints.
	- Seeks a feasible assignment that meets all conditions.

3. Regression:
- Objective: Model the relationship between variables to predict or explain outcomes.
- Features:
	- Involves data points with dependent and independent variables.
 	- Seeks to find a function or model that fits the data.
	- Used for prediction, forecasting, or understanding relationships.

4. Network Flow Problem:
- Objective: Optimize the flow through a network to achieve maximum efficiency or minimum cost.
- Features:
	- Involves a network of nodes and edges.
 	- Has capacities or limitations on the edges.
	- Seeks the best way to route flow from sources to destinations.

5. Knapsack Problem:
- Objective: Select items to maximize total value without exceeding a weight or capacity limit.
- Features:
	- Involves items with associated weights and values.
 	- Has a constraint on total allowable weight or capacity.
	- Seeks the most valuable combination of items within the constraint.

6. Shortest Path Problem:
- Objective: Find the least costly path between two points in a network.
- Features:
	- Involves nodes and edges with associated costs or distances.
 	- Seeks to minimize the total cost or distance.
	- Pathfinding without the need to visit all nodes.

7. Clustering:
- Objective: Group similar data points together based on defined criteria.
- Features:
	- Involves a set of data points without predefined labels.
 	- Seeks to identify natural groupings or patterns.
	- Used for data analysis and pattern recognition.

8. Assignment Problem:
- Objective: Assign resources to tasks in the most effective way.
- Features:
	- Involves matching agents to tasks or jobs.
 	- Seeks to minimize total cost or maximize efficiency.
	- Each agent is assigned to one task.

9. Scheduling Problem:
- Objective: Allocate resources over time to perform a set of tasks.
- Features:
	- Involves tasks, resources, and time constraints.
 	- Seeks to optimize the sequence or timing of tasks.
	- Considers deadlines, durations, and resource availability.


Your Task:

1. Analyze the given problem description.
2. Match the problem's features to those of the problem classes listed above.
3. Identify the most appropriate problem class.

If the problem description matches one of the types above, please output the name of the type. Otherwise, output "Nothing".

Here is the problem description 

{description}
"""


from pydantic.v1 import BaseModel, Field
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")


class StructureResponse(BaseModel):
    problem_type: str = Field(
        description="The type of the structured problem that the description matches. NA if the problem does not match any of the given problem types."
    )
    explanation: str = Field(
        description="A brief markdown string of 1-5 sentences (no latex format mathematical notation) explaining how the given description matches the problem type, NA if the problem does not match any of the given problem types. You can use bold/italic/etc. highlighting and indentation for better readability."
    )


structured_llm = llm.with_structured_output(StructureResponse)


def detect_structure(description):

    prompt = prompt_template.format(description=description)
    res = structured_llm.invoke(prompt)

    if res.problem_type == "NA":
        return None, None
    return res.problem_type, res.explanation
