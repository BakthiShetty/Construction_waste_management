import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { RouterModule } from "@angular/router"
import  { MaterialService } from "../../../core/services/material"
import  { SignalRService } from "../../../core/services/signalr"
import  { ActivatedRoute, Router } from "@angular/router"
import { StatusBadgeComponent } from "../../../shared/status-badge/status-badge"

interface Material {
  id: number
  name: string
  type: string
  description: string
  quantity: number
  price: number
  location: string
  imageUrl: string
  postedDate: string
  isAvailable: boolean
  donorId: string
  donorName?: string
  unit?: string
}

@Component({
  selector: "app-material-list",
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, RouterModule],
  templateUrl: "./material-list.html",
  styleUrls: ["./material-list.scss"],
})
export class MaterialListComponent implements OnInit {
  materials: Material[] = []
  loading = true
  isMineView = false
  editingMaterialId: number | null = null
  editedQuantity = 0
  editedPrice = 0
  confirmDeleteId: number | null = null
  isUpdating = false
  isDeleting = false

  // Image handling
  selectedFile: File | null = null
  imagePreview: string | null = null
  isUploadingImage = false

  constructor(
    private materialService: MaterialService,
    private signalR: SignalRService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isMineView = this.route.snapshot.routeConfig?.path === "mine"
    this.loadMaterials()
  }

  private loadMaterials(): void {
    this.loading = true
    const loader = this.isMineView ? this.materialService.getMyMaterials() : this.materialService.getAll()

    loader.subscribe({
      next: (res: Material[]) => {
        this.materials = res
        this.loading = false
      },
      error: (err) => {
        console.error("Failed to load materials:", err)
        this.showNotification("Failed to load materials", "error")
        this.loading = false
      },
    })
  }

  // Edit functionality
  startEdit(material: Material): void {
    this.editingMaterialId = material.id
    this.editedQuantity = material.quantity
    this.editedPrice = material.price
    this.selectedFile = null
    this.imagePreview = null
  }

  cancelEdit(): void {
    this.editingMaterialId = null
    this.selectedFile = null
    this.imagePreview = null
  }

saveEdit(material: Material): void {
  if (this.editedQuantity < 0 || this.editedPrice < 0) {
    this.showNotification("Quantity and price must be non-negative", "error")
    return
  }

  this.isUpdating = true

  const formData = new FormData()
  formData.append("name", material.name || '')
  formData.append("type", material.type || '')
  formData.append("description", material.description || '')
  formData.append("quantity", this.editedQuantity.toString())
  formData.append("price", this.editedPrice.toString())
  formData.append("location", material.location || '')

  if (this.selectedFile) {
    formData.append("image", this.selectedFile)
  }

  this.materialService.updateMaterial(material.id, formData).subscribe({
    next: () => {
      material.quantity = this.editedQuantity
      material.price = this.editedPrice
      if (this.selectedFile && this.imagePreview) {
        material.imageUrl = this.imagePreview
      }

      this.editingMaterialId = null
      this.selectedFile = null
      this.imagePreview = null
      this.isUpdating = false
      this.showNotification("Material updated successfully", "success")
    },
    error: (err) => {
      console.error("Failed to update:", err)
      this.showNotification("Failed to update material", "error")
      this.isUpdating = false
    },
  })
}

 private updateMaterial(material: Material, imageUrl: string): void {
  const formData = new FormData();
  formData.append("id", material.id.toString());
  formData.append("name", material.name || '');
  formData.append("type", material.type || '');
  formData.append("description", material.description || '');
  formData.append("quantity", this.editedQuantity.toString());
  formData.append("price", this.editedPrice.toString());
  formData.append("location", material.location || '');
  formData.append("imageUrl", imageUrl || '');

  if (this.selectedFile) {
    formData.append("image", this.selectedFile);
  }

  this.materialService.updateMaterial(material.id, formData).subscribe({
    next: () => {
      material.quantity = this.editedQuantity;
      material.price = this.editedPrice;
      material.imageUrl = imageUrl;

      this.editingMaterialId = null;
      this.selectedFile = null;
      this.imagePreview = null;
      this.isUpdating = false;
      this.showNotification("Material updated successfully", "success");
      
    },
    error: (err) => {
      console.error("Failed to update:", err);
      this.showNotification("Failed to update material", "error");
      this.isUpdating = false;
    },
  });
}


  // Image handling
  onImageSelected(event: any): void {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        this.showNotification("Please select a valid image file", "error")
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        this.showNotification("Image size must be less than 10MB", "error")
        return
      }

      this.selectedFile = file

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  removeSelectedImage(): void {
    this.selectedFile = null
    this.imagePreview = null
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
    this.materialService.deleteMaterial(id).subscribe({
      next: () => {
        this.materials = this.materials.filter((m) => m.id !== id)
        this.confirmDeleteId = null
        this.isDeleting = false
        this.showNotification("Material deleted successfully", "success")
      },
      error: (err) => {
        console.error("Failed to delete:", err)
        this.showNotification("Failed to delete material", "error")
        this.isDeleting = false
      },
    })
  }

  // Navigation
  goBack(): void {
    this.router.navigate(["/dashboard/donor"])
  }

  // Utility functions
  onImageError(event: any): void {
    if (!event.target.src.includes("placeholder.svg")) {
      event.target.src = "/placeholder.svg?height=200&width=300"
    }
  }

  trackByMaterialId(index: number, material: Material): number {
    return material.id
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  private showNotification(message: string, type: "success" | "error"): void {
    // You can implement a proper notification service here
    // For now, using alert as fallback
    alert(message)
  }

  // Helper methods for template
  get isEditingAny(): boolean {
    return this.editingMaterialId !== null
  }

  isEditing(materialId: number): boolean {
    return this.editingMaterialId === materialId
  }

  canEdit(material: Material): boolean {
    return this.isMineView && material.isAvailable
  }

  canDelete(material: Material): boolean {
    return this.isMineView
  }

  getImageUrl(material: Material): string {
    if (this.isEditing(material.id) && this.imagePreview) {
      return this.imagePreview
    }
    return material.imageUrl || "/placeholder.svg?height=200&width=300"
  }
}
