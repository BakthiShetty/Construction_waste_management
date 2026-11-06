import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { FormsModule } from "@angular/forms"
import { AdminService } from "../../../core/services/admin-service"
import { Router } from "@angular/router"

export interface Donor {
  userName: string
  email: string
}

export interface Material {
  id: number
  name: string
  type: string
  quantity: number
  location: string
  donorEmail: string
  donorName : string
}

@Component({
  selector: "app-material-list",
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: "./material-list.html",
  styleUrls: ["./material-list.scss"],
})
export class MaterialListComponent implements OnInit {
  materials: Material[] = []
  loading = true
  error: string | null = null
  searchTerm = ""
  processingMaterialId: number | null = null

  currentPage: number = 1
  itemsPerPage: number = 4
  totalCount: number = 0

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchMaterials()
  }

  fetchMaterials(): void {
    this.loading = true
    this.error = null

    this.adminService.getData("materials", this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        this.materials = response.data
        this.totalCount = response.totalCount
        this.loading = false
      },
      error: (err) => {
        this.error = "Failed to load materials. Please try again."
        this.loading = false
        console.error("Error fetching materials:", err)
      },
    })
  }

  deleteMaterial(id: number): void {
    const material = this.materials.find((m) => m.id === id)
    const confirmDelete = confirm(`Are you sure you want to delete "${material?.name}"? This action cannot be undone.`)

    if (!confirmDelete) return

    this.processingMaterialId = id

    this.adminService.deleteMaterial(id).subscribe({
      next: () => {
        this.materials = this.materials.filter((m) => m.id !== id)
        this.processingMaterialId = null
      },
      error: (err) => {
        alert("Failed to delete material. Please try again.")
        this.processingMaterialId = null
        console.error("Error deleting material:", err)
      },
    })
  }

  get paginatedMaterials(): Material[] {
    return this.getFilteredMaterials()
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.itemsPerPage)
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.fetchMaterials()
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.fetchMaterials()
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      this.fetchMaterials()
    }
  }

  getFilteredMaterials(): Material[] {
    if (!this.searchTerm.trim()) {
      return this.materials
    }

    const searchLower = this.searchTerm.toLowerCase()
    return this.materials.filter((material) => {
      return (
        material.name.toLowerCase().includes(searchLower) ||
        material.type.toLowerCase().includes(searchLower) ||
        material.location.toLowerCase().includes(searchLower) ||
        (material.donorEmail.toLowerCase().includes(searchLower)) ||
        (material.donorName.toLowerCase().includes(searchLower))
        
      )
    })
  }

  isProcessing(materialId: number): boolean {
    return this.processingMaterialId === materialId
  }

  clearSearch(): void {
    this.searchTerm = ""
    this.currentPage = 1
    this.fetchMaterials()
  }

  refreshMaterials(): void {
    this.currentPage = 1
    this.fetchMaterials()
  }

  getTypeDisplayName(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  goBack(): void {
    this.router.navigate(["/dashboard/admin"])
  }
}
