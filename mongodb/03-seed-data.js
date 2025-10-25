// ===================================
// SEED DATA - Sistema de Tickets
//
// TIPO DE ARCHIVO: MongoDB Shell Script (mongosh)
//
// CÓMO EJECUTAR:
//   mongosh < mongodb/03-seed-data.js
//   O desde mongosh: load('mongodb/03-seed-data.js')
//
// DESCRIPCIÓN:
//   Carga datos de ejemplo para pruebas (100 tickets)
// ===================================

// Seleccionar la base de datos
use capta_tickets_db

print("===========================================")
print("CARGA DE DATOS DE EJEMPLO")
print("===========================================\n")

// ===================================
// 1. CLASIFICADORES
// ===================================
const classifiers = [
  // Raíz
  {
    _id: "servicios",
    name: "Servicios",
    root_id: "servicios",
    parent_id: null,
    path: ["servicios"],
    level: 0,
    is_leaf: false
  },
  
  // Nivel 1
  {
    _id: "area_mantenimiento",
    name: "Área de Mantenimiento",
    root_id: "servicios",
    parent_id: "servicios",
    path: ["servicios", "area_mantenimiento"],
    level: 1,
    is_leaf: false
  },
  {
    _id: "area_limpieza",
    name: "Área de Limpieza",
    root_id: "servicios",
    parent_id: "servicios",
    path: ["servicios", "area_limpieza"],
    level: 1,
    is_leaf: false
  },
  {
    _id: "area_seguridad",
    name: "Área de Seguridad",
    root_id: "servicios",
    parent_id: "servicios",
    path: ["servicios", "area_seguridad"],
    level: 1,
    is_leaf: false
  },
  
  // Nivel 2 (hijos de mantenimiento)
  {
    _id: "mantenimiento_zonas_comunes",
    name: "Zonas Comunes",
    root_id: "servicios",
    parent_id: "area_mantenimiento",
    path: ["servicios", "area_mantenimiento", "mantenimiento_zonas_comunes"],
    level: 2,
    is_leaf: true
  },
  {
    _id: "mantenimiento_edificios",
    name: "Edificios",
    root_id: "servicios",
    parent_id: "area_mantenimiento",
    path: ["servicios", "area_mantenimiento", "mantenimiento_edificios"],
    level: 2,
    is_leaf: true
  },
  {
    _id: "mantenimiento_ascensores",
    name: "Ascensores",
    root_id: "servicios",
    parent_id: "area_mantenimiento",
    path: ["servicios", "area_mantenimiento", "mantenimiento_ascensores"],
    level: 2,
    is_leaf: true
  },
  
  // Nivel 2 (hijos de limpieza)
  {
    _id: "limpieza_areas_comunes",
    name: "Áreas Comunes",
    root_id: "servicios",
    parent_id: "area_limpieza",
    path: ["servicios", "area_limpieza", "limpieza_areas_comunes"],
    level: 2,
    is_leaf: true
  }
]

db.classifiers.insertMany(classifiers)
print(`${classifiers.length} clasificadores insertados\n`)

// ===================================
// 2. TICKETS
// ===================================

const tickets = []
const ticketHistory = []
const states = ["open", "in_progress", "closed"]
const classifications = [
  { node_id: "mantenimiento_zonas_comunes", root_id: "servicios", path: ["servicios", "area_mantenimiento", "mantenimiento_zonas_comunes"] },
  { node_id: "mantenimiento_edificios", root_id: "servicios", path: ["servicios", "area_mantenimiento", "mantenimiento_edificios"] },
  { node_id: "mantenimiento_ascensores", root_id: "servicios", path: ["servicios", "area_mantenimiento", "mantenimiento_ascensores"] },
  { node_id: "limpieza_areas_comunes", root_id: "servicios", path: ["servicios", "area_limpieza", "limpieza_areas_comunes"] }
]

// Generar 100 tickets
for (let i = 1; i <= 100; i++) {
  const ticketId = new ObjectId()
  const classification = classifications[Math.floor(Math.random() * classifications.length)]
  const createdDate = new Date("2025-01-01")
  createdDate.setDate(createdDate.getDate() + Math.floor(Math.random() * 45)) // Entre enero y febrero
  
  // 70% de tickets cerrados, 20% en progreso, 10% abiertos
  let currentState
  let closedAt = null
  const rand = Math.random()
  
  if (rand < 0.7) {
    currentState = "closed"
    closedAt = new Date(createdDate)
    closedAt.setHours(closedAt.getHours() + Math.floor(Math.random() * 72) + 1) // Cerrado 1-72 horas después
  } else if (rand < 0.9) {
    currentState = "in_progress"
  } else {
    currentState = "open"
  }
  
  const ticket = {
    _id: ticketId,
    ticket_number: `TKT-2025-${String(i).padStart(4, '0')}`,
    current_state: currentState,
    current_classification: classification,
    created_at: createdDate,
    closed_at: closedAt,
    updated_at: closedAt || createdDate,
    assigned_to: `user_${Math.floor(Math.random() * 10) + 1}`,
    metadata: {
      priority: ["high", "medium", "low"][Math.floor(Math.random() * 3)],
      customer_id: `cust_${Math.floor(Math.random() * 50) + 1}`
    }
  }
  
  tickets.push(ticket)
  
  // Crear acción de creación
  ticketHistory.push({
    ticket_id: ticketId,
    action_type: "ticket_created",
    timestamp: createdDate,
    performed_by: ticket.assigned_to,
    changes: {
      initial_state: "open",
      initial_classification: classification.node_id
    }
  })
  
  // Si está en progreso o cerrado, agregar cambio de estado
  if (currentState !== "open") {
    const stateChangeDate = new Date(createdDate)
    stateChangeDate.setHours(stateChangeDate.getHours() + Math.floor(Math.random() * 24))
    
    ticketHistory.push({
      ticket_id: ticketId,
      action_type: "state_change",
      timestamp: stateChangeDate,
      performed_by: ticket.assigned_to,
      changes: {
        field: "state",
        old_value: "open",
        new_value: "in_progress"
      }
    })
  }
  
  // Si está cerrado, agregar acción de cierre
  if (currentState === "closed" && closedAt) {
    ticketHistory.push({
      ticket_id: ticketId,
      action_type: "state_change",
      timestamp: closedAt,
      performed_by: ticket.assigned_to,
      changes: {
        field: "state",
        old_value: "in_progress",
        new_value: "closed"
      }
    })
  }
  
  // Agregar algunos comentarios aleatorios
  const numComments = Math.floor(Math.random() * 3) // 0-2 comentarios
  for (let c = 0; c < numComments; c++) {
    const commentDate = new Date(createdDate)
    commentDate.setHours(commentDate.getHours() + Math.floor(Math.random() * 48))
    
    ticketHistory.push({
      ticket_id: ticketId,
      action_type: "comment",
      timestamp: commentDate,
      performed_by: `user_${Math.floor(Math.random() * 10) + 1}`,
      changes: {
        content: `Comentario de prueba ${c + 1} para el ticket ${ticket.ticket_number}`
      }
    })
  }
}

db.tickets.insertMany(tickets)
print(`${tickets.length} tickets insertados\n`)

// ===================================
// 3. AGREGAR ALGUNAS REAPERTURAS
// ===================================

let reopeningCount = 0

// Seleccionar 10 tickets cerrados para reabrirlos
const closedTickets = tickets.filter(t => t.current_state === "closed").slice(0, 10)

for (const ticket of closedTickets) {
  // Cambiar estado a abierto
  db.tickets.updateOne(
    { _id: ticket._id },
    { 
      $set: { 
        current_state: "open",
        closed_at: null,
        updated_at: new Date()
      }
    }
  )
  
  // Agregar acción de reapertura
  const reopenDate = new Date(ticket.closed_at)
  reopenDate.setDate(reopenDate.getDate() + Math.floor(Math.random() * 5) + 1)
  
  ticketHistory.push({
    ticket_id: ticket._id,
    action_type: "state_change",
    timestamp: reopenDate,
    performed_by: ticket.assigned_to,
    changes: {
      field: "state",
      old_value: "closed",
      new_value: "open"
    }
  })
  
  reopeningCount++
}

print(`${reopeningCount} tickets reabiertos\n`)

// ===================================
// 4. HISTÓRICO
// ===================================

db.ticket_history.insertMany(ticketHistory)
print(`${ticketHistory.length} acciones insertadas en el histórico\n`)
