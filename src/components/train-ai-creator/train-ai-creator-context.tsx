"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { ViralTweet, TrainingProgress as TrainingProgressType } from "@/lib/types/training";

// State interface
interface TrainAiCreatorState {
  // Current step in the process
  currentStep: 'input' | 'preview' | 'training' | 'complete' | 'error';
  
  // Username input
  username: string;
  isValidating: boolean;
  
  // Tweet collection
  tweets: ViralTweet[];
  totalEngagement: number;
  creatorInfo?: {
    username: string;
    name: string;
    profilePicture: string;
    followers: number;
  };
  isCollecting: boolean;
  
  // Training
  trainingId?: string;
  trainingProgress?: TrainingProgressType;
  isTraining: boolean;
  
  // Completion
  modelId?: string;
  
  // Error handling
  error?: string;
}

// Action types
type TrainAiCreatorAction =
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_VALIDATING'; payload: boolean }
  | { type: 'SET_COLLECTING'; payload: boolean }
  | { type: 'SET_TWEETS'; payload: { tweets: ViralTweet[]; totalEngagement: number; creatorInfo: any } }
  | { type: 'SET_TRAINING'; payload: { trainingId: string } }
  | { type: 'SET_TRAINING_PROGRESS'; payload: TrainingProgressType }
  | { type: 'SET_COMPLETE'; payload: { modelId: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET_STATE' }
  | { type: 'GO_TO_STEP'; payload: TrainAiCreatorState['currentStep'] };

// Initial state
const initialState: TrainAiCreatorState = {
  currentStep: 'input',
  username: '',
  isValidating: false,
  tweets: [],
  totalEngagement: 0,
  isCollecting: false,
  isTraining: false,
};

// Reducer
function trainAiCreatorReducer(
  state: TrainAiCreatorState,
  action: TrainAiCreatorAction
): TrainAiCreatorState {
  switch (action.type) {
    case 'SET_USERNAME':
      return {
        ...state,
        username: action.payload,
        error: undefined,
      };

    case 'SET_VALIDATING':
      return {
        ...state,
        isValidating: action.payload,
      };

    case 'SET_COLLECTING':
      return {
        ...state,
        isCollecting: action.payload,
        currentStep: action.payload ? 'preview' : state.currentStep,
      };

    case 'SET_TWEETS':
      return {
        ...state,
        tweets: action.payload.tweets,
        totalEngagement: action.payload.totalEngagement,
        creatorInfo: action.payload.creatorInfo,
        isCollecting: false,
        currentStep: 'preview',
        error: undefined,
      };

    case 'SET_TRAINING':
      return {
        ...state,
        trainingId: action.payload.trainingId,
        isTraining: true,
        currentStep: 'training',
      };

    case 'SET_TRAINING_PROGRESS':
      return {
        ...state,
        trainingProgress: action.payload,
        isTraining: !action.payload.isComplete,
        currentStep: action.payload.isComplete ? 'complete' : 'training',
      };

    case 'SET_COMPLETE':
      return {
        ...state,
        modelId: action.payload.modelId,
        isTraining: false,
        currentStep: 'complete',
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        currentStep: 'error',
        isValidating: false,
        isCollecting: false,
        isTraining: false,
      };

    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.payload,
        error: undefined,
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context
const TrainAiCreatorContext = createContext<{
  state: TrainAiCreatorState;
  dispatch: React.Dispatch<TrainAiCreatorAction>;
} | null>(null);

// Provider component
export function TrainAiCreatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(trainAiCreatorReducer, initialState);

  return (
    <TrainAiCreatorContext.Provider value={{ state, dispatch }}>
      {children}
    </TrainAiCreatorContext.Provider>
  );
}

// Custom hook to use the context
export function useTrainAiCreator() {
  const context = useContext(TrainAiCreatorContext);
  if (!context) {
    throw new Error('useTrainAiCreator must be used within a TrainAiCreatorProvider');
  }
  return context;
}

// Action creators for cleaner usage
export const trainAiCreatorActions = {
  setUsername: (username: string): TrainAiCreatorAction => ({
    type: 'SET_USERNAME',
    payload: username,
  }),
  
  setValidating: (isValidating: boolean): TrainAiCreatorAction => ({
    type: 'SET_VALIDATING',
    payload: isValidating,
  }),
  
  setCollecting: (isCollecting: boolean): TrainAiCreatorAction => ({
    type: 'SET_COLLECTING',
    payload: isCollecting,
  }),
  
  setTweets: (data: { tweets: ViralTweet[]; totalEngagement: number; creatorInfo: any }): TrainAiCreatorAction => ({
    type: 'SET_TWEETS',
    payload: data,
  }),
  
  setTraining: (trainingId: string): TrainAiCreatorAction => ({
    type: 'SET_TRAINING',
    payload: { trainingId },
  }),
  
  setTrainingProgress: (progress: TrainingProgressType): TrainAiCreatorAction => ({
    type: 'SET_TRAINING_PROGRESS',
    payload: progress,
  }),
  
  setComplete: (modelId: string): TrainAiCreatorAction => ({
    type: 'SET_COMPLETE',
    payload: { modelId },
  }),
  
  setError: (error: string): TrainAiCreatorAction => ({
    type: 'SET_ERROR',
    payload: error,
  }),
  
  goToStep: (step: TrainAiCreatorState['currentStep']): TrainAiCreatorAction => ({
    type: 'GO_TO_STEP',
    payload: step,
  }),
  
  resetState: (): TrainAiCreatorAction => ({
    type: 'RESET_STATE',
  }),
};
