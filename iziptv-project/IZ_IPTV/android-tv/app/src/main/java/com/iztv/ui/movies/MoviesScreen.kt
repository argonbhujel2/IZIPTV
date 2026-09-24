package com.iztv.ui.movies

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Surface
import androidx.tv.material3.Text
import com.iztv.data.api.ApiClient
import com.iztv.data.model.Movie
import com.iztv.data.model.SeriesItem
import com.iztv.ui.player.PlayerActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun MoviesScreen(onBack: () -> Unit, seriesMode: Boolean = false) {
    var movies by remember { mutableStateOf<List<Movie>>(emptyList()) }
    var series by remember { mutableStateOf<List<SeriesItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current
    val title = if (seriesMode) "SERIES" else "MOVIES"

    LaunchedEffect(seriesMode) {
        try {
            if (seriesMode) {
                val res = withContext(Dispatchers.IO) { ApiClient.service.series() }
                if (res.success) series = res.data ?: emptyList()
                else error = res.error?.message
            } else {
                val res = withContext(Dispatchers.IO) { ApiClient.service.movies() }
                if (res.success) movies = res.data ?: emptyList()
                else error = res.error?.message
            }
        } catch (e: Exception) {
            error = "Network error"
        } finally {
            loading = false
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(32.dp)
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(title, fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
            Surface(
                onClick = onBack,
                scale = ClickableSurfaceDefaults.scale(focusedScale = 1.1f),
                colors = ClickableSurfaceDefaults.colors(
                    containerColor = Color(0xFF1E293B),
                    focusedContainerColor = Color(0xFF334155)
                )
            ) {
                Text("← Back", modifier = Modifier.padding(12.dp), color = Color.White)
            }
        }
        Spacer(Modifier.height(24.dp))

        when {
            loading -> Text("Loading…", color = Color(0xFF94A3B8))
            error != null -> Text(error!!, color = Color(0xFFF87171))
            else -> {
                val items = if (seriesMode) series.map { it.id to it.title } else movies.map { it.id to it.title }
                if (items.isEmpty()) {
                    Text("No content available", color = Color(0xFF94A3B8))
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Adaptive(160.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        if (seriesMode) {
                            items(series, key = { it.id }) { s ->
                                ContentCard(s.title, s.year?.toString() ?: "") {
                                    // Series detail would open seasons; for MVP open first available if stream known
                                }
                            }
                        } else {
                            items(movies, key = { it.id }) { m ->
                                ContentCard(m.title, m.year?.toString() ?: "") {
                                    val intent = Intent(context, PlayerActivity::class.java).apply {
                                        putExtra("streamUrl", m.streamUrl)
                                        putExtra("title", m.title)
                                    }
                                    context.startActivity(intent)
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
private fun ContentCard(title: String, subtitle: String, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        modifier = Modifier.width(160.dp).height(200.dp),
        scale = ClickableSurfaceDefaults.scale(focusedScale = 1.08f),
        colors = ClickableSurfaceDefaults.colors(
            containerColor = Color(0xFF1E293B),
            focusedContainerColor = Color(0xFF334155)
        )
    ) {
        Column(
            Modifier.fillMaxSize().padding(12.dp),
            verticalArrangement = Arrangement.Bottom
        ) {
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White, maxLines = 2)
            if (subtitle.isNotBlank()) {
                Text(subtitle, fontSize = 12.sp, color = Color(0xFF64748B))
            }
        }
    }
}
