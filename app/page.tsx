"use client";
// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
import FrontEnd from "@/components/ui/FrontEnd";

export default function Page() {
  // const [systemPrompt, setSystemPrompt] = useState("");
  // const [userPrompt, setUserPrompt] = useState("");
  // const [n, setN] = useState(10);
  // const [changeCase, setChangeCase] = useState(true);
  // const [shuffleLetters, setShuffleLetters] = useState(true);
  // const [replaceLetters, setReplaceLetters] = useState(true);
  // const [output, setOutput] = useState<string>("");
  // const [isLoading, setIsLoading] = useState(false);

  // async function handleGenerate() {
  //   setIsLoading(true);
  //   setOutput("");
  //   const res = await fetch("/api/generate", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ systemPrompt, userPrompt, n, transforms: { changeCase, shuffleLetters, replaceLetters } }),
  //   });
  //   const json = await res.json();
  //   setOutput(json?.best ?? "No output");
  //   setIsLoading(false);
  // }

  try {
    return <FrontEnd />;
  } catch (error: any) {
    return (
      <div>
        <h1>An error occurred during rendering:</h1>
        <pre>{error.message}</pre>
      </div>
    );
  }

  /*
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Best-of-N Prompt Generator</h1>
      <div className="space-y-2">
        <Label htmlFor="system-prompt">System Prompt</Label>
        <Input id="system-prompt" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="Enter a prompt" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-prompt">User Prompt</Label>
        <Input id="user-prompt" value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder="Enter a prompt" />
      </div>
      <div className="flex items-center gap-4">
        <Label htmlFor="n">N</Label>
        <Input id="n" type="number" min={1} max={50} value={n} onChange={(e) => setN(Number(e.target.value))} className="w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="change-case">Change case</Label>
          <Switch id="change-case" checked={changeCase} onCheckedChange={setChangeCase} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="shuffle-letters">Shuffle letters</Label>
          <Switch id="shuffle-letters" checked={shuffleLetters} onCheckedChange={setShuffleLetters} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="replace-letters">Replace letters</Label>
          <Switch id="replace-letters" checked={replaceLetters} onCheckedChange={setReplaceLetters} />
        </div>
      </div>
      <Button onClick={handleGenerate} disabled={isLoading}>{isLoading ? 'Generating...' : 'Generate'}</Button>
      <div className="space-y-2">
        <Label>Output</Label>
        <div className="min-h-24 rounded-md border border-slate-300 bg-white p-3 text-sm">{output || "—"}</div>
      </div>
    </main>
  );
  */
}
