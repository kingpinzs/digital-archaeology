/**
 * Polling helper for complex async conditions.
 *
 * Usage:
 *   await waitFor(() => someCondition === true);
 *   await waitFor(async () => (await fetchData()).ready, { timeout: 10000 });
 */

interface WaitForOptions {
  timeout?: number;
  interval?: number;
  message?: string;
}

export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  options: WaitForOptions = {}
): Promise<void> => {
  const { timeout = 5000, interval = 100, message = 'Condition not met' } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`${message} within ${timeout}ms`);
};

/**
 * Retry helper for flaky operations.
 *
 * Usage:
 *   const result = await retry(() => fetchData(), { attempts: 3 });
 */

interface RetryOptions {
  attempts?: number;
  delay?: number;
  backoff?: number;
}

export const retry = async <T>(
  operation: () => T | Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const { attempts = 3, delay = 100, backoff = 2 } = options;

  let lastError: Error | null = null;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }
    }
  }

  throw lastError;
};
