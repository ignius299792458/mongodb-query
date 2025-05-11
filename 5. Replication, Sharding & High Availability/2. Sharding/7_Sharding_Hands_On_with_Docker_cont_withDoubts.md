# **Fully working MongoDB sharded cluster using Docker containers**

- ✅ Config Server Replica Set
- ✅ Three Shards (each a standalone replica set: `shardNP_WEST`, `shardNP_MID`, `shardNP_EAST`)
- ✅ Mongos Router
- ✅ Zone-based sharding on the `banking.transactions` collection

---

## 🐳 Step-by-Step: Docker Sharded Cluster Setup

I'll provide a complete `docker-compose.yml`, initialization scripts, and folder structure.

---

### 📁 Folder Structure

```
mongodb-sharded-cluster/
│
├── docker-compose.yml
├── init/
│   ├── config-init.js
│   ├── shard-init.js
│   └── mongos-init.js
└── data/ (empty - created at runtime)
```

---

### 📄 1. `docker-compose.yml`

```yml
services:
  configsvr1:
    image: mongo
    container_name: configsvr1-ps
    command: mongod --configsvr --replSet configReplSet --port 27017
    volumes:
      - ./data/config1:/data/db
    ports:
      - 27101:27017

  configsvr2:
    image: mongo
    container_name: configsvr2-ps
    command: mongod --configsvr --replSet configReplSet --port 27017
    volumes:
      - ./data/config2:/data/db
    ports:
      - 27102:27017

  configsvr3:
    image: mongo
    container_name: configsvr3-ps
    command: mongod --configsvr --replSet configReplSet --port 27017
    volumes:
      - ./data/config3:/data/db
    ports:
      - 27103:27017

  shardNP_EAST:
    image: mongo
    container_name: shardNP_EAST-ps
    command: mongod --shardsvr --replSet shardNP_EAST --port 27017
    volumes:
      - ./data/shardNP_EAST:/data/db
    ports:
      - 27111:27017

  shardNP_MID:
    image: mongo
    container_name: shardNP_MID-ps
    command: mongod --shardsvr --replSet shardNP_MID --port 27017
    volumes:
      - ./data/shardNP_MID:/data/db
    ports:
      - 27112:27017

  shardNP_WEST:
    image: mongo
    container_name: shardNP_WEST-ps
    command: mongod --shardsvr --replSet shardNP_WEST --port 27017
    volumes:
      - ./data/shardNP_WEST:/data/db
    ports:
      - 27113:27017

  mongos:
    image: mongo
    container_name: mongos-ps
    depends_on:
      - configsvr1
      - configsvr2
      - configsvr3
    ports:
      - 27020:27017
    command: >
      mongos --configdb configReplSet/configsvr1:27017,configsvr2:27017,configsvr3:27017
    links:
      - configsvr1
      - configsvr2
      - configsvr3
      - shardNP_EAST
      - shardNP_MID
      - shardNP_WEST
    volumes:
      - ./init:/docker-entrypoint-initdb.d
```

---

### 📜 2. Initialization Scripts (in `init/` folder)

#### 📄 `config-init.js`

```js
rs.initiate({
  _id: "configReplSet",
  configsvr: true,
  members: [
    { _id: 0, host: "configsvr1:27017" },
    { _id: 1, host: "configsvr2:27017" },
    { _id: 2, host: "configsvr3:27017" },
  ],
});
```

#### 📄 `shard-init.js`

Each shard needs its own init, run these manually in each container (or automate later).

**Example for shardNP_WEST:**

```js
rs.initiate({
  _id: "shardNP_WEST",
  members: [{ _id: 0, host: "shardNP_WEST:27017" }],
});
```

Repeat with `shardNP_MID`, `shardNP_EAST`.

#### 📄 `mongos-init.js`

After `mongos` starts, connect to it and run:

```js
sh.addShard("shardNP_WEST/shardNP_WEST:27017");
sh.addShard("shardNP_MID/shardNP_MID:27017");
sh.addShard("shardNP_EAST/shardNP_EAST:27017");

sh.addShardTag("shardNP_EAST", "NP_EAST");
sh.addShardTag("shardNP_WEST", "NP_WEST");
sh.addShardTag("shardNP_MID", "NP_MID");

sh.enableSharding("banking_db");

sh.shardCollection("banking_db.transactions", {
  bank_region: 1,
  transactionId: 1,
});

sh.updateZoneKeyRange(
  "banking_db.transactions",
  { bank_region: "NP_EAST" },
  { bank_region: "NP_EAST~" },
  "NP_EAST"
);
sh.updateZoneKeyRange(
  "banking_db.transactions",
  { bank_region: "NP_WEST" },
  { bank_region: "NP_WEST~" },
  "NP_WEST"
);
sh.updateZoneKeyRange(
  "banking_db.transactions",
  { bank_region: "NP_MID" },
  { bank_region: "NP_MID~" },
  "NP_MID"
);
```

---

### ▶️ 3. How to Run It

1. Create directories:

```bash
mkdir -p data/config1 data/config2 data/config3 data/shardNP_WEST data/shardNP_MID data/shardNP_EAST
```

2. Run the cluster:

```bash
docker-compose up -d
```

3. Initialize:

- Open terminal in `configsvr1` and run `config-init.js` inside `mongosh`
- Open terminals in each shard container and run `shard-init.js` inside `mongosh`
- Open `mongos` and run `mongos-init.js` inside `mongosh`

---

### ✅ Done! Now You Can:

- Connect via: `mongo --port 27020`
- Insert regional transactions
- Test failover and scaling
- Use `mongosh` or Node.js/Java clients to test transactions

---

### Logs inside `mongos-ps` after all above is done

```sh

[direct: mongos] test> sh.status()
shardingVersion
{ _id: 1, clusterId: ObjectId('681f74ef88f730fb784567c9') }
---
shards
[
  {
    _id: 'shardNP_EAST',
    host: 'shardNP_EAST/shardNP_EAST:27017',
    state: 1,
    topologyTime: Timestamp({ t: 1746893549, i: 9 }),
    replSetConfigVersion: Long('-1'),
    tags: [ 'NP_EAST' ]
  },
  {
    _id: 'shardNP_MID',
    host: 'shardNP_MID/shardNP_MID:27017',
    state: 1,
    topologyTime: Timestamp({ t: 1746893534, i: 9 }),
    replSetConfigVersion: Long('-1'),
    tags: [ 'NP_MID' ]
  },
  {
    _id: 'shardNP_WEST',
    host: 'shardNP_WEST/shardNP_WEST:27017',
    state: 1,
    topologyTime: Timestamp({ t: 1746893427, i: 10 }),
    replSetConfigVersion: Long('-1'),
    tags: [ 'NP_WEST' ]
  }
]
---
active mongoses
[ { '8.0.9': 1 } ]
---
autosplit
{ 'Currently enabled': 'yes' }
---
balancer
{
  'Currently enabled': 'yes',
  'Currently running': 'no',
  'Failed balancer rounds in last 5 attempts': 0,
  'Migration Results for the last 24 hours': { '2': 'Success' }
}
---
shardedDataDistribution
[
  {
    ns: 'config.system.sessions',
    shards: [
      {
        shardName: 'shardNP_WEST',
        numOrphanedDocs: 0,
        numOwnedDocuments: 9,
        ownedSizeBytes: 891,
        orphanedSizeBytes: 0
      }
    ]
  },
  {
    ns: 'banking_db.transactions',
    shards: [
      {
        shardName: 'shardNP_WEST',
        numOrphanedDocs: 0,
        numOwnedDocuments: 0,
        ownedSizeBytes: 0,
        orphanedSizeBytes: 0
      },
      {
        shardName: 'shardNP_EAST',
        numOrphanedDocs: 0,
        numOwnedDocuments: 0,
        ownedSizeBytes: 0,
        orphanedSizeBytes: 0
      },
      {
        shardName: 'shardNP_MID',
        numOrphanedDocs: 0,
        numOwnedDocuments: 0,
        ownedSizeBytes: 0,
        orphanedSizeBytes: 0
      }
    ]
  }
]
---
databases
[
  {
    database: {
      _id: 'banking_db',
      primary: 'shardNP_MID',
      version: {
        uuid: UUID('14824c36-3362-4110-ba91-fd860a6befa1'),
        timestamp: Timestamp({ t: 1746893605, i: 3 }),
        lastMod: 1
      }
    },
    collections: {
      'banking_db.transactions': {
        shardKey: { bank_region: 1, transactionId: 1 },
        unique: false,
        balancing: true,
        chunkMetadata: [
          { shard: 'shardNP_EAST', nChunks: 1 },
          { shard: 'shardNP_MID', nChunks: 5 },
          { shard: 'shardNP_WEST', nChunks: 1 }
        ],
        chunks: [
          { min: { bank_region: MinKey(), transactionId: MinKey() }, max: { bank_region: 'NP_EAST', transactionId: MinKey() }, 'on shard': 'shardNP_MID', 'last modified': Timestamp({ t: 3, i: 1 }) },
          { min: { bank_region: 'NP_EAST', transactionId: MinKey() }, max: { bank_region: 'NP_EAST~', transactionId: MinKey() }, 'on shard': 'shardNP_EAST', 'last modified': Timestamp({ t: 3, i: 0 }) },
          { min: { bank_region: 'NP_EAST~', transactionId: MinKey() }, max: { bank_region: 'NP_MID', transactionId: MinKey() }, 'on shard': 'shardNP_MID', 'last modified': Timestamp({ t: 3, i: 2 }) },
          { min: { bank_region: 'NP_MID', transactionId: MinKey() }, max: { bank_region: 'NP_MID~', transactionId: MinKey() }, 'on shard': 'shardNP_MID', 'last modified': Timestamp({ t: 3, i: 3 }) },
          { min: { bank_region: 'NP_MID~', transactionId: MinKey() }, max: { bank_region: 'NP_WEST', transactionId: MinKey() }, 'on shard': 'shardNP_MID', 'last modified': Timestamp({ t: 3, i: 4 }) },
          { min: { bank_region: 'NP_WEST', transactionId: MinKey() }, max: { bank_region: 'NP_WEST~', transactionId: MinKey() }, 'on shard': 'shardNP_WEST', 'last modified': Timestamp({ t: 2, i: 0 }) },
          { min: { bank_region: 'NP_WEST~', transactionId: MinKey() }, max: { bank_region: MaxKey(), transactionId: MaxKey() }, 'on shard': 'shardNP_MID', 'last modified': Timestamp({ t: 1, i: 5 }) }
        ],
        tags: [
          {
            tag: 'NP_EAST',
            min: { bank_region: 'NP_EAST', transactionId: MinKey() },
            max: { bank_region: 'NP_EAST~', transactionId: MinKey() }
          },
          {
            tag: 'NP_MID',
            min: { bank_region: 'NP_MID', transactionId: MinKey() },
            max: { bank_region: 'NP_MID~', transactionId: MinKey() }
          },
          {
            tag: 'NP_WEST',
            min: { bank_region: 'NP_WEST', transactionId: MinKey() },
            max: { bank_region: 'NP_WEST~', transactionId: MinKey() }
          }
        ]
      }
    }
  },
  {
    database: { _id: 'config', primary: 'config', partitioned: true },
    collections: {
      'config.system.sessions': {
        shardKey: { _id: 1 },
        unique: false,
        balancing: true,
        chunkMetadata: [ { shard: 'shardNP_WEST', nChunks: 1 } ],
        chunks: [
          { min: { _id: MinKey() }, max: { _id: MaxKey() }, 'on shard': 'shardNP_WEST', 'last modified': Timestamp({ t: 1, i: 0 }) }
        ],
        tags: []
      }
    }
  }
]
[direct: mongos] test>
```
