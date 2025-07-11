"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface Tweet {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    profile_image_url: string;
    verified: boolean;
  };
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    impression_count: number;
  };
  created_at: string;
  thread_context?: {
    is_thread: boolean;
    thread_position?: number;
    total_tweets?: number;
    thread_tweets?: Tweet[];
  };
}

interface GenerationHistory {
  id: string;
  toolId: string;
  input: string;
  output: string;
  timestamp: Date;
  options?: any;
}

interface EditorState {
  originalTweet: Tweet | null;
  currentContent: string;
  isThread: boolean;
  charCount: number;
  selectedTool: string | null;
  isModalOpen: boolean;
  generationHistory: GenerationHistory[];
  savedVersions: string[];
}

interface EditorContextValue {
  state: EditorState;
  setOriginalTweet: (tweet: Tweet) => void;
  setCurrentContent: (content: string) => void;
  setIsThread: (isThread: boolean) => void;
  setSelectedTool: (toolId: string | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  addGeneration: (generation: Omit<GenerationHistory, 'id' | 'timestamp'>) => void;
  saveVersion: (content: string) => void;
  applyContent: (content: string) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
};

interface EditorProviderProps {
  children: ReactNode;
  initialTweet?: Tweet;
}

export const EditorProvider = ({ children, initialTweet }: EditorProviderProps) => {
  const [state, setState] = useState<EditorState>({
    originalTweet: initialTweet || null,
    currentContent: initialTweet?.text || "",
    isThread: false,
    charCount: initialTweet?.text.length || 0,
    selectedTool: null,
    isModalOpen: false,
    generationHistory: [],
    savedVersions: []
  });

  const setOriginalTweet = (tweet: Tweet) => {
    setState(prev => ({
      ...prev,
      originalTweet: tweet,
      currentContent: tweet.text,
      charCount: tweet.text.length
    }));
  };

  const setCurrentContent = (content: string) => {
    setState(prev => ({
      ...prev,
      currentContent: content,
      charCount: content.length
    }));
  };

  const setIsThread = (isThread: boolean) => {
    setState(prev => ({ ...prev, isThread }));
  };

  const setSelectedTool = (toolId: string | null) => {
    setState(prev => ({ ...prev, selectedTool: toolId }));
  };

  const setIsModalOpen = (isOpen: boolean) => {
    setState(prev => ({ ...prev, isModalOpen: isOpen }));
  };

  const addGeneration = (generation: Omit<GenerationHistory, 'id' | 'timestamp'>) => {
    const newGeneration: GenerationHistory = {
      ...generation,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    
    setState(prev => ({
      ...prev,
      generationHistory: [newGeneration, ...prev.generationHistory.slice(0, 9)] // Keep last 10
    }));
  };

  const saveVersion = (content: string) => {
    setState(prev => ({
      ...prev,
      savedVersions: [content, ...prev.savedVersions.slice(0, 4)] // Keep last 5
    }));
  };

  const applyContent = (content: string) => {
    setCurrentContent(content);
    saveVersion(content);
  };

  const value: EditorContextValue = {
    state,
    setOriginalTweet,
    setCurrentContent,
    setIsThread,
    setSelectedTool,
    setIsModalOpen,
    addGeneration,
    saveVersion,
    applyContent
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}; 