import { LMStudioClient } from '@lmstudio/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const LoadModelSchema = z.object({
  model: z.string(),
  config: z.object({
    gpu: z.object({
        ratio: z.union([z.number(), z.literal('max'), z.literal('off')]).optional(),
        mainGpu: z.number().optional(),
        splitStrategy: z.union([z.literal('evenly'), z.literal('favorMainGpu')]).optional(),
    }).optional(),
    contextLength: z.number().optional(),
    evalBatchSize: z.number().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, config } = LoadModelSchema.parse(body);

    const client = new LMStudioClient({ baseUrl: 'ws://localhost:1234' });

    // Enforce tryMmap: true
    const finalConfig = { ...config, tryMmap: true };

    console.log(`[manage-model] Loading model '${model}' with config:`, finalConfig);

    // TODO: Ideally we should check if the model is already loaded with the SAME config.
    // However, the SDK's `listLoaded` returns `LLMInstanceInfo` which might not have the full config details easily accessible
    // or comparable. For now, we will rely on the client to only call this when settings change or before generation.
    // But `client.llm.load` is smart enough to be a no-op if the model is already loaded with the same identifier/path?
    // Not necessarily with the same config. To be safe and "enforce" settings, we should probably force reload
    // or assume `load` handles it.
    // Actually, `client.llm.load` returns a handle. If we want to change config, we usually have to unload and reload.
    // But we don't have the identifier easily.
    // Let's just try to load. If it's already loaded, LM Studio (the app) usually handles it by returning the existing instance
    // unless we specify a new identifier.
    // BUT, if we want to *change* config (e.g. GPU offload), we *must* reload.

    // Strategy:
    // 1. Check if model is loaded.
    // 2. If loaded, we can't easily check its config via SDK (yet).
    // 3. To be safe, we can try to unload it first if we want to *enforce* new settings.
    // 4. Or, we just call load. If LM Studio sees it's already loaded, it might ignore config changes.
    //    Based on experience, to change GPU offload, you need to reload.

    // For now, let's list loaded models, and if our model is there, unload it to ensure new settings apply.
    const loadedModels = await client.llm.listLoaded();
    const existing = loadedModels.find(m => m.path === model || m.identifier === model);

    if (existing) {
        console.log(`[manage-model] Model '${model}' is already loaded. Unloading to apply new settings...`);
        await client.llm.unload(existing.identifier);
    }

    await client.llm.load(model, { config: finalConfig });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in manage-model:', error);
    return NextResponse.json({ error: error.message || 'Failed to load model' }, { status: 500 });
  }
}

export async function GET() {
    try {
        const client = new LMStudioClient({ baseUrl: 'ws://localhost:1234' });
        const loadedModels = await client.llm.listLoaded();

        // We can't get the *exact* config used to load (like gpu ratio number) easily from `listLoaded`
        // in standard SDK usage without `getLoadConfig` (which is protected/internal in some versions).
        // But we can return what we have.
        // Actually, `LLMInstanceInfo` might have some info.

        const models = loadedModels.map(m => ({
            identifier: m.identifier,
            path: m.path,
            // info: m // potentially circular or large
        }));

        return NextResponse.json(models);
    } catch (error: any) {
        console.error('Error fetching loaded models:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
