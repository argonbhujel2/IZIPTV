package com.iztv.data.api

import com.iztv.data.model.*
import retrofit2.http.*

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): ApiResponse<LoginData>

    @POST("api/auth/logout")
    suspend fun logout(): ApiResponse<Map<String, String>>

    @POST("api/auth/refresh")
    suspend fun refresh(@Body body: Map<String, String>): ApiResponse<Map<String, String>>

    @GET("api/auth/session")
    suspend fun session(): ApiResponse<Map<String, Any>>

    @GET("api/config")
    suspend fun config(): ApiResponse<AppConfig>

    @GET("api/channels")
    suspend fun channels(
        @Query("categoryId") categoryId: String? = null,
        @Query("search") search: String? = null
    ): ApiResponse<List<Channel>>

    @GET("api/categories")
    suspend fun categories(): ApiResponse<List<Category>>

    @GET("api/movies")
    suspend fun movies(
        @Query("search") search: String? = null,
        @Query("featured") featured: String? = null
    ): ApiResponse<List<Movie>>

    @GET("api/series")
    suspend fun series(@Query("search") search: String? = null): ApiResponse<List<SeriesItem>>

    @GET("api/series")
    suspend fun seriesDetail(@Query("id") id: String): ApiResponse<Map<String, Any>>

    @GET("api/app/version")
    suspend fun version(): ApiResponse<VersionInfo>

    @POST("api/device/status")
    suspend fun heartbeat(): ApiResponse<Map<String, Any>>
}
