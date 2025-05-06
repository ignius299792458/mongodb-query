Great — here's a complete and in-depth guide to MongoDB Aggregation Pipeline including:

- Full breakdown of aggregation stages
- Logical structuring and handling of pipelines
- SQL analogies for each concept
- Realistic examples using your banking system
- Query results for illustration

---

## 📘 What is the MongoDB Aggregation Pipeline?

**Definition:** A framework for data transformation and analytics. Documents pass through a sequence of stages (like a pipeline), each transforming or filtering the data.

**Analogy:** Like Unix pipes `|` or SQL's `SELECT … FROM … WHERE … GROUP BY …`.

---

## ⚙️ Aggregation Pipeline Core Concepts (with SQL Equivalents)

| MongoDB Stage  | Purpose                                | SQL Equivalent                          |
| -------------- | -------------------------------------- | --------------------------------------- |
| `$match`       | Filter documents                       | `WHERE`                                 |
| `$project`     | Shape document, include/exclude fields | `SELECT` + computed fields              |
| `$group`       | Group & aggregate values               | `GROUP BY` with `SUM()`, `COUNT()`, etc |
| `$sort`        | Sort documents                         | `ORDER BY`                              |
| `$limit`       | Limit the number of documents          | `LIMIT`                                 |
| `$skip`        | Skip N documents                       | `OFFSET`                                |
| `$unwind`      | Deconstruct arrays                     | `JOIN UNNEST()`                         |
| `$lookup`      | Perform joins                          | `JOIN`                                  |
| `$addFields`   | Add/modify fields                      | Computed columns in `SELECT`            |
| `$set`         | Alias of `$addFields`                  | Same                                    |
| `$unset`       | Remove fields                          | `SELECT` without unwanted fields        |
| `$replaceRoot` | Promote sub-document to root           | `SELECT nested_table.*`                 |
| `$merge`       | Write to collection                    | `INSERT INTO … SELECT`                  |
| `$out`         | Export result to new collection        | `SELECT INTO new_table`                 |

---

## 🧠 Pipeline Structuring Logically

### Rule: Start broad → refine → project/aggregate → finalize output

**Example Strategy:**

```txt
1. $match — reduce dataset early (index-friendly)
2. $project/$addFields — shape fields, prepare for logic
3. $unwind — handle array fields if necessary
4. $group — perform aggregation
5. $sort, $skip, $limit — post-aggregation presentation
```

---

## 🏦 Your Banking System Example Queries

### 1. 🧾 Total Deposits by Each Customer (grouping)

```javascript
db.transactions.aggregate([
  { $match: { transactionType: "DEPOSIT", status: "COMPLETED" } },
  {
    $group: {
      _id: "$accountId",
      totalDeposits: { $sum: "$amount" },
      count: { $sum: 1 },
    },
  },
  {
    $lookup: {
      from: "bank_accounts",
      localField: "_id",
      foreignField: "_id",
      as: "account",
    },
  },
  { $unwind: "$account" },
  {
    $project: {
      accountNumber: "$account.accountNumber",
      totalDeposits: 1,
      count: 1,
    },
  },
]);
```

**SQL Equivalent:**

```sql
SELECT ba.account_number, SUM(t.amount) AS total_deposits, COUNT(*) AS count
FROM transactions t
JOIN bank_accounts ba ON t.account_id = ba.id
WHERE t.transaction_type = 'DEPOSIT' AND t.status = 'COMPLETED'
GROUP BY t.account_id, ba.account_number;
```

---

### 2. 🔍 Filter & Project — Find all failed withdrawals over \$1000

```javascript
db.transactions.aggregate([
  {
    $match: {
      transactionType: "WITHDRAWAL",
      status: "FAILED",
      amount: { $gt: 1000 },
    },
  },
  {
    $project: {
      _id: 0,
      transactionId: 1,
      accountId: 1,
      amount: 1,
      date: 1,
      description: 1,
    },
  },
]);
```

**SQL Equivalent:**

```sql
SELECT transaction_id, account_id, amount, date, description
FROM transactions
WHERE transaction_type = 'WITHDRAWAL'
  AND status = 'FAILED'
  AND amount > 1000;
```

---

### 3. 🧮 Count of Transactions by Status per Account

```javascript
db.transactions.aggregate([
  {
    $group: {
      _id: { account: "$accountId", status: "$status" },
      count: { $sum: 1 },
    },
  },
  {
    $group: {
      _id: "$_id.account",
      statusCounts: {
        $push: {
          status: "$_id.status",
          count: "$count",
        },
      },
    },
  },
]);
```

**SQL Equivalent:**

```sql
SELECT account_id,
       JSON_AGG(JSON_BUILD_OBJECT('status', status, 'count', cnt)) AS status_counts
FROM (
  SELECT account_id, status, COUNT(*) AS cnt
  FROM transactions
  GROUP BY account_id, status
) sub
GROUP BY account_id;
```

---

### 4. 🔁 Join — Fetch transactions with customer info

```javascript
db.transactions.aggregate([
  {
    $lookup: {
      from: "bank_accounts",
      localField: "accountId",
      foreignField: "_id",
      as: "account",
    },
  },
  { $unwind: "$account" },
  {
    $lookup: {
      from: "customers",
      localField: "account.accountHolder",
      foreignField: "_id",
      as: "customer",
    },
  },
  { $unwind: "$customer" },
  {
    $project: {
      transactionId: 1,
      amount: 1,
      transactionType: 1,
      customerName: "$customer.fullName",
      accountNumber: "$account.accountNumber",
    },
  },
]);
```

**SQL Equivalent:**

```sql
SELECT t.transaction_id, t.amount, t.transaction_type,
       c.full_name AS customer_name, a.account_number
FROM transactions t
JOIN bank_accounts a ON t.account_id = a.id
JOIN customers c ON a.account_holder = c.id;
```

---

### 5. 🌍 Geospatial Query — Find customers near a location

```javascript
db.customers.find({
  "address.geolocation": {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [85.324, 27.7172], // Kathmandu
      },
      $maxDistance: 5000, // meters
    },
  },
});
```

**SQL Equivalent:**
Using PostGIS:

```sql
SELECT * FROM customers
WHERE ST_DWithin(address.geolocation, ST_MakePoint(85.324, 27.7172)::geography, 5000);
```

---

## 🧠 Advanced Features You Should Know

### `$facet`: Run multiple pipelines in parallel

```js
{
  $facet: {
    deposits: [
      { $match: { transactionType: "DEPOSIT" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ],
    withdrawals: [
      { $match: { transactionType: "WITHDRAWAL" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]
  }
}
```

### `$bucket` and `$bucketAuto`: Histogram-style grouping (e.g., age ranges)

---

### `$graphLookup`: Recursive joins (e.g., transaction tracing, referral trees)

---

### `$redact`: Conditional visibility (security, masking based on roles)

---

### `$function`: Custom logic using JavaScript in aggregation (Node.js-like behavior inside Mongo)

---

## 🧪 Performance Tips for Aggregations

- Always use `$match` early — takes advantage of indexes
- Avoid `$lookup` unless you index the joined fields
- Prefer `$project` before `$group` to reduce memory load
- Use `explain("executionStats")` to analyze efficiency
- `$merge` for materializing large results into collection

---

## Link to Actual Documentation

> [Mongodb_Aggregation_Framework_Link](https://www.mongodb.com/docs/manual/aggregation/)
