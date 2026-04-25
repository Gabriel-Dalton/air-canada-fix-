import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add a key from https://console.anthropic.com/.",
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

// Sonnet 4.6 is the right call for a customer-facing chat workload — best
// speed/intelligence balance, 64K output. Override via env if you want to
// pitch the demo on Opus for max polish.
export const MODEL = process.env.AC_COPILOT_MODEL ?? "claude-sonnet-4-6";
