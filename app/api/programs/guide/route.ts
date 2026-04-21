import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const SYSTEM_PROMPT = `You are a benefits navigator helping Americans — especially seniors, veterans, and low-income families — understand government assistance programs. Write in plain, warm, conversational English. Avoid jargon. Use short sentences. Assume the reader may be over 65 or not tech-savvy. Be specific and actionable.

You will be given information about a specific government benefit program and asked to generate 6 helpful sections in a structured text format.`;

// GET /api/programs/guide?slug=xxx — return cached content or 404
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data } = await db
    .from("program_guides")
    .select("content, generated_at")
    .eq("program_slug", slug)
    .single();

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ content: data.content, generated_at: data.generated_at });
}

// POST /api/programs/guide — stream from Claude, save to Supabase when done
export async function POST(req: NextRequest) {
  const { slug, programName, description, whoQualifies, phoneNumber, applyUrl, potentialBenefit, category } =
    await req.json();

  if (!programName) {
    return NextResponse.json({ error: "Missing programName" }, { status: 400 });
  }

  const userPrompt = `Generate a practical guide for the following government benefit program. Output plain text using EXACTLY these section markers on their own line, in this order. Do not add any other text before, between, or after the sections.

Program: ${programName}
Category: ${category}
Description: ${description}
Who qualifies: ${whoQualifies}
Potential benefit: ${potentialBenefit}
Phone number: ${phoneNumber}
Apply URL: ${applyUrl}

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

  const encoder = new TextEncoder();
  const LIST_SECTIONS = new Set(["documents", "denialReasons", "proTips"]);
  const SECTION_MARKERS: Record<string, string> = {
    "[callScript]":    "callScript",
    "[documents]":     "documents",
    "[denialReasons]": "denialReasons",
    "[afterApplying]": "afterApplying",
    "[ifDenied]":      "ifDenied",
    "[proTips]":       "proTips",
  };

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      let currentSection: string | null = null;
      const parsed: Record<string, string | string[]> = {};

      try {
        const response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: userPrompt }],
          stream: true,
        });

        for await (const event of response) {
          if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;
          const chunk = event.delta.text;
          controller.enqueue(encoder.encode(chunk));

          // Accumulate for Supabase save
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const markerKey = SECTION_MARKERS[trimmed];
            if (markerKey) {
              currentSection = markerKey;
              parsed[markerKey] = LIST_SECTIONS.has(markerKey) ? [] : "";
            } else if (currentSection) {
              if (LIST_SECTIONS.has(currentSection)) {
                const item = trimmed.replace(/^[•\-*]\s*/, "");
                if (item) (parsed[currentSection] as string[]).push(item);
              } else {
                const existing = parsed[currentSection] as string;
                parsed[currentSection] = existing ? existing + " " + trimmed : trimmed;
              }
            }
          }
        }

        // Flush remaining buffer
        if (currentSection && buffer.trim()) {
          const trimmed = buffer.trim();
          if (LIST_SECTIONS.has(currentSection)) {
            const item = trimmed.replace(/^[•\-*]\s*/, "");
            if (item) (parsed[currentSection] as string[]).push(item);
          } else {
            const existing = parsed[currentSection] as string;
            parsed[currentSection] = existing ? existing + " " + trimmed : trimmed;
          }
        }

        // Save to Supabase if we have a slug and valid content
        if (slug && parsed.callScript) {
          const admin = getSupabaseAdmin();
          if (admin) {
            await admin.from("program_guides").upsert(
              { program_slug: slug, content: parsed, generated_at: new Date().toISOString() },
              { onConflict: "program_slug" }
            );
          }
        }
      } catch (err) {
        console.error("Guide generation error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}

// DELETE /api/programs/guide?slug=xxx — clear cache (admin only)
export async function DELETE(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { error } = await admin.from("program_guides").delete().eq("program_slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
