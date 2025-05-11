# 🧬 ii. Migration Techniques in MongoDB

These techniques help you safely evolve and migrate data structures in live or large-scale systems (like your banking platform) without downtime or data loss.

### 🚀 Overview

When evolving a schema or changing data format, migration techniques help **move existing documents** from the **old structure** to the **new structure** efficiently, reliably, and with minimal disruption.

MongoDB offers multiple tools and strategies, including:

1. **Bulk Writes**
2. **Aggregation Pipelines for Transforms**
3. **Blue/Green or Rolling Migrations**
4. **Change Streams for Syncing Data Across Systems**

---

## 🔹 1. **Bulk Writes**

### ✅ Use Case:

Efficient for **one-time** migrations when documents can be processed and updated in large batches.

### 🧰 Method:

Use `updateMany`, `bulkWrite`, or language-specific batching tools (like in Java or Node.js drivers).

### 📦 Example – Add `currency: "USD"` to all BankAccounts:

```js
db.bankAccounts.updateMany(
  { currency: { $exists: false } },
  { $set: { currency: "USD", _schemaVersion: 2 } }
);
```

### 🛠️ Java Code Sample:

```java
Query query = new Query(Criteria.where("currency").exists(false));
Update update = new Update().set("currency", "USD").set("_schemaVersion", 2);
mongoTemplate.updateMulti(query, update, BankAccount.class);
```

### ⚠️ Risks:

- Might impact performance on large datasets.
- Should be done in batches with rate limits or during off-peak hours.

---

## 🔹 2. **Aggregation Pipelines for Transforms**

### ✅ Use Case:

When the migration involves **reshaping documents**, **splitting/merging fields**, or **format changes**.

### 🧰 Method:

Use aggregation stages like `$project`, `$addFields`, `$unset`, then **store output** via `$merge` or `$out`.

### 📦 Example – Rename `txnAmount → amount` and set version:

```js
db.transactions.aggregate([
  { $addFields: { amount: "$txnAmount", _schemaVersion: 2 } },
  { $unset: "txnAmount" },
  {
    $merge: {
      into: "transactions",
      whenMatched: "merge",
      whenNotMatched: "insert",
    },
  },
]);
```

### 🧠 Why This Works:

- `$merge` rewrites documents into the target collection.
- You can **process in-place** or move to a **temporary collection** for testing first.

### 🛠️ Use with:

- **Complex field transformations**
- **Flattening or embedding**
- **Data normalization/denormalization**

---

## 🔹 3. **Blue/Green or Rolling Migrations**

### ✅ Use Case:

Used in **production environments** where downtime is unacceptable and you need a safe deployment strategy.

### 🧰 Method:

1. **Blue** = current system using old schema
2. **Green** = new version of system using new schema
3. Traffic is **gradually shifted** to green after validating data consistency.

### 🔄 Steps:

- Deploy a **new microservice/database copy** (green) alongside the old (blue).
- Sync data or migrate gradually.
- Perform **shadow reads/writes** to validate.
- Flip traffic over once validated.
- Rollback if errors detected.

### 🧠 Best For:

- **Zero-downtime migrations**
- **Critical systems like banking or payments**
- Supporting **multiple schema versions simultaneously**

---

## 🔹 4. **Change Streams for Syncing Data Across Systems**

### ✅ Use Case:

Used when you need to:

- **Propagate migrated data to external systems**
- **Incrementally sync** documents in real time
- **Keep old & new collections in sync during migration**

### 🧰 Method:

MongoDB Change Streams (available with replica sets or sharded clusters) allow you to **watch a collection** and trigger logic on updates.

### 📦 Example – Watch `transactions` collection:

```js
db.transactions
  .watch([{ $match: { operationType: { $in: ["insert", "update"] } } }])
  .forEach((change) => {
    // Example: replicate or transform data to another collection/system
    transformAndSync(change.fullDocument);
  });
```

### 🧠 Best For:

- **Event-driven migration**
- **Streaming migration for large datasets**
- **Migrating to another database or microservice**

---

## 🧭 Choosing the Right Technique

| Technique                  | Best When                        | Pros                      | Cons                                    |
| -------------------------- | -------------------------------- | ------------------------- | --------------------------------------- |
| **Bulk Writes**            | Schema change is simple & quick  | Fast, easy                | Risk of performance hits                |
| **Aggregation Transforms** | Need to reshape or reformat data | Flexible, expressive      | Slightly complex syntax                 |
| **Blue/Green or Rolling**  | Production-safe, high-risk apps  | Zero downtime, reversible | Needs infra/setup planning              |
| **Change Streams**         | Streamed migration or syncing    | Real-time, consistent     | Requires replica set, higher infra cost |

---

## ✅ Summary

| Task                         | Tool                                          |
| ---------------------------- | --------------------------------------------- |
| Add/modify fields            | `updateMany` / bulk writes                    |
| Reshape documents            | `$project`, `$addFields`, `$unset` + `$merge` |
| Zero-downtime live migration | Blue/Green deployments                        |
| Keep systems in sync         | Change Streams                                |

---
