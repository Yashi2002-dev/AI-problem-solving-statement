import { analyzeTransactions, buildPaymentQuery } from '../utils/analyzerUtils.js'

export async function fetchMockTransactions() {
  const response = await fetch('/mock-payments.json')
  if (!response.ok) throw new Error('Unable to fetch payment data from the mock API.')

  const payload = await response.json()
  if (!Array.isArray(payload)) throw new Error('Mock API returned an invalid payment data format.')

  const now = Date.now()
  return payload.map((transaction) => ({
    ...transaction,
    createdAt: now - transaction.ageMinutes * 60 * 1000,
  }))
}

function executeMcpSql(sql, query, transactions) {
  if (!/^SELECT\s/i.test(sql) || /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE)\b/i.test(sql)) {
    throw new Error('MCP rejected the query: only read-only SELECT statements are allowed.')
  }

  const windowMs = query.hours * 60 * 60 * 1000
  const now = Date.now()
  return transactions.filter((transaction) => {
    const inTimeWindow = now - transaction.createdAt <= windowMs
    const matchesStatus = transaction.status === query.status
    const matchesCustomer = !query.customerId || transaction.customerId === query.customerId
    const matchesName = !query.customerName || transaction.customerName.toLowerCase() === query.customerName.toLowerCase()
    const matchesDate = !query.selectedDate || new Date(transaction.createdAt).toISOString().slice(0, 10) === query.selectedDate
    return inTimeWindow && matchesStatus && matchesCustomer && matchesName && matchesDate
  })
}

export function filterMockTransactions(transactions, filters = {}) {
  return transactions.filter((transaction) => {
    const matchesCustomer = !filters.customerId || transaction.customerId === filters.customerId.trim()
    const matchesName = !filters.customerName || transaction.customerName.toLowerCase().includes(filters.customerName.trim().toLowerCase())
    const matchesStatus = !filters.status || transaction.status === filters.status
    const matchesDate = !filters.selectedDate || new Date(transaction.createdAt).toISOString().slice(0, 10) === filters.selectedDate
    return matchesCustomer && matchesName && matchesStatus && matchesDate
  })
}

export async function analyzeComplaint(complaint, filters) {
  const query = buildPaymentQuery(complaint, filters)
  const transactions = await fetchMockTransactions()
  const rows = executeMcpSql(query.sql, query, transactions)
  return analyzeTransactions(complaint, query, rows)
}
