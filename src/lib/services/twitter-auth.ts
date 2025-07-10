// Twitter OAuth token management service

import { db } from '@/lib/db'
import { account, user } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export interface TwitterTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scope?: string
}

export class TwitterAuthService {
  
  // Get user's Twitter access tokens from Better-auth account table
  async getUserTwitterTokens(userId: string): Promise<TwitterTokens | null> {
    try {
      console.log('🔍 FETCHING TWITTER TOKENS:')
      console.log('   👤 User ID:', userId)
      
      const twitterAccount = await db
        .select({
          accessToken: account.accessToken,
          refreshToken: account.refreshToken,
          expiresAt: account.accessTokenExpiresAt,
          scope: account.scope,
        })
        .from(account)
        .where(
          and(
            eq(account.userId, userId),
            eq(account.providerId, 'twitter')
          )
        )
        .limit(1)

      console.log('📊 Query result count:', twitterAccount.length)

      if (!twitterAccount.length) {
        console.log('❌ No Twitter account records found for user:', userId)
        return null
      }

      if (!twitterAccount[0].accessToken) {
        console.log('❌ Twitter account found but no access token for user:', userId)
        return null
      }

      const tokens = twitterAccount[0]
      console.log('🔑 Token info:')
      console.log('   🎫 Access token exists:', !!tokens.accessToken)
      console.log('   🔄 Refresh token exists:', !!tokens.refreshToken)
      console.log('   ⏰ Expires at:', tokens.expiresAt ? tokens.expiresAt.toISOString() : 'No expiry')
      console.log('   🔒 Scope:', tokens.scope || 'No scope')
      
      // Check if token is expired
      if (tokens.expiresAt && new Date() > tokens.expiresAt) {
        console.log('⏰ Twitter token EXPIRED for user:', userId)
        console.log('   📅 Expired on:', tokens.expiresAt.toISOString())
        console.log('   📅 Current time:', new Date().toISOString())
        // TODO: Implement token refresh logic
        return null
      }

      console.log('✅ Retrieved VALID Twitter tokens for user:', userId)
      if (!tokens.accessToken) {
        console.log('❌ No valid access token found')
        return null
      }

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || undefined,
        expiresAt: tokens.expiresAt || undefined,
        scope: tokens.scope || undefined,
      }

    } catch (error) {
      console.error('❌ Error retrieving Twitter tokens:', error)
      return null
    }
  }

  // Check if user has valid Twitter tokens
  async hasValidTwitterTokens(userId: string): Promise<boolean> {
    const tokens = await this.getUserTwitterTokens(userId)
    return tokens !== null
  }

  // Get user's Twitter username from our users table
  async getUserTwitterUsername(userEmail: string): Promise<string | null> {
    try {
      const userRecord = await db
        .select({ username: user.name })
        .from(user)
        .where(eq(user.email, userEmail))
        .limit(1)

      return userRecord[0]?.username || null
    } catch (error) {
      console.error('Error getting Twitter username:', error)
      return null
    }
  }
}

// Export singleton instance
export const twitterAuthService = new TwitterAuthService() 