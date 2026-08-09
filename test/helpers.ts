import { vi } from "vitest";

interface Route {
  status?: number;
  json?: unknown;
  reject?: boolean;
  badJson?: boolean;
}

/**
 * Stub global fetch with a URL-substring → response map.
 * The first route whose key is a substring of the requested URL wins.
 */
export function mockFetch(routes: Record<string, Route>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const match = Object.entries(routes).find(([key]) => url.includes(key));
      if (!match) {
        return { ok: false, status: 404, json: async () => ({}) } as Response;
      }
      const route = match[1];
      if (route.reject) throw new Error("network down");
      const status = route.status ?? 200;
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => {
          if (route.badJson) throw new SyntaxError("Unexpected token");
          return route.json ?? {};
        },
      } as Response;
    }),
  );
}
