import axios from 'axios';

class AxiosService {
  private api = axios.create({
    baseURL: 'https://jsonplaceholder.typicode.com/',
    timeout: 5000,
  });

  async getRandomPost(): Promise<any> {
    try {
      const randomId = Math.floor(Math.random() * 100) + 1; // IDs range from 1 to 1000
      const response = await this.api.get(`/posts/${randomId}`);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.message);
        console.error('Error details:', error.toJSON?.());
      } else {
        console.error('Unexpected error:', error);
      }
      throw error;
    }
  }
}

export default new AxiosService();
