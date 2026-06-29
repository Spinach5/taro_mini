import cacheManager from "./cache";

/**
 * Wraps an async function with cache-first logic.
 *
 * @param {string} cacheKey - Base cache key
 * @param {number} ttl - Time-to-live in milliseconds (null = no expiry)
 * @param {Function} fn - The async function to wrap
 * @param {Object} [options]
 * @param {Function} [options.keyBuilder] - (args) => suffix appended to cacheKey
 * @returns {Function} Wrapped function with .invalidate() method
 *
 * @example
 * const getUser = withCache('v1_user', 60000, async (id) => fetchUser(id), {
 *   keyBuilder: ([id]) => id,
 * });
 * const user = await getUser(123);      // cache-first
 * await getUser.invalidate([123]);       // clear cache for key "v1_user_123"
 * const fresh = await getUser(123);      // fetches from network
 */
export default function withCache(cacheKey, ttl, fn, options = {}) {
  const { keyBuilder } = options;

  const buildKey = (args) => {
    if (keyBuilder) {
      const suffix = keyBuilder(args);
      return suffix ? `${cacheKey}_${suffix}` : cacheKey;
    }
    return cacheKey;
  };

  const wrapped = async (...args) => {
    const key = buildKey(args);

    // Cache-first: return cached value if available
    const cached = cacheManager.get(key);
    if (cached) {
      console.log(`[withCache:${cacheKey}] cache hit: ${key}`);
      return cached;
    }

    // Cache miss: fetch from network
    const result = await fn(...args);

    // Store in cache with TTL
    cacheManager.set(key, result, ttl || null);
    console.log(`[withCache:${cacheKey}] cached: ${key}${ttl ? ` (ttl=${ttl}ms)` : ""}`);

    return result;
  };

  /**
   * Invalidate cached value for the given args.
   * @param {Array} args - Same args you'd pass to the wrapped function
   */
  wrapped.invalidate = (args = []) => {
    const key = buildKey(args);
    cacheManager.remove(key);
    console.log(`[withCache:${cacheKey}] invalidated: ${key}`);
  };

  /**
   * Invalidate ALL cached values with this cacheKey prefix.
   * Use after write operations (create/update/delete) to clear all pages.
   */
  wrapped.invalidateAll = () => {
    cacheManager.removeByPrefix(cacheKey);
    console.log(`[withCache:${cacheKey}] invalidated all`);
  };

  return wrapped;
}
