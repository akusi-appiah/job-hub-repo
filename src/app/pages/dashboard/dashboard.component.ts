import { Component, AfterViewInit, ViewChild, ElementRef, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MetricsService } from "../../../app/config/services/metricsService/metrics.service"; // adjust path
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../config/services/authService/auth-service.service';
import { UserData } from '../../config/interfaces/general.interface';
import { getUserAcroynm } from '../../utils/utils';

Chart.register(...registerables);


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styles: [`
    .clickable { @apply cursor-pointer; }
  `]
})
export class DashboardComponent implements AfterViewInit, OnInit {
  metrics: any = null;
  userAcronym = 'SJ';
  userData: UserData = { email: '', firstName: '', lastName: '' };
  private readonly metricsSvc = inject(MetricsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('trendCanvas', { static: false }) trendCanvas!: ElementRef<HTMLCanvasElement>;
  chart: any;

  ngOnInit() {

    //Load user 
    this.loadUser();
    // load metrics (replace with real service)
    this.metricsSvc.getMetrics().subscribe(m => {
      this.metrics = m;
    });
  }

  loadUser() {
    let user: UserData;
    this.authService.getUserAttributes().subscribe((res) => {
      user={firstName:res.firstName, lastName:res.lastName, email:res.email};
      this.userData = user;
      this.userAcronym = getUserAcroynm((this.userData.firstName + ' ' + this.userData.lastName).trim());
    });
  }

  ngAfterViewInit() {
    // draw simple line chart
    // ensure you have chart.js installed: npm i chart.js
    const ctx = (this.trendCanvas.nativeElement).getContext('2d')!;
    this.metricsSvc.getMetrics().subscribe(m => {
      const labels = m.trend.map((t:any) => t.date);
      const data = m.trend.map((t:any) => t.applied);
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Applied',
            data,
            fill: true,
            backgroundColor: 'rgba(37,99,235,0.12)',
            borderColor: '#2563eb',
            tension: .35,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { display: true, grid: { display: false } },
            y: { display: true, beginAtZero: true, ticks: { stepSize: 2 } }
          },
          plugins: { legend: { display: false } }
        }
      });
    });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
