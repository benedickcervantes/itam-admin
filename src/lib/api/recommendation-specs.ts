import { apiJson } from "./client";
import type { RecommendationSpec } from "../types";

export function fetchRecommendationSpecs() {
  return apiJson<RecommendationSpec[]>("/api/v1/recommendation-specs", { auth: true });
}

export function fetchRecommendationSpec(id: string) {
  return apiJson<RecommendationSpec>(`/api/v1/recommendation-specs/${id}`, { auth: true });
}

export function updateRecommendationSpec(id: string, body: Record<string, unknown>) {
  return apiJson<RecommendationSpec>(`/api/v1/recommendation-specs/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}
