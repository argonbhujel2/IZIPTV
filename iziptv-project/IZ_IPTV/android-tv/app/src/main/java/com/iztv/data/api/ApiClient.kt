package com.iztv.data.api

import com.iztv.BuildConfig
import com.iztv.data.local.SessionManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    private var sessionManager: SessionManager? = null
    private var _service: ApiService? = null

    fun init(sm: SessionManager) {
        sessionManager = sm
        _service = null
    }

    val service: ApiService
        get() {
            if (_service == null) {
                val authInterceptor = Interceptor { chain ->
                    val req = chain.request().newBuilder()
                    sessionManager?.accessToken?.let {
                        req.addHeader("Authorization", "Bearer $it")
                    }
                    req.addHeader("Accept", "application/json")
                    chain.proceed(req.build())
                }

                val logging = HttpLoggingInterceptor().apply {
                    level = if (BuildConfig.DEBUG)
                        HttpLoggingInterceptor.Level.BODY
                    else
                        HttpLoggingInterceptor.Level.NONE
                }

                val client = OkHttpClient.Builder()
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .readTimeout(30, TimeUnit.SECONDS)
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .addInterceptor(authInterceptor)
                    .addInterceptor(logging)
                    .build()

                val baseUrl = BuildConfig.API_BASE_URL.let {
                    if (it.endsWith("/")) it else "$it/"
                }

                _service = Retrofit.Builder()
                    .baseUrl(baseUrl)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()
                    .create(ApiService::class.java)
            }
            return _service!!
        }
}
