import type {
  ArchitectureReview,
  ArchitectureTopology,
  CoachAdvice,
  ComponentKind,
  ComponentTopology,
  EventLogEntry,
  Incident,
  MetricSample,
  OutageReport,
  ReviewFinding,
  Scenario,
  ScoreBreakdown,
  SimulationState,
} from "./domain.js";
import { calculateFinalScore } from "./domain.js";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const unique = <T>(items: T[]): T[] => [...new Set(items)];

const componentZones = (component: ComponentTopology): string[] =>
  component.placements.flatMap((placement) => Array.from({ length: placement.replicas }, () => placement.zoneId));

const distinctComponentZones = (component: ComponentTopology): string[] => unique(component.placements.map((placement) => placement.zoneId));

const requiredKindsPresent = (topology: ArchitectureTopology, scenario: Scenario): ComponentKind[] =>
  scenario.requiredComponents.filter((kind) => topology.components.some((component) => component.kind === kind));

export const reviewArchitecture = (topology: ArchitectureTopology, scenario: Scenario): ArchitectureReview => {
  const findings: ReviewFinding[] = [];
  const zoneCount = topology.regions.reduce((count, region) => count + region.zones.length, 0);
  const regionsUsed = unique(topology.components.flatMap((component) => distinctComponentZones(component)).map((zoneId) => topology.regions.find((region) => region.zones.some((zone) => zone.id === zoneId))?.id).filter(Boolean));

  for (const kind of scenario.requiredComponents) {
    if (!topology.components.some((component) => component.kind === kind)) {
      findings.push({ severity: "critical", message: `Required component is missing: ${kind}` });
    }
  }

  for (const component of topology.components) {
    const zones = distinctComponentZones(component);
    const replicas = componentZones(component).length;
    if (replicas < 2 && component.kind !== "cron") {
      findings.push({ severity: "critical", componentId: component.id, message: `${component.name} has fewer than two replicas` });
    }
    if (zones.length < 2 && ["frontend", "api-gateway", "backend", "database", "cache", "messaging", "observability"].includes(component.kind)) {
      findings.push({ severity: "warning", componentId: component.id, message: `${component.name} is isolated in one availability zone` });
    }
    if (component.kind === "database") {
      if (!component.metadata?.primaryZoneId) {
        findings.push({ severity: "critical", componentId: component.id, message: `${component.name} has no declared primary zone` });
      }
      if ((component.metadata?.replicaZoneIds?.length ?? 0) < 1) {
        findings.push({ severity: "critical", componentId: component.id, message: `${component.name} has no read replica or failover target` });
      }
      if (!component.metadata?.backupEnabled || !component.metadata.backupVerified) {
        findings.push({ severity: "warning", componentId: component.id, message: `${component.name} backups are not enabled and verified` });
      }
    }
  }

  if (!topology.observability.prometheus || !topology.observability.grafana || !topology.observability.alerting) {
    findings.push({ severity: "warning", message: "Monitoring and alerting are incomplete" });
  }
  if (scenario.level !== "beginner" && regionsUsed.length < 1) {
    findings.push({ severity: "critical", message: "No deployed region detected" });
  }
  if (["advanced", "expert"].includes(scenario.level) && regionsUsed.length < 2) {
    findings.push({ severity: "critical", message: "Scenario requires multi-region deployment" });
  }
  if (["advanced", "expert"].includes(scenario.level) && (!topology.drPlan.documented || topology.drPlan.rtoMinutes > 60 || topology.drPlan.rpoMinutes > 15)) {
    findings.push({ severity: "critical", message: "Disaster recovery plan does not meet advanced scenario expectations" });
  }
  if (scenario.level === "expert" && !topology.components.some((component) => component.kind === "cdn")) {
    findings.push({ severity: "critical", message: "Global streaming requires a CDN" });
  }

  const critical = findings.filter((finding) => finding.severity === "critical").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  const redundancyBonus = clamp(topology.components.reduce((sum, component) => sum + distinctComponentZones(component).length, 0) / Math.max(1, topology.components.length * Math.max(1, zoneCount)), 0, 1) * 0.5;
  const penalty = critical * 0.8 + warnings * 0.2;
  const predictedSla = clamp(99 + redundancyBonus + requiredKindsPresent(topology, scenario).length * 0.08 - penalty, 90, 99.999);
  const estimatedBlastRadius = clamp(Math.round((critical * 20 + warnings * 8 + (regionsUsed.length < 2 ? 20 : 0)) / Math.max(1, topology.components.length)), 1, 100);
  const riskLevel = critical > 2 ? "critical" : critical > 0 ? "high" : warnings > 2 ? "medium" : "low";

  return {
    issuesFound: findings.length,
    riskLevel,
    predictedSla,
    estimatedBlastRadius,
    findings,
    recommendations: findings.map((finding) => `Fix: ${finding.message}`),
  };
};

export const generateIncident = (topology: ArchitectureTopology, tick: number, severityBoost = 0): Incident => {
  const allZones = topology.regions.flatMap((region) => region.zones);
  const targetZone = allZones[(tick + severityBoost) % allZones.length];
  const affected = topology.components.filter((component) => distinctComponentZones(component).includes(targetZone.id));
  const templates = [
    ["infrastructure", "Power outage", "Power loss in an availability zone"],
    ["kubernetes", "Node pressure", "Kubernetes pods are being evicted under memory pressure"],
    ["database", "Replication lag", "Database replicas are falling behind the primary"],
    ["traffic", "Traffic spike", "Unexpected request volume is stressing edge services"],
    ["human-error", "Bad deployment", "A rollout introduced elevated error rates"],
  ] as const;
  const template = templates[(tick + affected.length + severityBoost) % templates.length];
  const severity = ["low", "medium", "high", "critical"] as const;
  return {
    id: `inc-${tick}-${template[0]}`,
    category: template[0],
    title: template[1],
    description: template[2],
    affectedZoneIds: [targetZone.id],
    affectedComponentIds: affected.map((component) => component.id),
    severity: severity[clamp(Math.floor(tick / 3) + severityBoost, 0, 3)],
    startedAtTick: tick,
    durationTicks: 2 + severityBoost,
  };
};

export const applyIncidentImpact = (state: SimulationState, incident: Incident): OutageReport => {
  const severityLoss = { low: 0.02, medium: 0.08, high: 0.2, critical: 0.45 }[incident.severity];
  const redundantAffected = incident.affectedComponentIds.filter((id) => {
    const component = state.topology.components.find((candidate) => candidate.id === id);
    return component ? distinctComponentZones(component).some((zoneId) => !incident.affectedZoneIds.includes(zoneId)) : false;
  });
  const mitigation = redundantAffected.length / Math.max(1, incident.affectedComponentIds.length) * 0.7;
  const availabilityLoss = clamp(severityLoss * (1 - mitigation), 0.005, 0.5);
  state.availability = clamp(state.availability - availabilityLoss, 0, 1);
  state.customerImpact = availabilityLoss > 0.08;
  return {
    incidentId: incident.id,
    customerImpact: state.customerImpact,
    impactedComponents: incident.affectedComponentIds,
    availabilityLoss,
    summary: `${incident.title} caused ${(availabilityLoss * 100).toFixed(2)}% availability loss`,
  };
};

export const tickSimulation = (state: SimulationState, scenario: Scenario): SimulationState => {
  const tick = state.tick + 1;
  const events: EventLogEntry[] = [...state.events];
  const activeIncidents = state.activeIncidents.filter((incident) => tick - incident.startedAtTick < incident.durationTicks);
  const resolvedIncidents = [...state.resolvedIncidents, ...state.activeIncidents.filter((incident) => tick - incident.startedAtTick >= incident.durationTicks)];
  const nextState: SimulationState = { ...state, tick, activeIncidents, resolvedIncidents, events };

  if (tick % 3 === 0) {
    const incident = generateIncident(state.topology, tick, scenario.level === "expert" ? 1 : 0);
    nextState.activeIncidents = [...nextState.activeIncidents, incident];
    const report = applyIncidentImpact(nextState, incident);
    nextState.events.push({ tick, level: report.customerImpact ? "critical" : "warning", message: report.summary });
  } else {
    nextState.availability = clamp(nextState.availability + 0.005, 0, 1);
    nextState.customerImpact = false;
  }

  const currentLag = nextState.activeIncidents.some((incident) => incident.category === "database") ? 45 : 2;
  const latestMetric: MetricSample = {
    tick,
    latencyMs: Math.round(80 + nextState.activeIncidents.length * 120 + (1 - nextState.availability) * 500),
    throughputRps: Math.round(1000 * nextState.availability),
    errorRate: Number(clamp(1 - nextState.availability, 0, 1).toFixed(4)),
    cpuUtilization: clamp(0.45 + nextState.activeIncidents.length * 0.15, 0, 0.99),
    memoryUtilization: clamp(0.5 + nextState.activeIncidents.length * 0.1, 0, 0.99),
    replicationLagSeconds: currentLag,
  };
  nextState.metrics = [...nextState.metrics, latestMetric];
  return nextState;
};

export const createSimulation = (topology: ArchitectureTopology): SimulationState => ({
  tick: 0,
  topology,
  activeIncidents: [],
  resolvedIncidents: [],
  metrics: [],
  events: [{ tick: 0, level: "info", message: "Simulation started" }],
  availability: 1,
  customerImpact: false,
});

export const scoreArchitecture = (topology: ArchitectureTopology, scenario: Scenario, state?: SimulationState): ScoreBreakdown & { total: number } => {
  const review = reviewArchitecture(topology, scenario);
  const monthlyCost = topology.components.reduce((sum, component) => sum + component.monthlyCost, 0) + topology.nodePools.reduce((sum, pool) => sum + pool.monthlyCost, 0);
  const presentRequired = requiredKindsPresent(topology, scenario).length / scenario.requiredComponents.length;
  const dataSafety = topology.components.filter((component) => component.kind === "database" || component.kind === "storage").every((component) => component.metadata?.backupEnabled && component.metadata.backupVerified) ? 25 : 12;
  const observabilityScore = Object.values(topology.observability).filter(Boolean).length * 2;
  const autoscaled = topology.components.filter((component) => component.metadata?.autoscaling).length / Math.max(1, topology.components.length);
  const score: ScoreBreakdown = {
    availability: clamp((state?.availability ?? review.predictedSla / 100) * 30, 0, 30),
    dataSafety: clamp(dataSafety + (topology.drPlan.documented ? 3 : 0), 0, 25),
    scalability: clamp(presentRequired * 12 + autoscaled * 8, 0, 20),
    observability: clamp(observabilityScore, 0, 10),
    costEfficiency: clamp(15 - Math.max(0, monthlyCost - scenario.budget) / scenario.budget * 15, 0, 15),
  };
  return { ...score, total: calculateFinalScore(score) };
};

export const coachPlayer = (review: ArchitectureReview): CoachAdvice => ({
  hints: review.findings.slice(0, 5).map((finding) => finding.message),
  lessons: [
    "Spread critical workloads across failure domains to reduce blast radius.",
    "Backups only count when restores are tested.",
    "Observability should be redundant because incidents often break your monitoring first.",
  ],
});

export const runSimulation = (topology: ArchitectureTopology, scenario: Scenario, ticks: number): SimulationState =>
  Array.from({ length: ticks }).reduce<SimulationState>((state) => tickSimulation(state, scenario), createSimulation(topology));
