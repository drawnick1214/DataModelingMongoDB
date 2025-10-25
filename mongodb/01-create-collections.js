
// ===================================
// CREATE COLLECTIONS - Sistema de Tickets
// 
// TIPO DE ARCHIVO: MongoDB Shell Script (mongosh)
//
// CÓMO EJECUTAR:
//   mongosh < mongodb/01-create-collections.js
//   O desde mongosh: load('mongodb/01-create-collections.js')
//
// DESCRIPCIÓN:
//   Crea las colecciones con validación de esquema
// ===================================

// Seleccionar/crear la base de datos
use capta_tickets_db

print("===========================================")
print("CREACIÓN DE COLECCIONES - Sistema de Tickets")
print("===========================================\n")

// ===================================
// ELIMINAR COLECCIONES SI EXISTEN
// ===================================

print("--- Limpiando colecciones existentes ---\n")

try {
  db.classifiers.drop()
  print("Colección 'classifiers' eliminada")
} catch (e) {
  print("  (classifiers no existía)")
}

try {
  db.tickets.drop()
  print("Colección 'tickets' eliminada")
} catch (e) {
  print("  (tickets no existía)")
}

try {
  db.ticket_history.drop()
  print("Colección 'ticket_history' eliminada")
} catch (e) {
  print("  (ticket_history no existía)")
}

print("")

// ===================================
// CREAR COLECCIÓN: classifiers
// ===================================

db.createCollection("classifiers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "name", "root_id", "path", "level"],
      properties: {
        _id: {
          bsonType: "string",
          description: "ID único del clasificador (slug)"
        },
        name: {
          bsonType: "string",
          description: "Nombre descriptivo del clasificador"
        },
        root_id: {
          bsonType: "string",
          description: "ID de la raíz jerárquica"
        },
        parent_id: {
          bsonType: ["string", "null"],
          description: "ID del nodo padre (null si es raíz)"
        },
        path: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "Ruta completa desde la raíz hasta este nodo"
        },
        level: {
          bsonType: "int",
          minimum: 0,
          description: "Nivel de profundidad (0=raíz)"
        },
        is_leaf: {
          bsonType: "bool",
          description: "Indica si el nodo no tiene hijos"
        },
        metadata: {
          bsonType: "object",
          description: "Información adicional opcional"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

print("Colección 'classifiers' creada con validación de esquema\n")


// ===================================
// CREAR COLECCIÓN: tickets
// ===================================

db.createCollection("tickets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["ticket_number", "current_state", "current_classification", "created_at"],
      properties: {
        ticket_number: {
          bsonType: "string",
          pattern: "^TKT-[0-9]{4}-[0-9]{4,}$",
          description: "Número de ticket (formato: TKT-YYYY-NNNN)"
        },
        current_state: {
          enum: ["open", "in_progress", "closed"],
          description: "Estado actual del ticket"
        },
        current_classification: {
          bsonType: "object",
          required: ["root_id", "node_id", "path"],
          properties: {
            root_id: {
              bsonType: "string",
              description: "ID de la raíz jerárquica"
            },
            node_id: {
              bsonType: "string",
              description: "ID del nodo clasificador"
            },
            path: {
              bsonType: "array",
              items: {
                bsonType: "string"
              },
              description: "Ruta completa de clasificación"
            }
          },
          description: "Clasificación actual del ticket"
        },
        created_at: {
          bsonType: "date",
          description: "Fecha de creación del ticket"
        },
        closed_at: {
          bsonType: ["date", "null"],
          description: "Fecha de cierre (null si está abierto)"
        },
        updated_at: {
          bsonType: "date",
          description: "Fecha de última modificación"
        },
        assigned_to: {
          bsonType: ["string", "null"],
          description: "Usuario asignado actualmente"
        },
        metadata: {
          bsonType: "object",
          description: "Campos adicionales (prioridad, cliente, etc.)"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

print("Colección 'tickets' creada con validación de esquema\n")


// ===================================
// CREAR COLECCIÓN: ticket_history
// ===================================

db.createCollection("ticket_history", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["ticket_id", "action_type", "timestamp"],
      properties: {
        ticket_id: {
          bsonType: "objectId",
          description: "ID del ticket al que pertenece esta acción"
        },
        action_type: {
          enum: ["ticket_created", "state_change", "classification_change", "comment", "assignment"],
          description: "Tipo de acción realizada"
        },
        timestamp: {
          bsonType: "date",
          description: "Fecha y hora de la acción"
        },
        performed_by: {
          bsonType: ["string", "null"],
          description: "Usuario que realizó la acción"
        },
        changes: {
          bsonType: "object",
          description: "Detalles del cambio realizado"
        },
        metadata: {
          bsonType: "object",
          description: "Información adicional (IP, user agent, etc.)"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

print("Colección 'ticket_history' creada con validación de esquema\n")


