# Indexing

---

## 🔹 What Is Indexing?

Indexing in databases is a technique used to speed up data retrieval operations without scanning every row in a table. It creates an auxiliary data structure that helps locate records efficiently.

---

## 🔹 Why Indexing Is Needed:

- Without an index: Every search involves scanning all rows → slow (O(n))
- With an index: The database can directly find the record using a faster lookup → fast (O(log n))

---

## 🔹 How Indexing Works (Analogy):

Think of a book:

- Table of contents = index
- Instead of reading every page, you jump directly to the topic’s page number

---

## 🔹 Indexing Mechanism:

An index stores:

- The value of the indexed column
- A pointer/reference to the corresponding record in the data file

This allows the database to go straight to the required record using the index.

---

## 🔹 Types of Indexes:

1. **Primary Index** – Built on the primary key; unique; sorted.
2. **Secondary Index** – Built on non-primary fields; may not be unique.
3. **Clustered Index** – Records are physically sorted based on the index key (not supported in MongoDB).
4. **Non-clustered Index** – Index is separate from data; contains pointers to records (MongoDB uses this style).

---

## 🔹 Trade-offs:

| Pros                | Cons                  |
| ------------------- | --------------------- |
| Fast read/search    | Slower insert/update  |
| Efficient filtering | Consumes extra memory |

---
