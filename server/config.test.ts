import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CLASSIFICATION_THRESHOLDS, shouldReviewNote, getConfidenceLevel } from "./config";

describe("Classification Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("CLASSIFICATION_THRESHOLDS", () => {
    it("should use default HIGH threshold of 0.85", () => {
      delete process.env.CLASSIFICATION_THRESHOLD_HIGH;
      expect(CLASSIFICATION_THRESHOLDS.HIGH).toBe(0.85);
    });

    it("should use default MEDIUM threshold of 0.6", () => {
      delete process.env.CLASSIFICATION_THRESHOLD_MEDIUM;
      expect(CLASSIFICATION_THRESHOLDS.MEDIUM).toBe(0.6);
    });
  });

  describe("shouldReviewNote", () => {
    it("should return false for high confidence notes (>= 0.85)", () => {
      expect(shouldReviewNote(0.95)).toBe(false);
      expect(shouldReviewNote(0.85)).toBe(false);
    });

    it("should return true for low confidence notes (< 0.85)", () => {
      expect(shouldReviewNote(0.84)).toBe(true);
      expect(shouldReviewNote(0.5)).toBe(true);
      expect(shouldReviewNote(0.1)).toBe(true);
    });
  });

  describe("getConfidenceLevel", () => {
    it("should return 'high' for confidence >= 0.85", () => {
      expect(getConfidenceLevel(0.95)).toBe("high");
      expect(getConfidenceLevel(0.85)).toBe("high");
    });

    it("should return 'medium' for confidence between 0.6 and 0.85", () => {
      expect(getConfidenceLevel(0.84)).toBe("medium");
      expect(getConfidenceLevel(0.6)).toBe("medium");
      expect(getConfidenceLevel(0.7)).toBe("medium");
    });

    it("should return 'low' for confidence < 0.6", () => {
      expect(getConfidenceLevel(0.59)).toBe("low");
      expect(getConfidenceLevel(0.3)).toBe("low");
      expect(getConfidenceLevel(0.0)).toBe("low");
    });
  });
});
