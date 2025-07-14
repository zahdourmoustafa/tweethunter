"use client";

import { useEffect, useRef } from "react";
import { useTrainAiCreator, trainAiCreatorActions } from "./train-ai-creator-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Zap, 
  BookOpen, 
  Heart, 
  Mic, 
  Sparkles,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { TRAINING_STEPS, TrainingStatusResponse } from "@/lib/types/training";

const STEP_ICONS = [Brain, Zap, BookOpen, Heart, Mic, Sparkles];

export function TrainingProgress() {
  const { state, dispatch } = useTrainAiCreator();
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Poll training status
  useEffect(() => {
    // Only set up polling if we're in training step and have a training ID
    if (state.currentStep !== 'training' || !state.trainingId) {
      return;
    }

    const pollTrainingStatus = async () => {
      try {
        const response = await fetch(`/api/train-ai/training-status/${state.trainingId}`);
        const data: TrainingStatusResponse = await response.json();

        if (!data.success) {
          dispatch(trainAiCreatorActions.setError(data.error || 'Failed to get training status'));
          return;
        }

        if (!data.data) {
          dispatch(trainAiCreatorActions.setError('No training status data received'));
          return;
        }

        const { status, progress, modelId } = data.data;

        if (status === 'failed') {
          dispatch(trainAiCreatorActions.setError(progress.error || 'Training failed'));
          return;
        }

        if (status === 'completed' && modelId) {
          dispatch(trainAiCreatorActions.setComplete(modelId));
          return;
        }

        // Update progress
        dispatch(trainAiCreatorActions.setTrainingProgress(progress));

      } catch (error) {
        console.error('Error polling training status:', error);
        dispatch(trainAiCreatorActions.setError('Network error while checking training status'));
      }
    };

    // Initial poll
    pollTrainingStatus();

    // Set up polling interval
    intervalRef.current = setInterval(pollTrainingStatus, 2000); // Poll every 2 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.trainingId, state.currentStep, dispatch]);

  // Only show this component on the training step
  if (state.currentStep !== 'training') {
    return null;
  }

  const progress = state.trainingProgress;
  if (!progress) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Initializing training...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (progress.step / progress.totalSteps) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>Training Your AI</span>
        </CardTitle>
        <CardDescription>
          Our AI is learning from the viral tweets to understand the patterns that make content go viral.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Training Progress</span>
            <Badge variant="secondary">
              Step {progress.step} of {progress.totalSteps}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            {Math.round(progressPercentage)}% complete
          </p>
        </div>

        {/* Current Step */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium">{progress.currentStep}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This process takes 2-5 minutes to ensure high-quality training
          </p>
        </div>

        {/* Step Visualization */}
        <div className="space-y-4">
          <h4 className="font-medium text-center">Training Steps</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TRAINING_STEPS.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < progress.step;
              const isCurrent = stepNumber === progress.step;
              
              const Icon = STEP_ICONS[index];

              return (
                <div
                  key={step}
                  className={`p-3 rounded-lg border transition-all ${
                    isCompleted
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                      : isCurrent
                      ? 'border-primary bg-primary/5'
                      : 'border-muted bg-muted/30'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : isCurrent ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        stepNumber
                      )}
                    </div>
                    <Icon
                      className={`h-4 w-4 ${
                        isCompleted
                          ? 'text-green-600'
                          : isCurrent
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <p
                    className={`text-xs leading-tight ${
                      isCompleted
                        ? 'text-green-700 dark:text-green-300'
                        : isCurrent
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Training Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>What&apos;s happening during training:</span>
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Analyzing tweet structures and formatting patterns</li>
            <li>• Learning viral hooks and attention-grabbing techniques</li>
            <li>• Understanding storytelling and narrative structures</li>
            <li>• Identifying emotional triggers and psychological patterns</li>
            <li>• Mastering voice, tone, and personality traits</li>
            <li>• Creating your personalized AI content generator</li>
          </ul>
        </div>

        {/* Error State */}
        {progress.error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Training Error</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">{progress.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
