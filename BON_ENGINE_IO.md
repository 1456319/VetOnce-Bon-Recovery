# Bon Engine In-Out Documentation

This document outlines the communication protocol for the `BonEngine`, detailing the messages it expects to receive (input) and the messages it sends (output).

## Data Flow Overview

The system is composed of three main parts:

1.  **Web UI (`FrontEnd.tsx`):** The user-facing interface where the initial prompt and parameters are provided.
2.  **API Adaptor (`/api/generate/route.ts`):** A Next.js API route that acts as a middleman between the UI and the `BonEngine`.
3.  **Bon Engine (`bon-engine.ts`):** The core logic for the Best-of-N algorithm.

The data flow is as follows:

1.  The **Web UI** sends a `POST` request to the **API Adaptor** with the user's prompt and selected augmentations.
2.  The **API Adaptor** instantiates and runs the **Bon Engine**.
3.  The **Bon Engine** yields requests for external services (LLM completions and ASR calculations) to the **API Adaptor**.
4.  The **API Adaptor** fulfills these requests by calling the appropriate functions (`get_completion`, `get_asr`).
5.  The **API Adaptor** sends the results from the external services back into the **Bon Engine**.
6.  Steps 3-5 repeat until the **Bon Engine** has completed its work.
7.  The **Bon Engine** returns the final result to the **API Adaptor**.
8.  The **API Adaptor** sends the final result back to the **Web UI** as a JSON response.

## Inbound Messages (UI to Engine)

These are the messages that the `BonEngine` can receive. In this implementation, the API Adaptor is responsible for creating and sending these messages.

### `UserPromptMessage`

*   **Type:** `USER_PROMPT`
*   **Description:** Initiates a new Best-of-N generation process.
*   **Payload:**
    *   `harmful_text: string`: The user's initial prompt.
    *   `prefix: string | null`: A prefix to add to the prompt.
    *   `suffix: string | null`: A suffix to add to the prompt.
    *   `optim_harmful_text: boolean`: Whether to optimize the harmful text.
    *   `optim_prefix: boolean`: Whether to optimize the prefix.
    *   `optim_suffix: boolean`: Whether to optimize the suffix.
    *   `sigma: number`: The augmentation strength.
    *   `word_scrambling: boolean`: Whether to use word scrambling.
    *   `random_capitalization: boolean`: Whether to use random capitalization.
    *   `ascii_perturbation: boolean`: Whether to use ASCII perturbation.
    *   `random_prefix_length: number`: The length of the random prefix.
    *   `random_suffix_length: number`: The length of the random suffix.
    *   `n_steps: number`: The number of steps to run the algorithm.
    *   `num_concurrent_k: number`: The number of concurrent candidates to generate.
    *   `msj_num_shots: number`: The number of multi-shot jailbreaking shots.
    *   `msj_path: string`: The path to the multi-shot jailbreaking prompts.
    *   `msj_shuffle: boolean`: Whether to shuffle the multi-shot jailbreaking prompts.
    *   `optim_msj_user_content: boolean`: Whether to optimize the user content of the multi-shot jailbreaking prompts.
    *   `optim_msj_assistant_content: boolean`: Whether to optimize the assistant content of the multi-shot jailbreaking prompts.
    *   `asr_threshold: number`: The Attack Success Rate (ASR) threshold for early exit.
    *   `seed: number`: The random seed for reproducibility.

### `LlmResponseMessage`

*   **Type:** `LLM_RESPONSE`
*   **Description:** Provides the LLM's response to a corrupted prompt.
*   **Payload:**
    *   `response: string`: The LLM's response.

## Outbound Messages (Engine to UI)

These are the messages that the `BonEngine` can send. The API Adaptor is responsible for handling these messages.

### `CorruptedPromptMessage`

*   **Type:** `CORRUPTED_PROMPT`
*   **Description:** A generated/corrupted prompt that should be sent to the LLM.
*   **Payload:**
    *   `prompt: string`: The corrupted prompt.

### `AnalysisResultMessage`

*   **Type:** `ANALYSIS_RESULT`
*   **Description:** The final result of the Best-of-N analysis.
*   **Payload:**
    *   `best_prompt: string`: The best prompt found.
    *   `best_asr: number`: The best Attack Success Rate (ASR) achieved.
    *   `best_augmentation: object | null`: The augmentation that produced the best result.

### `EngineCompleteMessage`

*   **Type:** `ENGINE_COMPLETE`
*   **Description:** Indicates that the engine has finished its work.

### `ErrorMessage`

*   **Type:** `ERROR`
*   **Description:** An error message.
*   **Payload:**
    *   `message: string`: The error message.

## Yielded Requests (Engine to External Services)

The `BonEngine` yields these requests to the API Adaptor, which is responsible for fulfilling them.

### `ParallelCompletionRequest`

*   **Type:** `GET_COMPLETIONS_PARALLEL`
*   **Description:** A batch of prompts to be sent to the LLM for completion.
*   **Payload:**
    *   `requests: CompletionRequest[]`: An array of `CompletionRequest` objects.
        *   `type: 'GET_COMPLETION'`
        *   `prompt: string`: The prompt to be sent to the LLM.
        *   `msj_prefixes: [string, string][] | null`: The multi-shot jailbreaking prefixes.

### `ParallelAsrRequest`

*   **Type:** `GET_ASRS_PARALLEL`
*   **Description:** A batch of LLM responses to be analyzed for Attack Success Rate (ASR).
*   **Payload:**
    *   `requests: AsrRequest[]`: An array of `AsrRequest` objects.
        *   `type: 'GET_ASR'`
        *   `completion: string`: The LLM's response.
        *   `behavior: string`: The expected behavior.
