# 1. Detailed comparison of Range-based vs Hashed Sharding in MongoDB

## 🧠 Overview: What’s the Difference?

| Feature                   | **Range-Based Sharding**                           | **Hashed Sharding**                                       |
| ------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| 🔑 **Shard Key Type**     | `{ field: 1 }`, `{ field1: 1, field2: 1 }` (range) | `{ field: "hashed" }`                                     |
| 📦 **Chunk Split Logic**  | Based on **actual values** (sorted ranges)         | Based on **hashed values** (uniform distribution)         |
| 🚀 **Write Distribution** | May be uneven if data is skewed (e.g., timestamps) | Evenly spread by default due to hash randomness           |
| 🔎 **Query Efficiency**   | Fast for range/point queries using sorted indexes  | Slower for range queries (hash removes natural order)     |
| ⚙️ **Use Case Fit**       | Analytical, sequential, time-series queries        | High-write-load systems, randomness, uniform distribution |
| 🧠 **Shard Key Choice**   | Must be carefully chosen to avoid hotspotting      | Easier to implement, safer default for uniform writes     |

---

## 🧪 Examples

### 1. Range-Based Sharding

```js
sh.shardCollection("banking.transactions", { accountNumber: 1, region: 1 });
```

- 🔥 Best for: `find({ accountNumber: ..., region: ... })`
- 🔍 Supports range queries: `find({ accountNumber: { $gte: "ACCT1000", $lt: "ACCT2000" } })`
- 🚨 Risk: If account numbers are inserted in increasing order, a **write hotspot** may form on one shard.

---

### 2. Hashed Sharding

```js
sh.shardCollection("banking.transactions", { accountNumber: "hashed" });
```

- 🔥 Best for: evenly distributing inserts
- ❌ Poor for: range queries (e.g., "all accounts from ACCT1000 to ACCT2000")
- ✅ Great when you don’t need range queries, only equality matches

---

## 📚 Use Case-Based Comparison

| Use Case                                                       | Recommended Sharding Type     | Why?                                        |
| -------------------------------------------------------------- | ----------------------------- | ------------------------------------------- |
| 🔁 Time-series / chronological data (e.g., logs, transactions) | **Range** (on timestamp)      | Natural range partitioning                  |
| 🧾 Financial transactions (heavy writes, multi-account)        | **Hashed** (on accountNumber) | Spreads writes evenly                       |
| 📈 Reporting / analytics by date                               | **Range** (on `date`)         | Enables ranged scans efficiently            |
| 🌍 Geo-zoned data (e.g., by region)                            | **Range or Zoned Sharding**   | Combine with zones for geographic balancing |
| 📨 IoT or telemetry data                                       | **Hashed** (on deviceId)      | Even distribution, rarely queried by range  |
| 👨‍👩‍👧 Customer accounts (write-heavy, random access)              | **Hashed** (on customerId)    | Randomized inserts, uniform load            |

---

## ⚖️ Pros & Cons

| Type       | ✅ Pros                                                         | ❌ Cons                                                 |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| **Range**  | Efficient for sorting and range queries<br>Natural partitioning | Needs careful shard key design<br>Hotspotting risk      |
| **Hashed** | Very balanced write distribution<br>Easy to set up              | No range scan<br>Query planners can't use natural order |

---

## 📌 Quick Rule of Thumb:

> Use **Range-Based Sharding** when:
>
> - You often run **range queries** (e.g., between dates)
> - Your data naturally partitions (e.g., time windows)

> Use **Hashed Sharding** when:
>
> - You want **even write load**
> - You don’t run range queries often
> - You want to avoid thinking hard about shard key design initially

---
