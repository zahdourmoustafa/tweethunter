/**
 * Voice Model Caching Service
 * Provides in-memory caching for voice models to improve performance
 */

import { type VoiceModel } from '@/db/schema';
import { type VoiceAnalysis } from './voice-analysis';

interface CachedVoiceModel {
  model: VoiceModel;
  cachedAt: number;
  accessCount: number;
  lastAccessed: number;
}

export class VoiceCacheService {
  private cache = new Map<string, CachedVoiceModel>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached models

  /**
   * Get voice model from cache or return null if not cached/expired
   */
  get(voiceModelId: string): VoiceModel | null {
    const cached = this.cache.get(voiceModelId);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.cachedAt > this.CACHE_TTL) {
      this.cache.delete(voiceModelId);
      return null;
    }

    // Update access statistics
    cached.accessCount++;
    cached.lastAccessed = Date.now();

    return cached.model;
  }

  /**
   * Store voice model in cache
   */
  set(voiceModel: VoiceModel): void {
    // Ensure cache doesn't exceed max size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(voiceModel.id, {
      model: voiceModel,
      cachedAt: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Remove voice model from cache
   */
  delete(voiceModelId: string): void {
    this.cache.delete(voiceModelId);
  }

  /**
   * Clear all cached voice models for a user
   */
  clearUserCache(userId: string): void {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.model.userId === userId) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    mostAccessed: Array<{ id: string; username: string; accessCount: number }>;
  } {
    const models = Array.from(this.cache.values());
    const totalAccesses = models.reduce((sum, model) => sum + model.accessCount, 0);
    
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: totalAccesses > 0 ? (models.length / totalAccesses) * 100 : 0,
      mostAccessed: models
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 5)
        .map(cached => ({
          id: cached.model.id,
          username: cached.model.twitterUsername,
          accessCount: cached.accessCount,
        })),
    };
  }

  /**
   * Evict least recently used cache entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, cached] of this.cache.entries()) {
      if (cached.lastAccessed < oldestTime) {
        oldestTime = cached.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Preload frequently used voice models
   */
  async preloadPopularModels(models: VoiceModel[]): Promise<void> {
    // Sort by last analyzed date (more recent = more likely to be used)
    const sortedModels = models
      .filter(model => model.lastAnalyzedAt)
      .sort((a, b) => {
        const dateA = a.lastAnalyzedAt ? new Date(a.lastAnalyzedAt).getTime() : 0;
        const dateB = b.lastAnalyzedAt ? new Date(b.lastAnalyzedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 20); // Preload top 20 most recent models

    for (const model of sortedModels) {
      this.set(model);
    }
  }

  /**
   * Check if voice model needs refresh based on age
   */
  needsRefresh(voiceModel: VoiceModel): boolean {
    if (!voiceModel.lastAnalyzedAt) {
      return true;
    }

    const daysSinceAnalysis = (Date.now() - new Date(voiceModel.lastAnalyzedAt).getTime()) / (1000 * 60 * 60 * 24);
    
    // Refresh if older than 7 days
    return daysSinceAnalysis > 7;
  }

  /**
   * Get voice models that need refresh
   */
  getModelsNeedingRefresh(models: VoiceModel[]): VoiceModel[] {
    return models.filter(model => this.needsRefresh(model));
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): number {
    let clearedCount = 0;
    const now = Date.now();

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.cachedAt > this.CACHE_TTL) {
        this.cache.delete(key);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  /**
   * Validate voice analysis data quality
   */
  validateAnalysisQuality(analysis: VoiceAnalysis): {
    isValid: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    // Check if essential fields are populated
    if (!analysis.writingStyle.tone || analysis.writingStyle.tone.length === 0) {
      issues.push('Missing tone analysis');
      score -= 20;
    }

    if (!analysis.contentPatterns.openingHooks || analysis.contentPatterns.openingHooks.length === 0) {
      issues.push('Missing opening hooks');
      score -= 15;
    }

    if (!analysis.vocabulary.commonWords || analysis.vocabulary.commonWords.length === 0) {
      issues.push('Missing vocabulary analysis');
      score -= 15;
    }

    if (analysis.tweetStructure.averageLength === 0) {
      issues.push('Invalid tweet structure analysis');
      score -= 10;
    }

    // Check for reasonable values
    if (analysis.writingStyle.formalityLevel < 1 || analysis.writingStyle.formalityLevel > 10) {
      issues.push('Invalid formality level');
      score -= 10;
    }

    if (analysis.writingStyle.humorLevel < 1 || analysis.writingStyle.humorLevel > 10) {
      issues.push('Invalid humor level');
      score -= 10;
    }

    return {
      isValid: score >= 60, // Minimum 60% quality score
      score,
      issues,
    };
  }
}

// Export singleton instance
export const voiceCacheService = new VoiceCacheService();
