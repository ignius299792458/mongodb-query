# REPLICATION MODEL

> 🔹 Replica Sets
> 🔹 Automatic Failover
> 🔹 Read Preference Tuning
> 🔹 Write Concern for Durability

---

## 🧬 I. REPLICATION

Replication in MongoDB is powered by **replica sets**. This system ensures high availability, data redundancy, durability, and read scalability across multiple MongoDB instances.

---

### 🔹 1. REPLICA SETS

---

#### ➤ What is a Replica Set?

A **Replica Set** is a **group of MongoDB servers** that maintain the **same dataset**.
It provides **redundancy** and **high availability** through **data replication**.

#### ➤ Components of a Replica Set:

| Node Type     | Role & Behavior                                                                      |
| ------------- | ------------------------------------------------------------------------------------ |
| **Primary**   | Accepts all write and strong read operations. Only one primary at a time.            |
| **Secondary** | Copies the primary’s data via the **oplog** (operation log). Read-only (by default). |
| **Arbiter**   | Votes in elections, doesn't store data or accept reads/writes.                       |

#### ➤ Oplog (Operation Log)

- A **capped collection** (`local.oplog.rs`) maintained by the primary.
- Contains all **write operations** applied to the database (not reads).
- Secondaries **tail** this oplog to **replicate data** asynchronously.

#### ➤ Replica Set Example:

Let’s assume a banking system replica set with 3 members:

```yaml
rs0:
  - PRIMARY: mongodb1 (Write location)
  - SECONDARY: mongodb2
  - SECONDARY: mongodb3
```

---

### 🔄 2. AUTOMATIC FAILOVER

---

#### ➤ What Is Automatic Failover?

If the **primary becomes unreachable**, the replica set will **elect a new primary** automatically to ensure continued write operations.

#### ➤ The Election Process:

1. **Health Check**: Every 2 seconds, nodes send **heartbeats** to each other.
2. **Detection**: If a node misses 2 consecutive heartbeats (\~4–10 seconds), it's considered **unavailable**.
3. **Election Triggered**: The remaining secondaries call for an **election**.
4. **Voting**: Nodes vote (1 per eligible voter), majority needed to elect.
5. **New Primary**: A healthy secondary is promoted to **primary**.

#### ➤ Election Eligibility Factors:

| Factor           | Rule                                                               |
| ---------------- | ------------------------------------------------------------------ |
| Priority Setting | `priority: 0` means not eligible for primary                       |
| Opt-out Node     | Set `votes: 0` to remove from voting                               |
| Oplog Freshness  | Node with **most up-to-date** data has higher chance to be elected |

#### 🏦 Banking Use Case Example:

- A **primary node fails** during a customer’s fund transfer.
- A **secondary becomes the new primary** within \~12 seconds.
- The application retries the failed write via **retryable writes**.
- The system continues without downtime or manual intervention.

---

### 📚 3. READ PREFERENCE TUNING

---

**Read Preference** defines **from which node (primary/secondary)** your application reads data.

### ➤ Modes:

| Read Preference      | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| `primary` (default)  | All reads go to the current primary. Strong consistency guaranteed.   |
| `primaryPreferred`   | Read from primary if available; otherwise from secondaries.           |
| `secondary`          | All reads from secondaries. May be stale (**eventually consistent**). |
| `secondaryPreferred` | Read from secondaries if available; otherwise from primary.           |
| `nearest`            | Reads from node with **lowest network latency** (based on ping time). |

### ➤ Tuning Options:

- `maxStalenessSeconds`: Prevent reading from **very stale** secondaries.
- `tags`: Direct reads to specific node(s) based on **region, zone, or purpose**.

#### 🏦 Banking Example:

- Fraud detection service reads from **secondaryPreferred**.
- User account dashboard reads from **nearest** for fast latency.
- Critical balance checks use **primary** to ensure **read-your-own-write** consistency.

---

### 🛡️ 4. WRITE CONCERN FOR DURABILITY

---

**Write Concern** controls **how many nodes** acknowledge a write before it's considered **successful**.

### ➤ Syntax:

```js
{ writeConcern: { w: <value>, j: <bool>, wtimeout: <ms> } }
```

### ➤ Write Concern Levels:

| Write Concern    | Description                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| `w: 1` (default) | Acknowledged by the **primary** only                                         |
| `w: "majority"`  | Acknowledged by the **majority of replica set members**                      |
| `w: 0`           | **Unacknowledged** — write returns immediately (not recommended for banking) |
| `j: true`        | Acknowledged after being **written to the journal** (on-disk durability)     |
| `wtimeout`       | If write isn't acknowledged within time, an error is returned                |

#### 🧠 Important:

- `w: "majority"` + `j: true` is **safest** combination for **financial systems**.
- Without it, in a failover, **acknowledged writes** might not persist on new primary.

#### 🏦 Banking Example:

- Customer initiates a **fund transfer**.
- MongoDB is set to `{ w: "majority", j: true }`
- MongoDB acknowledges the transfer only after it's written to **journal** and **majority of nodes** have replicated it.

---

## ✅ Summary Table

| Feature            | Detail                                                             |
| ------------------ | ------------------------------------------------------------------ |
| Replica Sets       | Redundant data storage via oplog-based replication                 |
| Automatic Failover | New primary is elected if the current one fails                    |
| Read Preference    | Allows routing reads to secondaries, nearest, or primary           |
| Write Concern      | Configurable durability (from `w: 0` to `"majority" + journaling`) |

---
