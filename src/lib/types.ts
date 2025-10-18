import {FieldValue} from 'firebase/firestore';

export type PitchIdea = {
  id: string;
  userId: string;
  ideaDescription: string;
  createdAt: FieldValue;
  generatedPitch?: GeneratedPitch;
  designSuggestion?: DesignSuggestion;
};

export type GeneratedPitch = {
  id: string;
  pitchIdeaId: string;
  startupName: string;
  tagline: string;
  elevatorPitch: string;
  targetAudience: string;
  heroSectionCopy: string;
};

export type DesignSuggestion = {
  id: string;
  generatedPitchId: string;
  colorPalette: string[][];
  logoConcepts: string[];
};
