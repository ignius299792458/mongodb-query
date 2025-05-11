# How sharding actually works in MongoDB

## 🧨 Core Principle:

> **In MongoDB, sharding is always done at the _collection level_, not at the database level.**

---

## 🔹 So Where Do You Apply Sharding?

### 🔸 ✅ You **shard individual collections**:

```js
sh.shardCollection("myDB.transactions", { accountId: "hashed" });
```

### 🔸 🚫 You **cannot shard an entire database at once**.

---

## 📂 What Happens to the Database?

Even though sharding is **per-collection**, MongoDB treats the **entire database as a "sharded database"** _once_ any collection inside it is sharded.

| Situation                           | Result                                 |
| ----------------------------------- | -------------------------------------- |
| No collection is sharded            | Treated as unsharded database          |
| One or more collections are sharded | Whole database is considered "sharded" |

---

## 🧠 Mixed Collections: Some Sharded, Some Not

Yes, this is **fully supported**.

| Collection     | Sharded? | Where Stored                                            |
| -------------- | -------- | ------------------------------------------------------- |
| `transactions` | ✅ Yes   | Partitioned across shards                               |
| `customers`    | ❌ No    | Stored **only** on the _primary shard_ for the database |

### 🔹 Primary Shard:

Every sharded database has a **primary shard** — a single shard where all _non-sharded_ collections are stored.

You can see it with:

```js
db.getSiblingDB("config").databases.find({ name: "myDB" });
```

If you're not careful and put a lot of large **unsharded collections** into the DB, it can **overload the primary shard** and break balance.

---

## 📌 Summary

| Concept                       | Description                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Sharding Granularity          | Sharding is done **per collection**, not per database                           |
| Database Classification       | If **any** collection in a database is sharded → whole DB is considered sharded |
| Mixed Collections             | You can mix sharded and unsharded collections in the same database              |
| Unsharded Collections Storage | They live on the **primary shard** of the database                              |
| Primary Shard Risk            | If unsharded collections are large/heavy, it can cause **hotspotting**          |

---

## ✅ Best Practice Tips:

1. **Shard high-volume collections** (`transactions`, `logs`, `events`)
2. **Keep small or reference collections** unsharded (`currencies`, `bankBranches`)
3. Monitor **primary shard** storage to avoid unbalanced loads
4. If more collections become large over time → **incrementally shard them**
5. Plan your shard keys wisely: it's hard to change them later
