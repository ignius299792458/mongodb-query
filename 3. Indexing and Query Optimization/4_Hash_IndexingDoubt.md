Doubt:

1. what is it meant by range query isn't possible with hash key and how
2. how this Uniform Distribution ✅ Hashed spreads evenly
3. Why hash index couldn't support sort, since hash are strongly unique, they can be sorted
4. How is this possible: Sharding Suitability ✅ Best for balanced shards

## ❓ 1. What does it mean that “Range Query isn’t possible with a hash key”?

### 🧠 First, What is a Range Query?

A range query is any filter that uses:

- \$gt, \$lt, \$gte, \$lte
- \$between
- Natural ordering (like date ascending, accountId increasing, etc.)

### 🛠️ Why Range Queries Don’t Work with Hashed Indexes:

Because the hash value has no meaningful relationship to the original field’s natural order.

👉 Hashing destroys order.

Let’s say you have accountIds:

```text
acc_1001, acc_1002, acc_1003, acc_1004
```

Their hash values (simplified):

```text
hash(acc_1001) → 9841
hash(acc_1002) → 1321
hash(acc_1003) → 4400
hash(acc_1004) → 6711
```

Now if you query:

```js
db.Transaction.find({ accountId: { $gt: "acc_1001" } });
```

In a normal index, MongoDB can walk the B-tree from acc_1001 upward → efficient.

In a hashed index, MongoDB would need to:

- Hash "acc_1001" → 9841
- But 9841 is not "less than" any predictable next value → the order is lost.

So it must scan the entire index → no performance benefit.

✅ OK:

```js
db.Transaction.find({ accountId: "acc_1003" });
```

❌ Not OK:

```js
db.Transaction.find({ accountId: { $gt: "acc_1001" } });
```

---

## ❓ 2. How does Hashing Ensure Uniform Distribution?

### 🧠 Core Principle:

Hash functions (e.g., MD5, SHA-1, Murmur3 in MongoDB) convert values into a fixed-size number that’s pseudo-random and uniformly distributed across the hash space.

Given values like:

```text
acc_0001 → hash1
acc_0002 → hash2
acc_0003 → hash3
acc_0004 → hash4
...
```

Even if input is sequential (acc_0001 → acc_9999), their hashes appear randomly spread.

### 🧪 Real-world Analogy:

Let’s say we shard by accountId directly:

- acc_0001 to acc_1000 → shard A
- acc_1001 to acc_2000 → shard B
- acc_2001+ → shard C

Result: All new inserts hit Shard C → imbalance

If you shard by hashed(accountId):

- acc_0001 → Shard B
- acc_0002 → Shard A
- acc_0003 → Shard C
- acc_0004 → Shard A
- acc_0005 → Shard B
  … all appear randomly spread

✅ This balances write & read load across shards.

---

## ❓ 3. Why can’t we sort by Hashed Fields?

Hash values can be sorted. But that sort is meaningless w\.r.t. original values.

### 🧪 Example:

Original accountIds:

```text
acc_1001, acc_1002, acc_1003, acc_1004
```

Their hashes:

```text
acc_1001 → 9823
acc_1002 → 3211
acc_1003 → 7811
acc_1004 → 1232
```

Now sorting by hash values:

```text
acc_1004 (1232)
acc_1002 (3211)
acc_1003 (7811)
acc_1001 (9823)
```

That is NOT the same as sorting by accountId:

```text
acc_1001
acc_1002
acc_1003
acc_1004
```

So:

- Sorting by hashed index ≠ sorting by the actual field
- MongoDB can't use the hashed index for sorted queries

✅ Works:

```js
db.Transaction.find({ accountId: "acc_123" }); // Equality only
```

❌ Doesn't work:

```js
db.Transaction.find().sort({ accountId: 1 }); // Not supported
```

---

## ❓ 4. Why Are Hashed Indexes Best for Sharding?

Because the primary job of a shard key is to:

- Distribute documents evenly
- Avoid write hotspots
- Enable horizontal scaling

### 🛠️ Normal Shard Key (Bad Example):

Say your shard key is accountId and values are:

```text
acc_0001 → Shard A
acc_0002 → Shard A
acc_0003 → Shard A
...
acc_5000 → Shard A
```

→ All documents go to one shard (Shard A)

Result: 😡 Hot shard, poor scalability

### ✅ Hashed Shard Key:

Each accountId is hashed, and the hash value determines the shard.

So:

```text
hash(acc_0001) → 812 ⇒ Shard B
hash(acc_0002) → 921 ⇒ Shard C
hash(acc_0003) → 111 ⇒ Shard A
...
```

Each shard receives \~1/N of the data (where N = number of shards) → true horizontal scale

### Banking Example:

Your system has 100M transactions being inserted per day.

- Sharding by accountId (non-hashed) → all new inserts hit last shard
- Sharding by hashed accountId → 100M inserts spread evenly across shards

🔐 Shard balancing algorithms (e.g., Chunk migrations) love hashed keys → little rebalancing needed

---

## ✅ Summary:

| Concept              | Hash Key Behavior                      |
| -------------------- | -------------------------------------- |
| Range query          | ❌ Destroyed order makes it impossible |
| Uniform distribution | ✅ Hashing = even data spread          |
| Sorting              | ❌ Sorted hash ≠ sorted field          |
| Sharding             | ✅ Best for horizontal scale           |

---
