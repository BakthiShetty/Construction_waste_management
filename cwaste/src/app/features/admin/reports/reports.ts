import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import  { Router } from "@angular/router"
import { AdminService } from "../../../core/services/admin-service"

interface ReportType {
  type: "users" | "materials" | "logs"
  title: string
  description: string
  icon: string
  lastGenerated?: string
  recordCount?: number
}

@Component({
  selector: "app-reports",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./reports.html",
  styleUrls: ["./reports.scss"],
})
export class ReportsComponent implements OnInit {
  loading = false
  error: string | null = null
  successMessage: string | null = null
  processingReports = new Set<string>()

  reportTypes: ReportType[] = [
    {
      type: "users",
      title: "Users Report",
      description: "Comprehensive report of all registered users, their roles, and activity status",
      icon: "👥",
      recordCount: 0,
    },
    {
      type: "materials",
      title: "Materials Report",
      description: "Detailed inventory report of all donated materials, quantities, and locations",
      icon: "📦",
      recordCount: 0,
    },
    {
      type: "logs",
      title: "System Logs Report",
      description: "Activity logs, system events, and audit trail for administrative purposes",
      icon: "📋",
      recordCount: 0,
    },
  ]

  constructor(
    private adminService: AdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadReportData()
  }

  goBack(): void {
    this.router.navigate(["/dashboard/admin"])
  }

  refreshReports(): void {
    this.loadReportData()
  }

  private loadReportData(): void {
    this.loading = true
    this.error = null

    // Simulate loading report metadata
    setTimeout(() => {
      try {
        // In a real app, you would fetch this data from your service
        this.reportTypes = this.reportTypes.map((report) => ({
          ...report,
          lastGenerated: this.getRandomDate(),
          recordCount: Math.floor(Math.random() * 1000) + 50,
        }))

        this.loading = false
      } catch (err) {
        this.error = "Failed to load report data. Please try again."
        this.loading = false
      }
    }, 1000)
  }

  downloadPdf(type: "users" | "materials" | "logs"): void {
    this.processingReports.add(type)
    this.clearMessages()

    this.adminService.exportToPdf(type).subscribe({
      next: (blob: Blob) => {
        const fileName = `${type}-report-${this.getCurrentDate()}.pdf`
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        this.processingReports.delete(type)
        this.showSuccessMessage(`${this.getReportTitle(type)} downloaded successfully!`)
        this.updateLastGenerated(type)
      },
      error: (err) => {
        console.error(`Failed to download ${type} report:`, err)
        this.processingReports.delete(type)
        this.error = `Failed to download ${this.getReportTitle(type)}. Please try again.`
      },
    })
  }

  isProcessing(type: string): boolean {
    return this.processingReports.has(type)
  }

  private getReportTitle(type: string): string {
    const report = this.reportTypes.find((r) => r.type === type)
    return report ? report.title : "Report"
  }

  private updateLastGenerated(type: string): void {
    const reportIndex = this.reportTypes.findIndex((r) => r.type === type)
    if (reportIndex !== -1) {
      this.reportTypes[reportIndex].lastGenerated = "Just now"
    }
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split("T")[0]
  }

  private getRandomDate(): string {
    const dates = ["2 hours ago", "1 day ago", "3 days ago", "1 week ago", "Never"]
    return dates[Math.floor(Math.random() * dates.length)]
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message
    setTimeout(() => {
      this.successMessage = null
    }, 4000)
  }

  private clearMessages(): void {
    this.error = null
    this.successMessage = null
  }
}
