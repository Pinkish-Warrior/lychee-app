import { invokeLLM } from "./_core/llm";

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

export async function classifyNote(content: string): Promise<ClassificationResult> {
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
  } as any);

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
