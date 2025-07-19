'use client';

import { CreatePostProvider } from '@/components/create-post/create-post-context';
import { LeftPanel } from '@/components/create-post/left-panel';
import { RightPanel } from '@/components/create-post/right-panel';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';

export default function CreatePostPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Create Post</h1>
              <p className="mt-2 text-gray-600">
                Generate engaging social media content with AI assistance
              </p>
            </div>
            
            <CreatePostProvider>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <LeftPanel />
                <RightPanel />
              </div>
            </CreatePostProvider>
          </div>
        </main>
      </div>
    </div>
  );
}