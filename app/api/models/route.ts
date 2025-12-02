import { LMStudioClient } from '@lmstudio/sdk';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = new LMStudioClient();
    const models = await client.system.listDownloadedModels();
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
