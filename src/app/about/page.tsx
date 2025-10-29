'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Github, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center pt-20 px-4">
        <div className="flex flex-wrap justify-center gap-8">
          <Card className="w-full max-w-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="https://religious-tan-xsv9l5kptf.edgeone.app/afham%20siddiqui.jpg" alt="Muhammad Afham Siddiqui" />
                <AvatarFallback>Muhammad Afham Siddiqui</AvatarFallback>
              </Avatar>
              <CardTitle className="text-3xl font-headline">
                Muhammad Afham Siddiqui
              </CardTitle>
              <p className="text-lg text-muted-foreground">21-Year-Old Full Stack Developer</p>
            </CardHeader>
            <CardContent className="text-center p-6 pt-0">
              <p className="mb-6">
                A passionate developer with a knack for building modern, responsive, and user-friendly web applications. I love exploring new technologies and pushing the boundaries of what's possible on the web.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="icon" asChild>
                  <Link href="afhamsiddiqui.3@gmail.">
                    <Mail className="h-5 w-5" />
                    <span className="sr-only">Email</span>
                  </Link>
                </Button>
                 <Button variant="outline" size="icon" asChild>
                  <Link href="https://github.com/AfhamSiddiqui1" target="_blank" rel="noopener noreferrer">
                    <Github className="h-5 w-5" />
                     <span className="sr-only">GitHub</span>
                  </Link>
                </Button>
                 <Button variant="outline" size="icon" asChild>
                  <Link href="https://www.linkedin.com/in/afham-siddiqui/" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-5 w-5" />
                     <span className="sr-only">LinkedIn</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="w-full max-w-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="" alt="Muhammad Afham Siddiqui" />
                <AvatarFallback>Areesha</AvatarFallback>
              </Avatar>
              <CardTitle className="text-3xl font-headline">
                Areesha Naz Bukhari
              </CardTitle>
              <p className="text-lg text-muted-foreground">20-Year-Old Full Stack Developer</p>
            </CardHeader>
            <CardContent className="text-center p-6 pt-0">
              <p className="mb-6">
                A passionate developer with a knack for building modern, responsive, and user-friendly web applications. I love exploring new technologies and pushing the boundaries of what's possible on the web.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="icon" asChild>
                  <Link href="areeshanaz05@gmail.com">
                    <Mail className="h-5 w-5" />
                    <span className="sr-only">Email</span>
                  </Link>
                </Button>
                 <Button variant="outline" size="icon" asChild>
                  <Link href="https://github.com/Areesha-Naz" target="_blank" rel="Areesha Naz Bukhari">
                    <Github className="h-5 w-5" />
                     <span className="sr-only">GitHub</span>
                  </Link>
                </Button>
                 <Button variant="outline" size="icon" asChild>
                  <Link href="https://www.linkedin.com/in/areesha-naz-381a43342?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="Areesha Naz Bukhari">
                    <Linkedin className="h-5 w-5" />
                     <span className="sr-only">LinkedIn</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
