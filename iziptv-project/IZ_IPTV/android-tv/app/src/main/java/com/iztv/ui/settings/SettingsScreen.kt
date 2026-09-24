package com.iztv.ui.settings

import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Surface
import androidx.tv.material3.Text
import com.iztv.BuildConfig
import com.iztv.IzIptvApp
import com.iztv.data.api.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun SettingsScreen(fullName: String, onBack: () -> Unit, onLogout: () -> Unit) {
    val session = IzIptvApp.instance.sessionManager
    val scope = rememberCoroutineScope()
    var serverStatus by remember { mutableStateOf("Checking…") }

    LaunchedEffect(Unit) {
        try {
            withContext(Dispatchers.IO) { ApiClient.service.session() }
            serverStatus = "Online"
        } catch (_: Exception) {
            serverStatus = "Unavailable"
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(48.dp)
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Settings", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
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

        Spacer(Modifier.height(32.dp))

        Section("Account") {
            InfoRow("Name", fullName)
            InfoRow("Username", session.username ?: "—")
            InfoRow("Status", "Active")
        }

        Spacer(Modifier.height(24.dp))
        Section("Device") {
            InfoRow("Device ID", session.deviceId.take(20) + "…")
            InfoRow("Model", Build.MODEL)
            InfoRow("Android", Build.VERSION.RELEASE)
            InfoRow("App Version", BuildConfig.VERSION_NAME)
        }

        Spacer(Modifier.height(24.dp))
        Section("Network") {
            InfoRow("IZ_IPTV Server", serverStatus)
        }

        Spacer(Modifier.height(40.dp))
        Surface(
            onClick = {
                scope.launch {
                    try {
                        withContext(Dispatchers.IO) { ApiClient.service.logout() }
                    } catch (_: Exception) { }
                    session.clear()
                    onLogout()
                }
            },
            modifier = Modifier.width(200.dp).height(48.dp),
            scale = ClickableSurfaceDefaults.scale(focusedScale = 1.05f),
            colors = ClickableSurfaceDefaults.colors(
                containerColor = Color(0xFFEF4444).copy(alpha = 0.2f),
                focusedContainerColor = Color(0xFFEF4444).copy(alpha = 0.4f)
            )
        ) {
            Box(Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                Text("Logout", color = Color(0xFFF87171), fontWeight = FontWeight.Bold)
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    Text(title, fontSize = 16.sp, color = Color(0xFF64748B), fontWeight = FontWeight.Medium)
    Spacer(Modifier.height(8.dp))
    content()
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = Color(0xFF94A3B8), fontSize = 15.sp)
        Text(value, color = Color.White, fontSize = 15.sp)
    }
}
