from langchain_openai import ChatOpenAI
import os
import json


class StructuredLLM:

    def __init__(
        self,
        schema,
        llm,
        structuring_model="gpt-4o-mini",
    ):
        self.schema = schema
        self.structuring_model = structuring_model
        self.schema_json = json.dumps(schema.schema(), indent=2)
        self.llm = llm
        self.structured_llm = ChatOpenAI(
            model=structuring_model
        ).with_structured_output(schema)

    def invoke(self, prompt):
        full_prompt = (
            prompt
            + "\n\n Your response must be in JSON format compatible with the following python object class schema:"
            + self.schema_json
        )

        print("full_prompt", full_prompt)

        initial_response = self.llm.invoke(full_prompt).content

        print("\n\n\ninitial_response", initial_response)

        structuring_prompt = "Given the following data, format it with the given response format: {initial_response}".format(
            initial_response=initial_response
        )

        print("structuring_prompt", structuring_prompt)

        structured_response = self.structured_llm.invoke(structuring_prompt)
        print("structured_response", structured_response)
        return structured_response


def get_structured_llm(schema, model="gpt-4o"):
    if model in ["gpt-4o", "gpt-4o-mini"]:
        return ChatOpenAI(model=model).with_structured_output(schema)
    elif model in ["o1-mini", "o1-preview"]:
        llm = ChatOpenAI(model=model, temperature=1.0)
        return StructuredLLM(schema, llm)
    elif model in [
        "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
    ]:
        if (
            not os.environ["TOGETHER_API_KEY"]
            or len(os.environ["TOGETHER_API_KEY"]) == 0
        ):
            raise ValueError("TOGETHER_API_KEY is not set")
        llm = ChatOpenAI(
            base_url="https://api.together.xyz/v1",
            api_key=os.environ["TOGETHER_API_KEY"],
            model=model,
        )
        return StructuredLLM(schema, llm)
    else:
        raise ValueError(f"Model {model} not supported")
