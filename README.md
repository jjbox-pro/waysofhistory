# cordova_wofh

Cordova mobile waysofhistory project.

## Supported platforms

Platforms: android, ios.

## Used dependencies

— Quasar/icongenie creates logo in different sizes with representative names, placed in the correct folders and proper src-cordova/config.xml declarations.

```bash
npm install -g @quasar/cli

npm install -g @quasar/icongenie
```

— buildTools/buildSrc used for select and prepare only necessary files from raw sources.

## Used plugins
```bash
cordova plugin add https://github.com/jjbox-pro/cordova-plugin-platform-accessor.git

cordova plugin add cordova-plugin-googleplus --save --variable REVERSED_CLIENT_ID=com.googleusercontent.apps.530673218839-iroukardu627knpn91f0qrmog3omc4jk --variable WEB_APPLICATION_CLIENT_ID=530673218839-9vr964emi57ra48q9soe2vei25o5bkg5.apps.googleusercontent.com

cordova plugin add cordova-plugin-game-center

cordova plugin add cordova-plugin-nativestorage

cordova plugin add cordova-plugin-android-permissions

cordova plugin add cordova-plugin-splashscreen
```

### Build steps
```
1) Place unzipped raw sources into the srcRaw/ folder;

2) Run buildTools/buildSrc/build.sh for processing raw sources. Result will be placed into src/ folder for specific platform;

3) Run run_build_(debug|release).sh to build cordova project.
```

## Notes

### Plugman 

Used for creates own plugin for cordova.
```
npm i -g plugman (if not installed)

plugman create --name PluginName --plugin_id cordova-plugin-name --plugin_version 1.0.0

plugman platform add --platform_name android

plugman platform add --platform_name ios

plugman createpackagejson ./
```

### Platform android

Gradle. Set flags for full compilation:
```
path — /waysofhistory/platforms/android/build.gradle

allprojects {
    gradle.projectsEvaluated {
        tasks.withType(JavaCompile) {
            options.compilerArgs << "-Xlint:unchecked" << "-Xlint:deprecation"
        }
    }
}
```

Keytool. Make waysofhistory.keystore file for publish into android market.
```
-keystore waysofhistory.keystore -list -v
```

### Platform ios

After repository was cloned to make all sh scripts executable run fallow command:
```
find ./ -type f -iname "*.sh" -exec chmod u+x {} \;
```



