// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { axiosInstance } from './client';

const sentAuthorization = async (url: string) => {
  let captured: unknown;
  await axiosInstance.get(url, {
    adapter: async (config: InternalAxiosRequestConfig) => {
      captured = config.headers.get('Authorization');
      return { data: null, status: 200, statusText: 'OK', headers: {}, config };
    },
  });
  return captured;
};

describe('axiosInstance Authorization header', () => {
  beforeEach(() => localStorage.setItem('token', 'header.payload.signature'));
  afterEach(() => localStorage.clear());

  it('attaches the token to same-origin API requests', async () => {
    expect(await sentAuthorization('/api/User/1')).toBe('Bearer header.payload.signature');
  });

  it('does not leak the token to third-party hosts', async () => {
    expect(await sentAuthorization('https://evil.example.com/photo.png')).toBeFalsy();
  });
});
