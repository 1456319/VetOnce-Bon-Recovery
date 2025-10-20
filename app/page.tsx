"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [n, setN] = useState(10);
  const [changeCase, setChangeCase] = useState(true);
  const [shuffleLetters, setShuffleLetters] = useState(true);
  const [replaceLetters, setReplaceLetters] = useState(true);
  const [output, setOutput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    setOutput("");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, n, transforms: { changeCase, shuffleLetters, replaceLetters } }),
    });
    if (res.ok) {
      const json = await res.json();
      setOutput(json?.best ?? "No output generated.");
    } else {
      setOutput("Error: Could not generate variants.");
    }
    setIsLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Best-of-N Prompt Transformer</h1>
        <p className="text-slate-600">Generate and score local text variations</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">User Prompt</Label>
          <Input id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter a prompt to transform..." />
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="n" className="whitespace-nowrap">Variants (N)</Label>
          <Input id="n" type="number" min={1} max={50} value={n} onChange={(e) => setN(Number(e.target.value))} className="w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="change-case">Change Case</Label>
            <Switch id="change-case" checked={changeCase} onCheckedChange={setChangeCase} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="shuffle-letters">Shuffle Letters</Label>
            <Switch id="shuffle-letters" checked={shuffleLetters} onCheckedChange={setShuffleLetters} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="replace-letters">Replace Letters</Label>
            <Switch id="replace-letters" checked={replaceLetters} onCheckedChange={setReplaceLetters} />
          </div>
        </div>
      </div>
      <Button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full">
        {isLoading ? 'Generating...' : 'Generate'}
      </Button>
      <div className="space-y-2">
        <Label>Best Scored Output</Label>
        <div className="min-h-[100px] w-full rounded-md border bg-slate-50 p-3 text-sm whitespace-pre-wrap">
          {output || "Output will appear here..."}
        </div>
      </div>
    </main>
  );
}
