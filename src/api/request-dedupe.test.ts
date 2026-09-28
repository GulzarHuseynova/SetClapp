// @vitest-environment jsdom
import axios, { type AxiosAdapter } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { createDedupedAdapter } from './request-dedupe';

const createClient = () => {
  const network = vi.fn<AxiosAdapter>(async (config) => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { data: '{"ok":true}', status: 200, statusText: 'OK', headers: {}, config };
  });
  const client = axios.create({ adapter: createDedupedAdapter(network) });
  return { client, network };
};

describe('createDedupedAdapter', () => {
  it('sends concurrent identical GET requests once and gives each caller its own data', async () => {
    const { client, network } = createClient();

    const [first, second] = await Promise.all([client.get('/api/User/1'), client.get('/api/User/1')]);

    expect(network).toHaveBeenCalledTimes(1);
    expect(first.data).toEqual({ ok: true });
    expect(second.data).toEqual({ ok: true });
    expect(first.data).not.toBe(second.data);
  });

  it('does not merge requests with different params', async () => {
    const { client, network } = createClient();

    await Promise.all([
      client.get('/api/logs', { params: { page: 1 } }),
      client.get('/api/logs', { params: { page: 2 } }),
    ]);

    expect(network).toHaveBeenCalledTimes(2);
  });

  it('sends a new request once the previous one has finished', async () => {
    const { client, network } = createClient();

    await client.get('/api/User/1');
    await client.get('/api/User/1');

    expect(network).toHaveBeenCalledTimes(2);
  });

  it('never merges write requests', async () => {
    const { client, network } = createClient();

    await Promise.all([client.post('/api/users', { a: 1 }), client.post('/api/users', { a: 1 })]);

    expect(network).toHaveBeenCalledTimes(2);
  });
});
