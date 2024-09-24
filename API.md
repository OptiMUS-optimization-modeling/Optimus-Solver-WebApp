# API

### /extract_params

Endpoint to extract parameters from the natural language description of the problem

**Args**:

```json
{
    "problem_description": str
}
```

**Response**:

```json
{
    "parameters": {
        <str:symbol>: {
            "definition": str,
            "shape": [<str:dimension_parameter_symbol>]
        }
    },
    "problem_summary": str,
    "reformatted_description": str
}
```

### /extract_clauses

Endpoint to extract clauses from the reformatted natural language description of the problem

**Args:**

```json
{
    "reformatted_description": str,
    "problem_summary": str,
    "parameters": {
        <str:symbol>: {
            "definition": str,
            "shape": [<str:dimension_parameter_symbol>]
        }
    }
}
```

**Output:**

id=0 is the objective

```json
{
    "constraints": {
        <int:clause_id>: {
            "description": <string:clause_description>,
            "type": str ('implicit' or 'explicit')
        },
    },
    "objective": str
}
```

### /formulate_clause

related_parameters should be self-contained (it should cover all parameters that are related to the clause, and all the parameters that are used to define their shape)

**Args:**

```json
{
    "related_parameters": {
        <str:symbol>: {
            "description": str,
            "shape": [<str:dimension_parameter_symbol>]
        }
    },
    "existing_variables": {
        <str:symbol>:{
            "description": str,
            "type": str,
            "shape": [<str:dimension_parameter_symbol>]
        }
    },
    "clause":{
        "id": str,
        "description": str,
        "shape": [<str:dimension_parameter_symbol>]
    },
    "problem_summary": str,
}
```

**Output:**

```json
{
    "updated_variables": {
        <str:symbol>:{
            "description":str,
            "type": str,
            "shape": [<str:dimension_parameter_symbol>]
        }
    },
    "related_variables": [<str:variable_symbol>],
    "clause_formulation": str
}
```

### /code_clause

**Args:**

```json
{
    "related_parameters": {
        <int:parameter_id>: {
            "description": str,
            "symbol": str,
            "shape": [<str:dimension_parameter_symbol>]
        }
    },
    "related_variables": {
        <int:id>:{
            "description": str,
            "symbol": str,
            "type": str,
            "shape": [<str:dimension_parameter_symbol>]
        }
    },
    "clause":{
        "id": int,
        "description": str,
        "formulation": str,
        "shape": [<str:dimension_parameter_symbol>]
    },
    "problem_summary": str,
}
```

**Output:**

```json
{
    "clause_code": str
}
```

# Structured Problem Format

```json
{
    "problem_description": str,
    "reformatted_problem_description": str,
    "problem_summary": str,
    "parameters": {
        <int:parameter_id>: {
            "description": str,
            "symbol": str,
            "shape": [<str:dimension_parameter_symbol>]
        }
    },
    "variables": {
        <int:variable_id>: {
            "description": str,
            "symbol": str,
            "type": str,
            "shape": [<str:dimension_parameter_symbol>]
        }
    },
    "clauses": {
        <int:clause_id>: {
            "description": str,
            "formulation": str,
            "code": str,
            "related_parameters": [<int:parameter_id>],
            "related_variables": [<int:variable_id>]
        }
    },
    "problem_summary": str,
}
```

# Tasks:

-   Create Github pages and documentations
-   Create a heroku instance connected to the main branch of the
-   Buy and park a domain on it
-   Create the frontend
-   Create a PyPi library for the interface
