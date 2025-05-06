Here are 20 **advanced and challenging MongoDB aggregation pipeline query questions**, based on your banking models (`BankAccount`, `Customer`, and `Transaction`). Each one tests deep understanding of MongoDB aggregation features like `$lookup`, `$group`, `$facet`, `$unwind`, `$map`, `$mergeObjects`, and more. Sample outputs are provided where possible.

> These all will be performed in following sample of documents models:

```js

// Customers
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

// BankAcount

{
  _id: '691e5e31-d3da-43d1-817d-4fd0e472741f',
  account_number: '0430918371',
  account_holder: 'DBRef('customers', '634b6f40-f789-4098-9541-17690ba0cf4b')',
  account_type: 'BUSINESS_ACCOUNT',
  balance: '31217.103998726732',
  status: 'ACTIVE',
  currency: 'USD',
  iban: 'US28b26f9881a9464f87b84b',
  swift_bic: 'BOFAUS3N',
  country: 'US',
  opened_date: 2025-05-05T04:55:26.436Z,
  updated_at: 2025-05-05T04:55:26.436Z,
  created_by: 'seed-script',
  schemaVersion: 1,
  _class: 'io.ignius.banking_mongodb.model.BankAccount'
}

// Transactions

{
  _id: '6a9da25c-6bdc-446b-a049-5681ab74c243',
  transaction_type: 'DEPOSIT',
  amount: '645.04',
  date: 2025-04-26T18:16:18.484Z,
  status: 'PENDING',
  description: 'Auto-generated transaction',
  account_id: 'a4aaf325-3359-4438-b1d2-1e38161d0690',
  initiated_by: 'seed-script',
  schemaVersion: 1,
  _class: 'io.ignius.banking_mongodb.model.Transaction'
}
```

---

## 1. **Total Transactions & Amount per Account**

**Query:** Get total transaction count and total amount for each `accountNumber`.

✅ **Output:**

```json
{ "accountNumber": "1234567890", "totalAmount": 1500.0, "transactionCount": 5 }
```

**Solution**

```js
// Query
db.transactions.aggregate([
  { $addFields: { txtAmt: { $toDouble: "$amount" } } }, // since amount is saved as string
  {
    $group: {
      _id: "$account_id",
      totalTxtAmt: { $sum: "$txtAmt" },
      totalTxtCount: { $count: {} },
    },
  },
  {
    $project: {
      accountNumber: "$_id",
      _id: 0,
      totalAmount: "$totalTxtAmt",
      transactionCount: "$totalTxtCount",
    },
  },
]);

// Result:
{
  accountNumber: '23570891-3ad9-46f0-bb37-c9244d11ab58',
  totalAmount: 1163.02,
  transactionCount: 4
}
{
  accountNumber: 'daf0c908-2e09-4149-8cb0-e412c7210cf8',
  totalAmount: 5202.06,
  transactionCount: 10
}
{
  accountNumber: '40f8a76f-1c85-4423-9b2c-a2385a1665ae',
  totalAmount: 18657.57,
  transactionCount: 1
}
{
  accountNumber: '3ceab36a-2702-4541-b295-ae4e98614cfc',
  totalAmount: 3306.75,
  transactionCount: 254
}
// ..... so on
```

---

## 2. **Average Transaction Amount by Status**

**Query:** Calculate the average transaction amount for each `TransactionStatus`.

**✅ Output:**

```json
{ "status": "COMPLETED", "averageAmount": 320.75 }
```

**Solution**

```js
// Query
db.transactions.aggregate([
  { $addFields: { txtAmt: { $toDouble: "$amount" } } },
  { $group: { _id: "$status", txtAvgAmt: { $avg: "$txtAmt" } } },
  { $project: { _id: 0, status: "$_id", averageAmount: "$txtAvgAmt" } },
]);

// Result
{
  status: 'COMPLETED',
  averageAmount: 5736.6436352711435
}
{
  status: 'PENDING',
  averageAmount: 5902.204123514743
}
{
  status: 'FAILED',
  averageAmount: 5996.47621577381
}
```

---

## 3. **Top 5 Customers with Highest Balances**

Join `BankAccount` with `Customer`, sort by balance.

**✅ Output:**

```json
{ "fullName": "Alice", "balance": 5000.0 }
```

**Solution**

```js
// Query
db.bank_accounts.aggregate([
  { $addFields: { balance: { $toDouble: "$balance" } } },
  { $sort: { balance: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "customers",
      localField: "account_holder.$id",
      foreignField: "_id",
      as: "customers_detail",
    },
  },
  { $unwind: "$customers_detail" },
  {
    $project: { full_name: "$customers_detail.full_name", balance: 1, _id: 0 },
  },
]);

// Result
{
balance: 49998.41728280914,
full_name: 'Customer 12768'
}
{
balance: 49995.68968059799,
full_name: 'Customer 6117'
}
{
balance: 49993.728768821835,
full_name: 'Customer 17133'
}
{
balance: 49991.47526634227,
full_name: 'Customer 1990'
}
{
  balance: 49990.78446136627,
  full_name: 'Customer 9782'
}
```

---

## 4. **Accounts with More Than 10 Transactions**

Group by `accountId` in `transactions` and filter.

**✅ Output:**

```json
{ "accountId": "abc123", "transactionCount": 12 }
```

**Solution**

```js
// query
db.transactions.aggregate([
  { $group: { _id: "$account_id", txtCount: { $count: {} } } },
  { $match: { txtCount: { $gt: 10 } } },
  { $project: { _id: 0, accountId: "$_id", transactionCount: "$txtCount" } },
]);

// Result
{
  accountId: '32fa1045-f4e9-412b-9ce5-2f16be7f6412',
  transactionCount: 12
}
{
  accountId: '147452d9-6112-4422-b4ad-a182b9b85c1a',
  transactionCount: 24
}
{
  accountId: 'b8da1783-9e15-4d1b-bc10-05e70fc13aa3',
  transactionCount: 13
}
{
  accountId: 'e88a8095-6380-4d94-8b20-325cce1e5896',
  transactionCount: 14
}
{
  accountId: '9b0ccbe3-6c1f-403b-a323-31d8ee2deae7',
  transactionCount: 1
}
```

---

## 5. **Daily Aggregation of Transactions for Last 7 Days**

Bucket by `date` to get daily total.

✅ Output:

```json
{ "date": "2025-05-05", "totalAmount": 200.0 }
```

---

## 6. **Inactive Accounts (No Transactions in 30 Days)**

Find accounts with no matching transaction in the last 30 days.

✅ Output:

```json
{ "accountNumber": "9876543210" }
```

---

## 7. **Find Accounts with Failed Transactions Over \$1000**

Join transactions, filter on status and amount.

✅ Output:

```json
{ "accountNumber": "2345678901", "failedAmount": 1200.0 }
```

---

## 8. **Geo Lookup: Transactions from Customers in Specific Region**

Use embedded geolocation in `Customer.address`.

✅ Output:

```json
{ "customer": "Bob", "region": "California", "totalAmount": 300.0 }
```

---

## 9. **Currency-wise Total Balance**

Group all `BankAccount`s by `currency`.

✅ Output:

```json
{ "currency": "USD", "totalBalance": 9800.0 }
```

---

## 10. **Top Transaction Initiators**

Group `initiatedBy` with counts.

✅ Output:

```json
{ "initiatedBy": "user123", "transactionCount": 45 }
```

---

## 11. **Accounts with Mismatched Currency in Transaction**

Compare account and transaction currency (requires denormalization).

✅ Output:

```json
{ "accountNumber": "1234567890", "currencyMismatch": true }
```

---

## 12. **Average Number of Transactions Per Account Type**

Join `BankAccount` and `Transaction`, group by `accountType`.

✅ Output:

```json
{ "accountType": "SAVINGS", "avgTransactions": 8.6 }
```

---

## 13. **Last Transaction Details per Account**

Sort and `$group` by accountId with `$first`.

✅ Output:

```json
{
  "accountNumber": "555666777",
  "lastTransaction": {
    "amount": 200.0,
    "date": "2025-05-05",
    "status": "COMPLETED"
  }
}
```

---

## 14. **Customer Age Analysis (if DOB is structured)**

Assuming DOB is parseable.

✅ Output:

```json
{ "ageRange": "30-40", "count": 120 }
```

---

## 15. **Distribution of Transaction Types per Customer**

Group and pivot transaction types per customer.

✅ Output:

```json
{ "customer": "Alice", "DEPOSIT": 4, "WITHDRAWAL": 2 }
```

---

## 16. **Customers with Duplicate Emails or Phone Numbers**

Use `$group` and `$match` on count > 1.

✅ Output:

```json
{ "emailAddress": "duplicate@example.com", "count": 2 }
```

---

## 17. **Accounts Opened But Never Used (No Transactions)**

Left join `transactions` and find where array is empty.

✅ Output:

```json
{ "accountNumber": "7788990011", "openedDate": "2025-04-01" }
```

---

## 18. **Monthly Transaction Volume & Amount Trend**

Bucket by month using `$dateTrunc`.

✅ Output:

```json
{ "month": "2025-04", "totalAmount": 7800.0, "transactionCount": 50 }
```

---

## 19. **Percent of Failed Transactions per Account**

Group by account, calculate ratio of `FAILED` to total.

✅ Output:

```json
{ "accountNumber": "1111222233", "failedRatio": 0.15 }
```

---

## 20. **Compare Balance to Total Transaction Amount**

Join `transactions`, group sum per account, compare with balance.

✅ Output:

```json
{
  "accountNumber": "1122334455",
  "balance": 1000.0,
  "totalTransacted": 1200.0,
  "mismatch": true
}
```

---

Would you like me to implement any of these as actual MongoDB aggregation pipelines or Spring Boot code examples?
