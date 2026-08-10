import { vi } from "vitest";

interface Route {
  badJson?: boolean;
  json?: unknown;
  reject?: boolean;
  status?: number;
}

/**
 * Stub global fetch with a URL-substring → response map.
 * The first route whose key is a substring of the requested URL wins.
 */
export function mockFetch(routes: Record<string, Route>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const match = Object.entries(routes).find(([key]) => url.includes(key));
      if (!match) {
        return { json: async () => ({}), ok: false, status: 404 } as Response;
      }
      const [, route] = match;
      if (route.reject) {
        throw new Error("network down");
      }
      const status = route.status ?? 200;
      return {
        json: () => {
          if (route.badJson) {
            throw new SyntaxError("Unexpected token");
          }
          return route.json ?? {};
        },
        ok: status >= 200 && status < 300,
        status,
      } as Response;
    })
  );
}
