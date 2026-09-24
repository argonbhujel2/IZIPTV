package com.iztv.data.model

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiError? = null
)

data class ApiError(
    val code: String,
    val message: String
)

data class LoginRequest(
    val username: String,
    val password: String,
    val deviceId: String,
    val deviceInfo: DeviceInfo? = null
)

data class DeviceInfo(
    val model: String? = null,
    val manufacturer: String? = null,
    val androidVersion: String? = null,
    val appVersion: String? = null
)

data class LoginData(
    val accessToken: String,
    val refreshToken: String,
    val expiresAt: String,
    val user: UserInfo,
    val subscription: SubscriptionInfo,
    val device: DeviceStatus
)

data class UserInfo(
    val id: String,
    val username: String,
    val fullName: String,
    val status: String
)

data class SubscriptionInfo(
    val planName: String,
    val expiryDate: String,
    val status: String,
    val deviceLimit: Int
)

data class DeviceStatus(
    val deviceId: String,
    val status: String
)

data class AppConfig(
    val appName: String,
    val logoUrl: String?,
    val homeBackgroundUrl: String?,
    val homeBackgroundEnabled: Boolean,
    val maintenanceMode: Boolean,
    val maintenanceMessage: String?,
    val liveTvEnabled: Boolean,
    val moviesEnabled: Boolean,
    val seriesEnabled: Boolean,
    val appsEnabled: Boolean,
    val youtubeEnabled: Boolean,
    val netflixEnabled: Boolean,
    val latestVersion: String,
    val minimumSupportedVersion: String,
    val updateUrl: String?,
    val releaseNotes: String?,
    val forceUpdate: Boolean,
    val banners: List<BannerItem> = emptyList(),
    val apps: List<AppItem> = emptyList()
)

data class BannerItem(
    val id: String,
    val title: String,
    val description: String?,
    val imageUrl: String,
    val action: String,
    val actionValue: String?
)

data class AppItem(
    val id: String,
    val name: String,
    val packageName: String,
    val iconUrl: String?,
    val homeVisible: Boolean
)

data class Channel(
    val id: String,
    val name: String,
    val logoUrl: String?,
    val streamUrl: String,
    val number: Int?,
    val description: String?,
    val category: CategoryRef?,
    val sortOrder: Int
)

data class CategoryRef(
    val id: String,
    val name: String,
    val slug: String
)

data class Category(
    val id: String,
    val name: String,
    val slug: String,
    val iconUrl: String?,
    val channelCount: Int,
    val sortOrder: Int
)

data class Movie(
    val id: String,
    val title: String,
    val description: String?,
    val posterUrl: String?,
    val backdropUrl: String?,
    val genre: String?,
    val year: Int?,
    val duration: Int?,
    val rating: Float?,
    val streamUrl: String,
    val trailerUrl: String?,
    val featured: Boolean
)

data class SeriesItem(
    val id: String,
    val title: String,
    val description: String?,
    val posterUrl: String?,
    val backdropUrl: String?,
    val genre: String?,
    val year: Int?,
    val featured: Boolean,
    val seasonCount: Int? = null
)

data class VersionInfo(
    val latestVersion: String,
    val minimumSupportedVersion: String,
    val updateUrl: String?,
    val releaseNotes: String?,
    val forceUpdate: Boolean
)
