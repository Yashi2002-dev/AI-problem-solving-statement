export const EXAMPLE_COMPLAINT = 'Last 1 Hour Payment Failure Count'

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function complaintToQuery(complaint) {
  const hasPaymentTerm = /payment|payments|transaction|transactions|txn|upi|card|bank/i.test(complaint)
  const hasCountTerm = /\bcount\b|\bhow many\b|\bnumber of\b/i.test(complaint)
  const status = /fail|declin|error/i.test(complaint) ? 'FAILED' : 'SUCCESS'
  const hourMatch = complaint.match(/\b(?:last|past|previous)\s+(\d+)\s*(?:hour|hours|hr|hrs)\b/i)
  if (!hasPaymentTerm || !hasCountTerm || !hourMatch) {
    throw new Error('Please ask for a payment count using a last-hours range, such as "Last 2 Hours Payment Failure Count".')
  }

  const hours = Number(hourMatch[1])
  if (hours < 1 || hours > 24) {
    throw new Error('Please choose a time range between 1 and 24 hours.')
  }
  const timeRange = `last ${hours} hour${hours === 1 ? '' : 's'}`
  const interval = `${hours} hour${hours === 1 ? '' : 's'}`

  return {
    status,
    hours,
    timeRange,
    sql: `SELECT status, failure_reason, amount FROM payments\nWHERE created_at >= NOW() - INTERVAL '${interval}';`,
  }
}

export function buildPaymentQuery(complaint, filters = {}) {
  const baseQuery = complaintToQuery(complaint)
  const status = ['FAILED', 'SUCCESS', 'PROCESSING'].includes(filters.status) ? filters.status : baseQuery.status
  const customerId = (filters.customerId || '').trim()
  const customerName = (filters.customerName || '').trim()
  const selectedDate = (filters.selectedDate || '').trim()
  const referencesCustomer = /\b(?:customer|user|account)\b/i.test(complaint)
  if (referencesCustomer && !customerId && !customerName) {
    throw new Error('Select a customer ID or name before asking for that customer\'s payments.')
  }
  if (customerId && !/^[A-Za-z0-9_-]+$/.test(customerId)) {
    throw new Error('Customer ID can contain only letters, numbers, underscores, and hyphens.')
  }
  if (customerName && !/^[A-Za-z0-9 _-]+$/.test(customerName)) {
    throw new Error('Customer name can contain only letters, numbers, spaces, underscores, and hyphens.')
  }
  if (selectedDate && !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    throw new Error('Please select a valid date.')
  }
  const conditions = [`created_at >= NOW() - INTERVAL '${baseQuery.hours} hour${baseQuery.hours === 1 ? '' : 's'}'`, `status = '${status}'`]
  if (customerId) conditions.push(`customer_id = '${customerId}'`)
  if (customerName) conditions.push(`customer_name = '${customerName}'`)
  if (selectedDate) conditions.push(`DATE(created_at) = '${selectedDate}'`)

  return {
    ...baseQuery,
    status,
    customerId,
    customerName,
    selectedDate,
    sql: `SELECT customer_id, status, failure_reason, amount FROM payments\nWHERE ${conditions.join('\n  AND ')};`,
  }
}

export function analyzeTransactions(complaint, query, rows) {
  const failedRows = rows.filter((row) => row.status === 'FAILED')
  const failureCount = failedRows.length
  const totalFailedAmount = failedRows.reduce((total, row) => total + row.amount, 0)
  const selectedAmount = rows.reduce((total, row) => total + row.amount, 0)
  const reasonMap = new Map()

  failedRows.forEach((row) => {
    const reason = row.failureReason || 'No failure reason'
    const current = reasonMap.get(reason) || { count: 0, amount: 0 }
    reasonMap.set(reason, {
      count: current.count + 1,
      amount: current.amount + row.amount,
    })
  })

  const customerMessage = query.customerId ? ` for customer ${query.customerId}` : ''
  const summary = rows.length === 0
    ? `No ${query.status.toLowerCase()} payments were found${customerMessage} in the ${query.timeRange}.`
    : query.status === 'FAILED'
      ? `${failureCount} failed payment${failureCount === 1 ? '' : 's'} found${customerMessage} in the ${query.timeRange}, totalling ${formatCurrency(totalFailedAmount)}. ${[...reasonMap.entries()][0][0]} is the leading reason.`
      : `${rows.length} ${query.status.toLowerCase()} payment${rows.length === 1 ? '' : 's'} found${customerMessage} in the ${query.timeRange}, totalling ${formatCurrency(selectedAmount)}.`

  return {
    query: complaint,
    sql: query.sql,
    filters: { customerId: query.customerId, customerName: query.customerName, selectedDate: query.selectedDate, status: query.status, timeRange: query.timeRange },
    metrics: {
      transactionCount: rows.length,
      failureCount,
      totalFailedAmount,
      averageFailedAmount: failureCount ? totalFailedAmount / failureCount : 0,
      failureRate: rows.length ? (failureCount / rows.length) * 100 : 0,
    },
    failureReasons: [...reasonMap.entries()].map(([reason, values]) => ({ reason, ...values })),
    statusBreakdown: ['FAILED', 'SUCCESS', 'PROCESSING'].map((status) => ({
      status,
      count: rows.filter((row) => row.status === status).length,
      amount: rows.filter((row) => row.status === status).reduce((total, row) => total + row.amount, 0),
    })),
    generatedAt: new Date().toISOString(),
    summary,
  }
}
