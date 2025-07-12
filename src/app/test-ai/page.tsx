'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AITool } from '@/lib/types/aiTools';
import { storytellerAgent } from '@/lib/ai/storyteller-agent';

export default function TestAI() {
  const [inputText, setInputText] = useState('Almost $100k in 4 months\n\nReminder:\n\nIt\'s easier to grow a painkiller app than a vitamin app.');
  const [selectedTool, setSelectedTool] = useState<AITool>(AITool.ExpandTweet);
  const [result, setResult] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [rawResult, setRawResult] = useState<string>('');

  const testTools = [
    { id: AITool.ExpandTweet, name: 'Expand Tweet', description: 'Turn into viral thread' },
    { id: AITool.CreateHook, name: 'Create Hook', description: 'Generate scroll-stopping opener' },
    { id: AITool.MoreCasual, name: 'More Casual', description: 'Make it feel like texting a friend' },
    { id: AITool.MoreAssertive, name: 'More Assertive', description: 'Add confidence and authority' },
    { id: AITool.MakeShorter, name: 'Make Shorter', description: 'Condense while keeping punch' },
    { id: AITool.ImproveTweet, name: 'Improve Tweet', description: 'Make it more viral' },
  ];

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    setResult('');
    setRawResult('');
    
    try {
      const response = await storytellerAgent.generateContent(selectedTool, inputText);
      
      // Show both raw and processed results
      setRawResult(response.content);
      setResult(response.content);
      
    } catch (error) {
      console.error('Generation failed:', error);
      setResult('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">AI Implementation Test</h1>
        <p className="text-gray-600">Test the improved AI implementation to ensure it generates clean, human-like content</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Enter content to test AI generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter your tweet content here..."
              className="min-h-[100px]"
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Tool</label>
              <div className="flex flex-wrap gap-2">
                {testTools.map(tool => (
                  <Badge
                    key={tool.id}
                    variant={selectedTool === tool.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedTool(tool.id)}
                  >
                    {tool.name}
                  </Badge>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !inputText.trim()}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Content'}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Testing clean output - should NOT contain conversational wrapper text
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-green-600">✅ Generated Content</label>
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                  </div>
                </div>
                
                {/* Quality Indicators */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quality Checks:</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={result.includes('Here\'s') || result.includes('I\'ll') ? "destructive" : "default"}>
                      {result.includes('Here\'s') || result.includes('I\'ll') ? '❌' : '✅'} No conversational wrapper
                    </Badge>
                    <Badge variant={result.includes('what do you think') || result.includes('How does this sound') ? "destructive" : "default"}>
                      {result.includes('what do you think') || result.includes('How does this sound') ? '❌' : '✅'} No trailing questions
                    </Badge>
                    <Badge variant={result.length > 10 ? "default" : "destructive"}>
                      {result.length > 10 ? '✅' : '❌'} Has content ({result.length} chars)
                    </Badge>
                    <Badge variant={result.includes('–') || result.includes('\n') ? "default" : "secondary"}>
                      {result.includes('–') || result.includes('\n') ? '✅' : '⚠️'} Good formatting
                    </Badge>
                  </div>
                </div>
                
                {/* Character count */}
                <div className="text-xs text-gray-500">
                  Character count: {result.length} | Words: {result.split(' ').length}
                </div>
              </div>
            )}
            
            {isGenerating && (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Generating content...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
