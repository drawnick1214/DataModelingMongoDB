# 🎫 Ticket System - MongoDB

A complete ticket management solution built with MongoDB. Designed to scale to millions of records with optimal performance.

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)
---

## 📋 Description

Ticketing system with support for:
- ✅ Dynamic states (open, in_progress, closed)
- ✅ Multi-level hierarchical classifiers
- ✅ Complete immutable history
- ✅ Combinable filters (dates, state, classifiers)
- ✅ 5 optimized main queries
- ✅ Sub-second performance on millions of records

---

## 🚀 Quick Start

### Prerequisites

- MongoDB 5.0 or higher
- MongoDB Shell (mongosh)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/tu-usuario/capta-tickets-solution.git
cd capta-tickets-solution

# 2. Create collections with validation
mongosh < mongodb/01-create-collections.js

# 3. Create optimized indexes
mongosh < mongodb/02-create-indexes.js

# 4. Load sample data (100 tickets)
mongosh < mongodb/03-seed-data.js

# 5. Test the queries
mongosh < examples/query-examples.js
```

---

## 📁 Project Structure

```
capta-tickets-solution/
│
├── 📄 README.md                     # This file
├── 📁 docs/
│   └── solucion-tecnica.md          # Complete technical documentation
├── 📁 mongodb/
│   ├── 01-create-collections.js     # Creates collections with validation
│   ├── 02-create-indexes.js         # Creates 10 optimized indexes
│   ├── 03-seed-data.js              # Sample data (100 tickets)
│   └── 04-queries.js                # 5 main queries
└── 📁 examples/
    └── query-examples.js            # Usage examples
```

---

## 🗄️ Data Model

### Collections

**1. `classifiers`** - Hierarchical classifier catalog
```javascript
{
  _id: "area_mantenimiento",
  name: "Maintenance Area",
  root_id: "servicios",
  parent_id: "servicios",
  path: ["servicios", "area_mantenimiento"],  // Key for hierarchical searches
  level: 1,
  is_leaf: false
}
```

**2. `tickets`** - Current state of each ticket
```javascript
{
  _id: ObjectId("..."),
  ticket_number: "TKT-2025-0001",
  current_state: "open",
  current_classification: {
    root_id: "servicios",
    node_id: "area_mantenimiento",
    path: ["servicios", "area_mantenimiento"]  // Denormalized for performance
  },
  created_at: ISODate("2025-01-15T10:30:00Z"),
  closed_at: null,
  updated_at: ISODate("2025-01-15T10:30:00Z")
}
```

**3. `ticket_history`** - Immutable action history
```javascript
{
  _id: ObjectId("..."),
  ticket_id: ObjectId("..."),
  action_type: "state_change",  // ticket_created | state_change | classification_change | comment | assignment
  timestamp: ISODate("2025-01-20T14:45:00Z"),
  performed_by: "user_789",
  changes: {
    field: "state",
    old_value: "open",
    new_value: "in_progress"
  }
}
```

---

## 🔍 Main Queries

### 1. Case List
Retrieve tickets with combinable filters.

```javascript
load('mongodb/04-queries.js')

await getTickets({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z"),
  state: "open",
  classifierIds: ["area_mantenimiento"],
  page: 1,
  pageSize: 50
})
```

### 2. Reopening Count
Count of tickets that transitioned from `closed` to `open`.

```javascript
await countReopenings({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z"),
  classifierIds: ["area_mantenimiento"]
})
```

### 3. Intake Count
Tickets created during the period.

```javascript
await countTicketIngresos({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z")
})
```

### 4. Closure Count
Tickets closed during the period.

```javascript
await countTicketCierres({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z")
})
```

### 5. Action List
Action history with filters.

```javascript
await getTicketActions({
  ticketId: ObjectId("..."),
  actionTypes: ["state_change", "comment"],
  startDate: ISODate("2025-01-01T00:00:00Z"),
  page: 1,
  pageSize: 100
})
```

---

## 📊 Indexes

System optimized with 10 strategic indexes:

### Tickets (6 indexes)
- `ticket_number` (unique) - Direct lookup
- `current_state` - State filter
- `created_at, closed_at` - Date range
- `current_classification.path` - Hierarchical filter
- `current_classification.node_id` - Specific node
- **Compound (4 fields)** - Optimized main query

### Ticket History (3 indexes)
- `ticket_id, timestamp` - History per ticket
- `action_type, timestamp` - Aggregated metrics
- `timestamp` - Data cleanup

### Classifiers (2 indexes)
- `root_id, parent_id` - Hierarchical navigation
- `path` - Descendant search

**Performance:** < 200ms on 1M tickets with properly configured indexes.

---

## 🎯 Features

### ✅ Implemented Filters

- **Date range:** Tickets open or in progress during `[startDate, endDate)`
- **Case state:** Current or historical (state at end of period)
- **Hierarchical classifiers:** Inclusive descendant search

### ✅ Scalable Design

- Separation of current state vs history
- Controlled denormalization of the hierarchical `path`
- Compound indexes for complex queries
- Support for millions of tickets

### ✅ Complete History

- Full change traceability
- Immutable audit trail
- State reconstruction at any point in time

---

## 🧪 Sample Data

The `03-seed-data.js` script generates:

- **8 classifiers** in a 3-level hierarchy
- **100 tickets** with varied states:
  - ~10 open
  - ~20 in progress
  - ~70 closed
- **300+ actions** in the history
- **10 simulated reopenings**
- Data distributed across January-February 2025

---

## 📖 Documentation

### Complete Technical Document

See [`docs/DocumentoTecnicoModeladoDatosTickets.pdf`](docs/DocumentoTecnicoModeladoDatosTickets.pdf) for:

- ✅ Detailed domain analysis
- ✅ Design decision rationale
- ✅ Index and performance explanation
- ✅ Query implementation
- ✅ Difficulties and limitations
- ✅ Additional value-added queries

### Usage Examples

See [`examples/query-examples.js`](examples/query-examples.js) for practical use cases.

---

## 🛠️ Advanced Usage

### Query data interactively

```bash
# Open MongoDB Shell
mongosh capta_tickets_db

# Load functions
load('mongodb/04-queries.js')

# Run custom queries
await getTickets({
  state: "open",
  page: 1,
  pageSize: 10
})
```

### Verify performance

```javascript
// View execution plan
db.tickets.find({ current_state: "open" }).explain("executionStats")

// Verify that an index is used (look for "IXSCAN" in the output)
// If it says "COLLSCAN", the index is not being used
```

### View statistics

```javascript
// Collection statistics
db.tickets.stats()

// Index usage
db.tickets.aggregate([{ $indexStats: {} }])

// Index sizes
db.tickets.stats().indexSizes
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Nick Diaz**

- LinkedIn: [Nick Diaz](https://www.linkedin.com/in/drawnick991214/)
- GitHub: [@drawnick1214](https://github.com/drawnick1214)
- Email: enickdiazc@gmail.com

---

## 🙏 Acknowledgments

- Thanks for the opportunity to solve this technical challenge

---

## 📚 References

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Schema Design Patterns](https://www.mongodb.com/blog/post/building-with-patterns-a-summary)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)

---
