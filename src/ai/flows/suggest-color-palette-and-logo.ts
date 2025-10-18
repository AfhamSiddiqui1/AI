'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting color palettes and logo concepts for a startup.
 *
 * - suggestColorPaletteAndLogo - A function that orchestrates the color palette and logo suggestion process.
 * - SuggestColorPaletteAndLogoInput - The input type for the suggestColorPaletteAndLogo function.
 * - SuggestColorPaletteAndLogoOutput - The return type for the suggestColorPaletteAndLogo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestColorPaletteAndLogoInputSchema = z.object({
  startupIdea: z
    .string()
    .describe('A description of the startup idea.'),
});
export type SuggestColorPaletteAndLogoInput = z.infer<typeof SuggestColorPaletteAndLogoInputSchema>;

const SuggestColorPaletteAndLogoOutputSchema = z.object({
  colorPaletteSuggestions: z
    .array(z.string())
    .describe('An array of suggested color palettes in hex codes.'),
  logoConceptSuggestions: z
    .array(z.string())
    .describe('An array of suggested logo concepts.'),
});
export type SuggestColorPaletteAndLogoOutput = z.infer<typeof SuggestColorPaletteAndLogoOutputSchema>;

export async function suggestColorPaletteAndLogo(
  input: SuggestColorPaletteAndLogoInput
): Promise<SuggestColorPaletteAndLogoOutput> {
  return suggestColorPaletteAndLogoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestColorPaletteAndLogoPrompt',
  input: {schema: SuggestColorPaletteAndLogoInputSchema},
  output: {schema: SuggestColorPaletteAndLogoOutputSchema},
  prompt: `You are a creative design assistant for startups. Based on the
  startup idea, suggest appealing color palettes and logo concepts to quickly bootstrap design.

  Startup Idea: {{{startupIdea}}}

  Guidelines:
  *   Color palettes should be an array of hex codes.
  *   Logo concepts should be an array of text descriptions.
  *   Be concise but creative.

  Ensure that the output is valid JSON.

  {{outputFormatInstructions}}
  `,
});

const suggestColorPaletteAndLogoFlow = ai.defineFlow(
  {
    name: 'suggestColorPaletteAndLogoFlow',
    inputSchema: SuggestColorPaletteAndLogoInputSchema,
    outputSchema: SuggestColorPaletteAndLogoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
