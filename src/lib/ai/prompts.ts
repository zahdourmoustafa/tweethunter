import { AITool } from '@/lib/types/aiTools';

export function getToolPrompt(tool: AITool, originalTweet: string): string {
  const baseInstruction = `You are an AI assistant that helps users with their tweets. The original tweet is: "${originalTweet}". Your output should mimic the original tweet's format, including length, style, and hashtags if present.`;

  switch (tool) {
    case AITool.CopywritingTips:
      return `${baseInstruction} Analyze the structure of the original tweet. Provide actionable copywriting tips, suggest strong hooks, and compelling calls-to-action to improve its virality and engagement.`;
    case AITool.KeepWriting:
      return `${baseInstruction} Continue the narrative or idea presented in the original tweet. Expand on the existing content with seamless flow, as if the original author never stopped typing.`;
    case AITool.AddEmojis:
      return `${baseInstruction} Strategically add relevant emojis to the original tweet to amplify its emotion and visual appeal without overwhelming the text.`;
    case AITool.MakeShorter:
      return `${baseInstruction} Condense the original tweet, trimming excess words while sharpening its impact. Distill the essence of the message into a more concise form.`;
    case AITool.ExpandTweet:
      return `${baseInstruction} Transform the original single tweet into an engaging thread. Break down the main idea into multiple interconnected tweets, linking ideas like chapters in a novella.`;
    case AITool.CreateHook:
      return `${baseInstruction} Craft an attention-grabbing opening line or hook for the original tweet. The hook should pull readers in, similar to a captivating "Once upon a time."`;
    case AITool.CreateCTA:
      return `${baseInstruction} Add a compelling call-to-action (CTA) to the original tweet. The CTA should urge engagement, such as replies, retweets, likes, or clicks, like a charismatic leader.`;
    case AITool.ImproveTweet:
      return `${baseInstruction} Provide general enhancements to the original tweet for clarity, conciseness, and punch. Refine the rough edges to make it a polished diamond.`;
    case AITool.MoreAssertive:
      return `${baseInstruction} Infuse the original tweet with more confidence and a stronger voice. Make the tone more direct and authoritative, like a bold orator.`;
    case AITool.MoreCasual:
      return `${baseInstruction} Relax the tone of the original tweet to be more casual and conversational. Make it feel like bantering with old friends.`;
    case AITool.MoreFormal:
      return `${baseInstruction} Elevate the language of the original tweet to polished prose. Make it suitable for a more professional or formal audience, like a professional diplomat.`;
    case AITool.FixGrammar:
      return `${baseInstruction} Correct any grammatical errors, spelling mistakes, or punctuation issues in the original tweet without altering its core meaning or soul. Ensure flawless delivery.`;
    case AITool.TweetIdeas:
      return `${baseInstruction} Generate related concepts or ideas based on the original tweet. Brainstorm new angles or follow-up content, similar to a creative brainstorming session.`;
    default:
      return `${baseInstruction} Please provide a refined version of the original tweet.`;
  }
}