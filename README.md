# Best-of-N Prompt Transformer (Archival Recreation)

This repository is a faithful reconstruction of the original "Best-of-N Prompt Jailbreaker" by VetOnce. This version has been intentionally modified to operate completely offline, focusing on local text transformation rather than interacting with external AI models.

## Overview

The "Best-of-N" method involves generating a large number of responses (N) to a given prompt and selecting the "best" one based on a scoring algorithm. This application automates this process using several local text transformation techniques:

* **Case Changing:** Randomly alters the casing of letters.
* **Letter Shuffling:** Swaps adjacent letters to introduce noise.
* **Leet Speak:** Replaces common letters with symbolic characters (e.g., `o` -> `0`, `s` -> `$`).

The tool scores each variant based on its difference from the original and other heuristics, presenting the highest-scoring variant as the result.

## Divergence from Original

This version is an **offline-first archival clone** and intentionally diverges from the original in one key way:
* **No OpenAI Integration:** All calls to the OpenAI API have been removed. The generation and scoring logic is performed entirely on the local machine. This ensures the tool is self-contained and does not require API keys to function.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/1456319/VetOnce-Bon-Recovery.git](https://github.com/1456319/VetOnce-Bon-Recovery.git)
    cd VetOnce-Bon-Recovery
    ```

2.  **Install dependencies:** This project uses `npm`. The `package-lock.json` is included for deterministic installs.
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

## Building for Production

To create a production-ready build, run:
```bash
npm run build
```