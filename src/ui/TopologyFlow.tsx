import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import type { ArchitectureTopology, ComponentKind, Incident } from "../domain.js";

const kindColors: Record<ComponentKind, string> = {
  frontend: "#60a5fa",
  "api-gateway": "#a78bfa",
  backend: "#34d399",
  worker: "#fbbf24",
  cron: "#f59e0b",
  database: "#f87171",
  cache: "#2dd4bf",
  messaging: "#fb7185",
  storage: "#c084fc",
  observability: "#38bdf8",
  cdn: "#22c55e",
};

interface TopologyFlowProps {
  topology: ArchitectureTopology;
  activeIncidents: Incident[];
}

const incidentComponentIds = (incidents: Incident[]): Set<string> =>
  new Set(incidents.flatMap((incident) => incident.affectedComponentIds));

export const TopologyFlow = ({ topology, activeIncidents }: TopologyFlowProps) => {
  const impacted = incidentComponentIds(activeIncidents);
  const nodes: Node[] = topology.components.map((component, index) => {
    const totalReplicas = component.placements.reduce((sum, placement) => sum + placement.replicas, 0);
    const zones = component.placements.map((placement) => `${placement.zoneId}×${placement.replicas}`).join(" · ");
    const isImpacted = impacted.has(component.id);

    return {
      id: component.id,
      position: { x: (index % 3) * 280, y: Math.floor(index / 3) * 190 },
      data: {
        label: `${component.name}\n${component.kind} · ${totalReplicas} replicas\n${zones}`,
      },
      style: {
        background: isImpacted ? "#7f1d1d" : "#111827",
        border: `3px solid ${isImpacted ? "#ef4444" : kindColors[component.kind]}`,
        borderRadius: 16,
        color: "#f8fafc",
        fontSize: 12,
        minHeight: 78,
        padding: 12,
        whiteSpace: "pre-line",
        width: 220,
        boxShadow: isImpacted ? "0 0 24px rgba(239, 68, 68, 0.55)" : "0 12px 30px rgba(15, 23, 42, 0.35)",
      },
    };
  });

  const edges: Edge[] = topology.connections.map((connection) => ({
    id: connection.id,
    source: connection.fromComponentId,
    target: connection.toComponentId,
    animated: connection.kind === "replication" || impacted.has(connection.fromComponentId) || impacted.has(connection.toComponentId),
    label: `${connection.kind} · ${connection.latencyMs}ms`,
    style: {
      stroke: connection.kind === "replication" ? "#22d3ee" : "#94a3b8",
      strokeWidth: 2,
    },
    labelStyle: { fill: "#e2e8f0", fontWeight: 700 },
  }));

  return (
    <div className="flow-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Network map</p>
          <h2>Architecture topology</h2>
        </div>
        <span className="incident-badge">{activeIncidents.length} active incidents</span>
      </div>
      <div className="flow-shell">
        <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false}>
          <Background color="#334155" gap={22} />
          <MiniMap pannable zoomable nodeColor={(node) => String(node.style?.border ?? "#60a5fa")} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};
