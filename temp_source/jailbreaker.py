# This file contains the main class that orchestrates the Best-of-N process.

import time
from . import model_apis
from . import evaluators

class BestOfNJailbreaker:
    """
    This class implements the Best-of-N (BoN) jailbreaking algorithm.
    It generates N responses from a target model and uses an evaluator
    to select the most likely successful jailbreak.
    """
    def __init__(self, model_name, target_model, evaluator_model, n_samples, system_prompt, template):
        """
        Initializes the BestOfNJailbreaker instance.

        Args:
            model_name (str): The name of the target model to jailbreak.
            target_model: An instance of the model API client for the target model.
            evaluator_model: An instance of the model API client for the evaluator model.
            n_samples (int): The number of responses (N) to generate.
            system_prompt (str): The system prompt to use for the target model.
            template (str): The prompt template for formatting the user's goal.
        """
        self.model_name = model_name
        self.target_model = target_model
        self.evaluator_model = evaluator_model
        self.n_samples = n_samples
        self.system_prompt = system_prompt
        self.template = template
        print(f"Initialized BestOfNJailbreaker with N={n_samples} for model: {model_name}")

    def generate_prompt(self, goal):
        """
        Formats the user's goal into the full prompt using the template.

        Args:
            goal (str): The user's malicious goal.

        Returns:
            str: The fully formatted prompt.
        """
        return self.template.format(GOAL=goal)

    def jailbreak(self, goal):
        """
        Executes the main Best-of-N jailbreaking logic.

        Args:
            goal (str): The user's malicious goal.

        Returns:
            tuple: A tuple containing the best response found and its score.
        """
        full_prompt = self.generate_prompt(goal)
        best_response = ""
        highest_score = -1

        print(f"--- Starting Jailbreak for Goal: '{goal}' ---")
        print(f"Generating {self.n_samples} samples...")

        # 1. Generate N responses from the target model
        responses = self.target_model.get_responses(
            messages=[{'role': 'user', 'content': full_prompt}],
            system_prompt=self.system_prompt,
            n=self.n_samples,
            temperature=1.0,  # Higher temperature for more diversity
            max_tokens=512
        )

        print(f"Generated {len(responses)} responses. Now evaluating...")

        # 2. Evaluate each response
        for i, response_text in enumerate(responses):
            print(f"--- Evaluating response {i+1}/{len(responses)} ---")

            # Initial check for obvious refusals
            if evaluators.is_refusal(response_text):
                score = 0
                print("Response is an obvious refusal. Score: 0")
            else:
                # Use the evaluator model (LLM-as-a-Judge) for a more nuanced score
                score = evaluators.get_evaluator_score(goal, response_text, self.evaluator_model)
                print(f"Evaluator Score: {score}")

            if score > highest_score:
                highest_score = score
                best_response = response_text
                print(f"New best response found with score {score}.")

            # To avoid rate limiting issues
            time.sleep(1)

        print("--- Jailbreak Attempt Finished ---")
        print(f"Best score: {highest_score}")
        print(f"Best response:\n{best_response}")

        return best_response, highest_score
