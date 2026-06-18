export type HealthState = "healthy" | "degraded" | "unavailable";

export type IncidentCategory =
  | "infrastructure"
  | "kubernetes"
  | "database"
  | "traffic"
  | "human-error";

export type ScenarioLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type ComponentKind =
  | "frontend"
  | "api-gateway"
  | "backend"
  | "worker"
  | "cron"
  | "database"
  | "cache"
  | "messaging"
  | "storage"
  | "observability"
  | "cdn";

export type ConnectionKind = "dependency" | "network" | "replication";

export interface AvailabilityZone {
  id: string;
  regionId: string;
  name: string;
  networkLatencyMs: number;
  storageClass: "standard" | "ssd" | "replicated";
  failureProbability: number;
  monthlyCost: number;
  health: HealthState;
}

export interface Region {
  id: string;
  name: string;
  zones: AvailabilityZone[];
}

export interface NodePool {
  id: string;
  zoneId: string;
  kind: "standard" | "gpu" | "spot" | "managed";
  nodes: number;
  cpuPerNode: number;
  memoryGbPerNode: number;
  monthlyCost: number;
}

export interface WorkloadPlacement {
  zoneId: string;
  replicas: number;
}

export interface ComponentTopology {
  id: string;
  name: string;
  kind: ComponentKind;
  placements: WorkloadPlacement[];
  dependencies: string[];
  monthlyCost: number;
  health: HealthState;
  metadata?: {
    primaryZoneId?: string;
    replicaZoneIds?: string[];
    backupEnabled?: boolean;
    backupVerified?: boolean;
    auditLogs?: boolean;
    autoscaling?: boolean;
    zeroDowntimeDeployments?: boolean;
  };
}

export interface TopologyConnection {
  id: string;
  fromComponentId: string;
  toComponentId: string;
  kind: ConnectionKind;
  latencyMs: number;
}

export interface ArchitectureTopology {
  regions: Region[];
  nodePools: NodePool[];
  components: ComponentTopology[];
  connections: TopologyConnection[];
  observability: {
    prometheus: boolean;
    grafana: boolean;
    loki: boolean;
    jaeger: boolean;
    alerting: boolean;
  };
  drPlan: {
    documented: boolean;
    rpoMinutes: number;
    rtoMinutes: number;
    lastTestedDaysAgo?: number;
  };
}

export interface Scenario {
  id: string;
  name: string;
  level: ScenarioLevel;
  targetSla: number;
  budget: number;
  requiredComponents: ComponentKind[];
  requirements: string[];
  unlocks: string[];
}

export interface Incident {
  id: string;
  category: IncidentCategory;
  title: string;
  description: string;
  affectedZoneIds: string[];
  affectedComponentIds: string[];
  severity: "low" | "medium" | "high" | "critical";
  startedAtTick: number;
  durationTicks: number;
}

export interface MetricSample {
  tick: number;
  latencyMs: number;
  throughputRps: number;
  errorRate: number;
  cpuUtilization: number;
  memoryUtilization: number;
  replicationLagSeconds: number;
}

export interface EventLogEntry {
  tick: number;
  level: "info" | "warning" | "critical";
  message: string;
}

export interface ScoreBreakdown {
  availability: number;
  dataSafety: number;
  scalability: number;
  observability: number;
  costEfficiency: number;
}

export interface SimulationState {
  tick: number;
  topology: ArchitectureTopology;
  activeIncidents: Incident[];
  resolvedIncidents: Incident[];
  metrics: MetricSample[];
  events: EventLogEntry[];
  availability: number;
  customerImpact: boolean;
}

export interface ReviewFinding {
  severity: "critical" | "warning" | "info";
  message: string;
  componentId?: string;
}

export interface ArchitectureReview {
  issuesFound: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  predictedSla: number;
  estimatedBlastRadius: number;
  findings: ReviewFinding[];
  recommendations: string[];
}

export interface OutageReport {
  incidentId: string;
  customerImpact: boolean;
  impactedComponents: string[];
  availabilityLoss: number;
  summary: string;
}

export interface CoachAdvice {
  hints: string[];
  lessons: string[];
}

export const calculateFinalScore = (score: ScoreBreakdown): number =>
  score.availability +
  score.dataSafety +
  score.scalability +
  score.observability +
  score.costEfficiency;
