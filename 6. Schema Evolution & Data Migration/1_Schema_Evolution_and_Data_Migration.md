# Schema Evolution and Data Migration in MongoDB

## 🔷 What is Schema Evolution?

**Schema Evolution** is the process of **adapting your database schema** to changing business requirements **without downtime or rigid schema constraints**. Unlike relational databases where schema changes require ALTER TABLE statements and careful planning, MongoDB’s **flexible schema** allows documents in a collection to have **different structures**.

In real-world applications (like a banking system), the **document structure may evolve** over time to support:

- New features (e.g., multi-currency accounts).
- Performance optimizations.
- Regulatory requirements (e.g., storing transaction audit logs).
- Refactoring and data normalization/denormalization.

---

### 🔷 Key MongoDB Features that Support Schema Evolution

| Feature                     | Description                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Flexible Document Model** | Documents in a collection can vary in fields, types, or structures.                                              |
| **Schema Validation**       | Introduced in MongoDB 3.2+. Allows optional schema enforcement via JSON Schema syntax.                           |
| **Aggregation Pipeline**    | Used for transforming and restructuring documents during migration.                                              |
| **Update Operators**        | `$set`, `$unset`, `$rename`, etc., help in updating documents field-by-field.                                    |
| **Change Streams**          | Useful for tracking changes and syncing during staged rollouts.                                                  |
| **Versioning**              | Often, a `_schemaVersion` or similar field is used to identify which version of a schema a document conforms to. |

---

## 🧱 Approaches to Schema Evolution

### ✅ 1. **Lax or Lazy Evolution (Do Nothing Initially)**

- **Idea:** Accept documents with old structure, only convert when read or updated.
- **Use Case:** Works well when backward compatibility is easy or maintained via application logic.

#### Example:

If you added `currency` to `BankAccount`:

```json
// Old Document
{ "_id": "acc1", "balance": 1000 }

// New Document
{ "_id": "acc1", "balance": 1000, "currency": "USD" }
```

**Lazy Fix:** When the old document is read, you assume a default `"currency": "USD"`.

---

### ✅ 2. **Migration Scripts (Batch Update)**

- Perform updates across all documents in the database using:

  - `updateMany`
  - `aggregate + $merge`
  - Write scripts in your app's language (Node.js, Java, Python)

#### Example: Add a new field `accountType` to all `BankAccount` docs

```js
db.bankAccounts.updateMany(
  { accountType: { $exists: false } },
  { $set: { accountType: "Checking" } }
);
```

---

### ✅ 3. **Rolling Migrations**

- Useful in **large-scale systems** where a single bulk update is risky.
- Migration happens **gradually**: when a document is read or written, check its version and migrate it if needed.
- Store a `_schemaVersion` field.

#### Example:

```json
{
  "_id": "txn1",
  "amount": 500,
  "createdAt": "2024-12-12T08:00:00Z",
  "_schemaVersion": 1
}
```

App logic:

```ts
if (txn._schemaVersion < 2) {
  txn = migrateToV2(txn);
  save(txn);
}
```

---

### ✅ 4. **Schema Validation for Future Consistency**

Add **validators** after evolving the schema to enforce the new structure.

#### Example: Require `currency` in `BankAccount`

```js
db.createCollection("bankAccounts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["balance", "currency"],
      properties: {
        balance: { bsonType: "number" },
        currency: { enum: ["USD", "EUR", "INR"] },
      },
    },
  },
});
```

---

## 🔁 Schema Migration Scenarios (Real Banking Examples)

| Use Case                                              | Migration Needed             |
| ----------------------------------------------------- | ---------------------------- |
| Add `currency` field to accounts                      | Add field with default value |
| Rename `customerId` → `clientId`                      | Use `$rename`                |
| Embed customer data into account                      | Use `$lookup` + `$merge`     |
| Split a single `Transaction` into debit/credit models | Use `aggregate` to transform |
| Normalize addresses into a new `Address` collection   | Extract & reference          |

---

## ⚠️ Challenges & Considerations

### ❗ 1. **Backward Compatibility**

Old documents must still work with your system until fully migrated.

### ❗ 2. **Versioning**

Store `_schemaVersion` and evolve carefully through intermediate steps.

### ❗ 3. **Large Dataset Migration**

- Use `batch` processing.
- Use tools like [MongoDB Data Migration Toolkits](https://www.mongodb.com/docs/database-tools/) or `mongoexport` + `mongoimport`.

### ❗ 4. **Zero-Downtime Migration Strategy**

Use **feature flags**, deploy migration scripts **before** releasing application logic that depends on the new schema.

---

## 🧰 Tools for Migration in Production

| Tool                                | Use                                       |
| ----------------------------------- | ----------------------------------------- |
| **MongoDB Aggregation Pipeline**    | Perform powerful in-place transformations |
| **mongoexport/mongoimport**         | Export, transform, and re-import data     |
| **mongodump/mongorestore**          | For backup & restore based migration      |
| **Mongock**                         | Java-based MongoDB migration framework    |
| **Liquibase (with MongoDB plugin)** | Schema change tracking                    |

---

## ✅ Summary Cheat Sheet

| Task                  | Method                          |
| --------------------- | ------------------------------- |
| Add Field             | `updateMany` with `$set`        |
| Remove Field          | `$unset`                        |
| Rename Field          | `$rename`                       |
| Split/Merge Fields    | `aggregate + $project + $merge` |
| Conditional Migration | `updateMany` with filters       |
| Track Version         | Add `_schemaVersion`            |
| Enforce New Schema    | Use `$jsonSchema` validation    |

---
