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

const categories = [
  {
    id: 'case-study-client' as const,
    title: 'Case Study - Client',
    description: 'Success stories showcasing client results and transformations',
  },
  {
    id: 'case-study-professional' as const,
    title: 'Case Study - Professional',
    description: 'Personal professional achievements and career milestones',
  },
  {
    id: 'personal-story' as const,
    title: 'Personal Story',
    description: 'Authentic personal experiences and life lessons',
  },
  {
    id: 'list-tips' as const,
    title: 'List of Tips',
    description: 'Actionable advice and practical tips in list format',
  },
  {
    id: 'industry-insight' as const,
    title: 'Industry Insight',
    description: 'Thought leadership and industry analysis',
  },
  {
    id: 'product-service' as const,
    title: 'Product/Service',
    description: 'Promotional content for products or services',
  },
  {
    id: 'behind-scenes' as const,
    title: 'Behind the Scenes',
    description: 'Process insights and workflow transparency',
  },
  {
    id: 'question-engagement' as const,
    title: 'Question/Engagement',
    description: 'Community-building questions and discussions',
  },
];

export function CategorySelector() {
  const { state, setCategory } = useCreatePost();

  return (
    <div>
      <Label className="block text-sm font-medium text-gray-700 mb-3">
        Post Category
      </Label>
      <Select value={state.category || ''} onValueChange={(value) => setCategory(value as any)}>
        <SelectTrigger>
          <SelectValue placeholder="Select a category..." />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div>
                <div className="font-medium">{category.title}</div>
                <div className="text-xs text-gray-500">{category.description}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}