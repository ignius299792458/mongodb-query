# 🧩 When to Use a Hashed Index in MongoDB

(and when not to)

---

## ✅ What Is a Hashed Index?

A hashed index in MongoDB stores the hashed value of a field (typically a shard key) rather than the actual value. This allows for:

- Uniform distribution of data across shards
- Fast equality queries

It’s created like this:

```javascript
db.Transaction.createIndex({ accountId: "hashed" });
```

🔑 Note: Hashing destroys any notion of order → no range or prefix-based access.

---

## ✅ When Should You Use a Hashed Index?

### 1. 📊 Sharding Based on a Field

If you’re using sharding and want to avoid “hot partitions” (shards with uneven data), hashing is your friend.

▶️ Why? Hashing spreads the values uniformly — even if original values are clustered.

💡 Banking Example:
If account IDs are generated sequentially (e.g., acc_1001, acc_1002, …), then using them directly as a shard key causes all writes to hit the same shard → a bottleneck.

✅ Solution:
Use a hashed shard key:

```javascript
sh.shardCollection("Transaction", { accountId: "hashed" });
```

Now accountId is evenly distributed across all shards.

---

### 2. ⚡ Fast Equality Queries (Only)

A hashed index is great for:

```javascript
db.Transaction.find({ accountId: "acc_10045" }) ✅
```

But not for:

```javascript
db.Transaction.find({ accountId: { $gt: "acc_10000" } }) ❌
```

Why? Because hash values are meaningless with respect to order.

---

### 3. 🏗️ Scenarios with High Cardinality Fields

Hashed indexes work best when the field values have:

- High cardinality (i.e., many distinct values)
- Uniform distribution is desirable

⚠️ Low cardinality values like gender ("M", "F") are bad candidates → hash doesn’t help.

---

## ❌ When NOT to Use a Hashed Index

| Situation          | Why Hashed Index Fails                                      |
| ------------------ | ----------------------------------------------------------- |
| Range Queries      | Hashing destroys order (can’t do \$gt, \$lt)                |
| Sorting            | You can’t sort with a hashed index                          |
| Compound Filtering | Hashed field can't be used in compound indexes meaningfully |
| Covered Indexing   | You can’t use projection efficiently with hashed values     |
| Analytical Queries | If your queries need to traverse ranges or orderings        |

---

## 🧠 DSA-Level Tradeoff

| Property             | Normal B-Tree Index              | Hashed Index                |
| -------------------- | -------------------------------- | --------------------------- |
| Lookup by =          | ✅ Fast (log n)                  | ✅ Fast (hash lookup)       |
| Range Query          | ✅ Ordered scan                  | ❌ Impossible               |
| Uniform Distribution | ❌ Sequential values → clustered | ✅ Hashed spreads evenly    |
| Sort Support         | ✅ (for indexed fields)          | ❌                          |
| Sharding Suitability | ❌ May skew shards               | ✅ Best for balanced shards |

---

## 👓 Real-World Banking Example

Imagine a sharded MongoDB cluster storing 1 billion transactions, and accountId is sequential.

- If you use { accountId: 1 }, all new transactions go to the last shard (write bottleneck).
- If you use { accountId: "hashed" }, transactions are evenly distributed → optimal horizontal scalability.

---

## 🧠 Final Rule of Thumb:

| Use Hashed Index If...                | Avoid Hashed Index If...                         |
| ------------------------------------- | ------------------------------------------------ |
| You’re sharding with a sequential key | You need range queries or sorting                |
| You only perform equality lookups     | You do analytics, filtering, or compound sorting |
| You want balanced data distribution   | You care about key order or min/max grouping     |
