# Sharding

> - Choosing Optimal Shard Keys
> - Chunk Balancing
> - Zone-Based Sharding

---

## ⚡️ II. SHARDING IN MONGODB

---

### 🔧 What is Sharding?

**Sharding** is the process of **`partitioning data horizontally`** across multiple servers (called **`shards`**) to:

- Handle large datasets
- Scale reads and writes
- Avoid hitting hardware limits (like RAM or storage)

Each shard holds a **subset** of the collection’s documents. Together, all shards make up the full dataset.

# 🔹 1. Choosing `optimal shard`

The **shard key** is the field (or compound field) MongoDB uses to **distribute documents** across shards.

### ➤ What makes a good shard key?

A good shard key has:

| Property                 | Why It’s Important                                                |
| ------------------------ | ----------------------------------------------------------------- |
| **High cardinality**     | Prevents many documents going to one shard                        |
| **Even distribution**    | Balances read/write load across shards                            |
| **Monotonicity Avoided** | Prevents **hotspotting**, where one shard handles all new inserts |
| **Query targeting**      | Enables **mongos** to route queries to relevant shards            |

---

### ❌ Avoid Monotonic Shard Keys like `_id` or Timestamps

Using a monotonically increasing field like `ObjectId` or `createdAt` as shard key leads to:

- All **new inserts** go to the **last chunk**
- One shard becomes a **hotspot**
- Others sit idle, defeating the purpose of sharding

### ✅ Better Shard Key: Example for Banking System

Suppose your `Transaction` documents have:

```json
{
  "_id": "txn123",
  "accountNumber": "ACCT0001",
  "amount": 500,
  "timestamp": "2024-05-09T10:20:30Z",
  "region": "us-east"
}
```

Use compound shard key:
`{ accountNumber: 1, region: 1 }`

Benefits:

- `accountNumber` has high cardinality
- `region` improves **zone-based locality**
- Not monotonic → avoids write skew

# 2. Chunk Balancing

### ➤ What Is a Chunk?

MongoDB divides a sharded collection into **chunks**, where each chunk represents a **range of shard key values**.

- Default size: **64 MB**
- When chunk exceeds threshold, it is **split**.

### ➤ Balancer

The **Balancer** is a background process that:

- Monitors shard distribution
- Moves **overloaded chunks** from one shard to another
- Keeps **chunks balanced** across shards

### ➤ Chunk Migration Process

1. Balancer detects imbalance
2. Locks chunk (writes paused temporarily)
3. Clones chunk to target shard
4. Catches up changes (delta sync)
5. Deletes from source shard

### 🧠 Important:

- The balancer **runs automatically** in a sharded cluster.
- You can pause or schedule it (e.g., during low traffic hours).
- Migration is **safe** and **transparent** to the application.

#### Banking Example:

Imagine millions of `Transaction` records for customers in `us-east` are on Shard1.
Balancer moves some chunks to Shard2 and Shard3 to evenly distribute load.

# 3. Zone-Based Sharding (Shard Tagging)

**Zone-based sharding** (also called **`shard tagging`**) allows assigning **specific data ranges to specific shards**.

Use case: **Geo-partitioning** or **regulatory compliance** (e.g., data stays in region).

### ➤ Steps:

1. **Tag Shards**:

   ```sh
   sh.addShardTag("shard1", "us-east")
   sh.addShardTag("shard2", "us-west")
   ```

2. **Assign Zone Ranges**:

   ```sh
   sh.updateZoneKeyRange("banking.transactions",
     { region: "us-east" },
     { region: "us-east" },
     "us-east")
   ```

3. **MongoDB now ensures** all documents with `region: "us-east"` go to `shard1`, etc.

### ➤ Benefits:

| Feature                    | Use Case                                 |
| -------------------------- | ---------------------------------------- |
| **Data locality**          | Serve users from nearest region          |
| **Regulation enforcement** | Keep EU data in EU-based servers         |
| **Performance tuning**     | Co-locate users' data for faster queries |

#### Banking Example:

- Shard1 is located in `us-east`, handles all **East Coast** customers
- Shard2 is in `eu-central`, handles **European** customers
- Write and query performance improve due to **data proximity**

---

## 🔒 Summary Table

| Feature             | Purpose & Key Notes                                                         |
| ------------------- | --------------------------------------------------------------------------- |
| Shard Key           | Must avoid monotonicity; choose high cardinality, evenly distributed fields |
| Chunk Balancing     | Automatic redistribution of data to maintain balance                        |
| Zone-Based Sharding | Assign shard ranges to physical/geographical zones                          |

---
