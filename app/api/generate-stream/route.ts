import { NextRequest } from 'next/server';
import { BonEngine } from '@/app/lib/bon-engine';
import { engineInstances } from '@/app/lib/shared-state';
import { z } from 'zod';

const ExperimentConfigSchema = z.object({
  harmful_text: z.string(),
  model: z.string(),
  transforms: z.object({
    changeCase: z.boolean(),
    shuffleLetters: z.boolean(),
    replaceLetters: z.boolean(),
  }),
  // Keeping other params for engine compatibility
  prefix: z.string().nullable().optional(),
  suffix: z.string().nullable().optional(),
  optim_harmful_text: z.boolean().optional(),
  optim_prefix: z.boolean().optional(),
  optim_suffix: z.boolean().optional(),
  sigma: z.number().optional(),
  word_scrambling: z.boolean().optional(),
  random_capitalization: z.boolean().optional(),
  ascii_perturbation: z.boolean().optional(),
  random_prefix_length: z.number().optional(),
  random_suffix_length: z.number().optional(),
  n_steps: z.number().optional(),
  num_concurrent_k: z.number().optional(),
  msj_num_shots: z.number().optional(),
  msj_path: z.string().optional(),
  msj_shuffle: z.boolean().optional(),
  optim_msj_user_content: z.boolean().optional(),
  optim_msj_assistant_content: z.boolean().optional(),
  asr_threshold: z.number().optional(),
});


export async function POST(req: NextRequest) {
  const sessionId = req.headers.get('x-session-id') || crypto.randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (eventName: string, data: object) => {
        controller.enqueue(`event: ${eventName}\n`);
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        const body = await req.json();
        const validatedBody = ExperimentConfigSchema.parse(body);

        const engineParams = {
          ...validatedBody,
          word_scrambling: validatedBody.transforms.shuffleLetters,
          random_capitalization: validatedBody.transforms.changeCase,
          ascii_perturbation: validatedBody.transforms.replaceLetters,
        };

        const logger = (message: string) => {
            sendEvent('LOG_MESSAGE', { message });
        };

        const engine = new BonEngine(engineParams, logger);
        const engineRunner = engine.run();
        engineInstances.set(sessionId, engineRunner);

        // Notify client of session start and total steps
        sendEvent('SESSION_START', { total_steps: engineParams.n_steps ?? 4 });

        const result = engineRunner.next();

        if (!result.done) {
          const command = result.value;
           if (command.type === 'GET_COMPLETIONS_PARALLEL') {
            sendEvent('GET_COMPLETIONS_PARALLEL', { ...command, sessionId });
          } else {
             // For now, we only handle GET_COMPLETIONS_PARALLEL at the start
            throw new Error(`Unexpected initial command from BonEngine: ${command.type}`);
          }
        } else {
            // The engine finished without yielding anything.
            sendEvent('ENGINE_COMPLETE', result.value);
            controller.close();
        }

      } catch (error) {
        let errorMessage = 'An unknown error occurred.';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error instanceof z.ZodError) {
          errorMessage = JSON.stringify(error.issues);
        }
        console.error('Error in generate-stream:', error);
        sendEvent('ERROR', { message: errorMessage });
        controller.close();
      }
    },
    cancel() {
        engineInstances.delete(sessionId);
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
