import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../status-badge/status-badge';

@Component({
  selector: 'app-material-card',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './material-card.html',
  styleUrls: ['./material-card.scss']
})
export class MaterialCardComponent {
  @Input() material: any;
}
