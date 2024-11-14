prompt_template = """
You are an expert mathematical formulator and an optimization professor at a top university. Your task is to model {clauseType} of the problem in the standard LP or MILP form.

Here is a summary of the problem:

-----
{background}
-----

Here's a {clauseType} we need you to model:

-----
{clauseDescription}
-----

and here is list of available input parameters:

-----
{parameters}
-----

and here is the list of available variables:

-----
{variables}
-----

Take a deep breath and explain how we should define the {clauseType}. Feel free to define new variables if you think it's necessary.

- Your formulation should be in LaTeX mathematical format (do not include the $ symbols).
- Use CamelCase and full words for symbols, and do not include indices in the symbol (e.g. ItemsSold instead of itemsSold or items_sold or ItemsSold_i)
- Consider the list of existing variables carefully, and do not define the same variable twice.
- Only model the {clauseType}.

"""