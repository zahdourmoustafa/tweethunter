import { AITool } from '@/lib/types/aiTools';

export const AI_TOOL_PROMPTS = {
  [AITool.ExpandTweet]: {
    system: `Expand this tweet into a compelling story while maintaining the user's authentic voice. Focus on storytelling with specific details and emotional journey.`,
    format: `Structure: Hook → Problem → Journey → Breakthrough → Results → Lessons`
  },

  [AITool.CreateHook]: {
    system: `Create attention-grabbing opening lines that stop the scroll. Focus on curiosity gaps and emotional triggers.`,
    format: `Use: Personal stakes, surprising claims, specific numbers, or contrarian takes`
  },

  [AITool.KeepWriting]: {
    system: `Continue the story naturally from where it left off. Maintain the same voice and flow.`,
    format: `Build on existing narrative with new insights or next steps`
  },

  [AITool.CopywritingTips]: {
    system: `Add psychological triggers and formatting improvements while keeping the authentic voice.`,
    format: `Enhance with: stronger verbs, emotional triggers, better formatting`
  },

  [AITool.ImproveTweet]: {
    system: `Polish the content while preserving the authentic voice. Focus on clarity and impact.`,
    format: `Refine: word choice, structure, engagement elements`
  },

  [AITool.VoiceGenerator]: {
    system: `Generate content in the exact voice of the analyzed Twitter account.`,
    format: `Match: tone, vocabulary, formatting, personality traits`
  },

  [AITool.AddEmojis]: {
    system: `Add strategic emojis that enhance emotional impact without looking unprofessional.`,
    format: `Use 1-2 emojis per section maximum, choose emojis that amplify emotion`
  },

  [AITool.MakeShorter]: {
    system: `Condense content while keeping the strongest impact. Every word must earn its place.`,
    format: `Keep essential elements, remove weak examples, maintain flow`
  },

  [AITool.CreateCTA]: {
    system: `Create authentic endings that inspire action without being pushy or salesy.`,
    format: `Make it feel like natural advice, focus on reader benefit`
  },

  [AITool.MoreAssertive]: {
    system: `Strengthen the tone with confident, decisive language while maintaining authenticity.`,
    format: `Use definitive statements, challenge beliefs, back with examples`
  },

  [AITool.MoreCasual]: {
    system: `Make content more conversational and friendly while keeping structure intact.`,
    format: `Use contractions, personal touches, direct "you" language`
  },

  [AITool.MoreFormal]: {
    system: `Elevate language professionally while maintaining storytelling power and formatting.`,
    format: `Use complete sentences, professional phrasing, data and examples`
  },

  [AITool.FixGrammar]: {
    system: `Clean up language while preserving authentic voice and storytelling flow.`,
    format: `Fix obvious errors, keep contractions, maintain conversational style`
  },

  [AITool.TweetIdeas]: {
    system: `Generate multiple angles on the same topic with different storytelling approaches.`,
    format: `Create different perspectives: personal, contrarian, data-driven, transformation`
  }
};