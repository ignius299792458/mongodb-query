# **MongoDB text indexes Side Effects and Trade offs**

are powerful, they do come with **trade-offs and side effects** — especially in large-scale systems

### ✅ Pros (Why Use It)

| Benefit                      | Explanation                                             |
| ---------------------------- | ------------------------------------------------------- |
| **Fast full-text search**    | Enables fast searches across one or more string fields. |
| **Natural language support** | Supports stemming, stop words, and tokenization.        |
| **Relevance scoring**        | Automatically scores and ranks results using `$meta`.   |

---

### ❌ Side Effects / Drawbacks

#### 1. **Storage Overhead**

- **Text indexes can consume significant disk space**, especially on large collections with long or numerous string fields.
- Each indexed word (token) increases index size.
- If your `iban`, `swiftBic`, `country`, etc., have verbose content, the index may grow rapidly.

#### 2. **Only One Text Index per Collection**

- MongoDB allows **only one text index per collection**.

  > Even compound text indexes count as one.

- If you need to search different sets of fields in different ways, you're limited.

#### 3. **No Control Over Tokenization**

- MongoDB uses its built-in **language-based tokenizer and stemming**.

  - Words like `"running"` and `"run"` are treated the same.

- You can’t fine-tune stemming or stop word behavior.

#### 4. **Cannot Combine with Other Indexes in Some Queries**

- **Text index cannot be combined with other regular indexes** in some queries.

  - For example, a compound query like:

    ```js
    { $text: { $search: "Europe" }, status: "ACTIVE" }
    ```

    may **not** be fully covered by an index unless `status` is part of the same compound index, which is **not allowed** for text indexes.

#### 5. **Non-deterministic Relevance**

- `$meta: "textScore"` is useful but not always intuitive.
- It’s difficult to guarantee consistent ranking for complex queries — it’s based on an internal scoring system.

#### 6. **Performance Cost on Writes**

- Every insert/update operation that changes a field in the text index **triggers index maintenance**.
- **Write-heavy systems may suffer** performance degradation due to text index overhead.

#### 7. **Case Sensitivity and Diacritics**

- Text indexes are **case-insensitive** by default.
- Diacritics (accents like é, ü) are ignored unless specifically configured.

  - Could lead to **false positives** or **missed results**.

---

## 🛡️ When _Not_ to Use Text Indexes

Avoid them if:

- Your fields are mostly numeric or structured (e.g., account numbers, codes).
- You require multilingual or customizable NLP behavior (MongoDB is limited).
- You need to combine full-text and field filters with complex performance expectations.

---

## ✅ Best Practices to Handle Side Effects

| Practice                                                    | Why It Helps                                      |
| ----------------------------------------------------------- | ------------------------------------------------- |
| **Use compound field text indexes selectively**             | Keep the index tight and meaningful.              |
| **Index only high-value searchable fields**                 | Avoid unnecessary bloat.                          |
| **Test performance with `.explain()`**                      | Understand the execution plan and storage impact. |
| **Avoid using `$text` for exact lookups**                   | Use `$eq` and regular indexes for that.           |
| **Use `language: "none"` if you want exact token matching** | Prevent stemming and stop word removal.           |

---
