import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { SelectModule } from 'primeng/select';
import { KnobModule } from 'primeng/knob';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TableModule } from 'primeng/table';
import { TreeModule } from 'primeng/tree';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';

@NgModule({
  exports: [
    ButtonModule,
    ChipModule,
    SelectModule,
    KnobModule,
    ProgressBarModule,
    TooltipModule,
    PaginatorModule,
    DynamicDialogModule,
    ScrollPanelModule,
    TableModule,
    TreeModule,
    CheckboxModule,
    ToastModule
  ]
})
export class PrimeNgModule { }