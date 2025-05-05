Perfect! Let’s now go in-depth into:

---

## 🔹 II. Projection Techniques (In-Depth)

Projection in MongoDB means **controlling what fields to return**, reshape, or compute in the output. It can be used in:

- `find()` (simple projections)
- Aggregation (`$project` stage — advanced projections)

---

### ✅ 1. **Include / Exclude Fields** in `find()`

```js
// Include only name and email, exclude _id
db.customers.find(
  { gender: "Female" },
  { full_name: 1, email_address: 1, _id: 0 }
);
```

- `1` → Include
- `0` → Exclude
- Cannot mix include and exclude (except for `_id`)

> ⚠️ Always _exclude_ fields you don't need to improve performance and bandwidth.

---

### ✅ 2. **Computed Fields with `$project` (in Aggregation)**

The `$project` stage can:

- include/exclude fields
- compute new fields
- rename fields
- reshape documents

```js
db.bank_accounts.aggregate([
  { $match: { status: "ACTIVE" } },
  {
    $project: {
      _id: 0,
      accNo: "$account_number", // rename field
      balance: 1, // include field
      currency: 1,
      isHighValue: { $gt: ["$balance", 10000] }, // compute boolean
    },
  },
]);
```

> 👆 This returns:

```json
{
  "accNo": "ACC1234567890",
  "balance": 15000.0,
  "currency": "USD",
  "isHighValue": true
}
```

---

### 🛠 Key Projection Operators (inside `$project`)

| Operator                                            | Description            |
| --------------------------------------------------- | ---------------------- |
| `$add`, `$subtract`, `$multiply`, `$divide`, `$mod` | Arithmetic             |
| `$concat`, `$toUpper`, `$substr`                    | String manipulation    |
| `$gt`, `$lt`, `$eq`, `$and`, `$or`                  | Logical                |
| `$type`, `$ifNull`, `$cond`                         | Conditional / fallback |
| `$dateToString`                                     | Date formatting        |

---

### ✅ 3. **Conditional Fields with `$cond`**

```js
{
  $project: {
    balance: 1,
    statusLabel: {
      $cond: {
        if: { $gt: ["$balance", 10000] },
        then: "PREMIUM",
        else: "REGULAR"
      }
    }
  }
}
```

---

### ✅ 4. **Flatten Embedded Fields**

```js
db.customers.aggregate([
  {
    $project: {
      _id: 0,
      name: "$full_name",
      city: "$address.district",
      lat: "$address.geolocation.latitude",
      long: "$address.geolocation.longitude",
    },
  },
]);
```

---

### ✅ 5. **Suppress a Field from Nested Object**

You cannot partially include/exclude nested fields in `find()` — but `$project` allows it:

```js
{
  $project: {
    accountHolder: {
      full_name: "$accountHolder.full_name",
      email_address: "$accountHolder.email_address"
    }
  }
}
```

---
