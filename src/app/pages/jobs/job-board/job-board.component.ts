import { Component, OnInit, signal, HostListener, input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../config/services/apiService/api.service';
import { AuthService } from '../../../config/services/authService/auth-service.service';
import { Categories, Job, ListParams, User } from '../../../config/interfaces/general.interface';
import { sortOptions, statusOptions } from '../../../config/data/jobs.data';
import { debounceTime, distinctUntilChanged,Subject, Subscription, switchMap,from } from 'rxjs';
import { ToastService } from '../../../config/services/toast/toast.service';
import { JobPostComponent } from '../post-job/job-post.component';


export type JobBoardMode = 'jobSeeker' | 'jobOwner';

@Component({
  selector: 'app-job-board',
  standalone: true,
  imports: [CommonModule, FormsModule, JobPostComponent],
  templateUrl: './job-board.component.html',
  styles: [`
    .job-card {
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
      cursor: pointer;
    }
    
    .job-card:hover, .job-card:focus {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-left-color: #3b82f6;
      outline: none;
    }

    .job-card.focused {
      border: 2px solid #3b82f6;
      transform: scale(1.02);
    }
    
    .pagination-btn {
      transition: all 0.2s ease;
    }
    
    .pagination-btn:hover:not(.disabled) {
      background-color: #3b82f6;
      color: white;
    }
    
    .status-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
    }

    .form-input {
      @apply w-full px-4 py-2 mb-3 border rounded border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300;
    }
    
    .modal-backdrop {
      background-color: rgba(0, 0, 0, 0.5);
    }
    
    .modal {
      transition: all 0.3s ease-out;
      max-height: 90vh;
      overflow-y: auto;
    }

    .description-clamp {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .action-btn {
      @apply px-2 py-1 rounded text-xs transition;
    }
  `]
})
export class JobBoardComponent implements OnInit, OnDestroy {
  mode = input<JobBoardMode>("jobSeeker");
  private subscription: Subscription | undefined;
  private readonly searchTerms = new Subject<string>();
  
  jobs: Job[] = [];
  currentPage = 1;
  itemsPerPage = 9;
  totalPages = 1;
  totalJobs = 0;
  hasMore = false;
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  selectedSort = 'createdAt';
  
  currentUser: User | null = null;
  showClaimModal = false;
  showSubmitModal = false;
  showDetailsModal = false;
  showPostJobModal = false;
  showRejectModal = false;
  selectedJob: Job | null = null;
  submissionDetails = '';
  rejectReason = '';
  jobSeekerId= '';
  jobOwnerId= '';
  focusedJobId: string | null = null;

  statusOptions = signal(statusOptions)
  sortOptions = signal(sortOptions)
  categories = signal<Categories[]>([]);
  
  errorMessage = '';
  loading = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService 
  ) {}

  ngOnInit() {
    this.init();
    this.setupSearchSubscription();
  }

  async init() {
    this.loadJobCategories();
    this.loadCurrentUser();
    this.loadJobs();
  }

  loadCurrentUser() {
    this.authService.getUserAttributes().subscribe({
      next: (res) => this.currentUser = res,
      error: (err) => {
        console.error('Failed to load user data:', err);
        this.toastService.error('Failed to load user data. Please try again.');
      }  
    });
  }

  loadJobCategories(){
    this.loading=true;

    from(this.apiService.getCategories()).subscribe({
      next: (res) => {
        this.categories.set(res);  
        this.loading=false;
      },
      error: (err) => {
        this.toastService.error('Failed to load categories.'+err);
        this.loading=false;
      }  
    });
  }

  loadJobs() {
    this.loading = true;
    this.loadJobsService().subscribe({
      next: (res) => this.handleResponse(res),
      error: (err) => {
        this.loading = false;
        this.toastService.error('Failed to load jobs. Please try again.');
        console.error('Failed to load jobs:', err);
    }});
    this.loading = false;
  }

  private setupSearchSubscription() {
    this.subscription = this.searchTerms
      .pipe(
        debounceTime(300), // Wait 300ms after last keystroke
        distinctUntilChanged(), // Ignore duplicate terms
        switchMap((term: string) => {
          this.searchTerm = term; // Update searchTerm
          this.currentPage = 1; // Reset page on new search
          return this.loadJobsService(); 
        })
      )
      .subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (err) => {
          this.loading = false;
          this.toastService.error('Search failed: ' + err.message);
        },
      });
  }

  onSearchTermChange(term: string) {
    this.searchTerms.next(term); // Push term to Subject
  }

  private handleResponse(response: any) {
    if (this.mode() === 'jobSeeker') {
      this.jobSeekerId = response.seekerId;
    } else {
      this.jobOwnerId = response.ownerId;
    }

    // console.log('Job summary:', response);
    this.jobs = response.jobs;
    this.totalJobs = response.total;
    this.hasMore = response.hasMore;
    this.totalPages = Math.ceil(this.totalJobs / this.itemsPerPage);
    this.loading = false;
  }

  private loadJobsService(){
    const params: ListParams = {
      offset: (this.currentPage - 1) * this.itemsPerPage,
      limit: this.itemsPerPage,
      search: this.searchTerm || undefined,
      category: this.selectedCategory || undefined,
      status: this.selectedStatus || undefined,
      sort: this.selectedSort || undefined,
    };

    return this.apiService.getJobs(params, this.mode());
  }



  applyFilters() {
    this.currentPage = 1;
    this.loadJobs();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.selectedSort = 'createdAt';
    this.applyFilters();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadJobs();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'claimed':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getCategoryIcon(categoryId: string): string {
    switch (categoryId) {
      case 'design':
        return '🎨';
      case 'development':
        return '💻';
      case 'marketing':
        return '📈';
      case 'writing':
        return '✏️';
      default:
        return '📋';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getJobCategoryName(categoryId: string): string {
    const category = this.categories().filter(category => category.categoryId === categoryId)[0];
    return category ? category.name : '';
  }

  getCompletionDate(job: Job): string {
    const createdDate = new Date(job.createdAt);
    const completionDate = new Date(createdDate.getTime() + (job.timeToCompleteSeconds * 1000));
    return this.formatDate(completionDate.toISOString());
  }

  isJobClaimedByUser(job: Job): boolean {
    return job.claimerId === this.jobSeekerId;
  }

  isJobOwnedByUser(job: Job): boolean {
    return job.ownerId === this.jobOwnerId;
  }

  canClaimJob(job: Job): boolean {
    return this.mode() === 'jobSeeker' && 
          job.ownerId !== this.jobSeekerId &&
           job.status === 'open' && 
           new Date(job.expiryDate) > new Date();
  }

  canSubmitJob(job: Job): boolean {
    return this.mode() === 'jobSeeker' && 
          job.ownerId !== this.jobSeekerId &&
           this.isJobClaimedByUser(job) && 
           job.status === 'claimed';
  }

  canEditOrDeleteJob(job: Job): boolean {
    return this.mode() === 'jobOwner' && 
           this.isJobOwnedByUser(job) && 
           (job.status === 'open' || job.status === 'claimed');
  }

  canApproveOrRejectJob(job: Job): boolean {
    return this.mode() === 'jobOwner' && 
           this.isJobOwnedByUser(job) && 
           job.status === 'submitted' ;
  }
  openClaimModal(job: Job) {
    this.selectedJob = job;
    this.showClaimModal = true;
  }

  closeClaimModal() {
    this.showClaimModal = false;
    this.selectedJob = null;
  }

  openSubmitModal(job: Job) {
    this.selectedJob = job;
    this.submissionDetails = '';
    this.showSubmitModal = true;
  }

  closeSubmitModal() {
    this.showSubmitModal = false;
    this.selectedJob = null;
    this.submissionDetails = '';
  }

  openPostJobModal(job?: Job) {
    this.selectedJob = job || null;
    this.showPostJobModal = true;
  }

  closePostJobModal() {
    this.showPostJobModal = false;
    this.selectedJob = null;
  }

  openRejectModal(job: Job) {
    this.selectedJob = job;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.selectedJob = null;
    this.rejectReason = '';
  }

  openDetailsModal(job: Job) {
    this.selectedJob = job;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedJob = null;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.showDetailsModal && event.key === 'Escape') {
      this.closeDetailsModal();
    }
  }

  setFocus(jobId: string) {
    this.focusedJobId = jobId;
  }

  removeFocus() {
    this.focusedJobId = null;
  }

  async claimJob() {
    if (!this.selectedJob) return;
    try {
      this.loading=true
      const response = await this.apiService.claimJob(this.selectedJob.jobId);
      if (response.message) {
        this.toastService.success('Job claimed successfully!', 5000); 
        this.closeClaimModal();
        this.loadJobs();
      }
      this.loading=false
    } catch (error) {
      this.loading=false
      console.error('Failed to claim job:', error);
      this.toastService.error('Failed to claim job: ' + error, 5000);
    }
  }

  async submitJob() {
    if (!this.selectedJob || !this.submissionDetails.trim()) {
      this.toastService.error('Please provide submission details.');
      return;
    }

    try {
      this.loading = true;
      const response = await this.apiService.submitJob(
        this.selectedJob.jobId
      );
      
      if (response.message) {
        this.toastService.success('Job submitted successfully!');
        this.loading = false;
        this.closeSubmitModal();
        this.loadJobs(); 
      }
    } catch (error) {
      this.loading=false;
      console.error('Failed to submit job:', error);
      this.toastService.error('Failed to submit job. Please try again.');
    }
  }

  async approveJob(job: Job) {
    try {
      this.loading = true;
      const response = await this.apiService.approveJob(job.jobId);
      
      if (response.message) {
        this.toastService.success('Job approved successfully!');
        this.loading = false;
        this.loadJobs();
      }
    } catch (error) {
      this.loading = false;
      console.error('Failed to approve job:', error);
      this.toastService.error('Failed to approve job. Please try again.');
    }
  }

  async rejectJob() {
    if (!this.selectedJob || !this.rejectReason.trim()) {
      this.toastService.error('Please provide a rejection reason.');
      return;
    }

    try {
      this.loading = true;
      const response = await this.apiService.rejectJob(
        this.selectedJob.jobId, 
        this.rejectReason
      );
      
      if (response.message) {
        this.toastService.success('Job rejected successfully!');
        this.loading = false;
        this.closeRejectModal();
        this.loadJobs();
      }
    } catch (error) {
      this.loading = false;
      console.error('Failed to reject job:', error);
      this.toastService.error('Failed to reject job. Please try again.');
    }
  }

  async deleteJob(job: Job) {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      this.loading = true;
      const response = await this.apiService.deleteJob(job.jobId);
      
      if (response.message) {
        this.toastService.success('Job deleted successfully!');
        this.loading = false;
        this.loadJobs();
      }
    } catch (error) {
      this.loading = false;
      console.error('Failed to delete job:', error);
      this.toastService.error('Failed to delete job. Please try again.');
    }
  }

  onJobSaved() {
    this.closePostJobModal();
    this.loadJobs();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}