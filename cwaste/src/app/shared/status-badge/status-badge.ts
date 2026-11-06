import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.html',
  styleUrls: ['./status-badge.scss']
})
export class StatusBadgeComponent {
  @Input() status: string = 'Pending';

  get badgeClass() {
    switch (this.status.toLowerCase()) {
      case 'available': return 'available';
      case 'unavailable': return 'unavailable';
      case 'pending': return 'pending';
      case 'completed': return 'completed';
      default: return 'default';
    }
  }
}

