
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { GameState } from '@/ai/game-schema';
import { ModifyGameOutputSchema } from '@/ai/game-schema';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from '@/components/ui/scroll-area';
import { ZodError } from 'zod';


// Type definitions for our game state, matching the backend Zod schema
const initialGameState: GameState = {
  ball: {
    shape: { form: 'circle' },
    kinetics: { velocity_magnitude: 5 },
    visuals: { fill_color: '#FFFFFF', opacity: 1.0 },
    physics: {
      elasticity: 1,
      gravity_vector: { x: 0, y: 0 },
      trajectory_spin: 0,
      rebound_randomness: 0,
      state: 'normal',
    },
    effects: { particle_trail: { enabled: false } },
  },
  playerPaddle: {
    shape: { height: 100, width: 10 },
    kinetics: { movement_speed: 8 },
    visuals: { fill_color: '#00FFFF', opacity: 1.0 },
    physics: { bounciness_modifier: 1.0, spin_generation: 0 },
  },
  opponentPaddle: {
    shape: { height: 100, width: 10 },
    kinetics: { movement_speed: 4 },
    visuals: { fill_color: '#FF00FF', opacity: 1.0 },
    physics: { bounciness_modifier: 1.0, spin_generation: 0 },
  },
};

interface Particle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  vx: number;
  vy: number;
  color: string;
}

interface ModificationHistoryItem {
  description: string;
  gameState: GameState;
}

const randomParticleColor = () => {
    const colors = ['#FFD700', '#FF8C00', '#FF4500', '#DA70D6', '#8A2BE2', '#4B0082'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Shape drawing utility
function drawShape(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, shape: string) {
  ctx.beginPath();
  switch (shape) {
    case 'square':
      ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
      break;
    case 'star':
      let rot = Math.PI / 2 * 3;
      let step = Math.PI / 5;
      ctx.moveTo(x, y - radius);
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(x + Math.cos(rot) * radius, y + Math.sin(rot) * radius);
        rot += step;
        ctx.lineTo(x + Math.cos(rot) * (radius/2.5), y + Math.sin(rot) * (radius/2.5));
        rot += step;
      }
      ctx.closePath();
      break;
    case 'triangle':
        let a = (Math.PI * 2) / 3;
        ctx.moveTo(x + radius, y);
        for (let i = 1; i < 3; i++) {
            ctx.lineTo(x + radius * Math.cos(a * i), y + radius * Math.sin(a * i));
        }
        ctx.closePath();
        break;
    case 'circle':
    default:
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      break;
  }
  ctx.fill();
}


export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerY = useRef(0);
  const animationFrameId = useRef(0);
  const { toast } = useToast();

  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [level, setLevel] = useState(1);
  const [modificationMessage, setModificationMessage] = useState<string | null>(null);
  const [modificationHistory, setModificationHistory] = useState<ModificationHistoryItem[]>([]);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPausedForModification, setIsPausedForModification] = useState(false);
  const [isLoadingModification, setIsLoadingModification] = useState(false);

  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const handlePointScored = useCallback(async (winner: 'player' | 'opponent') => {
    const newScore = { ...score };
    newScore[winner] += 1;
    setScore(newScore);

    // Only trigger modification on player score
    if (winner === 'player') {
      setIsPausedForModification(true);
      setIsLoadingModification(true);
      
      const newLevel = level + 1;
      setLevel(newLevel);

      try {
        const response = await fetch('/api/modify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameState), // Send current state
        });
        
        const responseText = await response.text();

        if (!response.ok) {
          let errorDetails;
          try {
              const errorJson = JSON.parse(responseText);
              errorDetails = errorJson.details || errorJson.error || responseText;
          } catch (e) {
              errorDetails = responseText;
          }
          throw new Error(`API Error (Status ${response.status}): ${errorDetails}`);
        }
        
        const rawData = JSON.parse(responseText);
        // Parse with Zod to validate and apply defaults
        const validatedData = ModifyGameOutputSchema.parse(rawData);
        const { description, gameState: newGameState } = validatedData;

        setIsLoadingModification(false);
        setModificationMessage(description);
        setGameState(newGameState); // Set the new, validated state
        setModificationHistory(prev => [{ description, gameState: newGameState }, ...prev]);

        setTimeout(() => {
          setModificationMessage(null);
          setIsPausedForModification(false);
        }, 3500);
      } catch (error) {
        console.error("Game modification error:", error);
        
        let errorContent;
        if (error instanceof ZodError) {
          errorContent = {
            title: "AI Error: Invalid response format",
            details: error.issues,
          };
        } else {
            errorContent = {
                title: "Technical Error: Game Modification Failed",
                details: error,
            }
        }
        
        toast({
            variant: "destructive",
            title: errorContent.title,
            description: (
                <pre className="mt-2 w-full max-w-sm overflow-x-auto rounded-md bg-slate-950 p-4">
                  <code className="text-white whitespace-pre-wrap">{JSON.stringify(errorContent.details, null, 2)}</code>
                </pre>
            ),
        });
        setIsLoadingModification(false);
        setTimeout(() => setIsPausedForModification(false), 2000);
      }
    }
  }, [score, level, gameState, toast]);

  const startGame = () => {
    setIsGameActive(true);
    setScore({ player: 0, opponent: 0 });
    setLevel(1);
    setGameState(initialGameState); // Reset to default state
    setModificationHistory([]); // Clear history
  };

  useEffect(() => {
    if (!isGameActive) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const computedStyle = getComputedStyle(document.documentElement);
    const themeColors = {
        background: `hsl(${computedStyle.getPropertyValue('--background').trim()})`,
        border: `hsla(${computedStyle.getPropertyValue('--border').trim().replace(/ /g, ', ')}, 0.5)`,
        primary: `hsl(${computedStyle.getPropertyValue('--primary').trim()})`,
    };

    playerY.current = canvas.height / 2;
    let opponentY = canvas.height / 2;
    let ball = { x: canvas.width / 2, y: canvas.height / 2, vx: 0, vy: 0, radius: 10 };
    let particles: Particle[] = [];
    let ballSpin = gameState.ball.physics.trajectory_spin;

    const resetBall = () => {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      const angle = Math.random() * Math.PI / 2 - Math.PI / 4 + (Math.random() > 0.5 ? 0 : Math.PI);
      const speed = gameState.ball.kinetics.velocity_magnitude;
      ball.vx = Math.cos(angle) * speed;
      ball.vy = Math.sin(angle) * speed;
      ballSpin = gameState.ball.physics.trajectory_spin;
    };
    resetBall();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      playerY.current = e.clientY - rect.top;
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      playerY.current = e.touches[0].clientY - rect.top;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    const gameLoop = () => {
      // Game logic updates
      if (!isPausedForModification) {
        // Ball physics
        const physics = gameState.ball.physics;
        
        const isPhasing = physics.state === 'phasing';

        ball.vx += physics.gravity_vector.x;
        ball.vy += physics.gravity_vector.y;
        
        // Apply spin (Magnus effect)
        const spinEffect = ball.vx * ballSpin;
        ball.vy += spinEffect;

        ball.x += ball.vx;
        ball.y += ball.vy;

        // Opponent AI movement
        const opponentSpeed = gameState.opponentPaddle.kinetics.movement_speed;
        let opponentTargetY = ball.y;

        // Add predictive element to AI based on ball velocity
        if (ball.vx > 0) {
            const timeToReachPaddle = (canvas.width - ball.x) / ball.vx;
            opponentTargetY = ball.y + (ball.vy * timeToReachPaddle * 0.75); // 0.75 makes it not perfect
        }

        if (opponentY < opponentTargetY - opponentSpeed) opponentY += opponentSpeed;
        if (opponentY > opponentTargetY + opponentSpeed) opponentY -= opponentSpeed;


        // Wall collisions
        if ((ball.y + ball.radius > canvas.height && ball.vy > 0) || (ball.y - ball.radius < 0 && ball.vy < 0)) {
          ball.vy = -ball.vy;
          // Dampen spin on wall hit
          ballSpin *= 0.8;
        }

        // Paddle collisions
        if (!isPhasing) {
            const player = gameState.playerPaddle;
            const opp = gameState.opponentPaddle;
            
            // Player paddle
            if (ball.vx < 0 && ball.x - ball.radius < 20 + player.shape.width && ball.x - ball.radius > 20 &&
                ball.y > playerY.current - player.shape.height / 2 && ball.y < playerY.current + player.shape.height / 2) {
              ball.vx = -ball.vx * physics.elasticity * player.physics.bounciness_modifier;
              const reboundAngle = (ball.y - playerY.current) * 0.15;
              const randomFactor = (Math.random() - 0.5) * physics.rebound_randomness * Math.abs(ball.vy);
              ball.vy += reboundAngle + randomFactor;
              ballSpin += player.physics.spin_generation; // Add paddle-generated spin
            }

            // Opponent paddle
            if (ball.vx > 0 && ball.x + ball.radius > canvas.width - 20 - opp.shape.width && ball.x + ball.radius < canvas.width - 20 &&
                ball.y > opponentY - opp.shape.height / 2 && ball.y < opponentY + opp.shape.height / 2) {
              ball.vx = -ball.vx * physics.elasticity * opp.physics.bounciness_modifier;
              const reboundAngle = (ball.y - opponentY) * 0.15;
              const randomFactor = (Math.random() - 0.5) * physics.rebound_randomness * Math.abs(ball.vy);
              ball.vy += reboundAngle + randomFactor;
              ballSpin += opp.physics.spin_generation; // Add paddle-generated spin
            }
        }
        
        // Scoring
        if (ball.x + ball.radius < 0) {
          handlePointScored('opponent');
          resetBall();
        } else if (ball.x - ball.radius > canvas.width) {
          handlePointScored('player');
          resetBall();
        }

        // Particle trail
        if (gameState.ball.effects.particle_trail.enabled) {
          particles.push({ x: ball.x, y: ball.y, radius: Math.random() * 3 + 1, alpha: 1, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, color: randomParticleColor() });
        }
        particles.forEach((p, index) => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.03;
          if (p.alpha <= 0) particles.splice(index, 1);
        });
      }

      // --- Drawing ---
      ctx.fillStyle = themeColors.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = themeColors.border;
      for (let i = 0; i < canvas.height; i += 20) ctx.fillRect(canvas.width / 2 - 1, i, 2, 10);
      
      // Draw Paddles from gameState
      const pPaddle = gameState.playerPaddle;
      ctx.globalAlpha = pPaddle.visuals.opacity;
      ctx.fillStyle = pPaddle.visuals.fill_color;
      ctx.shadowColor = pPaddle.visuals.fill_color;
      ctx.shadowBlur = 10;
      ctx.fillRect(20, playerY.current - pPaddle.shape.height / 2, pPaddle.shape.width, pPaddle.shape.height);

      const oPaddle = gameState.opponentPaddle;
      ctx.globalAlpha = oPaddle.visuals.opacity;
      ctx.fillStyle = oPaddle.visuals.fill_color;
      ctx.shadowColor = oPaddle.visuals.fill_color;
      ctx.shadowBlur = 10;
      ctx.fillRect(canvas.width - 20 - oPaddle.shape.width, opponentY - oPaddle.shape.height / 2, oPaddle.shape.width, oPaddle.shape.height);
      
      // Draw Ball from gameState
      const b = gameState.ball;
      const isPhasing = b.physics.state === 'phasing';
      ctx.globalAlpha = isPhasing ? b.visuals.opacity * 0.3 : b.visuals.opacity;
      ctx.fillStyle = b.visuals.fill_color || themeColors.primary;
      ctx.shadowColor = b.visuals.fill_color || themeColors.primary;
      ctx.shadowBlur = 15;
      
      drawShape(ctx, ball.x, ball.y, ball.radius, b.shape.form);
      
      // Draw particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };
    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isGameActive, isPausedForModification, gameState, handlePointScored]);

  const Overlay = () => {
    if (isLoadingModification) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold">The Alchemist is Brewing a Change...</p>
        </div>
      );
    }
    if (modificationMessage) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20 p-4">
          <div className="text-center bg-accent/80 backdrop-blur-sm p-6 rounded-lg animate-in fade-in-0 zoom-in-95 duration-500">
            <p className="text-2xl font-bold text-accent-foreground">{modificationMessage}</p>
          </div>
        </div>
      );
    }
    if (!isGameActive) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
          <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
          <Button onClick={startGame} size="lg">Start Game</Button>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full max-w-4xl border-2 border-primary/50 shadow-lg shadow-primary/20 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-2 sm:p-4 pb-0">
        <div className="flex justify-between items-center mb-4 px-2 sm:px-4">
          <div className="text-left w-1/3">
            <p className="text-sm sm:text-lg font-semibold text-accent">Player</p>
            <p className="text-3xl sm:text-4xl font-bold">{score.player}</p>
          </div>
          <div className="text-center w-1/3">
            <p className="text-xs sm:text-sm text-muted-foreground">Level</p>
            <p className="text-xl sm:text-2xl font-bold text-primary">{level}</p>
          </div>
          <div className="text-right w-1/3">
            <p className="text-sm sm:text-lg font-semibold text-accent">Opponent</p>
            <p className="text-3xl sm:text-4xl font-bold">{score.opponent}</p>
          </div>
        </div>
        <div className="relative aspect-video">
          <Overlay />
          <canvas
            ref={canvasRef}
            width={854}
            height={480}
            className={cn("w-full h-full rounded-md", isGameActive ? "cursor-none" : "cursor-pointer")}
          />
        </div>
      </CardContent>
      {modificationHistory.length > 0 && (
        <div className="p-2 sm:p-4 border-t border-primary/20">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="history" className="border-b-0">
                    <AccordionTrigger>Gemini Modification Log</AccordionTrigger>
                    <AccordionContent>
                        <ScrollArea className="h-48 w-full rounded-md border p-4">
                            <ul className="space-y-4">
                                {modificationHistory.map((mod, index) => (
                                    <li key={index} className="text-sm text-muted-foreground italic border-b border-border/50 pb-4 last:border-b-0">
                                        <p className="mb-2">
                                            <span className="font-bold not-italic text-foreground">Lvl {modificationHistory.length - index + 1}:</span> "{mod.description}"
                                        </p>
                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value={`code-${index}`} className="border-b-0">
                                                <AccordionTrigger className="text-xs py-1 hover:no-underline justify-start gap-2 text-muted-foreground [&[data-state=open]>svg]:-rotate-90">
                                                    View Generated JSON
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <pre className="mt-2 w-full overflow-x-auto rounded-md bg-slate-950 p-2">
                                                        <code className="text-white whitespace-pre-wrap text-xs font-code">
                                                            {JSON.stringify(mod.gameState, null, 2)}
                                                        </code>
                                                    </pre>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
      )}
    </Card>
  );
}
