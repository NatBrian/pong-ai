# **App Name**: Pong Alchemist

## Core Features:

- Pong Game Core: A classic Pong game with a single player competing against an AI opponent. Each player will score whenever their opponent misses the ball. Mouse hover or touch screen controls for paddle movement.
- Level Scoring: The game ends whenever a player's score one goal, at which time the game modified difficulty. The score keeps updating.
- AI Game Modification: A Genkit flow `modifyGameFlow` queries the Gemini Pro model via the Google AI plugin, requesting that an element of the game's rules be altered after each won game. The LLM uses its tool to select one game rule or game element and chooses how it will change.
- Modification UI Display: The change prescribed by the Gemini-2.5-flash model is briefly displayed as a banner across the UI after a level has been won, but before the subsequent level begins.
- API Endpoint: The frontend makes POST requests against the /api/modify endpoint which triggers a Genkit flow to formulate new rules to be added.

## Style Guidelines:

- Primary color: Electric Indigo (#6F00FF), a vibrant and modern color to bring a high-tech video game feel to a classic game.
- Background color: Dark grayish-blue (#222831), provides a dark, modern backdrop, ensuring high contrast and readability.
- Accent color: Bright Cyan (#00FFFF), serves as a vivid highlight for interactive elements and key information.
- Headline and body font: 'Space Grotesk' (sans-serif) for both headlines and body, lends a techy, slightly futuristic style.
- Minimalist vector icons with a glowing effect to maintain a futuristic aesthetic.
- Clean, centered layout with ample spacing for a focus on gameplay and clear information hierarchy.
- Smooth transitions and subtle glow effects to highlight UI changes and game events.