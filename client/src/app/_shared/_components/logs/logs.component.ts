import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LogMessageEvent } from '../../../_models/logmessage.interface';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';

@Component({
    selector: 'app-logs',
    imports: [
        CommonModule,
        MaterialModule,
        MatFormFieldModule,
        FormsModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose,
    ],
    templateUrl: './logs.component.html',
    styleUrl: './logs.component.scss'
})
export class LogsComponent {
  messages!: LogMessageEvent[];
  constructor(
    public dialogRef: MatDialogRef<LogsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { messages: LogMessageEvent[] }
  ) {
    this.messages = data.messages;
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
