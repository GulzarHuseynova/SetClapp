import axios, { type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

// Açar tam URL (baseURL + params), cavab tipi və token-dən ibarətdir:
// fərqli istifadəçilərin və ya fərqli formatların sorğuları birləşdirilmir.
const buildRequestKey = (config: InternalAxiosRequestConfig) => [
  axios.getUri(config),
  config.responseType || 'json',
  String(config.headers.get('Authorization') ?? ''),
].join('|');


export const createDedupedAdapter = (baseAdapter: AxiosAdapter): AxiosAdapter => {
  const inFlight = new Map<string, Promise<AxiosResponse>>();

  return (config) => {
    if ((config.method || 'get').toLowerCase() !== 'get') return baseAdapter(config);

    const key = buildRequestKey(config);
    let request = inFlight.get(key);

    if (!request) {
      request = baseAdapter(config).finally(() => inFlight.delete(key));
      inFlight.set(key, request);
    }
    return request.then((response) => ({ ...response, config }));
  };
};
