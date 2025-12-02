import { LMStudioClient } from '@lmstudio/sdk';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = new LMStudioClient({ baseUrl: 'ws://localhost:1234' });
    const loadedModels = await client.llm.listLoaded();
    return NextResponse.json({ loadedModels });
  } catch (error) {
    console.error('Error fetching system status:', error);
    // If we can't connect, we assume we can't check, or we return an error.
    // Returning empty list might be dangerous if we want to enforce "no model loaded".
    // But if we can't connect, we can't load a model either (via SDK),
    // though the frontend uses HTTP for generation.
    // We will return the error so the frontend can decide.
    return NextResponse.json({ loadedModels: [], error: 'Failed to connect to LM Studio' });
  }
}
