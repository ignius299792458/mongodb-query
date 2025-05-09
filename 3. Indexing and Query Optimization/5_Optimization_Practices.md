# 🧠 Indexing & Query Optimization Practices

These are strategic patterns that ensure your indexes and queries are working with—not against—each other for maximum performance.

We’ll break this down into:

- Covered Indexes
- Index Cardinality & Selectivity
- Regex Index Pitfalls
- TTL Indexes
  With real-world banking system use-cases, edge-case insights, and performance implications.

---

## 🔹 1. Covered Indexes

A query is “covered” by an index if:

1. All the fields in the query predicate (filter)
2. All the fields in the projection (returned fields)
   are included in a single index.

When this happens, MongoDB does not need to fetch the actual document at all. It uses only the index → Faster, less memory, no I/O.

### ✅ Benefits:

- Completely avoids document lookups
- Reduces disk I/O
- Highly memory-efficient
- Can serve results directly from the index

### 🔍 Banking System Example:

Get the timestamps and amounts of all transactions for a specific account:

```typescript
db.Transaction.find(
  { accountId: "acc_12345" },
  { amount: 1, timestamp: 1, _id: 0 }
);
```

Create the index:

```javascript
db.Transaction.createIndex({ accountId: 1, amount: 1, timestamp: 1 });
```

This query is now a fully covered query.

💥 Without projection, i.e., returning all fields:

```typescript
db.Transaction.find({ accountId: "acc_12345" });
```

→ Not covered; it must fetch each document.

### ❗ Edge Case:

- If even one field in your projection is missing in the index, MongoDB will go to the document → no longer covered
- Covered queries only work for non-analyzed fields (not text indexes)
- Don’t try to cover everything—huge indexes are bad (over-indexing)

---

## 🔹 2. Index Cardinality & Selectivity

These determine how “effective” an index is at filtering.

- 🟡 Cardinality = Number of unique values in a field
- 🟢 Selectivity = Fraction of documents returned by a filter

- 👉 High cardinality & high selectivity = ideal for indexes
- 👉 Low cardinality (e.g., boolean or status flags) = weak filters

### ✅ Banking System Example:

Bad index:

```javascript
db.Transaction.createIndex({ transactionType: 1 });
```

Why?
transactionType might be only \["DEBIT", "CREDIT", "TRANSFER"] — very low cardinality. A query like:

```typescript
db.Transaction.find({ transactionType: "DEBIT" });
```

may still touch 40–50% of the documents.

Better:

```javascript
db.Transaction.createIndex({ accountId: 1, timestamp: -1 });
```

accountId has high cardinality, timestamp helps sort

📌 MongoDB Query Planner may ignore an index with poor selectivity → fall back to COLLSCAN.

### ❗ Edge Case:

- Even if an index exists, MongoDB skips it if the planner estimates poor benefit
- You can force index usage using hint(), but this is dangerous unless you’re absolutely sure:

```typescript
db.Transaction.find({ transactionType: "CREDIT" }).hint({ transactionType: 1 });
```

---

## 🔹 3. Avoid Regex Without Prefix

MongoDB cannot use indexes efficiently if the regex starts with a wildcard or variable character.

### ✅ Good (can use index):

```typescript
db.Customer.find({ name: /^John/ });
```

Because index is lexically sorted, ^John can be binary searched.

### ❌ Bad (can’t use index):

```typescript
db.Customer.find({ name: /ohn/ }); // middle match
db.Customer.find({ name: /.*John/ }); // suffix wildcard
```

Index on name is useless here. MongoDB must scan all values → O(n)

### ✅ Index Tip:

If you're doing partial matches, use autocomplete-style tricks (e.g., storing name prefixes or n-grams separately).

---

## 🔹 4. TTL (Time-to-Live) Indexes

TTL indexes automatically delete documents after a specified duration, useful for ephemeral data like logs or OTPs.

### ➕ Syntax:

```javascript
db.OTP.createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 }); // 10 minutes
```

MongoDB checks TTL every 60 seconds and deletes expired docs.

### ✅ Banking System Use Case:

Say you have OTP or temporary login tokens:

```json
{
  otp: "123456",
  createdAt: ISODate("2025-05-09T10:00:00Z")
}
```

No need for cron jobs → the TTL index handles deletion.

### ❗ Edge Cases:

- TTL only works on a single date field
- You cannot compound TTL with other indexes
- Deletion is not immediate—it happens on a \~60-second polling interval
- MongoDB must be running; TTL deletions don't trigger if the server is down or overloaded

---

## 📌 Bonus Best Practices (Advanced)

| Practice                                   | Description                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| 🧾 Use explain("executionStats")           | Always verify actual query plans                                                      |
| 🧠 Cache Hot Fields in RAM                 | Index hot-access fields so they remain in working set                                 |
| ⛏ Minimize Index Count                     | Every index costs write performance and RAM                                           |
| 📈 Monitor with Atlas Profiler / Ops Tools | Catch slow queries early                                                              |
| 💡 Consider Covered Projections            | Use .find({}, { field1: 1, field2: 1 }) for projection when index covers those fields |

---
