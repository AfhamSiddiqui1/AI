"use client";

import { useState, type FC, type FormEvent } from "react";
import {
  Brush,
  Download,
  Lightbulb,
  Megaphone,
  Newspaper,
  Palette,
  Rocket,
  Users,
} from "lucide-react";

import type {
  generatePitchFromIdea as generatePitch,
  GeneratePitchFromIdeaOutput,
} from "@/ai/flows/generate-pitch-from-idea";
import { generatePitchFromIdea } from "@/ai/flows/generate-pitch-from-idea";
import type {
  generateHeroSectionCopy as generateHero,
  GenerateWebsiteHeroSectionCopyOutput,
} from "@/ai/flows/generate-website-hero-section-copy";
import { generateHeroSectionCopy } from "@/ai/flows/generate-website-hero-section-copy";
import type {
  suggestColorPaletteAndLogo as suggestDesign,
  SuggestColorPaletteAndLogoOutput,
} from "@/ai/flows/suggest-color-palette-and-logo";
import { suggestColorPaletteAndLogo } from "@/ai/flows/suggest-color-palette-and-logo";
import { PitchAILogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type GenerationOutput = GeneratePitchFromIdeaOutput &
  GenerateWebsiteHeroSectionCopyOutput &
  SuggestColorPaletteAndLogoOutput;

const Header = () => (
  <header className="flex flex-col items-center gap-4 text-center">
    <PitchAILogo />
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-headline font-bold sm:text-4xl md:text-5xl">
        Welcome to PitchAI
      </h1>
      <p className="max-w-xl text-muted-foreground md:text-lg">
        Transform your raw idea into a polished startup pitch in seconds. Let's build the future, together.
      </p>
    </div>
  </header>
);

export default function Home() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationOutput | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) {
      toast({
        title: "Idea can't be empty",
        description: "Please share your brilliant startup idea with us.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const pitchData = await generatePitchFromIdea({ startupIdea: idea });

      const [heroCopyData, designData] = await Promise.all([
        generateHeroSectionCopy({
          startupIdea: idea,
          startupName: pitchData.startupName,
          targetAudience: pitchData.targetAudience,
        }),
        suggestColorPaletteAndLogo({ startupIdea: idea }),
      ]);

      setResult({ ...pitchData, ...heroCopyData, ...designData });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Generation Failed",
        description:
          "An unexpected error occurred. Please check the console and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const {
      startupName,
      tagline,
      elevatorPitch,
      targetAudience,
      heroSectionCopy,
      colorPaletteSuggestions,
      logoConceptSuggestions,
    } = result;

    const content = `
# Startup Pitch: ${startupName}

## Tagline
> ${tagline}

## Elevator Pitch
${elevatorPitch}

## Target Audience
${targetAudience}

---

# Website Hero Section Copy
${heroSectionCopy}

---

# Design Suggestions

## Color Palettes
${colorPaletteSuggestions.map((palette) => `- ${palette.join(", ")}`).join("\n")}

## Logo Concepts
${logoConceptSuggestions.map((concept) => `- ${concept}`).join("\n")}
    `;

    const blob = new Blob([content.trim()], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${startupName.toLowerCase().replace(/\s+/g, "-")}-pitch.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center gap-12 p-4 py-10 md:p-16">
      <Header />

      <Card className="w-full max-w-3xl shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Lightbulb />
              Your Startup Idea
            </CardTitle>
            <CardDescription>
              Describe your idea in a few sentences. The more detail, the better the pitch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., A mobile app that connects local gardeners with people who want fresh, organic produce."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={4}
              disabled={loading}
              className="resize-none"
            />
          </CardContent>
          <div className="flex justify-end p-6 pt-0">
            <Button type="submit" disabled={loading} size="lg">
              {loading ? "Generating..." : "Generate Pitch"}
            </Button>
          </div>
        </form>
      </Card>
      
      {loading && <LoadingState />}

      {result && (
        <ResultsDisplay result={result} onDownload={handleDownload} />
      )}
      
      <footer className="mt-auto text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PitchAI. All rights reserved.</p>
      </footer>
    </main>
  );
}

const LoadingState = () => (
  <div className="w-full max-w-3xl space-y-8">
    <div className="flex justify-center">
      <Skeleton className="h-10 w-40" />
    </div>
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="mb-2 h-5 w-28" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
            <div>
              <Skeleton className="mb-2 h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const ResultsDisplay: FC<{
  result: GenerationOutput;
  onDownload: () => void;
}> = ({ result, onDownload }) => (
  <div className="w-full max-w-5xl animate-in fade-in-50 duration-500 space-y-8">
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <h2 className="text-2xl font-headline font-bold text-center sm:text-3xl">
        Your Pitch is Ready!
      </h2>
      <Button onClick={onDownload} variant="outline">
        <Download className="mr-2" />
        Download Pitch
      </Button>
    </div>

    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Card className="h-full shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-xl">
              <Rocket className="text-primary" />
              {result.startupName}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 italic">
              <Megaphone className="h-4 w-4" />
              {result.tagline}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Elevator Pitch</h3>
              <p className="text-muted-foreground">{result.elevatorPitch}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Target Audience
              </h3>
              <p className="text-muted-foreground">{result.targetAudience}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-8 lg:col-span-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-lg">
              <Newspaper />
              Website Hero Copy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{result.heroSectionCopy}</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-lg">
              <Palette />
              Design Ideas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Color Palettes</h4>
              <div className="flex flex-wrap gap-2">
                {result.colorPaletteSuggestions.map((palette, i) => (
                  <div key={i} className="flex overflow-hidden rounded-md border">
                    {palette.map((color) => (
                      <div
                        key={color}
                        className="h-8 w-8"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Brush className="h-4 w-4" />
                Logo Concepts
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {result.logoConceptSuggestions.map((concept, i) => (
                  <li key={i}>{concept}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);
