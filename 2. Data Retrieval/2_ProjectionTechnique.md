# 🔹 II. Projection Techniques (In-Depth)

Projection in MongoDB means **controlling what fields to return**, reshape, or compute in the output. It can be used in:

- `find()` (simple projections)
- Aggregation (`$project` stage — advanced projections)

---

## ✅ 1. **Include / Exclude Fields** in `find()`

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

## ✅ 2. **Computed Fields with `$project` (in Aggregation)**

```js
//  customer whole document
{
  _id: 'a3cc36d6-96b4-4d01-a33b-3d3b8c54424a',
  full_name: 'Customer 7',
  phone_number: '1000000007',
  email_address: 'customer7@example.com',
  address: {
    country: 'USA',
    state: 'California',
    district: 'District 7',
    street: '123 Main St Apt 7',
    geolocation: {
      latitude: -4.148627431581005,
      longitude: -165.28397707755968
    }
  },
  date_of_birth: '1980-01-08',
  gender: 'Female',
  created_at: '2025-05-05T04:55:26.375989Z',
  schemaVersion: 1,
  _class: 'io.ignius.banking_mongodb.model.Customer'
}

```

it can be reshaped to

```js
// Query
db.customers.find({gender: "Female"}, { name: "$full_name", address: {geolocation:1}, dob:"$date_of_birth", _id:0}).limit(1);

// Result
{
  address: {
    geolocation: {
      latitude: -4.148627431581005,
      longitude: -165.28397707755968
    }
  },
  name: 'Customer 7',
  dob: '1980-01-08'
}
```

2. The `$project` stage can:

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

## 🛠 Key Projection Operators (inside `$project`)

| Operator                                            | Description            |
| --------------------------------------------------- | ---------------------- |
| `$add`, `$subtract`, `$multiply`, `$divide`, `$mod` | Arithmetic             |
| `$concat`, `$toUpper`, `$substr`                    | String manipulation    |
| `$gt`, `$lt`, `$eq`, `$and`, `$or`                  | Logical                |
| `$type`, `$ifNull`, `$cond`                         | Conditional / fallback |
| `$dateToString`                                     | Date formatting        |

---

```js
db.customers.aggregate([
  {
    $project: {
      _id: 0,
      full_address: {
        $concat: [
          "$address.country",
          ", ",
          "$address.state",
          ", ",
          "$address.district",
          ", ",
          "$address.street",
        ],
      },
    },
  },
  {
    $limit: 2,
  },
]);

// Result
[{
  full_address: "USA, California, District 3, 223 Wood St Apt 1";
}
{
  full_address: 'USA, California, District 7, 123 Main St Apt 7'
}]
```

```js
db.transaction.aggregate([
  {
    $project: {
      totalAmount: { $add: ["$credit", "$debit"] },
      increasedAmount: { $add: ["$debit", 50] },
    },
  },
]);
```

## ✅ 3. **Conditional Fields with `$cond`**

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

## ✅ 4. **Flatten Embedded Fields**

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

## ✅ 5. **Suppress a Field from Nested Object**

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

Example:

```js
// query
db.customers.aggregate([
  {
    $project: {
      customerDetail: {
        name: "$full_name",
        dob: "$date_of_birth",
        gender: "$gender",
        exact_location: {
          $add: [
            "$address.geolocation.latitude",
            "$address.geolocation.longitude",
          ],
        },
        contact: { $concat: ["$phone_number", ", ", "$email_address"] },
      },
    },
  },
  {
    $limit: 3,
  },
]);

// Result
{
  _id: 'a3cc36d6-96b4-4d01-a33b-3d3b8c54424a',
  customerDetail: {
    name: 'Customer 7',
    dob: '1980-01-08',
    gender: 'Female',
    exact_location: -169.43260450914067,
    contact: '1000000007, customer7@example.com'
  }
}
{
  _id: '09739323-42b2-4366-8363-641edfbbb6a0',
  customerDetail: {
    name: 'Customer 1',
    dob: '1980-01-02',
    gender: 'Female',
    exact_location: 47.61055574281821,
    contact: '1000000001, customer1@example.com'
  }
}
{
  _id: '608cef73-78b7-4f88-b86a-63f1639a2c8d',
  customerDetail: {
    name: 'Customer 18',
    dob: '1980-01-19',
    gender: 'Male',
    exact_location: 48.591316453202424,
    contact: '1000000018, customer18@example.com'
  }
}
```

---
