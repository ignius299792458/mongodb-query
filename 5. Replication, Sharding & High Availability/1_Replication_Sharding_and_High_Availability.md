Absolutely, Ignius. Let’s go **in-depth** into the three pillars of MongoDB's distributed architecture that support **scalability, performance, and availability**:

> 🔹 **Replication**
> 🔹 **Sharding**
> 🔹 **High Availability**

We’ll break down **how they work**, **when to use them**, **their internals**, and **banking system implications**.

---

# 🧬 1. REPLICATION

---

## 🧠 What Is Replication?

**Replication** is the process of **copying data from one MongoDB server (primary)** to **one or more servers (secondaries)** to ensure **redundancy**, **data durability**, and **failover capability**.

## 🧱 Architecture: Replica Set

A **replica set** is a group of MongoDB instances that maintain the **same data set**.

- **Primary Node**: Receives all writes.
- **Secondary Nodes**: Replicate data from the primary using **oplog** (operation log).
- **Arbiter** _(optional)_: Participates in elections but holds no data.

```
+-------------+     oplog sync    +-------------+
|  PRIMARY    | <---------------> |  SECONDARY  |
+-------------+                   +-------------+
        |
        +---+ write only         +-------------+
            +------------------> |  SECONDARY  |
                                 +-------------+
```

## ⚙️ Internals:

- Secondaries **tail** the primary’s **oplog** (capped collection of operations).
- In case of failure, **automatic election** happens to pick a new primary.
- Heartbeats are exchanged every 2 seconds to detect failure.

## 📌 Benefits:

- **High Availability**: Automatic failover to secondaries.
- **Read Scaling**: Secondary reads (eventually consistent).
- **Backup**: Non-blocking snapshot backups from secondaries.

---

## 🏦 Banking Use Case:

In a financial system:

- You write all transactions to the **primary**.
- Your dashboard analytics or reporting service can **read from secondaries**.
- If the primary fails, a secondary becomes primary, ensuring no downtime in funds access.

---

## ✳️ Key Features:

| Feature          | Detail                                              |
| ---------------- | --------------------------------------------------- |
| Write Concern    | `{ w: "majority" }` ensures replication to majority |
| Read Preference  | `primary`, `secondary`, `nearest`, etc.             |
| Oplog Size       | Fixed size; operations trimmed on overflow          |
| Election Timeout | 10 seconds (default)                                |

---

# 🌐 2. SHARDING

## 🧠 What Is Sharding?

**Sharding** is MongoDB's way of **horizontally scaling** data across multiple **physical machines (shards)**.

It splits large datasets into **smaller chunks**, distributing them across **multiple shards**.

## 🔧 Components:

1. **Shard**: Each is a replica set and stores a subset of data.
2. **Config Server (3x)**: Stores metadata and routing information.
3. **Query Router (mongos)**: Acts as a proxy between client and shards.

```
           +---------+
Client --> | mongos  | --> Shard A (acct_id: 1–5000)
           +---------+ --> Shard B (acct_id: 5001–10000)
                       --> Shard C (acct_id: 10001–...)
```

## 🧩 Shard Key

A **shard key** is a field (or compound field) that determines **how data is partitioned**.

➡️ You must choose a **shard key carefully**, as it directly impacts performance.

## Types of sharding:

| Type      | Description                                         |
| --------- | --------------------------------------------------- |
| **Range** | Based on ranges of values (e.g., accountId: 1–5000) |
| **Hash**  | Hash-based distribution (balances load better)      |
| **Zoned** | Custom range + location-based constraints           |

---

## 🏦 Banking Use Case:

Let’s say you have **100 million accounts**:

- You shard on `accountId` or `customerId` using a **hashed shard key**.
- MongoDB auto-balances data across shards.
- A transfer request for `accountId: 90000` is routed to the right shard only.

---

## ⚠️ Sharding Pitfalls:

| Risk              | Description                                  |
| ----------------- | -------------------------------------------- |
| Bad shard key     | Can cause data skew or hot shards            |
| Broadcast queries | If query lacks shard key, it hits all shards |
| Chunk migrations  | Balancer moves chunks to maintain even load  |

---

# 🛡️ 3. HIGH AVAILABILITY

---

## 🧠 What Is High Availability?

**High Availability (HA)** means that the system can **tolerate failures and continue operating**, minimizing downtime and data loss.

In MongoDB, **HA is achieved through:**

1. **Replica Sets**: Auto failover
2. **Sharding with Replication**: Every shard is a replica set
3. **Write Concerns**: Control write safety
4. **Read Concerns**: Control read reliability

---

## 🧱 Failover Process:

If the **primary node** in a replica set crashes:

1. Election starts among secondaries.
2. New primary is elected within \~12 seconds.
3. Client drivers detect the new primary and resume operations.

> MongoDB Drivers (Node.js, Java, etc.) have **automatic retry** logic and re-routing.

---

## 📊 Banking High-Availability Scenario:

| Situation                    | Outcome                                           |
| ---------------------------- | ------------------------------------------------- |
| Primary replica crashes      | Secondary becomes new primary                     |
| Shard A replica crashes      | Other replica nodes continue serving reads/writes |
| Mongos node fails            | Use another mongos instance                       |
| Config server fails (1 of 3) | System continues, but can't make config changes   |

---

# 🔄 Putting It All Together (Banking System View):

| Layer           | MongoDB Feature   | Function                                              |
| --------------- | ----------------- | ----------------------------------------------------- |
| Data Redundancy | Replica Set       | Ensure no data loss, even on node failure             |
| Read Scaling    | Secondary Reads   | Analytics dashboards use secondaries                  |
| Write Scaling   | Sharding + Writes | High-throughput inserts from millions of transactions |
| Availability    | Replica + Mongos  | Transfer service stays alive even if a shard crashes  |
| Recovery        | Oplog Replay      | Replays missed operations on reconnected secondaries  |

---

# 📌 Summary Comparison Table:

| Feature       | Replication          | Sharding                   | High Availability                  |
| ------------- | -------------------- | -------------------------- | ---------------------------------- |
| Purpose       | Redundancy, Failover | Scale horizontally         | Uptime and fault tolerance         |
| Reads         | Secondary nodes      | Scoped to shards           | Load-balanced or resilient         |
| Writes        | Primary only         | To correct shard's primary | Retryable with write concern       |
| Key Mechanism | Oplog + Elections    | Shard Key + Balancer       | Replica elections, mongos, retries |
| Risk          | Stale secondaries    | Hot shards, key skew       | Delay during elections (\~10s)     |

---
