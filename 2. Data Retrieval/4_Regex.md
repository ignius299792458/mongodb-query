# **Regular Expressions (`$regex`)**,

an extremely powerful tool for pattern matching and text manipulation, especially useful in MongoDB queries.

## What is Regex?

A **Regular Expression (Regex)** is a sequence of characters that defines a search pattern. It can be used for:

- **Searching**: Finding specific patterns in text (like emails, phone numbers).
- **Matching**: Verifying if a string follows a certain pattern.
- **Replacing**: Modifying parts of a string that match a pattern.

In MongoDB, **Regex queries** allow you to search for strings that match specific patterns.

---

## Basic Syntax of Regex

Here are some common regex components:

### 1. **Literal characters**:

- `abc` matches the string `"abc"`.

### 2. **Metacharacters**:

These have special meanings in regex:

- `.`: Matches any single character except newline (`\n`).
- `^`: Anchors the pattern to the **beginning** of the string.
- `$`: Anchors the pattern to the **end** of the string.
- `[]`: Matches any character in the brackets.

  - E.g., `[a-z]` matches any lowercase letter.

- `|`: OR condition. Matches the pattern before or after the `|`.

  - E.g., `cat|dog` matches either `"cat"` or `"dog"`.

### 3. **Quantifiers**:

Define how many times an element should appear:

- `*`: Zero or more occurrences.
- `+`: One or more occurrences.
- `?`: Zero or one occurrence.
- `{n}`: Exactly `n` occurrences.
- `{n,}`: `n` or more occurrences.
- `{n,m}`: Between `n` and `m` occurrences.

### 4. **Character classes**:

Define a set of characters:

- `\d`: Matches any digit (0-9).
- `\w`: Matches any word character (alphanumeric + underscore).
- `\s`: Matches any whitespace character (spaces, tabs, newlines).

### 5. **Grouping & Capturing**:

- `()`: Groups parts of the regex together.

  - E.g., `(abc|def)` matches `"abc"` or `"def"`.

- `(?:...)`: Non-capturing group (does not create a backreference).

### 6. **Escape sequences**:

If you want to match special characters (like `.` or `*`), escape them with a backslash (`\`).

- E.g., `\.` matches a literal period (`.`), not any character.

---

## Using Regex in MongoDB Queries

MongoDB provides `$regex` operator to perform regex-based searches. It works with **strings** and can be used for **case-sensitive** or **case-insensitive** matches.

## MongoDB `$regex` Example Queries

### 1. **Simple Match**

Find documents where the `iban` field matches a specific pattern:

```js
db.bank_accounts.find({
  iban: { $regex: "^US" },
});
```

This will return all `iban` values that **start** with `"US"`.

### 2. **Pattern Matching (Partial Match)**

Find documents where `iban` contains the substring `"123"`:

```js
db.bank_accounts.find({
  iban: { $regex: "123" },
});
```

This will return all documents where the `iban` field contains `"123"` anywhere.

### 3. **Case-Insensitive Search**

By default, `$regex` is **case-sensitive**. To make it case-insensitive, use the `i` option:

```js
db.bank_accounts.find({
  iban: { $regex: "abc", $options: "i" },
});
```

This will return documents where `iban` contains `"abc"` regardless of whether it’s `"abc"`, `"ABC"`, or any other case variation.

### 4. **Matching Specific Patterns Using Quantifiers**

Find `iban` values that contain at least 5 digits after the initial `"US"`:

```js
db.bank_accounts.find({
  iban: { $regex: "^US\\d{5,}$" },
});
```

This will match strings that:

- Start with `"US"`
- Followed by at least 5 digits.

### 5. **Matching Any Character**

Search for any document where `iban` has exactly 10 characters:

```js
db.bank_accounts.find({
  iban: { $regex: "^.{10}$" },
});
```

The `.` matches any character, and `{10}` ensures exactly 10 characters.

---

## Performance Considerations with Regex in MongoDB

### **1. Full Collection Scan**

- Regex queries in MongoDB **don’t use indexes** unless the regex is **anchored** (`^` for the beginning or `$` for the end). Unanchored regex queries require MongoDB to scan the entire collection.

  - Example of inefficient query (no index use):

    ```js
    db.bank_accounts.find({
      iban: { $regex: "123" },
    });
    ```

### **2. Use Anchored Regex for Performance**

- Anchored regex queries can **use indexes**, which is crucial for large collections.

  - Efficient:

    ```js
    db.bank_accounts.find({
      iban: { $regex: "^US", $options: "i" },
    });
    ```

### **3. Compound Indexes with `$regex`**

- You can create compound indexes that can improve the performance of regex queries if they are **anchored**:

  - Example:

    ```js
    db.bank_accounts.createIndex({ iban: 1 });
    ```

### **4. Index Usage**

- **Exact match** queries can use regular indexes, but **regex-based searches** require careful use to benefit from indexes.
- Use **`explain()`** to analyze how MongoDB executes your query.

---

## 📚 Further Learning

If you'd like to dive deeper, here are some advanced regex patterns:

- **Lookaheads** and **lookbehinds** for advanced conditional matching.
- **Non-capturing groups** for performance and cleaner queries.
- Combining **regex** with **`$text`** queries to enhance search functionality.

---
