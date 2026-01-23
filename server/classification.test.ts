import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifyNote } from "./classification";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";

describe("classifyNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should classify a note about a person", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              reasoning: "The note mentions a specific person (Sarah) and a follow-up task.",
              category: "People",
              confidence: 0.95,
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await classifyNote("Follow up with Sarah about the Q3 report");

    expect(result).toEqual({
      reasoning: "The note mentions a specific person (Sarah) and a follow-up task.",
      category: "People",
      confidence: 0.95,
    });
  });

  it("should classify a note about a project", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              reasoning: "The note mentions a deadline and deliverable, indicating a project task.",
              category: "Projects",
              confidence: 0.92,
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await classifyNote("Complete the Q3 report by Friday");

    expect(result.category).toBe("Projects");
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it("should classify a note about an idea", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              reasoning: "The note expresses a conceptual thought about AI systems.",
              category: "Ideas",
              confidence: 0.88,
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await classifyNote("The concept of epistemic humility in AI systems");

    expect(result.category).toBe("Ideas");
  });

  it("should classify a note about an admin task", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              reasoning: "This is a personal reminder for a purchase.",
              category: "Admin",
              confidence: 0.87,
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await classifyNote("Buy a new standing desk");

    expect(result.category).toBe("Admin");
  });

  it("should return a confidence score between 0 and 1", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              reasoning: "Test reasoning",
              category: "People",
              confidence: 0.75,
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await classifyNote("Test note");

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("should handle low confidence classifications", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              reasoning: "This note is ambiguous and could belong to multiple categories.",
              category: "Projects",
              confidence: 0.55,
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await classifyNote("Ambiguous note");

    expect(result.confidence).toBeLessThan(0.6);
  });

  it("should throw an error if LLM returns no response", async () => {
    (invokeLLM as any).mockResolvedValue({
      choices: [
        {
          message: {
            content: null,
          },
        },
      ],
    });

    await expect(classifyNote("Test note")).rejects.toThrow("No response from LLM");
  });
});
