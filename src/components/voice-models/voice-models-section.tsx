/**
 * Voice Models Management Section for Settings Page
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useVoiceModels } from '@/hooks/use-voice-models';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Twitter, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function VoiceModelsSection() {
  const { 
    voiceModels, 
    loading, 
    error, 
    createVoiceModel, 
    refreshVoiceModel, 
    deleteVoiceModel 
  } = useVoiceModels();

  const [newUsername, setNewUsername] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const handleCreateVoiceModel = async () => {
    if (!newUsername.trim()) return;

    setIsCreating(true);
    const success = await createVoiceModel(newUsername.trim());
    if (success) {
      setNewUsername('');
    }
    setIsCreating(false);
  };

  const handleRefreshVoiceModel = async (id: string) => {
    setRefreshingId(id);
    await refreshVoiceModel(id);
    setRefreshingId(null);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-3 h-3" />;
    if (score >= 60) return <Clock className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Voice Models</h3>
        <p className="text-sm text-muted-foreground">
          Create voice models from Twitter accounts to generate tweets in their style.
        </p>
      </div>

      {/* Add New Voice Model */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Voice Model
          </CardTitle>
          <CardDescription>
            Enter a Twitter username to analyze their writing style and create a voice model.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="@username or username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreating) {
                    handleCreateVoiceModel();
                  }
                }}
                disabled={isCreating}
              />
            </div>
            <Button 
              onClick={handleCreateVoiceModel}
              disabled={!newUsername.trim() || isCreating || voiceModels.length >= 10}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Voice Model
                </>
              )}
            </Button>
          </div>
          
          {voiceModels.length >= 10 && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Maximum of 10 voice models reached. Delete some to add new ones.
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Voice Models List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium">Your Voice Models ({voiceModels.length}/10)</h4>
        </div>

        {loading && voiceModels.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading voice models...
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>Error loading voice models: {error}</span>
              </div>
            </CardContent>
          </Card>
        ) : voiceModels.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Twitter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No voice models yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first voice model by adding a Twitter username above.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {voiceModels.map((model) => (
              <Card key={model.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Twitter className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">@{model.twitterUsername}</span>
                        </div>
                        {model.displayName && model.displayName !== model.twitterUsername && (
                          <span className="text-sm text-muted-foreground">
                            ({model.displayName})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{model.tweetCount} tweets analyzed</span>
                        </div>
                        {model.lastAnalyzedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Updated {formatDistanceToNow(new Date(model.lastAnalyzedAt), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge 
                                variant="outline" 
                                className={`${getConfidenceColor(model.confidenceScore)} flex items-center gap-1`}
                              >
                                {getConfidenceIcon(model.confidenceScore)}
                                {model.confidenceScore}% confidence
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {model.confidenceScore >= 80 
                                  ? 'High quality analysis - excellent for generation'
                                  : model.confidenceScore >= 60
                                  ? 'Good quality analysis - suitable for generation'
                                  : 'Lower quality analysis - consider refreshing'
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRefreshVoiceModel(model.id)}
                              disabled={refreshingId === model.id}
                            >
                              <RefreshCw 
                                className={`w-4 h-4 ${refreshingId === model.id ? 'animate-spin' : ''}`} 
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Refresh voice model with latest tweets</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Voice Model</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the voice model for @{model.twitterUsername}? 
                              This action cannot be undone and you'll lose all analysis data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteVoiceModel(model.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
