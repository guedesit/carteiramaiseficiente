import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ApiAccessLogService } from '../services/api-access-log.service';

@Component({
  selector: 'app-logs-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs-page.component.html',
  styleUrl: './logs-page.component.css',
})
export class LogsPageComponent {
  private readonly apiAccessLog = inject(ApiAccessLogService);

  readonly logs$ = this.apiAccessLog.logs$;

  clear(): void {
    this.apiAccessLog.clear();
  }
}
