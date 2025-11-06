# 🎮 Game Module (Future Feature)

Este módulo contiene los modelos y lógica para el **minijuego de quotes** de películas.

## 📋 Descripción

El minijuego permite a los usuarios competir adivinando de qué película provienen ciertas frases (quotes).

## 📁 Archivos

- `match.model.ts` - Modelos para partidas del juego, rondas, scoreboard, ligas
- `movie-quote.model.ts` - Modelos para las frases de películas usadas en el juego

## ⏰ Estado

**Pendiente de implementación**

Los modelos están definidos pero el servicio, controlador y lógica de negocio aún no están implementados.

## 🔮 Próximos pasos

1. Crear `game.service.ts` - Lógica del juego (matchmaking, puntuación, etc.)
2. Crear `game.controller.ts` - Endpoints para el juego
3. Crear `game.module.ts` - Módulo de NestJS
4. Implementar sistema de ligas
5. Crear sistema de quotes (agregar, aprobar, categorizar)
6. Implementar matchmaking para partidas
7. Sistema de puntos y ranking

## 🎯 Objetivo

Ofrecer una forma divertida y competitiva de interactuar con contenido de películas mientras se conecta con otros usuarios.
