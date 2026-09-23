import { describe, expect, it, vi } from 'vitest';
import { createRefreshManager } from './axiosInstance';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('access-token refresh manager', () => {
  it('shares one in-flight refresh across concurrent requests', async () => {
    const pending = deferred<string>();
    const requestAccessToken = vi.fn(() => pending.promise);
    const onAccessTokenRefreshed = vi.fn();
    const onSessionExpired = vi.fn();
    const refresh = createRefreshManager({
      requestAccessToken,
      onAccessTokenRefreshed,
      onSessionExpired,
    });

    const first = refresh();
    const second = refresh();
    pending.resolve('new-token');

    await expect(Promise.all([first, second])).resolves.toEqual([
      'new-token',
      'new-token',
    ]);
    expect(requestAccessToken).toHaveBeenCalledTimes(1);
    expect(onAccessTokenRefreshed).toHaveBeenCalledOnce();
    expect(onAccessTokenRefreshed).toHaveBeenCalledWith('new-token');
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('rejects every waiter and expires the session once when refresh fails', async () => {
    const pending = deferred<string>();
    const requestAccessToken = vi.fn(() => pending.promise);
    const onSessionExpired = vi.fn();
    const refresh = createRefreshManager({
      requestAccessToken,
      onAccessTokenRefreshed: vi.fn(),
      onSessionExpired,
    });

    const first = refresh();
    const second = refresh();
    pending.reject(new Error('refresh rejected'));

    const results = await Promise.allSettled([first, second]);
    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(requestAccessToken).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });
});

