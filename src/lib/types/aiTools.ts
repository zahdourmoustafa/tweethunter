
export enum AITool {
  CopywritingTips = "copywriting-tips",
  KeepWriting = "keep-writing",
  AddEmojis = "add-emojis",
  MakeShorter = "make-shorter",
  ExpandTweet = "expand-tweet",
  CreateHook = "create-hook",
  CreateCTA = "create-cta",
  ImproveTweet = "improve-tweet",
  MoreAssertive = "more-assertive",
  MoreCasual = "more-casual",
  MoreFormal = "more-formal",
  FixGrammar = "fix-grammar",
  TweetIdeas = "tweet-ideas",
  VoiceGenerator = "voice-generator",
}

export enum ContentType {
  Tweet = "tweet",
  Thread = "thread",
}

export interface VoiceGeneratorOptions {
  contentType: ContentType;
  voiceModelId: string;
}
