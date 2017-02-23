# todocelmobile
Cordova project for todocelmobile

Compilar en local

```
cordova build android --release
```

```
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk waoo
```

```
/Users/user/Library/Android/sdk/build-tools/24.0.2/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk todocel.apk
```
