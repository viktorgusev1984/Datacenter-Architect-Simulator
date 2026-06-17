export type HealthState = "healthy" | "degraded" | "unavailable";

export type IncidentCategory =
  | "infrastructure"
  | "kubernetes"
  | "database"
  | "traffic"
  | "human-error";

export interface AvailabilityZone {
  id: string;
  regionId: string;
  failureProbability: number;
  monthlyCost: number;
  health: HealthState;
}

export interface Region {
  id: string;
  name: string;
  zones: AvailabilityZone[];
}

export interface WorkloadPlacement {
  zoneId: string;
  replicas: number;
}

export interface ServiceTopology {
  id: string;
  kind: "frontend" | "api" | "backend" | "worker" | "database" | "cache" | "messaging" | "observability";
  placements: WorkloadPlacement[];
  dependencies: string[];
  health: HealthState;
}

export interface Scenario {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  targetSla: number;
  budget: number;
  requiredComponents: string[];
}

export interface Incident {
  id: string;
  category: IncidentCategory;
  title: string;
  affectedZoneIds: string[];
  severity: "low" | "medium" | "high" | "critical";
  startedAtTick: number;
}

export interface ScoreBreakdown {
  availability: number;
  dataSafety: number;
  scalability: number;
  observability: number;
  costEfficiency: number;
}

export const calculateFinalScore = (score: ScoreBreakdown): number =>
  score.availability +
  score.dataSafety +
  score.scalability +
  score.observability +
  score.costEfficiency;
