/**
 * Rate Limiter
 * Controls request rate with concurrency limits, delays, and 429 handling
 */

/**
 * Wait for a specified duration
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate Limiter class with token bucket algorithm
 */
class RateLimiter {
  constructor(options = {}) {
    this.requestsPerSecond = options.requestsPerSecond || 5;
    this.maxConcurrent = options.maxConcurrent || 3;
    this.delayBetweenRequests = options.delayBetweenRequests || 200;
    this.retryOn429 = options.retryOn429 !== false;
    this.maxRetries = options.maxRetries || 3;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    
    this.activeRequests = 0;
    this.lastRequestTime = 0;
    this.queue = [];
    this.stats = {
      totalRequests: 0,
      rateLimited: 0,
      retries: 0,
      queued: 0,
      maxQueueSize: 0
    };
  }
  
  /**
   * Get current statistics
   * @returns {Object} Stats object
   */
  getStats() {
    return {
      ...this.stats,
      activeRequests: this.activeRequests,
      queuedRequests: this.queue.length
    };
  }
  
  /**
   * Acquire permission to make a request
   * Waits if rate limit or concurrency limit would be exceeded
   * @returns {Promise<void>}
   */
  async acquire() {
    // Wait if at max concurrent
    while (this.activeRequests >= this.maxConcurrent) {
      await wait(50);
    }
    
    // Enforce minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.delayBetweenRequests) {
      await wait(this.delayBetweenRequests - timeSinceLastRequest);
    }
    
    // Enforce requests per second limit
    if (this.requestsPerSecond > 0) {
      const minInterval = 1000 / this.requestsPerSecond;
      const interval = Date.now() - this.lastRequestTime;
      
      if (interval < minInterval) {
        await wait(minInterval - interval);
      }
    }
    
    this.activeRequests++;
    this.lastRequestTime = Date.now();
    this.stats.totalRequests++;
  }
  
  /**
   * Release a request slot
   */
  release() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }
  
  /**
   * Execute a request with rate limiting and retry logic
   * @param {Function} requestFn - Async function that makes the request
   * @returns {Promise<Object>} Request result
   */
  async execute(requestFn) {
    await this.acquire();
    
    try {
      return await this.executeWithRetry(requestFn);
    } finally {
      this.release();
    }
  }
  
  /**
   * Execute request with automatic retry on 429
   * @param {Function} requestFn - Async function that makes the request
   * @returns {Promise<Object>} Request result
   */
  async executeWithRetry(requestFn) {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const result = await requestFn();
      
      // Check for rate limit response
      if (result.response?.status === 429 && this.retryOn429 && attempt < this.maxRetries) {
        this.stats.rateLimited++;
        this.stats.retries++;
        
        // Calculate backoff delay
        const retryAfter = this.getRetryAfter(result.response);
        const backoffDelay = retryAfter || 
          (this.delayBetweenRequests * Math.pow(this.backoffMultiplier, attempt + 1));
        
        console.log(`Rate limited (429). Retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
        await wait(backoffDelay);
        continue;
      }
      
      return result;
    }
    
    // Return last result if max retries exceeded
    return requestFn();
  }
  
  /**
   * Get retry delay from response headers
   * @param {Object} response - HTTP response
   * @returns {number|null} Retry delay in ms or null
   */
  getRetryAfter(response) {
    if (!response?.headers) return null;
    
    const retryAfter = response.headers['retry-after'];
    if (!retryAfter) return null;
    
    // Retry-After can be seconds or HTTP date
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }
    
    // Try parsing as date
    const date = new Date(retryAfter);
    if (!isNaN(date.getTime())) {
      return Math.max(0, date.getTime() - Date.now());
    }
    
    return null;
  }
  
  /**
   * Execute multiple requests with rate limiting
   * @param {Function[]} requestFns - Array of async request functions
   * @param {Function} onProgress - Progress callback (index, total, result)
   * @returns {Promise<Object[]>} Array of results
   */
  async executeAll(requestFns, onProgress = null) {
    const results = [];
    const total = requestFns.length;
    
    for (let i = 0; i < requestFns.length; i++) {
      const result = await this.execute(requestFns[i]);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, total, result);
      }
    }
    
    return results;
  }
  
  /**
   * Execute requests in batches with concurrency control
   * @param {Function[]} requestFns - Array of async request functions
   * @param {Object} options - Batch options
   * @returns {Promise<Object[]>} Array of results
   */
  async executeBatch(requestFns, options = {}) {
    const { onProgress, onResult } = options;
    const results = [];
    const total = requestFns.length;
    let completed = 0;
    
    // Create promise queue
    const executing = [];
    
    for (const requestFn of requestFns) {
      const promise = this.execute(requestFn).then(result => {
        completed++;
        results.push(result);
        
        if (onResult) {
          onResult(result, completed, total);
        }
        
        if (onProgress) {
          onProgress(completed, total);
        }
        
        return result;
      });
      
      executing.push(promise);
      
      // If at max concurrent, wait for one to complete
      if (executing.length >= this.maxConcurrent) {
        await Promise.race(executing);
        // Remove completed promises
        for (let i = executing.length - 1; i >= 0; i--) {
          // Check if promise is settled (hacky but works)
          const settled = await Promise.race([
            executing[i].then(() => true),
            Promise.resolve(false)
          ]);
          if (settled) {
            executing.splice(i, 1);
          }
        }
      }
    }
    
    // Wait for all remaining requests
    await Promise.all(executing);
    
    return results;
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      rateLimited: 0,
      retries: 0,
      queued: 0,
      maxQueueSize: 0
    };
  }
  
  /**
   * Update rate limit settings
   * @param {Object} options - New options
   */
  updateSettings(options) {
    if (options.requestsPerSecond !== undefined) {
      this.requestsPerSecond = options.requestsPerSecond;
    }
    if (options.maxConcurrent !== undefined) {
      this.maxConcurrent = options.maxConcurrent;
    }
    if (options.delayBetweenRequests !== undefined) {
      this.delayBetweenRequests = options.delayBetweenRequests;
    }
    if (options.retryOn429 !== undefined) {
      this.retryOn429 = options.retryOn429;
    }
    if (options.maxRetries !== undefined) {
      this.maxRetries = options.maxRetries;
    }
    if (options.backoffMultiplier !== undefined) {
      this.backoffMultiplier = options.backoffMultiplier;
    }
  }
}

// Preset configurations
const PRESETS = {
  conservative: {
    requestsPerSecond: 2,
    maxConcurrent: 1,
    delayBetweenRequests: 500
  },
  normal: {
    requestsPerSecond: 5,
    maxConcurrent: 3,
    delayBetweenRequests: 200
  },
  aggressive: {
    requestsPerSecond: 20,
    maxConcurrent: 10,
    delayBetweenRequests: 50
  },
  sequential: {
    requestsPerSecond: 1,
    maxConcurrent: 1,
    delayBetweenRequests: 1000
  }
};

/**
 * Create a rate limiter with preset configuration
 * @param {string} preset - Preset name
 * @param {Object} overrides - Override options
 * @returns {RateLimiter} Rate limiter instance
 */
function createRateLimiter(preset = 'normal', overrides = {}) {
  const presetConfig = PRESETS[preset] || PRESETS.normal;
  return new RateLimiter({ ...presetConfig, ...overrides });
}

module.exports = {
  RateLimiter,
  createRateLimiter,
  PRESETS,
  wait
};
