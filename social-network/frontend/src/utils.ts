import { cookies } from 'next/headers';

//Fetch function to automatically send httpOnly session cookie to the backend server. Use this inside server side components
export async function authedFetch(
  url: string,
  method: string = 'GET',
  content: string | FormData | undefined = undefined,
  cache: string = "default"
) {
  const sessionCookie = cookies().get('session');
  const options: any = {
    method: method,
    headers: {
      Cookie: `${sessionCookie?.name}=${sessionCookie?.value}`,
    }, cache: cache
  };
  if (content) {
    options['body'] = content;
  }
  return await fetch(url, options);
}
export function buildUrl(
  baseUrl: string,
  queryParams: Record<string, string>
): string {
  const queryString = Object.keys(queryParams)
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`
    )
    .join('&');

  // Check if the base URL already contains a query string
  const separator = baseUrl.includes('?') ? '&' : '?';

  // Combine the base URL and the query string
  return `${baseUrl}${separator}${queryString}`;
}
