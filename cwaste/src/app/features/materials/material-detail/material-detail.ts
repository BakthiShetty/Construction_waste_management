import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge';
import { MaterialService } from '../../../core/services/material';


@Component({
  selector: 'app-material-detail',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './material-detail.html',
  styleUrls: ['./material-detail.scss']
})
export class MaterialDetailComponent implements OnInit {
  material: any;

  constructor(private route: ActivatedRoute, private materialService: MaterialService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.materialService.getById(id).subscribe({
      next: res => this.material = res,
      error: err => console.error(err)
    });
  }
}
