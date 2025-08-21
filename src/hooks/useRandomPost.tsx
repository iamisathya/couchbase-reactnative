import { useEffect, useState, useCallback } from 'react';
import AxiosService from '../services/AxiosService';

export const useFetchRandomPost = () => {
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    console.log('🔄 HOOK: Starting fetchPost...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 HOOK: Calling AxiosService.getRandomPost()...');
      const data = await AxiosService.getRandomPost();
      console.log('✅ HOOK: Post fetched successfully:', {
        id: data?.id,
        title: data?.title?.substring(0, 50) + '...',
        timestamp: new Date().toISOString(),
      });
      setPost(data);
    } catch (e: any) {
      console.error('❌ HOOK: Error fetching post:', {
        message: e.message,
        error: e,
        timestamp: new Date().toISOString(),
      });
      setError(e.message || 'Failed to fetch post. Please try again.');
    } finally {
      console.log('🏁 HOOK: Fetch operation completed, setting loading to false');
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    console.log('🔄 HOOK: Retry requested');
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    console.log('🚀 HOOK: useEffect triggered, calling fetchPost');
    fetchPost();
  }, [fetchPost]);

  console.log('📊 HOOK: Current state:', {
    loading,
    hasPost: !!post,
    hasError: !!error,
    postId: post?.id,
    errorMessage: error,
    timestamp: new Date().toISOString(),
  });

  return { 
    loading, 
    post, 
    error, 
    refetch: fetchPost,
    retry 
  };
};
