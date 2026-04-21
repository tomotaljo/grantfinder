import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a benefits navigator helping Americans — especially seniors, veterans, and low-income families — understand government assistance programs. Write in plain, warm, conversational English. Avoid jargon. Use short sentences. Assume the reader may be over 65 or not tech-savvy. Be specific and actionable.

You will be given information about a specific government benefit program and asked to generate 6 helpful sections in JSON format.`;

export async function POST(req: NextRequest) {
  const { programName, description, whoQualifies, phoneNumber, applyUrl, potentialBenefit, category } =
    await req.json();

  if (!programName) {
    return NextResponse.json({ error: "Missing programName" }, { status: 400 });
  }

  const userPrompt = `Generate a practical guide for the following government benefit program. Return ONLY valid JSON with exactly these 6 keys: "callScript", "documents", "denialReasons", "afterApplying", "ifDenied", "proTips".

Program: ${programName}
Category: ${category}
Description: ${description}
Who qualifies: ${whoQualifies}
Potential benefit: ${potentialBenefit}
Phone number: ${phoneNumber}
Apply URL: ${applyUrl}

JSON format:
{
  "callScript": "A word-for-word phone script (3-5 sentences) the person can read when they call. Start with how to introduce yourself and what to ask for.",
  "documents": ["Document 1", "Document 2", "Document 3", "Document 4", "Document 5"],
  "denialReasons": ["Reason 1", "Reason 2", "Reason 3", "Reason 4"],
  "afterApplying": "2-3 sentences describing what happens next, typical wait times, and how they'll be notified.",
  "ifDenied": "2-3 sentences explaining their right to appeal, how long they have, and who to contact for help.",
  "proTips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [{ role: "user", content: userPrompt }],
          stream: true,
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("Claude API error:", err);
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: "Failed to generate content" }))
        );
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
