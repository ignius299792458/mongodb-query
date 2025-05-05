/*
Great! Here's a scenario for you:

---

### 🧠 **Scenario: Blog Platform**

You’re designing a MongoDB schema for a blog platform. The platform has:

* **Users** who can write multiple **Posts**
* Each **Post** has:

  * A `title`, `body`, `tags`, `createdAt`
  * A list of embedded **comments**
* Each **Comment** contains a `commenterName`, `text`, and `timestamp`

---

### 📝 Your Task:

1. **Design the MongoDB schema** for the `posts` collection using **embedding** for comments.
2. **Write a MongoDB query** to:

   * Find all posts tagged with `"mongodb"` and
   * Sort them by `createdAt` in descending order.

---
 */