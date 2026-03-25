import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { NextRequest } from "next/server";

export const maxDuration = 300;

/** Extract text from a PDF buffer without crashing if pdf-parse fails. */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import avoids Turbopack module-load failures at startup
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text ?? "";
  } catch {
    // If pdf-parse fails, return empty string — Gemini will still
    // produce a fallback concept from the subject name alone
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Upload to Supabase Storage
    const storagePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: storageError } = await adminSupabase.storage
      .from("documents")
      .upload(storagePath, buffer, { contentType: file.type });
    if (storageError) {
      return Response.json({ error: storageError.message }, { status: 500 });
    }

    // 4. Insert subject row
    const subjectName = file.name.replace(/\.[^/.]+$/, "");
    const { data: subject, error: subjectError } = await adminSupabase
      .from("subjects")
      .insert({ user_id: user.id, name: subjectName })
      .select("id")
      .single();
    if (subjectError || !subject) {
      return Response.json({ error: subjectError?.message ?? "Insert failed" }, { status: 500 });
    }

    // 5. Extract text
    const lower = file.name.toLowerCase();
    let text = "";
    if (lower.endsWith(".pdf")) {
      text = await extractPdfText(buffer);
    } else {
      text = new TextDecoder().decode(buffer);
    }

    // Truncate to ~12k chars to stay within Gemini context limits
    const truncated = text.slice(0, 12000);

    // 6. Call Groq to extract concepts
    const prompt = `You are an expert tutor. Extract the key concepts from the following study material.

Return a JSON object with a single key "concepts" whose value is an array of 8-20 items. Each item must have:
- "name": short concept name (3-5 words max)
- "definition": one-sentence definition
- "prerequisites": array of other concept names from the same list that must be understood first (use exact names)

Study material title: ${subjectName}
${truncated ? `\nContent:\n${truncated}` : "(no parseable content — generate concepts for the subject from the title alone)"}`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    let concepts: Array<{ name: string; definition: string; prerequisites: string[] }> = [];
    try {
      const raw = completion.choices[0].message.content ?? "[]";
      const parsed = JSON.parse(raw);
      // Groq with json_object may wrap in { concepts: [...] } or return array directly
      concepts = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.concepts) ? parsed.concepts : []);
      if (!Array.isArray(concepts)) concepts = [];
    } catch {
      concepts = [{ name: subjectName, definition: "Core topic", prerequisites: [] }];
    }

    if (concepts.length === 0) {
      concepts = [{ name: subjectName, definition: "Core topic", prerequisites: [] }];
    }

    // 7. Insert concept_nodes
    // Root nodes (no prerequisites) start as "progress" — immediately clickable.
    // Nodes with prerequisites start as "locked" and unlock as prereqs are mastered.
    const nodeRows = concepts.map((c) => ({
      subject_id: subject.id,
      label: c.name,
      definition: c.definition,
      state: c.prerequisites.length === 0 ? "progress" : "locked",
      mastery_pct: 0,
    }));

    const { data: insertedNodes, error: nodesError } = await adminSupabase
      .from("concept_nodes")
      .insert(nodeRows)
      .select("id, label");
    if (nodesError || !insertedNodes) {
      return Response.json({ error: nodesError?.message ?? "Node insert failed" }, { status: 500 });
    }

    // Build name → id map
    const nameToId = new Map<string, string>();
    insertedNodes.forEach((n) => nameToId.set(n.label, n.id));

    // 8. Insert concept_strands from prerequisites
    const strandRows: Array<{ subject_id: string; from_id: string; to_id: string }> = [];
    concepts.forEach((c) => {
      const toId = nameToId.get(c.name);
      if (!toId) return;
      c.prerequisites.forEach((prereqName) => {
        const fromId = nameToId.get(prereqName);
        if (fromId && fromId !== toId) {
          strandRows.push({ subject_id: subject.id, from_id: fromId, to_id: toId });
        }
      });
    });

    if (strandRows.length > 0) {
      await adminSupabase.from("concept_strands").insert(strandRows);
    }

    // 9. Update node_count on subjects + fetch cover image from Unsplash
    const keywords = subjectName.replace(/[_\-]/g, " ").trim();
    let coverUrl: string | null = null;
    if (process.env.UNSPLASH_ACCESS_KEY) {
      try {
        const unsplashRes = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keywords)}&orientation=landscape&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
        );
        if (unsplashRes.ok) {
          const img = await unsplashRes.json();
          coverUrl = img?.urls?.small ?? null;
        }
      } catch { /* non-fatal — card shows gradient fallback */ }
    }

    await adminSupabase
      .from("subjects")
      .update({ node_count: insertedNodes.length, ...(coverUrl ? { cover_url: coverUrl } : {}) })
      .eq("id", subject.id);

    // 10. Return result
    return Response.json({ subjectId: subject.id, nodeCount: insertedNodes.length });

  } catch (err) {
    console.error("[upload] unhandled error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
