/**
 * Twitter-specific content formatting utilities
 */

export class ContentFormatter {
  /**
   * Clean AI-generated content while preserving authentic formatting
   */
  static cleanContent(content: string): string {
    let cleaned = content.trim();
    
    // Remove AI conversation starters
    const aiPhrases = [
      /^here's\s+/i,
      /^i'll\s+generate\s+/i,
      /^let\s+me\s+/i,
      /^here\s+is\s+/i,
      /^this\s+is\s+/i,
      /^tweet:\s*/i,
      /^generated\s+content:\s*/i,
    ];
    
    aiPhrases.forEach(phrase => {
      cleaned = cleaned.replace(phrase, '');
    });
    
    // Remove quotes if they wrap entire content
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Clean up excessive spacing but preserve intentional line breaks
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\n\s+/g, '\n');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  }

  /**
   * Format content for Twitter with proper spacing and structure
   */
  static formatForTwitter(content: string): string {
    // Ensure proper line breaks for readability
    let formatted = content;
    
    // Add strategic line breaks after sentences
    formatted = formatted.replace(/\. ([A-Z])/g, '.\n\n$1');
    formatted = formatted.replace(/\? ([A-Z])/g, '?\n\n$1');
    formatted = formatted.replace(/! ([A-Z])/g, '!\n\n$1');
    
    // Ensure proper spacing around bullet points
    formatted = formatted.replace(/\n•/g, '\n\n•');
    formatted = formatted.replace(/\n–/g, '\n\n–');
    
    return formatted;
  }

  /**
   * Split content into tweets for thread format
   */
  static splitIntoTweets(content: string, maxTweets: number = 15): string[] {
    const tweets = content.split(/\n\n(?=\d+\/)/).filter(t => t.trim());
    return tweets.slice(0, maxTweets);
  }

  /**
   * Calculate character count for Twitter
   */
  static getCharacterCount(content: string): number {
    return content.length;
  }
}