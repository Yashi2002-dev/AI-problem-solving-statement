import { useEffect, useState } from 'react'
import { ComplaintInput } from './components/complaintInput.jsx'
import { AnalysisResult } from './components/anaysisResult.jsx'
import { useAnalyser } from './hooks/useAnalyser.js'
import { fetchMockTransactions, filterMockTransactions } from './api/analyzerapi.js'
import './App.css'

function App() {
  const [complaint, setComplaint] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [status, setStatus] = useState('FAILED')
  const [transactions, setTransactions] = useState([])
  const [tableError, setTableError] = useState('')
  const { result, error, isLoading, analyze, clearError } = useAnalyser()
  const filters = { customerId, customerName, selectedDate, status }

  useEffect(() => {
    let active = true
    fetchMockTransactions()
      .then((records) => {
        if (active) {
          setTransactions(filterMockTransactions(records, { customerId, customerName, selectedDate, status }).slice(0, 10))
          setTableError('')
        }
      })
      .catch(() => {
        if (active) setTableError('Unable to load transaction data.')
      })
    return () => { active = false }
  }, [customerId, customerName, selectedDate, status])

  function resetFilters() {
    setCustomerId('')
    setCustomerName('')
    setSelectedDate('')
    setStatus('FAILED')
  }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand-mark">PX</div>
      <div><strong>Payment Signals</strong><span>AI support analyzer</span></div>
      <div className="connection"><i /> MCP connected</div>
    </header>

    <section className="intro">
      <p className="eyebrow">TRANSACTION INTELLIGENCE / 01</p>
      <h1>Turn payment complaints<br /><em>into clear signals.</em></h1>
      <p className="lede">Ask a question in plain English. We translate it into a safe query, run it against your payment data, and explain what happened.</p>
    </section>

    <section className="global-data">
      <div className="panel-label"><span>00</span> Global payment filters</div>
      <div className="global-filter-grid">
        <div><label htmlFor="global-customer-id">Customer ID</label><input id="global-customer-id" value={customerId} onChange={(event) => { setCustomerId(event.target.value); clearError() }} placeholder="e.g. cust_1001" disabled={isLoading} /></div>
        <div><label htmlFor="global-customer-name">Customer name</label><input id="global-customer-name" value={customerName} onChange={(event) => { setCustomerName(event.target.value); clearError() }} placeholder="e.g. Aarav Sharma" disabled={isLoading} /></div>
        <div><label htmlFor="global-date">Transaction date</label><input id="global-date" type="date" value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); clearError() }} disabled={isLoading} /></div>
        <div><label htmlFor="global-status">Payment status</label><select id="global-status" value={status} onChange={(event) => { setStatus(event.target.value); clearError() }} disabled={isLoading}><option value="FAILED">Failed</option><option value="SUCCESS">Success</option><option value="PROCESSING">Processing</option></select></div>
      </div>
    </section>

    <section className="transaction-table-panel">
      <div className="table-heading"><div><p className="eyebrow">LIVE MOCK API DATA</p><h2>Filtered transactions</h2></div><span>{transactions.length} of 10 shown</span></div>
      {tableError && <p className="table-message error-text">{tableError}</p>}
      {!tableError && transactions.length === 0 && <p className="table-message">No transactions match the selected filters.</p>}
      {!tableError && transactions.length > 0 && <div className="table-scroll"><table><thead><tr><th>Transaction</th><th>Customer</th><th>Amount</th><th>Status</th><th>Failure reason</th><th>Created</th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id}><td>{transaction.id}</td><td><b>{transaction.customerName}</b><small>{transaction.customerId}</small></td><td>{formatCurrency(transaction.amount)}</td><td><span className={`table-status ${transaction.status.toLowerCase()}`}>{transaction.status}</span></td><td>{transaction.failureReason || '-'}</td><td>{new Date(transaction.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td></tr>)}</tbody></table></div>}
    </section>

    <section className="workspace">
      <ComplaintInput complaint={complaint} setComplaint={setComplaint} filters={filters} analyze={analyze} isLoading={isLoading} error={error} clearError={clearError} resetFilters={resetFilters} />
      <div className="results-panel">
        <div className="panel-label"><span>02</span> Analysis output</div>
        <AnalysisResult result={result} isLoading={isLoading} />
      </div>
    </section>

    <footer><span>LOCAL MOCK ENVIRONMENT</span><span>Read-only analysis layer</span><span>Data refreshed just now</span></footer>
  </main>
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export default App
