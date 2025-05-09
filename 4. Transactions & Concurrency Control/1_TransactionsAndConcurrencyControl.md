# **Concepts of Transactions & Concurrency Control in Databases**

---

## 📘 1. GENERAL CONCEPT: Transactions & Concurrency Control (Database-Agnostic)

### ✅ **What is a Transaction?**

A **transaction** is a sequence of one or more database operations that are treated as a **single, atomic unit of work**.

It must follow **ACID properties**:

- **Atomicity** – All operations succeed or none do.
- **Consistency** – Transforms the DB from one valid state to another.
- **Isolation** – Concurrent transactions do not interfere.
- **Durability** – Once committed, changes are permanent.

> Imagine transferring \$100 from Account A to Account B:
>
> - Debit A
> - Credit B
>   If one succeeds and the other fails, money vanishes or duplicates — hence, atomicity is crucial.

---

### ⚖️ Concurrency Control

This deals with multiple users or apps accessing/modifying the database **at the same time**.

Concurrency control ensures:

- No **dirty reads** (reading uncommitted data)
- No **non-repeatable reads** (re-reading gives different result)
- No **phantom reads** (new rows appear unexpectedly)

**Techniques**:

1. **Pessimistic Locking**: Block others from accessing data during your transaction.
2. **Optimistic Locking**: Allow access but check for conflicts before commit.
3. **Isolation Levels**: Define rules for visibility of data between concurrent transactions (READ COMMITTED, REPEATABLE READ, etc.)

---

## 📘 2. MongoDB: Transactions & Concurrency

### 🧠 MongoDB Model:

- MongoDB is **document-based**, so typical operations are **atomic at document level**.
- However, from **v4.0 onward**, **multi-document transactions** are supported in **replica sets**, and from **v4.2**, also in **sharded clusters**.

### ⚙️ Transaction Flow (MongoDB)

- Uses **multi-statement transactions** similar to relational DBs.
- Follows **snapshot isolation** internally (similar to REPEATABLE READ in RDBMS).
- Uses **WiredTiger storage engine**: provides document-level concurrency with internal locking.

---

## 💡 Banking System Example (Business Case)

**Use Case:**
Transfer \$100 from Account A (`accA`) to Account B (`accB`)

### Transactional Steps:

1. Check balance of `accA`
2. Deduct \$100 from `accA`
3. Add \$100 to `accB`
4. Record the transaction log

These **must** happen in a **transaction**, otherwise inconsistent state might occur.

---

## 🧑‍💻 Example 1: Node.js (MongoDB Native Driver)

```js
const { MongoClient } = require("mongodb");

async function transferFunds(fromAcc, toAcc, amount) {
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  const session = client.startSession();

  try {
    session.startTransaction();

    const db = client.db("banking");
    const accounts = db.collection("bankAccounts");
    const transactions = db.collection("transactions");

    const from = await accounts.findOne({ _id: fromAcc }, { session });
    if (from.balance < amount) throw new Error("Insufficient funds");

    await accounts.updateOne(
      { _id: fromAcc },
      { $inc: { balance: -amount } },
      { session }
    );
    await accounts.updateOne(
      { _id: toAcc },
      { $inc: { balance: amount } },
      { session }
    );

    await transactions.insertOne(
      {
        from: fromAcc,
        to: toAcc,
        amount,
        date: new Date(),
      },
      { session }
    );

    await session.commitTransaction();
    console.log("Transfer successful");
  } catch (err) {
    await session.abortTransaction();
    console.error("Transfer failed:", err);
  } finally {
    await session.endSession();
    await client.close();
  }
}
```

---

## ☕ Example 2: Java (Reactive MongoDB + Spring Data)

```java
public Mono<Void> transferFunds(String fromAccId, String toAccId, double amount) {
    return reactiveMongoTemplate.inTransaction()
        .execute(action -> {
            Mono<BankAccount> fromAcc = action.findById(fromAccId, BankAccount.class);
            Mono<BankAccount> toAcc = action.findById(toAccId, BankAccount.class);

            return fromAcc.zipWith(toAcc)
                .flatMap(tuple -> {
                    BankAccount from = tuple.getT1();
                    BankAccount to = tuple.getT2();

                    if (from.getBalance() < amount)
                        return Mono.error(new RuntimeException("Insufficient funds"));

                    from.setBalance(from.getBalance() - amount);
                    to.setBalance(to.getBalance() + amount);

                    Transaction txn = new Transaction(fromAccId, toAccId, amount, Instant.now());

                    return action.save(from)
                        .then(action.save(to))
                        .then(action.save(txn));
                });
        }).then();
}
```

> 💡 `inTransaction()` ensures the full chain is **atomic**. If any save fails, all roll back.

---

## 🧠 Summary

| Feature                     | Traditional RDBMS      | MongoDB                         |
| --------------------------- | ---------------------- | ------------------------------- |
| Transaction Support         | Native & rich          | Since v4.0, multi-doc supported |
| Default Isolation           | Various levels         | Snapshot Isolation              |
| Atomicity at Document Level | Yes                    | Yes                             |
| Multi-Document Transactions | Always                 | Only in replica sets / clusters |
| Locking Mechanism           | Pessimistic/Optimistic | Document-level (WiredTiger)     |
