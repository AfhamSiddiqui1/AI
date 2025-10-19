import {FieldValue} from 'firebase/firestore';

export type PitchIdea = {
  id: string;
  userId: string;
  ideaDescription: string;
  createdAt: FieldValue;
  generatedWebsite?: GeneratedWebsite;
  designSuggestion?: DesignSuggestion;
};

export type GeneratedWebsite = {
  id: string;
  pitchIdeaId: string;
  startupName: string;
  navbar: {
    links: { text: string; href: string }[];
    cta: { text: string; href: string };
  };
  hero: {
    headline: string;
    description: string;
    cta: { text: string; href: string };
    imageHint: string;
  };
  features: {
    title: string;
    items: {
      name: string;
      description: string;
      iconName: string;
    }[];
  };
  footer: {
    copyright: string;
    links: { text: string; href: string }[];
  }
};

export type DesignSuggestion = {
  id: string;
  generatedPitchId: string;
  colorPalette: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    mutedForeground: string;
    card: string;
    cardForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
  };
  logoConcept: string;
};
