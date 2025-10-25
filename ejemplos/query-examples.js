// ===================================
// EJEMPLOS DE USO - Sistema de Tickets
// ===================================

// Cargar las funciones de queries (si estás en mongosh, ignora esta línea)
// const queries = require('./mongodb/04-queries.js')

use capta_tickets_db

print("===========================================")
print("EJEMPLOS DE CONSULTAS - Sistema de Tickets")
print("===========================================\n")

// ===================================
// EJEMPLO 1: LISTA DE CASOS
// ===================================

print("--- EJEMPLO 1: Lista de Casos ---\n")

// 1.1 Todos los tickets abiertos (estado actual)
print("1.1 Tickets abiertos actualmente:")
const tickets_open = await getTickets({ 
  state: "open", 
  page: 1, 
  pageSize: 10 
})
print(`Total: ${tickets_open.total} tickets`)
print(`Mostrando página ${tickets_open.page} de ${tickets_open.totalPages}\n`)

// 1.2 Tickets en un rango de fechas
print("1.2 Tickets durante enero 2025:")
const tickets_enero = await getTickets({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z"),
  page: 1,
  pageSize: 10
})
print(`Total: ${tickets_enero.total} tickets\n`)

// 1.3 Tickets de un clasificador específico
print("1.3 Tickets del área de mantenimiento:")
const tickets_mant = await getTickets({
  classifierIds: ["area_mantenimiento"],
  page: 1,
  pageSize: 10
})
print(`Total: ${tickets_mant.total} tickets\n`)

// 1.4 Combinación de filtros
print("1.4 Tickets abiertos de mantenimiento en enero:")
const tickets_combo = await getTickets({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z"),
  state: "open",
  classifierIds: ["area_mantenimiento"],
  page: 1,
  pageSize: 10
})
print(`Total: ${tickets_combo.total} tickets\n`)

// ===================================
// EJEMPLO 2: CANTIDAD DE REAPERTURAS
// ===================================

print("--- EJEMPLO 2: Reaperturas ---\n")

// 2.1 Total de reaperturas en enero 2025
print("2.1 Total de reaperturas en enero 2025:")
const reopenings_total = await countReopenings({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z")
})
print(`Total: ${reopenings_total} reaperturas\n`)

// 2.2 Reaperturas con detalle por ticket
print("2.2 Detalle de reaperturas por ticket:")
const reopenings_detail = await getReopeningsByTicket({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z")
})
print(`Total reaperturas: ${reopenings_detail.total_reopenings}`)
print(`Tickets que se reabrieron: ${reopenings_detail.tickets_reopened}`)

if (reopenings_detail.details.length > 0) {
  print("\nTop 5 tickets más reabiertos:")
  reopenings_detail.details.slice(0, 5).forEach(d => {
    print(`  - ${d.ticket_number}: ${d.reopening_count} veces`)
  })
}
print("")

// 2.3 Reaperturas de un clasificador específico
print("2.3 Reaperturas del área de mantenimiento:")
const reopenings_mant = await countReopenings({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z"),
  classifierIds: ["area_mantenimiento"]
})
print(`Total: ${reopenings_mant} reaperturas\n`)

// ===================================
// EJEMPLO 3: CANTIDAD DE INGRESOS
// ===================================

print("--- EJEMPLO 3: Ingresos ---\n")

// 3.1 Total de ingresos en enero 2025
print("3.1 Total de ingresos en enero 2025:")
const ingresos_total = await countTicketIngresos({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z")
})
print(`Total: ${ingresos_total} tickets nuevos\n`)

// 3.2 Ingresos por clasificador
print("3.2 Ingresos del área de mantenimiento:")
const ingresos_mant = await countTicketIngresos({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z"),
  classifierIds: ["area_mantenimiento"]
})
print(`Total: ${ingresos_mant} tickets nuevos\n`)

// 3.3 Ingresos con distribución diaria
print("3.3 Distribución diaria de ingresos:")
const ingresos_dist = await getIngresosDistribution({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-01-08T00:00:00Z"),
  groupBy: "day"
})
print(`Total ingresos: ${ingresos_dist.total_ingresos}`)
print("Distribución por día:")
ingresos_dist.distribution.forEach(d => {
  print(`  ${d.period}: ${d.count} tickets`)
})
print("")

// ===================================
// EJEMPLO 4: CANTIDAD DE CIERRES
// ===================================

print("--- EJEMPLO 4: Cierres ---\n")

// 4.1 Total de cierres en enero 2025
print("4.1 Total de cierres en enero 2025:")
const cierres_total = await countTicketCierres({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z")
})
print(`Total: ${cierres_total} cierres\n`)

// 4.2 Cierres por clasificador
print("4.2 Cierres del área de mantenimiento:")
const cierres_mant = await countTicketCierres({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z"),
  classifierIds: ["area_mantenimiento"]
})
print(`Total: ${cierres_mant} cierres\n`)

// 4.3 Cierres con métricas de tiempo de resolución
print("4.3 Métricas de tiempo de resolución:")
const cierres_stats = await getCierresWithResolutionTime({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z")
})
print(`Total cierres: ${cierres_stats.total_cierres}`)
print(`Tiempo promedio de resolución: ${cierres_stats.avg_resolution_time_hours} horas`)
print(`Tiempo mínimo: ${cierres_stats.min_resolution_time_hours} horas`)
print(`Tiempo máximo: ${cierres_stats.max_resolution_time_hours} horas\n`)

// ===================================
// EJEMPLO 5: LISTA DE ACCIONES
// ===================================

print("--- EJEMPLO 5: Lista de Acciones ---\n")

// 5.1 Últimas 20 acciones del sistema
print("5.1 Últimas 20 acciones:")
const actions_recent = await getTicketActions({ 
  page: 1, 
  pageSize: 20 
})
print(`Total acciones en el sistema: ${actions_recent.total}`)
print(`Mostrando ${actions_recent.actions.length} acciones más recientes\n`)

if (actions_recent.actions.length > 0) {
  print("Últimas 5 acciones:")
  actions_recent.actions.slice(0, 5).forEach(action => {
    const date = action.timestamp.toISOString().split('T')[0]
    print(`  [${date}] ${action.action_type} - Ticket: ${action.ticket_number || 'N/A'}`)
  })
}
print("")

// 5.2 Solo cambios de estado en enero
print("5.2 Cambios de estado en enero 2025:")
const actions_states = await getTicketActions({
  actionTypes: ["state_change"],
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z"),
  page: 1,
  pageSize: 10
})
print(`Total: ${actions_states.total} cambios de estado\n`)

// 5.3 Comentarios recientes
print("5.3 Comentarios de la última semana:")
const oneWeekAgo = new Date()
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

const actions_comments = await getTicketActions({
  actionTypes: ["comment"],
  startDate: oneWeekAgo,
  page: 1,
  pageSize: 10
})
print(`Total: ${actions_comments.total} comentarios\n`)

// 5.4 Acciones de un ticket específico
print("5.4 Histórico completo de un ticket:")
// Obtener el primer ticket de la base de datos
const firstTicket = await db.tickets.findOne()

if (firstTicket) {
  const actions_ticket = await getTicketActions({
    ticketId: firstTicket._id
  })
  print(`Ticket: ${firstTicket.ticket_number}`)
  print(`Total acciones: ${actions_ticket.total}`)
  
  if (actions_ticket.actions.length > 0) {
    print("\nPrimeras 5 acciones:")
    actions_ticket.actions.slice(0, 5).forEach(action => {
      const date = action.timestamp.toISOString().split('T')[0]
      print(`  [${date}] ${action.action_type}`)
    })
  }
} else {
  print("No hay tickets en la base de datos")
}
print("")

// ===================================
// EJEMPLO 6: CASOS ESPECIALES
// ===================================

print("--- EJEMPLO 6: Casos Especiales ---\n")

// 6.1 Tickets sin clasificador específico (todos)
print("6.1 Todos los tickets sin filtro de clasificador:")
const all_tickets = await getTickets({
  page: 1,
  pageSize: 5
})
print(`Total tickets en el sistema: ${all_tickets.total}\n`)

// 6.2 Reaperturas sin rango de fechas (históricas)
print("6.2 Total de reaperturas históricas:")
const all_reopenings = await countReopenings({})
print(`Total: ${all_reopenings} reaperturas desde siempre\n`)

// 6.3 Tickets por estado (distribución)
print("6.3 Distribución de tickets por estado:")
const states = ["open", "in_progress", "closed"]

for (const state of states) {
  const count = await db.tickets.countDocuments({ current_state: state })
  print(`  ${state}: ${count} tickets`)
}
print("")

// ===================================
// RESUMEN EJECUTIVO
// ===================================

print("===========================================")
print("RESUMEN EJECUTIVO")
print("===========================================\n")

const summary = {
  total_tickets: await db.tickets.countDocuments({}),
  tickets_open: await db.tickets.countDocuments({ current_state: "open" }),
  tickets_in_progress: await db.tickets.countDocuments({ current_state: "in_progress" }),
  tickets_closed: await db.tickets.countDocuments({ current_state: "closed" }),
  total_actions: await db.ticket_history.countDocuments({})
}

print(`Total de Tickets: ${summary.total_tickets}`)
print(`  - Abiertos: ${summary.tickets_open}`)
print(`  - En Progreso: ${summary.tickets_in_progress}`)
print(`  - Cerrados: ${summary.tickets_closed}`)
print(`\nTotal de Acciones Históricas: ${summary.total_actions}`)

print("\n===========================================")
print("FIN DE EJEMPLOS")
print("===========================================")