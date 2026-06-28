import { apiJson } from "./client";
import type { Department } from "../types";

export function fetchDepartments() {
  return apiJson<Department[]>("/api/v1/departments", { auth: true });
}
