'use client';

import { useState, type FC, type FormEvent } from 'react';
import {
  Download,
  Loader2,
  RefreshCw,
  ArrowRight,
  Code,
  Copy,
  Palette,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { doc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import {
  generateWebsiteFromIdea,
  type GenerateWebsiteFromIdeaOutput,
} from '@/ai/flows/generate-website-from-idea';

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
import type { PitchIdea, DesignSuggestion } from '@/lib/types';
import { Header } from '@/components/header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// --- Predefined Color Palettes ---
const colorPalettes: (Omit<DesignSuggestion, 'id' | 'generatedPitchId' | 'logoConcept'> & {name: string, id: string})[] = [
    {
      id: 'vibrant',
      name: 'Vibrant',
      colorPalette: {
        background: '222.2 84% 4.9%',
        foreground: '210 40% 98%',
        primary: '142.1 76.2% 36.3%',
        primaryForeground: '144.9 80.4% 10%',
        mutedForeground: '215.4 16.3% 56.9%',
        card: '222.2 84% 6.9%',
        cardForeground: '210 40% 98%',
        accent: '142.1 76.2% 36.3%',
        accentForeground: '144.9 80.4% 10%',
        border: '217.2 32.6% 17.5%',
      },
    },
    {
        id: 'earthy',
        name: 'Earthy',
        colorPalette: {
            background: '20 31% 12%',
            foreground: '20 5% 80%',
            primary: '33 74% 64%',
            primaryForeground: '20 31% 10%',
            mutedForeground: '20 5% 55%',
            card: '20 31% 15%',
            cardForeground: '20 5% 85%',
            accent: '33 74% 64%',
            accentForeground: '20 31% 10%',
            border: '20 31% 20%',
        }
    },
    {
        id: 'monochrome',
        name: 'Monochrome',
        colorPalette: {
            background: '0 0% 8%',
            foreground: '0 0% 80%',
            primary: '0 0% 98%',
            primaryForeground: '0 0% 9%',
            mutedForeground: '0 0% 55%',
            card: '0 0% 12%',
            cardForeground: '0 0% 85%',
            accent: '0 0% 98%',
            accentForeground: '0 0% 9%',
            border: '0 0% 18%',
        },
    },
    {
        id: 'ocean',
        name: 'Oceanic',
        colorPalette: {
            background: '210 40% 9%',
            foreground: '210 40% 80%',
            primary: '180 100% 35%',
            primaryForeground: '180 100% 95%',
            mutedForeground: '210 40% 55%',
            card: '210 40% 12%',
            cardForeground: '210 40% 85%',
            accent: '180 100% 35%',
            accentForeground: '180 100% 95%',
            border: '210 40% 18%',
        },
    }
  ];

type CombinedResult = GenerateWebsiteFromIdeaOutput & {
  design: Omit<GenerateWebsiteFromIdeaOutput['design'], 'colorPalette'> & {
    colorPalette: DesignSuggestion['colorPalette'];
  };
};

export default function Home() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CombinedResult | null>(null);
  const [pitchId, setPitchId] = useState<string | null>(null);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(colorPalettes[0].id);

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
      const selectedPalette = colorPalettes.find(p => p.id === selectedPaletteId);

      if (!selectedPalette) {
        throw new Error("Selected color palette not found.");
      }

      const combinedResult: CombinedResult = {
        ...websiteData,
        design: {
          ...websiteData.design,
          colorPalette: selectedPalette.colorPalette,
        },
      };

      setResult(combinedResult);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Generation Failed',
        description: err.message || 'An unexpected error occurred. Please try again.',
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
        title: 'Cannot Save Design',
        description: user
          ? 'No design data to save.'
          : 'You must be logged in to save a design.',
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
          ...result.website,
        },
        designSuggestion: {
          id: uuidv4(),
          generatedPitchId: pitchId,
          colorPalette: result.design.colorPalette,
          logoConcept: result.design.logoConcept,
        },
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
        description: e.message || 'Could not save design.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto flex flex-1 flex-col items-center gap-12 p-4 pt-24 md:pt-32">
        <Card className="w-full max-w-3xl shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                Your Startup Idea
              </CardTitle>
              <CardDescription>
                Describe your idea in a few sentences. The more detail, the
                better the design.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="e.g., A mobile app that connects local gardeners with people who want fresh, organic produce."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={4}
                disabled={loading}
                className="resize-none"
              />
              <div>
                <Label className="flex items-center gap-2 mb-4 font-medium">
                  <Palette/>
                  Choose a Color Theme
                </Label>
                <RadioGroup 
                  defaultValue={selectedPaletteId}
                  onValueChange={setSelectedPaletteId}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {colorPalettes.map(palette => (
                    <Label 
                      key={palette.id}
                      htmlFor={palette.id}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer hover:border-accent",
                        selectedPaletteId === palette.id && "border-primary"
                      )}
                    >
                      <div className="flex -space-x-2 overflow-hidden">
                        {Object.values(palette.colorPalette).slice(0, 5).map((color, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-background" style={{ backgroundColor: `hsl(${color})` }}></div>
                        ))}
                      </div>
                       <RadioGroupItem value={palette.id} id={palette.id} className="sr-only" />
                      <span className="mt-2 text-sm font-medium">{palette.name}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
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
            onSave={handleSave}
            isSaving={saving}
            isLoggedIn={!!user}
            onRegenerate={handleRegenerate}
            isRegenerating={loading}
          />
        )}
      </main>
      <footer className="mt-auto text-center text-sm text-muted-foreground p-4">
        <p>&copy; {new Date().getFullYear()} Gbell AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

const LoadingState = () => (
  <div className="w-full max-w-6xl space-y-4 animate-pulse">
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-96 w-full" />
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

const ResultsDisplay: FC<{
  result: CombinedResult;
  onSave: () => void;
  isSaving: boolean;
  isLoggedIn: boolean;
  onRegenerate: () => void;
  isRegenerating: boolean;
}> = ({
  result,
  onSave,
  isSaving,
  isLoggedIn,
  onRegenerate,
  isRegenerating,
}) => {
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

  const navbarCode = `<Navbar\n  startupName="${website.startupName}"\n  logoConcept="${design.logoConcept}"\n  links={${JSON.stringify(website.navbar.links, null, 2)}}\n  cta={${JSON.stringify(website.navbar.cta, null, 2)}}\n/>`;
  const heroCode = `<Hero\n  headline="${website.hero.headline}"\n  description="${website.hero.description}"\n  cta={${JSON.stringify(website.hero.cta, null, 2)}}\n  imageHint="${website.hero.imageHint}"\n/>`;
  const featuresCode = `<Features\n  title="${website.features.title}"\n  items={${JSON.stringify(website.features.items, null, 2)}}\n/>`;
  const footerCode = `<Footer\n  startupName="${website.startupName}"\n  copyright="${website.footer.copyright}"\n  links={${JSON.stringify(website.footer.links, null, 2)}}\n/>`;
  const fullCode = `${navbarCode}\n${heroCode}\n${featuresCode}\n${footerCode}`;

  const downloadHtml = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${website.startupName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .font-headline { font-family: 'Space Grotesk', sans-serif; }
        :root {
          --background: ${design.colorPalette.background};
          --foreground: ${design.colorPalette.foreground};
          --primary: ${design.colorPalette.primary};
          --primary-foreground: ${design.colorPalette.primaryForeground};
          --muted-foreground: ${design.colorPalette.mutedForeground};
          --card: ${design.colorPalette.card};
          --card-foreground: ${design.colorPalette.cardForeground};
          --accent: ${design.colorPalette.accent};
          --accent-foreground: ${design.colorPalette.accentForeground};
          --border: ${design.colorPalette.border};
        }
        body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); }
    </style>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Add React and ReactDOM scripts to render the components -->
    <!-- This is a simplified example; a real app would use a bundler -->
    <div id="root"></div>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="text/babel">
      // In a real app, you would import these. For this export, we'll define them.
      const Button = ({ children, ...props }) => <button {...props}>{children}</button>;
      const Image = (props) => <img {...props} />;
      const LucideIcon = ({name}) => <span>{name}</span>
      
      const Navbar = (${navbarCode});
      const Hero = (${heroCode});
      const Features = (${featuresCode});
      const Footer = (${footerCode});

      const App = () => (
        <div style={${JSON.stringify(style)}}>
          <div className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-body">
            <Navbar />
            <Hero />
            <Features />
            <Footer />
          </div>
        </div>
      );

      ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>`;
    const blob = new Blob([htmlContent.trim()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${website.startupName.toLowerCase().replace(/\s+/g, '-')}-design.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl space-y-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-headline font-bold text-center sm:text-3xl">
          Your Website Design is Ready!
        </h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={onRegenerate}
            disabled={isRegenerating}
            variant="outline"
          >
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
                  <Download className="mr-2" /> Save Design
                </>
              )}
            </Button>
          )}
          <CodeDialog
            code={fullCode}
            onDownload={downloadHtml}
            startupName={website.startupName}
          />
        </div>
      </div>
      <div
        className="border rounded-xl overflow-hidden shadow-2xl"
        style={style}
      >
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
          <Features
            title={website.features.title}
            items={website.features.items}
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
    <nav className="sticky top-0 bg-[hsl(var(--background))] bg-opacity-80 backdrop-blur-md z-10 border-b border-[hsl(var(--border))] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 flex items-center gap-2">
              <LucideIcons.ArrowUpRight className="h-8 w-8 text-[hsl(var(--primary))]" />
              <span className="font-bold text-lg font-headline">
                {startupName}
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            {links.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors animate-in fade-in slide-in-from-top-2 duration-500"
                style={{ animationDelay: `${150 + index * 100}ms` }}
              >
                {link.text}
              </a>
            ))}
          </div>
          <div
            className="flex items-center animate-in fade-in slide-in-from-top-2 duration-500"
            style={{ animationDelay: '550ms' }}
          >
            <Button
              asChild
              style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
              }}
              className="transform transition-transform hover:scale-105"
            >
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter font-headline animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              {headline}
            </h1>
            <p className="max-w-xl text-lg text-[hsl(var(--muted-foreground))] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
              <Button
                asChild
                size="lg"
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                }}
                className="transform transition-transform hover:scale-105"
              >
                <a href={cta.href}>{cta.text}</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                style={{
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                className="transform transition-transform hover:scale-105 hover:bg-[hsl(var(--accent))]"
              >
                <a href="#">
                  Learn More <ArrowRight className="ml-2" />
                </a>
              </Button>
            </div>
          </div>
          <div className="relative h-64 lg:h-auto lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500 delay-500">
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

const Features: FC<{
  title: string;
  items: { name: string; description: string; iconName: string }[];
}> = ({ title, items }) => {
  return (
    <section className="py-20 sm:py-24 bg-[hsl(var(--card))]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-headline animate-in fade-in slide-in-from-bottom-4 duration-500">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, index) => {
            const Icon = (LucideIcons as any)[item.iconName] || LucideIcons.HelpCircle;
            return (
              <div
                key={index}
                className="bg-[hsl(var(--background))] p-8 rounded-xl shadow-lg transform transition-transform hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-5 duration-500"
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] mb-6">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-headline mb-2">
                  {item.name}
                </h3>
                <p className="text-[hsl(var(--muted-foreground))]">
                  {item.description}
                </p>
              </div>
            );
          })}
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
            <LucideIcons.ArrowUpRight className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
            <span className="font-semibold text-md">{startupName}</span>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {copyright}
          </p>
          <div className="flex space-x-6">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                {link.text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

const CodeDialog: FC<{
  code: string;
  onDownload: () => void;
  startupName: string;
}> = ({ code, onDownload, startupName }) => {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setHasCopied(true);
    toast({ title: 'Code copied to clipboard!' });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Code className="mr-2" />
          View Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generated Code for {startupName}</DialogTitle>
        </DialogHeader>
        <div className="relative mt-4">
          <pre className="bg-muted text-muted-foreground p-4 rounded-md text-xs overflow-x-auto max-h-[50vh]">
            <code>{code}</code>
          </pre>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleCopy}
          >
            {hasCopied ? (
              <LucideIcons.Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={onDownload}>
            <Download className="mr-2" />
            Download HTML
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
