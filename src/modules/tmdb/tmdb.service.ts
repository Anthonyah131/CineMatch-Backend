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

export interface TmdbTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
}

export interface TmdbTVShowDetails extends TmdbTVShow {
  genres: Array<{ id: number; name: string }>;
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  tagline: string;
  type: string;
  created_by: Array<{ id: number; name: string; profile_path: string }>;
  networks: Array<{ id: number; name: string; logo_path: string }>;
  production_companies: Array<{ id: number; name: string; logo_path: string }>;
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
  recommendations?: {
    page: number;
    results: TmdbTVShow[];
    total_pages: number;
    total_results: number;
  };
}

/**
 * Service for interacting with The Movie Database (TMDb) API
 * Provides methods to fetch movies, TV shows, and related data
 */
@Injectable()
export class TmdbService {
  private readonly apiKey = process.env.TMDB_API_KEY;
  private readonly baseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Extract error message from TMDb API error response
   * @param error - Error object from API call
   * @returns Error message string
   */
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

  /**
   * Get popular movies from TMDb
   * @param page - Page number for pagination (default: 1)
   * @returns List of popular movies
   * @throws HttpException if API call fails
   */
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

  /**
   * Search for movies by query string
   * @param query - Search term
   * @param page - Page number for pagination (default: 1)
   * @returns Search results
   * @throws HttpException if API call fails
   */
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

  /**
   * Get detailed information about a specific movie
   * Includes videos, images, credits, recommendations, and similar movies
   * @param movieId - TMDb movie ID
   * @returns Detailed movie information
   * @throws HttpException if movie not found
   */
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

  /**
   * Get TMDb API configuration
   * Returns base URLs and available image sizes
   * @returns TMDb configuration
   * @throws HttpException if API call fails
   */
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

  /**
   * Discover movies using advanced filters
   * @param filters - Filter options (genres, year, sort, etc.)
   * @param page - Page number for pagination (default: 1)
   * @returns Filtered movies
   * @throws HttpException if API call fails
   */
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

  /**
   * Get credits (cast and crew) for a movie
   * @param movieId - TMDb movie ID
   * @returns Movie credits
   * @throws HttpException if movie not found
   */
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

  /**
   * Get streaming providers for a movie by country
   * @param movieId - TMDb movie ID
   * @returns Watch providers by country
   * @throws HttpException if movie not found
   */
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

  /**
   * Get list of all movie genres
   * @returns Movie genres with IDs and names
   * @throws HttpException if API call fails
   */
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

  /**
   * Get trending movies for a specific time window
   * @param timeWindow - 'day' or 'week' (default: 'week')
   * @returns Trending movies
   * @throws HttpException if API call fails
   */
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

  /**
   * Get upcoming movie releases
   * @param page - Page number for pagination (default: 1)
   * @returns Upcoming movies
   * @throws HttpException if API call fails
   */
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

  /**
   * Get top-rated movies
   * @param page - Page number for pagination (default: 1)
   * @returns Top-rated movies
   * @throws HttpException if API call fails
   */
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

  /**
   * Get popular TV shows from TMDb
   * @param page - Page number for pagination (default: 1)
   * @returns List of popular TV shows
   * @throws HttpException if API call fails
   */
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

  /**
   * Search for TV shows by query string
   * @param query - Search term
   * @param page - Page number for pagination (default: 1)
   * @returns Search results
   * @throws HttpException if API call fails
   */
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

  /**
   * Get detailed information about a TV show
   * @param tvId - TMDb TV show ID
   * @returns Detailed TV show information
   * @throws HttpException if API call fails
   */
  async getTVShowDetails(tvId: number): Promise<TmdbTVShowDetails> {
    try {
      const url = `${this.baseUrl}/tv/${tvId}`;
      const params = {
        api_key: this.apiKey,
        language: 'es-ES',
        append_to_response: 'videos,images,credits,recommendations',
      };

      const response = await firstValueFrom(
        this.httpService.get<TmdbTVShowDetails>(url, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      throw new HttpException(
        `Error al obtener detalles de la serie: ${this.getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
