/**
 * Tweet Variation Cards Component
 * Displays 4 tweet variations in Twitter-like card format
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Copy, 
  Edit3, 
  RefreshCw, 
  Check,
  MessageCircle,
  Repeat2,
  Heart,
  Share,
  MoreHorizontal,
  Twitter
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/hooks/use-session';
import type { TweetVariation } from '@/hooks/use-tweet-generation';
import type { VoiceModel } from '@/hooks/use-voice-models';

interface TweetVariationCardsProps {
  variations: TweetVariation[];
  onRegenerate: (variationType: string) => Promise<boolean>;
  loading: boolean;
  selectedVoice?: VoiceModel;
  originalIdea: string;
}

const VARIATION_INFO = {
  'short-punchy': {
    title: 'Short',
    description: 'Brief and impactful',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  'medium-story': {
    title: 'Story',
    description: 'Narrative approach',
    color: 'bg-green-50 border-green-200 text-green-800',
  },
  'long-detailed': {
    title: 'Detailed',
    description: 'Comprehensive coverage',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  'thread-style': {
    title: 'Thread',
    description: 'Thread-like format',
    color: 'bg-orange-50 border-orange-200 text-orange-800',
  },
  'casual-personal': {
    title: 'Casual',
    description: 'Personal and relaxed',
    color: 'bg-pink-50 border-pink-200 text-pink-800',
  },
  'professional-insight': {
    title: 'Professional',
    description: 'Expert insights',
    color: 'bg-gray-50 border-gray-200 text-gray-800',
  },
};

export function TweetVariationCards({
  variations,
  onRegenerate,
  loading,
  selectedVoice,
  originalIdea,
}: TweetVariationCardsProps) {
  const { data: session } = useSession();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regeneratingType, setRegeneratingType] = useState<string | null>(null);

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success('Tweet copied to clipboard!');
      
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Failed to copy tweet');
    }
  };

  const handleEdit = (variation: TweetVariation) => {
    setEditingId(variation.id);
    setEditedContent(variation.content);
  };

  const handleSaveEdit = () => {
    toast.success('Tweet edited successfully!');
    setEditingId(null);
    setEditedContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedContent('');
  };

  const handleRegenerate = async (variationType: string) => {
    setRegeneratingType(variationType);
    await onRegenerate(variationType);
    setRegeneratingType(null);
  };

  // Show empty state when no variations
  if (variations.length === 0 && !loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Twitter className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-3">Ready to Generate</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a voice model and enter your idea to generate 6 tweet variations with different lengths and styles.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (loading && variations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Generating Tweet Variations</h3>
            <p className="text-muted-foreground">
              Analyzing voice patterns and creating 6 personalized variations...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {variations.length > 0 && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Generated Variations</h3>
            <p className="text-sm text-muted-foreground">
              {selectedVoice && `Using @${selectedVoice.twitterUsername}'s voice • `}
              {variations.length} variations generated
            </p>
          </div>
        </div>
      )}

      {/* Twitter-like Tweet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {variations.map((variation) => {
          const info = VARIATION_INFO[variation.variationType];
          const isEditing = editingId === variation.id;
          const isCopied = copiedId === variation.id;
          const isRegenerating = regeneratingType === variation.variationType;

          return (
            <Card key={variation.id} className="hover:shadow-md transition-shadow border border-gray-200">
              <CardContent className="p-4">
                {/* Twitter Card Header */}
                <div className="flex items-start space-x-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={session?.user?.image || '/default-avatar.png'} 
                      alt={session?.user?.name || 'User'} 
                    />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-sm truncate">
                        {session?.user?.name || 'Your Name'}
                      </h4>
                      <span className="text-gray-500 text-sm">
                        @{session?.user?.name?.toLowerCase().replace(/\s+/g, '') || 'username'}
                      </span>
                      <span className="text-gray-500 text-sm">·</span>
                      <span className="text-gray-500 text-sm">now</span>
                    </div>
                    
                    {/* Variation Type Badge */}
                    <div className="mt-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className={`text-xs ${info.color}`}>
                              {info.title}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{info.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                {/* Tweet Content */}
                {isEditing ? (
                  <div className="space-y-3 mb-4">
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={4}
                      className="resize-none border-gray-200"
                      placeholder="What's happening?"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {editedContent.length} characters
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Check className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900">
                      {variation.content}
                    </p>
                  </div>
                )}

                {/* Twitter-like Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-6">
                    {/* Reply */}
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-xs">0</span>
                    </button>
                    
                    {/* Retweet */}
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors">
                      <Repeat2 className="w-4 h-4" />
                      <span className="text-xs">0</span>
                    </button>
                    
                    {/* Like */}
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">0</span>
                    </button>
                    
                    {/* Share */}
                    <button className="text-gray-500 hover:text-blue-500 transition-colors">
                      <Share className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(variation.content, variation.id)}
                            className={`h-8 w-8 p-0 ${isCopied ? 'bg-green-50 text-green-600' : ''}`}
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isCopied ? 'Copied!' : 'Copy tweet'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(variation)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit tweet</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRegenerate(variation.variationType)}
                            disabled={isRegenerating}
                            className="h-8 w-8 p-0"
                          >
                            <RefreshCw 
                              className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} 
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Regenerate this variation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generation Info */}
      {variations.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Generated using AI • Click regenerate for new variations • Edit to customize
        </div>
      )}
    </div>
  );
}
