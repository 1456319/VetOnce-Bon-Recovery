import { NextRequest, NextResponse } from 'next/server';
import { BonEngine, BonEngineYield } from '../../lib/bon-engine.ts'; // Import the new engine
import { z } from 'zod';
import { getLoadedModel, getLocalAsr } from '@/app/lib/asr-service.ts';


const ExperimentConfigSchema = z.object({
  harmful_text: z.string(),
  model: z.string(), // Added to accept the selected model from the frontend
  transforms: z.object({ // This is the nested object from the frontend
    changeCase: z.boolean(),
    shuffleLetters: z.boolean(),
    replaceLetters: z.boolean(),
  }),
  // The following are BonEngine specific parameters that might not be used by the current frontend.
  // They are kept for potential future use and compatibility with the engine.
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


/**
 * This is the new "API Adaptor". It receives an HTTP request, translates it
 * for the BonEngine, drives the engine to completion, and then formats the
 * engine's result back into an HTTP response.
 */
export async function POST(req: NextRequest) {
  try {
    const isTrace = req.headers.get('x-debug-trace') === 'true';
    const logger = isTrace ? (message: string) => console.log(`[TRACE] ${message}`) : undefined;
    logger?.('generate.POST: Trace mode enabled.');

    const body = await req.json();
    const validatedBody = ExperimentConfigSchema.parse(body);

    // Map frontend transforms to BonEngine parameters
    const engineParams = {
        ...validatedBody,
        word_scrambling: validatedBody.transforms.shuffleLetters,
        random_capitalization: validatedBody.transforms.changeCase,
        ascii_perturbation: validatedBody.transforms.replaceLetters,
    };

    const engine = new BonEngine(engineParams, logger);
    const engineRunner = engine.run();

    let nextCommand = engineRunner.next();
    let result: IteratorResult<BonEngineYield, any>;

    while (!(result = await nextCommand).done) {
        const command = result.value;
        let serviceResult;

        switch (command.type) {
            case 'GET_COMPLETIONS_PARALLEL':
                const model = await getLoadedModel(validatedBody.model, logger);
                serviceResult = await Promise.all(
                    command.requests.map(async (req) => {
                        const response = await model.respond(req.prompt);
                        return { completion: response.content, stop_reason: 'stop' };
                    })
                );
                break;
            case 'GET_ASRS_PARALLEL':
                serviceResult = await Promise.all(
                    command.requests.map(req => getLocalAsr(req.completion, req.behavior, logger))
                );
                break;
            default:
                const exhaustiveCheck: never = command;
                throw new Error(`Unhandled command: ${exhaustiveCheck}`);
        }
        nextCommand = engineRunner.next(serviceResult);
    }

    const finalPayload = result.value.payload;

    return NextResponse.json({
      best_prompt: finalPayload.best_prompt,
      best_asr: finalPayload.best_asr,
      best_augmentation: finalPayload.best_augmentation,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
