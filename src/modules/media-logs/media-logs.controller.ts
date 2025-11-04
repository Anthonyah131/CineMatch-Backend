import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { MediaLogsService } from './media-logs.service';
import { LogMediaViewDto } from './dto/log-media-view.dto';
import { UpdateMediaLogDto } from './dto/update-media-log.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Controller for managing user media viewing logs
 * Handles user viewing history, ratings, reviews, and statistics
 */
@ApiTags('media-logs')
@ApiBearerAuth()
@Controller('media-logs')
export class MediaLogsController {
  constructor(private readonly mediaLogsService: MediaLogsService) {}

  // ==================== LOG OPERATIONS ====================

  @Post()
  @ApiOperation({
    summary: 'Registrar visualización de película/serie',
    description:
      'Crea un log de visualización con calificación y reseña. Solo necesitas el TMDb ID: ' +
      'automáticamente busca en cache, si no existe la obtiene de TMDb y la cachea, luego crea el log.',
  })
  @ApiBody({
    type: LogMediaViewDto,
    description: 'Datos del log de visualización',
    examples: {
      movie: {
        summary: 'Ejemplo: Película con reseña completa',
        value: {
          tmdbId: 550,
          mediaType: 'movie',
          hadSeenBefore: false,
          rating: 4.5,
          review: 'Increíble película con giros inesperados y actuaciones espectaculares!',
          reviewLang: 'es',
          notes: 'Vi esta película en el cine con amigos, fue una experiencia increíble',
        },
      },
      movieSimple: {
        summary: 'Ejemplo: Película sin reseña (solo rating)',
        value: {
          tmdbId: 680,
          mediaType: 'movie',
          hadSeenBefore: false,
          rating: 3.5,
        },
      },
      tvShow: {
        summary: 'Ejemplo: Serie con notas',
        value: {
          tmdbId: 1396,
          mediaType: 'tv',
          hadSeenBefore: true,
          rating: 5.0,
          notes: 'Re-watch de mi serie favorita, sigue siendo perfecta',
        },
      },
      rewatch: {
        summary: 'Ejemplo: Re-visualización',
        value: {
          tmdbId: 550,
          mediaType: 'movie',
          hadSeenBefore: true,
          rating: 5.0,
          review: 'Segunda vez que la veo, entendí muchos más detalles. Obra maestra!',
          reviewLang: 'es',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Visualización registrada exitosamente',
    schema: {
      example: {
        id: 'abc123xyz',
        userId: 'user_firebase_uid',
        tmdbId: 550,
        mediaType: 'movie',
        watchedAt: {
          _seconds: 1699048800,
          _nanoseconds: 0,
        },
        hadSeenBefore: false,
        rating: 4.5,
        review: 'Increíble película con giros inesperados!',
        reviewLang: 'es',
        notes: 'Vi esta película en el cine con amigos',
        createdAt: {
          _seconds: 1699048800,
          _nanoseconds: 0,
        },
        updatedAt: {
          _seconds: 1699048800,
          _nanoseconds: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: ['TMDb ID debe ser un número entero', 'Rating debe estar entre 0 y 5'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Media no encontrada en TMDb',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Error al obtener detalles de la película: The resource you requested could not be found.',
        error: 'Not Found',
      },
    },
  })
  async logMediaView(@CurrentUser() user: { uid: string }, @Body() logData: LogMediaViewDto) {
    return this.mediaLogsService.logMediaView(user.uid, logData);
  }

  @Get('my-logs')
  @ApiOperation({
    summary: 'Obtener mis logs de visualización',
    description:
      'Obtiene el historial de visualización del usuario ordenado por más reciente primero',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número máximo de logs a retornar',
    example: 50,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Logs obtenidos exitosamente',
    schema: {
      example: [
        {
          id: 'log_abc123',
          userId: 'user_firebase_uid',
          tmdbId: 550,
          mediaType: 'movie',
          watchedAt: { _seconds: 1699048800, _nanoseconds: 0 },
          hadSeenBefore: false,
          rating: 4.5,
          review: 'Increíble película!',
          reviewLang: 'es',
          createdAt: { _seconds: 1699048800, _nanoseconds: 0 },
          updatedAt: { _seconds: 1699048800, _nanoseconds: 0 },
        },
        {
          id: 'log_xyz789',
          userId: 'user_firebase_uid',
          tmdbId: 1396,
          mediaType: 'tv',
          watchedAt: { _seconds: 1699045200, _nanoseconds: 0 },
          hadSeenBefore: true,
          rating: 5.0,
          notes: 'Re-watch de mi serie favorita',
          createdAt: { _seconds: 1699045200, _nanoseconds: 0 },
          updatedAt: { _seconds: 1699045200, _nanoseconds: 0 },
        },
      ],
    },
  })
  async getMyLogs(
    @CurrentUser() user: { uid: string },
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.mediaLogsService.getUserLogs(user.uid, limit);
  }

  @Get('my-logs/:tmdbId/:mediaType')
  @ApiOperation({
    summary: 'Obtener logs de una película/serie específica',
    description:
      'Obtiene todos los logs de visualización de una película/serie específica (útil para ver historial de re-visualizaciones)',
  })
  @ApiParam({
    name: 'tmdbId',
    description: 'ID de TMDb de la película/serie',
    example: 550,
    type: Number,
  })
  @ApiParam({
    name: 'mediaType',
    enum: ['movie', 'tv'],
    description: 'Tipo de media',
    example: 'movie',
  })
  @ApiResponse({
    status: 200,
    description: 'Logs de la media obtenidos exitosamente',
    schema: {
      example: [
        {
          id: 'log_first',
          userId: 'user_firebase_uid',
          tmdbId: 550,
          mediaType: 'movie',
          watchedAt: { _seconds: 1699048800, _nanoseconds: 0 },
          hadSeenBefore: false,
          rating: 4.0,
          review: 'Primera vez que la veo, muy buena!',
          createdAt: { _seconds: 1699048800, _nanoseconds: 0 },
          updatedAt: { _seconds: 1699048800, _nanoseconds: 0 },
        },
        {
          id: 'log_second',
          userId: 'user_firebase_uid',
          tmdbId: 550,
          mediaType: 'movie',
          watchedAt: { _seconds: 1699135200, _nanoseconds: 0 },
          hadSeenBefore: true,
          rating: 5.0,
          review: 'Segunda vez, entendí más detalles. Obra maestra!',
          createdAt: { _seconds: 1699135200, _nanoseconds: 0 },
          updatedAt: { _seconds: 1699135200, _nanoseconds: 0 },
        },
      ],
    },
  })
  async getMyMediaLogs(
    @CurrentUser() user: { uid: string },
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Param('mediaType') mediaType: 'movie' | 'tv',
  ) {
    return this.mediaLogsService.getUserMediaLogs(user.uid, tmdbId, mediaType);
  }

  // ==================== STATISTICS ====================

  @Get('stats/me')
  @ApiOperation({
    summary: 'Obtener estadísticas de visualización',
    description:
      'Obtiene estadísticas completas de visualización del usuario actual: ' +
      'películas/series únicas vistas, total de visualizaciones, reseñas, promedio de calificación',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        totalMoviesWatched: 45,
        totalTvShowsWatched: 12,
        totalViews: 60,
        totalReviews: 30,
        averageRating: 4.2,
        lastWatchedAt: {
          _seconds: 1699048800,
          _nanoseconds: 0,
        },
      },
    },
  })
  async getMyStats(@CurrentUser() user: { uid: string }) {
    return this.mediaLogsService.getUserStats(user.uid);
  }

  // ==================== SINGLE LOG OPERATIONS ====================

  @Get(':logId')
  @ApiOperation({
    summary: 'Obtener log específico por ID',
    description: 'Obtiene un log de visualización específico (solo el propietario puede verlo)',
  })
  @ApiParam({
    name: 'logId',
    description: 'ID del documento de Firestore',
    example: 'log_abc123xyz',
  })
  @ApiResponse({
    status: 200,
    description: 'Log obtenido exitosamente',
    schema: {
      example: {
        id: 'log_abc123xyz',
        userId: 'user_firebase_uid',
        tmdbId: 550,
        mediaType: 'movie',
        watchedAt: { _seconds: 1699048800, _nanoseconds: 0 },
        hadSeenBefore: false,
        rating: 4.5,
        review: 'Increíble película con giros inesperados!',
        reviewLang: 'es',
        notes: 'Vi esta película en el cine',
        createdAt: { _seconds: 1699048800, _nanoseconds: 0 },
        updatedAt: { _seconds: 1699048800, _nanoseconds: 0 },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para ver este log',
    schema: {
      example: {
        statusCode: 403,
        message: 'No tienes permiso para ver este log',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Log no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Log no encontrado',
        error: 'Not Found',
      },
    },
  })
  async getLogById(@CurrentUser() user: { uid: string }, @Param('logId') logId: string) {
    return this.mediaLogsService.getLogById(logId, user.uid);
  }

  @Put(':logId')
  @ApiOperation({
    summary: 'Actualizar un log de visualización',
    description:
      'Actualiza la calificación, reseña o notas de un log existente (solo el propietario)',
  })
  @ApiParam({
    name: 'logId',
    description: 'ID del documento de Firestore',
    example: 'log_abc123xyz',
  })
  @ApiBody({
    type: UpdateMediaLogDto,
    description: 'Datos a actualizar del log',
    examples: {
      updateRating: {
        summary: 'Ejemplo: Actualizar solo rating',
        value: {
          rating: 5.0,
        },
      },
      updateReview: {
        summary: 'Ejemplo: Actualizar reseña',
        value: {
          review: 'Después de verla de nuevo, definitivamente es una obra maestra absoluta!',
          reviewLang: 'es',
        },
      },
      updateAll: {
        summary: 'Ejemplo: Actualizar todo',
        value: {
          rating: 5.0,
          review: 'Después de verla de nuevo, es perfecta. Noté muchos más detalles!',
          reviewLang: 'es',
          notes: 'Re-watch en casa, ahora entiendo por qué es un clásico',
        },
      },
      updateNotes: {
        summary: 'Ejemplo: Actualizar solo notas',
        value: {
          notes: 'La vi en una pantalla IMAX y la experiencia fue increíble',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Log actualizado exitosamente',
    schema: {
      example: {
        id: 'log_abc123xyz',
        userId: 'user_firebase_uid',
        tmdbId: 550,
        mediaType: 'movie',
        watchedAt: { _seconds: 1699048800, _nanoseconds: 0 },
        hadSeenBefore: false,
        rating: 5.0,
        review: 'Después de verla de nuevo, es una obra maestra absoluta!',
        reviewLang: 'es',
        notes: 'Vi esta película en el cine',
        createdAt: { _seconds: 1699048800, _nanoseconds: 0 },
        updatedAt: { _seconds: 1699135200, _nanoseconds: 0 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No se proporcionaron campos para actualizar',
    schema: {
      example: {
        statusCode: 400,
        message: 'Debes proporcionar al menos un campo para actualizar',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para actualizar este log',
    schema: {
      example: {
        statusCode: 403,
        message: 'No tienes permiso para editar este log',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Log no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Log no encontrado',
        error: 'Not Found',
      },
    },
  })
  async updateLog(
    @CurrentUser() user: { uid: string },
    @Param('logId') logId: string,
    @Body() updateData: UpdateMediaLogDto,
  ) {
    return this.mediaLogsService.updateLog(logId, user.uid, updateData);
  }

  @Delete(':logId')
  @ApiOperation({
    summary: 'Eliminar un log de visualización',
    description:
      'Elimina permanentemente un log de visualización y actualiza las estadísticas (solo el propietario)',
  })
  @ApiParam({
    name: 'logId',
    description: 'ID del documento de Firestore',
    example: 'log_abc123xyz',
  })
  @ApiResponse({
    status: 200,
    description: 'Log eliminado exitosamente',
    schema: {
      example: {
        message: 'Log eliminado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para eliminar este log',
    schema: {
      example: {
        statusCode: 403,
        message: 'No tienes permiso para eliminar este log',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Log no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Log no encontrado',
        error: 'Not Found',
      },
    },
  })
  async deleteLog(@CurrentUser() user: { uid: string }, @Param('logId') logId: string) {
    await this.mediaLogsService.deleteLog(logId, user.uid);
    return { message: 'Log eliminado exitosamente' };
  }
}
