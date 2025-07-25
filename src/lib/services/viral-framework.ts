/**
 * Viral content generation frameworks
 */

export class ViralFramework {
  /**
   * Build struggle-to-success narrative
   */
  static buildStruggleToSuccess(idea: string, category: string, tone: string): string {
    return `I spent months trying to ${idea} and got nowhere...

Here's what actually happened:

• Tried [common approach] - failed because [specific reason]
• Attempted [alternative method] - got [negative result]
• Almost quit when [breaking point]

The breakthrough came when [specific insight]

Results after switching:
- [Metric 1]: [before] → [after]
- [Metric 2]: [before] → [after]

The lesson? [Key insight] - start with [specific action], not [common mistake]`;
  }

  /**
   * Create educational content framework
   */
  static buildEducational(idea: string): string {
    return `Most people think [common belief about ${idea}]...

Here's what actually works:

• Step 1: [concrete action] → [why it matters]
• Step 2: [concrete action] → [what to watch for]
• Step 3: [concrete action] → [common mistake to avoid]

Real example: When I applied this to [specific situation], [specific outcome]

→ The part everyone gets wrong about ${idea}`;
  }

  /**
   * Create hook variations
   */
  static createHooks(topic: string): string[] {
    return [
      `The ${topic} mistake that cost me 3 months...`,
      `Everyone thinks ${topic} works like this, but...`,
      `I almost quit ${topic} until this happened...`,
      `Here's what nobody tells you about ${topic}...`,
      `The ${topic} framework that changed everything...`
    ];
  }

  /**
   * Format for specific content type
   */
  static formatForType(content: string, type: 'thread' | 'tweet' | 'long-tweet' | 'short-tweet'): string {
    switch (type) {
      case 'thread':
        return this.formatAsThread(content);
      case 'tweet':
        return this.formatAsTweet(content);
      case 'long-tweet':
        return this.formatAsLongTweet(content);
      case 'short-tweet':
        return this.formatAsShortTweet(content);
      default:
        return content;
    }
  }

  private static formatAsThread(content: string): string {
    return content; // Thread formatting handled by caller
  }

  private static formatAsTweet(content: string): string {
    return content.substring(0, 280);
  }

  private static formatAsLongTweet(content: string): string {
    return content.substring(0, 500);
  }

  private static formatAsShortTweet(content: string): string {
    return content.substring(0, 150);
  }
}