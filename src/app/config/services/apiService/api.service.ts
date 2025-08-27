import { Injectable } from '@angular/core';
import { Categories, CategoriesResponse,ListParams } from '../../interfaces/general.interface';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private readonly http: HttpClient) {}

  private readonly apiUrl = environment.baseURL;

  // Fetch data from the /categories endpoint
  async getCategories():Promise<Categories[]> {
    try {
      const response = await fetch(this.apiUrl+'/categories');
      const data= await response.json() as CategoriesResponse; 
      return data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  postJob(job: any): Observable<any> {
    return this.http.post(this.apiUrl+'/job/owner/create', job);
  }

  updateJob(jobId: string, job: any): Observable<any> {
    if (!jobId) {
      throw new Error('jobId is required for updating a job');
    }
    return this.http.put(this.apiUrl+`/job/owner/edit/${jobId}`, job);
  }

  async submitJob(jobId: string): Promise<any> {
    return await firstValueFrom(this.http.post(this.apiUrl+`/job/seeker/submit/`+jobId, {}));
  }

  getJobs(params: ListParams, type: string): Observable<any> {
    let endpoint = type === 'jobOwner' ? '/job/owner/list' : '/job/seeker/list';
    let urlParams = `${endpoint}?type=all&offset=${params.offset}&limit=${params.limit}&sortBy=${params.sort}`;
    if (params.search) urlParams += `&query=${params.search}`;
    if (params.category) urlParams += `&categoryId=${params.category}`;
    if (params.status) urlParams += `&status=${params.status}`;

    return this.http.get(this.apiUrl + urlParams);
  }

  async claimJob(jobId: string): Promise<any> {
    return await firstValueFrom(this.http.post(this.apiUrl+'/job/seeker/claim/'+jobId, {}));
  }

  async rejectJob(jobId: string, reason: string): Promise<any> {
    return await firstValueFrom(this.http.post(this.apiUrl+`/api/jobs/${jobId}/reject`, {reason})); 
  }

  async approveJob(jobId: string): Promise<any> {
    return await firstValueFrom(this.http.post(this.apiUrl+`/api/jobs/${jobId}/approve`, {})); // Empty body is required in this case
  } 

  async deleteJob(jobId: string): Promise<any> {
    return await firstValueFrom(this.http.delete(this.apiUrl+`/api/jobs/${jobId}`)); 
  }

}
