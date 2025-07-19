'use client';

import { useCreatePost } from './create-post-context';
import { CategorySelector } from './category-selector';
import { ContentTypeSelector } from './content-type-selector';
import { AITopicGenerator } from './ai-topic-generator';
import { ToneSelector } from './tone-selector';
import { GenerateButton } from './generate-button';

export function LeftPanel() {
  const { state } = useCreatePost();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Post Configuration
          </h2>
          <p className="text-sm text-gray-600">
            Configure your post settings and let AI generate engaging content
          </p>
        </div>

        <CategorySelector />
        
        {state.category && <ContentTypeSelector />}
        
        {state.category && state.contentType && <AITopicGenerator />}
        
        {state.selectedIdea && <ToneSelector />}
        
        {state.selectedIdea && state.tone && <GenerateButton />}
      </div>
    </div>
  );
}