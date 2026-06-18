import type { ArchitectureTopology, Region } from "./domain.js";

export const defaultRegions: Region[] = [
  {
    id: "europe",
    name: "Europe",
    zones: [
      { id: "eu-a", regionId: "europe", name: "EU-A", networkLatencyMs: 12, storageClass: "replicated", failureProbability: 0.01, monthlyCost: 2500, health: "healthy" },
      { id: "eu-b", regionId: "europe", name: "EU-B", networkLatencyMs: 15, storageClass: "ssd", failureProbability: 0.012, monthlyCost: 2200, health: "healthy" },
      { id: "eu-c", regionId: "europe", name: "EU-C", networkLatencyMs: 18, storageClass: "standard", failureProbability: 0.015, monthlyCost: 1800, health: "healthy" },
    ],
  },
  {
    id: "us-east",
    name: "US-East",
    zones: [
      { id: "use-a", regionId: "us-east", name: "USE-A", networkLatencyMs: 25, storageClass: "replicated", failureProbability: 0.011, monthlyCost: 2600, health: "healthy" },
      { id: "use-b", regionId: "us-east", name: "USE-B", networkLatencyMs: 28, storageClass: "ssd", failureProbability: 0.013, monthlyCost: 2300, health: "healthy" },
    ],
  },
];

export const resilientEcommerceTopology = (): ArchitectureTopology => ({
  regions: defaultRegions,
  nodePools: [
    { id: "eu-standard", zoneId: "eu-a", kind: "standard", nodes: 4, cpuPerNode: 8, memoryGbPerNode: 32, monthlyCost: 4200 },
    { id: "eu-standard-b", zoneId: "eu-b", kind: "standard", nodes: 4, cpuPerNode: 8, memoryGbPerNode: 32, monthlyCost: 4200 },
    { id: "worker-spot", zoneId: "eu-c", kind: "spot", nodes: 3, cpuPerNode: 4, memoryGbPerNode: 16, monthlyCost: 1200 },
  ],
  components: [
    { id: "frontend", name: "React Frontend", kind: "frontend", placements: [{ zoneId: "eu-a", replicas: 2 }, { zoneId: "eu-b", replicas: 2 }], dependencies: ["api"], monthlyCost: 1200, health: "healthy", metadata: { autoscaling: true, zeroDowntimeDeployments: true } },
    { id: "api", name: "API Gateway", kind: "api-gateway", placements: [{ zoneId: "eu-a", replicas: 3 }, { zoneId: "eu-b", replicas: 3 }], dependencies: ["postgres", "redis", "workers"], monthlyCost: 2600, health: "healthy", metadata: { autoscaling: true, zeroDowntimeDeployments: true } },
    { id: "postgres", name: "PostgreSQL", kind: "database", placements: [{ zoneId: "eu-a", replicas: 1 }, { zoneId: "eu-b", replicas: 1 }, { zoneId: "eu-c", replicas: 1 }], dependencies: [], monthlyCost: 6200, health: "healthy", metadata: { primaryZoneId: "eu-a", replicaZoneIds: ["eu-b", "eu-c"], backupEnabled: true, backupVerified: true, auditLogs: true } },
    { id: "redis", name: "Redis", kind: "cache", placements: [{ zoneId: "eu-a", replicas: 1 }, { zoneId: "eu-b", replicas: 1 }], dependencies: [], monthlyCost: 1500, health: "healthy", metadata: { autoscaling: true } },
    { id: "workers", name: "Workers", kind: "worker", placements: [{ zoneId: "eu-a", replicas: 2 }, { zoneId: "eu-c", replicas: 2 }], dependencies: ["postgres"], monthlyCost: 1800, health: "healthy", metadata: { autoscaling: true } },
    { id: "observability", name: "Prometheus/Grafana/Loki/Jaeger", kind: "observability", placements: [{ zoneId: "eu-a", replicas: 1 }, { zoneId: "eu-b", replicas: 1 }], dependencies: [], monthlyCost: 1800, health: "healthy" },
  ],
  connections: [
    { id: "frontend-api", fromComponentId: "frontend", toComponentId: "api", kind: "dependency", latencyMs: 8 },
    { id: "api-db", fromComponentId: "api", toComponentId: "postgres", kind: "dependency", latencyMs: 6 },
    { id: "db-replication", fromComponentId: "postgres", toComponentId: "postgres", kind: "replication", latencyMs: 12 },
  ],
  observability: { prometheus: true, grafana: true, loki: true, jaeger: true, alerting: true },
  drPlan: { documented: true, rpoMinutes: 10, rtoMinutes: 45, lastTestedDaysAgo: 14 },
});
