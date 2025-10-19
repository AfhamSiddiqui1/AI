'use server';
/**
 * @fileOverview Generates a complete website design (content and theme) from a startup idea.
 *
 * - generateWebsiteFromIdea - A function that generates website content and design.
 * - GenerateWebsiteFromIdeaInput - The input type for the function.
 * - GenerateWebsiteFromIdeaOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWebsiteFromIdeaInputSchema = z.object({
  startupIdea: z.string().describe('A description of the startup idea.'),
});
export type GenerateWebsiteFromIdeaInput = z.infer<typeof GenerateWebsiteFromIdeaInputSchema>;


const LinkSchema = z.object({
    text: z.string().describe("The display text for the link."),
    href: z.string().describe("The URL for the link, typically starting with '#' for internal links."),
});

const CategorySchema = z.object({
    name: z.string().describe("The name of the feature or category."),
    description: z.string().describe("A brief (1-2 sentence) description of the category."),
    iconName: z.string().describe("A valid icon name from the lucide-react library (e.g., 'ShieldCheck', 'Zap', 'Users')."),
});

const ColorPaletteSchema = z.object({
    background: z.string().describe("HSL value for the main background color (e.g., '0 0% 100%')."),
    foreground: z.string().describe("HSL value for the main text color."),
    primary: z.string().describe("HSL value for primary UI elements like buttons."),
    primaryForeground: z.string().describe("HSL value for text on primary elements."),
    mutedForeground: z.string().describe("HSL value for secondary or muted text."),
    card: z.string().describe("HSL value for card backgrounds."),
    cardForeground: z.string().describe("HSL value for text on cards."),
    accent: z.string().describe("HSL value for accent colors."),
    accentForeground: z.string().describe("HSL value for text on accent colors."),
    border: z.string().describe("HSL value for borders."),
});

const GenerateWebsiteFromIdeaOutputSchema = z.object({
  website: z.object({
    startupName: z.string().describe('A creative and short name for the startup.'),
    navbar: z.object({
      links: z.array(LinkSchema).describe('An array of 3-4 navigation links (e.g., Features, Pricing, About).'),
      cta: LinkSchema.describe('A call-to-action button for the navbar (e.g., "Sign Up").'),
    }),
    hero: z.object({
      headline: z.string().describe('A powerful, concise headline for the hero section (max 10 words).'),
      description: z.string().describe('A compelling 1-2 sentence description of the startup\'s value proposition.'),
      cta: LinkSchema.describe('A primary call-to-action for the hero section (e.g., "Get Started").'),
      imageHint: z.string().describe('Two or three keywords describing a relevant hero image (e.g., "team working", "data analytics").'),
    }),
    categories: z.object({
      title: z.string().describe("A title for the categories section (e.g., 'Why Choose Us?', 'Key Features')."),
      items: z.array(CategorySchema).describe("An array of 3-4 category or feature items.")
    }),
    footer: z.object({
        copyright: z.string().describe("The copyright notice, including the startup name and current year."),
        links: z.array(LinkSchema).describe("An array of 3-5 footer links (e.g., Terms of Service, Privacy Policy, Contact).")
    })
  }),
  design: z.object({
      colorPalette: ColorPaletteSchema.describe("A modern and aesthetically pleasing color palette based on HSL values for a web app."),
      logoConcept: z.string().describe("A simple, one-sentence description of a logo concept."),
  })
});
export type GenerateWebsiteFromIdeaOutput = z.infer<typeof GenerateWebsiteFromIdeaOutputSchema>;

export async function generateWebsiteFromIdea(
  input: GenerateWebsiteFromIdeaInput
): Promise<GenerateWebsiteFromIdeaOutput> {
  return generateWebsiteFromIdeaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWebsiteFromIdeaPrompt',
  input: {schema: GenerateWebsiteFromIdeaInputSchema},
  output: {schema: GenerateWebsiteFromIdeaOutputSchema},
  prompt: `You are an expert UI/UX designer and branding specialist. Your task is to generate the content and a design system for a modern, professional startup website based on a given idea.

  **Startup Idea:**
  "{{{startupIdea}}}"

  **Instructions:**

  1.  **Startup Name:** Create a short, memorable, and creative name for the startup.
  2.  **Website Content:**
      *   **Navbar:** Generate 3-4 standard navigation links and a compelling call-to-action (CTA) button.
      *   **Hero Section:** Write a powerful headline (max 10 words), a concise and persuasive description (1-2 sentences), and a primary CTA. Also, provide a 2-3 word hint for a suitable background image.
      *   **Categories/Features Section:** Generate a title and 3-4 items. For each item, provide a name, a short description, and a relevant and valid icon name from the 'lucide-react' library.
      *   **Footer:** Create a standard copyright notice and 3-5 common footer links.
  3.  **Design System:**
      *   **Color Palette:** Generate a complete, modern, and cohesive color palette using HSL values. The palette should be suitable for a dark-themed web application. Provide values for background, foreground, primary, primary-foreground, muted-foreground, card, card-foreground, accent, accent-foreground, and border.
      *   **Logo Concept:** Describe a simple, modern logo concept in one sentence.

  Ensure the output is a valid JSON object matching the specified format. Do not include any markdown or extra text outside the JSON structure.`,
});

const generateWebsiteFromIdeaFlow = ai.defineFlow(
  {
    name: 'generateWebsiteFromIdeaFlow',
    inputSchema: GenerateWebsiteFromIdeaInputSchema,
    outputSchema: GenerateWebsiteFromIdeaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
