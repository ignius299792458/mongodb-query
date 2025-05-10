# 1. MongoDB Replica-Set using `mongosh`

---

### ✅ **Prerequisites**

- MongoDB installed (make sure it's not just `mongosh`, but `mongod` as well).
- 3 MongoDB instances (can be on the same machine using different ports).
- `mongosh` to interact with the instances.

---

### 🔧 **Step-by-Step: Local Replica Set Setup**

#### **1. Create Data Directories**

```bash
mkdir -p /data/rs0 /data/rs1 /data/rs2
```

#### **2. Start MongoDB Instances**

In separate terminal windows or using `tmux`, run:

```bash
mongod --replSet rs0 --port 27017 --dbpath /data/rs0 --bind_ip localhost --oplogSize 128
mongod --replSet rs0 --port 27018 --dbpath /data/rs1 --bind_ip localhost --oplogSize 128
mongod --replSet rs0 --port 27019 --dbpath /data/rs2 --bind_ip localhost --oplogSize 128
```

#### **3. Connect with mongosh**

```bash
mongosh --port 27017
```

#### **4. Initiate the Replica Set**

Once inside `mongosh`, run:

```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" },
  ],
});
```

#### **5. Check the Replica Set Status**

```javascript
rs.status();
```

You should see one `PRIMARY` and two `SECONDARY` members.

---

### 🔄 Useful Commands

- **See current replica config**:

  ```javascript
  rs.conf();
  ```

- **Add a new member**:

  ```javascript
  rs.add("localhost:27020");
  ```

---

# 2. How to setup all replica at dev and prod ?

**No**, maintaining a replica set doesn't _require_ putting each MongoDB instance on a physically different server or storage location—but **doing so is highly recommended in production environments** for **fault tolerance and high availability**.

### 🔍 Here's what that means:

#### ✅ **In Development (Local Setup)**:

- You often simulate a replica set by running 3 MongoDB instances on the **same machine** with **different ports and directories**.
- This is fine for **learning**, **testing**, or **local development**.
- Example:

  - `mongod --dbpath /data/rs0 --port 27017`
  - `mongod --dbpath /data/rs1 --port 27018`
  - `mongod --dbpath /data/rs2 --port 27019`

#### 🚨 **In Production**:

- **Each replica member should be on a separate server or VM**, ideally in **different data centers** or **availability zones**.
- Why?

  - If one machine or disk fails, others stay available.
  - This gives **true high availability** and **data redundancy**.

#### 🧠 Storage-wise:

Each member in the replica set maintains its **own complete copy** of the database. So:

- Storage is duplicated.
- Writes are acknowledged by the primary and then replicated to secondaries.
- You must provision enough disk space on each node.

---

### Summary:

| Context     | Same Storage OK? | Purpose                        |
| ----------- | ---------------- | ------------------------------ |
| Development | ✅ Yes           | Simulate behavior              |
| Production  | 🚫 No            | Must be distributed for safety |

# 3. Replica-Set by using Docker Containers

### 🧠 TL;DR:

> **Always use separate containers for each MongoDB replica set member**, even in local setups.
> Running multiple replicas inside the **same container** is **not recommended**.

---

### 🔍 Here's Why:

#### ❌ **One container for all replicas**:

- **Bad Practice** — not isolated.
- Single point of failure — if the container goes down, **all replicas go down**.
- Complicates resource limits and monitoring.
- Harder to scale or test real failover behavior.

#### ✅ **One container per replica (Recommended)**:

- Each container runs **one mongod instance** on a different port.
- Better **isolation**, easier to manage logs, health checks, volumes, and network config.
- Simulates production behavior more accurately.
- Enables better testing of **failover, resilience**, and **replication delays**.

---

### 🐳 Example: Docker Compose for Replica Set

You can use `docker-compose` like this (simplified):

```yml
# Docker compose setup for running 3-Replication sets

services:
  mongo1:
    image: mongo
    container_name: mongo1
    ports:
      - 27017:27017
    volumes:
      - ./data/mongo1:/data/db
    networks:
      - mongo-replication-ntk
    command: ["mongod", "--replSet", "rs0"]

  mongo2:
    image: mongo
    container_name: mongo2
    ports:
      - 27018:27017
    volumes:
      - ./data/mongo2:/data/db
    networks:
      - mongo-replication-ntk
    command: ["mongod", "--replSet", "rs0"]

  mongo3:
    image: mongo
    container_name: mongo3
    ports:
      - 27019:27017
    volumes:
      - ./data/mongo3:/data/db
    networks:
      - mongo-replication-ntk
    command: ["mongod", "--replSet", "rs0"]

networks:
  mongo-replication-ntk:
    name: mongo_replication_ntk
    driver: bridge
```

After starting, you can `mongosh` into one and run `rs.initiate()`.

---

### 💡 Pro Tips:

- Use `--bind_ip_all` if connecting from outside.
- Use Docker networks to make replicas communicate easily.
- You can automate replica initiation with entrypoint scripts.

# 4. How configure the Replica-set (Primary and Secondary Replica)?

### 🧠 `rs.initiate()` - set the running replica as `primary`

The `rs.initiate()` command in `mongosh` **starts a replica set** and **makes the current MongoDB instance the primary**. It’s how you **formally initialize** a group of MongoDB instances to begin working together as a **replica set**.

---

### 🔧 When You Run:

```js
rs.initiate();
```

or with config:

```js
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" },
  ],
});
```

---

### ✅ Here's What Happens:

1. **Creates the Replica Set** with ID `"rs0"`.
2. Adds the listed MongoDB nodes as **members** of the set.
3. Assigns one of them as the **primary** (usually the one you initiated from).
4. The other members become **secondaries** and start syncing.
5. Enables features like:

   - **Automatic failover**
   - **Data replication**
   - **Read scaling (if using secondary reads)**

---

### 🔁 After That:

You can run:

```js
rs.status();
```

To see the health and sync state of all replica members.

---

### 🔒 Important Notes:

- You only run `rs.initiate()` **once** — usually on the **first node**.
- All other nodes join automatically as defined in the config.

# 5. What is `rs`?

### 🧠 `rs` stands for **Replica Set** in MongoDB.

When you're using `mongosh` (MongoDB Shell), the `rs` object is a **built-in helper** that provides commands to **manage and inspect the replica set** your current MongoDB instance is part of.

---

### 🔧 Common `rs` Commands:

| Command           | What It Does                                                    |
| ----------------- | --------------------------------------------------------------- |
| `rs.initiate()`   | Initializes a new replica set.                                  |
| `rs.status()`     | Shows the current status of the replica set (health, sync).     |
| `rs.conf()`       | Shows the replica set configuration.                            |
| `rs.add(host)`    | Adds a new member to the replica set.                           |
| `rs.remove(host)` | Removes a member from the replica set.                          |
| `rs.stepDown()`   | Forces the current primary to step down (for failover testing). |

---

### 📦 Example:

```javascript
> rs.status().members
[
  {
    name: 'mongo1:27017',
    stateStr: 'PRIMARY',
    health: 1
  },
  {
    name: 'mongo2:27017',
    stateStr: 'SECONDARY',
    health: 1
  },
  ...
]
```

This shows the role of each member in the replica set.

---

So, `rs` is simply a **MongoDB shell helper** object to control and observe the **replication system**.
