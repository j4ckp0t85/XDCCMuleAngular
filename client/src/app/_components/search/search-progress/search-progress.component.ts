import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-search-progress',
  standalone: true,
  imports: [CommonModule, ProgressBarModule],
  templateUrl: './search-progress.component.html',
  styleUrls: ['./search-progress.component.scss']
})
export class SearchProgressComponent {
  percentageDone = input(0);
  isVisible = input(false);
  
  // Percentuale arrotondata senza decimali
  roundedPercentage = computed(() => Math.round(this.percentageDone()));
}