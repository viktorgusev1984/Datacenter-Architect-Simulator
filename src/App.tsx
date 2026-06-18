import { useMemo, useState } from "react";
import type { ArchitectureTopology } from "./domain.js";
import { resilientEcommerceTopology } from "./presets.js";
import { getScenario } from "./scenarios.js";
import { coachPlayer, createSimulation, reviewArchitecture, scoreArchitecture, tickSimulation } from "./simulator.js";
import { TopologyFlow } from "./ui/TopologyFlow.js";

const cloneTopology = (): ArchitectureTopology => structuredClone(resilientEcommerceTopology());
const formatPercent = (value: number): string => `${(value * 100).toFixed(2)}%`;

export const App = () => {
  const scenario = useMemo(() => getScenario("ecommerce"), []);
  const [topology, setTopology] = useState<ArchitectureTopology>(() => cloneTopology());
  const [state, setState] = useState(() => createSimulation(cloneTopology()));

  const review = useMemo(() => reviewArchitecture(topology, scenario), [scenario, topology]);
  const score = useMemo(() => scoreArchitecture(topology, scenario, state), [scenario, state, topology]);
  const coach = useMemo(() => coachPlayer(review), [review]);
  const latestMetric = state.metrics.at(-1);

  const syncTopology = (nextTopology: ArchitectureTopology) => {
    setTopology(nextTopology);
    setState((current) => ({ ...current, topology: nextTopology }));
  };

  const advanceTick = () => setState((current) => tickSimulation({ ...current, topology }, scenario));
  const runTenTicks = () => setState((current) => {
    let nextState = current;
    for (let index = 0; index < 10; index += 1) {
      nextState = tickSimulation({ ...nextState, topology }, scenario);
    }
    return nextState;
  });
  const reset = () => {
    const nextTopology = cloneTopology();
    setTopology(nextTopology);
    setState(createSimulation(nextTopology));
  };

  const toggleAlerting = () => syncTopology({ ...topology, observability: { ...topology.observability, alerting: !topology.observability.alerting } });
  const toggleBackups = () => syncTopology({
    ...topology,
    components: topology.components.map((component) => component.kind === "database" ? {
      ...component,
      metadata: { ...component.metadata, backupEnabled: !component.metadata?.backupEnabled, backupVerified: !component.metadata?.backupVerified },
    } : component),
  });
  const addApiReplica = () => syncTopology({
    ...topology,
    components: topology.components.map((component) => component.id === "api" ? {
      ...component,
      placements: component.placements.map((placement, index) => index === 0 ? { ...placement, replicas: placement.replicas + 1 } : placement),
    } : component),
  });

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Prod Survivor</p>
          <h1>Datacenter Architect Simulator</h1>
          <p className="hero-copy">Два режима работы: консольный сценарий для быстрых прогонов и интерактивный React/Vite интерфейс с картой сети через React Flow.</p>
        </div>
        <div className="hero-actions">
          <button onClick={advanceTick}>Next tick</button>
          <button onClick={runTenTicks}>Run 10 ticks</button>
          <button className="secondary" onClick={reset}>Reset</button>
        </div>
      </header>

      <section className="stats-grid">
        <article><span>Scenario</span><strong>{scenario.name}</strong><small>{scenario.level} · target {scenario.targetSla}% SLA</small></article>
        <article><span>Tick</span><strong>{state.tick}</strong><small>{state.activeIncidents.length} active incidents</small></article>
        <article><span>Availability</span><strong>{formatPercent(state.availability)}</strong><small>{state.customerImpact ? "Customer impact" : "No customer impact"}</small></article>
        <article><span>Score</span><strong>{score.total.toFixed(1)}</strong><small>Risk: {review.riskLevel}</small></article>
      </section>

      <TopologyFlow topology={topology} activeIncidents={state.activeIncidents} />

      <section className="dashboard-grid">
        <article className="panel">
          <p className="eyebrow">Interactive controls</p>
          <h2>Architecture changes</h2>
          <div className="control-list">
            <button onClick={addApiReplica}>Add API replica</button>
            <button onClick={toggleAlerting}>{topology.observability.alerting ? "Disable" : "Enable"} alerting</button>
            <button onClick={toggleBackups}>Toggle DB backups</button>
          </div>
          <p className="muted">Изменения сразу пересчитывают review, score и подсказки coach.</p>
        </article>

        <article className="panel">
          <p className="eyebrow">Monitoring</p>
          <h2>Latest metrics</h2>
          {latestMetric ? (
            <dl className="metrics-list">
              <div><dt>Latency</dt><dd>{latestMetric.latencyMs} ms</dd></div>
              <div><dt>Throughput</dt><dd>{latestMetric.throughputRps} rps</dd></div>
              <div><dt>Error rate</dt><dd>{(latestMetric.errorRate * 100).toFixed(2)}%</dd></div>
              <div><dt>Replication lag</dt><dd>{latestMetric.replicationLagSeconds}s</dd></div>
            </dl>
          ) : <p className="muted">Run a tick to collect metrics.</p>}
        </article>

        <article className="panel">
          <p className="eyebrow">Architecture review</p>
          <h2>{review.issuesFound} findings</h2>
          <ul className="feed">{review.findings.slice(0, 5).map((finding) => <li key={finding.message} className={finding.severity}>{finding.message}</li>)}</ul>
        </article>

        <article className="panel">
          <p className="eyebrow">Event feed</p>
          <h2>Simulation log</h2>
          <ul className="feed">{state.events.slice(-6).reverse().map((event) => <li key={`${event.tick}-${event.message}`} className={event.level}>T{event.tick}: {event.message}</li>)}</ul>
        </article>

        <article className="panel wide">
          <p className="eyebrow">Coach</p>
          <h2>Lessons and hints</h2>
          <ul className="feed">{[...coach.hints, ...coach.lessons].slice(0, 6).map((message) => <li key={message}>{message}</li>)}</ul>
        </article>
      </section>
    </main>
  );
};
