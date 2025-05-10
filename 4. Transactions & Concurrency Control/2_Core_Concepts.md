# 🔷 4. Transactions & Concurrency Control Core Concepts

---

## ✅ i. **Atomicity on Single Documents**

## 🧠 Concept:

MongoDB **guarantees atomicity at the single document level**—no matter how large or nested the document is.

## 💡 Implication:

All updates to a single document (including embedded arrays and nested objects) are **atomic**, even **outside of a transaction**.

## 🏦 Banking Example:

Suppose a `BankAccount` document contains:

```json
{
  "_id": "accA",
  "ownerId": "cust123",
  "balance": 500,
  "transactions": [
    { "amount": -100, "timestamp": "..." },
    { "amount": 200, "timestamp": "..." }
  ]
}
```

You can atomically add a new transaction and update the balance in **one operation**:

```js
db.bankAccounts.updateOne(
  { _id: "accA" },
  {
    $inc: { balance: -50 },
    $push: {
      transactions: { amount: -50, timestamp: new Date() },
    },
  }
);
```

➡️ Even if the app crashes right after this, the whole update either happens completely or not at all.

---

## ✅ ii. **Multi-document Transactions (MongoDB 4.0+)**

## 🧠 Concept:

From **MongoDB 4.0**, multi-document transactions allow you to group operations on **multiple documents** (across collections) into a **single ACID transaction**.

## 🔄 Syntax:

- Use `session.startTransaction()` and `commitTransaction()` / `abortTransaction()`.

## 🏦 Banking Example: Transfer between accounts

```js
session.startTransaction();
try {
  await db.bankAccounts.updateOne(
    { _id: "accA" },
    { $inc: { balance: -100 } },
    { session }
  );
  await db.bankAccounts.updateOne(
    { _id: "accB" },
    { $inc: { balance: 100 } },
    { session }
  );
  await db.transactions.insertOne(
    { from: "accA", to: "accB", amount: 100, date: new Date() },
    { session }
  );

  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
}
```

📌 All 3 operations are committed or rolled back **together**.

---

## ✅ iii. **Read/Write Concerns**

## 🧠 Concept:

These control the **consistency**, **durability**, and **isolation** of operations.

## 📌 Read Concern:

Specifies the **level of isolation** for read operations:

- `"local"` (default) – returns data from node’s memory.
- `"majority"` – returns data acknowledged by a majority of nodes.
- `"snapshot"` – used in transactions to provide **repeatable reads**.

## 📌 Write Concern:

Specifies how "safe" writes are:

- `{ w: 1 }`: acknowledged by primary only
- `{ w: 'majority' }`: acknowledged by majority of replica set

## 🏦 Banking Example:

In a critical financial transfer, you want **majority write concern** to ensure durability:

```js
await db.bankAccounts.updateOne(
  { _id: "accA" },
  { $inc: { balance: -100 } },
  { writeConcern: { w: "majority" } }
);
```

In a transaction:

```js
session.startTransaction({
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
});
```

---

## ✅ iv. **Retryable Writes**

## 🧠 Concept:

If a network error or primary failover occurs, a retryable write can **safely retry** without double-applying the write.

- Supported for operations like `insertOne`, `updateOne`, `deleteOne`.

- Requires MongoDB 3.6+ and replica sets.

## 🏦 Banking Example:

If your app tries to deduct \$100 but the network fails mid-way, MongoDB will **automatically retry** using the same session and write id — and **not double deduct**.

```js
// With retryable writes enabled:
const client = new MongoClient(uri, {
  retryWrites: true,
});
```

➡️ This is **important for idempotent operations** like balance updates.

---

## ✅ v. **Snapshot Isolation (for Transactions)**

## 🧠 Concept:

MongoDB transactions use **snapshot isolation**:

- All reads in a transaction operate against a **consistent snapshot** of the database.
- Even if other writes happen in parallel, your transaction sees a stable view.

## 🔄 Similar to: `REPEATABLE READ` isolation in RDBMS.

## 🏦 Banking Example:

Let’s say:

- Transaction T1 starts and reads balance from `accA = 500`.
- Meanwhile, another write outside the transaction adds \$200.

T1 will **still see 500** as the balance until it completes, even though reality has changed.

In Node.js:

```js
session.startTransaction({
  readConcern: { level: "snapshot" },
});
```

---

## ✅ vi. **Optimistic Concurrency (Versioning)**

## 🧠 Concept:

Optimistic concurrency assumes **conflicts are rare**, so no locking is done — but before write, the app checks a **version number** (or timestamp/hash) to detect conflicting writes.

You manually implement this in MongoDB using a `version` field.

## 🏦 Banking Example:

Your document:

```json
{
  "_id": "accA",
  "balance": 500,
  "version": 3
}
```

When updating:

```js
const result = await db.bankAccounts.updateOne(
  { _id: "accA", version: 3 }, // check version
  {
    $inc: { balance: -100 },
    $inc: { version: 1 }, // increment version
  }
);

if (result.modifiedCount === 0) {
  throw new Error("Conflict: Document was modified by another operation");
}
```

➡️ If another process changed the balance (and version incremented to 4), your update would **fail gracefully**.

---

# 🔚 Summary Table

| Concept                    | MongoDB Support                            | Banking System Use Case                         |
| -------------------------- | ------------------------------------------ | ----------------------------------------------- |
| **Atomic Single Doc**      | Always                                     | Update balance + log atomically in one document |
| **Multi-Doc Transactions** | MongoDB 4.0+ (replica set), 4.2+ (sharded) | Transfer between accounts and log it            |
| **Read Concern**           | Local, Majority, Snapshot                  | Ensure consistent reads across nodes or in txn  |
| **Write Concern**          | 1, Majority                                | Durable writes for critical operations          |
| **Retryable Writes**       | MongoDB 3.6+                               | Auto-retry update on network failure            |
| **Snapshot Isolation**     | Built into transactions                    | Reads remain stable during concurrent writes    |
| **Optimistic Concurrency** | Manual via version field                   | Prevent double update in concurrent ops         |

---
