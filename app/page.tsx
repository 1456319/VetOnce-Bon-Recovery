"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LlmConfiguration } from "@/components/llm-configuration";

export default function Page() {
  const [llmUrl, setLlmUrl] = useState("");
  const [harmfulText, setHarmfulText] = useState("");
  const [nSteps, setNSteps] = useState(4);
  const [wordScrambling, setWordScrambling] = useState(true);
  const [randomCapitalization, setRandomCapitalization] = useState(true);
  const [asciiPerturbation, setAsciiPerturbation] = useState(true);
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    if (!llmUrl) {
      alert("Please configure the LLM server URL.");
      return;
    }
    if (!harmfulText) {
      alert("Please enter a harmful prompt.");
      return;
    }
    setIsLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseURL: llmUrl,
          harmful_text: harmfulText,
          n_steps: nSteps,
          word_scrambling: wordScrambling,
          random_capitalization: randomCapitalization,
          ascii_perturbation: asciiPerturbation,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setOutput(JSON.stringify(json, null, 2));
      } else {
        setOutput(`Error: ${json.error}`);
      }
    } catch (error) {
      setOutput("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">BoN Jailbreaking</h1>
        <p className="text-gray-600">
          An open-source implementation of the Best-of-N jailbreaking technique.
        </p>
      </div>

      <LlmConfiguration onUrlChange={setLlmUrl} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Generation Settings</h2>
        <div className="space-y-2">
          <Label htmlFor="harmful-text">Harmful Prompt</Label>
          <Input
            id="harmful-text"
            value={harmfulText}
            onChange={(e) => setHarmfulText(e.target.value)}
            placeholder="Enter the prompt to augment"
          />
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="n-steps">N Steps</Label>
          <Input
            id="n-steps"
            type="number"
            min={1}
            max={50}
            value={nSteps}
            onChange={(e) => setNSteps(Number(e.targe.value))}
            className="w-24"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="word-scrambling">Word Scrambling</Label>
            <Switch
              id="word-scrambling"
              checked={wordScrambling}
              onCheckedChange={setWordScrambling}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="random-capitalization">Random Capitalization</Label>
            <Switch
              id="random-capitalization"
              checked={randomCapitalization}
              onCheckedChange={setRandomCapitalization}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ascii-perturbation">ASCII Perturbation</Label>
            <Switch
              id="ascii-perturbation"
              checked={asciiPerturbation}
              onCheckedChange={setAsciiPerturbation}
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isLoading || !llmUrl || !harmfulText}
        className="w-full"
      >
        {isLoading ? "Generating..." : "Run Augmentation"}
      </Button>

      <div className="space-y-2">
        <Label className="text-lg font-semibold">Output</Label>
        <pre className="min-h-48 rounded-md border bg-gray-50 p-4 text-sm whitespace-pre-wrap">
          {output || "Output will be displayed here."}
        </pre>
      </div>
    </main>
  );
}
