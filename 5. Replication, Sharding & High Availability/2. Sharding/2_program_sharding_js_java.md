- ✅ **Java (Reactive with Spring Data MongoDB)**
- ✅ **JavaScript (Node.js with Mongoose)**

---

# 🏦 Sharded Collection Scenario: `transactions`

### 📄 Sample Document Structure:

```json
{
  "_id": "txn_1001",
  "accountNumber": "ACCT123456",
  "amount": 950,
  "type": "DEBIT",
  "region": "us-east",
  "timestamp": "2025-05-10T12:20:00Z"
}
```

We'll use the **compound shard key** `{ accountNumber: 1, region: 1 }`.

---

## ⚙️ 1. MongoDB Shell — Shard Setup Example

Before we code, here’s what you’d run once in the **MongoDB shell**:

```js
// Enable sharding for the database
sh.enableSharding("banking");

// Shard the 'transactions' collection using compound key
sh.shardCollection("banking.transactions", { accountNumber: 1, region: 1 });

// Optional: Assign zones for region-based sharding
sh.addShardTag("shard1", "us-east");
sh.addShardTag("shard2", "eu-west");
sh.updateZoneKeyRange(
  "banking.transactions",
  { region: "us-east" },
  { region: "us-east" },
  "us-east"
);
```

---

## ☕ Java (Reactive with Spring Data MongoDB)

### ✅ 1. MongoDB Document (Spring Boot Model)

```java
@Document("transactions")
public class Transaction {
    @Id
    private String id;

    @Indexed
    private String accountNumber;

    @Indexed
    private String region;

    private Double amount;
    private String type;
    private Instant timestamp;
}
```

### ✅ 2. Reactive Repository

```java
public interface TransactionRepository extends ReactiveMongoRepository<Transaction, String> {
    Flux<Transaction> findByAccountNumberAndRegion(String accountNumber, String region);
}
```

### ✅ 3. Sample Service Method (Reactive Query)

```java
public Flux<Transaction> getTransactions(String acctNo, String region) {
    return transactionRepository.findByAccountNumberAndRegion(acctNo, region);
}
```

This method **targets the specific shard** thanks to the use of the **shard key fields**.

---

## 🌐 JavaScript (Node.js with Mongoose)

### ✅ 1. Mongoose Schema

```js
const mongoose = require("mongoose");

const txnSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, index: true },
    region: { type: String, index: true },
    amount: Number,
    type: String,
    timestamp: Date,
  },
  { collection: "transactions" }
);

txnSchema.index({ accountNumber: 1, region: 1 }); // Ensure shard key index
const Transaction = mongoose.model("Transaction", txnSchema);
```

### ✅ 2. Query Targeting Shard

```js
async function getTransactions(accountNumber, region) {
  return await Transaction.find({ accountNumber, region });
}
```

MongoDB **routes the query to the correct shard** using the `accountNumber + region` compound key.

---

## 💡 Important Notes for Production:

| Topic              | Java & JS Implementation Considerations                                    |
| ------------------ | -------------------------------------------------------------------------- |
| Shard Key Querying | Always include **all shard key fields** in your queries for efficiency     |
| Write Distribution | New writes should be **spread across keys** to prevent shard hotspots      |
| Zone Awareness     | Use `region`-based zones for latency and regulation-sensitive banking data |
| Indexing           | Your **shard key must be indexed** (automatically done when sharding)      |

---

## 🔚 Summary

| Stack       | Setup Component              | Key Feature Demonstrated          |
| ----------- | ---------------------------- | --------------------------------- |
| Mongo Shell | `shardCollection(...)`       | Set up sharding with compound key |
| Java        | Reactive Repository + Query  | Targeted reads using shard key    |
| JavaScript  | Mongoose with compound index | Efficient shard-local reads       |
