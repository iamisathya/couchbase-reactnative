import { useEffect, useState } from 'react';
import AxiosService from '../services/AxiosService';

export const useFetchRandomPost = () => {
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = async () => {
      setLoading(true);
      try {
        const data = await AxiosService.getRandomPost();
        setPost(data);
      } catch (e: any) {
        console.error('Error fetching post:', e.message);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchPost();
  }, []);

  return { loading, post, error, refetch: fetchPost };
};
