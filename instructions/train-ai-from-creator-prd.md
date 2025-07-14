# Product Requirements Document (PRD)
## Train AI from Creator Feature

### Document Information
- **Feature Name**: Train AI from Creator
- **Version**: 1.0
- **Date**: July 14, 2025
- **Product Manager**: [Your Name]
- **Engineering Lead**: [TBD]
- **Designer**: [TBD]

---

## 1. Executive Summary

### 1.1 Problem Statement
Users struggle to create viral tweets because they lack understanding of proven viral patterns and psychological triggers. Current AI tools generate generic content without learning from specific successful creators' viral strategies.

### 1.2 Solution Overview
A feature that allows users to input a Twitter creator's username, automatically collects their viral tweets (100k+ engagement, last 6 months), and trains a personalized AI model to generate content using those proven viral patterns.

### 1.3 Success Metrics
- **Primary**: 70% of users who complete training generate at least 3 tweets using the trained AI
- **Secondary**: 40% improvement in user-generated tweet engagement rates
- **Adoption**: 30% of active users try the feature within first month

---

## 2. User Stories & Use Cases

### 2.1 Primary User Story
**As a** content creator struggling with viral tweets  
**I want to** train AI using successful creators' viral patterns  
**So that** I can generate content with proven viral potential  

### 2.2 Detailed Use Cases

#### Use Case 1: Entrepreneur Learning from @levelsio
- User inputs "@levelsio" 
- System fetches 23 viral tweets (100k+ engagement, 6 months)
- User reviews collected tweets
- Clicks "Train AI" - system learns patterns
- User generates tweets using @levelsio's viral strategies

#### Use Case 2: Marketer Learning from @naval
- User wants philosophical/business wisdom style
- Inputs "@naval"
- AI learns concise, profound tweet patterns
- User generates wisdom-style tweets for their audience

---

## 3. Functional Requirements

### 3.1 Core Features

#### 3.1.1 Creator Input & Validation
- **Input Field**: Username input with @ symbol support
- **Validation**: Check if username exists via Twitter API
- **Error Handling**: Clear messaging for invalid/private accounts
- **Acceptance Criteria**: 
  - Accepts both "@username" and "username" formats
  - Validates username exists before proceeding
  - Shows loading state during validation

#### 3.1.2 Viral Tweet Collection
- **Data Source**: Twitter API (twitterapi.io)
- **Filters**: 
  - Last 6 months only
  - Minimum 100k total engagement (likes + retweets + replies)
  - Exclude replies (focus on original content)
- **Collection Logic**:
  - Fetch tweets in pages of 20
  - Continue until 6-month cutoff reached
  - Sort by total engagement (descending)
  - Take top 20 viral tweets
- **Acceptance Criteria**:
  - Collects maximum 20 viral tweets
  - All tweets must be within 6-month window
  - All tweets must exceed 100k engagement threshold

#### 3.1.3 Results Preview Interface
- **Tweet Display**: Show collected tweets with metrics
- **Metrics Shown**: Likes, retweets, replies, date, total engagement
- **User Actions**: 
  - Review all collected tweets
  - Optional: Remove unwanted tweets
  - Confirm dataset quality
- **Acceptance Criteria**:
  - Display all collected tweets in readable format
  - Show engagement metrics clearly
  - Allow proceeding to training phase

#### 3.1.4 AI Training Process
- **Training Engine**: OpenAI GPT-4 with custom prompts
- **Training Data**: Collected viral tweets as examples
- **Analysis Areas**:
  - Hook patterns (first 10 words)
  - Emotional triggers identification
  - Storytelling structures
  - Call-to-action patterns
  - Voice and tone analysis
  - Thread vs single tweet decisions
- **Progress Indication**: 6-step training process with visual feedback
- **Acceptance Criteria**:
  - Training takes 2-5 minutes (builds user confidence)
  - Clear progress indication throughout
  - Successful completion creates trained AI model

#### 3.1.5 Trained AI Integration
- **Integration**: Seamless connection with existing AI Tweet Editor
- **New AI Tool**: "Creator-Trained AI" appears in AI tools sidebar
- **Conversation Persistence**: Maintains separate conversation history
- **Content Generation**: Uses learned patterns for tweet generation
- **Acceptance Criteria**:
  - New AI tool appears after successful training
  - Generates content reflecting learned creator's style
  - Maintains conversation history like other AI tools

### 3.2 Technical Requirements

#### 3.2.1 Backend API Integration
- **Twitter API**: twitterapi.io integration
- **Endpoint**: GET /twitter/user/last_tweets
- **Authentication**: API key in X-API-Key header
- **Rate Limiting**: Handle API rate limits gracefully
- **Error Handling**: Comprehensive error handling for API failures

#### 3.2.2 AI Training Infrastructure
- **AI Provider**: OpenAI GPT-4
- **Training Method**: Few-shot learning with viral tweet examples
- **Model Persistence**: Store trained model parameters/prompts
- **Context Management**: Integrate with existing conversation system

#### 3.2.3 Data Storage
- **Viral Tweets**: Store collected tweets temporarily during training
- **Trained Models**: Persist AI training results per user
- **User Sessions**: Track training progress and completion status

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **Tweet Collection**: Complete within 30 seconds
- **AI Training**: Complete within 5 minutes maximum
- **Content Generation**: Maintain existing AI response times (<3 seconds)

### 4.2 Reliability
- **API Failures**: Graceful degradation with retry mechanisms
- **Training Failures**: Clear error messages and retry options
- **Data Consistency**: Ensure training data integrity

### 4.3 Scalability
- **Concurrent Users**: Support multiple users training simultaneously
- **API Limits**: Respect Twitter API rate limits
- **Storage**: Efficient storage of training data and models

### 4.4 Security
- **API Keys**: Secure storage of Twitter API credentials
- **User Data**: Protect collected tweet data and trained models
- **Rate Limiting**: Prevent abuse of training feature

---

## 5. User Experience Design

### 5.1 User Flow
```
Sidebar → "Train AI from Creator" → Username Input → 
Validation → Tweet Collection → Results Preview → 
Training Confirmation → AI Training Process → 
Training Complete → New AI Tool Available
```

### 5.2 UI Components

#### 5.2.1 Sidebar Addition
- **Location**: Below existing AI tools
- **Icon**: 📊 or 🎯
- **Label**: "Train AI from Creator"
- **Visual**: Consistent with existing sidebar styling

#### 5.2.2 Main Training Interface
- **Header**: "Train AI from Viral Creator"
- **Input Section**: 
  - Large input field for username
  - Placeholder: "Enter creator username (e.g., @levelsio)"
  - "Analyze Tweets" button
- **Results Section**: 
  - Tweet cards with engagement metrics
  - Summary: "Found 23 viral tweets with 2.3M total impressions"
  - "Train AI" button

#### 5.2.3 Training Progress Interface
- **Progress Bar**: 6-step visual progress indicator
- **Step Labels**: 
  1. "Analyzing tweet structures..."
  2. "Learning viral hooks..."
  3. "Understanding storytelling patterns..."
  4. "Identifying emotional triggers..."
  5. "Mastering voice and tone..."
  6. "Finalizing AI training..."
- **Completion**: Success message with new AI tool notification

### 5.3 Error States
- **Invalid Username**: "Username not found. Please check and try again."
- **Private Account**: "This account is private. Please try a public creator."
- **No Viral Tweets**: "No tweets found meeting viral criteria (100k+ engagement, last 6 months)."
- **API Errors**: "Unable to fetch tweets. Please try again later."
- **Training Failures**: "Training failed. Please try again or contact support."

---

## 6. Technical Architecture

### 6.1 Frontend Components
```
/pages/train-ai-creator/
├── index.tsx (main interface)
├── components/
│   ├── UsernameInput.tsx
│   ├── TweetPreview.tsx
│   ├── TrainingProgress.tsx
│   └── TrainingComplete.tsx
```

### 6.2 Backend API Endpoints
```
POST /api/train-ai/analyze-creator
├── Input: { username: string }
├── Output: { tweets: Tweet[], totalEngagement: number }

POST /api/train-ai/start-training
├── Input: { tweets: Tweet[], userId: string }
├── Output: { trainingId: string, status: 'started' }

GET /api/train-ai/training-status/:trainingId
├── Output: { status: 'in-progress' | 'completed' | 'failed', step: number }
```

### 6.3 Database Schema
```sql
-- Training Sessions
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  creator_username VARCHAR(50),
  status VARCHAR(20), -- 'collecting', 'training', 'completed', 'failed'
  tweets_collected JSONB,
  training_prompt TEXT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Trained AI Models
CREATE TABLE trained_ai_models (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  creator_username VARCHAR(50),
  model_prompt TEXT,
  training_data JSONB,
  created_at TIMESTAMP
);
```

---

## 7. Implementation Plan

### 7.1 Phase 1: Core Infrastructure (Week 1-2)
- [ ] Twitter API integration
- [ ] Basic tweet collection logic
- [ ] Database schema setup
- [ ] Backend API endpoints

### 7.2 Phase 2: UI Development (Week 2-3)
- [ ] Sidebar integration
- [ ] Username input interface
- [ ] Tweet preview components
- [ ] Training progress interface

### 7.3 Phase 3: AI Training Integration (Week 3-4)
- [ ] OpenAI integration for training
- [ ] Training prompt engineering
- [ ] Model persistence system
- [ ] Integration with existing AI tools

### 7.4 Phase 4: Testing & Polish (Week 4-5)
- [ ] End-to-end testing
- [ ] Error handling refinement
- [ ] Performance optimization
- [ ] User acceptance testing

### 7.5 Phase 5: Launch (Week 5-6)
- [ ] Production deployment
- [ ] User onboarding materials
- [ ] Analytics implementation
- [ ] Launch monitoring

---

## 8. Success Metrics & KPIs

### 8.1 Adoption Metrics
- **Feature Discovery**: % of users who click "Train AI from Creator"
- **Completion Rate**: % of users who complete full training process
- **Retention**: % of users who use trained AI after 7 days

### 8.2 Quality Metrics
- **Training Success Rate**: % of training sessions that complete successfully
- **Generated Content Quality**: User satisfaction scores for generated tweets
- **Engagement Improvement**: Before/after engagement rates for user tweets

### 8.3 Technical Metrics
- **API Success Rate**: % of successful Twitter API calls
- **Training Time**: Average time to complete AI training
- **Error Rates**: % of failed training sessions by error type

---

## 9. Risk Assessment

### 9.1 Technical Risks
- **Twitter API Changes**: Risk of API deprecation or policy changes
  - *Mitigation*: Monitor API updates, have backup data sources
- **OpenAI Rate Limits**: Risk of hitting AI training limits
  - *Mitigation*: Implement queuing system, optimize prompts
- **Training Quality**: Risk of poor AI training results
  - *Mitigation*: Extensive prompt engineering, quality validation

### 9.2 Product Risks
- **User Adoption**: Risk of low feature adoption
  - *Mitigation*: Clear onboarding, compelling use cases
- **Content Quality**: Risk of generated content being generic
  - *Mitigation*: Thorough testing with diverse creators
- **Legal/Ethical**: Risk of copyright concerns with tweet analysis
  - *Mitigation*: Use public data only, clear terms of service

### 9.3 Business Risks
- **API Costs**: Risk of high Twitter API costs
  - *Mitigation*: Usage monitoring, cost caps, efficient caching
- **Scalability**: Risk of infrastructure costs at scale
  - *Mitigation*: Efficient architecture, usage-based pricing

---

## 10. Future Enhancements

### 10.1 Version 2.0 Features
- **Multi-Creator Training**: Train AI from multiple creators simultaneously
- **Custom Filters**: User-defined engagement thresholds and time ranges
- **Training Analytics**: Detailed insights into learned patterns
- **Export/Import**: Share trained AI models between users

### 10.2 Advanced Features
- **Real-time Updates**: Continuously update training with new viral tweets
- **A/B Testing**: Test different training approaches
- **Creator Recommendations**: Suggest creators based on user's niche
- **Viral Prediction**: Score generated tweets for viral potential

---

## 11. Appendix

### 11.1 API Documentation References
- **Twitter API**: https://docs.twitterapi.io/
- **OpenAI API**: https://platform.openai.com/docs/
- **Vercel AI SDK**: https://sdk.vercel.ai/docs/

### 11.2 Competitive Analysis
- **Existing Solutions**: Generic AI writing tools (ChatGPT, Jasper)
- **Differentiation**: Creator-specific training, viral pattern learning
- **Advantage**: Personalized AI models based on proven viral content

### 11.3 User Research Insights
- **Pain Point**: Users struggle to understand what makes content viral
- **Desire**: Want to learn from successful creators they admire
- **Behavior**: Prefer AI that adapts to specific styles and patterns

---

**Document Status**: Draft v1.0  
**Next Review**: [Date]  
**Stakeholder Approval**: [ ] PM [ ] Engineering [ ] Design [ ] Legal
