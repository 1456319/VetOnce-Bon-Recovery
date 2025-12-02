import { LMStudioClient } from '@lmstudio/sdk';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = new LMStudioClient({ baseUrl: 'ws://localhost:1234' });
    const loaded = await client.llm.listLoaded();

    // Convert SDK handles to simple objects
    const loadedModels = loaded.map((model: any) => ({
      identifier: model.identifier,
      path: model.path,
    }));

    return NextResponse.json(loadedModels);
  } catch (error) {
    console.error('Error fetching loaded models:', error);
    return NextResponse.json({ error: 'Failed to fetch loaded models' }, { status: 500 });
  }
}
