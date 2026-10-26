const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs `fn`, retrying only errors that say they are retryable, with
// exponential backoff (400ms, 800ms, ...). Safe ONLY for operations that are
// idempotent (reads, or writes that carry an Idempotency-Key).
export async function withRetry(fn, { attempts = 3, baseDelayMs = 400 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt >= attempts - 1;
      if (!err.retryable || isLast) throw err;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
}
