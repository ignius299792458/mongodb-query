# 🔢 Types of Indexes in Databases

## 1. Primary Index

### 🔍 Definition:

An index built on a table's primary key. It enforces uniqueness and allows fast access to records based on that key.

### 📚 Characteristics:

- One per table.
- Always unique.
- Entries are sorted based on the primary key field.
- Usually automatically created by the database.

### ⚙️ In MongoDB:

- The \_id field is the default primary key, and MongoDB automatically creates a unique index on it.
- Cannot be removed unless explicitly disabled (rare).

### 🧠 Analogy:

Library index sorted by ISBN numbers – each is unique and can locate a book directly.

---

## 2. Secondary Index

### 🔍 Definition:

An index built on fields other than the primary key, often used for search optimization or filtering.

### 📚 Characteristics:

- Can be multiple per table/collection.
- Can be unique or non-unique.
- Don't determine physical order of records.

### ⚙️ In MongoDB:

- You can create secondary indexes on any field(s) using:

  ```js
  db.collection.createIndex({ fieldName: 1 }); // ascending
  ```

### 🔄 Use Case:

Finding users by email, age, or status even though \_id is the primary key.

---

## 3. Clustered Index

### 🔍 Definition:

The index that determines the physical order of data in storage. There can only be one per table.

### 📚 Characteristics:

- The data rows are physically stored in the order of the clustered index.
- Faster access for range queries.

### ⚠️ MongoDB Context:

MongoDB does NOT support clustered indexes by default (like MySQL or SQL Server). However, as of v5.3+, clustered collections can be defined manually, mainly for time-series or archival use cases.

### 🧠 Analogy:

Imagine all books on a shelf are arranged in increasing order of ISBN numbers — the position of the book itself reflects the index.

---

## 4. Non-Clustered Index

### 🔍 Definition:

An index structure separate from the data. It maintains pointers (RecordIds) to the actual data rows.

### 📚 Characteristics:

- Most common in MongoDB.
- Doesn’t affect how data is stored physically.
- Can have many non-clustered indexes per table.

### ⚙️ MongoDB:

All indexes in MongoDB are non-clustered by default (except experimental clustered collections).

---

## 5. Composite (Compound) Index

### 🔍 Definition:

An index that includes more than one field, used for queries involving multiple conditions.

### 📚 Characteristics:

- Fields are stored in the order defined.
- Query optimizer must match leading fields for optimal use.

### ⚠️ MongoDB Caveat:

The order of fields in a compound index matters!

```js
db.users.createIndex({ name: 1, age: -1 });
```

Can support:

- `{ name: "John" }`
- `{ name: "John", age: 30 }`
  But not efficiently:
- `{ age: 30 }` alone

---

## 6. Unique Index

### 🔍 Definition:

Ensures that all values in the indexed field are unique.

### 📚 Characteristics:

- Enforces data integrity.
- Raises error on duplicate insert/update.

### ⚙️ MongoDB:

```js
db.users.createIndex({ email: 1 }, { unique: true });
```

---

## 7. Multikey Index

### 🔍 Definition:

Used to index fields that store arrays. Each element of the array is indexed individually.

### 📚 Characteristics:

- Automatically created when you index an array field.
- Supports efficient match of any element in the array.

### ⚠️ Edge Cases:

- MongoDB can only use one multikey index per query.
- Cannot create compound multikey indexes if both fields are arrays.

---

## 8. Text Index

### 🔍 Definition:

Used for full-text search across string fields. Enables operations like word stemming, ignoring stop words, etc.

### 📚 Characteristics:

- Supports \$text queries.
- Can index multiple fields using one index.

### ⚙️ MongoDB:

```js
db.articles.createIndex({ title: "text", content: "text" });
```

---

## 9. Geospatial Index

### 🔍 Definition:

Indexes that support location-based queries on coordinates (latitude/longitude, GeoJSON, etc.)

### 📚 Types:

- 2d (legacy)
- 2dsphere (GeoJSON)

### ⚙️ MongoDB:

```js
db.places.createIndex({ location: "2dsphere" });
```

---

## 10. Hashed Index

### 🔍 Definition:

Applies a hash function to the index field to uniformly distribute entries.

### 📚 Characteristics:

- Good for sharded environments where uniform distribution is needed.
- Poor for range queries.

### ⚙️ MongoDB:

```js
db.users.createIndex({ userId: "hashed" });
```

---

## 11. TTL Index (Time-To-Live)

### 🔍 Definition:

An index on a date field that automatically removes expired documents.

### 📚 Characteristics:

- Ideal for session data, logs, tokens
- Deletes documents once the TTL period expires

### ⚙️ MongoDB:

```js
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
```

---

# ✅ Summary Table

| Index Type    | MongoDB Support | Unique?  | Use Case                |
| ------------- | --------------- | -------- | ----------------------- |
| Primary       | ✅ (on \_id)    | ✅       | Fast \_id access        |
| Secondary     | ✅              | Optional | Filtering other fields  |
| Clustered     | ⚠️ Experimental | ✅/❌    | Time-series, archival   |
| Non-clustered | ✅ (default)    | ✅/❌    | All regular indexes     |
| Compound      | ✅              | Optional | Multi-condition queries |
| Unique        | ✅              | ✅       | Prevent duplicates      |
| Multikey      | ✅ (auto)       | ❌       | Arrays                  |
| Text          | ✅              | ❌       | Full-text search        |
| Geospatial    | ✅              | ❌       | Location queries        |
| Hashed        | ✅              | ❌       | Sharding                |
| TTL           | ✅              | ❌       | Auto-delete documents   |

---
