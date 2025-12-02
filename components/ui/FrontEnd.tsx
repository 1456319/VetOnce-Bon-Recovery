import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FrontEnd = () => {
  // --- STATE MANAGEMENT ---
  const [prompt, setPrompt] = useState<string>('');
  const [changeCase, setChangeCase] = useState<boolean>(true);
  const [shuffleLetters, setShuffleLetters] = useState<boolean>(true);
  const [replaceLetters, setReplaceLetters] = useState<boolean>(true);
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorLog, setErrorLog] = useState<string[]>([]);
  const [logStream, setLogStream] = useState<string[]>([]);
  const [isLogVisible, setIsLogVisible] = useState<boolean>(false);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [lmStudioUrl, setLmStudioUrl] = useState<string>('http://localhost:1234/v1/chat/completions');

  // --- API INTERACTION ---

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch('/api/models');
        if (!res.ok) {
          throw new Error(`API responded with status: ${res.status}`);
        }
        const data = await res.json();
        setModels(data);
        if (data.length > 0) {
          setSelectedModel(data[0].path);
        }
      } catch (error: any) {
        console.error("Failed to fetch models:", error);
        setErrorLog(prevLog => [...prevLog, error.message || "An unknown error occurred while fetching models."]);
      }
    }
    fetchModels();
  }, []);

  /**
   * Handles the "Generate" button click. This function sends the user's
   * configuration to the backend API route, waits for the result,
   * and updates the UI.
   */
  async function handleGenerate() {
    setIsLoading(true);
    setOutput("");
    setErrorLog([]);
    setLogStream([]);

    const payload = {
      harmful_text: prompt,
      model: selectedModel,
      transforms: {
        changeCase: changeCase,
        shuffleLetters: shuffleLetters,
        replaceLetters: replaceLetters,
      }
    };

    const sessionId = crypto.randomUUID();

    try {
      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.body) {
        throw new Error("Response body is null.");
      }

      await processStream(response.body, sessionId);

    } catch (error: any) {
      console.error("Error during generation:", error);
      setErrorLog(prev => [...prev, `Error: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  }

  async function processStream(stream: ReadableStream<Uint8Array>, sessionId: string) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const eventName = line.substring(7);
          const dataLine = lines.shift()?.substring(6);
          if (dataLine) {
            const data = JSON.parse(dataLine);
            await handleServerEvent(eventName, data, sessionId);
          }
        }
      }
    }
  }

  async function handleServerEvent(eventName: string, data: any, sessionId: string) {
      switch (eventName) {
        case 'GET_COMPLETIONS_PARALLEL':
          console.log('Received GET_COMPLETIONS_PARALLEL:', data);
          const completions = await Promise.all(
              data.requests.map(async (req: any) => {
                  try {
                      const res = await fetch(lmStudioUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                              model: selectedModel,
                              messages: req.prompt,
                          }),
                      });
                      if (!res.ok) throw new Error(`LM Studio responded with status: ${res.status}`);
                      const llmResponse = await res.json();
                      return { completion: llmResponse.choices[0].message.content, stop_reason: 'stop' };
                  } catch (error: any) {
                      setErrorLog(prev => [...prev, `LLM Request Failed: ${error.message}`]);
                      return { completion: `Error: ${error.message}`, stop_reason: 'error' };
                  }
              })
          );

          const submitResponse = await fetch('/api/submit-completions', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'x-session-id': sessionId,
              },
              body: JSON.stringify({ results: completions }),
          });

          if (!submitResponse.body) throw new Error("Submit completions response body is null.");
          await processStream(submitResponse.body, sessionId); // Process the new stream
          break;

        case 'LOG_MESSAGE':
          console.log('Log:', data.message);
          setLogStream(prev => [...prev, data.message]);
          break;

        case 'ANALYSIS_RESULT':
          console.log('Received ANALYSIS_RESULT:', data);
          setOutput(data.payload.best_prompt);
          break;

        case 'ENGINE_COMPLETE':
            console.log('Received ENGINE_COMPLETE:', data);
            setOutput(data.payload.best_prompt);
            break;

        case 'ERROR':
          console.error('Server Error:', data.message);
          setErrorLog(prev => [...prev, `Server Error: ${data.message}`]);
          break;
      }
  }

    try {
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
                      <Label htmlFor="model-select">Select Model</Label>
                      <Select onValueChange={setSelectedModel} value={selectedModel} disabled={isLoading}>
                        <SelectTrigger id="model-select">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map(model => (
                            <SelectItem key={model.path} value={model.path}>
                              {model.path}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lm-studio-url">LM Studio URL</Label>
                        <Input
                            id="lm-studio-url"
                            value={lmStudioUrl}
                            onChange={(e) => setLmStudioUrl(e.target.value)}
                            placeholder="http://localhost:1234/v1/chat/completions"
                            disabled={isLoading}
                        />
                    </div>
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
                <div className="flex justify-center space-x-4">
                    {/* Output Panel */}
                    <div className="w-1/3">
                        <Label>Output</Label>
                        <div data-testid="output-panel" className="min-h-24 rounded-md border border-slate-300 p-3 text-sm overflow-y-auto h-64">
                            {output || "—"}
                        </div>
                    </div>

                    {/* Log Stream Panel */}
                    <div className="w-1/3">
                        <Label>Log Stream</Label>
                        <div className="min-h-24 rounded-md border border-slate-300 p-3 text-sm bg-gray-900 text-green-400 font-mono overflow-y-auto h-64">
                            {logStream.map((log, index) => (
                                <div key={index}>{`> ${log}`}</div>
                            ))}
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
  
          {/* Error Log Panel */}
          <div className={`fixed top-0 right-0 h-full bg-gray-800 text-white p-4 transition-transform transform ${isLogVisible ? 'translateX(0)' : 'translate-x-full'} w-1/3`}>
            <button onClick={() => setIsLogVisible(false)} className="absolute top-2 right-2 text-white">X</button>
            <h2 className="text-lg font-bold mb-4">Error Log</h2>
            <div className="overflow-y-auto h-full">
              {errorLog.map((error, index) => (
                <div key={index} className="bg-gray-700 p-2 rounded mb-2">
                  {error}
                </div>
              ))}
            </div>
          </div>
  
          {/* Button to toggle error log */}
          {!isLogVisible && (
            <button onClick={() => setIsLogVisible(true)} className="fixed bottom-4 right-4 bg-red-600 text-white p-2 rounded-full">
              Show Error Log
            </button>
          )}
        </div>
      );
    } catch (error: any) {
      return (
        <div>
          <h1>An error occurred during rendering:</h1>
          <pre>{error.message}</pre>
        </div>
      );
    }
  };

export default FrontEnd;
