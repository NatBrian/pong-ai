import {z} from 'zod';

// Schemas for Game Parameters based on the new data-driven approach

const BallShapeSchema = z.object({
  form: z.string().default('circle').describe("The geometric shape of the ball. Be creative! Examples: 'circle', 'square', 'star', 'triangle', 'hexagon'."),
});

const BallKineticsSchema = z.object({
  velocity_magnitude: z.number().min(3).max(15).default(5).describe("The base speed of the ball."),
});

const BallVisualsSchema = z.object({
  fill_color: z.string().default('#FFFFFF').describe("A hex color code for the ball's fill."),
  opacity: z.number().min(0.1).max(1.0).default(1.0).describe("Transparency of the ball."),
});

const BallPhysicsSchema = z.object({
  elasticity: z.number().min(0.5).max(1.5).default(1).describe("Bounciness. >1.0 gains speed on impact, <1.0 loses speed. Can be modified by paddle.physics.bounciness_modifier."),
  gravity_vector: z.object({
    x: z.number().min(-0.2).max(0.2).default(0),
    y: z.number().min(-0.2).max(0.2).default(0),
  }).default({x: 0, y: 0}).describe("A constant force pulling the ball (e.g., {x: 0, y: 0.1}), causing its path to curve."),
  trajectory_spin: z.number().min(-0.05).max(0.05).default(0).describe("Force that causes the ball's path to curve (like topspin). Can be set by paddle.physics.spin_generation."),
  rebound_randomness: z.number().min(0).max(1).default(0).describe("A factor from 0.0 (perfect physics) to 1.0 (highly unpredictable bounce angles off paddles)."),
  state: z.enum(["normal", "phasing", "multi_ball", "payload"]).default("normal").describe("Special gameplay mode for the ball."),
});

const BallEffectsSchema = z.object({
    particle_trail: z.object({
        enabled: z.boolean().default(false).describe("Emits particles as the ball moves."),
    }).default({enabled: false}),
});

const BallParamsSchema = z.object({
  shape: BallShapeSchema.default({form: 'circle'}),
  kinetics: BallKineticsSchema.default({velocity_magnitude: 5}),
  visuals: BallVisualsSchema.default({fill_color: '#FFFFFF', opacity: 1.0}),
  physics: BallPhysicsSchema.default({
    elasticity: 1,
    gravity_vector: { x: 0, y: 0 },
    trajectory_spin: 0,
    rebound_randomness: 0,
    state: 'normal',
  }),
  effects: BallEffectsSchema.default({particle_trail: {enabled: false}}),
});

const PaddleShapeSchema = z.object({
  height: z.number().min(20).max(200).default(100).describe("The vertical length of the paddle."),
  width: z.number().min(5).max(30).default(10).describe("The horizontal thickness of the paddle."),
});

const PaddleKineticsSchema = z.object({
  movement_speed: z.number().min(3).max(15).default(8).describe("The maximum speed the paddle can travel vertically."),
});

const PaddleVisualsSchema = z.object({
  fill_color: z.string().default('#FFFFFF').describe("A hex color code for the paddle's fill."),
  opacity: z.number().min(0.1).max(1.0).default(1.0).describe("Transparency of the paddle."),
});

const PaddlePhysicsSchema = z.object({
    bounciness_modifier: z.number().min(0.8).max(1.2).default(1.0).describe("Multiplies the ball's elasticity on impact. >1.0 for more bounce, <1.0 for less."),
    spin_generation: z.number().min(-0.02).max(0.02).default(0).describe("Imparts spin to the ball on collision, affecting its curve."),
});

const PaddleParamsSchema = z.object({
  shape: PaddleShapeSchema.default({height: 100, width: 10}),
  kinetics: PaddleKineticsSchema.default({movement_speed: 8}),
  visuals: PaddleVisualsSchema.default({fill_color: '#FFFFFF', opacity: 1.0}),
  physics: PaddlePhysicsSchema.default({bounciness_modifier: 1.0, spin_generation: 0}),
});

export const GameStateSchema = z.object({
  ball: BallParamsSchema,
  playerPaddle: PaddleParamsSchema,
  opponentPaddle: PaddleParamsSchema,
});
export type GameState = z.infer<typeof GameStateSchema>;

export const ModifyGameOutputSchema = z.object({
  description: z.string().describe("A concise, user-friendly description of the single most significant change made to the game rules."),
  gameState: GameStateSchema.describe("The complete, updated JSON object representing the new state of the game."),
});
export type ModifyGameOutput = z.infer<typeof ModifyGameOutputSchema>;
