package com.iztv.data.local

import android.content.Context
import android.content.SharedPreferences
import java.util.UUID

class SessionManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("iz_iptv_session", Context.MODE_PRIVATE)

    var accessToken: String?
        get() = prefs.getString(KEY_ACCESS, null)
        set(v) = prefs.edit().putString(KEY_ACCESS, v).apply()

    var refreshToken: String?
        get() = prefs.getString(KEY_REFRESH, null)
        set(v) = prefs.edit().putString(KEY_REFRESH, v).apply()

    var userId: String?
        get() = prefs.getString(KEY_USER_ID, null)
        set(v) = prefs.edit().putString(KEY_USER_ID, v).apply()

    var fullName: String?
        get() = prefs.getString(KEY_FULL_NAME, null)
        set(v) = prefs.edit().putString(KEY_FULL_NAME, v).apply()

    var username: String?
        get() = prefs.getString(KEY_USERNAME, null)
        set(v) = prefs.edit().putString(KEY_USERNAME, v).apply()

    var lastChannelId: String?
        get() = prefs.getString(KEY_LAST_CHANNEL, null)
        set(v) = prefs.edit().putString(KEY_LAST_CHANNEL, v).apply()

    val deviceId: String
        get() {
            var id = prefs.getString(KEY_DEVICE_ID, null)
            if (id.isNullOrBlank()) {
                id = "iztv-" + UUID.randomUUID().toString().replace("-", "").take(24)
                prefs.edit().putString(KEY_DEVICE_ID, id).apply()
            }
            return id
        }

    val isLoggedIn: Boolean
        get() = !accessToken.isNullOrBlank()

    fun saveSession(
        access: String,
        refresh: String,
        userId: String,
        username: String,
        fullName: String
    ) {
        prefs.edit()
            .putString(KEY_ACCESS, access)
            .putString(KEY_REFRESH, refresh)
            .putString(KEY_USER_ID, userId)
            .putString(KEY_USERNAME, username)
            .putString(KEY_FULL_NAME, fullName)
            .apply()
    }

    fun clear() {
        val did = deviceId
        prefs.edit().clear().apply()
        prefs.edit().putString(KEY_DEVICE_ID, did).apply()
    }

    companion object {
        private const val KEY_ACCESS = "access_token"
        private const val KEY_REFRESH = "refresh_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USERNAME = "username"
        private const val KEY_FULL_NAME = "full_name"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_LAST_CHANNEL = "last_channel_id"
    }
}
