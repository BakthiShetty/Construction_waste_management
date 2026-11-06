import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import  { AdminService } from "../../../core/services/admin-service"
import { Router } from "@angular/router"

export interface User {
  id: string
  userName: string
  email: string
  role: "donor" | "receiver"
  isBlocked: boolean
}

@Component({
  selector: "app-user-list",
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: "./user-list.html",
  styleUrls: ["./user-list.scss"],
})
export class UserListComponent implements OnInit {
  users: User[] = []
  loading = true
  error: string | null = null
  processingUserId: string | null = null

  constructor(
    private adminService: AdminService,
    private router : Router

  ) {}

  ngOnInit(): void {
    this.fetchUsers()
  }
currentPage = 1;
pageSize = 3;

get totalPages(): number {
  return Math.ceil(this.totalCount / this.pageSize);
}

goToPage(page: number): void {
  if (page >= 1 && page <= this.totalPages) {
    this.currentPage = page;
    this.fetchUsers();
  }
}

nextPage(): void {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.fetchUsers();
  }
}

prevPage(): void {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.fetchUsers();
  }
}

totalCount: number = 0;

fetchUsers(): void {
  this.loading = true;
  this.error = null;

  this.adminService.getData('users', this.currentPage, this.pageSize).subscribe({
    next: (res) => {
      this.users = res.data;
      this.totalCount = res.totalCount;
      this.loading = false;
    },
    error: (err) => {
      this.error = "Failed to load users. Please try again.";
      this.loading = false;
      console.error("Error fetching users:", err);
    }
  });
}

  deleteUser(id: string): void {
    const user = this.users.find((u) => u.id === id)
    const confirmDelete = confirm(`Are you sure you want to delete ${user?.userName}? This action cannot be undone.`)

    if (!confirmDelete) return

    this.processingUserId = id

    this.adminService.deleteUser(id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== id)
        this.processingUserId = null
      },
      error: (err) => {
        alert("Failed to delete user. Please try again.")
        this.processingUserId = null
        console.error("Error deleting user:", err)
      },
    })
  }

  updateUserRole(user: User, newRole: string): void {
    if (newRole === user.role || !newRole) return

    this.processingUserId = user.id

    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        user.role = newRole as "donor" | "receiver"
        this.processingUserId = null
      },
      error: (err) => {
        alert("Failed to update role. Please try again.")
        this.processingUserId = null
        console.error("Error updating role:", err)
      },
    })
  }

  toggleBlockUser(user: User): void {
    const shouldBlock = !user.isBlocked
    const blockAction = shouldBlock ? "block" : "unblock"
    const confirmed = confirm(`Are you sure you want to ${blockAction} ${user.userName}?`)

    if (!confirmed) return

    this.processingUserId = user.id

    this.adminService.blockUser(user.id, shouldBlock).subscribe({
      next: () => {
        user.isBlocked = shouldBlock
        this.processingUserId = null
      },
      error: (err) => {
        alert(`Failed to ${blockAction} user. Please try again.`)
        this.processingUserId = null
        console.error(`Error ${blockAction}ing user:`, err)
      },
    })
  }

  isProcessing(userId: string): boolean {
    return this.processingUserId === userId
  }

  getRoleDisplayName(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  getStatusClass(isBlocked: boolean): string {
    return isBlocked ? "status-blocked" : "status-active"
  }

  refreshUsers(): void {
    this.fetchUsers()
     this.currentPage = 1;
  }
      // Navigation
  goBack(): void {
    this.router.navigate(["/dashboard/admin"])
  }
}
