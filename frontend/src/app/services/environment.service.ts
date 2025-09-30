import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  
  getApiBaseUrl(): string {
    // Use environment configuration if available
    if (environment.apiUrl) {
      return environment.apiUrl;
    }
    
    // Dynamic URL construction for production
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      
      // For localhost or local development IPs, use port 3000
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
        return `${protocol}//${hostname}:3000`;
      }
      
      // For production, assume same host different port or path
      return `${protocol}//${hostname}/api`;
    }
    
    // Fallback for SSR or testing
    return 'http://localhost:3000';
  }
  
  isProduction(): boolean {
    return environment.production;
  }
  
  isDevelopment(): boolean {
    return !environment.production;
  }
}