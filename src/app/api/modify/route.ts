
import { NextRequest, NextResponse } from 'next/server';
import { modifyGame } from '@/ai/flows/modify-game-flow';
import type { GameState } from '@/ai/game-schema';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: GameState = await request.json();

    if (!body.ball || !body.playerPaddle || !body.opponentPaddle) {
      return NextResponse.json({ error: 'Invalid game state provided' }, { status: 400 });
    }
    
    const result = await modifyGame(body);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in /api/modify:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
