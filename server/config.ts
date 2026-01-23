/**
 * Classification threshold configuration
 * These values determine when notes are sent to the review queue
 */

export const CLASSIFICATION_THRESHOLDS = {
  HIGH: parseFloat(process.env.CLASSIFICATION_THRESHOLD_HIGH || "0.85"),
  MEDIUM: parseFloat(process.env.CLASSIFICATION_THRESHOLD_MEDIUM || "0.6"),
};

/**
 * Determine if a note should go to the review queue based on confidence
 */
export function shouldReviewNote(confidence: number): boolean {
  return confidence < CLASSIFICATION_THRESHOLDS.HIGH;
}

/**
 * Get confidence level description
 */
export function getConfidenceLevel(confidence: number): "high" | "medium" | "low" {
  if (confidence >= CLASSIFICATION_THRESHOLDS.HIGH) return "high";
  if (confidence >= CLASSIFICATION_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}
