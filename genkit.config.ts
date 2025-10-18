import {googleAI} from '@genkit-ai/google-genai';
import {googleCloud} from '@genkit-ai/google-cloud';
import {genkit} from 'genkit';
import {config} from 'dotenv';
config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable not set');
}

export default {
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    googleCloud(),
  ],
  model: 'googleai/gemini-2.5-flash',
  enableTracing: true,
};
