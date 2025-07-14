// API endpoint: /api/train-ai/training-status/[trainingId]
import { NextApiRequest, NextApiResponse } from 'next';
import { TrainingDbService } from '@/lib/services/training-db';
import { TrainingStatusResponse, TRAINING_STEPS } from '@/lib/types/training';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrainingStatusResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    const { trainingId } = req.query;

    // Validate input
    if (!trainingId || typeof trainingId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Training ID is required.'
      });
    }

    // TODO: Add user authentication and verify ownership
    // const userId = await getUserIdFromSession(req);
    // if (!userId) {
    //   return res.status(401).json({
    //     success: false,
    //     error: 'Authentication required.'
    //   });
    // }

    // Initialize database service
    const dbService = new TrainingDbService();

    // Get training session
    const sessionResult = await dbService.getTrainingSession(trainingId);
    if (!sessionResult.success || !sessionResult.data) {
      return res.status(404).json({
        success: false,
        error: 'Training session not found.'
      });
    }

    const session = sessionResult.data;

    // Determine response based on session status
    switch (session.status) {
      case 'collecting':
        return res.status(200).json({
          success: true,
          data: {
            status: 'in-progress',
            progress: {
              step: 0,
              totalSteps: TRAINING_STEPS.length,
              currentStep: 'Collecting viral tweets...',
              isComplete: false,
            }
          }
        });

      case 'training':
        // Simulate progress based on time elapsed
        const startTime = new Date(session.createdAt).getTime();
        const currentTime = Date.now();
        const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
        
        // Estimate progress (training should take 2-5 minutes)
        const estimatedDuration = 3.5; // minutes
        const progressRatio = Math.min(elapsedMinutes / estimatedDuration, 0.95);
        const currentStepIndex = Math.floor(progressRatio * TRAINING_STEPS.length);
        
        return res.status(200).json({
          success: true,
          data: {
            status: 'in-progress',
            progress: {
              step: currentStepIndex + 1,
              totalSteps: TRAINING_STEPS.length,
              currentStep: TRAINING_STEPS[currentStepIndex] || TRAINING_STEPS[TRAINING_STEPS.length - 1],
              isComplete: false,
            }
          }
        });

      case 'completed':
        // Get the trained model ID (in a real implementation, you'd store this)
        const modelId = `model-${trainingId}`;
        
        return res.status(200).json({
          success: true,
          data: {
            status: 'completed',
            progress: {
              step: TRAINING_STEPS.length,
              totalSteps: TRAINING_STEPS.length,
              currentStep: 'Training completed!',
              isComplete: true,
            },
            modelId
          }
        });

      case 'failed':
        return res.status(200).json({
          success: true,
          data: {
            status: 'failed',
            progress: {
              step: 0,
              totalSteps: TRAINING_STEPS.length,
              currentStep: 'Training failed',
              isComplete: false,
              error: session.errorMessage || 'Training failed for unknown reason'
            }
          }
        });

      default:
        return res.status(500).json({
          success: false,
          error: 'Unknown training status.'
        });
    }

  } catch (error) {
    console.error('Error in training-status API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}
