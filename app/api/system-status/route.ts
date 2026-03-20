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
    return NextResponse.json({ loadedModels: [], error: 'Failed to connect to LM Studio' });
  }
}
