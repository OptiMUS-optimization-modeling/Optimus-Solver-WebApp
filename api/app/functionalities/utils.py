from langchain_openai import ChatOpenAI
import os


def get_llm(model="gpt-4o"):
    if model in ["gpt-4o", "gpt-4o-mini"]:
        return ChatOpenAI(model=model)
    elif model in ["meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"]:
        llm = ChatOpenAI(
            base_url="https://api.together.xyz/v1",
            api_key=os.environ["TOGETHER_API_KEY"],
            model=model,
        )
        return llm
    else:
        raise ValueError(f"Model {model} not supported")
