import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, ArrowRight, Laptop, Globe, Server, Activity, AlertCircle } from 'lucide-react';

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

  // --- NEW UX STATE ---
  const [totalSteps, setTotalSteps] = useState<number>(4);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [tokensPerSecond, setTokensPerSecond] = useState<string | null>(null);
  const [pipelineState, setPipelineState] = useState<'idle' | 'server_processing' | 'client_processing' | 'local_inference' | 'submitting'>('idle');
  const [bestAsr, setBestAsr] = useState<number | null>(null);

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

  // Connection Check Logic
  useEffect(() => {
    let isMounted = true;
    const checkConnection = async () => {
        setConnectionStatus('unknown');
        try {
            // Strip the path to get base URL for models endpoint
            const baseUrl = new URL(lmStudioUrl).origin;
            const res = await fetch(`${baseUrl}/v1/models`, { method: 'GET', signal: AbortSignal.timeout(2000) });
            if (isMounted) {
                if (res.ok) setConnectionStatus('connected');
                else setConnectionStatus('disconnected');
            }
        } catch (error) {
            if (isMounted) setConnectionStatus('disconnected');
        }
    };

    const timeoutId = setTimeout(checkConnection, 500); // Debounce
    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
    };
  }, [lmStudioUrl]);


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
    setCurrentStep(0);
    setTokensPerSecond(null);
    setPipelineState('server_processing');
    setBestAsr(null);

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
      setPipelineState('idle');
    } finally {
      setIsLoading(false);
      setPipelineState('idle');
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
        case 'INITIAL_CONFIG':
            console.log('Received INITIAL_CONFIG:', data);
            setTotalSteps(data.total_steps);
            break;

        case 'GET_COMPLETIONS_PARALLEL':
          console.log('Received GET_COMPLETIONS_PARALLEL:', data);
          setCurrentStep(prev => prev + 1);
          setPipelineState('client_processing');

          setPipelineState('local_inference');
          const completions = await Promise.all(
              data.requests.map(async (req: any) => {
                  const start = performance.now();
                  try {
                      // Request Timeout Logic
                      const controller = new AbortController();
                      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

                      const res = await fetch(lmStudioUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                              model: selectedModel,
                              messages: req.prompt,
                          }),
                          signal: controller.signal,
                      });
                      clearTimeout(timeoutId);

                      if (!res.ok) throw new Error(`LM Studio responded with status: ${res.status}`);
                      const llmResponse = await res.json();
                      const content = llmResponse.choices[0].message.content;

                      const end = performance.now();
                      const durationSec = (end - start) / 1000;
                      const approxTokens = content.length / 4;
                      const tps = durationSec > 0 ? (approxTokens / durationSec).toFixed(1) : "N/A";
                      setTokensPerSecond(tps);

                      return { completion: content, stop_reason: 'stop' };
                  } catch (error: any) {
                      setErrorLog(prev => [...prev, `LLM Request Failed: ${error.message}`]);
                      return { completion: `Error: ${error.message}`, stop_reason: 'error' };
                  }
              })
          );

          setPipelineState('submitting');
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
          // Check if log message contains "New global best ASR found: X" to update badge
          if (data.message.includes("New global best ASR found:")) {
              const match = data.message.match(/New global best ASR found: ([\d.]+)/);
              if (match) {
                  setBestAsr(parseFloat(match[1]));
              }
          }
          break;

        case 'ANALYSIS_RESULT':
          console.log('Received ANALYSIS_RESULT:', data);
          setOutput(data.payload.best_prompt);
          setBestAsr(data.payload.best_asr);
          break;

        case 'ENGINE_COMPLETE':
            console.log('Received ENGINE_COMPLETE:', data);
            setOutput(data.payload.best_prompt);
            setPipelineState('idle');
            break;

        case 'ERROR':
          console.error('Server Error:', data.message);
          setErrorLog(prev => [...prev, `Server Error: ${data.message}`]);
          setPipelineState('idle');
          break;
      }
  }

    try {
      return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
          <main className="flex-1 relative pb-10">
            {/* --- STEERING WHEEL --- */}
            <section className="container mx-auto mt-8 mb-8">
                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-bold mb-4">Pipeline Status</h2>
                    <div className="flex items-center space-x-8 p-6 rounded-xl border bg-card shadow-sm">
                        {/* SERVER */}
                        <div className={`flex flex-col items-center transition-colors duration-300 ${['server_processing', 'submitting'].includes(pipelineState) ? 'text-primary' : 'text-muted-foreground'}`}>
                            <Server className={`w-10 h-10 mb-2 ${pipelineState === 'server_processing' ? 'animate-pulse' : ''}`} />
                            <span className="text-xs font-semibold">Server (Engine)</span>
                        </div>

                        {/* Arrow Server -> Client */}
                        <ArrowRight className={`w-6 h-6 transition-colors duration-300 ${pipelineState === 'server_processing' ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />

                        {/* CLIENT */}
                        <div className={`flex flex-col items-center transition-colors duration-300 ${['client_processing', 'local_inference', 'submitting'].includes(pipelineState) ? 'text-primary' : 'text-muted-foreground'}`}>
                            <Globe className="w-10 h-10 mb-2" />
                            <span className="text-xs font-semibold">Client (Bridge)</span>
                        </div>

                        {/* Arrow Client -> LM Studio */}
                        <ArrowRight className={`w-6 h-6 transition-colors duration-300 ${pipelineState === 'local_inference' ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />

                        {/* LM STUDIO */}
                        <div className={`flex flex-col items-center transition-colors duration-300 ${pipelineState === 'local_inference' ? 'text-green-500' : 'text-muted-foreground'}`}>
                            <div className="relative">
                                <Laptop className={`w-10 h-10 mb-2 ${pipelineState === 'local_inference' ? 'animate-bounce' : ''}`} />
                                {pipelineState === 'local_inference' && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-semibold">LM Studio (GPU)</span>
                        </div>

                        {/* Arrow Client -> Server (Return) */}
                        <ArrowRight className={`w-6 h-6 rotate-180 transition-colors duration-300 ${pipelineState === 'submitting' ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />

                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                        {pipelineState === 'idle' && "Ready to generate"}
                        {pipelineState === 'server_processing' && "Engine is preparing commands..."}
                        {pipelineState === 'client_processing' && "Received commands, preparing requests..."}
                        {pipelineState === 'local_inference' && "Running inference on local GPU..."}
                        {pipelineState === 'submitting' && "Submitting results to engine..."}
                    </div>
                </div>
            </section>

            <section className="container mx-auto mb-5">
              <div className="flex items-center justify-center">
                <div className="w-2/3">
                    <h1 className="text-3xl font-bold mb-2">Best-of-N Prompt Jailbreaker</h1>
                    <p className="text-muted-foreground mb-4">
                        Exploit vulnerabilities in AI models using the Best-of-N method.
                        <a className="ml-1 text-primary hover:underline" href="https://web.archive.org/web/20250220094727/https://jplhughes.github.io/bon-jailbreaking/" target="_blank" rel="noopener noreferrer">Learn more</a>.
                    </p>
                </div>
              </div>
            </section>

            <section className="container mx-auto min-h-[25vh] mb-5">
              <div className="flex items-center justify-center">
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
                        <div className="relative">
                            <Input
                                id="lm-studio-url"
                                value={lmStudioUrl}
                                onChange={(e) => setLmStudioUrl(e.target.value)}
                                placeholder="http://localhost:1234/v1/chat/completions"
                                disabled={isLoading}
                                className="pr-10"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2" title={connectionStatus === 'connected' ? 'Connected to LM Studio' : connectionStatus === 'disconnected' ? 'Cannot connect to LM Studio' : 'Checking connection...'}>
                                {connectionStatus === 'connected' ? (
                                    <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]" />
                                ) : connectionStatus === 'disconnected' ? (
                                    <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]" />
                                ) : (
                                    <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />
                                )}
                            </div>
                        </div>
                        {connectionStatus === 'disconnected' && (
                            <p className="text-xs text-red-500 flex items-center mt-1">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                LM Studio appears to be offline. Please ensure it is running and the server is started.
                            </p>
                        )}
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
                      {/* Transforms Checkboxes */}
                      <div className="flex flex-row items-center space-x-2">
                        <Checkbox id="change-case" checked={changeCase} onCheckedChange={(c) => setChangeCase(Boolean(c))} disabled={isLoading} />
                        <Label htmlFor="change-case">Change case</Label>
                      </div>
                      <div className="flex flex-row items-center space-x-2">
                        <Checkbox id="shuffle-letters" checked={shuffleLetters} onCheckedChange={(c) => setShuffleLetters(Boolean(c))} disabled={isLoading} />
                        <Label htmlFor="shuffle-letters">Shuffle letters</Label>
                      </div>
                      <div className="flex flex-row items-center space-x-2">
                        <Checkbox id="replace-letters" checked={replaceLetters} onCheckedChange={(c) => setReplaceLetters(Boolean(c))} disabled={isLoading} />
                        <Label htmlFor="replace-letters">Replace letters</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6">
                     <div className="flex items-center space-x-4">
                        {/* Progress Bar */}
                        {isLoading && (
                            <div className="flex flex-col min-w-[200px]">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Step {currentStep} of {totalSteps}</span>
                                    <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-500 ease-in-out"
                                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                     </div>

                    <Button onClick={handleGenerate} disabled={isLoading || connectionStatus === 'disconnected'} className="font-bold min-w-[120px]">
                      {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                      ) : 'Generate'}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section className="container mx-auto mb-5 mt-8 flex-1">
                <div className="flex justify-center space-x-4">
                    {/* Output Panel */}
                    <div className="w-1/3">
                        <Label>Output</Label>
                        <div data-testid="output-panel" className="mt-2 min-h-24 rounded-md border border-slate-300 p-3 text-sm overflow-y-auto h-64 bg-card">
                            {output || <span className="text-muted-foreground italic">Result will appear here...</span>}
                        </div>
                        {bestAsr !== null && (
                            <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bestAsr > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                Current Best ASR: {bestAsr.toFixed(2)}
                            </div>
                        )}
                    </div>

                    {/* Log Stream Panel */}
                    <div className="w-1/3 relative">
                        <div className="flex justify-between items-center mb-2">
                             <Label>Log Stream</Label>
                             {tokensPerSecond && (
                                 <span className="text-xs font-mono text-green-600 bg-green-100 px-2 py-1 rounded">
                                     <Activity className="w-3 h-3 inline mr-1" />
                                     Speed: {tokensPerSecond} T/s
                                 </span>
                             )}
                        </div>
                        <div className="min-h-24 rounded-md border border-slate-300 p-3 text-sm bg-gray-950 text-green-400 font-mono overflow-y-auto h-64">
                            {logStream.map((log, index) => (
                                <div key={index} className="whitespace-pre-wrap break-words">{`> ${log}`}</div>
                            ))}
                            {logStream.length === 0 && <span className="text-gray-600 italic">Logs will appear here...</span>}
                        </div>
                    </div>
                </div>
            </section>
          </main>

          <footer className="py-4 border-t bg-muted/20 backdrop-blur-xl mt-auto">
            <div className="container mx-auto flex gap-6 items-center justify-center text-sm font-medium text-muted-foreground">
              <span>bestofn.vetonce.com</span>
              <span>2025</span>
            </div>
          </footer>
  
          {/* Error Log Panel */}
          <div className={`fixed top-0 right-0 h-full bg-gray-900 text-white p-4 transition-transform duration-300 transform ${isLogVisible ? 'translate-x-0' : 'translate-x-full'} w-1/3 shadow-xl z-50`}>
            <button onClick={() => setIsLogVisible(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">X</button>
            <h2 className="text-lg font-bold mb-4">Error Log</h2>
            <div className="overflow-y-auto h-[calc(100%-3rem)] space-y-2">
              {errorLog.map((error, index) => (
                <div key={index} className="bg-red-900/50 border border-red-700 p-2 rounded text-sm break-words">
                  {error}
                </div>
              ))}
              {errorLog.length === 0 && <p className="text-gray-500 italic">No errors logged.</p>}
            </div>
          </div>
  
          {/* Button to toggle error log */}
          {!isLogVisible && errorLog.length > 0 && (
            <button onClick={() => setIsLogVisible(true)} className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-700 transition-colors animate-bounce">
              Show Errors ({errorLog.length})
            </button>
          )}
        </div>
      );
    } catch (error: any) {
      return (
        <div className="p-10 text-red-600">
          <h1 className="text-2xl font-bold">Critical Error</h1>
          <pre className="mt-4 bg-gray-100 p-4 rounded">{error.message}</pre>
        </div>
      );
    }
  };

export default FrontEnd;
