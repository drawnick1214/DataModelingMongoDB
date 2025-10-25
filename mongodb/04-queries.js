// ===================================
// QUERIES.JS - Sistema de Tickets
//
// TIPO DE ARCHIVO: MongoDB Shell Script (mongosh)
//
// CÓMO EJECUTAR:
//   mongosh < mongodb/04-queries.js
//   O desde mongosh: load('mongodb/04-queries.js')
//
// DESCRIPCIÓN:
//   Implementación completa de las 5 consultas principales
//   Las funciones están disponibles después de cargar el archivo
//
// USO:
//   mongosh
//   > use capta_tickets_db
//   > load('mongodb/04-queries.js')
//   > await getTickets({ state: "open", page: 1, pageSize: 10 })
// ===================================
use capta_tickets_db

// ===================================
// FUNCIÓN 1: LISTA DE CASOS
// ===================================

async function getTickets(params) {
  const {
    startDate,      // ISODate | null
    endDate,        // ISODate | null
    state,          // string | null ("open", "in_progress", "closed")
    classifierIds,  // array of strings | null
    page = 1,       // número de página
    pageSize = 50   // tamaño de página
  } = params
  
  const filter = {}
  
  // Aplicar filtro de rango de fechas
  if (startDate && endDate) {
    Object.assign(filter, {
      $or: [
        { 
          created_at: { $lt: endDate },
          closed_at: { $gte: startDate }
        },
        { 
          created_at: { $lt: endDate },
          closed_at: null
        }
      ]
    })
  }
  
  // Aplicar filtro de clasificadores
  if (classifierIds && classifierIds.length > 0) {
    const classifiers = await db.classifiers.find({
      _id: { $in: classifierIds }
    }).toArray()
    
    // Validar que no haya múltiples nodos de la misma raíz
    const rootIds = classifiers.map(c => c.root_id)
    const uniqueRoots = [...new Set(rootIds)]
    
    if (rootIds.length !== uniqueRoots.length) {
      throw new Error("No puede haber más de un nodo de la misma raíz jerárquica")
    }
    
    const classifierFilters = classifiers.map(c => ({
      "current_classification.path": c._id
    }))
    
    if (!filter.$and) {
      filter.$and = []
    }
    filter.$and.push(...classifierFilters)
  }
  
  // Filtro de estado (caso simple)
  if (state && (!startDate || !endDate)) {
    filter.current_state = state
  }
  
  // Query principal
  const tickets = await db.tickets.find(filter)
    .sort({ created_at: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray()
  
  const total = await db.tickets.countDocuments(filter)
  
  return {
    tickets,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

// ===================================
// FUNCIÓN 2: CANTIDAD DE REAPERTURAS
// ===================================

async function countReopenings(params) {
  const {
    startDate,      // ISODate (required)
    endDate,        // ISODate (required)
    classifierIds   // array of strings | null
  } = params
  
  const filter = {
    action_type: "state_change",
    "changes.old_value": "closed",
    "changes.new_value": "open"
  }
  
  if (startDate && endDate) {
    filter.timestamp = {
      $gte: startDate,
      $lt: endDate
    }
  }
  
  // Sin filtro de clasificadores
  if (!classifierIds || classifierIds.length === 0) {
    return await db.ticket_history.countDocuments(filter)
  }
  
  // Con filtro de clasificadores (requiere JOIN)
  const classifiers = await db.classifiers.find({
    _id: { $in: classifierIds }
  }).toArray()
  
  const result = await db.ticket_history.aggregate([
    { $match: filter },
    
    // Lookup para obtener info del ticket
    {
      $lookup: {
        from: "tickets",
        localField: "ticket_id",
        foreignField: "_id",
        as: "ticket"
      }
    },
    
    { $unwind: "$ticket" },
    
    // Filtrar por clasificadores
    {
      $match: {
        $or: classifiers.map(c => ({
          "ticket.current_classification.path": c._id
        }))
      }
    },
    
    // Contar
    { $count: "total_reopenings" }
  ]).toArray()
  
  return result[0]?.total_reopenings || 0
}

// Función con detalle por ticket
async function getReopeningsByTicket(params) {
  const { startDate, endDate, classifierIds } = params
  
  const filter = {
    action_type: "state_change",
    "changes.old_value": "closed",
    "changes.new_value": "open"
  }
  
  if (startDate && endDate) {
    filter.timestamp = { $gte: startDate, $lt: endDate }
  }
  
  const pipeline = [
    { $match: filter },
    
    // Agrupar por ticket
    {
      $group: {
        _id: "$ticket_id",
        reopening_count: { $sum: 1 },
        reopening_dates: { $push: "$timestamp" }
      }
    },
    
    // Lookup para info del ticket
    {
      $lookup: {
        from: "tickets",
        localField: "_id",
        foreignField: "_id",
        as: "ticket"
      }
    },
    
    { $unwind: "$ticket" }
  ]
  
  // Aplicar filtro de clasificadores
  if (classifierIds && classifierIds.length > 0) {
    const classifiers = await db.classifiers.find({
      _id: { $in: classifierIds }
    }).toArray()
    
    pipeline.push({
      $match: {
        $or: classifiers.map(c => ({
          "ticket.current_classification.path": c._id
        }))
      }
    })
  }
  
  pipeline.push(
    { $sort: { reopening_count: -1 } },
    {
      $project: {
        ticket_id: "$_id",
        ticket_number: "$ticket.ticket_number",
        reopening_count: 1,
        reopening_dates: 1
      }
    }
  )
  
  const results = await db.ticket_history.aggregate(pipeline).toArray()
  
  return {
    total_reopenings: results.reduce((sum, r) => sum + r.reopening_count, 0),
    tickets_reopened: results.length,
    details: results
  }
}

// ===================================
// FUNCIÓN 3: CANTIDAD DE INGRESOS
// ===================================

async function countTicketIngresos(params) {
  const {
    startDate,      // ISODate (required)
    endDate,        // ISODate (required)
    classifierIds,  // array of strings | null
    state           // string | null
  } = params
  
  const filter = {
    created_at: {
      $gte: startDate,
      $lt: endDate
    }
  }
  
  // Filtro por estado actual
  if (state) {
    filter.current_state = state
  }
  
  // Filtro por clasificadores
  if (classifierIds && classifierIds.length > 0) {
    const classifiers = await db.classifiers.find({
      _id: { $in: classifierIds }
    }).toArray()
    
    filter.$or = classifiers.map(c => ({
      "current_classification.path": c._id
    }))
  }
  
  return await db.tickets.countDocuments(filter)
}

// Función con distribución temporal
async function getIngresosDistribution(params) {
  const {
    startDate,
    endDate,
    classifierIds,
    groupBy = "day"  // "hour", "day", "week", "month"
  } = params
  
  const filter = {
    created_at: { $gte: startDate, $lt: endDate }
  }
  
  // Configurar formato de fecha según el agrupamiento
  const dateFormat = {
    hour: "%Y-%m-%d %H:00",
    day: "%Y-%m-%d",
    week: "%Y-W%V",
    month: "%Y-%m"
  }[groupBy]
  
  const pipeline = [
    { $match: filter }
  ]
  
  // Aplicar filtro de clasificadores si existe
  if (classifierIds && classifierIds.length > 0) {
    const classifiers = await db.classifiers.find({
      _id: { $in: classifierIds }
    }).toArray()
    
    pipeline.unshift({
      $match: {
        $or: classifiers.map(c => ({
          "current_classification.path": c._id
        }))
      }
    })
  }
  
  pipeline.push(
    {
      $group: {
        _id: {
          $dateToString: { format: dateFormat, date: "$created_at" }
        },
        count: { $sum: 1 },
        tickets: { $push: "$ticket_number" }
      }
    },
    
    { $sort: { _id: 1 } },
    
    {
      $project: {
        period: "$_id",
        count: 1,
        ticket_numbers: "$tickets",
        _id: 0
      }
    }
  )
  
  const distribution = await db.tickets.aggregate(pipeline).toArray()
  const total = distribution.reduce((sum, d) => sum + d.count, 0)
  
  return {
    total_ingresos: total,
    group_by: groupBy,
    distribution
  }
}

// ===================================
// FUNCIÓN 4: CANTIDAD DE CIERRES
// ===================================

async function countTicketCierres(params) {
  const {
    startDate,      // ISODate (required)
    endDate,        // ISODate (required)
    classifierIds   // array of strings | null
  } = params
  
  const filter = {
    action_type: "state_change",
    "changes.new_value": "closed",
    timestamp: {
      $gte: startDate,
      $lt: endDate
    }
  }
  
  // Sin filtro de clasificadores
  if (!classifierIds || classifierIds.length === 0) {
    return await db.ticket_history.countDocuments(filter)
  }
  
  // Con filtro de clasificadores
  const classifiers = await db.classifiers.find({
    _id: { $in: classifierIds }
  }).toArray()
  
  const result = await db.ticket_history.aggregate([
    { $match: filter },
    
    {
      $lookup: {
        from: "tickets",
        localField: "ticket_id",
        foreignField: "_id",
        as: "ticket"
      }
    },
    
    { $unwind: "$ticket" },
    
    {
      $match: {
        $or: classifiers.map(c => ({
          "ticket.current_classification.path": c._id
        }))
      }
    },
    
    { $count: "total_cierres" }
  ]).toArray()
  
  return result[0]?.total_cierres || 0
}

// Función con tiempo promedio de resolución
async function getCierresWithResolutionTime(params) {
  const { startDate, endDate, classifierIds } = params
  
  const filter = {
    action_type: "state_change",
    "changes.new_value": "closed",
    timestamp: { $gte: startDate, $lt: endDate }
  }
  
  const pipeline = [
    { $match: filter },
    
    // Lookup del ticket
    {
      $lookup: {
        from: "tickets",
        localField: "ticket_id",
        foreignField: "_id",
        as: "ticket"
      }
    },
    
    { $unwind: "$ticket" },
    
    // Calcular tiempo de resolución (en horas)
    {
      $addFields: {
        resolution_time_hours: {
          $divide: [
            { $subtract: ["$timestamp", "$ticket.created_at"] },
            1000 * 60 * 60  // Convertir ms a horas
          ]
        }
      }
    }
  ]
  
  // Filtro de clasificadores
  if (classifierIds && classifierIds.length > 0) {
    const classifiers = await db.classifiers.find({
      _id: { $in: classifierIds }
    }).toArray()
    
    pipeline.push({
      $match: {
        $or: classifiers.map(c => ({
          "ticket.current_classification.path": c._id
        }))
      }
    })
  }
  
  // Agregaciones finales
  pipeline.push(
    {
      $group: {
        _id: null,
        total_cierres: { $sum: 1 },
        avg_resolution_time: { $avg: "$resolution_time_hours" },
        min_resolution_time: { $min: "$resolution_time_hours" },
        max_resolution_time: { $max: "$resolution_time_hours" }
      }
    },
    
    {
      $project: {
        _id: 0,
        total_cierres: 1,
        avg_resolution_time_hours: { $round: ["$avg_resolution_time", 2] },
        min_resolution_time_hours: { $round: ["$min_resolution_time", 2] },
        max_resolution_time_hours: { $round: ["$max_resolution_time", 2] }
      }
    }
  )
  
  const result = await db.ticket_history.aggregate(pipeline).toArray()
  return result[0] || {
    total_cierres: 0,
    avg_resolution_time_hours: 0,
    min_resolution_time_hours: 0,
    max_resolution_time_hours: 0
  }
}

// ===================================
// FUNCIÓN 5: LISTA DE ACCIONES
// ===================================

async function getTicketActions(params) {
  const {
    ticketId,       // ObjectId | null (filtrar por ticket específico)
    actionTypes,    // array of strings | null (filtrar por tipo de acción)
    startDate,      // ISODate | null
    endDate,        // ISODate | null
    page = 1,
    pageSize = 100
  } = params
  
  const matchStage = {}
  
  if (ticketId) matchStage.ticket_id = ticketId
  if (actionTypes && actionTypes.length > 0) {
    matchStage.action_type = { $in: actionTypes }
  }
  if (startDate && endDate) {
    matchStage.timestamp = { $gte: startDate, $lt: endDate }
  } else if (startDate) {
    matchStage.timestamp = { $gte: startDate }
  } else if (endDate) {
    matchStage.timestamp = { $lt: endDate }
  }
  
  const pipeline = [
    { $match: matchStage },
    { $sort: { timestamp: -1 } },
    
    // Facet para obtener datos y conteo en una sola query
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          
          // Lookup para enriquecer con info del ticket
          {
            $lookup: {
              from: "tickets",
              localField: "ticket_id",
              foreignField: "_id",
              as: "ticket"
            }
          },
          
          {
            $addFields: {
              ticket_number: { $arrayElemAt: ["$ticket.ticket_number", 0] },
              ticket_state: { $arrayElemAt: ["$ticket.current_state", 0] }
            }
          },
          
          {
            $project: {
              ticket: 0
            }
          }
        ]
      }
    }
  ]
  
  const result = await db.ticket_history.aggregate(pipeline).toArray()
  const total = result[0]?.metadata[0]?.total || 0
  const actions = result[0]?.data || []
  
  return {
    actions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}
