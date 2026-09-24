-keepattributes Signature
-keepattributes *Annotation*
-keep class com.iztv.data.model.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-dontwarn okhttp3.**
-dontwarn retrofit2.**
-dontwarn okio.**
