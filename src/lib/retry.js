const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
