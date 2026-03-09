// lib/upstash-rate-limit.ts
// Production-ready rate limiting using Upstash Redis
// Replace the in-memory rate limiting for production deployment

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client (environment variables needed)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Create different rate limiters for different use cases
export const appointmentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
  analytics: true,
  prefix: 'ratelimit:appointment:',
})

export const testResponseRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 requests per hour
  analytics: true,
  prefix: 'ratelimit:test-response:',
})

export const homeworkResponseRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 h'), // 15 requests per hour
  analytics: true,
  prefix: 'ratelimit:homework-response:',
})

// Fallback in-memory rate limiting for development
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const inMemoryStore: RateLimitStore = {}

function createInMemoryRateLimit(options: { windowMs: number; maxRequests: number }) {
  const { windowMs, maxRequests } = options

  return async function rateLimit(req: Request): Promise<{ 
    success: boolean, 
    error?: string,
    headers?: Record<string, string>
  }> {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
                req.headers.get('x-real-ip') || 
                'unknown'

    const now = Date.now()
    const key = `rate_limit:${ip}`

    if (inMemoryStore[key] && now > inMemoryStore[key].resetTime) {
      delete inMemoryStore[key]
    }

    if (!inMemoryStore[key]) {
      inMemoryStore[key] = {
        count: 1,
        resetTime: now + windowMs
      }
      return { success: true }
    }

    inMemoryStore[key].count++

    if (inMemoryStore[key].count > maxRequests) {
      const resetTime = Math.ceil((inMemoryStore[key].resetTime - now) / 1000)
      return {
        success: false,
        error: `Çok fazla istek. Lütfen ${resetTime} saniye sonra tekrar deneyin.`,
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, maxRequests - inMemoryStore[key].count).toString(),
          'X-RateLimit-Reset': inMemoryStore[key].resetTime.toString()
        }
      }
    }

    return { 
      success: true,
      headers: {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - inMemoryStore[key].count).toString(),
        'X-RateLimit-Reset': inMemoryStore[key].resetTime.toString()
      }
    }
  }
}

// Export fallback rate limiters for development
export const fallbackAppointmentRateLimit = createInMemoryRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5
})

export const fallbackTestResponseRateLimit = createInMemoryRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20
})

export const fallbackHomeworkResponseRateLimit = createInMemoryRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 15
})

// Helper function to choose between production and fallback rate limiting
export async function checkRateLimit(
  req: Request, 
  rateLimiter: Ratelimit, 
  fallbackLimiter: ReturnType<typeof createInMemoryRateLimit>
) {
  // Use Upstash Redis if environment variables are available (production)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const identifier = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
    
    const result = await rateLimiter.limit(identifier)
    
    return {
      success: result.success,
      error: result.success ? undefined : 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString()
      }
    }
  }
  
  // Fallback to in-memory rate limiting for development
  return fallbackLimiter(req)
}
