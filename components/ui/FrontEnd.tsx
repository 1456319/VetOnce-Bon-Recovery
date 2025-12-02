import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Server, Monitor, Cpu, Activity, CheckCircle2, AlertCircle, Play, Pause, Zap } from 'lucide-react';

// --- HELPERS ---

function deriveBaseUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        // Simple heuristic: go up two levels if it ends in chat/completions
        if (urlObj.pathname.endsWith('/chat/completions')) {
            return url.replace(/\/chat\/completions\/?$/, '/models');
        } else if (urlObj.pathname.endsWith('/completions')) {
            return url.replace(/\/completions\/?$/, '/models');
        } else {
            // Fallback or assume root
            return `${urlObj.origin}/v1/models`;
        }
    } catch (e) {
        return url; // Fallback
    }
}

async function fetchWithWatchdog(
    url: string,
    options: RequestInit,
    checkUrl: string,
    onSlow: () => void
): Promise<Response> {
    const controller = new AbortController();
    const { signal } = controller;

    // Create a new signal that aborts if either the user controller aborts OR the passed signal aborts
    // Note: If 'options.signal' is present, we should respect it.
    // Since AbortSignal.any() is relatively new (2024), we can implement a fallback or just assume modern environment.
    // Given the project uses Next.js and recent Node, it might be available.
    // However, to be safe and simple without polyfills:
    if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort(options.signal?.reason));
    }

    let isDone = false;
    const SOFT_TIMEOUT = 45000; // 45s soft timeout
    const CHECK_INTERVAL = 10000; // 10s check interval

    // Start the main fetch
    const fetchPromise = fetch(url, { ...options, signal });

    // Watchdog
    const watchdog = async () => {
        await new Promise(resolve => setTimeout(resolve, SOFT_TIMEOUT));

        while (!isDone) {
            onSlow(); // Notify UI that it's taking long
            console.log(`[Watchdog] Request to ${url} is slow. Checking health at ${checkUrl}...`);

            try {
                // Short timeout for the health check itself
                const healthController = new AbortController();
                const healthTimeout = setTimeout(() => healthController.abort(), 5000);

                const healthRes = await fetch(checkUrl, {
                    method: 'GET',
                    signal: healthController.signal
                });

                clearTimeout(healthTimeout);

                if (healthRes.ok) {
                    console.log("[Watchdog] Server is healthy. Continuing to wait...");
                } else {
                    console.warn(`[Watchdog] Health check returned status ${healthRes.status}. Aborting main request.`);
                    controller.abort();
                    return;
                }
            } catch (e: any) {
                console.warn(`[Watchdog] Health check failed: ${e.message}. Aborting main request.`);
                controller.abort();
                return;
            }

            // Wait before next check
            await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
        }
    };

    // Start watchdog without awaiting it
    watchdog();

    try {
        const response = await fetchPromise;
        isDone = true;
        return response;
    } catch (error) {
        isDone = true;
        throw error;
    }
}

// --- COMPONENTS ---

const StepProgress = ({ current, total, bestAsr }: { current: number; total: number; bestAsr: number | null }) => {
    const percentage = Math.min(100, (current / total) * 100);
    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between text-sm font-medium items-end">
                <span>Progress</span>
                <div className="flex flex-col items-end gap-1">
                    {bestAsr !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${bestAsr > 0.5 ? 'bg-green-500/20 text-green-500' : 'bg-slate-500/20 text-slate-400'}`}>
                            Best ASR: {(bestAsr * 100).toFixed(1)}%
                        </span>
                    )}
                    <span>Step {current} of {total} ({Math.round(percentage)}%)</span>
                </div>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const ConnectionStatus = ({ status, onCheck }: { status: 'unknown' | 'connected' | 'disconnected' | 'checking'; onCheck: () => void }) => {
    return (
        <div className="flex items-center space-x-2" title={status === 'connected' ? 'LM Studio Online' : 'LM Studio Offline'}>
             {status === 'checking' && <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />}
             {status === 'connected' && <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
             {status === 'disconnected' && <div className="h-3 w-3 rounded-full bg-red-500" />}
             {status === 'unknown' && <div className="h-3 w-3 rounded-full bg-gray-400" />}

             <span className="text-xs text-muted-foreground">
                {status === 'checking' && 'Checking...'}
                {status === 'connected' && 'Ready'}
                {status === 'disconnected' && 'Disconnected'}
                {status === 'unknown' && 'Unknown'}
             </span>
             {status === 'disconnected' && (
                 <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onCheck}>
                     <Activity className="h-3 w-3" />
                 </Button>
             )}
        </div>
    );
};

const SteeringWheel = ({ state }: { state: PipelineState }) => {
    // PipelineState: 'idle' | 'server-processing' | 'client-processing' | 'gpu-inference' | 'submitting-results'

    const getServerClass = () => {
        if (state === 'server-processing') return "text-primary animate-pulse scale-110";
        if (state === 'idle') return "text-muted-foreground";
        return "text-foreground";
    };

    const getClientClass = () => {
        if (state === 'client-processing' || state === 'submitting-results') return "text-primary animate-pulse scale-110";
         if (state === 'idle') return "text-muted-foreground";
        return "text-foreground";
    };

    const getGpuClass = () => {
        if (state === 'gpu-inference') return "text-green-500 animate-spin";
         if (state === 'idle') return "text-muted-foreground";
        return "text-foreground";
    };

    return (
        <div className="flex flex-row items-center justify-center space-x-6 p-4 bg-slate-900/50 rounded-lg border border-slate-800 mb-6 w-full max-w-2xl mx-auto">
            <div className={`flex flex-col items-center transition-all duration-300 ${getServerClass()}`}>
                <Server size={32} />
                <span className="text-xs mt-1 font-mono">Server</span>
            </div>

            <ArrowRight
                className={`transition-all duration-300 ${state === 'server-processing' || state === 'client-processing' ? 'text-primary' : 'text-slate-700'}`}
            />

            <div className={`flex flex-col items-center transition-all duration-300 ${getClientClass()}`}>
                <Monitor size={32} />
                <span className="text-xs mt-1 font-mono">Client</span>
            </div>

            <ArrowRight
                className={`transition-all duration-300 ${state === 'gpu-inference' ? 'text-green-500' : 'text-slate-700'}`}
            />

            <div className={`flex flex-col items-center transition-all duration-300 ${getGpuClass()}`}>
                <Cpu size={32} />
                <span className="text-xs mt-1 font-mono">LM Studio</span>
            </div>

            <div className="ml-4 pl-4 border-l border-slate-700">
                <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-1">Status</span>
                <span className="text-sm font-bold text-primary">
                    {state === 'idle' && 'IDLE'}
                    {state === 'server-processing' && 'SERVER THINKING'}
                    {state === 'client-processing' && 'CLIENT READY'}
                    {state === 'gpu-inference' && 'GPU WORKING'}
                    {state === 'submitting-results' && 'SUBMITTING'}
                </span>
            </div>
        </div>
    );
};

type PipelineState = 'idle' | 'server-processing' | 'client-processing' | 'gpu-inference' | 'submitting-results';

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

  // NEW STATE
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(4);
  const [currentBestAsr, setCurrentBestAsr] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected' | 'checking'>('unknown');
  const [pipelineState, setPipelineState] = useState<PipelineState>('idle');
  const [tps, setTps] = useState<string>('0.0');
  const [isServerBusy, setServerBusy] = useState<boolean>(false);

  // --- API INTERACTION ---

  // Connection Check
  const checkConnection = async (url: string) => {
      setConnectionStatus('checking');
      try {
          const baseUrl = deriveBaseUrl(url);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for check

          const res = await fetch(baseUrl, {
              method: 'GET',
              signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
              setConnectionStatus('connected');
          } else {
              setConnectionStatus('disconnected');
          }
      } catch (e) {
          setConnectionStatus('disconnected');
      }
  };

  useEffect(() => {
    checkConnection(lmStudioUrl);
  }, [lmStudioUrl]);

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
   * Handles the "Generate" button click.
   */
  async function handleGenerate() {
    setIsLoading(true);
    setPipelineState('server-processing');
    setOutput("");
    setErrorLog([]);
    setLogStream([]);
    setCurrentStep(0);
    // Reset TPS
    setTps('0.0');

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

    try {
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
    } catch (e: any) {
        setErrorLog(prev => [...prev, `Stream Error: ${e.message}`]);
        setPipelineState('idle');
    } finally {
        reader.releaseLock();
    }
  }

  async function handleServerEvent(eventName: string, data: any, sessionId: string) {
      switch (eventName) {
        case 'SESSION_START':
            console.log('Session Started:', data);
            if (data.total_steps) setTotalSteps(data.total_steps);
            break;

        case 'GET_COMPLETIONS_PARALLEL':
          console.log('Received GET_COMPLETIONS_PARALLEL:', data);
          setPipelineState('client-processing');
          setCurrentStep(prev => prev + 1); // Increment step
          if (typeof data.current_best_asr === 'number') {
              setCurrentBestAsr(data.current_best_asr);
          }

          const completions = await Promise.all(
              data.requests.map(async (req: any) => {
                  setPipelineState('gpu-inference');
                  const start = performance.now();
                  try {
                      const checkUrl = deriveBaseUrl(lmStudioUrl);

                      const res = await fetchWithWatchdog(
                          lmStudioUrl,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model: selectedModel,
                                messages: req.prompt,
                            }),
                          },
                          checkUrl,
                          () => setServerBusy(true)
                      );

                      if (!res.ok) throw new Error(`LM Studio responded with status: ${res.status}`);
                      const llmResponse = await res.json();
                      const content = llmResponse.choices[0].message.content;

                      const end = performance.now();
                      const durationSec = (end - start) / 1000;
                      // Approx tokens (chars / 4)
                      const estTokens = content.length / 4;
                      const currentTps = (estTokens / durationSec).toFixed(1);
                      setTps(currentTps);

                      return { completion: content, stop_reason: 'stop' };
                  } catch (error: any) {
                      setErrorLog(prev => [...prev, `LLM Request Failed: ${error.message}`]);
                      return { completion: `Error: ${error.message}`, stop_reason: 'error' };
                  }
              })
          );

          setServerBusy(false);
          setPipelineState('submitting-results');
          const submitResponse = await fetch('/api/submit-completions', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'x-session-id': sessionId,
              },
              body: JSON.stringify({ results: completions }),
          });

          if (!submitResponse.body) throw new Error("Submit completions response body is null.");
          setPipelineState('server-processing'); // Waiting for next stream chunk
          await processStream(submitResponse.body, sessionId); // Process the new stream
          break;

        case 'LOG_MESSAGE':
          console.log('Log:', data.message);
          setLogStream(prev => [...prev, data.message]);
          break;

        case 'ANALYSIS_RESULT':
          console.log('Received ANALYSIS_RESULT:', data);
          setOutput(data.payload.best_prompt);
          setPipelineState('idle');
          break;

        case 'ENGINE_COMPLETE':
            console.log('Received ENGINE_COMPLETE:', data);
            if (data.payload) {
                setOutput(data.payload.best_prompt);
            }
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
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 relative">
            <section className="container mx-auto mb-5 mt-10">
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl px-4">
                  <h1 className="text-3xl font-bold mb-4">Best-of-N Jailbreaking Prompt Generator</h1>

                  {/* Steering Wheel */}
                  <SteeringWheel state={pipelineState} />

                  {/* Progress Bar */}
                  {isLoading && (
                    <div className="mb-6">
                        <StepProgress current={currentStep} total={totalSteps} bestAsr={currentBestAsr} />
                    </div>
                  )}

                  <p className="text-justify text-muted-foreground mb-6">
                    This application implements the Best-of-N Jailbreaking (BoN) method.
                  </p>
                </div>
              </div>
            </section>

            <section className="container mx-auto min-h-[25vh] mb-5">
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl px-4">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <div className="flex justify-between items-center">
                                <Label htmlFor="lm-studio-url">LM Studio URL</Label>
                                <div className="flex items-center gap-2">
                                    {isServerBusy && <span className="text-xs font-bold text-yellow-500 animate-pulse">Large Generation...</span>}
                                    <ConnectionStatus status={connectionStatus} onCheck={() => checkConnection(lmStudioUrl)} />
                                </div>
                            </div>
                            <Input
                                id="lm-studio-url"
                                value={lmStudioUrl}
                                onChange={(e) => setLmStudioUrl(e.target.value)}
                                placeholder="http://localhost:1234/v1/chat/completions"
                                disabled={isLoading}
                            />
                        </div>
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

                    <div className="flex flex-col md:flex-row gap-4 md:space-x-6 justify-between items-center">
                        <div className="flex flex-row flex-wrap gap-4">
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

                        <Button onClick={handleGenerate} disabled={isLoading || connectionStatus !== 'connected'} className="font-bold min-w-[120px]">
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Activity className="animate-spin h-4 w-4" /> Generating
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Zap className="h-4 w-4" /> Generate
                                </span>
                            )}
                        </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="container mx-auto mb-5 mt-14 flex-1">
                <div className="flex flex-col md:flex-row justify-center gap-6 px-4 max-w-6xl mx-auto">
                    {/* Output Panel */}
                    <div className="w-full md:w-1/2">
                        <Label>Output</Label>
                        <div data-testid="output-panel" className="min-h-24 rounded-md border border-slate-300 p-3 text-sm overflow-y-auto h-64 bg-background">
                            {output || <span className="text-muted-foreground italic">Results will appear here...</span>}
                        </div>
                    </div>

                    {/* Log Stream Panel */}
                    <div className="w-full md:w-1/2">
                        <div className="flex justify-between items-center mb-1">
                            <Label>Log Stream</Label>
                            {isLoading && <span className="text-xs font-mono text-green-500">Speed: {tps} T/s</span>}
                        </div>
                        <div className="min-h-24 rounded-md border border-slate-300 p-3 text-sm bg-slate-950 text-green-400 font-mono overflow-y-auto h-64">
                            {logStream.map((log, index) => (
                                <div key={index}>{`> ${log}`}</div>
                            ))}
                            <div ref={(el) => { if (el) el.scrollIntoView({ behavior: 'smooth' }) }} />
                        </div>
                    </div>
                </div>
            </section>
          </main>

          <footer className="py-4 shadow-md backdrop-blur-xl mt-12 border-t border-slate-200">
            <div className="container mx-auto flex gap-6 items-center justify-center mt-4 font-medium text-muted-foreground">
              <span>bestofn.vetonce.com</span>
              <span>2025</span>
            </div>
          </footer>
  
          {/* Error Log Panel */}
          <div className={`fixed top-0 right-0 h-full bg-slate-900 text-white p-4 transition-transform transform ${isLogVisible ? 'translateX(0)' : 'translate-x-full'} w-full md:w-1/3 shadow-2xl z-50`}>
            <button onClick={() => setIsLogVisible(false)} className="absolute top-4 right-4 text-white hover:text-red-400">
                <ArrowRight className="rotate-180" />
            </button>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="text-red-500" /> Error Log
            </h2>
            <div className="overflow-y-auto h-full pb-10">
              {errorLog.length === 0 ? (
                  <p className="text-slate-500 italic">No errors logged.</p>
              ) : (
                errorLog.map((error, index) => (
                    <div key={index} className="bg-red-900/30 border border-red-900/50 p-2 rounded mb-2 text-sm font-mono">
                    {error}
                    </div>
                ))
              )}
            </div>
          </div>
  
          {/* Button to toggle error log */}
          {!isLogVisible && errorLog.length > 0 && (
            <button onClick={() => setIsLogVisible(true)} className="fixed bottom-4 right-4 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors">
              <AlertCircle size={24} />
            </button>
          )}
        </div>
      );
    } catch (error: any) {
      return (
        <div className="p-10 text-red-500">
          <h1 className="text-2xl font-bold">Critical Rendering Error</h1>
          <pre className="mt-4 bg-slate-100 p-4 rounded">{error.message}</pre>
        </div>
      );
    }
  };

export default FrontEnd;
