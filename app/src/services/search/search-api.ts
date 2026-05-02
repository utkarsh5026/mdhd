import { apiFetch } from '@/services/auth/api-client';

export interface SearchResultEntry {
  file_id: string;
  file_name: string;
  file_path: string;
  headline: string;
  rank: number;
}

export interface SearchResponse {
  results: SearchResultEntry[];
}

export async function searchFiles(query: string): Promise<SearchResponse> {
  return apiFetch<SearchResponse>(`/files/search?q=${encodeURIComponent(query)}`);
}
