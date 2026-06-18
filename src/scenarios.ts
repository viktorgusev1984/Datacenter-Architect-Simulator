import type { Scenario } from "./domain.js";

export const scenarios: Scenario[] = [
  {
    id: "single-app",
    name: "Single Application",
    level: "beginner",
    targetSla: 99.5,
    budget: 12000,
    requiredComponents: ["frontend", "backend", "database"],
    requirements: ["Serve a simple production app", "Persist customer data", "Add basic monitoring"],
    unlocks: ["single-az", "databases"],
  },
  {
    id: "ecommerce",
    name: "E-commerce Platform",
    level: "intermediate",
    targetSla: 99.9,
    budget: 35000,
    requiredComponents: ["frontend", "api-gateway", "database", "cache", "worker"],
    requirements: ["Handle traffic spikes", "Keep checkout data safe", "Use workers for asynchronous jobs"],
    unlocks: ["multi-az", "kubernetes", "caches"],
  },
  {
    id: "fintech",
    name: "Fintech Platform",
    level: "advanced",
    targetSla: 99.99,
    budget: 90000,
    requiredComponents: ["frontend", "api-gateway", "backend", "database", "cache", "observability", "storage"],
    requirements: ["Run across multiple AZs and regions", "Provide a tested DR plan", "Verify backups", "Enable audit logs"],
    unlocks: ["multi-region", "dr-scenarios", "audit"],
  },
  {
    id: "streaming",
    name: "Global Streaming Service",
    level: "expert",
    targetSla: 99.99,
    budget: 180000,
    requiredComponents: ["frontend", "api-gateway", "backend", "messaging", "cdn", "storage", "observability"],
    requirements: ["Active-active multi-region", "Kafka-style messaging", "CDN", "Cross-region replication", "Zero-downtime deployments"],
    unlocks: ["global-scale", "kafka", "gitops"],
  },
];

export const getScenario = (id: string): Scenario => {
  const scenario = scenarios.find((candidate) => candidate.id === id);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${id}`);
  }
  return scenario;
};
