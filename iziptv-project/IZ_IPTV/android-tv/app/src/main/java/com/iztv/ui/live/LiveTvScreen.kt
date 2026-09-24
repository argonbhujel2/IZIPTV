package com.iztv.ui.live

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.iztv.IzIptvApp
import com.iztv.data.api.ApiClient
import com.iztv.data.model.Channel
import com.iztv.ui.player.PlayerActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun LiveTvScreen(onBack: () -> Unit) {
    var channels by remember { mutableStateOf<List<Channel>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current
    val session = IzIptvApp.instance.sessionManager

    LaunchedEffect(Unit) {
        try {
            val res = withContext(Dispatchers.IO) { ApiClient.service.channels() }
            if (res.success && res.data != null) {
                channels = res.data
            } else {
                error = res.error?.message ?: "Failed to load channels"
            }
        } catch (e: Exception) {
            error = "Network error. Check connection."
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
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("LIVE TV", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
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
            loading -> Text("Loading channels…", color = Color(0xFF94A3B8))
            error != null -> Text(error!!, color = Color(0xFFF87171))
            channels.isEmpty() -> Text("No channels available", color = Color(0xFF94A3B8))
            else -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(channels, key = { it.id }) { ch ->
                        Surface(
                            onClick = {
                                session.lastChannelId = ch.id
                                val intent = Intent(context, PlayerActivity::class.java).apply {
                                    putExtra("streamUrl", ch.streamUrl)
                                    putExtra("title", ch.name)
                                    putExtra("channelId", ch.id)
                                }
                                context.startActivity(intent)
                            },
                            modifier = Modifier.fillMaxWidth().height(64.dp),
                            scale = ClickableSurfaceDefaults.scale(focusedScale = 1.02f),
                            colors = ClickableSurfaceDefaults.colors(
                                containerColor = Color(0xFF1E293B),
                                focusedContainerColor = Color(0xFF0EA5E9).copy(alpha = 0.3f)
                            )
                        ) {
                            Row(
                                Modifier.fillMaxSize().padding(horizontal = 20.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                if (ch.number != null) {
                                    Text(
                                        "${ch.number}",
                                        fontSize = 16.sp,
                                        color = Color(0xFF64748B),
                                        modifier = Modifier.width(48.dp)
                                    )
                                }
                                Text(ch.name, fontSize = 18.sp, color = Color.White, fontWeight = FontWeight.Medium)
                                Spacer(Modifier.weight(1f))
                                ch.category?.let {
                                    Text(it.name, fontSize = 13.sp, color = Color(0xFF64748B))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
