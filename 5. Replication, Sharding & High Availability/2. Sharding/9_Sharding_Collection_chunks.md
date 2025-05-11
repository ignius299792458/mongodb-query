# MongoDB Sharded Cluster: Internal Chunk Distribution & Query Routing (Text Diagram)

Here's an **enhanced text-based diagram** that shows not just the high-level architecture, but **internal chunk distribution** and **query routing** — how documents are routed, stored, and accessed based on the **shard key and zones** in MongoDB.

```
                           +---------------------+
                           |      Client App     |
                           | (e.g. banking API)  |
                           +----------+----------+
                                      |
                                Query to mongos
                                      |
                           +----------v----------+
                           |       mongos        |
                           |   (Query Router)    |
                           +----------+----------+
                                      |
                    +----------------+----------------+
                    |                                 |
        Checks shard key: { region: "NP_MID", txnId: X }  |
                    |                                 |
      Uses metadata from configReplSet (chunk map)    |
                    |                                 |
          Determines correct shard: shardNP_MID           |
                    |                                 |
         Routes query directly to shardNP_MID replica set |
                    |                                 |
            +-------v-------+                         |
            |   shardNP_MID     |                         |
            |  (Primary)    |                         |
            +---------------+                         |
                    |                                 |
        +-------------------------------+             |
        | Finds matching chunk:         |             |
        |   [region: "NP_MID", txnId: 1–10000]            |
        +-------------------------------+             |
                    |                                 |
         Reads or writes document                     |
         Performs transaction (if enabled)            |
                    |                                 |
           Returns result to mongos → client          |
```

---

### 📂 Chunk Distribution Example (Inside Each Shard)

```plaintext
ConfigReplSet holds the chunk map like:

Collection: banking.transactions
Shard Key: { region: 1, transactionId: 1 }

Chunk Ranges:
  shardNP_WEST   : { region: "NP_WEST", txnId: Min → 9999 }
  shardNP_MID    : { region: "NP_MID", txnId: Min → 9999 }
  shardNP_EAST  : { region: "NP_EAST", txnId: Min → 9999 }

(Each of these chunks may split as data grows:
  shardNP_MID chunk1: txnId 1–5000
  shardNP_MID chunk2: txnId 5001–9999
)

Chunks auto-balanced and moved if load is uneven.
```

---

### 🔄 Zone Mapping Example

```plaintext
Zone Definitions:
  Zone "NP_WEST"   → shardUS
  Zone "NP_MID"   → shardNP_MID
  Zone "NP_EAST" → shardNP_EAST

Config servers enforce that all documents with:
  { region: "NP_MID" } only reside in shardNP_MID
```

---

### ⚙️ Query Routing Summary

| Step | Action                                                              |
| ---- | ------------------------------------------------------------------- |
| 1    | Client sends query to `mongos`                                      |
| 2    | `mongos` inspects shard key → asks configReplSet for chunk location |
| 3    | Query is routed to the correct shard (e.g. shardNP_MID)             |
| 4    | Primary node in that replica set executes the query                 |
| 5    | Result sent back through `mongos` to the client                     |

---
