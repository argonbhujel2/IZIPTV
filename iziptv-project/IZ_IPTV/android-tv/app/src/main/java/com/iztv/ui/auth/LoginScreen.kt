package com.iztv.ui.auth

import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Surface
import androidx.tv.material3.Text
import com.iztv.BuildConfig
import com.iztv.IzIptvApp
import com.iztv.data.api.ApiClient
import com.iztv.data.model.DeviceInfo
import com.iztv.data.model.LoginRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun LoginScreen(onSuccess: (String) -> Unit) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val userFocus = remember { FocusRequester() }
    val session = IzIptvApp.instance.sessionManager

    LaunchedEffect(Unit) { userFocus.requestFocus() }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF0F172A), Color(0xFF0C4A6E), Color(0xFF0F172A))
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(420.dp)
        ) {
            Text(
                "IZ_IPTV",
                fontSize = 48.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF38BDF8)
            )
            Spacer(Modifier.height(8.dp))
            Text("Subscriber Login", fontSize = 18.sp, color = Color(0xFF94A3B8))
            Spacer(Modifier.height(40.dp))

            FieldLabel("Username")
            TvTextField(
                value = username,
                onValueChange = { username = it },
                modifier = Modifier.focusRequester(userFocus),
                isPassword = false
            )
            Spacer(Modifier.height(20.dp))
            FieldLabel("Password")
            TvTextField(
                value = password,
                onValueChange = { password = it },
                isPassword = true
            )

            if (error != null) {
                Spacer(Modifier.height(16.dp))
                Text(error!!, color = Color(0xFFF87171), fontSize = 14.sp)
            }

            Spacer(Modifier.height(32.dp))

            Surface(
                onClick = {
                    if (loading || username.isBlank() || password.isBlank()) return@Surface
                    loading = true
                    error = null
                    scope.launch {
                        try {
                            val res = withContext(Dispatchers.IO) {
                                ApiClient.service.login(
                                    LoginRequest(
                                        username = username.trim(),
                                        password = password,
                                        deviceId = session.deviceId,
                                        deviceInfo = DeviceInfo(
                                            model = Build.MODEL,
                                            manufacturer = Build.MANUFACTURER,
                                            androidVersion = Build.VERSION.RELEASE,
                                            appVersion = BuildConfig.VERSION_NAME
                                        )
                                    )
                                )
                            }
                            if (res.success && res.data != null) {
                                val d = res.data
                                session.saveSession(
                                    d.accessToken,
                                    d.refreshToken,
                                    d.user.id,
                                    d.user.username,
                                    d.user.fullName
                                )
                                onSuccess(d.user.fullName)
                            } else {
                                error = res.error?.message ?: "Login failed"
                            }
                        } catch (e: Exception) {
                            error = "Cannot reach IZ_IPTV server. Check network."
                        } finally {
                            loading = false
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                scale = ClickableSurfaceDefaults.scale(focusedScale = 1.05f),
                colors = ClickableSurfaceDefaults.colors(
                    containerColor = Color(0xFF0EA5E9),
                    focusedContainerColor = Color(0xFF38BDF8),
                    pressedContainerColor = Color(0xFF0284C7)
                )
            ) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        if (loading) "Signing in…" else "LOGIN",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = Color(0xFF0F172A)
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun FieldLabel(text: String) {
    Text(
        text,
        fontSize = 14.sp,
        color = Color(0xFF94A3B8),
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 6.dp)
    )
}

@Composable
private fun TvTextField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    isPassword: Boolean = false
) {
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        singleLine = true,
        visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
        textStyle = TextStyle(color = Color.White, fontSize = 18.sp),
        cursorBrush = SolidColor(Color(0xFF38BDF8)),
        modifier = modifier
            .fillMaxWidth()
            .background(Color(0xFF1E293B), shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp))
            .padding(horizontal = 16.dp, vertical = 14.dp)
    )
}
