# MongoDB Sharded Cluster Architecture (Text Diagram)

- **Replica sets** (for config servers and shards)
- **Mongos as router**
- **Sharding zones based on region**
- **Inter-container communication and data ownership**

---

```txt
                                +----------------------+
                                |       mongos         |
                                |   (Query Router)     |
                                +----------+-----------+
                                           |
          +--------------------------------+--------------------------------+
          |                                                                |
+---------v----------+     +---------------------+     +--------------------+
|  Config Server 1   |     |  Config Server 2    |     |  Config Server 3   |
|  configsvr1:27017  |     |  configsvr2:27017   |     |  configsvr3:27017  |
+--------------------+     +---------------------+     +--------------------+
          \____________________ Config Replica Set ________________________/
                     (configReplSet: holds metadata & cluster state)

                                           |
         +------------------------+--------+------------------------+
         |                        |                                 |
+--------v--------+     +--------v--------+               +--------v--------+
| sharedNP_WEST   |     | sharedNP_MID    |               | sharedNP_EAST   |
| (Replica Set)   |     | (Replica Set)   |               | (Replica Set)   |
| :27017          |     | :27017          |               | :27017          |
+--------+--------+     +--------+--------+               +--------+--------+
         \                        |                                 /
          \                       |                                /
           \                      |                               /
                     +-----------v----------+
                     | Sharded Database:    |
                     |     `banking`        |
                     +----------------------+
                     | Collection:          |
                     |   `transactions`     |
                     | Shard Key:           |
                     |   { region,          |
                     |     transactionId }  |
                     +--------------------------------------------------------------+
                     |                        Zone Mapping:                         |
                     |  - region == "NP_WEST"   → Zone "NP_WEST"   → sharedNP_WEST  |
                     |  - region == "NP_MID"   → Zone "NP_MID"   → sharedNP_MID     |
                     |  - region == "NP_EAST" → Zone "NP_EAST" → sharedNP_EAST      |
                     +--------------------------------------------------------------+

```

---

### 🧠 Breakdown of Roles & Coordination

| Component      | Role                                                             |
| -------------- | ---------------------------------------------------------------- |
| `mongos`       | Stateless query router that handles client requests              |
| Config servers | Form `configReplSet`; store metadata about chunks, shards, zones |
| Each `shard*`  | Individual **replica set** that stores partitioned data          |
| Zones          | Logical grouping of shard nodes mapped to region-specific keys   |
| Shard key      | `{ region, transactionId }` determines how data is partitioned   |

---

This structure allows:

- **High availability** via replication (each shard can be multi-node replica sets).
- **Geo-distributed data locality** via zone-based sharding.
- **Scalable horizontal partitioning** via sharding.

Would you like a diagram showing internal chunk distribution and query routing as well?
