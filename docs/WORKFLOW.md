# Best-of-N (BoN) Jailbreaking Workflow

## Overview

This document outlines the workflow of the Best-of-N (BoN) Jailbreaking algorithm, a black-box method for circumventing the safety measures of large language models (LLMs). The algorithm works by repeatedly sampling variations of a prompt with a combination of augmentations until a harmful response is elicited.

## Text Augmentations

The BoN algorithm uses a variety of text augmentations to create variations of the input prompt. These augmentations are designed to be simple, yet effective at bypassing LLM safeguards. The following techniques are used:

*   **Word Scrambling**: The middle characters of words longer than three characters are randomly scrambled. This is based on the idea that humans can still read the words, but the LLM may process them differently.
*   **Random Capitalization**: The case of each letter in the prompt is randomly changed.
*   **ASCII Noising**: Characters in the prompt are randomly perturbed by adding or subtracting from their ASCII values.

## API Endpoint

The `app/api/generate/route.ts` endpoint provides an interface for running the BoN algorithm. It accepts a `POST` request with a JSON body containing the following parameters:

*   `harmful_text` (string, required): The harmful prompt that the user wants to jailbreak.
*   `prefix` (string, optional): A prefix to add to the prompt.
*   `suffix` (string, optional): A suffix to add to the prompt.
*   `optim_harmful_text` (boolean, optional): Whether to apply augmentations to the harmful text.
*   `optim_prefix` (boolean, optional): Whether to apply augmentations to the prefix.
*   `optim_suffix` (boolean, optional): Whether to apply augmentations to the suffix.
*   `sigma` (number, optional): The probability of applying an augmentation.
*   `word_scrambling` (boolean, optional): Whether to use word scrambling.
*   `random_capitalization` (boolean, optional): Whether to use random capitalization.
*   `ascii_perturbation` (boolean, optional): Whether to use ASCII noising.
*   `random_prefix_length` (number, optional): The length of a random prefix to add.
*   `random_suffix_length` (number, optional): The length of a random suffix to add.

The endpoint returns a JSON object containing the augmented prompt, the details of the augmentations used, and the (currently mocked) response from the language model.

## Mathematical Underpinnings

The effectiveness of the BoN algorithm is rooted in the high-dimensional nature of LLM input spaces and the stochastic nature of their outputs. By introducing a large number of small, seemingly innocuous perturbations to the input prompt, the algorithm explores a wide range of variations in the input space.

The whitepaper "Best-of-N Jailbreaking" suggests that the attack success rate (ASR) of the BoN algorithm follows a power-law-like behavior as a function of the number of samples (N). This means that the ASR increases predictably with the number of augmented prompts, allowing for a trade-off between computational cost and the likelihood of a successful jailbreak. The relationship can be modeled as:

`ASR(N) = 1 - exp(-a * N^b)`

Where `a` and `b` are parameters that depend on the model and the type of augmentations used. This power-law relationship implies that even for very robust models, a successful jailbreak can be achieved by increasing the number of samples.
