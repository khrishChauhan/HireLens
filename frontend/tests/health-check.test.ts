/**
 * Test Suite for HireLens Backend Health Check Client
 *
 * Verifies:
 * 1. Connectivity checking against the centralized API_BASE_URL.
 * 2. Proper handling of healthy 200 responses.
 * 3. Graceful error throwing on non-200 HTTP responses.
 * 4. Graceful error throwing on network exceptions.
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { checkBackendHealth, API_BASE_URL } from '../src/lib/api.ts';

describe('HireLens Backend Health Check Tests', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should verify API_BASE_URL is defined and defaults safely without trailing slash', () => {
    assert.ok(API_BASE_URL);
    assert.ok(typeof API_BASE_URL === 'string');
    assert.ok(API_BASE_URL.startsWith('http'));
    assert.ok(!API_BASE_URL.endsWith('/'), 'API_BASE_URL must not contain trailing slashes');
  });

  it('should ensure endpoint paths do not contain double slashes', () => {
    const healthUrl = `${API_BASE_URL}/health`;
    assert.ok(!healthUrl.includes('//health'), 'Health URL must not contain double slashes');
    const extractUrl = `${API_BASE_URL}/api/resumes/extract`;
    assert.ok(!extractUrl.includes('//api/'), 'Extract URL must not contain double slashes');
  });

  it('should return service and status on successful 200 response', async () => {
    let requestedUrl = '';
    globalThis.fetch = async (input: RequestInfo | URL) => {
      requestedUrl = input.toString();
      return new Response(
        JSON.stringify({ status: 'healthy', service: 'HireLens backend' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const data = await checkBackendHealth();
    assert.strictEqual(data.status, 'healthy');
    assert.strictEqual(data.service, 'HireLens backend');
    assert.strictEqual(requestedUrl, `${API_BASE_URL}/health`);
  });

  it('should throw an error when backend returns non-200 status', async () => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({ error: 'Service Unavailable' }),
        { status: 503 }
      );
    };

    await assert.rejects(
      async () => {
        await checkBackendHealth();
      },
      (err: Error) => {
        assert.ok(err.message.includes('Health check failed with status 503'));
        return true;
      }
    );
  });

  it('should throw an error when fetch encounters a network failure', async () => {
    globalThis.fetch = async () => {
      throw new Error('ECONNREFUSED');
    };

    await assert.rejects(
      async () => {
        await checkBackendHealth();
      },
      (err: Error) => {
        assert.ok(err.message.includes('Backend is currently offline or unreachable'));
        return true;
      }
    );
  });
});
