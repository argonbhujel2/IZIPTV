package com.iztv

import android.app.Application
import com.iztv.data.local.SessionManager
import com.iztv.data.api.ApiClient

class IzIptvApp : Application() {
    lateinit var sessionManager: SessionManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        sessionManager = SessionManager(this)
        ApiClient.init(sessionManager)
    }

    companion object {
        lateinit var instance: IzIptvApp
            private set
    }
}
