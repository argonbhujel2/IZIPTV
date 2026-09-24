package com.iztv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.tv.material3.ExperimentalTvMaterial3Api
import com.iztv.data.api.ApiClient
import com.iztv.data.local.SessionManager
import com.iztv.ui.auth.LoginScreen
import com.iztv.ui.common.SplashScreen
import com.iztv.ui.home.HomeScreen
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

sealed class AppState {
    object Splash : AppState()
    object Login : AppState()
    data class Home(val fullName: String) : AppState()
    data class Error(val message: String, val retry: () -> Unit) : AppState()
}

@OptIn(ExperimentalTvMaterial3Api::class)
class MainActivity : ComponentActivity() {
    private lateinit var session: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        session = IzIptvApp.instance.sessionManager

        setContent {
            var state by remember { mutableStateOf<AppState>(AppState.Splash) }

            LaunchedEffect(Unit) {
                // Splash + session check
                kotlinx.coroutines.delay(1200)
                if (session.isLoggedIn) {
                    try {
                        val res = withContext(Dispatchers.IO) {
                            ApiClient.service.session()
                        }
                        if (res.success) {
                            state = AppState.Home(session.fullName ?: "User")
                        } else {
                            session.clear()
                            state = AppState.Login
                        }
                    } catch (e: Exception) {
                        // Offline with cached session — allow limited use
                        if (session.isLoggedIn) {
                            state = AppState.Home(session.fullName ?: "User")
                        } else {
                            state = AppState.Login
                        }
                    }
                } else {
                    state = AppState.Login
                }
            }

            when (val s = state) {
                is AppState.Splash -> SplashScreen()
                is AppState.Login -> LoginScreen(
                    onSuccess = { name -> state = AppState.Home(name) }
                )
                is AppState.Home -> HomeScreen(
                    fullName = s.fullName,
                    onLogout = {
                        session.clear()
                        state = AppState.Login
                    }
                )
                is AppState.Error -> {
                    // Simple error display handled in screens
                }
            }
        }
    }
}
