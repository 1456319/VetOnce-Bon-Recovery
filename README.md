Best-of-N Jailbreaking: A TypeScript Verification and Analysis
This repository contains a 1:1 TypeScript translation of the original Python code from the research paper BEST-OF-N JAILBREAKING (arXiv:2412.03556v2) by John Hughes, Sara Price, Aengus Lynch, et al..


The original code can be found at: github.com/jplhughes/bon-jailbreaking

🔬 Academic Focus and Objectives
This project has two primary goals:


Verify Findings: To verify the findings and Attack Success Rates (ASRs) presented in the original paper  by creating a clean-room, 1:1 translation of the original implementation.

Analyze Implementation: To analyze a subtle bug we discovered in the original code's Random Number Generator (RNG) handling and explore its potential implications on the study's reproducibility.

🐛 Summary of Our Findings: The RNG Desynchronization Flaw
During our translation, we identified a flaw in the original Python implementation's process_text_augmentation function. This flaw causes a desynchronization between the two separate RNG streams used for augmentations, which breaks deterministic reproducibility when augmentation settings are changed, even if the same seed is used.

The core of the issue is that the state of one RNG stream is inadvertently dependent on the execution path of logic that uses a different RNG stream.

Technical Breakdown of the Flaw
Two Separate RNGs: The original code uses two different RNGs for its augmentation logic:

Python's random stream: Used for conditional augmentations like apply_word_scrambling and apply_random_capitalization.

The numpy.random stream: Used for unconditional logic, such as generating random prefix/suffix strings via get_attack_string.

The Desynchronization: The bug occurs because an unconditional call to numpy.random is placed in between two conditional calls to random.

The logic follows this sequence:

Check: if word_scrambling is True:

If True: Call apply_word_scrambling, which consumes numbers from the random stream.

If False: This call is skipped, and the random stream is not advanced.

Unconditional Call: get_attack_string is called, which always consumes numbers from the numpy.random stream.

Check: if random_capitalization is True:

This calls apply_random_capitalization, which consumes numbers from the random stream.

The Failure Case: The state of the random stream at Step 3 is now dependent on the conditional logic from Step 1.

Run 1 (Scrambling ON):

apply_word_scrambling consumes numbers from random.

get_attack_string consumes numbers from numpy.random.

apply_random_capitalization consumes numbers from the advanced random stream.

Run 2 (Scrambling OFF):

apply_word_scrambling is skipped.

get_attack_string consumes numbers from numpy.random.

apply_random_capitalization consumes numbers from the original random stream.

Result: The apply_random_capitalization function receives completely different random numbers—and thus produces a different output—based purely on whether the word_scrambling flag was enabled. The RNG streams are not properly isolated.

Project Goals and Next Steps
This TypeScript implementation serves as a precise 1:1 translation of the original Python code, reproducing the bug by default for verification purposes.

We will use this codebase to explore the implications of this finding:


Reproducibility Check: Does this bug materially affect the Attack Success Rates (ASR)  and other key metrics reported in the paper?

Impact Analysis: By running the simulation with a "fixed" version (where RNG streams are properly isolated) versus the "buggy" version, how do the results differ?

Our goal is to contribute to this research by providing a verified implementation and a clear analysis of how this subtle implementation detail may influence the conclusions of the original study.

## Overview

The "Best-of-N" method involves generating a large number of responses (N) to a given prompt and selecting the "best" one based on a scoring algorithm. This application automates this process using several local text transformation techniques:

* **Case Changing:** Randomly alters the casing of letters.
* **Letter Shuffling:** Swaps adjacent letters to introduce noise.
* **Leet Speak:** Replaces common letters with symbolic characters (e.g., `o` -> `0`, `s` -> `$`).

The tool scores each variant based on its difference from the original and other heuristics, presenting the highest-scoring variant as the result.

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
