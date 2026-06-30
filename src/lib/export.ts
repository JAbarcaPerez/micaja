import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Transaction, Category, Account } from '@/types'
import { formatCurrency, formatDate, getTransactionTypeLabel } from '@/lib/format'

interface ExportRow {
  Fecha: string
  Tipo: string
  Descripción: string
  Categoría: string
  Cuenta: string
  Monto: number
}

function buildExportRows(
  transactions: Transaction[],
  categoryMap: Map<number, Category>,
  accountMap: Map<number, Account>
): ExportRow[] {
  return transactions.map((tx) => ({
    Fecha: formatDate(tx.date),
    Tipo: getTransactionTypeLabel(tx.type),
    Descripción: tx.description,
    Categoría: categoryMap.get(tx.categoryId)?.name ?? '—',
    Cuenta: accountMap.get(tx.accountId)?.name ?? '—',
    Monto: tx.amount,
  }))
}

export function exportToCSV(
  transactions: Transaction[],
  categoryMap: Map<number, Category>,
  accountMap: Map<number, Account>,
  filename = 'micaja-movimientos.csv'
): void {
  const rows = buildExportRows(transactions, categoryMap, accountMap)
  const headers = ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Cuenta', 'Monto']
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      [row.Fecha, row.Tipo, `"${row.Descripción}"`, row.Categoría, row.Cuenta, row.Monto].join(',')
    ),
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

export function exportToExcel(
  transactions: Transaction[],
  categoryMap: Map<number, Category>,
  accountMap: Map<number, Account>,
  filename = 'micaja-movimientos.xlsx'
): void {
  const rows = buildExportRows(transactions, categoryMap, accountMap)
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos')
  XLSX.writeFile(workbook, filename)
}

export function exportToPDF(
  transactions: Transaction[],
  categoryMap: Map<number, Category>,
  accountMap: Map<number, Account>,
  title = 'Reporte de Movimientos - MiCaja',
  filename = 'micaja-reporte.pdf'
): void {
  const doc = new jsPDF()
  const rows = buildExportRows(transactions, categoryMap, accountMap)

  doc.setFontSize(18)
  doc.text(title, 14, 22)
  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 30)

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  doc.text(`Ingresos: ${formatCurrency(totalIncome)}`, 14, 38)
  doc.text(`Gastos: ${formatCurrency(totalExpenses)}`, 14, 44)
  doc.text(`Balance: ${formatCurrency(totalIncome - totalExpenses)}`, 14, 50)

  autoTable(doc, {
    startY: 58,
    head: [['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Cuenta', 'Monto']],
    body: rows.map((r) => [r.Fecha, r.Tipo, r.Descripción, r.Categoría, r.Cuenta, formatCurrency(r.Monto)]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 163, 74] },
  })

  doc.save(filename)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
