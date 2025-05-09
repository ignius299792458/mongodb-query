# 📘 Index Types in MongoDB

## 🔹 1. Single Field Index

A single-field index indexes only one field of a document. This is the simplest and most common index.

### ➕ Syntax:

```javascript
db.Transaction.createIndex({ accountId: 1 });
```

### 🧠 DSA Core:

Creates a B-tree where keys are values of accountId, and leaves point to document references.

### ✅ Best For:

- Queries filtering on a single field
- Sorting by a single field

### ❌ Edge Cases:

- Can’t help with compound conditions across multiple fields (use compound index instead)
- If field is sparsely populated, low selectivity can make it inefficient

### ✅ Example in Banking System:

Query: Find all transactions of a given account ID:

```typescript
db.Transaction.find({ accountId: "acc_12345" });
```

With index on { accountId: 1 }, this uses an index scan instead of a full collection scan.

---

## 🔹 2. Compound Index

Indexes on multiple fields in a specified order. Order matters!

### ➕ Syntax:

```javascript
db.Transaction.createIndex({ accountId: 1, timestamp: -1 });
```

### 🧠 DSA Core:

The index is sorted first by accountId, then by timestamp within each accountId group.

### ✅ Best For:

- Queries using both fields in left-to-right order
- Queries using prefix fields (e.g. just accountId)

### ❌ Edge Cases:

- Queries using only timestamp won’t use this index
- Wrong order (e.g. timestamp first) changes query usability

### ✅ Example in Banking System:

Find latest 10 transactions for a given account:

```typescript
db.Transaction.find({ accountId: "acc_12345" })
  .sort({ timestamp: -1 })
  .limit(10);
```

Uses compound index { accountId: 1, timestamp: -1 } efficiently. Without index, it must scan all matching docs then sort.

---

## 🔹 3. Multikey Index

This is created automatically when you index an array field.

### ➕ Syntax:

```javascript
db.Customer.createIndex({ linkedAccountIds: 1 });
```

linkedAccountIds is assumed to be an array like:

```json
{
  "customerId": "cust_001",
  "linkedAccountIds": ["acc_1", "acc_2", "acc_3"]
}
```

### 🧠 DSA Core:

Each element of the array is indexed separately in the B-tree.

### ✅ Best For:

- Matching documents where array contains a value

### ❌ Edge Cases:

- Can’t index multiple arrays at the same level (e.g., { tags: \[], linkedAccounts: \[] })
- Can produce index bloat if arrays are huge

### ✅ Example in Banking System:

Find customers linked to a specific account:

```typescript
db.Customer.find({ linkedAccountIds: "acc_2" });
```

Multikey index allows fast retrieval vs scanning all documents.

---

## 🔹 4. Text Index

For full-text search on string fields.

### ➕ Syntax:

```javascript
db.Transaction.createIndex({ description: "text" });
```

### 🧠 DSA Core:

Builds an inverted index. Each unique word points to documents containing it.

### ✅ Best For:

- Searching in string fields like memo, description, notes

### ❌ Edge Cases:

- Can’t combine text index with other fields in compound index
- Case-insensitive, ignores stop-words (like "the", "is")
- Wildcard regex not supported

### ✅ Example in Banking System:

Search transactions with keyword:

```typescript
db.Transaction.find({ $text: { $search: "wire transfer" } });
```

Would match: "Received international wire transfer", "Wire Transfer completed", etc.

---

## 🔹 5. Geospatial Index

Indexes used for spatial queries (like finding nearby ATMs or branches).

### ➕ Syntax:

```javascript
db.Branch.createIndex({ location: "2dsphere" });
```

Assume location field is:

```json
{ type: "Point", coordinates: [longitude, latitude] }
```

### 🧠 DSA Core:

Uses R-tree or geo-hash based spatial index optimized for radius and bounding-box queries.

### ✅ Best For:

- Finding nearest entities

### ❌ Edge Cases:

- Requires strict GeoJSON format
- Queries must use \$near, \$geoWithin, etc.
- Can’t combine easily with normal B-tree indexes

### ✅ Example in Banking System:

Find all branches within 10 km:

```typescript
db.Branch.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [77.5946, 12.9716] },
      $maxDistance: 10000,
    },
  },
});
```

---

## 🔹 6. Hashed Index

Used mainly for sharding and hash-based distribution.

### ➕ Syntax:

```javascript
db.Transaction.createIndex({ accountId: "hashed" });
```

### 🧠 DSA Core:

Hashes the value before inserting into index — does not retain ordering.

### ✅ Best For:

- Uniform distribution in sharded clusters
- Equality match queries (not range)

### ❌ Edge Cases:

- Not usable for range queries or sorting
- Can't be used with prefix queries

### ✅ Example in Banking System:

Query: Get all transactions of a specific accountId

```typescript
db.Transaction.find({ accountId: "acc_12345" });
```

Works fine with hashed index, but you can’t do:

```typescript
db.Transaction.find({ accountId: { $gt: "acc_12000" } }); // won't use the index
```

---

## 🔄 Summary Table

| Index Type   | Best For                              | Not Suitable For                              |
| ------------ | ------------------------------------- | --------------------------------------------- |
| Single-field | Simple lookups                        | Multiple field filters/sorting                |
| Compound     | Range and filter with multiple fields | Random access fields not in prefix order      |
| Multikey     | Arrays with lookups                   | Large or nested arrays; multiple array fields |
| Text         | Full-text search                      | Prefix queries, compound index usage          |
| Geospatial   | Location-based lookups                | Normal range/sort queries                     |
| Hashed       | Sharded clusters, equality search     | Sorting, range filters                        |

---
