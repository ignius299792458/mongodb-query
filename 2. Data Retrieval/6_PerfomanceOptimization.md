# 🚀 **Performance Optimization in MongoDB Queries**

This is where real-world production systems either fly or crash. Let's go in-depth into every core technique — with theory, practical examples, and internal mechanisms.

---

## ⚙️ 1. **Covered Queries**

### ✅ What is a Covered Query?

A query is _covered_ when:

- The query **only uses indexed fields** (in filter + projection), and
- **All required data** is returned from the index **without scanning documents in the collection**.

This avoids accessing the collection at all — **extremely fast**.

---

### 📘 Example:

```js
db.transactions.createIndex({ accountId: 1, status: 1 });
```

Then:

```js
db.transactions.find(
  { accountId: ObjectId("..."), status: "COMPLETED" },
  { _id: 0, accountId: 1, status: 1 }
);
```

✅ This is a **covered query**.

- Filter: `accountId`, `status` → ✅ both are indexed.
- Projection: includes only `accountId`, `status` → ✅ nothing outside index.
- `_id: 0` is necessary unless `_id` is in the index.

### ⚠️ NOT a Covered Query:

```js
db.transactions.find({ accountId: ObjectId("...") }, { amount: 1 });
```

- `amount` not in the index → must **fetch full document**.

---

## 🔍 2. **Understanding `.explain()` and Query Plans**

MongoDB provides `.explain()` to show how it executes a query.

```js
db.transactions.find({ accountId: ObjectId("...") }).explain("executionStats");
```

### 🔹 Important Fields:

- `executionStats.nReturned`: number of docs returned
- `executionStats.totalDocsExamined`: how many docs scanned
- `executionStats.totalKeysExamined`: how many index keys scanned
- `executionTimeMillis`: how long it took

### 🧠 Goal:

- `totalDocsExamined` should be as low as possible (ideally == `nReturned`)
- Favor **IXSCAN** (Index Scan) over **COLLSCAN** (Collection Scan)

---

## 📌 3. **Index Selection & Planning**

MongoDB uses its **Query Planner** to decide:

- Which index to use
- In which order to access them
- Whether to use **index intersection**

### 🔄 Index Intersection

If no single index matches all fields, it may combine multiple indexes.

```js
db.transactions.createIndex({ accountId: 1 });
db.transactions.createIndex({ status: 1 });

db.transactions.find({
  accountId: ObjectId("..."),
  status: "COMPLETED",
});
```

MongoDB may **intersect both indexes**.

> Use `.explain()` to confirm. But note: **compound index** is better than intersection.

---

## 🚦 4. **COLLSCAN vs. IXSCAN**

### 🔴 COLLSCAN (Collection Scan)

Scans **every document** — slow.

```js
"stage": "COLLSCAN"
```

### ✅ IXSCAN (Index Scan)

Scans **only index entries** — fast.

```js
"stage": "IXSCAN"
```

---

## 📈 5. **Sort Performance & Indexes**

### ⚠️ Without Index on Sort Field:

```js
db.transactions.find({ accountId: ObjectId("...") }).sort({ createdAt: -1 });
```

→ MongoDB fetches all data → **sorts in memory** → **slow**.

### ✅ With Index:

```js
db.transactions.createIndex({ accountId: 1, createdAt: -1 });
```

→ Efficiently sorted using index → no in-memory sorting.

Use:

```js
{ "sortStage": { "hasSortStage": false } }
```

in `.explain()` to confirm it used index for sort.

---

## 🧠 6. **Filter First, Then Project, Then Sort**

Order of operations matters. Always:

1. **Filter** using highly selective indexes
2. **Project** only what you need (reduces document size)
3. **Sort** using indexed fields if possible

---

## 💣 7. **Avoid these Anti-patterns**

| Anti-Pattern                         | Why it's Bad                    |
| ------------------------------------ | ------------------------------- |
| `find({})` on large collections      | Full collection scan (COLLSCAN) |
| Regex without prefix                 | Can't use index efficiently     |
| `$ne`, `$nin`, or negated conditions | Can't use index, full scan      |
| Sorting on non-indexed field         | Memory sort, slow               |
| `skip()` with large values           | O(n) performance                |

---

## 💡 Bonus: Query Caching ≠ MongoDB

MongoDB **does not cache query results**. Instead:

- It relies on the **WiredTiger storage engine cache** (RAM-mapped disk blocks).
- So, repeated queries may become fast due to **OS-level disk page cache**, not MongoDB.

---

## 🔍 Real Use Case: Efficient Transaction Fetch

Suppose we want to fetch the latest 10 completed transactions of an account:

```js
db.transactions.createIndex({ accountId: 1, status: 1, createdAt: -1 });

db.transactions
  .find({
    accountId: ObjectId("abc123"),
    status: "COMPLETED",
  })
  .sort({ createdAt: -1 })
  .limit(10)
  .explain("executionStats");
```

✅ Uses compound index
✅ Fast sort
✅ Low scan count

---

## 🧠 Best Practices Summary

- ✅ Use **compound indexes** matching your queries.
- ✅ Always run `.explain("executionStats")` before production.
- ✅ Use **covered queries** for read-heavy paths.
- ✅ Avoid full scans unless truly necessary.
- ✅ Prefer **range-based pagination** over `.skip()` for performance.
- ✅ Keep index size optimized — not every field needs one.

---
