import { invokeLLM, UserAiConfig } from "./_core/llm";

export async function findRelatedNotes(
  newContent: string,
  existingNotes: { id: number; content: string }[],
  userConfig?: UserAiConfig
): Promise<{ noteId: number; strength: number; reason: string }[]> {
  if (existingNotes.length === 0) return [];

  const messages = [
    {
      role: "system",
      content: "You are a knowledge graph assistant. Return only valid JSON.",
    },
    {
      role: "user",
      content: `A user just captured this note:\n"${newContent}"\n\nHere are their existing notes (id + content):\n${existingNotes.map((n) => `ID ${n.id}: "${n.content.slice(0, 120)}"`).join("\n")}\n\nReturn a JSON array of related notes (max 3) with this shape:\n[{ "noteId": <id>, "strength": <0.1-1.0>, "reason": "<short reason>" }]\nIf nothing is related, return an empty array: []`,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "related_notes",
        strict: true,
        schema: {
          type: "object",
          properties: {
            links: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  noteId: { type: "number" },
                  strength: { type: "number", minimum: 0.1, maximum: 1.0 },
                  reason: { type: "string" },
                },
                required: ["noteId", "strength", "reason"],
                additionalProperties: false,
              },
            },
          },
          required: ["links"],
          additionalProperties: false,
        },
      },
    },
  } as any, userConfig);

  const raw = response.choices[0]?.message.content;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
    return parsed.links ?? [];
  } catch {
    return [];
  }
}

export interface ClassificationResult {
  reasoning: string;
  category: "People" | "Projects" | "Ideas" | "Admin";
  confidence: number;
}

const CLASSIFICATION_PROMPT = `You are a note classification engine. Analyze the following user note and classify it into one of four categories.

Categories:
- People: Notes about specific people, contacts, relationships, or follow-ups with individuals
- Projects: Notes about tasks, projects, deadlines, deliverables, or work-related items
- Ideas: Notes about concepts, thoughts, brainstorms, insights, or creative ideas
- Admin: Notes about administrative tasks, reminders, purchases, or personal management items

Your output MUST be a valid JSON object with three keys: "reasoning", "category", and "confidence".

- The "reasoning" key should contain your brief analysis of why you chose this category.
- The "category" key should be one of: People, Projects, Ideas, Admin.
- The "confidence" key should be a number from 0.0 to 1.0 reflecting how certain you are.

User Note: "{content}"`;

export async function classifyNote(content: string, userConfig?: UserAiConfig): Promise<ClassificationResult> {
  const prompt = CLASSIFICATION_PROMPT.replace("{content}", content);

  const messages = [
    {
      role: "system",
      content:
        "You are a note classification engine. You must respond with valid JSON containing reasoning, category, and confidence fields.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "classification_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            reasoning: {
              type: "string",
              description: "Brief analysis of the classification decision",
            },
            category: {
              type: "string",
              enum: ["People", "Projects", "Ideas", "Admin"],
              description: "The assigned category",
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Confidence score from 0.0 to 1.0",
            },
          },
          required: ["reasoning", "category", "confidence"],
          additionalProperties: false,
        },
      },
    },
  } as any, userConfig);

  const content_response = response.choices[0]?.message.content;
  if (!content_response) {
    throw new Error("No response from LLM");
  }

  const responseText = typeof content_response === "string" ? content_response : JSON.stringify(content_response);
  const parsed = JSON.parse(responseText);

  return {
    reasoning: parsed.reasoning,
    category: parsed.category,
    confidence: parsed.confidence,
  };
}
