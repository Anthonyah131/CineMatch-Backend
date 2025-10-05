import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  video: boolean;
}

export interface TmdbSearchResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMovieDetails extends TmdbMovie {
  budget: number;
  revenue: number;
  runtime: number;
  status: string;
  tagline: string;
  genres: Array<{ id: number; name: string }>;
  production_companies: Array<{ id: number; name: string; logo_path: string }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; name: string }>;
  videos?: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }>;
  };
  images?: {
    backdrops: Array<{
      file_path: string;
      width: number;
      height: number;
    }>;
    posters: Array<{
      file_path: string;
      width: number;
      height: number;
    }>;
  };
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
    }>;
  };
  recommendations?: TmdbSearchResponse;
  similar?: TmdbSearchResponse;
}

export interface TmdbConfiguration {
  images: {
    base_url: string;
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizes: string[];
    still_sizes: string[];
  };
  change_keys: string[];
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbGenresResponse {
  genres: TmdbGenre[];
}

export interface TmdbCredits {
  id: number;
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string;
    order: number;
  }>;
  crew: Array<{
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string;
  }>;
}

export interface TmdbWatchProviders {
  id: number;
  results: {
    [countryCode: string]: {
      link: string;
      rent?: Array<{
        logo_path: string;
        provider_id: number;
        provider_name: string;
        display_priority: number;
      }>;
      buy?: Array<{
        logo_path: string;
        provider_id: number;
        provider_name: string;
        display_priority: number;
      }>;
      flatrate?: Array<{
        logo_path: string;
        provider_id: number;
        provider_name: string;
        display_priority: number;
      }>;
    };
  };
}

@Injectable()
export class TmdbService {
  private readonly apiKey = process.env.TMDB_API_KEY;
  private readonly baseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

  constructor(private readonly httpService: HttpService) {}

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const err = error as { response?: { data?: { status_message?: string } }; message?: string };
      if (err.response?.data?.status_message) {
        return String(err.response.data.status_message);
      }
      if (err.message) {
        return String(err.message);
      }
    }
    return 'Error desconocido de TMDb API';
  }

  async getPopularMovies(page: number = 1): Promise<TmdbSearchResponse> {
    try {
      const url = `${this.baseUrl}/movie/popular`;
      const params = {
        api_key: this.apiKey,
        language: 'es-ES',
        page: page.toString(),
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbSearchResponse>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al obtener películas populares: ${this.getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async searchMovies(query: string, page: number = 1): Promise<TmdbSearchResponse> {
    try {
      const url = `${this.baseUrl}/search/movie`;
      const params = {
        api_key: this.apiKey,
        language: 'es-ES',
        query: encodeURIComponent(query),
        page: page.toString(),
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbSearchResponse>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al buscar películas: ${this.getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getMovieDetails(movieId: number): Promise<TmdbMovieDetails> {
    try {
      const url = `${this.baseUrl}/movie/${movieId}`;
      const params = {
        api_key: this.apiKey,
        language: 'es-ES',
        append_to_response: 'videos,images,credits,recommendations,similar',
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbMovieDetails>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al obtener detalles de la película: ${this.getErrorMessage(error)}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async getConfiguration(): Promise<TmdbConfiguration> {
    try {
      const url = `${this.baseUrl}/configuration`;
      const params = {
        api_key: this.apiKey,
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbConfiguration>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al obtener configuración de TMDb: ${this.getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async discoverMovies(
    filters: Record<string, any> = {},
    page: number = 1,
  ): Promise<TmdbSearchResponse> {
    try {
      const url = `${this.baseUrl}/discover/movie`;
      const params = {
        api_key: this.apiKey,
        language: 'es-ES',
        page: page.toString(),
        ...filters,
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbSearchResponse>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al descubrir películas: ${this.getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getMovieCredits(movieId: number): Promise<TmdbCredits> {
    try {
      const url = `${this.baseUrl}/movie/${movieId}/credits`;
      const params = {
        api_key: this.apiKey,
      };

      const response = await firstValueFrom(this.httpService.get<TmdbCredits>(url, { params }));
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al obtener créditos de la película: ${this.getErrorMessage(error)}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async getWatchProviders(movieId: number): Promise<TmdbWatchProviders> {
    try {
      const url = `${this.baseUrl}/movie/${movieId}/watch/providers`;
      const params = {
        api_key: this.apiKey,
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbWatchProviders>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al obtener proveedores de streaming: ${this.getErrorMessage(error)}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async getGenres(): Promise<TmdbGenresResponse> {
    try {
      const url = `${this.baseUrl}/genre/movie/list`;
      const params = {
        api_key: this.apiKey,
        language: 'es-ES',
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbGenresResponse>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al obtener géneros: ${this.getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<TmdbSearchResponse> {
    try {
      const url = `${this.baseUrl}/trending/movie/${timeWindow}`;
      const params = {
        api_key: this.apiKey,
        language: 'es-ES',
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbSearchResponse>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al obtener películas en tendencia: ${this.getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUpcomingMovies(page: number = 1): Promise<TmdbSearchResponse> {
    try {
      const url = `${this.baseUrl}/movie/upcoming`;
      const params = {
        api_key: this.apiKey,
        language: 'es-ES',
        page: page.toString(),
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbSearchResponse>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al obtener próximos estrenos: ${this.getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getTopRatedMovies(page: number = 1): Promise<TmdbSearchResponse> {
    try {
      const url = `${this.baseUrl}/movie/top_rated`;
      const params = {
        api_key: this.apiKey,
        language: 'es-ES',
        page: page.toString(),
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbSearchResponse>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al obtener películas mejor valoradas: ${this.getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TV Shows methods
  async getPopularTVShows(page: number = 1): Promise<TmdbSearchResponse> {
    try {
      const url = `${this.baseUrl}/tv/popular`;
      const params = {
        api_key: this.apiKey,
        language: 'es-ES',
        page: page.toString(),
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbSearchResponse>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al obtener series populares: ${this.getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async searchTVShows(query: string, page: number = 1): Promise<TmdbSearchResponse> {
    try {
      const url = `${this.baseUrl}/search/tv`;
      const params = {
        api_key: this.apiKey,
        language: 'es-ES',
        query: encodeURIComponent(query),
        page: page.toString(),
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbSearchResponse>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al buscar series: ${this.getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
