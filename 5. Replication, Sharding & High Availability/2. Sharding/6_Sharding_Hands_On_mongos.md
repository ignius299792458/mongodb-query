# Setting up MongoDB sharding (including zone-based sharding)

---

## 🏗️ FULL SHARDING SETUP (Zone-Based, Multi-Region Simulation)

We'll simulate a sharded cluster **locally** (but modeled for real multi-region setup).

> ✅ Works on a single machine
> 💻 You can use Docker or standalone mongod instances (I’ll assume manual setup here for clarity)

---

### 1️⃣ Start Config Server Replica Set (stores metadata)

```bash
mkdir -p /data/config1 /data/config2 /data/config3

mongod --configsvr --replSet configReplSet --port 26001 --dbpath /data/config1 --fork --logpath /data/config1.log
mongod --configsvr --replSet configReplSet --port 26002 --dbpath /data/config2 --fork --logpath /data/config2.log
mongod --configsvr --replSet configReplSet --port 26003 --dbpath /data/config3 --fork --logpath /data/config3.log
```

**Initiate config replica set**:

```bash
mongo --port 26001
rs.initiate({
  _id: "configReplSet",
  configsvr: true,
  members: [
    { _id: 0, host: "localhost:26001" },
    { _id: 1, host: "localhost:26002" },
    { _id: 2, host: "localhost:26003" }
  ]
});
```

---

### 2️⃣ Start Shards (simulate 3 regions: US, EU, ASIA)

Each shard is a replica set:

```bash
mkdir -p /data/shard1 /data/shard2 /data/shard3

mongod --shardsvr --replSet sharedNP_WEST --port 27017 --dbpath /data/shard1 --fork --logpath /data/shard1.log
mongod --shardsvr --replSet sharedNP_MID --port 27018 --dbpath /data/shard2 --fork --logpath /data/shard2.log
mongod --shardsvr --replSet sharedNP_EAST --port 27019 --dbpath /data/shard3 --fork --logpath /data/shard3.log
```

**Initiate shard replica sets**:

```bash
mongo --port 27017
rs.initiate({ _id: "sharedNP_WEST", members: [ { _id: 0, host: "localhost:27017" } ] });

mongo --port 27018
rs.initiate({ _id: "sharedNP_MID", members: [ { _id: 0, host: "localhost:27018" } ] });

mongo --port 27019
rs.initiate({ _id: "sharedNP_EAST", members: [ { _id: 0, host: "localhost:27019" } ] });
```

---

### 3️⃣ Start Mongos Router

```bash
mongos --configdb configReplSet/localhost:26001,localhost:26002,localhost:26003 --port 27020 --fork --logpath /data/mongos.log
```

---

### 4️⃣ Connect to Mongos & Add Shards

```bash
mongo --port 27020

sh.addShard("sharedNP_WEST/localhost:27017");
sh.addShard("sharedNP_MID/localhost:27018");
sh.addShard("sharedNP_EAST/localhost:27019");
```

---

## 🌍 5️⃣ Configure Zone-Based Sharding on `transactions`

### ➤ Enable sharding for DB and collection:

```js
sh.enableSharding("banking");

sh.shardCollection("banking.transactions", {
  region: 1,
  transactionId: 1,
});
```

### ➤ Tag shards with zones:

```js
sh.addShardTag("sharedNP_WEST", "US");
sh.addShardTag("sharedNP_MID", "EU");
sh.addShardTag("sharedNP_EAST", "ASIA");
```

### ➤ Assign zone key ranges:

```js
sh.updateZoneKeyRange(
  "banking.transactions",
  { region: "US" },
  { region: "US" },
  "US"
);
sh.updateZoneKeyRange(
  "banking.transactions",
  { region: "EU" },
  { region: "EU" },
  "EU"
);
sh.updateZoneKeyRange(
  "banking.transactions",
  { region: "ASIA" },
  { region: "ASIA" },
  "ASIA"
);
```

---

## 🧪 6️⃣ Insert Sample Data by Region

```js
use banking

db.transactions.insertMany([
  { region: "US", transactionId: "tx001", amount: 100, accountId: "acc001" },
  { region: "EU", transactionId: "tx002", amount: 200, accountId: "acc002" },
  { region: "ASIA", transactionId: "tx003", amount: 300, accountId: "acc003" }
]);
```

🔍 Test a query:

```js
db.transactions.find({ region: "EU" });
```

➡ Routed directly to `sharedNP_MID` only

---

## 🔄 7️⃣ Try a Cross-Region Transaction

MongoDB supports distributed transactions across shards if needed:

```js
const session = db.getMongo().startSession();
const txn = session.getDatabase("banking");

session.startTransaction();

txn.transactions.insertOne({
  region: "US",
  transactionId: "tx100",
  amount: 999,
  accountId: "acc900",
});
txn.transactions.insertOne({
  region: "ASIA",
  transactionId: "tx101",
  amount: 777,
  accountId: "acc901",
});

session.commitTransaction();
session.endSession();
```

✔️ Both writes succeed across two zones using **2-phase commit**
❌ If one fails, the whole transaction rolls back

---

## ✅ Summary

| Step                | Tool                               | Description                          |
| ------------------- | ---------------------------------- | ------------------------------------ |
| Config servers      | `mongod`                           | Store cluster metadata               |
| Shards              | `mongod`                           | Store real data in different regions |
| Mongos router       | `mongos`                           | Routes queries to the correct shard  |
| Zone-based sharding | `sh.updateZoneKeyRange`            | Maps region→shard                    |
| Inserts & Queries   | `db.transactions.insert`, `find()` | Routed intelligently                 |
| Transactions        | `session.startTransaction()`       | Works across shards, atomic          |

---
