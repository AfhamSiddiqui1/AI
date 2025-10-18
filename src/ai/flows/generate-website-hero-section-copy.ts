'use server';
/**
 * @fileOverview Generates compelling hero section copy for a startup's website.
 *
 * - generateHeroSectionCopy - A function that generates the hero section copy.
 * - GenerateHeroSectionCopyInput - The input type for the generateHeroSectionCopy function.
 * - GenerateHeroSectionCopyOutput - The return type for the generateHeroSectionCopy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHeroSectionCopyInputSchema = z.object({
  startupIdea: z.string().describe('A description of the startup idea.'),
  startupName: z.string().describe('The name of the startup.'),
  targetAudience: z.string().describe('The target audience of the startup.'),
});
export type GenerateHeroSectionCopyInput = z.infer<typeof GenerateHeroSectionCopyInputSchema>;

const GenerateHeroSectionCopyOutputSchema = z.object({
  heroSectionCopy: z.string().describe('The generated hero section copy for the website.'),
});
export type GenerateHeroSectionCopyOutput = z.infer<typeof GenerateHeroSectionCopyOutputSchema>;

export async function generateHeroSectionCopy(
  input: GenerateHeroSectionCopyInput
): Promise<GenerateHeroSectionCopyOutput> {
  return generateHeroSectionCopyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHeroSectionCopyPrompt',
  input: {schema: GenerateHeroSectionCopyInputSchema},
  output: {schema: GenerateHeroSectionCopyOutputSchema},
  prompt: `You are a marketing expert specializing in creating compelling website hero section copy for startups.

  Based on the following information about the startup, generate engaging hero section copy that will capture the attention of the target audience and clearly communicate the startup's value proposition.

  Startup Name: {{{startupName}}}
  Startup Idea: {{{startupIdea}}}
  Target Audience: {{{targetAudience}}}

  Hero Section Copy:`,
});

const generateHeroSectionCopyFlow = ai.defineFlow(
  {
    name: 'generateHeroSectionCopyFlow',
    inputSchema: GenerateHeroSectionCopyInputSchema,
    outputSchema: GenerateHeroSectionCopyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
