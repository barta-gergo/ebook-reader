import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ReadPageData {
  pageNumber: number;
  markedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReadPagesService {
  private readonly API_URL = environment.apiUrl;
  private readPagesSubject = new BehaviorSubject<Set<number>>(new Set());
  
  public readPages$ = this.readPagesSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadReadPages(bookId: string): Observable<ReadPageData[]> {
    return this.http.get<{ readPages: ReadPageData[] }>(`${this.API_URL}/books/${bookId}/read-pages`)
      .pipe(
        map(response => {
          const pageNumbers = new Set(response.readPages.map(p => p.pageNumber));
          this.readPagesSubject.next(pageNumbers);
          return response.readPages;
        })
      );
  }

  markPageAsRead(bookId: string, pageNumber: number): Observable<any> {
    return this.http.post(`${this.API_URL}/books/${bookId}/read-pages/${pageNumber}`, {})
      .pipe(
        tap(() => {
          const current = this.readPagesSubject.value;
          current.add(pageNumber);
          this.readPagesSubject.next(new Set(current));
        })
      );
  }

  unmarkPageAsRead(bookId: string, pageNumber: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/books/${bookId}/read-pages/${pageNumber}`)
      .pipe(
        tap(() => {
          const current = this.readPagesSubject.value;
          current.delete(pageNumber);
          this.readPagesSubject.next(new Set(current));
        })
      );
  }

  isPageRead(pageNumber: number): boolean {
    return this.readPagesSubject.value.has(pageNumber);
  }

  getReadPages(): Set<number> {
    return this.readPagesSubject.value;
  }
}