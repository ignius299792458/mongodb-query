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

---

## `$bucket`: Manual Range-Based Bucketing (Histogram Binning)

### 🔹 What it does:

Divides documents into **explicit ranges (bins)** based on a field's value. You define the **boundaries** manually, and MongoDB groups documents falling between those values.

> Think of `$bucket` like `CASE WHEN` in SQL or **manual histogram bucketing**.

---

### 🔹 Syntax:

```js
{
  $bucket: {
    groupBy: "<expression>",        // field or expression to bucket on
    boundaries: [0, 10, 20, 30],    // inclusive lower bound, exclusive upper
    default: "Other",               // optional: bucket for values outside boundaries
    output: {
      count: { $sum: 1 },           // what to compute for each bucket
      total: { $sum: "$field" }
    }
  }
}
```

---

### 🔹 Use Case Example: Group Customers by Age Group

```js
db.customers.aggregate([
  {
    $bucket: {
      groupBy: "$age",
      boundaries: [0, 18, 30, 50, 70],
      default: "70+",
      output: {
        count: { $sum: 1 },
      },
    },
  },
]);
```

---

## `$bucketAuto`: Automatic Histogram Bucketing

### 🔹 What it does:

Like `$bucket`, but MongoDB **automatically calculates boundaries** to create **equally distributed buckets**.

> Think of it like **auto-generated histogram binning**.

---

### 🔹 Syntax:

```js
{
  $bucketAuto: {
    groupBy: "$amount",
    buckets: 5,
    output: {
      totalAmount: { $sum: "$amount" }
    }
  }
}
```

---

### 🔹 When to Use:

- You don’t know ideal ranges ahead of time.
- You want equal distribution by document **count**, not range.

---

## `$graphLookup`: Recursive Joins (Hierarchical Queries)

### 🔹 What it does:

Performs **recursive self-joins** to retrieve hierarchical or **multi-level tree data** (e.g., organizational charts, referral chains, transaction traces).

---

### 🔹 Syntax:

```js
{
  $graphLookup: {
    from: "employees",
    startWith: "$managerId",
    connectFromField: "managerId",
    connectToField: "_id",
    as: "hierarchy"
  }
}
```

---

### 🔹 Use Case Example: Fetch All Subordinates of a Manager

```js
db.employees.aggregate([
  {
    $match: { name: "Alice" },
  },
  {
    $graphLookup: {
      from: "employees",
      startWith: "$_id",
      connectFromField: "_id",
      connectToField: "managerId",
      as: "subordinates",
    },
  },
]);
```

---

### 🔹 Common Use Cases:

- Employee-management hierarchies
- Referral networks
- Tracing transaction chains (e.g., who triggered what)

---

## `$redact`: Document-Level Access Control / Filtering

### 🔹 What it does:

Controls **visibility of parts of documents** based on dynamic conditions. Can **prune** or **keep** subdocuments depending on user roles, metadata, etc.

> Think of `$redact` as a **conditional visibility filter** — row-level security.

---

### 🔹 Syntax:

```js
{
  $redact: {
    $cond: {
      if: { $eq: ["$securityLevel", "PUBLIC"] },
      then: "$$DESCEND",  // include this document and go deeper
      else: "$$PRUNE"     // remove this branch/document
    }
  }
}
```

---

### 🔹 Modes:

- `$$PRUNE`: Exclude this and all child content.
- `$$KEEP`: Keep this and skip traversing further.
- `$$DESCEND`: Keep and traverse deeper.

---

### 🔹 Use Case: Mask Private Transactions

```js
db.transactions.aggregate([
  {
    $redact: {
      $cond: {
        if: { $eq: ["$visibility", "PRIVATE"] },
        then: "$$PRUNE",
        else: "$$KEEP",
      },
    },
  },
]);
```

---

## `$function`: Custom JavaScript Logic in Aggregation (MongoDB 4.4+)

### 🔹 What it does:

Lets you run **custom JavaScript logic inside aggregation pipelines** (like `eval`, but scoped safely).

> It's like writing **inline JavaScript code** to compute fields, conditionally transform data, or apply complex logic.

---

### 🔹 Syntax:

```js
{
  $addFields: {
    customField: {
      $function: {
        body: function(value) {
          return value.toUpperCase();
        },
        args: ["$name"],
        lang: "js"
      }
    }
  }
}
```

---

### 🔹 Use Case: Custom Currency Conversion

```js
db.transactions.aggregate([
  {
    $addFields: {
      convertedAmount: {
        $function: {
          body: function (amount, rate) {
            return amount * rate;
          },
          args: ["$amount", 1.2],
          lang: "js",
        },
      },
    },
  },
]);
```

---

### ⚠️ Caution:

- `$function` **can impact performance** (runs in JavaScript VM inside the MongoDB engine).
- Use it **only when necessary**, and not on large datasets unless indexed/memoized well.

---

## 🔚 Summary Table:

| Stage          | Purpose                            | SQL Analogy                   | Real Use Case Example                 |
| -------------- | ---------------------------------- | ----------------------------- | ------------------------------------- |
| `$bucket`      | Manual histogram grouping          | `CASE WHEN`                   | Age ranges, balance tiers             |
| `$bucketAuto`  | Auto-balanced histogram grouping   | Quantile buckets              | Salary distribution                   |
| `$graphLookup` | Recursive, hierarchical joins      | Recursive CTEs                | Org trees, referral depth             |
| `$redact`      | Conditional inclusion/exclusion    | Row-level security            | Masking private data                  |
| `$function`    | Inline custom logic in aggregation | UDFs (User-Defined Functions) | Custom currency/logic transformations |

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
