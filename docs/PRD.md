# PRD: Prod Survivor — Datacenter Architect Simulator

## 1. Overview

### Product Name

Prod Survivor

### Tagline

Learn production architecture by surviving production incidents.

### Goal

Create an interactive simulation game where players design and operate distributed applications across multiple data centers and availability zones. The game teaches infrastructure architecture, Kubernetes, databases, high availability, disaster recovery, observability, and SRE practices through realistic failure scenarios.

### Primary Demo Goal

Demonstrate capabilities of Qwen Code SDK:

* Agent orchestration
* Multi-agent workflows
* Tool calling
* State management
* Simulation loops
* Infrastructure reasoning
* Architecture review
* Incident generation
* Interactive gameplay

---

# 2. Target Audience

## Primary

* Backend Developers
* DevOps Engineers
* SRE Engineers
* Platform Engineers
* Technical Leads

## Secondary

* Students learning distributed systems
* Solution Architects
* Engineering Managers

---

# 3. Core Gameplay Loop

1. Receive business requirements
2. Design infrastructure
3. Deploy architecture
4. Run simulation
5. Observe incidents
6. Investigate failures
7. Improve architecture
8. Increase score
9. Unlock harder scenarios

---

# 4. World Model

## Regions

Example:

* Europe
* US-East
* US-West
* Asia

## Availability Zones

Example:

```text
eu-a
eu-b
eu-c
```

Each zone contains:

* Kubernetes cluster
* Network characteristics
* Storage class
* Failure probability
* Cost

---

# 5. Infrastructure Components

## Compute

* Kubernetes Cluster
* Node Pools
* GPU Nodes
* Spot Nodes
* Managed Services

## Applications

* Frontend
* API Gateway
* Backend Services
* Workers
* Cron Jobs

## Databases

* PostgreSQL
* MySQL
* MongoDB
* Cassandra

## Caches

* Redis
* Memcached

## Messaging

* Kafka
* RabbitMQ
* NATS

## Storage

* Object Storage
* Shared Volumes
* Backups

## Observability

* Prometheus
* Grafana
* Loki
* Jaeger

---

# 6. Scenarios

## Beginner

Single application

Goal:

99.5% SLA

Includes:

* Frontend
* Backend
* PostgreSQL

---

## Intermediate

E-commerce Platform

Goal:

99.9% SLA

Includes:

* Frontend
* API
* PostgreSQL
* Redis
* Workers

---

## Advanced

Fintech Platform

Goal:

99.99% SLA

Requirements:

* Multi-AZ
* Multi-region
* DR plan
* Audit logs
* Backup verification

---

## Expert

Global Streaming Service

Requirements:

* Multi-region active-active
* Kafka
* CDN
* Cross-region replication
* Zero-downtime deployments

---

# 7. Architecture Editor

Players create topology using visual placement.

Example:

```yaml
backend:
  replicas: 6
  placement:
    - eu-a
    - eu-b

postgres:
  primary: eu-a

  replicas:
    - eu-b
    - eu-c
```

---

# 8. Incident System

## Incident Categories

### Infrastructure

* Power outage
* Network partition
* Disk failure
* Node crash

### Kubernetes

* Node pressure
* Pod eviction
* Failed rollout
* Ingress failure

### Database

* Primary failure
* Replication lag
* Disk full
* Corruption

### Traffic

* Traffic spike
* DDOS attack
* Bot traffic

### Human Errors

* Bad deployment
* Broken migration
* Misconfigured DNS
* Expired certificate

---

# 9. Qwen Agents

## Architect Reviewer

Responsibilities:

* Review topology
* Detect SPOF
* Calculate blast radius
* Evaluate HA

Output:

```text
Issues Found: 3

Critical:
- PostgreSQL primary isolated in single AZ

Warning:
- Monitoring deployed in one zone
```

---

## Chaos Master

Responsibilities:

* Generate incidents
* Escalate complexity
* Create realistic failure chains

Example:

```text
Network latency increased 400%
Replication lag growing
Failover required
```

---

## Incident Commander

Responsibilities:

* Simulate consequences
* Determine impact
* Produce outage reports

---

## Coach

Responsibilities:

* Explain mistakes
* Provide hints
* Teach architecture principles

---

# 10. Scoring System

Total Score: 100

Availability: 30

Data Safety: 25

Scalability: 20

Observability: 10

Cost Efficiency: 15

Formula:

```text
Final Score =
Availability +
Safety +
Scalability +
Observability +
Cost
```

---

# 11. User Interface

## Technology

Frontend:

* React
* TypeScript
* Tailwind
* React Flow

Backend:

* Node.js
* Qwen Code SDK

---

# 12. Main Screen Layout

```text
+--------------------------------------------------+
| Scenario | Budget | SLA | Time                   |
+--------------------------------------------------+

+----------------+-------------------------------+
| Infrastructure | Simulation View               |
|                |                               |
| Regions        | Events                        |
| Clusters       | Logs                          |
| Services       | Alerts                        |
| Databases      | Metrics                       |
+----------------+-------------------------------+

+--------------------------------------------------+
| AI Review Panel                                 |
+--------------------------------------------------+
```

---

# 13. Infrastructure Canvas

Visual drag-and-drop editor.

Objects:

* Regions
* AZs
* Clusters
* Services
* Databases

Connections:

* Service dependencies
* Network links
* Replication links

Colors indicate health state:

Green

Healthy

Yellow

Degraded

Red

Unavailable

---

# 14. Incident Dashboard

Live feed:

```text
12:00 AZ-B network degraded

12:02 PostgreSQL lag 45 sec

12:05 API error rate 18%

12:07 Customer impact detected
```

---

# 15. Monitoring View

Metrics:

* Latency
* Throughput
* Error Rate
* CPU
* Memory
* Replication Lag

Displays:

* Graphs
* Alerts
* Service Maps

---

# 16. Architecture Review Panel

Generated by Qwen Agent.

Sections:

* Critical Issues
* Recommendations
* SLA Prediction
* Estimated Blast Radius

Example:

```text
Predicted SLA:
99.72%

Risk Level:
Medium

Critical Findings:
2
```

---

# 17. Progression System

Levels unlock:

1. Single AZ
2. Multi AZ
3. Kubernetes
4. Databases
5. Kafka
6. Multi Region
7. DR Scenarios
8. Global Scale

---

# 18. Future Features

* Multiplayer architecture battles
* AI-vs-AI competitions
* Terraform mode
* Kubernetes manifest mode
* GitOps mode
* Real cloud provider presets
* AWS/Azure/GCP topology packs
* Internal enterprise topology packs

---

# 19. Technical Requirements

## Performance

Simulation tick:

<100ms

Architecture validation:

<2 seconds

Agent review:

<10 seconds

Support:

10,000+ infrastructure objects

---

# 20. Success Criteria

Player can:

* Design production topology
* Survive generated incidents
* Reach target SLA
* Eliminate single points of failure
* Build disaster recovery plans

Demonstration clearly showcases:

* Qwen Code SDK
* Agent workflows
* Infrastructure reasoning
* Multi-agent coordination
* Interactive simulation
* Real-world production engineering concepts
