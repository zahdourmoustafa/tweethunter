'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PostCategory = 
  | 'case-study-client'
  | 'case-study-professional'
  | 'personal-story'
  | 'list-tips'
  | 'industry-insight'
  | 'product-service'
  | 'behind-scenes'
  | 'question-engagement';

export type ContentType = 'thread' | 'tweet' | 'long-tweet' | 'short-tweet';
export type ToneType = 'standard' | 'descriptive' | 'casual' | 'narrative' | 'humorous';

export interface CreatePostState {
  category: PostCategory | null;
  contentType: ContentType | null;
  topic: string;
  selectedIdea: string;
  tone: ToneType;
  generatedContent: string;
  isGenerating: boolean;
  aiIdeas: string[];
}

interface CreatePostContextType {
  state: CreatePostState;
  setCategory: (category: PostCategory) => void;
  setContentType: (type: ContentType) => void;
  setTopic: (topic: string) => void;
  setSelectedIdea: (idea: string) => void;
  setTone: (tone: ToneType) => void;
  setGeneratedContent: (content: string) => void;
  setIsGenerating: (generating: boolean) => void;
  setAiIdeas: (ideas: string[]) => void;
  resetState: () => void;
}

const CreatePostContext = createContext<CreatePostContextType | undefined>(undefined);

const initialState: CreatePostState = {
  category: null,
  contentType: null,
  topic: '',
  selectedIdea: '',
  tone: 'standard',
  generatedContent: '',
  isGenerating: false,
  aiIdeas: [],
};

export function CreatePostProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CreatePostState>(initialState);

  const updateState = (updates: Partial<CreatePostState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const contextValue: CreatePostContextType = {
    state,
    setCategory: (category) => updateState({ category }),
    setContentType: (contentType) => updateState({ contentType }),
    setTopic: (topic) => updateState({ topic }),
    setSelectedIdea: (selectedIdea) => updateState({ selectedIdea }),
    setTone: (tone) => updateState({ tone }),
    setGeneratedContent: (generatedContent) => updateState({ generatedContent }),
    setIsGenerating: (isGenerating) => updateState({ isGenerating }),
    setAiIdeas: (aiIdeas) => updateState({ aiIdeas }),
    resetState: () => setState(initialState),
  };

  return (
    <CreatePostContext.Provider value={contextValue}>
      {children}
    </CreatePostContext.Provider>
  );
}

export function useCreatePost() {
  const context = useContext(CreatePostContext);
  if (context === undefined) {
    throw new Error('useCreatePost must be used within a CreatePostProvider');
  }
  return context;
}