import PongGame from '@/components/pong-game';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4 sm:p-8">
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary-foreground tracking-wider">
          Pong <span className="text-accent" style={{ textShadow: '0 0 10px hsl(var(--accent))' }}>Alchemist</span>
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          A classic arcade game reimagined. After every point, an AI alchemist alters the laws of physics.
        </p>
      </div>
      <PongGame />
    </main>
  );
}
