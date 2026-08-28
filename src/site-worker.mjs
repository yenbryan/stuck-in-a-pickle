/**
 * Thin Cloudflare Workers entry point used only by OpenAI Sites hosting.
 * The publication itself remains a fully prerendered static site in dist/client.
 */
export default {
  async fetch(request, env) {
    if (!env.ASSETS) {
      return new Response('Static asset binding unavailable.', { status: 503 });
    }

    return env.ASSETS.fetch(request);
  },
};
