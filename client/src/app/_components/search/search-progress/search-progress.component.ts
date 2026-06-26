import { Component, computed, input } from '@angular/core';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-search-progress',
  imports: [ProgressBarModule],
  templateUrl: './search-progress.component.html',
  styleUrl: './search-progress.component.scss',
})
export class SearchProgressComponent {
  readonly percentageDone = input(0);
  readonly isVisible = input(false);

  readonly roundedPercentage = computed(() => Math.round(this.percentageDone()));
}