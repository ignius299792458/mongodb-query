# Versioning: MongoDB Document Versioning in Schema Evolution

---

### 🔷 What is Document Versioning?

**Versioning** is the strategy of tagging each document with a `_schemaVersion` field to indicate the version of the document’s schema it conforms to. This enables your application to handle:

- **Backward compatibility** — older documents still work
- **Forward evolution** — newer schema logic can be applied conditionally
- **Rolling migrations** — documents are updated gradually, not all at once

---

## 🧱 Why Use `_schemaVersion`?

In a document database like MongoDB:

- There's **no rigid table schema** like RDBMS.
- Documents in the same collection may have different structures.
- You want to **differentiate document logic** based on structure version.

### Example:

```json
// Schema V1
{
  "_id": "acc123",
  "balance": 1000,
  "_schemaVersion": 1
}

// Schema V2 (adds currency)
{
  "_id": "acc123",
  "balance": 1000,
  "currency": "USD",
  "_schemaVersion": 2
}
```

---

## 🧭 Where is Versioning Used?

| Use Case                  | Benefit                                       |
| ------------------------- | --------------------------------------------- |
| Add/Remove Fields         | Different logic for different schema versions |
| Rename Fields             | Map old → new fields during reads             |
| Change Data Format        | Migrate on access                             |
| Complex Migration Rollout | Perform **lazy migrations** safely            |

---

# 🧩 Design Principles for versioning

### 🔸 1. Embed `_schemaVersion` in Each Document

```json
{
  "_id": "txn567",
  "amount": 200,
  "txnType": "debit",
  "_schemaVersion": 1
}
```

---

### 🔸 2. Centralize Version Handlers

**Code Pattern (Pseudo-Java or TypeScript):**

```ts
function readTransaction(doc) {
  switch (doc._schemaVersion) {
    case 1:
      return migrateV1toV2(doc);
    case 2:
      return doc;
    default:
      throw new Error("Unsupported schema version: " + doc._schemaVersion);
  }
}
```

This isolates migration logic and ensures **robust backward compatibility**.

---

### 🔸 3. Perform Lazy Migration on Access (Rolling Upgrade)

When you read an old document, **upgrade it in-place**:

```ts
function migrateV1toV2(txn) {
  txn.currency = "USD"; // Add missing field
  txn._schemaVersion = 2;
  db.transactions.updateOne({ _id: txn._id }, { $set: txn });
  return txn;
}
```

This is **safe** in live systems, as documents are updated gradually as they are read.

---

### 🔸 4. Avoid Breaking Changes in the Application

Never write application logic that **assumes only the latest schema**. Use conditional checks and upconverters.

Example:

```ts
function getAmount(txn) {
  if (txn._schemaVersion === 1) return txn.amount;
  if (txn._schemaVersion === 2) return txn.transactionAmount;
}
```

---

### 🔸 5. Enforce Schema Version Consistency

When inserting new documents:

- Always **attach `_schemaVersion`**
- Optionally enforce it with schema validation

```js
db.createCollection("transactions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_schemaVersion"],
      properties: {
        _schemaVersion: {
          bsonType: "int",
          description: "must be present and an integer",
        },
      },
    },
  },
});
```

---

## 🔄 Migration Strategies with Versioning

| Strategy            | Description                                       |
| ------------------- | ------------------------------------------------- |
| **Eager Migration** | Migrate all documents at once using a script      |
| **Lazy Migration**  | Migrate documents as they are read or written     |
| **Hybrid**          | Migrate frequently used data eagerly, rest lazily |

---

## 🛡️ Best Practices

1. **Always version explicitly** — don’t rely on implicit detection.
2. **Write migration functions per version pair** (e.g., `migrateV1toV2`)
3. **Use central dispatching logic** to apply migration before use.
4. **Keep migrations idempotent** and test them well.
5. **Log or audit** migrated documents to monitor impact.
6. **Use version bump in APIs** if frontend/backend needs to distinguish format (e.g., `/api/v2/account`).

---

## ✅ Summary

| Element            | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `_schemaVersion`   | Tracks schema version per document                  |
| Migration Function | Converts doc from old → new schema                  |
| Lazy Migration     | Upgrade only when document is used                  |
| Dispatch Function  | Selects right migration path at runtime             |
| Validator          | Enforces future inserts conform to expected version |

---
