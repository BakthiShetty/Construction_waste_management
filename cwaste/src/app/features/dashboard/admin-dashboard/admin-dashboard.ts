import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { Router, RouterModule } from "@angular/router"
import { AdminService } from "../../../core/services/admin-service"
import { AuthService } from "../../../core/services/auth"
import { forkJoin } from "rxjs"
import { formatDistanceToNow } from 'date-fns';

interface DashboardStat {
  icon: string
  title: string
  value: number | string
  suffix?: string
  color: string
  loading: boolean
  trend?: {
    value: number
    direction: "up" | "down"
    period: string
  }
}

interface QuickAction {
  icon: string
  title: string
  description: string
  route: string
  primary?: boolean
  badge?: string
}

interface RecentActivity {
  id: number
  type: "user" | "material" | "request" | "auth"
  action: string
  user: string
  rawTimestamp: string
  status?: string
}

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./admin-dashboard.html",
  styleUrls: ["./admin-dashboard.scss"],
})
export class AdminDashboardComponent implements OnInit {
  totalUsers = 0
  totalMaterials = 0
  loading = true

  stats: DashboardStat[] = []
  quickActions: QuickAction[] = []
  recentActivities: RecentActivity[] = []

  activeUsers = 0
  availableMaterials = 0
  totalValue = 0

  activitiesPerPage = 4
  currentPage = 1

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeStats()
    this.initializeQuickActions()
  }

  ngOnInit(): void {
    this.loadDashboardData()
  }

  logout(): void {
    this.authService.logout()
    this.router.navigate(['/auth/login'])
  }

  private initializeStats(): void {
    this.stats = [
      {
        icon: "👥",
        title: "Total Users",
        value: 0,
        color: "blue",
        loading: true,
        trend: { value: 12, direction: "up", period: "this month" },
      },
      {
        icon: "📦",
        title: "Total Materials",
        value: 0,
        color: "green",
        loading: true,
        trend: { value: 8, direction: "up", period: "this week" },
      },
      {
        icon: "💰",
        title: "Total Value",
        value: 0,
        suffix: "",
        color: "indigo",
        loading: true,
      },
    ]
  }

  private initializeQuickActions(): void {
    this.quickActions = [
      {
        icon: "👥",
        title: "Manage Users",
        description: "View, edit, and manage user accounts",
        route: "/admin/users",
      },
      {
        icon: "📦",
        title: "Manage Materials",
        description: "Oversee posted materials and availability",
        route: "/admin/materials",
      },
      {
        icon: "📈",
        title: "Reports",
        description: "Generate comprehensive system reports",
        route: "/admin/reports",
      },
    ]
  }

  private loadDashboardData(): void {
    this.loading = true

    forkJoin({
      users: this.adminService.getData('users'),
      materials: this.adminService.getData('materials'),
      logs: this.adminService.getData('logs'),
    }).subscribe({
      next: ({ users, materials, logs }) => {
        const userList = users.data
        const materialList = materials.data
        this.totalUsers = userList.length
        this.totalMaterials = materialList.length

        this.activeUsers = userList.filter((u: any) => u.isActive).length
        this.availableMaterials = materialList.filter((m: any) => m.isAvailable).length
        this.totalValue = materialList.reduce((sum: number, m: any) => sum + m.price * m.quantity, 0)

        this.updateStats()

        this.recentActivities = logs.map((log: any) => ({
          id: log.id,
          type: this.inferActivityType(log.action),
          action: log.action,
          user: log.email,
          rawTimestamp: log.timestamp,
        }))

        this.loading = false
      },
      error: (err) => {
        console.error("Failed to load dashboard data:", err)
        this.loading = false
      },
    })
  }

  private updateStats(): void {
    this.stats[0].value = this.totalUsers
    this.stats[0].loading = false

    this.stats[1].value = this.totalMaterials
    this.stats[1].loading = false

    this.stats[2].value = this.formatCurrency(this.totalValue)
    this.stats[2].loading = false
  }

  // Pagination
  get paginatedActivities(): RecentActivity[] {
    const start = (this.currentPage - 1) * this.activitiesPerPage
    return this.recentActivities.slice(start, start + this.activitiesPerPage)
  }

  get totalPages(): number {
    return Math.ceil(this.recentActivities.length / this.activitiesPerPage)
  }

  changePage(direction: number): void {
    const newPage = this.currentPage + direction
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage
    }
  }

  getTimeAgo(utcTime: string): string {
    const date = new Date(utcTime)
    const local = new Date(date.getTime() + 5.5 * 60 * 60 * 1000)
    return formatDistanceToNow(local, { addSuffix: true })
  }

  private inferActivityType(action: string): "user" | "material" | "request" | "auth" {
    const a = action.toLowerCase()
    if (a.includes("login") || a.includes("logout") || a.includes("register")) return "auth"
    if (a.includes("user")) return "user"
    if (a.includes("material")) return "material"
    if (a.includes("request")) return "request"
    return "user"
  }

  getColorClasses(color: string): string {
    const colorMap: { [key: string]: string } = {
      blue: "text-blue-600",
      green: "text-green-600",
      purple: "text-purple-600",
      orange: "text-orange-600",
      emerald: "text-emerald-600",
      indigo: "text-indigo-600",
    }
    return colorMap[color] || "text-gray-600"
  }

  getProgressPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0
  }

  getActivityIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      user: "👤",
      material: "📦",
      request: "📋",
      auth: "🔐",
    }
    return iconMap[type] || "📄"
  }

  getActivityColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      user: "blue",
      material: "green",
      request: "purple",
      auth: "orange",
    }
    return colorMap[type] || "gray"
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  exportData(): void {
    console.log("Exporting dashboard data...")
  }

  viewAllActivities(): void {
    console.log("Viewing all activities...")
  }
}
