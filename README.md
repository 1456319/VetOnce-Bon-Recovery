# Best-of-N Typescript RNG Error proof

This repository contains a **Next.js** implementation of the "Best-of-N" adversarial prompt generation algorithm, ported from the original Python research by [JPLHughes](https://github.com/jplhughes/bon-jailbreaking).

The primary purpose of this project is to serve as an **academic proof of the RNG error** discovered during the translation of the algorithm from Python to TypeScript. It isolates and verifies the specific divergences in random number generation that affect the reproducibility of the original research results in a JavaScript environment.

For a detailed understanding of the original algorithm and its principles, please refer to the original whitepaper: [Best-of-N Jailbreaking (arXiv:2412.03556v2)](https://arxiv.org/html/2412.03556v2).

---

## **Project Goal**

The goal is to achieve a **1:1 bit-for-bit deterministic port** of the Best-of-N algorithm. This ensures that given the same seed and inputs, this TypeScript implementation produces the exact same sequence of candidate prompts and attack success rates (ASR) as the original Python code.

This project isolates and reproduces the specific behavior of Python's `random` and `numpy.random` libraries within a JavaScript environment to maintain scientific validity and allow for precise study of RNG-induced divergences.

---

## **Features**

- **Algorithmic Parity:** Implements `best_of_n` and `pair` (PrePAIR) attacks with verified deterministic RNG matching Python's output.
- **Frontend UI:** A clean, responsive interface to configure attacks, visualize progress, and manage sessions.
- **Local LLM Integration:** Designed to work offline with local models via **LM Studio** or **Ollama**.
- **Session Management:** Supports stopping, resuming, and managing multiple concurrent generation sessions.

---

## **Getting Started**

### **Prerequisites**

- **Node.js** (v18+) & **pnpm**
- **Python 3.10+** (for verification scripts)
- **LM Studio** or **Ollama** running locally.

### **Installation**

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/best-of-n-typescript-rng-error-proof.git
    cd best-of-n-typescript-rng-error-proof
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

3.  Set up Python environment (for verification/parity checks):
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate  # or .venv\Scripts\activate on Windows
    pip install -r requirements.txt
    ```

### **Running the Application**

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## **Verification & Testing**

To ensure the port is accurate, we verify against the original Python implementation.

1.  **Run Tests:**
    ```bash
    pnpm vitest
    ```

2.  **Run Master Trace:**
    This script compares the TypeScript execution trace against a "Golden Trace" from Python.
    ```bash
    pnpm run trace
    ```

---

## **Documentation**

- [**Algorithm Overview**](./docs/ALGORITHM.md)

---

## **Disclaimer**

This tool is for **educational and research purposes only**. It is intended to help researchers understand and mitigate vulnerabilities in Large Language Models. Do not use this tool for malicious activities.
