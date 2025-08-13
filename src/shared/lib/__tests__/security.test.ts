import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  RateLimiter,
  sanitizeInput,
  sanitizeHtml,
  CSRFTokenManager,
  SecureStorage,
  SessionManager,
  getBrowserFingerprint,
  SecureApiClient,
  getCSPMeta,
  validators,
  authRateLimiter,
  searchRateLimiter,
  apiRateLimiter
} from '../security';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('RateLimiter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('allows requests within limit', () => {
    const limiter = new RateLimiter(3, 1000);
    const key = 'test-endpoint';

    expect(limiter.canMakeRequest(key)).toBe(true);
    expect(limiter.canMakeRequest(key)).toBe(true);
    expect(limiter.canMakeRequest(key)).toBe(true);
  });

  test('blocks requests exceeding limit', () => {
    const limiter = new RateLimiter(2, 1000);
    const key = 'test-endpoint';

    expect(limiter.canMakeRequest(key)).toBe(true);
    expect(limiter.canMakeRequest(key)).toBe(true);
    expect(limiter.canMakeRequest(key)).toBe(false);
  });

  test('resets after time window', async () => {
    const limiter = new RateLimiter(1, 100); // 100ms window
    const key = 'test-endpoint';

    expect(limiter.canMakeRequest(key)).toBe(true);
    expect(limiter.canMakeRequest(key)).toBe(false);

    // Wait for window to pass
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(limiter.canMakeRequest(key)).toBe(true);
  });

  test('tracks different keys separately', () => {
    const limiter = new RateLimiter(1, 1000);

    expect(limiter.canMakeRequest('key1')).toBe(true);
    expect(limiter.canMakeRequest('key2')).toBe(true);
    expect(limiter.canMakeRequest('key1')).toBe(false);
    expect(limiter.canMakeRequest('key2')).toBe(false);
  });
});

describe('Input Sanitization', () => {
  test('sanitizeInput removes dangerous content', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('');
    expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello World');
    expect(sanitizeInput('Normal text')).toBe('Normal text');
    expect(sanitizeInput('Text with <img src=x onerror=alert(1)>')).toBe('Text with ');
  });

  test('sanitizeHtml allows safe HTML', () => {
    expect(sanitizeHtml('<p>Hello <strong>World</strong></p>'))
      .toBe('<p>Hello <strong>World</strong></p>');
    expect(sanitizeHtml('<script>alert("xss")</script>'))
      .toBe('');
    expect(sanitizeHtml('<a href="javascript:alert(1)">Click</a>'))
      .toBe('<a>Click</a>');
    expect(sanitizeHtml('<img src="valid.jpg" onerror="alert(1)">'))
      .toBe('<img src="valid.jpg">');
  });
});

describe('Validation', () => {
  test('validators.url validates URLs correctly', () => {
    expect(validators.url('https://example.com')).toBe(true);
    expect(validators.url('http://localhost:3000')).toBe(true);
    expect(validators.url('https://sub.domain.com/path?query=1')).toBe(true);
    expect(validators.url('javascript:alert(1)')).toBe(false);
    expect(validators.url('not a url')).toBe(false);
    expect(validators.url('')).toBe(false);
  });

  test('validators.strongPassword enforces strong passwords', () => {
    expect(validators.strongPassword('StrongP@ss123')).toBe(true);
    expect(validators.strongPassword('weak')).toBe(false);
    expect(validators.strongPassword('NoNumbers!')).toBe(false);
    expect(validators.strongPassword('NoSpecial123')).toBe(false);
    expect(validators.strongPassword('nouppercas3!')).toBe(false);
    expect(validators.strongPassword('NOLOWERCASE123!')).toBe(false);
  });

  test('validators.email validates emails', () => {
    expect(validators.email('test@example.com')).toBe(true);
    expect(validators.email('user.name@domain.co.uk')).toBe(true);
    expect(validators.email('invalid.email')).toBe(false);
    expect(validators.email('@example.com')).toBe(false);
    expect(validators.email('test@')).toBe(false);
  });

  test('validators.phone validates phone numbers', () => {
    expect(validators.phone('+1234567890')).toBe(true);
    expect(validators.phone('123-456-7890')).toBe(true);
    expect(validators.phone('(123) 456-7890')).toBe(true);
    expect(validators.phone('123')).toBe(false);
    expect(validators.phone('abc-def-ghij')).toBe(false);
  });
});

describe('CSRF Protection', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('generates unique CSRF tokens', () => {
    const token1 = CSRFTokenManager.generateToken();
    const token2 = CSRFTokenManager.generateToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  test('validates CSRF tokens correctly', () => {
    const token = CSRFTokenManager.generateToken();
    
    expect(CSRFTokenManager.validateToken(token)).toBe(true);
    expect(CSRFTokenManager.validateToken('invalid-token')).toBe(false);
    expect(CSRFTokenManager.validateToken('')).toBe(false);
  });

  test('persists token in session storage', () => {
    const token = CSRFTokenManager.generateToken();
    const storedToken = CSRFTokenManager.getToken();
    
    expect(storedToken).toBe(token);
  });
});

describe('SecureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('stores and retrieves unencrypted data', () => {
    SecureStorage.setItem('test-key', { value: 'test' });
    expect(SecureStorage.getItem('test-key')).toEqual({ value: 'test' });
  });

  test('stores and retrieves encrypted data', () => {
    const data = { sensitive: 'information' };
    SecureStorage.setItem('secure-key', data, true);
    
    const retrieved = SecureStorage.getItem('secure-key', true);
    expect(retrieved).toEqual(data);
    
    // Check that raw storage is encrypted
    const raw = localStorage.getItem('secure-key');
    expect(raw).toBeTruthy();
    expect(raw).not.toContain('information');
  });

  test('removes items', () => {
    SecureStorage.setItem('remove-me', 'data');
    expect(SecureStorage.getItem('remove-me')).toBe('data');
    
    SecureStorage.removeItem('remove-me');
    expect(SecureStorage.getItem('remove-me')).toBeNull();
  });

  test('handles invalid encrypted data', () => {
    localStorage.setItem('corrupt-key', 'invalid-base64-data');
    expect(SecureStorage.getItem('corrupt-key', true)).toBeNull();
  });
});

describe('SessionManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('initializes session', () => {
    const onTimeout = vi.fn();
    const onWarning = vi.fn();
    
    SessionManager.startSession(
      30 * 60 * 1000, // 30 minutes
      onTimeout,
      onWarning
    );

    expect(onTimeout).not.toHaveBeenCalled();
    expect(onWarning).not.toHaveBeenCalled();
  });

  test('triggers warning before timeout', () => {
    const onTimeout = vi.fn();
    const onWarning = vi.fn();
    
    // Use a longer timeout to ensure warning logic works
    SessionManager.startSession(
      10 * 60 * 1000, // 10 minutes
      onTimeout,
      onWarning
    );
    
    // Advance to warning time (10min - 5min warning = 5min)
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  test('triggers timeout', () => {
    const onTimeout = vi.fn();
    const onWarning = vi.fn();
    
    SessionManager.startSession(
      10000, // 10 seconds
      onTimeout,
      onWarning
    );
    
    // Advance to timeout
    vi.advanceTimersByTime(10000);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  test('clears session', () => {
    const onTimeout = vi.fn();
    
    SessionManager.startSession(10000, onTimeout);
    SessionManager.clearSession();
    
    // Advance past timeout
    vi.advanceTimersByTime(15000);
    expect(onTimeout).not.toHaveBeenCalled();
  });
});

describe('Browser Fingerprinting', () => {
  test('generates consistent fingerprint', async () => {
    const fingerprint1 = await getBrowserFingerprint();
    const fingerprint2 = await getBrowserFingerprint();
    
    expect(fingerprint1).toBe(fingerprint2);
    expect(fingerprint1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
  });
});

describe('Secure API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('includes security headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    global.fetch = mockFetch;

    await SecureApiClient.fetch('http://localhost:3000/api/test', { method: 'POST' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/test',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        headers: expect.objectContaining({
          'X-CSRF-Token': expect.any(String),
          'X-Requested-With': 'XMLHttpRequest'
        })
      })
    );
  });

  test('respects rate limits', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    global.fetch = mockFetch;
    
    // Create a fresh rate limiter for this test
    const testRateLimiter = new RateLimiter(2, 1000); // 2 requests per second
    const originalCanMakeRequest = apiRateLimiter.canMakeRequest;
    
    // Mock the rate limiter to use our test limiter
    let callCount = 0;
    apiRateLimiter.canMakeRequest = (endpoint: string) => {
      callCount++;
      return callCount <= 2; // Allow first 2 calls, deny the 3rd
    };
    
    // Make requests up to limit
    await SecureApiClient.fetch('http://localhost:3000/api/test');
    await SecureApiClient.fetch('http://localhost:3000/api/test');
    
    // Next request should fail
    await expect(SecureApiClient.fetch('http://localhost:3000/api/test')).rejects.toThrow('Rate limit exceeded');
    
    // Restore original method
    apiRateLimiter.canMakeRequest = originalCanMakeRequest;
  });
});

describe('Content Security Policy', () => {
  test('generates appropriate CSP meta', () => {
    const csp = getCSPMeta();
    
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(csp).toContain("connect-src 'self' https://*.supabase.co");
    expect(csp).toContain("img-src 'self' data: https: blob:");
    expect(csp).toContain("object-src 'none'");
  });
});

describe('Rate Limiters', () => {
  test('auth rate limiter has correct configuration', () => {
    // Auth limiter: 5 attempts per 15 minutes
    for (let i = 0; i < 5; i++) {
      expect(authRateLimiter.canMakeRequest('/auth/login')).toBe(true);
    }
    expect(authRateLimiter.canMakeRequest('/auth/login')).toBe(false);
  });

  test('search rate limiter has correct configuration', () => {
    // Search limiter: 30 searches per minute
    for (let i = 0; i < 30; i++) {
      expect(searchRateLimiter.canMakeRequest('/search')).toBe(true);
    }
    expect(searchRateLimiter.canMakeRequest('/search')).toBe(false);
  });
});