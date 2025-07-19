'use client';

import { useCreatePost } from './create-post-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Volume2, FileText, Smile, BookOpen, Laugh } from 'lucide-react';

const tones = [
  {
    id: 'standard' as const,
    title: 'Standard (Authoritative)',
    description: 'Professional and confident tone',
    icon: Volume2,
  },
  {
    id: 'descriptive' as const,
    title: 'Descriptive',
    description: 'Detailed and explanatory approach',
    icon: FileText,
  },
  {
    id: 'casual' as const,
    title: 'Casual',
    description: 'Conversational and friendly',
    icon: Smile,
  },
  {
    id: 'narrative' as const,
    title: 'Narrative',
    description: 'Story-driven and engaging',
    icon: BookOpen,
  },
  {
    id: 'humorous' as const,
    title: 'Humorous',
    description: 'Light-hearted and entertaining',
    icon: Laugh,
  },
];

export function ToneSelector() {
  const { state, setTone } = useCreatePost();

  return (
    <div>
      <Label className="block text-sm font-medium text-gray-700 mb-3">
        Post Tone
      </Label>
      <Select value={state.tone} onValueChange={(value) => setTone(value as any)}>
        <SelectTrigger>
          <SelectValue placeholder="Select tone..." />
        </SelectTrigger>
        <SelectContent>
          {tones.map((tone) => (
            <SelectItem key={tone.id} value={tone.id}>
              <div className="flex items-center gap-2">
                <tone.icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{tone.title}</div>
                  <div className="text-xs text-gray-500">{tone.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}