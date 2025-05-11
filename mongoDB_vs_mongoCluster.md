# Cluster and Database in Mongo

## 🧱 1. What is a **Database** in MongoDB?

### 🔹 Definition:

A **database** is a **logical container** for a group of **collections** (which are like tables in relational DBs). It helps organize related data.

### 🧠 Think of it like:

- A _schema_ or _namespace_ in SQL
- A directory holding multiple files (collections)

### 📦 Structure:

```text
Database
 ├── Collection (e.g., "customers")
 │     └── Documents (JSON-like records)
 └── Collection (e.g., "transactions")
       └── Documents
```

### 🧪 Example:

```js
use bankingSystem;

db.customers.insertOne({ name: "Ignius", region: "EU" });
db.transactions.insertOne({ customerId: "...", amount: 1000 });
```

> Here, `bankingSystem` is a **database** containing `customers` and `transactions` collections.

---

## 🏢 2. What is a **Cluster** in MongoDB?

### 🔹 Definition:

A **cluster** is a **set of MongoDB servers** that work together to provide:

- **High availability** (via **replica sets**)
- **Scalability** (via **sharding**)
- **Redundancy**
- **Distributed query routing**

There are 3 types:

| Cluster Type       | Description                                              |
| ------------------ | -------------------------------------------------------- |
| 🧍‍♂️ Standalone      | Single MongoDB instance (not recommended for production) |
| 🤝 Replica Set     | Set of servers for HA via replication                    |
| 🌍 Sharded Cluster | Partitioned data across shards for horizontal scaling    |

---

## 🔄 Relationship Between Database and Cluster

| Concept      | Type                     | Description                                    |
| ------------ | ------------------------ | ---------------------------------------------- |
| **Cluster**  | Physical / Top-level     | Whole MongoDB deployment — distributed system  |
| **Database** | Logical / Inside Cluster | A namespace inside the cluster for collections |

### ✅ A Cluster can contain **many databases**

- `bankingSystem`, `admin`, `config`, `logging`, etc.

### ✅ A Database lives **inside a cluster**

---

## 🌍 Cloud Context (MongoDB Atlas Example)

| Component   | Example                      | Purpose                       |
| ----------- | ---------------------------- | ----------------------------- |
| Cluster     | Cluster0-shard-0.mongodb.net | Scalable deployment (3 nodes) |
| Database    | `bankingSystem`              | Logical namespace for data    |
| Collections | `customers`, `transactions`  | Tables for documents          |
| Documents   | `{ name: "Ignius" }`         | JSON-like records             |

---

## 📌 Summary Table

| Term       | Scope       | Purpose                                  | Example                         |
| ---------- | ----------- | ---------------------------------------- | ------------------------------- |
| Cluster    | System-wide | High availability, replication, sharding | Cluster0, ReplicaSetA           |
| Database   | Logical     | Organizes collections                    | `bankingSystem`, `inventory`    |
| Collection | Logical     | Stores documents                         | `transactions`, `users`         |
| Document   | Logical     | The actual data (JSON/BSON)              | `{name: "Ignius", amount: 500}` |

---

## 🧠 TL;DR

> - **Cluster** = the whole distributed system (hardware + software)
> - **Database** = logical grouping of collections inside a cluster
> - You can have **many databases in a single cluster**
> - A **sharded cluster** allows each database to scale across nodes

---
