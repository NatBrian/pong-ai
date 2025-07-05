# Pong Alchemist

Welcome to Pong Alchemist, a modern reimagining of the classic arcade game, built with a generative AI twist.

## Description

At its core, Pong Alchemist is a classic Pong game where a single player competes against an AI opponent. The goal is to score by making your opponent miss the ball.

The "alchemist" comes to life after every point scored by the player. A generative AI, powered by Google's Gemini model via Genkit, dynamically alters the game's rules. The ball might change shape, gravity might suddenly appear, or the paddles might shrink. Each level is a unique creation, making for an unpredictable and engaging experience.

## Core Features

- **Classic Pong Gameplay:** Simple, intuitive paddle controls (mouse or touch).
- **Dynamic AI Modifications:** After each point the player scores, a Genkit flow queries the Gemini Pro model to modify elements of the game, including the ball and paddles.
- **Real-time UI Updates:** The changes prescribed by the AI are displayed in a banner before the next round begins.
- **Modification History:** See a log of all the alchemical changes the AI has made throughout your game session.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **UI:** [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), and [ShadCN UI](https://ui.shadcn.com/)
- **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit) with Google's Gemini model.

## Getting Started

To run the project locally, install the dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
