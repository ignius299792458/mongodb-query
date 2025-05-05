Great — we'll go step-by-step and explore **each advanced MongoDB querying topic in-depth**, starting with:

---

## 🔹 I. Core Query Concepts (In-Depth)

### 1. **Basic Queries**

#### 🔸 `find()` and `findOne()`

- **`find()`**: Returns a _cursor_ to multiple documents matching a filter.
- **`findOne()`**: Returns the _first matching document_ only.

```js
// Find all accounts with status 'ACTIVE'
db.bank_accounts.find({ status: "ACTIVE" });

// Find one customer by phone
db.customers.findOne({ phone_number: "+491234567890" });
```

> 🔍 By default, MongoDB includes the `_id` field unless explicitly excluded.

---

### 2. **Projection (in Queries)**

Control which fields are returned:

```js
db.bank_accounts.find(
  { status: "ACTIVE" },
  { accountNumber: 1, balance: 1, _id: 0 } // include only accountNumber & balance
);
```

- `1` = include
- `0` = exclude

> ✅ Cannot mix include and exclude (except `_id`)

---

### 3. **Dot Notation for Nested Fields**

Allows querying deeply nested objects:

```js
// Find customers in Lalitpur district
db.customers.find({ "address.district": "Lalitpur" });
```

Works for both objects and embedded documents (like your `Address` and `Geolocation`).

---

### 4. **Array Queries**

#### i. `$in` — Matches if the field equals _any value_ in the list.

```js
db.bank_accounts.find({ accountType: { $in: ["SAVINGS", "CURRENT"] } });
```

#### ii. `$elemMatch` — Matches _at least one_ array element matching multiple conditions.

Used when an array element needs to satisfy **multiple** conditions.

```js
db.products.find({
  reviews: { $elemMatch: { rating: 5, reviewer: "Ignius" } },
});
```

#### iii. Positional Operator `$`

Returns only the first matching element in an array.

```js
db.orders.find(
  { "items.product": "CPU" },
  { "items.$": 1 } // returns only the first matching array element
);
```

#### iv. `$[<identifier>]` — Used in **updates**, with arrayFilters.

---

### 5. **Logical Operators**

| Operator | Description                         |
| -------- | ----------------------------------- |
| `$and`   | All conditions must be true         |
| `$or`    | At least one condition must be true |
| `$not`   | Negates a condition                 |
| `$nor`   | All conditions must be false        |

```js
db.bank_accounts.find({
  $and: [{ balance: { $gt: 1000 } }, { currency: "EUR" }],
});
```

```js
db.customers.find({
  $or: [{ gender: "Male" }, { "address.state": "Bavaria" }],
});
```

---

### 6. **Comparison Operators**

| Operator      | Meaning                 |
| ------------- | ----------------------- |
| `$eq`         | Equals                  |
| `$ne`         | Not equals              |
| `$gt`, `$gte` | Greater than (or equal) |
| `$lt`, `$lte` | Less than (or equal)    |

```js
db.transactions.find({
  amount: { $gte: 100, $lte: 500 },
});
```

```js
db.customers.find({
  date_of_birth: { $lt: "1990-01-01" }, // assuming ISO-8601 format
});
```

---
