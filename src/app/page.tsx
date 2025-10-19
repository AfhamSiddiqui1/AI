'use client';

import { useState, type FC, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import {
  Brush,
  Download,
  Lightbulb,
  Rocket,
  Save,
  Loader2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

import {
  useUser,
  useFirestore,
  setDocumentNonBlocking,
} from '@/firebase';

import { generateWebsiteFromIdea, type GenerateWebsiteFromIdeaOutput } from '@/ai/flows/generate-website-from-idea';

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
  GeneratedWebsite,
  DesignSuggestion
} from '@/lib/types';
import { Header } from '@/components/header';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<GenerateWebsiteFromIdeaOutput | null>(null);
  const [pitchId, setPitchId] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const generateContent = async (startupIdea: string) => {
    setLoading(true);
    setResult(null);
    if (!pitchId) {
      setPitchId(uuidv4()); // Set ID only on first generation for a session
    }

    try {
      const websiteData = await generateWebsiteFromIdea({ startupIdea });
      setResult(websiteData);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Generation Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setResult(null); // Ensure no partial results are shown
    } finally {
      setLoading(false);
    }
  };

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
    setPitchId(null); // Reset pitchId to get a new one for a new idea
    await generateContent(idea);
  };
  
  const handleRegenerate = async () => {
    if (!idea.trim()) return;
    await generateContent(idea);
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
        generatedWebsite: {
          id: uuidv4(),
          pitchIdeaId: pitchId,
          ...result.website
        },
        designSuggestion: {
          id: uuidv4(),
          generatedPitchId: pitchId, // TODO: This should be websiteId, need to update type
          ...result.design,
        }
      };
      
      // Use non-blocking write
      setDocumentNonBlocking(pitchIdeaRef, pitchIdeaData, { merge: true });

      toast({
        title: 'Design Saved!',
        description: `${result.website.startupName} has been saved to your collection.`,
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
      website: {
        startupName,
        navbar,
        hero,
        footer,
      },
      design: {
        colorPalette,
        logoConcept
      }
    } = result;

    const content = `
# Startup: ${startupName}

## Design System
- Logo Concept: ${logoConcept}
- Color Palette: ${Object.entries(colorPalette).map(([name, hsl]) => `\n  - ${name}: ${hsl}`).join('')}

## Navbar
- Links: ${navbar.links.map(l => l.text).join(', ')}
- CTA: ${navbar.cta.text}

## Hero Section
- Headline: ${hero.headline}
- Description: ${hero.description}
- CTA: ${hero.cta.text}
- Image Hint: ${hero.imageHint}

## Footer
- Copyright: ${footer.copyright}
- Links: ${footer.links.map(l => l.text).join(', ')}
    `;

    const blob = new Blob([content.trim()], {
      type: 'text/markdown;charset=utf-t',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${startupName.toLowerCase().replace(/\s+/g, '-')}-website-design.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto flex flex-1 flex-col items-center gap-12 p-4 pt-24 md:pt-32">
        <Card className="w-full max-w-3xl shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Lightbulb />
                Your Startup Idea
              </CardTitle>
              <CardDescription>
                Describe your idea in a few sentences. The more detail, the better
                the design.
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
                {loading && !result ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Website'
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
            onRegenerate={handleRegenerate}
            isRegenerating={loading}
          />
        )}
      </main>
      <footer className="mt-auto text-center text-sm text-muted-foreground p-4">
          <p>&copy; {new Date().getFullYear()} PitchAI. All rights reserved.</p>
        </footer>
    </div>
  );
}

const LoadingState = () => (
  <div className="w-full max-w-6xl space-y-4 animate-pulse">
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-96 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);


const ResultsDisplay: FC<{
  result: GenerateWebsiteFromIdeaOutput;
  onDownload: () => void;
  onSave: () => void;
  isSaving: boolean;
  isLoggedIn: boolean;
  onRegenerate: () => void;
  isRegenerating: boolean;
}> = ({ result, onDownload, onSave, isSaving, isLoggedIn, onRegenerate, isRegenerating }) => {
  const { website, design } = result;

  const style = {
    '--background': design.colorPalette.background,
    '--foreground': design.colorPalette.foreground,
    '--primary': design.colorPalette.primary,
    '--primary-foreground': design.colorPalette.primaryForeground,
    '--muted-foreground': design.colorPalette.mutedForeground,
    '--card': design.colorPalette.card,
    '--card-foreground': design.colorPalette.cardForeground,
    '--accent': design.colorPalette.accent,
    '--accent-foreground': design.colorPalette.accentForeground,
    '--border': design.colorPalette.border,
  } as React.CSSProperties;

  return (
    <div className="w-full max-w-7xl animate-in fade-in-50 duration-500 space-y-8">
       <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <h2 className="text-2xl font-headline font-bold text-center sm:text-3xl">
          Your Website Design is Ready!
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={onRegenerate} disabled={isRegenerating} variant="outline">
            {isRegenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2" /> Regenerate
              </>
            )}
          </Button>
          {isLoggedIn && (
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2" /> Save Design
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
      <div className="border rounded-xl overflow-hidden shadow-2xl" style={style}>
        <div className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-body">
            <Navbar
              startupName={website.startupName}
              logoConcept={design.logoConcept}
              links={website.navbar.links}
              cta={website.navbar.cta}
            />
            <Hero
              headline={website.hero.headline}
              description={website.hero.description}
              cta={website.hero.cta}
              imageHint={website.hero.imageHint}
            />
            <Footer
              startupName={website.startupName}
              copyright={website.footer.copyright}
              links={website.footer.links}
            />
        </div>
      </div>
    </div>
  );
};


const Navbar: FC<{
  startupName: string;
  logoConcept: string;
  links: { text: string; href: string }[];
  cta: { text: string; href: string };
}> = ({ startupName, logoConcept, links, cta }) => {
  return (
    <nav className="sticky top-0 bg-[hsl(var(--background))] bg-opacity-80 backdrop-blur-md z-10 border-b border-[hsl(var(--border))]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 flex items-center gap-2">
              <Brush className="h-8 w-8 text-[hsl(var(--primary))]" />
              <span className="font-bold text-lg font-headline">{startupName}</span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                {link.text}
              </a>
            ))}
          </div>
          <div className="flex items-center">
            <Button asChild style={{ 
              backgroundColor: 'hsl(var(--primary))', 
              color: 'hsl(var(--primary-foreground))' 
            }}>
              <a href={cta.href}>{cta.text}</a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Hero: FC<{
  headline: string;
  description: string;
  cta: { text: string; href: string };
  imageHint: string;
}> = ({ headline, description, cta, imageHint }) => {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter font-headline">
              {headline}
            </h1>
            <p className="max-w-xl text-lg text-[hsl(var(--muted-foreground))]">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                <a href={cta.href}>{cta.text}</a>
              </Button>
               <Button asChild size="lg" variant="outline" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                <a href="#">Learn More <ArrowRight className="ml-2"/></a>
              </Button>
            </div>
          </div>
          <div className="relative h-64 lg:h-auto lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
             <Image
                src={`https://picsum.photos/seed/${uuidv4()}/800/600`}
                alt={imageHint}
                fill
                className="object-cover"
                data-ai-hint={imageHint}
              />
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer: FC<{
  startupName: string;
  copyright: string;
  links: { text: string; href: string }[];
}> = ({ startupName, copyright, links }) => {
  return (
    <footer className="bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brush className="h-6 w-6 text-[hsl(var(--muted-foreground))]"/>
            <span className="font-semibold text-md">{startupName}</span>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {copyright}
          </p>
          <div className="flex space-x-6">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                {link.text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
