import type { ContentfulStatusCode } from "hono/utils/http-status";

export class ProviderError extends Error {
  constructor(
    public status: ContentfulStatusCode,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function providerJson(
  url: string | URL,
  provider: string,
  init: RequestInit,
): Promise<unknown> {
  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      await response.body?.cancel();
      if (provider === "NASA" && response.status === 404)
        throw new ProviderError(
          404,
          "not_found",
          "NASA could not find this picture.",
        );
      throw new ProviderError(
        502,
        "provider_error",
        `${provider} could not complete the request. Please try again later.`,
      );
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (init.signal?.aborted)
      throw new ProviderError(
        504,
        "provider_timeout",
        `${provider} took too long to respond. Please try again later.`,
      );
    throw new ProviderError(
      502,
      "provider_error",
      `${provider} is unavailable or returned an invalid response. Please try again later.`,
    );
  }
}
