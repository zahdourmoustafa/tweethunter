# TweetHunter

A powerful platform for discovering viral tweets and transforming them into personalized content using AI.

## Features

### AI Tweet Editor with Conversation Persistence

The AI Tweet Editor now supports conversation persistence, allowing you to:

1. **Resume Conversations**: When you click on an AI tool, it will automatically resume any previous conversation you had with that tool
2. **Auto-Save**: Your conversations are automatically saved as you interact with the AI
3. **Manual Save**: Click the save button to manually save your conversation and apply the content to your tweet editor
4. **Visual Indicators**: Green dots show which AI tools have conversation history
5. **Seamless Switching**: Switch between different AI tools while maintaining separate conversation histories for each

### How it Works

1. **Start a Conversation**: Click any AI tool to begin generating content
2. **Content Auto-Applies**: Generated content automatically appears in your tweet editor (right panel)
3. **Save & Continue**: Click save to persist the conversation and continue editing
4. **Switch Tools**: Click another AI tool to start or resume a different conversation
5. **Resume Anytime**: Return to any tool to continue where you left off

### Technical Implementation

- **Context State Management**: Uses React Context to manage conversation state per tool
- **Debounced Auto-Save**: Automatically saves conversations with 1-second debounce
- **Visual Feedback**: Shows auto-save status and conversation indicators
- **Persistent Storage**: Conversations are stored in the editor context and can be persisted to database

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to start using the application.
