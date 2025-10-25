# 🎫 Sistema de Tickets - MongoDB

Solución completa de gestión de tickets implementada en MongoDB. Diseñada para escalar a millones de registros con performance óptimo.

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)
---

## 📋 Descripción

Sistema de ticketing con soporte para:
- ✅ Estados dinámicos (open, in_progress, closed)
- ✅ Clasificadores jerárquicos multinivel
- ✅ Histórico completo inmutable
- ✅ Filtros combinables (fechas, estado, clasificadores)
- ✅ 5 consultas principales optimizadas
- ✅ Performance sub-segundo en millones de registros

---

## 🚀 Quick Start

### Prerrequisitos

- MongoDB 5.0 o superior
- MongoDB Shell (mongosh)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/capta-tickets-solution.git
cd capta-tickets-solution

# 2. Crear colecciones con validación
mongosh < mongodb/01-create-collections.js

# 3. Crear índices optimizados
mongosh < mongodb/02-create-indexes.js

# 4. Cargar datos de ejemplo (100 tickets)
mongosh < mongodb/03-seed-data.js

# 5. Probar las consultas
mongosh < examples/query-examples.js
```

---

## 📁 Estructura del Proyecto

```
capta-tickets-solution/
│
├── 📄 README.md                     # Este archivo
├── 📁 docs/
│   └── solucion-tecnica.md          # Documentación técnica completa
├── 📁 mongodb/
│   ├── 01-create-collections.js     # Crea colecciones con validación
│   ├── 02-create-indexes.js         # Crea 10 índices optimizados
│   ├── 03-seed-data.js              # Datos de ejemplo (100 tickets)
│   └── 04-queries.js                # 5 consultas principales
└── 📁 examples/
    └── query-examples.js            # Ejemplos de uso
```

---

## 🗄️ Modelo de Datos

### Colecciones

**1. `classifiers`** - Catálogo de clasificadores jerárquicos
```javascript
{
  _id: "area_mantenimiento",
  name: "Área de Mantenimiento",
  root_id: "servicios",
  parent_id: "servicios",
  path: ["servicios", "area_mantenimiento"],  // Clave para búsquedas jerárquicas
  level: 1,
  is_leaf: false
}
```

**2. `tickets`** - Estado actual de cada ticket
```javascript
{
  _id: ObjectId("..."),
  ticket_number: "TKT-2025-0001",
  current_state: "open",
  current_classification: {
    root_id: "servicios",
    node_id: "area_mantenimiento",
    path: ["servicios", "area_mantenimiento"]  // Denormalizado para performance
  },
  created_at: ISODate("2025-01-15T10:30:00Z"),
  closed_at: null,
  updated_at: ISODate("2025-01-15T10:30:00Z")
}
```

**3. `ticket_history`** - Histórico inmutable de acciones
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

## 🔍 Consultas Principales

### 1. Lista de Casos
Obtener tickets con filtros combinables.

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

### 2. Cantidad de Reaperturas
Conteo de tickets que pasaron de `closed` a `open`.

```javascript
await countReopenings({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z"),
  classifierIds: ["area_mantenimiento"]
})
```

### 3. Cantidad de Ingresos
Tickets creados durante el período.

```javascript
await countTicketIngresos({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z")
})
```

### 4. Cantidad de Cierres
Tickets cerrados durante el período.

```javascript
await countTicketCierres({
  startDate: ISODate("2025-01-01T00:00:00Z"),
  endDate: ISODate("2025-02-01T00:00:00Z")
})
```

### 5. Lista de Acciones
Histórico de acciones con filtros.

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

## 📊 Índices

Sistema optimizado con 10 índices estratégicos:

### Tickets (6 índices)
- `ticket_number` (unique) - Búsqueda directa
- `current_state` - Filtro por estado
- `created_at, closed_at` - Rango de fechas
- `current_classification.path` - Filtro jerárquico
- `current_classification.node_id` - Nodo específico
- **Compuesto (4 campos)** - Query principal optimizada

### Ticket History (3 índices)
- `ticket_id, timestamp` - Histórico por ticket
- `action_type, timestamp` - Métricas agregadas
- `timestamp` - Limpieza de datos

### Classifiers (2 índices)
- `root_id, parent_id` - Navegación jerárquica
- `path` - Búsqueda de descendientes

**Performance:** < 200ms en 1M tickets con índices correctamente configurados.

---

## 🎯 Características

### ✅ Filtros Implementados

- **Rango de fechas:** Tickets abiertos o en gestión durante `[startDate, endDate)`
- **Estado del caso:** Actual o histórico (estado al final del período)
- **Clasificadores jerárquicos:** Búsqueda inclusiva de descendientes

### ✅ Diseño Escalable

- Separación de estado actual vs histórico
- Denormalización controlada del `path` jerárquico
- Índices compuestos para queries complejas
- Soporte para millones de tickets

### ✅ Histórico Completo

- Trazabilidad total de cambios
- Auditoría inmutable
- Reconstrucción de estado en cualquier momento

---

## 🧪 Datos de Ejemplo

El script `03-seed-data.js` genera:

- **8 clasificadores** en jerarquía de 3 niveles
- **100 tickets** con estados variados:
  - ~10 abiertos
  - ~20 en progreso
  - ~70 cerrados
- **300+ acciones** en el histórico
- **10 reaperturas** simuladas
- Datos distribuidos en enero-febrero 2025

---

## 📖 Documentación

### Documento Técnico Completo

Ver [`docs/DocumentoTecnicoModeladoDatosTickets.pdf`](docs/DocumentoTecnicoModeladoDatosTickets.pdf) para:

- ✅ Análisis detallado del dominio
- ✅ Justificación de decisiones de diseño
- ✅ Explicación de índices y performance
- ✅ Implementación de consultas
- ✅ Dificultades y limitaciones
- ✅ Consultas extras de valor agregado

### Ejemplos de Uso

Ver [`examples/query-examples.js`](examples/query-examples.js) para casos de uso prácticos.

---

## 🛠️ Uso Avanzado

### Consultar datos interactivamente

```bash
# Abrir MongoDB Shell
mongosh capta_tickets_db

# Cargar funciones
load('mongodb/04-queries.js')

# Ejecutar consultas personalizadas
await getTickets({ 
  state: "open", 
  page: 1, 
  pageSize: 10 
})
```

### Verificar performance

```javascript
// Ver plan de ejecución
db.tickets.find({ current_state: "open" }).explain("executionStats")

// Verificar que use índice (buscar "IXSCAN" en el output)
// Si dice "COLLSCAN" el índice no se está usando
```

### Ver estadísticas

```javascript
// Estadísticas de la colección
db.tickets.stats()

// Uso de índices
db.tickets.aggregate([{ $indexStats: {} }])

// Tamaño de índices
db.tickets.stats().indexSizes
```

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

## 👤 Autor

**Nick Díaz**

- LinkedIn: [tu-perfil]([https://linkedin.com/in/tu-perfil](https://www.linkedin.com/in/drawnick991214/))
- GitHub: [@tu-usuario]([https://github.com/tu-usuario](https://github.com/drawnick1214))
- Email: enickdiazc@gmail.com

---

## 🙏 Agradecimientos

- Gracias por la oportunidad de resolver este desafío técnico

---

## 📚 Referencias

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Schema Design Patterns](https://www.mongodb.com/blog/post/building-with-patterns-a-summary)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)

---
