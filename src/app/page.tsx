'use client';

import { useState, type FC, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Brush,
  Download,
  Lightbulb,
  Megaphone,
  Newspaper,
  Palette,
  Rocket,
  Users,
  Save,
  Loader2,
  Book,
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import {
  useUser,
  useFirestore,
  setDocumentNonBlocking,
} from '@/firebase';

import type { GeneratePitchFromIdeaOutput } from '@/ai/flows/generate-pitch-from-idea';
import { generatePitchFromIdea } from '@/ai/flows/generate-pitch-from-idea';
import type { GenerateHeroSectionCopyOutput } from '@/ai/flows/generate-website-hero-section-copy';
import { generateHeroSectionCopy } from '@/ai/flows/generate-website-hero-section-copy';
import type { SuggestColorPaletteAndLogoOutput } from '@/ai/flows/suggest-color-palette-and-logo';
import { suggestColorPaletteAndLogo } from '@/ai/flows/suggest-color-palette-and-logo';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type {
  PitchIdea,
  GeneratedPitch,
  DesignSuggestion,
} from '@/lib/types';
import { Header } from '@/components/header';

type GenerationOutput = GeneratePitchFromIdeaOutput &
  GenerateHeroSectionCopyOutput &
  SuggestColorPaletteAndLogoOutput;

export default function Home() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<GenerationOutput | null>(null);
  const [pitchId, setPitchId] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) {
      toast({
        title: "Idea can't be empty",
        description: 'Please share your brilliant startup idea with us.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setPitchId(null);

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
      setPitchId(uuidv4()); // Generate a new ID for this pitch
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Generation Failed',
        description:
          'An unexpected error occurred. Please check the console and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user || !pitchId) {
      toast({
        title: 'Cannot Save Pitch',
        description: user ? 'No pitch data to save.' : 'You must be logged in to save a pitch.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    
    try {
      const pitchIdeaRef = doc(firestore, 'users', user.uid, 'pitchIdeas', pitchId);

      const pitchIdeaData: PitchIdea = {
        id: pitchId,
        userId: user.uid,
        ideaDescription: idea,
        createdAt: serverTimestamp(),
        generatedPitch: {
          id: uuidv4(),
          pitchIdeaId: pitchId,
          startupName: result.startupName,
          tagline: result.tagline,
          elevatorPitch: result.elevatorPitch,
          targetAudience: result.targetAudience,
          heroSectionCopy: result.heroSectionCopy,
        },
        designSuggestion: {
          id: uuidv4(),
          generatedPitchId: pitchId,
          colorPalette: result.colorPaletteSuggestions,
          logoConcepts: result.logoConceptSuggestions,
        }
      };
      
      // Use non-blocking write
      setDocumentNonBlocking(pitchIdeaRef, pitchIdeaData, { merge: true });

      toast({
        title: 'Pitch Saved!',
        description: `${result.startupName} has been saved to your collection.`,
      });
    } catch (e: any) {
      console.error('Save error:', e);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: e.message || 'Could not save recipe.',
      });
    } finally {
      setSaving(false);
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
${colorPaletteSuggestions.map((palette) => `- ${palette.join(', ')}`).join('\n')}

## Logo Concepts
${logoConceptSuggestions.map((concept) => `- ${concept}`).join('\n')}
    `;

    const blob = new Blob([content.trim()], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${startupName.toLowerCase().replace(/\s+/g, '-')}-pitch.md`;
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
              Describe your idea in a few sentences. The more detail, the better
              the pitch.
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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Pitch'
              )}
            </Button>
          </div>
        </form>
      </Card>

      {loading && <LoadingState />}

      {result && (
        <ResultsDisplay
          result={result}
          onDownload={handleDownload}
          onSave={handleSave}
          isSaving={saving}
          isLoggedIn={!!user}
        />
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
  onSave: () => void;
  isSaving: boolean;
  isLoggedIn: boolean;
}> = ({ result, onDownload, onSave, isSaving, isLoggedIn }) => (
  <div className="w-full max-w-5xl animate-in fade-in-50 duration-500 space-y-8">
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <h2 className="text-2xl font-headline font-bold text-center sm:text-3xl">
        Your Pitch is Ready!
      </h2>
      <div className="flex items-center gap-2">
        {isLoggedIn && (
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2" /> Save Pitch
              </>
            )}
          </Button>
        )}
        <Button onClick={onDownload} variant="outline">
          <Download className="mr-2" />
          Download
        </Button>
      </div>
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
                  <div
                    key={i}
                    className="flex overflow-hidden rounded-md border"
                  >
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
