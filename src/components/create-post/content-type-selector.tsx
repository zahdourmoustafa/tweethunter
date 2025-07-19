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

const contentTypes = [
  {
    id: 'thread' as const,
    title: 'Thread',
    description: '8-15 tweets',
  },
  {
    id: 'tweet' as const,
    title: 'Single Tweet',
    description: 'Standard post',
  },
  {
    id: 'long-tweet' as const,
    title: 'Long Tweet',
    description: 'Extended post',
  },
  {
    id: 'short-tweet' as const,
    title: 'Short Tweet',
    description: 'Concise post',
  },
];

export function ContentTypeSelector() {
  const { state, setContentType } = useCreatePost();

  return (
    <div>
      <Label className="block text-sm font-medium text-gray-700 mb-3">
        Content Type
      </Label>
      <Select value={state.contentType || ''} onValueChange={(value) => setContentType(value as any)}>
        <SelectTrigger>
          <SelectValue placeholder="Select content type..." />
        </SelectTrigger>
        <SelectContent>
          {contentTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <div>
                <div className="font-medium">{type.title}</div>
                <div className="text-xs text-gray-500">{type.description}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}