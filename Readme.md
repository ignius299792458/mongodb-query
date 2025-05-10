# MongoDB

## 1. **Data Modeling & Schema Design (MongoDB)**

### 🔹 Key Concepts:

- **Document-oriented design** (BSON)
- **Embedded vs Referenced documents**

  - Embed for _atomicity and fast reads_
  - Reference for _large, related datasets_

- **One-to-one**, **one-to-many**, **many-to-many** structures
- **Schema validation** (`$jsonSchema` rules)
- **Avoiding massive documents** (16MB limit)
- **Polymorphic documents** (with `type` fields)
- **Schema versioning** via internal `_v` or `_schemaVersion` fields

### 🔹 Tools:

- MongoDB Compass Schema tab
- Mongoose (ODM with schema enforcement)

---

## 2. **Data Retrieval (MongoDB)**

This is now a standalone top-priority category — and rightfully so.

### i. Core Query Concepts:

- [x] 1. **Basic Queries**: `find()`, `findOne()`, `projection`, and `filters`
- [x] 2. **Dot notation** for nested fields: `{ "user.address.city": "Lalitpur" }`
- [x] 3. **Array queries**: `$in`, `$elemMatch`, positional operators (`$`, `$[<identifier>]`)
- [x] 4. **Logical operators**: `$and`, `$or`, `$not`, `$nor`
- [x] 5. **Comparison operators**: `$eq`, `$gt`, `$lte`, `$ne`, etc.

### ii. Projection Techniques:

- Include/Exclude fields
- Computed fields with `$project`

### iii. Advanced Retrieval:

- **Aggregation Framework** (powerful and fast)

  - `$match`, `$group`, `$project`, `$sort`, `$limit`, `$unwind`, `$lookup` (joins)

- **Text, Regex, Geospatial Data**
  - **full-text** indexes: `$text`, `$search`, score sorting
  - **Regex**
  - **Geospatial queries**: `$near`, `$geoWithin`, `$geoIntersects`
- **Pagination**:

  - `skip + limit` (simple but slow for large skips)
  - **Efficient paging with range-based queries or `$gt`/`$lt` on indexed fields**

### iv. Performance Optimization:

- Covered queries (uses index only)
- `explain()` with `.executionStats`
- Query planner, index selection
- **Avoid collection scans** unless necessary

---

## 3. **Indexing & Query Optimization**

Closely tied with retrieval, but focused on performance.

### i. Index Types:

- Single-field
- Compound indexes
- Multikey (for arrays)
- Text indexes
- Geospatial indexes
- Hashed indexes (for sharding)

### ii. Optimization Practices:

- Use **covered indexes**
- Watch for **index cardinality** and **selectivity**
- **Avoid regex without prefixes** (breaks index usage)
- TTL indexes for expirable data

---

## 4. **Transactions & Concurrency Control**

### i. Core Concepts:

- **`Atomicity`** on single documents
- **`Multi-document transactions`** (MongoDB 4.0+)
- **`Read/write concerns`**
- **`Retryable writes`**
- **`Snapshot isolation`**
- **`Optimistic concurrency`** (versioning)

---

## 5. **Replication, Sharding & High Availability**

### i. Replication:

- **Replica Sets**, automatic failover
- **Read preference** tuning (`primary`, `secondary`, `nearest`)
- **Write concern** for durability

### ii. Sharding:

- Choosing optimal **shard keys** (avoid monotonic keys like `_id`)
- **Chunk balancing**
- **Zone-based sharding**

---

## 6. **Schema Evolution & Data Migration**

### i. Versioning:

- Embed `_schemaVersion` in docs
- Maintain backward compatibility

### ii. Migration Techniques:

- Bulk writes
- Aggregation pipelines for transforms
- Blue/Green or rolling migrations
- Change streams for syncing data across systems

---

## 🧠 Real-World Example

> A system using MongoDB to track orders might:

- **Embed** line items in the order for fast reads,
- Use **compound indexes** on `userId + createdAt` for efficient queries,
- Fetch with an **aggregation pipeline** (with `$lookup` to join user profile),
- And paginate with a range query on `createdAt`.

---
