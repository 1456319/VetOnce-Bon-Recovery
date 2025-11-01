"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface LlmConfigurationProps {
  onUrlChange: (url: string) => void;
}

export function LlmConfiguration({ onUrlChange }: LlmConfigurationProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const savedUrl = localStorage.getItem("llm-url");
    if (savedUrl) {
      setUrl(savedUrl);
      onUrlChange(savedUrl);
    }
  }, [onUrlChange]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    localStorage.setItem("llm-url", newUrl);
    onUrlChange(newUrl);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">LLM Configuration</h2>
      <div className="space-y-2">
        <Label htmlFor="llm-url">LLM Server URL</Label>
        <Input
          id="llm-url"
          type="url"
          placeholder="http://localhost:1234/v1"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
      </div>
      <div className="flex space-x-2">
        <Button onClick={() => handleUrlChange("http://localhost:1234/v1")}>
          LM Studio
        </Button>
        <Button onClick={() => handleUrlChange("http://localhost:11434/v1")}>
          Ollama
        </Button>
        <Button onClick={() => handleUrlChange("http://localhost:5001/v1")}>
          KoboldCPP
        </Button>
      </div>
    </div>
  );
}
