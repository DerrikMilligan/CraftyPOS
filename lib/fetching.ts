import { BareFetcher } from 'swr';

const headers = {
  'Accept'      : 'application/json',
  'Content-Type': 'application/json',
};

type HttpMethods = 'POST' | 'GET' | 'DELETE' | 'PUT' | 'PATCH';

const jsonFetcher = (method: HttpMethods, body: string) => {
  return async (url: string) => {
    const response = await fetch(url, { method, headers, body });
    
    if (!response.ok) {
      const error = new Error(`HTTP '${method}' to '${url}' had an error!`);
      
      // Ignoring because they suggest this https://swr.vercel.app/docs/error-handling
      // @ts-ignore
      error.info = await response.json();
      // @ts-ignore
      error.status = response.status;
      
      throw error;
    }
    
    return await response.json();
  };
};

export const getFetcher    = (data: any = undefined) => jsonFetcher('GET',    JSON.stringify(data));
export const postFetcher   = (data: any = undefined) => jsonFetcher('POST',   JSON.stringify(data));
export const deleteFetcher = (data: any = undefined) => jsonFetcher('DELETE', JSON.stringify(data));
export const putFetcher    = (data: any = undefined) => jsonFetcher('PUT',    JSON.stringify(data));
export const patchFetcher  = (data: any = undefined) => jsonFetcher('PATCH',  JSON.stringify(data));

const jsonFetch = (method: HttpMethods, url: string, body: string) => {
  return fetch(url, { method, headers, body })
    .then((res) => res.json());
}

export const jsonGet    = (url: string, data: any = undefined) => jsonFetch('GET',    url, JSON.stringify(data));
export const jsonPost   = (url: string, data: any = undefined) => jsonFetch('POST',   url, JSON.stringify(data));
export const jsonDelete = (url: string, data: any = undefined) => jsonFetch('DELETE', url, JSON.stringify(data));
export const jsonPut    = (url: string, data: any = undefined) => jsonFetch('PUT',    url, JSON.stringify(data));
export const jsonPatch  = (url: string, data: any = undefined) => jsonFetch('PATCH',  url, JSON.stringify(data));
