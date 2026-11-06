import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { Router, RouterModule } from "@angular/router"
import  { RequestService } from "../../../core/services/request"
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from "rxjs"

interface Material {
  id: number
  name: string
  location: string
  donorName?: string
  unit?: string
}

interface StatusHistory {
  status: string
  date: string
  notes?: string
}

interface Request {
  id: number
  material: Material
  quantity: number
  status: "Pending" | "Approved" | "Completed" | "Cancelled" | "Rejected"
  requestedOn: string
  notes?: string
  statusHistory?: StatusHistory[]
}

interface SortOption {
  value: string
  label: string
}

interface StatusSummary {
  key: string
  label: string
  count: number
}

@Component({
  selector: "app-request-list",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./request-list.html",
  styleUrls: ["./request-list.scss"],
})
export class RequestListComponent implements OnInit, OnDestroy {
  // Data properties
  requests: Request[] = []
  filteredRequests: Request[] = []
  loading = true
  isDeleting = false

  // Search and Filter properties
  searchText = ""
  selectedStatus = ""
  selectedLocation = ""
  filterDate = "all"
  showFilters = false
  showSortMenu = false

  // Sort properties
  currentSort = "newest"
  sortOptions: SortOption[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "status", label: "By Status" },
    { value: "material", label: "By Material Name" },
    { value: "quantity", label: "By Quantity" },
  ]

  // Computed properties
  availableLocations: string[] = []
  activeFiltersCount = 0
  hasActiveFilters = false
  statusSummary: StatusSummary[] = []

  // UI state
  confirmDeleteId: number | null = null
  expandedTimelines = new Set<number>()

  // Search debounce
  private searchSubject = new Subject<string>()
  private destroy$ = new Subject<void>()

  constructor(private requestService: RequestService, private router: Router) {
    // Setup search debouncing
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
      this.applyFilters()
    })
  }

  ngOnInit(): void {
    this.loadRequests()
    this.setupClickOutsideListener()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  // Data loading
  loadRequests(): void {
    this.loading = true
    this.requestService.getMyRequests().subscribe({
      next: (res: Request[]) => {
        this.requests = res
        this.extractAvailableLocations()
        this.calculateStatusSummary()
        this.applyFilters()
        this.loading = false
      },
      error: (err) => {
        console.error("Error loading requests", err)
        this.showNotification("Failed to load requests", "error")
        this.loading = false
      },
    })
  }

  // Extract unique locations for filter dropdown
  extractAvailableLocations(): void {
    const locations = [...new Set(this.requests.map((r) => r.material.location))]
    this.availableLocations = locations.filter((loc) => loc && loc.trim() !== "")
  }

  // Calculate status summary
  calculateStatusSummary(): void {
    const statusCounts = this.requests.reduce(
      (acc, request) => {
        acc[request.status] = (acc[request.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    this.statusSummary = [
      { key: "Pending", label: "Pending", count: statusCounts["Pending"] || 0 },
      { key: "Approved", label: "Approved", count: statusCounts["Approved"] || 0 },
      { key: "Completed", label: "Completed", count: statusCounts["Completed"] || 0 },
      { key: "Cancelled", label: "Cancelled", count: statusCounts["Cancelled"] || 0 },
      { key: "Declined", label: "Declined", count: statusCounts["Declined"] || 0 },
    ].filter((status) => status.count > 0)
  }

  // Search functionality
  onSearch(): void {
    this.searchSubject.next(this.searchText)
  }

  clearSearch(): void {
    this.searchText = ""
    this.applyFilters()
  }

  // Filter functionality
  toggleFilters(): void {
    this.showFilters = !this.showFilters
    if (this.showSortMenu) this.showSortMenu = false
  }

  applyFilters(): void {
    let filtered = [...this.requests]

    // Apply search filter
    if (this.searchText && this.searchText.trim() !== "") {
      const query = this.searchText.toLowerCase().trim()
      filtered = filtered.filter(
        (request) =>
          request.material.name.toLowerCase().includes(query) ||
          request.material.location.toLowerCase().includes(query) ||
          (request.material.donorName && request.material.donorName.toLowerCase().includes(query)) ||
          (request.notes && request.notes.toLowerCase().includes(query)),
      )
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter((request) => request.status === this.selectedStatus)
    }

    // Apply location filter
    if (this.selectedLocation) {
      filtered = filtered.filter((request) => request.material.location === this.selectedLocation)
    }

    // Apply date filter
    if (this.filterDate !== "all") {
      const now = new Date()
      filtered = filtered.filter((request) => {
        const requestedDate = new Date(request.requestedOn)
        const daysDiff = (now.getTime() - requestedDate.getTime()) / (1000 * 60 * 60 * 24)

        switch (this.filterDate) {
          case "today":
            return requestedDate.toDateString() === now.toDateString()
          case "last7":
            return daysDiff <= 7
          case "last30":
            return daysDiff <= 30
          case "last90":
            return daysDiff <= 90
          default:
            return true
        }
      })
    }

    // Apply sorting
    filtered = this.sortRequests(filtered)

    this.filteredRequests = filtered
    this.updateActiveFiltersCount()
  }

  clearFilters(): void {
    this.selectedStatus = ""
    this.selectedLocation = ""
    this.filterDate = "all"
    this.searchText = ""
    this.applyFilters()
  }

  updateActiveFiltersCount(): void {
    let count = 0
    if (this.searchText && this.searchText.trim() !== "") count++
    if (this.selectedStatus) count++
    if (this.selectedLocation) count++
    if (this.filterDate !== "all") count++

    this.activeFiltersCount = count
    this.hasActiveFilters = count > 0
  }

  // Sort functionality
  toggleSortMenu(): void {
    this.showSortMenu = !this.showSortMenu
    if (this.showFilters) this.showFilters = false
  }

  setSortOption(option: SortOption): void {
    this.currentSort = option.value
    this.showSortMenu = false
    this.applyFilters()
  }

  sortRequests(requests: Request[]): Request[] {
    return requests.sort((a, b) => {
      switch (this.currentSort) {
        case "newest":
          return new Date(b.requestedOn).getTime() - new Date(a.requestedOn).getTime()
        case "oldest":
          return new Date(a.requestedOn).getTime() - new Date(b.requestedOn).getTime()
        case "status":
          return a.status.localeCompare(b.status)
        case "material":
          return a.material.name.localeCompare(b.material.name)
        case "location":
          return a.material.location.localeCompare(b.material.location)
        case "quantity":
          return b.quantity - a.quantity
        default:
          return 0
      }
    })
  }

  // Request management
  viewRequestDetails(request: Request): void {
    // Navigate to request details page or open modal
    console.log("View request details:", request)
  }

  editRequest(request: Request): void {
    // Navigate to edit request page or open modal
    console.log("Edit request:", request)
  }

  canEditRequest(request: Request): boolean {
    return request.status === "Pending"
  }

  canDeleteRequest(request: Request): boolean {
    return request.status === "Pending" || request.status === "Cancelled" || request.status === "Rejected"
  }

  // Delete functionality
  askDelete(id: number): void {
    this.confirmDeleteId = id
  }

  cancelDelete(): void {
    this.confirmDeleteId = null
  }

  confirmDelete(id: number): void {
    this.isDeleting = true

    this.requestService.deleteRequest(id).subscribe({
      next: () => {
        this.requests = this.requests.filter((r) => r.id !== id)
        this.calculateStatusSummary()
        this.applyFilters()
        this.confirmDeleteId = null
        this.isDeleting = false
        this.showNotification("Request deleted successfully", "success")
      },
      error: (err) => {
        console.error("Failed to delete request", err)
        this.showNotification("Failed to delete request", "error")
        this.isDeleting = false
      },
    })
  }

  // Timeline functionality
  toggleTimeline(requestId: number): void {
    if (this.expandedTimelines.has(requestId)) {
      this.expandedTimelines.delete(requestId)
    } else {
      this.expandedTimelines.add(requestId)
    }
  }

  // Utility functions
  trackByRequestId(index: number, request: Request): number {
    return request.id
  }
    goBack(): void {
    this.router.navigate(["/dashboard/receiver"])
  }

  private showNotification(message: string, type: "success" | "error"): void {
    // You can implement a proper notification service here
    // For now, using alert as fallback
    alert(message)
  }

  private setupClickOutsideListener(): void {
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement

      // Close filter panel if clicking outside
      if (this.showFilters && !target.closest(".filter-container") && !target.closest(".filter-panel")) {
        this.showFilters = false
      }

      // Close sort menu if clicking outside
      if (this.showSortMenu && !target.closest(".sort-btn") && !target.closest(".sort-menu")) {
        this.showSortMenu = false
      }
    })
  }

  // Additional helper methods for template
  get hasResults(): boolean {
    return this.filteredRequests.length > 0
  }

  get hasNoResults(): boolean {
    return !this.loading && this.filteredRequests.length === 0 && this.requests.length > 0
  }

  get isEmpty(): boolean {
    return !this.loading && this.requests.length === 0
  }
}
