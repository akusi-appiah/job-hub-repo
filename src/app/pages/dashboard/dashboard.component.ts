import { Component, AfterViewInit, ViewChild, ElementRef, inject, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MetricsService } from "../../../app/config/services/metricsService/metrics.service"; // adjust path
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../config/services/authService/auth-service.service';
import { getUserAcroynm } from '../../utils/utils';
import { UserStore } from '../../store/user/user.store';
import { ApiService } from '../../config/services/apiService/api.service';
import { ToastService } from '../../config/services/toast/toast.service';
import { AdminStatistics, DailyStat } from '../../config/interfaces/dashboard.interface';

Chart.register(...registerables);


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styles: [`
    .clickable { @apply cursor-pointer; };

    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class DashboardComponent implements AfterViewInit, OnInit {
  metrics: any = null;
  private readonly userStore = inject(UserStore);
 
  private readonly metricsSvc = inject(MetricsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor(    
    private readonly apiService: ApiService,
    private readonly toastService: ToastService
  ) {};
  
  isLoading = computed(() => this.userStore.loading());

  userDetails = computed(() => {
    const data = this.userStore.personalData();
    return data ?? { email: '', firstname: '', lastname: '' };
  });

  userAcronym = computed(() => {
    const name = (this.userDetails().firstname + ' ' + this.userDetails().lastname).trim();
    return getUserAcroynm(name);  
  });

  adminUser = computed(() => this.userStore.userType()?.toLowerCase() === 'admin');


  statistics: AdminStatistics | null = null;
  loading = false; //Admin statistics loading state
  private chart: any; //serves both charts

  @ViewChild('trendCanvas', { static: false }) trendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('claimsChart', { static: false }) claimsChart!: ElementRef<HTMLCanvasElement>;


  ngOnInit() {
    this.loadAdminStatistics();

    this.metricsSvc.getMetrics().subscribe(m => {
      this.metrics = m;
    });
  }



  ngAfterViewInit() {
    // draw simple line chart
    // ensure you have chart.js installed: npm i chart.js
    this.createUserChart();
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  createUserChart() {
    if (this.adminUser()) return; // Only load if admin
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

  // Admin Statistics related methods
  loadAdminStatistics() {
    if (!this.adminUser()) return; // Only load if admin
    this.loading = true;
    this.apiService.getAdminStatistics().subscribe({
      next: (data) => {
        this.statistics = data;
        this.loading = false;
        setTimeout(() => this.createAdminChart(), 100); // Delay to ensure DOM is ready
      },
      error: (error) => {
        console.error('Failed to load admin statistics:', error);
        this.toastService.error('Failed to load statistics. Please try again.');
        this.loading = false;
      }
    });
  }

  refreshAdminStats() {
    this.loadAdminStatistics();
  }

   formatDate(dateString: string): string {
    // Convert from "25-08-27" format to readable format
    const parts = dateString.split('-');
    const year = '20' + parts[0];
    const month = parts[1];
    const day = parts[2];
    return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getRecentStats(): DailyStat[] {
    if (!this.statistics?.stats) return [];
    return this.statistics.stats.slice(-10);
  }

  getClaimPercentage(claims: number): number {
    if (!this.statistics?.stats) return 0;
    const maxClaims = Math.max(...this.statistics.stats.map(s => s.claimed));
    return maxClaims === 0 ? 0 : (claims / maxClaims) * 100;
  }

  createAdminChart() {
    if (!this.statistics?.stats || !this.claimsChart) return;

    const ctx = this.claimsChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Simple canvas chart implementation
    const canvas = this.claimsChart.nativeElement;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const data = this.statistics.stats.slice(-14); // Last 14 days
    const maxValue = Math.max(...data.map(d => d.claimed), 1);
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(padding, padding, chartWidth, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Draw bars
    const barWidth = chartWidth / data.length * 0.6;
    const barSpacing = chartWidth / data.length * 0.4;

    data.forEach((item, index) => {
      const barHeight = (item.claimed / maxValue) * chartHeight;
      const x = padding + (index * (barWidth + barSpacing)) + (barSpacing / 2);
      const y = padding + chartHeight - barHeight;

      // Draw bar
      ctx.fillStyle = item.claimed > 0 ? '#3b82f6' : '#d1d5db';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on top
      if (item.claimed > 0) {
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.claimed.toString(), x + barWidth / 2, y - 5);
      }
    });

    // Draw Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxValue / 5) * (5 - i));
      const y = padding + (chartHeight / 5) * i + 4;
      ctx.fillText(value.toString(), padding - 8, y);
    }
  }

  getActivityTypeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-600';
      case 'rejected':
        return 'bg-red-100 text-red-600';
      case 'submitted':
        return 'bg-blue-100 text-blue-600';
      case 'claimed':
        return 'bg-yellow-100 text-yellow-600';
      case 'posted':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getActivityTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'submitted':
        return '📤';
      case 'claimed':
        return '🔒';
      case 'posted':
        return '➕';
      default:
        return '📋';
    }
  }
}
