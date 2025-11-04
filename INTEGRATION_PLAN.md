# Bon-Engine and LM Studio Integration Plan

This document outlines the strategy for integrating the `bon-engine` with the LM Studio ecosystem. The primary integration point will be the `@lmstudio/sdk` TypeScript package.

## Part 1: Identified Integration Points

The core of the integration will involve replacing the `bon-engine`'s current external service calls (which are geared towards OpenAI) with calls to a local LM Studio server via the `@lmstudio/sdk`.

### 1. Server and Model Management

*   **Requirement**: The system needs to ensure an LM Studio server is running and the correct model is loaded before the `bon-engine` starts.
*   **Integration Point**: 
    *   **Server Startup**: The `@lmstudio/sdk` does not appear to handle starting the server. Therefore, the `lms` CLI will be used. The application's startup script will execute `lms server start`.
    *   **Model Loading**: The `LMStudioClient` class from `@lmstudio/sdk` will be used. Specifically, `client.llm.load("path/to/model")` will be called at the beginning of the process to load the target model for jailbreaking. For current testing, `Gemma-3-1b` is being used.

### 2. Prompting and Completions

*   **Requirement**: The `bon-engine` generates corrupted prompts (`CorruptedPromptMessage`) and needs to get a completion from an LLM, which it then receives as an `LlmResponseMessage`.
*   **Integration Point**: This maps directly to the `model.respond()` or `model.complete()` methods in the `@lmstudio/sdk`.
    *   The main loop in `app/api/generate/route.ts` will be modified. Instead of calling `get_completion` which uses the `openai` package, it will instantiate an `LMStudioClient`.
    *   When the `bon-engine` yields a `GET_COMPLETIONS_PARALLEL` request, the API adaptor will call `model.respond()` for each prompt.
    *   The response from the model will be passed back into the engine, fulfilling the `LlmResponseMessage` requirement.

### 3. Data Flow Summary

1.  **Startup**: Application runs `lms server start`.
2.  **Request**: A web request hits `/api/generate/route.ts`.
3.  **Initialization**: The route handler creates an `LMStudioClient` instance and uses it to load the primary LLM.
4.  **Engine Run**: The `bon-engine` is instantiated and its `run()` generator is executed.
5.  **Yield `GET_COMPLETIONS_PARALLEL`**: The engine yields a batch of prompts.
6.  **Fulfill with SDK**: The route handler iterates through the prompts, calling `model.respond()` for each.
7.  **Return to Engine**: The completions are sent back into the engine generator.
8.  **Yield `GET_ASRS_PARALLEL`**: The engine yields completions to be evaluated for success.
9.  **Fulfill with Local ASR**: The route handler calls a *new, local* ASR function (see Part 2).
10. **Return to Engine**: The ASR results are sent back into the engine.
11. **Final Result**: The engine returns the best prompt, which is sent back to the UI.

## Part 2: Unaccounted for Components

### 1. Attack Success Rate (ASR) Calculation

*   **Problem**: The current implementation of `get_asr` in `app/api/generate/route.ts` uses `openai.chat.completions.create` with `gpt-4o` to evaluate whether a jailbreak was successful. This is an external dependency that violates the goal of a fully local workflow.
*   **Proposed Solution**: A second, smaller, and specialized local model will be loaded via LM Studio to act as the judge. 
    1.  **Model Selection**: A small, fast model suitable for classification tasks will be chosen (e.g., a fine-tuned DistilBERT or a similar small model available on Hugging Face that can be run in LM Studio).
    2.  **New ASR Function**: A new function, `getLocalAsr(completion: string, behavior: string)`, will be created. 
    3.  **Implementation**: Inside this function, a *second* model will be loaded using the `@lmstudio/sdk` (`client.llm.load(...)`). This model will be prompted with a system message and the user/assistant content, similar to the original `get_asr` function, to elicit a "Yes" or "No" response. 
    4.  **Integration**: The main loop in `route.ts` will call `getLocalAsr` instead of `get_asr` when the engine yields a `GET_ASRS_PARALLEL` request.

## Part 3: Testing Strategy

*   **Current Status**: Tests are currently abandoned due to complexities encountered with mocking ES Modules in Vitest. This will be revisited later in the integration process.
*   **Future Unit Testing**: When testing resumes, a mocking strategy will be implemented for unit tests to ensure fast and isolated execution, independent of actual LM Studio server and model loading times.
*   **Integration Testing**: For integration tests, a small, dedicated model (like `Gemma-3-1b`) will be used to avoid long loading times and resource constraints, ensuring that the overall integration logic functions correctly with a real LM Studio server.

This approach keeps the entire workflow local and within the LM Studio ecosystem, fulfilling the project's requirements.