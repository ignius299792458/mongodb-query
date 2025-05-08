# Indexing and Query Optimization

🔹 What is Indexing (in the context of databases like MongoDB)?
🔹 What is Query Optimization?
Including their internal data structure behavior, memory implications, and trade-offs.

---

## 1. 🧠 What Is Indexing? (From DSA & Memory-Management Perspective)

At its core, indexing is a technique for accelerating data retrieval by minimizing the amount of data that needs to be scanned. It is a form of auxiliary data structure, very similar to how indexes work in books—rather than reading the whole book to find a topic, you go to the index and jump directly to the page.

### 1.1 Underlying Data Structures

Databases internally use classic DSA concepts to implement indexes:

| Index Type         | Typical Structure                         |
| ------------------ | ----------------------------------------- |
| B-Tree (or B+Tree) | Balanced tree (default in MongoDB, MySQL) |
| Hash Index         | Hash table (constant-time lookups)        |
| R-Tree / QuadTree  | Spatial indexes (for geolocation)         |

MongoDB uses a B-Tree variant for most of its indexes.

🔸 B-Tree Properties:

- Balanced → Depth is minimal; lookup is logarithmic O(log n)
- Ordered → Good for range queries
- Leaves contain actual references (record pointers) to the document location
- Non-leaf nodes guide traversal

🔸 Memory Characteristics:

- Indexes are stored on disk (in the WiredTiger storage engine, which is MongoDB’s default)
- Frequently accessed index pages are cached in RAM (in the WiredTiger cache)
- If indexes grow too large to fit in RAM, disk I/O bottlenecks appear
- Inserting/updating documents requires updating indexes → increases write cost

🧠 Analogy: Think of indexes like a sorted directory of names on a library shelf. If the directory grows too large, you can't keep it in your pocket (RAM) anymore—you’ll need to fetch it from the back room (disk), slowing everything down.

---

## 1.2 Types of Indexing in Theory (DSA View)

| Type                       | Description                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Primary Index              | Built on a unique key (like \_id in MongoDB)                                                                           |
| Secondary Index            | Non-unique fields; allow efficient search on non-primary attributes                                                    |
| Dense vs Sparse            | Dense: Every record has an entry in the index. Sparse: Only some do.                                                   |
| Clustered vs Non-clustered | Clustered: Data physically sorted as per the index. MongoDB is non-clustered—data location is separate from the index. |

---

## 1.3 Side Effects & Edge Considerations

| Concern                  | Explanation                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| 🔄 Write Penalty         | Every write (insert, update, delete) must update all relevant indexes → slower writes                                                 |
| 🧮 RAM Pressure          | If your indexes are large and can't fit into RAM, you'll get page faults and slower queries                                           |
| 💥 Over-Indexing         | Creating many indexes can degrade performance—each consumes disk, CPU, and memory                                                     |
| ❌ Inefficient Index Use | Index may not be used if query is poorly structured, or index selectivity is low                                                      |
| ❓ Index Maintenance     | Rebuilding indexes (e.g., after bulk inserts) can be expensive and may lock writes                                                    |
| 🔄 Indexes & Replication | Indexes are not automatically created on secondary replicas—manual creation is needed in some configurations                          |
| 🧪 Multikey Edge Cases   | If array fields have very large or deeply nested structures, multikey indexing can explode in size and break performance expectations |

---

## 2. 🔍 What Is Query Optimization?

Query optimization is the process of transforming a query into an equivalent form that can be executed more efficiently. In MongoDB, this is performed by the Query Planner, which evaluates multiple execution plans and chooses the most optimal based on:

- Index availability
- Index selectivity (how many records match)
- Sort operations
- Filter predicates
- Covered index possibilities

### 2.1 Query Plan Life Cycle (MongoDB):

1. Parse: Break down the query
2. Canonicalize: Convert to a standardized internal form
3. Plan Generation: Generate multiple plans (e.g., index scan, collection scan)
4. Plan Ranking: Use heuristics and sampling to pick the best
5. Cache: Store the plan for reuse (unless query shape changes)

MongoDB may fall back to COLLSCAN (collection scan = full scan) if:

- No index matches the query/filter
- Poor cardinality/selectivity of index
- Index exists, but can't support sort/projection

📌 Tip: Use the .explain("executionStats") method to examine which plan was chosen and why.

---

## 2.2 Side Effects of Query Optimization

| Case                      | Effect                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| 📉 Bad Cardinality        | Index exists, but if it's not selective (matches most docs), MongoDB may ignore it                     |
| 📦 Sorting Bottlenecks    | If the sort field isn’t indexed, MongoDB loads all results in memory before sorting (OOM risk)         |
| ⚠️ Regex Pitfall          | Regexes without prefixes (e.g., /abc/) can't use indexes because the beginning of the value is unknown |
| ⚖️ Overhead of Explain    | Profiling every query can be expensive—use explain sparingly in production                             |
| ❗ Cached Plan Regression | Query plans are cached, but data distribution may change → plan may become suboptimal                  |

---

## Summary Table

| Topic              | Impact on Performance                | Trade-Offs                                          |
| ------------------ | ------------------------------------ | --------------------------------------------------- |
| Indexing           | 🟢 Speeds up reads                   | 🔴 Slows down writes, uses RAM/disk                 |
| Query Optimization | 🟢 Avoids unnecessary reads          | 🔴 May mispredict optimal path due to stale stats   |
| Covered Index      | 🟢 Avoids document fetch             | 🔴 Requires projection to be subset of index fields |
| Over-indexing      | 🔴 High write penalty, storage bloat | 🔴 Memory footprint                                 |

---
