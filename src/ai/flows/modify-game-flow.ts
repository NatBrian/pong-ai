
'use server';

/**
 * @fileOverview Modifies the game parameters of Pong after each level.
 *
 * - modifyGame - A function that modifies the game rules.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { GameState, GameStateSchema, ModifyGameOutput, ModifyGameOutputSchema } from '@/ai/game-schema';


export async function modifyGame(input: GameState): Promise<ModifyGameOutput> {
  return modifyGameFlow(input);
}

// A simple schema for the prompt's input, which just takes a string.
const PromptInputSchema = z.object({
  gameStateString: z.string().describe("The current game state as a JSON string."),
});

const modifyGamePrompt = ai.definePrompt({
  name: 'modifyGamePrompt',
  input: { schema: PromptInputSchema },
  output: { schema: ModifyGameOutputSchema },
  prompt: `You are the Pong Alchemist, a creative AI that modifies the rules of a Pong game after each level.
Your response MUST conform to the JSON schema provided to you.

Your task is to introduce creative and interesting modifications to the ball, the player's paddle, AND the opponent's paddle. You should aim to create a fun, and sometimes challenging, new experience for the player.

Here are the parameters you can modify. Be creative in how you combine them, and be creative with the values themselves!

\`\`\`yaml
ball:
  shape:
    form: (string) # e.g. 'circle', 'square', 'star', 'triangle'
  kinetics:
    velocity_magnitude: (number)
  visuals:
    fill_color: (hex string)
    opacity: (0.1 to 1.0)
  physics:
    elasticity: (number) # How bouncy is it?
    gravity_vector: {x, y} # A constant pull.
    trajectory_spin: (number) # Makes the ball curve.
    rebound_randomness: (0.0 to 1.0) # How predictable are bounces?
    state: ('normal', 'phasing', etc.)
  effects:
    particle_trail: {enabled: boolean}

playerPaddle & opponentPaddle:
  shape:
    height: (number)
    width: (number)
  kinetics:
    movement_speed: (number)
  visuals:
    fill_color: (hex string)
    opacity: (0.1 to 1.0)
  physics:
    bounciness_modifier: (number) # Affects ball's bounce.
    spin_generation: (number) # Adds spin to the ball on hit.
\`\`\`

CRITICAL INSTRUCTION: Your response MUST be a complete and valid JSON object. You must return the ENTIRE game state, including all original properties that you didn't change. The final output must contain all original top-level keys ('ball', 'playerPaddle', 'opponentPaddle') and all their original sub-properties, with your new changes applied.

Also, provide a short, creative \`description\` that summarizes the most interesting change you made, like a true alchemist announcing their creation.

Current Game State:
{{{gameStateString}}}

Now, provide the new, complete 'gameState' object and the 'description'.`,
});

const modifyGameFlow = ai.defineFlow(
  {
    name: 'modifyGameFlow',
    inputSchema: GameStateSchema,
    outputSchema: ModifyGameOutputSchema,
  },
  async (input) => {
    // Manually stringify the game state object and pass it to the prompt.
    const { output } = await modifyGamePrompt({
      gameStateString: JSON.stringify(input, null, 2),
    });
    return output!;
  }
);
