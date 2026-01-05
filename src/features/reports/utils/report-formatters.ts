import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import type { ReportType, ReportFilters } from '../types'
import type { Beneficiary, Program, Donation, Grant, Partner, Project, Event } from '@/types'

interface ReportData {
  beneficiaries: Beneficiary[]
  programs: Program[]
  donations: Donation[]
  grants: Grant[]
  partners: Partner[]
  projects: Project[]
  events: Event[]
  metrics: {
    totalBeneficiaries: number
    totalPrograms: number
    totalDonations: number
    totalGrants: number
    totalFunding: number
    totalPartners: number
    totalProjects: number
    programStatusCounts: Record<string, number>
    beneficiariesByState: Record<string, number>
  }
}

export function formatReportContent(
  type: ReportType,
  data: ReportData,
  filters: ReportFilters
): string {
  switch (type) {
    case 'beneficiaries':
      return formatBeneficiariesReport(data, filters)
    case 'programs':
      return formatProgramsReport(data, filters)
    case 'donations':
      return formatDonationsReport(data, filters)
    case 'grants':
      return formatGrantsReport(data, filters)
    case 'financial':
      return formatFinancialReport(data, filters)
    case 'impact':
      return formatImpactReport(data, filters)
    case 'comprehensive':
      return formatComprehensiveReport(data, filters)
    default:
      return formatComprehensiveReport(data, filters)
  }
}

function formatBeneficiariesReport(data: ReportData, _filters: ReportFilters): string {
  const beneficiaries = data.beneficiaries || []
  const totalBeneficiaries = data.metrics?.totalBeneficiaries || 0
  const beneficiariesByState = data.metrics?.beneficiariesByState || {}

  let html = `
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="metric-card">
        <div class="metric-label">Total Beneficiaries</div>
        <div class="metric-value">${totalBeneficiaries.toLocaleString()}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Beneficiaries by State</div>
      <table>
        <thead>
          <tr>
            <th>State</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${Object.keys(beneficiariesByState).length > 0
            ? Object.entries(beneficiariesByState)
                .map(([state, count]) => {
                  const percentage = totalBeneficiaries > 0
                    ? ((count / totalBeneficiaries) * 100).toFixed(1)
                    : '0.0'
                  return `
                <tr>
                  <td>${state}</td>
                  <td>${count.toLocaleString()}</td>
                  <td>${percentage}%</td>
                </tr>
              `
                })
                .join('')
            : '<tr><td colspan="3">No data available</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Beneficiary Details</div>
      ${beneficiaries.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Gender</th>
            <th>Date of Birth</th>
            <th>State</th>
            <th>LGA</th>
            <th>Programs</th>
            <th>Amount Spent</th>
          </tr>
        </thead>
        <tbody>
          ${beneficiaries
            .slice(0, 100) // Limit to first 100 for PDF
            .map(
              (b) => `
            <tr>
              <td>${(b.firstName || '')} ${(b.lastName || '')}</td>
              <td>${b.gender || 'N/A'}</td>
              <td>${b.dateOfBirth ? format(b.dateOfBirth, 'MMM dd, yyyy') : 'N/A'}</td>
              <td>${b.address?.state || 'N/A'}</td>
              <td>${b.address?.lga || 'N/A'}</td>
              <td>${b.programParticipations?.length || 0}</td>
              <td>${formatCurrency(b.amountSpent || 0)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      ${beneficiaries.length > 100
        ? `<p><em>Showing first 100 of ${beneficiaries.length} beneficiaries</em></p>`
        : ''}
      ` : '<p>No beneficiaries found for the selected filters.</p>'}
    </div>
  `
  return html
}

function formatProgramsReport(data: ReportData, _filters: ReportFilters): string {
  const programs = data.programs || []
  const totalPrograms = data.metrics?.totalPrograms || 0
  const programStatusCounts = data.metrics?.programStatusCounts || {}

  let html = `
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="metric-card">
        <div class="metric-label">Total Programs</div>
        <div class="metric-value">${totalPrograms}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Program Status Distribution</div>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${Object.keys(programStatusCounts).length > 0
            ? Object.entries(programStatusCounts)
                .map(([status, count]) => {
                  const percentage = totalPrograms > 0
                    ? ((count / totalPrograms) * 100).toFixed(1)
                    : '0.0'
                  return `
                <tr>
                  <td>${status.charAt(0).toUpperCase() + status.slice(1)}</td>
                  <td>${count}</td>
                  <td>${percentage}%</td>
                </tr>
              `
                })
                .join('')
            : '<tr><td colspan="3">No data available</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Program Details</div>
      ${programs.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Budget</th>
            <th>Beneficiaries</th>
          </tr>
        </thead>
        <tbody>
          ${programs
            .map(
              (p) => `
            <tr>
              <td>${p.title || 'N/A'}</td>
              <td>${p.type || 'N/A'}</td>
              <td>${p.startDate ? format(p.startDate, 'MMM dd, yyyy') : 'N/A'}</td>
              <td>${p.endDate ? format(p.endDate, 'MMM dd, yyyy') : 'Ongoing'}</td>
              <td>${p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'N/A'}</td>
              <td>${formatCurrency(p.budget?.allocated || 0)}</td>
              <td>${p.actualBeneficiaries || 0}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      ` : '<p>No programs found for the selected filters.</p>'}
    </div>
  `
  return html
}

function formatDonationsReport(data: ReportData, _filters: ReportFilters): string {
  const donations = data.donations || []
  const totalAmount = data.metrics?.totalDonations || 0

  let html = `
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="metric-card">
        <div class="metric-label">Total Donations</div>
        <div class="metric-value">${formatCurrency(totalAmount)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Number of Donations</div>
        <div class="metric-value">${donations.length}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Donation Details</div>
      <table>
        <thead>
          <tr>
            <th>Donor</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Payment Method</th>
            <th>Program</th>
            <th>Receipt #</th>
          </tr>
        </thead>
        <tbody>
          ${donations.length > 0
            ? donations
                .map(
                  (d) => `
              <tr>
                <td>${d.donorName || 'N/A'}</td>
                <td>${d.donationDate ? format(d.donationDate, 'MMM dd, yyyy') : 'N/A'}</td>
                <td>${formatCurrency(d.amount || 0)}</td>
                <td>${d.paymentMethod ? d.paymentMethod.replace('_', ' ') : 'N/A'}</td>
                <td>${d.programName || 'Unassigned'}</td>
                <td>${d.receiptNumber || 'N/A'}</td>
              </tr>
            `
                )
                .join('')
            : '<tr><td colspan="6">No donations found for the selected filters.</td></tr>'}
        </tbody>
      </table>
    </div>
  `
  return html
}

function formatGrantsReport(data: ReportData, _filters: ReportFilters): string {
  const grants = data.grants || []
  const totalAmount = data.metrics?.totalGrants || 0

  let html = `
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="metric-card">
        <div class="metric-label">Total Grants</div>
        <div class="metric-value">${formatCurrency(totalAmount)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Number of Grants</div>
        <div class="metric-value">${grants.length}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Grant Details</div>
      ${grants.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Grantor</th>
            <th>Grant Name</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Amount</th>
            <th>Purpose</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${grants
            .map(
              (g) => `
            <tr>
              <td>${g.grantor || 'N/A'}</td>
              <td>${g.grantName || 'N/A'}</td>
              <td>${g.startDate ? format(g.startDate, 'MMM dd, yyyy') : 'N/A'}</td>
              <td>${g.endDate ? format(g.endDate, 'MMM dd, yyyy') : 'N/A'}</td>
              <td>${formatCurrency(g.amount || 0)}</td>
              <td>${g.purpose || 'N/A'}</td>
              <td>${g.status ? g.status.charAt(0).toUpperCase() + g.status.slice(1) : 'N/A'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      ` : '<p>No grants found for the selected filters.</p>'}
    </div>
  `
  return html
}

function formatFinancialReport(data: ReportData, _filters: ReportFilters): string {
  const donations = data.donations || []
  const grants = data.grants || []
  const totalFunding = data.metrics?.totalFunding || 0
  const totalDonations = data.metrics?.totalDonations || 0
  const totalGrants = data.metrics?.totalGrants || 0

  let html = `
    <div class="section">
      <div class="section-title">Financial Overview</div>
      <div class="metric-card">
        <div class="metric-label">Total Funding</div>
        <div class="metric-value">${formatCurrency(totalFunding)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Donations</div>
        <div class="metric-value">${formatCurrency(totalDonations)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Grants</div>
        <div class="metric-value">${formatCurrency(totalGrants)}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Donations Summary</div>
      ${donations.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Donor</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Program</th>
          </tr>
        </thead>
        <tbody>
          ${donations
            .slice(0, 50)
            .map(
              (d) => `
            <tr>
              <td>${d.donorName || 'N/A'}</td>
              <td>${formatCurrency(d.amount || 0)}</td>
              <td>${d.donationDate ? format(d.donationDate, 'MMM dd, yyyy') : 'N/A'}</td>
              <td>${d.programName || 'Unassigned'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      ` : '<p>No donations found for the selected filters.</p>'}
    </div>

    <div class="section">
      <div class="section-title">Grants Summary</div>
      ${grants.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Grantor</th>
            <th>Grant Name</th>
            <th>Amount</th>
            <th>Start Date</th>
            <th>End Date</th>
          </tr>
        </thead>
        <tbody>
          ${grants
            .map(
              (g) => `
            <tr>
              <td>${g.grantor || 'N/A'}</td>
              <td>${g.grantName || 'N/A'}</td>
              <td>${formatCurrency(g.amount || 0)}</td>
              <td>${g.startDate ? format(g.startDate, 'MMM dd, yyyy') : 'N/A'}</td>
              <td>${g.endDate ? format(g.endDate, 'MMM dd, yyyy') : 'N/A'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      ` : '<p>No grants found for the selected filters.</p>'}
    </div>
  `
  return html
}

function formatImpactReport(data: ReportData, _filters: ReportFilters): string {
  const programs = data.programs || []
  const metrics = data.metrics || {
    totalBeneficiaries: 0,
    totalFunding: 0,
    programStatusCounts: {},
  }
  const programStatusCounts = metrics.programStatusCounts || {}

  let html = `
    <div class="section">
      <div class="section-title">Impact Metrics</div>
      <div class="metric-card">
        <div class="metric-label">Total Beneficiaries Served</div>
        <div class="metric-value">${(metrics.totalBeneficiaries || 0).toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Active Programs</div>
        <div class="metric-value">${programStatusCounts['active'] || 0}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Funding</div>
        <div class="metric-value">${formatCurrency(metrics.totalFunding || 0)}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Program Impact</div>
      ${programs.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Program</th>
            <th>Type</th>
            <th>Beneficiaries</th>
            <th>Budget</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${programs
            .map(
              (p) => `
            <tr>
              <td>${p.title || 'N/A'}</td>
              <td>${p.type || 'N/A'}</td>
              <td>${p.actualBeneficiaries || 0}</td>
              <td>${formatCurrency(p.budget?.allocated || 0)}</td>
              <td>${p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'N/A'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      ` : '<p>No programs found for the selected filters.</p>'}
    </div>
  `
  return html
}

function formatComprehensiveReport(data: ReportData, filters: ReportFilters): string {
  const events = data.events || []
  const metrics = data.metrics || {
    totalBeneficiaries: 0,
    totalPrograms: 0,
    totalFunding: 0,
    totalPartners: 0,
    totalProjects: 0,
  }

  let html = `
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0;">
        <div class="metric-card">
          <div class="metric-label">Total Beneficiaries</div>
          <div class="metric-value">${metrics.totalBeneficiaries?.toLocaleString() || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Programs</div>
          <div class="metric-value">${metrics.totalPrograms || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Funding</div>
          <div class="metric-value">${formatCurrency(metrics.totalFunding || 0)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Partners</div>
          <div class="metric-value">${metrics.totalPartners || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Projects</div>
          <div class="metric-value">${metrics.totalProjects || 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Events</div>
          <div class="metric-value">${events.length || 0}</div>
        </div>
      </div>
    </div>
  `

  // Add sections from other reports
  html += formatBeneficiariesReport(data, filters)
  html += formatProgramsReport(data, filters)
  html += formatFinancialReport(data, filters)

  return html
}

