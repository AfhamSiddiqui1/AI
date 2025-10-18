import { googleAI } from '@genkit-ai/google-genai';
import { genkit, type GenkitConfig } from 'genkit';
import { config } from 'dotenv';
config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable not set');
}

const genkitConfig: GenkitConfig = {
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
  enableTracing: true,
};

export const ai = genkit(genkitConfig);

export default genkitConfig;
