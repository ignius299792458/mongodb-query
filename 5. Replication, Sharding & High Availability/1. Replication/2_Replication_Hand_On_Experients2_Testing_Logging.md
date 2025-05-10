These will process of Testing, HeartBets, CRUDing on those replica, seeing logs, etc.

# 6. Test Writes, Reads & Replication

**MongoDB replica set** is up and running across 3 containers (with `mongo1` as primary), you're ready to **test real operations and observe how replication works** in action.

Here’s how to **see live read/write/update/delete behavior** and **inspect logs** or states of each replica.

---

## ✅ Step-by-Step: Test Writes, Reads & Replication

### 🔁 1. Connect to the Primary (`mongo1`)

- 1. From your terminal:

```bash
mongosh mongodb://localhost:27017
```

- 2.  Docker network:

```bash
mongosh "mongodb://mongo1:27017"
```

- 3.  Or your application as client to mongodb replica-set (connet to primary)

### 💾 2. Write Some Data

```javascript
use testDB
db.users.insertOne({ name: "Alice", role: "admin" })
```

Then:

```js
db.users.find();
```

You’ll see the inserted document.

> **`IMP-NOTE`** MongoDB by default **only allows writes and reads on the PRIMARY** unless configured.

---

# 7. Read from Secondary (Bypass Default Read Preference from Primary)

MongoDB by default **only allows writes and reads on the PRIMARY** unless configured.

To read from a secondary:

```bash
mongosh --host mongo2:27017 --readPreference=secondary
```

Then in shell:

```js
use testDB
db.users.find()
```

If replication is working, you'll see Alice's document here too.

---

# 8. Watch the Logs for Sync Activity (Real-time logs)

In separate terminals from each docker containers of each replica

```bash
docker logs -f mongo1
docker logs -f mongo2
docker logs -f mongo3
```

Watch how:

- `mongo2` and `mongo3` fetch oplog entries from `mongo1`
- Updates, inserts, deletions will show up

---

# 9. Do More Operations

Run these on `mongo1`:

```js
db.users.insertMany([
  { name: "Bob", role: "editor" },
  { name: "Charlie", role: "viewer" },
]);

db.users.updateOne({ name: "Alice" }, { $set: { role: "superadmin" } });

db.users.deleteOne({ name: "Charlie" });
```

Then read from `mongo2` or `mongo3` to see if all changes replicated.

---

# 10. Check Replica Set Status at Any Time

```js
rs.status();
```

---

## 🔍 Optional: Simulate Failover

From the `mongosh` connected to the primary:

```js
rs.stepDown();
```

Wait a few seconds and re-run:

```js
rs.status();
```

Now a **new PRIMARY** will be elected from `mongo2` or `mongo3`. Try writing to the new primary.

---
