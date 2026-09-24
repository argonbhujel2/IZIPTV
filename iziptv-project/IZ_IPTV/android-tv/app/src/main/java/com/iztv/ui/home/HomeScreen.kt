package com.iztv.ui.home

import android.content.Intent
import android.content.pm.PackageManager
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Surface
import androidx.tv.material3.Text
import com.iztv.IzIptvApp
import com.iztv.data.api.ApiClient
import com.iztv.data.model.AppConfig
import com.iztv.ui.live.LiveTvScreen
import com.iztv.ui.movies.MoviesScreen
import com.iztv.ui.settings.SettingsScreen
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

sealed class HomeNav {
    object Main : HomeNav()
    object LiveTv : HomeNav()
    object Movies : HomeNav()
    object Series : HomeNav()
    object Settings : HomeNav()
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun HomeScreen(fullName: String, onLogout: () -> Unit) {
    var nav by remember { mutableStateOf<HomeNav>(HomeNav.Main) }
    var config by remember { mutableStateOf<AppConfig?>(null) }
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        try {
            val res = withContext(Dispatchers.IO) { ApiClient.service.config() }
            if (res.success) config = res.data
        } catch (_: Exception) { /* use defaults */ }
    }

    when (nav) {
        is HomeNav.LiveTv -> LiveTvScreen(onBack = { nav = HomeNav.Main })
        is HomeNav.Movies -> MoviesScreen(onBack = { nav = HomeNav.Main })
        is HomeNav.Settings -> SettingsScreen(
            fullName = fullName,
            onBack = { nav = HomeNav.Main },
            onLogout = onLogout
        )
        is HomeNav.Series -> {
            // Reuse movies pattern — series list
            MoviesScreen(onBack = { nav = HomeNav.Main }, seriesMode = true)
        }
        is HomeNav.Main -> {
            val bgUrl = config?.homeBackgroundUrl
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF0F172A))
                        )
                    )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(48.dp)
                ) {
                    // Header
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            config?.appName ?: "IZ_IPTV",
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF38BDF8)
                        )
                        Surface(
                            onClick = { nav = HomeNav.Settings },
                            scale = ClickableSurfaceDefaults.scale(focusedScale = 1.1f),
                            colors = ClickableSurfaceDefaults.colors(
                                containerColor = Color.Transparent,
                                focusedContainerColor = Color(0xFF334155)
                            )
                        ) {
                            Text("⚙ Settings", color = Color(0xFF94A3B8), fontSize = 16.sp,
                                modifier = Modifier.padding(12.dp))
                        }
                    }

                    Spacer(Modifier.height(24.dp))
                    Text(
                        "Welcome, $fullName",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White
                    )
                    Spacer(Modifier.height(48.dp))

                    // Main sections
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(24.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (config?.liveTvEnabled != false) {
                            HomeCard("LIVE TV", "📡", Color(0xFF0EA5E9)) { nav = HomeNav.LiveTv }
                        }
                        if (config?.moviesEnabled != false) {
                            HomeCard("MOVIES", "🎬", Color(0xFF8B5CF6)) { nav = HomeNav.Movies }
                        }
                        if (config?.seriesEnabled != false) {
                            HomeCard("SERIES", "📺", Color(0xFFEC4899)) { nav = HomeNav.Series }
                        }
                    }

                    Spacer(Modifier.height(40.dp))
                    Text("APPS", fontSize = 18.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Medium)
                    Spacer(Modifier.height(16.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                        if (config?.youtubeEnabled != false) {
                            AppCard("YouTube", "com.google.android.youtube.tv", context)
                        }
                        if (config?.netflixEnabled != false) {
                            AppCard("Netflix", "com.netflix.ninja", context)
                        }
                        if (config?.appsEnabled != false) {
                            config?.apps?.filter { it.homeVisible }?.forEach { app ->
                                if (app.packageName !in listOf(
                                        "com.google.android.youtube.tv",
                                        "com.netflix.ninja"
                                    )
                                ) {
                                    AppCard(app.name, app.packageName, context)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun HomeCard(title: String, emoji: String, accent: Color, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        modifier = Modifier
            .width(220.dp)
            .height(140.dp),
        scale = ClickableSurfaceDefaults.scale(focusedScale = 1.08f),
        colors = ClickableSurfaceDefaults.colors(
            containerColor = Color(0xFF1E293B),
            focusedContainerColor = accent.copy(alpha = 0.25f)
        ),
        border = androidx.tv.material3.ClickableSurfaceDefaults.border(
            focusedBorder = androidx.tv.material3.Border(
                border = androidx.compose.foundation.BorderStroke(3.dp, accent),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
            )
        ),
        shape = androidx.tv.material3.ClickableSurfaceDefaults.shape(
            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
        )
    ) {
        Column(
            Modifier.fillMaxSize().padding(20.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(emoji, fontSize = 36.sp)
            Spacer(Modifier.height(8.dp))
            Text(title, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun AppCard(name: String, packageName: String, context: android.content.Context) {
    val installed = remember(packageName) {
        try {
            context.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (_: PackageManager.NameNotFoundException) {
            false
        }
    }

    Surface(
        onClick = {
            if (installed) {
                val launch = context.packageManager.getLaunchIntentForPackage(packageName)
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(launch)
                }
            }
        },
        modifier = Modifier
            .width(160.dp)
            .height(90.dp),
        scale = ClickableSurfaceDefaults.scale(focusedScale = 1.08f),
        colors = ClickableSurfaceDefaults.colors(
            containerColor = if (installed) Color(0xFF1E293B) else Color(0xFF1E293B).copy(alpha = 0.5f),
            focusedContainerColor = Color(0xFF334155)
        ),
        shape = androidx.tv.material3.ClickableSurfaceDefaults.shape(
            shape = androidx.compose.foundation.shape.RoundedCornerShape(10.dp)
        )
    ) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(name, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                if (!installed) {
                    Text("Not installed", fontSize = 11.sp, color = Color(0xFF64748B))
                }
            }
        }
    }
}
