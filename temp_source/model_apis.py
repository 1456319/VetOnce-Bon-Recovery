# This file abstracts the interactions with various Large Language Model APIs.

import os
import openai
import anthropic

# --- Client Initialization ---
# It's assumed that API keys are set as environment variables.
# e.g., OPENAI_API_KEY, ANTHROPIC_API_KEY

class OpenAIModel:
    """A wrapper for the OpenAI API."""
    def __init__(self, model_name="gpt-3.5-turbo"):
        self.model_name = model_name
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def get_responses(self, messages, system_prompt=None, n=1, temperature=1.0, max_tokens=512):
        """
        Gets one or more responses from the OpenAI API.

        Args:
            messages (list): A list of message dictionaries.
            system_prompt (str, optional): The system prompt. Defaults to None.
            n (int): The number of responses to generate.
            temperature (float): The sampling temperature.
            max_tokens (int): The maximum number of tokens to generate.

        Returns:
            list: A list of response strings.
        """
        # OpenAI API expects system prompt as part of the messages list
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=full_messages,
                n=n,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return [choice.message.content for choice in response.choices]
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            return [""] * n

class AnthropicModel:
    """A wrapper for the Anthropic (Claude) API."""
    def __init__(self, model_name="claude-2"):
        self.model_name = model_name
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    def get_responses(self, messages, system_prompt=None, n=1, temperature=1.0, max_tokens=512):
        """
        Gets one or more responses from the Anthropic API.
        Note: The official Anthropic API does not support generating `n` choices in a single call.
        This function simulates it by making `n` separate calls.
        """
        responses = []
        for _ in range(n):
            try:
                response = self.client.messages.create(
                    model=self.model_name,
                    system=system_prompt,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                responses.append(response.content[0].text)
            except Exception as e:
                print(f"Error calling Anthropic API: {e}")
                responses.append("")
        return responses

# --- Factory Function ---
def get_model_api(model_name):
    """
    Factory function to get the correct model API client based on the model name.
    """
    if "gpt" in model_name.lower():
        return OpenAIModel(model_name)
    elif "claude" in model_name.lower():
        return AnthropicModel(model_name)
    else:
        raise ValueError(f"Unsupported model name: {model_name}")
