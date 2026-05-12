// One-shot backfill for the AI program-guide cache.
//
// Iterates active rows in `programs` that have no row in `program_guides`,
// calls the Anthropic API directly (same model + prompts as the live
// app/api/programs/guide route POST handler), and upserts the parsed
// content into program_guides. Resumable — running it twice skips
// already-cached slugs.
//
// Usage:
//   set -a; . ./.env.local; set +a
//   NODE_OPTIONS=--use-system-ca node --no-warnings scripts/warm-guide-cache.mjs
//
// Surfaces total cost (using current Claude Haiku 4.5 published pricing)
// after the run completes.

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Claude Haiku 4.5 published pricing ($ per token).
const PRICING = {
  input:       1.00 / 1_000_000,
  output:      5.00 / 1_000_000,
  cacheWrite:  1.25 / 1_000_000,
  cacheRead:   0.10 / 1_000_000,
};

// Mirror app/api/programs/guide/route.ts:SYSTEM_PROMPT exactly. If the
// route's prompt changes, change this too.
const SYSTEM_PROMPT = `You are a benefits navigator helping Americans — especially seniors, veterans, and low-income families — understand government assistance programs. Write in plain, warm, conversational English. Avoid jargon. Use short sentences. Assume the reader may be over 65 or not tech-savvy. Be specific and actionable.

You will be given information about a specific government benefit program and asked to generate 6 helpful sections in a structured text format.`;

function buildUserPrompt(p) {
  return `Generate a practical guide for the following government benefit program. Output plain text using EXACTLY these section markers on their own line, in this order. Do not add any other text before, between, or after the sections.

Program: ${p.name}
Category: ${p.category}
Description: ${p.description}
Who qualifies: ${p.who_qualifies}
Potential benefit: ${p.potential_benefit}
Phone number: ${p.phone_number}
Apply URL: ${p.apply_url}

Output format (use these exact markers):

[callScript]
A word-for-word phone script (3-5 sentences) the person can read when they call.

[documents]
• Document one
• Document two
• Document three
• Document four
• Document five

[denialReasons]
• Reason one
• Reason two
• Reason three
• Reason four

[afterApplying]
2-3 sentences describing what happens next, typical wait times, and how they'll be notified.

[ifDenied]
2-3 sentences on their right to appeal, how long they have, and who to contact.

[proTips]
• Tip one
• Tip two
• Tip three`;
}

const LIST_SECTIONS = new Set(["documents", "denialReasons", "proTips"]);
const SECTION_MARKERS = {
  "[callScript]":    "callScript",
  "[documents]":     "documents",
  "[denialReasons]": "denialReasons",
  "[afterApplying]": "afterApplying",
  "[ifDenied]":      "ifDenied",
  "[proTips]":       "proTips",
};

function parseResponse(text) {
  const parsed = {};
  let currentSection = null;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const markerKey = SECTION_MARKERS[trimmed];
    if (markerKey) {
      currentSection = markerKey;
      parsed[markerKey] = LIST_SECTIONS.has(markerKey) ? [] : "";
    } else if (currentSection) {
      if (LIST_SECTIONS.has(currentSection)) {
        const item = trimmed.replace(/^[•\-*]\s*/, "");
        if (item) parsed[currentSection].push(item);
      } else {
        const existing = parsed[currentSection];
        parsed[currentSection] = existing ? existing + " " + trimmed : trimmed;
      }
    }
  }
  return parsed;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch active programs + already-cached slugs.
const { data: allActive, error: ae } = await sb
  .from("programs")
  .select("slug, name, category, description, who_qualifies, phone_number, apply_url, potential_benefit")
  .eq("is_active", true);
if (ae) { console.error("Programs fetch failed:", ae.message); process.exit(1); }

const { data: cached, error: ce } = await sb
  .from("program_guides")
  .select("program_slug");
if (ce) { console.error("Cache fetch failed:", ce.message); process.exit(1); }

const cachedSlugs = new Set((cached ?? []).map((r) => r.program_slug));
const toGenerate = (allActive ?? []).filter((p) => p.slug && !cachedSlugs.has(p.slug));

console.log(`Active rows:      ${allActive?.length ?? 0}`);
console.log(`Already cached:   ${cachedSlugs.size}`);
console.log(`To generate:      ${toGenerate.length}`);
console.log(`Estimated cost:   $${(toGenerate.length * 0.0028).toFixed(2)} – $${(toGenerate.length * 0.0057).toFixed(2)}`);
console.log("");

let totalInputTokens = 0;
let totalCacheWriteTokens = 0;
let totalCacheReadTokens = 0;
let totalOutputTokens = 0;
let succeeded = 0, failed = 0;
const failures = [];
const startTime = Date.now();

for (let i = 0; i < toGenerate.length; i++) {
  const p = toGenerate[i];
  process.stdout.write(`[${(i + 1).toString().padStart(3)}/${toGenerate.length}] ${p.slug.padEnd(50)} `);
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildUserPrompt(p) }],
    });

    const text = response.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const parsed = parseResponse(text);

    if (!parsed.callScript) {
      throw new Error("missing callScript section in response");
    }

    const { error: upErr } = await sb.from("program_guides").upsert(
      { program_slug: p.slug, content: parsed, generated_at: new Date().toISOString() },
      { onConflict: "program_slug" },
    );
    if (upErr) throw new Error(`upsert failed: ${upErr.message}`);

    const u = response.usage;
    totalInputTokens      += u.input_tokens ?? 0;
    totalCacheWriteTokens += u.cache_creation_input_tokens ?? 0;
    totalCacheReadTokens  += u.cache_read_input_tokens ?? 0;
    totalOutputTokens     += u.output_tokens ?? 0;
    succeeded++;
    console.log(`✓ in=${u.input_tokens} out=${u.output_tokens}`);
  } catch (err) {
    failed++;
    failures.push({ slug: p.slug, error: err.message });
    console.log(`✗ ${err.message}`);
  }

  // Pace to stay under Anthropic Tier-1 rate limits (50 RPM).
  await sleep(1200);
}

const elapsedSec = (Date.now() - startTime) / 1000;
const elapsedMin = (elapsedSec / 60).toFixed(1);
const totalCost =
  totalInputTokens      * PRICING.input +
  totalCacheWriteTokens * PRICING.cacheWrite +
  totalCacheReadTokens  * PRICING.cacheRead +
  totalOutputTokens     * PRICING.output;

console.log("\n── Backfill complete ──");
console.log(`Succeeded:        ${succeeded}`);
console.log(`Failed:           ${failed}`);
console.log(`Elapsed:          ${elapsedMin} min`);
console.log(`Tokens — input:        ${totalInputTokens.toLocaleString()}`);
console.log(`         cache write:  ${totalCacheWriteTokens.toLocaleString()}`);
console.log(`         cache read:   ${totalCacheReadTokens.toLocaleString()}`);
console.log(`         output:       ${totalOutputTokens.toLocaleString()}`);
console.log(`Total cost:       $${totalCost.toFixed(4)}`);

if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f.slug}: ${f.error}`);
}
