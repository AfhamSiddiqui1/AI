'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, PlusCircle, ArrowLeft } from 'lucide-react';
import type { PitchIdea } from '@/lib/types';
import { Header } from '@/components/header';

export default function PitchesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const pitchesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'users', user.uid, 'pitchIdeas');
  }, [firestore, user]);

  const { data: pitches, isLoading } = useCollection<PitchIdea>(pitchesQuery);

  const sortedPitches = useMemo(() => {
    if (!pitches) return [];
    return [...pitches].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [pitches]);

  if (isUserLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">
          You must be logged in to view your saved pitches.
        </p>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-10 md:p-16">
      <Header />
      <main className="mt-12">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold font-headline">My Saved Pitches</h1>
             <Button asChild variant="outline">
                <Link href="/">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Pitch
                </Link>
            </Button>
        </div>

        {sortedPitches.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No pitches saved yet.</h3>
            <p className="text-muted-foreground mt-2">
              Start by generating a new pitch to see it here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedPitches.map((pitch) => (
              <Card key={pitch.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{pitch.generatedPitch?.startupName || 'Untitled Pitch'}</CardTitle>
                   <CardDescription className="line-clamp-2">
                    {pitch.ideaDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                   <p className="text-sm text-muted-foreground">
                    Created on {new Date(pitch.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
                <div className="p-6 pt-0">
                    <Button asChild className="w-full">
                        {/* This will eventually link to a detailed view page */}
                        <Link href="#">View Details</Link>
                    </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
