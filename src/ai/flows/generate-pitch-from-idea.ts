'use server';

/**
 * @fileOverview Generates a startup pitch based on a user's idea.
 *
 * - generatePitchFromIdea - A function that generates a startup pitch.
 * - GeneratePitchFromIdeaInput - The input type for the generatePitchFromIdea function.
 * - GeneratePitchFromIdeaOutput - The return type for the generatePitchFromIdea function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePitchFromIdeaInputSchema = z.object({
  startupIdea: z
    .string()
    .describe('A description of the startup idea.'),
});
export type GeneratePitchFromIdeaInput = z.infer<typeof GeneratePitchFromIdeaInputSchema>;

const GeneratePitchFromIdeaOutputSchema = z.object({
  startupName: z.string().describe('The generated startup name.'),
  tagline: z.string().describe('The generated tagline.'),
  elevatorPitch: z.string().describe('The generated elevator pitch.'),
  targetAudience: z.string().describe('The generated target audience description.'),
});
export type GeneratePitchFromIdeaOutput = z.infer<typeof GeneratePitchFromIdeaOutputSchema>;

export async function generatePitchFromIdea(
  input: GeneratePitchFromIdeaInput
): Promise<GeneratePitchFromIdeaOutput> {
  return generatePitchFromIdeaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePitchFromIdeaPrompt',
  input: {schema: GeneratePitchFromIdeaInputSchema},
  output: {schema: GeneratePitchFromIdeaOutputSchema},
  prompt: `You are a creative marketing expert specializing in startup pitches.

  Based on the startup idea, generate a compelling startup name, tagline, elevator pitch, and target audience description.

  Startup Idea: {{{startupIdea}}}

  Here's how you MUST format the output:
  {
    "startupName": "Generated Startup Name",
    "tagline": "Generated Tagline",
    "elevatorPitch": "Generated Elevator Pitch",
    "targetAudience": "Generated Target Audience Description"
  }`,
});

const generatePitchFromIdeaFlow = ai.defineFlow(
  {
    name: 'generatePitchFromIdeaFlow',
    inputSchema: GeneratePitchFromIdeaInputSchema,
    outputSchema: GeneratePitchFromIdeaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
