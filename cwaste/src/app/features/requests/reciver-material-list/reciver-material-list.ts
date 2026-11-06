import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { Router, RouterModule } from "@angular/router"
import  { MaterialService } from "../../../core/services/material"
import  { RequestService } from "../../../core/services/request"
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from "rxjs"

interface Material {
  id: number
  name: string
  description: string
  quantity: number
  location: string
  imageUrl?: string
  donorName?: string
  unit?: string
  type?: string
  isAvailable: boolean
  createdAt?: string
  price: number 
  requestStatus?: "pending" | "approved" | "rejected"
}

interface SortOption {
  value: string
  label: string
}

@Component({
  selector: "app-receiver-material-list",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./reciver-material-list.html",
  styleUrls: ["./reciver-material-list.scss"],
})
export class ReceiverMaterialListComponent implements OnInit, OnDestroy {
  // Data properties
  materials: Material[] = []
  filteredMaterials: Material[] = []
  loading = true
  requestedQuantities: { [id: number]: number } = {}
  isRequesting = false

  // Search and Filter properties
  searchQuery = ""
  selectedType = ""
  selectedLocation = ""
  minQuantity: number | null = null
  showFilters = false
  showSortMenu = false

  // View properties
  viewMode: "grid" | "list" = "grid"

  // Sort properties
  currentSort = "newest"
  sortOptions: SortOption[] = [
    { value: "quantity-high", label: "Highest Quantity" },
    { value: "quantity-low", label: "Lowest Quantity" },
    { value: "name-asc", label: "Name A-Z" },
    { value: "name-desc", label: "Name Z-A" },
  ]

  // Computed properties
  availableLocations: string[] = []
  activeFiltersCount = 0
  hasActiveFilters = false

  // Search debounce
  private searchSubject = new Subject<string>()
  private destroy$ = new Subject<void>()

  constructor(
    private materialService: MaterialService,
    private requestService: RequestService,
    private router : Router
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
      this.applyFilters()
    })
  }

  ngOnInit(): void {
    this.loadMaterials()
    this.setupClickOutsideListener()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  // Data loading
  
loadMaterials(): void {
  this.loading = true
  this.materialService.getAll().subscribe({
    next: (data: Material[]) => {
      this.materials = data
      this.applyFilters()     // <-- ADD THIS LINE!
      this.extractAvailableLocations()  // optional if using filters
      this.loading = false
    },
    error: (err) => {
      console.error("Error fetching materials:", err)
      this.loading = false
    },
  })
}

  
  // Extract unique locations for filter dropdown
  extractAvailableLocations(): void {
    const locations = [...new Set(this.materials.map((m) => m.location))]
    this.availableLocations = locations.filter((loc) => loc && loc.trim() !== "")
  }

  // Search functionality
  onSearch(): void {
    this.searchSubject.next(this.searchQuery)
  }

  clearSearch(): void {
    this.searchQuery = ""
    this.applyFilters()
  }

  // Filter functionality
  toggleFilters(): void {
    this.showFilters = !this.showFilters
    if (this.showSortMenu) this.showSortMenu = false
  }

  applyFilters(): void {
    let filtered = [...this.materials]

    // Apply search filter
    if (this.searchQuery && this.searchQuery.trim() !== "") {
      const query = this.searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (material) =>
          material.name.toLowerCase().includes(query) ||
          material.description.toLowerCase().includes(query) ||
          material.location.toLowerCase().includes(query) ||
          (material.donorName && material.donorName.toLowerCase().includes(query)),
      )
    }

    // Apply type filter
    if (this.selectedType) {
      filtered = filtered.filter(
        (material) => material.type && material.type.toLowerCase() === this.selectedType.toLowerCase(),
      )
    }

    // Apply location filter
    if (this.selectedLocation) {
      filtered = filtered.filter((material) => material.location === this.selectedLocation)
    }

    // Apply minimum quantity filter
    if (this.minQuantity !== null && this.minQuantity > 0) {
      filtered = filtered.filter((material) => material.quantity >= this.minQuantity!)
    }

    // Apply sorting
    filtered = this.sortMaterials(filtered)

    this.filteredMaterials = filtered
    this.updateActiveFiltersCount()
  }

  clearFilters(): void {
    this.selectedType = ""
    this.selectedLocation = ""
    this.minQuantity = null
    this.searchQuery = ""
    this.applyFilters()
  }

  updateActiveFiltersCount(): void {
    let count = 0
    if (this.searchQuery && this.searchQuery.trim() !== "") count++
    if (this.selectedType) count++
    if (this.selectedLocation) count++
    if (this.minQuantity !== null && this.minQuantity > 0) count++

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

  sortMaterials(materials: Material[]): Material[] {
    return materials.sort((a, b) => {
      switch (this.currentSort) {
        // case "newest":
        //   return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
        // case "oldest":
        //   return new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime()
        case "quantity-high":
          return b.quantity - a.quantity
        case "quantity-low":
          return a.quantity - b.quantity
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        // case "location":
        //   return a.location.localeCompare(b.location)
        default:
          return 0
      }
    })
  }

  // View functionality
  setViewMode(mode: "grid" | "list"): void {
    this.viewMode = mode
  }

  // Request functionality
  requestMaterial(material: Material): void {
    const quantity = this.requestedQuantities[material.id]

    if (!quantity || quantity < 1) {
      this.showNotification("Please enter a valid quantity", "error")
      return
    }

    if (quantity > material.quantity) {
      this.showNotification(`Requested quantity cannot exceed available quantity (${material.quantity})`, "error")
      return
    }

    this.isRequesting = true

    this.requestService
      .create({
        materialId: material.id,
        quantity,
      })
      .subscribe({
        next: () => {
          this.showNotification(
            `Successfully requested ${quantity} ${material.unit || "units"} of ${material.name}`,
            "success",
          )
          this.requestedQuantities[material.id] = 0
          this.isRequesting = false

          // Update material quantity locally
          const materialIndex = this.materials.findIndex((m) => m.id === material.id)
          if (materialIndex !== -1) {
            this.materials[materialIndex].quantity -= quantity
            if (this.materials[materialIndex].quantity === 0) {
              this.materials[materialIndex].isAvailable = false
            }
          }
          this.applyFilters()
        },
        error: (err) => {
          console.error("Failed to request material", err)
          this.showNotification("Failed to request material. Please try again.", "error")
          this.isRequesting = false
        },
      })
  }

  // Utility functions
  trackByMaterialId(index: number, material: Material): number {
    return material.id
  }

  getStatusText(status: string): string {
    switch (status) {
      case "pending":
        return "Request Pending"
      case "approved":
        return "Request Approved"
      case "rejected":
        return "Request Rejected"
      default:
        return "Unknown Status"
    }
  }

  onImageError(event: any): void {
    event.target.src = "/placeholder.svg?height=200&width=300"
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
    return this.filteredMaterials.length > 0
  }

  get hasNoResults(): boolean {
    return !this.loading && this.filteredMaterials.length === 0 && this.materials.length > 0
  }

  get isEmpty(): boolean {
    return !this.loading && this.materials.length === 0
  }

  // Method to get placeholder image URL
  getPlaceholderImage(width = 300, height = 200): string {
    return `/placeholder.svg?height=${height}&width=${width}`
  }

  // Method to format quantity display
  formatQuantity(quantity: number, unit?: string): string {
    return `${quantity} ${unit || "units"}`
  }

  // Method to check if material is requestable
  isRequestable(material: Material): boolean {
    return material.isAvailable && material.quantity > 0
  }

  // Method to get request button text
  getRequestButtonText(): string {
    return this.isRequesting ? "Requesting..." : "Send Request"
  }

  // Method to validate request quantity
    isValidRequestQuantity(materialId: number, maxQuantity: number): boolean {
      const quantity = this.requestedQuantities[materialId] ?? 0;
      return quantity > 0 && quantity <= maxQuantity;
    }
      goBack(): void {
    this.router.navigate(["/dashboard/receiver"])
  }
}
