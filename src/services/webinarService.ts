// import { WebinarData } from '../types/webinar';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// export class WebinarService {
//   static async getAllWebinars(): Promise<WebinarData[]> {
//     const response = await fetch(`${API_BASE_URL}/api/admin/webinars`, {
//       headers: {
//         'Authorization': `Bearer ${localStorage.getItem('token')}`,
//       },
//     });
    
//     if (!response.ok) {
//       throw new Error('Failed to fetch webinars');
//     }
    
//     return response.json();
//   }

//   static async createWebinar(webinar: Omit<WebinarData, 'id'>): Promise<WebinarData> {
//     const response = await fetch(`${API_BASE_URL}/api/admin/webinars`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${localStorage.getItem('token')}`,
//       },
//       body: JSON.stringify(webinar),
//     });
    
//     if (!response.ok) {
//       throw new Error('Failed to create webinar');
//     }
    
//     return response.json();
//   }

//   static async updateWebinar(id: string, webinar: Partial<WebinarData>): Promise<WebinarData> {
//     const response = await fetch(`${API_BASE_URL}/api/admin/webinars/${id}`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${localStorage.getItem('token')}`,
//       },
//       body: JSON.stringify(webinar),
//     });
    
//     if (!response.ok) {
//       throw new Error('Failed to update webinar');
//     }
    
//     return response.json();
//   }

//   static async deleteWebinar(id: string): Promise<void> {
//     const response = await fetch(`${API_BASE_URL}/api/admin/webinars/${id}`, {
//       method: 'DELETE',
//       headers: {
//         'Authorization': `Bearer ${localStorage.getItem('token')}`,
//       },
//     });
    
//     if (!response.ok) {
//       throw new Error('Failed to delete webinar');
//     }
//   }
// }
