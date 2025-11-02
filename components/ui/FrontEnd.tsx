// components/ui/FrontEnd.tsx
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const FrontEnd = () => {
  // --- STATE MANAGEMENT ---
  const [prompt, setPrompt] = useState<string>('');
  const [changeCase, setChangeCase] = useState<boolean>(true);
  const [shuffleLetters, setShuffleLetters] = useState<boolean>(true);
  const [replaceLetters, setReplaceLetters] = useState<boolean>(true);
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // --- API INTERACTION ---

  /**
   * Handles the "Generate" button click. This function sends the user's
   * configuration to the backend API route, waits for the result,
   * and updates the UI.
   */
  async function handleGenerate() {
    setIsLoading(true);
    setOutput("");

    // Construct the payload with the correct `transforms` object structure
    // to match the existing API contract.
    const payload = {
      harmful_text: prompt,
      transforms: {
        changeCase: changeCase,
        shuffleLetters: shuffleLetters,
        replaceLetters: replaceLetters,
      }
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API responded with status: ${res.status}`);
      }

      const json = await res.json();
      setOutput(json?.best_prompt ?? "No output received from server.");
    } catch (error) {
      console.error("Failed to generate prompt:", error);
      setOutput("An error occurred. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <main className="flex-1 relative">
        <section className="container mx-auto mb-5 mt-20">
          <div className="flex items-center justify-center">
            <div className="w-2/3">
              <h1 className="text-3xl font-bold mb-4">Best-of-N Jailbreaking Prompt Generator</h1>
              <p className="text-justify">
                This application implements the Best-of-N Jailbreaking (BoN) method, which focuses on exploiting vulnerabilities in AI models. This version is inspired by the work of <a className="text-blue-300 underline" href="https://web.archive.org/web/20250220094727/https://jplhughes.github.io/bon-jailbreaking/" target="_blank" rel="noopener noreferrer">John Hughes and collaborators</a>.
              </p>
              <br />
              <p className="text-justify">
                See if you can jailbreak the AI by giving it a prompt it's not supposed to handle.
              </p>
            </div>
          </div>
        </section>
        <section className="container mx-auto min-h-[25vh] mb-5">
          <div className="flex items-center justify-center min-h-[20vh]">
            <div className="w-2/3">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Textarea
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-32"
                    placeholder="Insert your prompt here..."
                    cols={50}
                    name="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-row space-x-4">
                  <div className="flex flex-row items-start space-x-3 space-y-0">
                    <Checkbox
                      id="change-case"
                      checked={changeCase}
                      onCheckedChange={(checked) => setChangeCase(Boolean(checked))}
                      disabled={isLoading}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="change-case">Change case</Label>
                    </div>
                  </div>
                  <div className="flex flex-row items-start space-x-3 space-y-0">
                    <Checkbox
                      id="shuffle-letters"
                      checked={shuffleLetters}
                      onCheckedChange={(checked) => setShuffleLetters(Boolean(checked))}
                      disabled={isLoading}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="shuffle-letters">Shuffle letters</Label>
                    </div>
                  </div>
                  <div className="flex flex-row items-start space-x-3 space-y-0">
                    <Checkbox
                      id="replace-letters"
                      checked={replaceLetters}
                      onCheckedChange={(checked) => setReplaceLetters(Boolean(checked))}
                      disabled={isLoading}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="replace-letters">Replace letters</Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleGenerate} disabled={isLoading} className="font-bold">
                  {isLoading ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="container mx-auto mb-5 mt-14 flex-1">
          <div className="flex items-center justify-center">
            <div className="w-2/3">
              <div className="flex flex-col space-y-4">
                <Label>Output</Label>
                <div className="min-h-24 rounded-md border border-slate-300 p-3 text-sm">{output || "—"}</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-4 shadow-md backdrop-blur-xl mt-12">
        <hr />
        <div className="container mx-auto flex gap-6 items-center justify-center mt-4 font-medium text-white/75">
          {/* Footer content can be added here */}
        </div>
      </footer>
    </div>
  );
};

export default FrontEnd;
