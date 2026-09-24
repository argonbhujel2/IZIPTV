package com.iztv.ui.player

import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.iztv.R

class PlayerActivity : ComponentActivity() {
    private var player: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var bufferIndicator: ProgressBar? = null
    private var errorText: TextView? = null
    private var titleText: TextView? = null
    private var retryCount = 0
    private val maxRetries = 3
    private var streamUrl: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(R.layout.activity_player)

        playerView = findViewById(R.id.player_view)
        bufferIndicator = findViewById(R.id.buffer_indicator)
        errorText = findViewById(R.id.error_text)
        titleText = findViewById(R.id.title_text)

        streamUrl = intent.getStringExtra("streamUrl")
        val title = intent.getStringExtra("title") ?: "IZ_IPTV"
        titleText?.text = title

        if (streamUrl.isNullOrBlank()) {
            showError("No stream URL")
            return
        }

        initPlayer()
    }

    private fun initPlayer() {
        player = ExoPlayer.Builder(this).build().also { exo ->
            playerView?.player = exo
            exo.addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(state: Int) {
                    when (state) {
                        Player.STATE_BUFFERING -> {
                            bufferIndicator?.visibility = View.VISIBLE
                            errorText?.visibility = View.GONE
                        }
                        Player.STATE_READY -> {
                            bufferIndicator?.visibility = View.GONE
                            retryCount = 0
                        }
                        Player.STATE_ENDED -> { /* optional auto next */ }
                    }
                }

                override fun onPlayerError(error: PlaybackException) {
                    bufferIndicator?.visibility = View.GONE
                    if (retryCount < maxRetries) {
                        retryCount++
                        errorText?.visibility = View.VISIBLE
                        errorText?.text = "Reconnecting… ($retryCount/$maxRetries)"
                        playerView?.postDelayed({
                            exo.prepare()
                            exo.play()
                        }, (1000L * retryCount))
                    } else {
                        showError("Stream interrupted. Press Back to return.")
                    }
                }
            })

            val item = MediaItem.fromUri(streamUrl!!)
            exo.setMediaItem(item)
            exo.prepare()
            exo.playWhenReady = true
        }
    }

    private fun showError(msg: String) {
        errorText?.visibility = View.VISIBLE
        errorText?.text = msg
        bufferIndicator?.visibility = View.GONE
    }

    override fun onStop() {
        super.onStop()
        player?.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        player?.release()
        player = null
    }
}
