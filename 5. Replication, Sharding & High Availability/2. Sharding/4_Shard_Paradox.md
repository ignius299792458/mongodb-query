# 🔄 Sharding Paradox

> **“Hashed sharding is best for write balance; range sharding is best for efficient reads.”**

So you **can't easily optimize for both** unless:

- Your data access patterns are simple
- Or, you **design a hybrid or zone-based solution**

---

## 🔍 Let’s break it down:

### 🔹 Hashed Sharding

| Strength                                   | Weakness                                        |
| ------------------------------------------ | ----------------------------------------------- |
| 📤 Even write distribution across shards   | ❌ Breaks natural ordering, bad for range reads |
| ✅ Simple to implement                     | ❌ Can’t do efficient `$gte`/`$lte` queries     |
| ✅ Works well with high-concurrency writes | ❌ Poor query targeting for sorted reads        |

#### ➕ Good for:

- Banking `transactions` where writes are frequent and must be uniformly spread
- IoT, telemetry data, game state updates

---

### 🔸 Range-Based Sharding

| Strength                                                         | Weakness                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| ✅ Efficient range queries                                       | ❌ Can lead to shard "hotspots" for sequential inserts |
| ✅ Allows zone-based sharding (e.g., per country)                | ❌ Requires careful shard key selection                |
| ✅ Supports data locality (e.g., read all EU data from EU shard) | ❌ Write load may be unbalanced                        |

#### ➕ Good for:

- Reports like: "transactions in last 24 hours"
- Dashboards that show trends over time

---

## 💡 So how do we resolve the paradox?

### ✅ **Strategy 1: Composite Shard Keys**

Combine **hashed + ranged** values.

**Example:**

```js
sh.shardCollection("banking.transactions", {
  region: 1,
  accountNumber: "hashed",
});
```

- 🔹 `region` → helps **read locality**
- 🔹 `hashed accountNumber` → spreads **writes evenly**
- ⚠️ Limitation: You must always query with both `region` and `accountNumber` to get good routing.

---

### ✅ **Strategy 2: Zone-Based Sharding**

Use **range sharding**, then assign shards to regions.

```js
sh.updateZoneKeyRange(
  "banking.transactions",
  { region: "EU" },
  { region: "EU" },
  "europe-zone"
);
```

- ✅ Best of both worlds: range-based reads with write segregation by geography
- ⚠️ Write imbalance if one region is dominant

---

### ✅ **Strategy 3: Dedicated Write vs Read Collections**

Split high-frequency **write workloads** into one collection (hashed) and analytical **read workloads** into another (range).

This is called **polyglot persistence** or **write-optimized vs read-optimized** design.

---

## 🎯 TL;DR

| Goal                       | Best Sharding Strategy                          |
| -------------------------- | ----------------------------------------------- |
| ✅ Even Write Load         | `hashed` shard key                              |
| ✅ Fast Range Reads        | `range` shard key                               |
| ✅ Balanced Reads + Writes | compound key: `{ region: 1, userId: "hashed" }` |
| ✅ Geographic routing      | range-based + **zones**                         |

---

### 🔁 Final Thought:

It _is_ a paradox. Solving it requires a **strategic trade-off** based on your **workload profile** and **business constraints**.
