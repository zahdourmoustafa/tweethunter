# AI Tweet Editor Feature - Technical Specification

## Overview

The AI Tweet Editor is the core feature of TweetInspire that allows users to transform viral tweets into personalized, human-like content using AI-powered tools. This feature bridges tweet discovery with content creation through an intuitive interface.

## Feature Flow

### 1. Tweet Discovery to Editor Transition

#### Current State
- Users browse viral tweets in the inspirations page (`/dashboard/inspirations`)
- Each tweet displays engagement metrics (likes, retweets, replies, impressions)
- Tweets are presented in a grid layout with author information

#### Required Addition
- **"Edit Tweet" button** on each tweet card
- Button should be prominently placed and clearly labeled
- On click, transitions user to the AI Tweet Editor interface

### 2. AI Tweet Editor Interface

#### Layout Structure
The editor follows a **two-panel layout**:

**Left Panel: Tweet Composer**
- Original tweet content is automatically copied and pasted
- Editable text area for content modification
- Character counter (280 character limit)
- Thread toggle option
- Save/Copy functionality

**Right Panel: AI Tools Sidebar**
- 12 AI tools organized in two columns
- Each tool has an icon, name, and description
- Tools are categorized by function type

#### AI Tools Layout

**Left Column Tools:**
1. 🚀 **Copywriting Tips** - Analyze and suggest improvements
2. ✍️ **Keep Writing** - Continue/expand current content  
3. 😊 **Add Emojis** - Strategic emoji placement
4. ✂️ **Make Shorter** - Condense while maintaining impact
5. 🔄 **Expand Tweet** - Convert to thread format
6. ▶️ **Create Hook** - Generate attention-grabbing openers
7. 📢 **Create CTA** - Add compelling call-to-actions

**Right Column Tools:**
1. ⚡ **Improve Tweet** - General optimization
2. 💪 **More Assertive** - Confident, stronger tone
3. 😎 **More Casual** - Conversational, relatable tone
4. 👔 **More Formal** - Professional, business tone
5. 🔧 **Fix Grammar** - Correct grammar and spelling
6. 💡 **Tweet Ideas** - Generate related concepts

### 3. AI Tool Interaction Flow

#### Tool Selection
- User clicks on any AI tool button
- Tool popup/modal opens immediately
- Original tweet content is pre-loaded in the input area

#### Popup Interface (Based on p5.png)
The AI tool popup contains:

**Header Section:**
- Tool name and icon
- Close button (X)
- Tool description/purpose

**Content Section:**
- **Input Area**: Original tweet content (editable)
- **Output Area**: AI-generated result
- **Action Buttons**: 
  - Quick action buttons (Make it..., Shorter, Longer, bolder, More casual, More formal)
  - Custom prompt input field

**Footer Section:**
- **Actions Library** button
- **History** button  
- **Generate/Apply** button (primary action)

#### AI Generation Process
1. User selects tool and reviews/edits input content
2. User clicks "Generate" or uses quick action buttons
3. Loading state shows AI processing
4. Generated content appears in output area
5. User can regenerate, edit, or apply the result

### 4. AI Content Generation Requirements

#### Quality Standards
- **Human-like output**: Content must feel natural and authentic
- **Undetectable AI**: No robotic or generic language patterns
- **Context preservation**: Maintain original message intent
- **Engagement optimization**: Enhance viral potential

#### Technical Implementation
- **Model**: OpenAI GPT-4 or GPT-4 Turbo
- **Custom prompts** for each tool type
- **Context injection**: Include original tweet metrics and author info
- **Response streaming** for better UX
- **Error handling** for API failures

## Technical Implementation

### 1. UI Components Required

#### Tweet Card Enhancement
```typescript
// Add to existing tweet card component
<Button 
  variant="outline" 
  size="sm" 
  onClick={() => openEditor(tweet)}
  className="edit-tweet-btn"
>
  <Edit className="w-4 h-4 mr-2" />
  Edit Tweet
</Button>
```

#### AI Tweet Editor Page
- New route: `/dashboard/inspirations/editor`
- Two-panel responsive layout
- State management for tweet content
- Real-time character counting

#### AI Tools Sidebar Component
```typescript
interface AITool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'enhance' | 'tone' | 'format' | 'generate';
}
```

#### AI Tool Popup/Modal
- Modal overlay with backdrop
- Responsive design for mobile
- Input/output text areas
- Action buttons and quick options
- Loading states and error handling

### 2. API Endpoints

#### AI Generation Endpoint
```typescript
// POST /api/ai/generate
interface AIGenerateRequest {
  toolId: string;
  originalContent: string;
  customPrompt?: string;
  options?: {
    tone?: 'casual' | 'formal' | 'assertive';
    length?: 'shorter' | 'longer' | 'same';
    includeEmojis?: boolean;
  };
}

interface AIGenerateResponse {
  generatedContent: string;
  originalContent: string;
  toolUsed: string;
  metadata: {
    promptUsed: string;
    model: string;
    tokensUsed: number;
  };
}
```

#### Content Save Endpoint
```typescript
// POST /api/content/save
interface SaveContentRequest {
  originalTweetId: string;
  originalContent: string;
  generatedContent: string;
  toolUsed: string;
  isThread: boolean;
  threadParts?: string[];
}
```

### 3. State Management

#### Editor State
```typescript
interface EditorState {
  originalTweet: Tweet;
  currentContent: string;
  selectedTool: string | null;
  isGenerating: boolean;
  generatedResults: Map<string, string>;
  savedContent: SavedTweet[];
}
```

#### Tool State
```typescript
interface ToolState {
  isOpen: boolean;
  toolId: string;
  inputContent: string;
  outputContent: string;
  isLoading: boolean;
  error: string | null;
}
```

### 4. AI Prompt Engineering

#### Base Prompt Template
```
You are an expert social media content creator. Transform the following tweet while maintaining its core message and viral potential.

Original Tweet: "{originalContent}"
Original Metrics: {likes} likes, {retweets} retweets, {replies} replies

Task: {toolSpecificInstruction}

Requirements:
- Keep the authentic human voice
- Maintain engagement potential
- Ensure content feels natural, not AI-generated
- Preserve key message and intent
- Optimize for Twitter's algorithm

Generate only the transformed content, no explanations.
```

#### Tool-Specific Prompts
Each AI tool has customized prompts:

**Expand Tweet:**
```
Convert this tweet into a 3-4 tweet thread. Break down the main points logically, add supporting details, and create natural transitions between tweets.
```

**Make Shorter:**
```
Condense this tweet to be more concise while keeping the impact and key message. Remove unnecessary words but maintain the tone and engagement.
```

**More Casual:**
```
Rewrite this tweet in a more casual, conversational tone. Use everyday language, contractions, and a friendly approach while keeping the core message.
```

### 5. Database Schema Updates

#### Enhanced SavedTweets Table
```sql
ALTER TABLE saved_tweets ADD COLUMN IF NOT EXISTS:
- editor_session_id UUID
- generation_history JSONB
- user_edits JSONB
- final_version TEXT
- performance_metrics JSONB
```

#### New Tables
```sql
-- AI Generation History
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  original_tweet_id TEXT,
  tool_used VARCHAR(50),
  input_content TEXT,
  output_content TEXT,
  prompt_used TEXT,
  model_used VARCHAR(50),
  tokens_used INTEGER,
  generation_time INTEGER,
  user_rating INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Editor Sessions
CREATE TABLE editor_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  original_tweet_id TEXT,
  session_data JSONB,
  tools_used TEXT[],
  final_content TEXT,
  session_duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## User Experience Flow

### 1. Entry Point
1. User browses viral tweets in inspirations page
2. Finds interesting tweet with good engagement
3. Clicks "Edit Tweet" button on tweet card
4. Transitions to AI Tweet Editor interface

### 2. Editor Experience
1. Original tweet content appears in left panel composer
2. AI tools sidebar shows on right panel
3. User can immediately start editing or use AI tools
4. Real-time character count and validation

### 3. AI Tool Usage
1. User clicks desired AI tool (e.g., "Make Shorter")
2. Tool popup opens with original content pre-loaded
3. User can modify input or use as-is
4. Click "Generate" to get AI-enhanced version
5. Review generated content in output area
6. Apply to composer or regenerate if needed

### 4. Content Finalization
1. User reviews final content in composer
2. Can make manual edits after AI generation
3. Save to content library for later use
4. Copy to clipboard for immediate posting
5. Option to create thread version

## Success Metrics

### Quality Metrics
- **Human-like Score**: Content should pass AI detection tools
- **Engagement Prediction**: Maintain or improve viral potential
- **User Satisfaction**: High rating on generated content
- **Edit Rate**: Low manual editing after AI generation

### Usage Metrics
- **Tool Adoption**: Which AI tools are most popular
- **Completion Rate**: Users who complete the edit process
- **Save Rate**: Content saved to library
- **Reuse Rate**: Saved content actually used

### Performance Metrics
- **Generation Speed**: < 5 seconds for AI responses
- **API Reliability**: 99%+ success rate
- **User Retention**: Return usage of editor feature

## Implementation Priority

### Phase 1: Core Editor (Week 1)
- [ ] Add "Edit Tweet" buttons to tweet cards
- [ ] Create AI Tweet Editor page layout
- [ ] Implement basic two-panel interface
- [ ] Set up state management

### Phase 2: AI Integration (Week 1-2)
- [ ] Create AI generation API endpoint
- [ ] Implement OpenAI integration
- [ ] Build AI tool popup components
- [ ] Add prompt engineering for each tool

### Phase 3: Polish & Features (Week 2)
- [ ] Add content saving functionality
- [ ] Implement thread generation
- [ ] Add loading states and error handling
- [ ] Create content library integration

### Phase 4: Testing & Optimization (Week 3)
- [ ] Test AI output quality
- [ ] Optimize prompts for better results
- [ ] Performance testing and optimization
- [ ] User acceptance testing

## Technical Considerations

### Performance
- **Caching**: Cache AI responses for similar inputs
- **Streaming**: Stream AI responses for better UX
- **Debouncing**: Prevent rapid API calls
- **Lazy Loading**: Load tools on demand

### Security
- **Input Validation**: Sanitize all user inputs
- **Rate Limiting**: Prevent API abuse
- **Content Filtering**: Block inappropriate content
- **API Key Protection**: Secure OpenAI credentials

### Scalability
- **Queue System**: Handle high AI generation volume
- **Database Optimization**: Efficient queries for content
- **CDN**: Cache static assets
- **Monitoring**: Track API usage and costs

## Future Enhancements

### Advanced Features
- **Bulk Processing**: Edit multiple tweets at once
- **A/B Testing**: Generate multiple variations
- **Performance Tracking**: Track engagement of generated content
- **Custom Prompts**: User-defined AI instructions

### Integrations
- **Social Scheduling**: Direct posting to Twitter
- **Analytics**: Track performance of AI-generated content
- **Team Collaboration**: Share and review generated content
- **Brand Voice**: Train AI on user's writing style

This feature represents the core value proposition of TweetInspire - transforming viral content into personalized, human-like tweets that drive engagement and growth.
