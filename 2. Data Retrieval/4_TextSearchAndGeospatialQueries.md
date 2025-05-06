# **MongoDB Text Search** and **Geospatial Queries**

— both are advanced and extremely powerful features that extend MongoDB's querying capabilities

---

## 📘 1. Full-Text Search in MongoDB (with `$text`, `$search`, and text indexes)

### 🧠 Concept Overview:

MongoDB supports **full-text search** on string content via **text indexes** and the `$text` operator. This enables searching for words or phrases in string fields (like names, descriptions, etc.).

---

### ✅ Step-by-Step Breakdown

#### **1.1 Creating a Text Index**

MongoDB requires a `text index` on a field before using `$text`.

```js
db.bank_accounts.createIndex({
  iban: "text",
  swift_bic: "text",
  country: "text",
});
```

You can also define a **compound text index** across multiple fields.

#### **1.2 Using `$text` and `$search`**

```js
db.bank_accounts.find({
  $text: {
    $search: "Germany",
  },
});
```

This searches all fields in the text index for the term `"Germany"`.

#### **1.3 Phrase Search**

Wrap a phrase in quotes to match the exact phrase.

```js
{
  $text: {
    $search: '"international transfer"';
  }
}
```

#### **1.4 Exclude Words**

```js
{
  $text: {
    $search: "Germany -IBAN";
  }
}
```

This matches documents with `"Germany"` but _not_ `"IBAN"`.

#### **1.5 Relevance Scoring and Sorting**

```js
db.bank_accounts
  .find({ $text: { $search: "swift" } }, { score: { $meta: "textScore" } })
  .sort({ score: { $meta: "textScore" } });
```

This shows how well each document matched the query.

#### **1.6 Limitations of `$text`**

- Only works on string fields.
- Only one text index per collection.
- Not case-sensitive or diacritic-sensitive (by default).
- Does not support stemming/lemmatization (e.g., "run" ≠ "running").

---

### 🛠 Real Example (Banking System):

```js
db.bank_accounts.find({
  $text: { $search: "Germany Swift" },
});
```

This can find bank accounts related to Germany with SWIFT codes.

---

## 📍 2. Geospatial Queries in MongoDB

### 🧠 Concept Overview:

MongoDB provides **2D** and **2dsphere** indexes to support **geospatial data** like coordinates, shapes, and distances. You can query documents based on:

- Proximity (`$near`)
- Containment (`$geoWithin`)
- Intersection (`$geoIntersects`)

---

### ✅ Step-by-Step Breakdown

#### **2.1 Model a Location Field**

Assume this structure from your `Customer.Address.Geolocation`:

```json
"geolocation": {
  "type": "Point",
  "coordinates": [77.5946, 12.9716]  // [longitude, latitude]
}
```

#### **2.2 Create a 2dsphere Index**

```js
db.customers.createIndex({ "address.geolocation": "2dsphere" });
```

#### **2.3 `$near` — Find Closest Customers**

```js
db.customers.find({
  "address.geolocation": {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [77.5946, 12.9716], // Center point
      },
      $maxDistance: 5000, // meters
      $minDistance: 1000,
    },
  },
});
```

#### **2.4 `$geoWithin` — Find in a Region**

```js
db.customers.find({
  "address.geolocation": {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.0, 12.0],
            [78.0, 12.0],
            [78.0, 13.0],
            [77.0, 13.0],
            [77.0, 12.0], // must close the polygon
          ],
        ],
      },
    },
  },
});
```

#### **2.5 `$geoIntersects` — Any Overlap**

```js
db.customers.find({
  "address.geolocation": {
    $geoIntersects: {
      $geometry: {
        type: "Point",
        coordinates: [77.5, 12.5],
      },
    },
  },
});
```

---

### 💡 Pro Tips for Geospatial Queries

- Always use **longitude first, latitude second** in coordinates.
- Index must match the type of geometry: use `2dsphere` for Earth-like distances and accurate models.
- `$geoWithin` is great for regional filtering.
- `$near` is efficient for **finding closest branches/customers**, especially with `$maxDistance`.

---

### 🧪 Real Banking Example:

> **Find customers within 10km of your bank HQ**

```js
db.customers.find({
  "address.geolocation": {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [77.5946, 12.9716],
      },
      $maxDistance: 10000,
    },
  },
});
```

---

### 📈 Text Search vs. Geospatial

| Feature        | Text Search (`$text`) | Geospatial (`$geoWithin`, `$near`)     |
| -------------- | --------------------- | -------------------------------------- |
| Works on       | Strings (text data)   | Coordinates / location data            |
| Index Required | `text` index          | `2dsphere` or `2d`                     |
| Use Case       | Keyword search        | Nearby places, area matching           |
| Sorting        | By `textScore`        | By distance (default sort by distance) |
| Performance    | Indexed               | Indexed                                |

---
