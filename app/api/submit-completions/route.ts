import { NextRequest, NextResponse } from 'next/server';
import { engineInstances } from '../../../lib/shared-state.ts'; // Import from shared state
import { z } from 'zod';
import { getLocalAsr } from '../generate/route.ts'; // Assuming getLocalAsr is exported and available

const CompletionsSchema = z.object({
  results: z.array(z.object({
    completion: z.string(),
    stop_reason: z.string(),
  })),
});

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get('x-session-id');
  if (!sessionId) {
    // This should not happen if the client is implemented correctly
    return new Response(JSON.stringify({ error: 'Session ID is missing.' }), { status: 400 });
  }

  const engineRunner = engineInstances.get(sessionId);
  if (!engineRunner) {
    return new Response(JSON.stringify({ error: 'Engine instance not found for this session.' }), { status: 404 });
  }

  const body = await req.json();
  const validatedBody = CompletionsSchema.parse(body);

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (eventName: string, data: object) => {
        controller.enqueue(`event: ${eventName}\n`);
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        let nextCommand = engineRunner.next(validatedBody.results);

        while (!nextCommand.done) {
            const command = nextCommand.value;
            let serviceResult;

            switch (command.type) {
                case 'GET_ASRS_PARALLEL':
                    serviceResult = await Promise.all(
                        command.requests.map(req => getLocalAsr(req.completion, req.behavior))
                    );
                    nextCommand = engineRunner.next(serviceResult);
                    break;
                case 'GET_COMPLETIONS_PARALLEL':
                    sendEvent('GET_COMPLETIONS_PARALLEL', { ...command, sessionId });
                    // The client will handle this and call back, so we stop here.
                    return;
                default:
                    throw new Error(`Unhandled command: ${command.type}`);
            }
        }

        // Engine is done
        sendEvent('ENGINE_COMPLETE', nextCommand.value);
        engineInstances.delete(sessionId);
        controller.close();

      } catch (error: any) {
        console.error('Error in submit-completions:', error);
        sendEvent('ERROR', { message: error.message || 'An unknown error occurred.' });
        engineInstances.delete(sessionId);
        controller.close();
      }
    },
     cancel() {
        if (sessionId) {
            engineInstances.delete(sessionId);
        }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
