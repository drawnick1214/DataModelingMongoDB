// ===================================
// CREATE INDEXES - Sistema de Tickets
//
// TIPO DE ARCHIVO: MongoDB Shell Script (mongosh)
//
// CÓMO EJECUTAR:
//   mongosh < mongodb/02-create-indexes.js
//   O desde mongosh: load('mongodb/02-create-indexes.js')
//
// DESCRIPCIÓN:
//   Crea todos los índices necesarios para optimizar las consultas
// ===================================

// Seleccionar la base de datos
use capta_tickets_db

print("===========================================")
print("CREACIÓN DE ÍNDICES - Sistema de Tickets")
print("===========================================\n")

// ===================================
// ÍNDICES PARA classifiers
// ===================================

db.classifiers.createIndex(
  { "root_id": 1, "parent_id": 1 },
  { name: "idx_root_parent", background: true }
)
print("Índice creado: idx_root_parent")

db.classifiers.createIndex(
  { "path": 1 },
  { name: "idx_path", background: true }
)
print("Índice creado: idx_path\n")

// ===================================
// ÍNDICES PARA tickets
// ===================================

db.tickets.createIndex(
  { "ticket_number": 1 },
  { unique: true, name: "idx_ticket_number_unique", background: true }
)
print("Índice creado: idx_ticket_number_unique (UNIQUE)")

db.tickets.createIndex(
  { "current_state": 1 },
  { name: "idx_current_state", background: true }
)
print("Índice creado: idx_current_state")

db.tickets.createIndex(
  { "created_at": 1, "closed_at": 1 },
  { name: "idx_dates", background: true }
)
print("Índice creado: idx_dates")

db.tickets.createIndex(
  { "current_classification.path": 1 },
  { name: "idx_classification_path", background: true }
)
print("Índice creado: idx_classification_path")

db.tickets.createIndex(
  { "current_classification.node_id": 1 },
  { name: "idx_classification_node", background: true }
)
print("Índice creado: idx_classification_node")

db.tickets.createIndex(
  {
    "current_state": 1,
    "current_classification.path": 1,
    "created_at": 1,
    "closed_at": 1
  },
  { name: "idx_composite_main_query", background: true }
)
print("Índice creado: idx_composite_main_query (COMPUESTO)\n")

// ===================================
// ÍNDICES PARA ticket_history
// ===================================

db.ticket_history.createIndex(
  { "ticket_id": 1, "timestamp": 1 },
  { name: "idx_ticket_timestamp", background: true }
)
print("Índice creado: idx_ticket_timestamp")

db.ticket_history.createIndex(
  { "action_type": 1, "timestamp": 1 },
  { name: "idx_action_timestamp", background: true }
)
print("Índice creado: idx_action_timestamp")

db.ticket_history.createIndex(
  { "timestamp": 1 },
  { name: "idx_timestamp", background: true }
)
print("Índice creado: idx_timestamp\n")