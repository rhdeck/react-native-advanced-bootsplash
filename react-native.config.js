const Xcode = require("@raydeck/xcode");
const Plist = require("plist");
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { join, dirname, basename } = require("path");
const { sync } = require("glob");
const { parseStringPromise, Builder } = require("xml2js");
module.exports = {
  advanced: {
    startupClasses: ["RNSBootsplash.RNSBootSplash"],
    prelink: ({ iosOnly, androidOnly, jsOnly, path = process.cwd() }) => {
      const doIos = !jsOnly && !androidOnly;
      const doAndroid = !iosOnly && !jsOnly;
      if (doIos) {
        const assetsDir = join(process.cwd(), "assets");
        if (!existsSync(assetsDir)) mkdirSync(assetsDir);
        const iosPath = join(process.cwd(), "ios");
        const bootSplashes = sync(join(iosPath, "**", "Bootsplash.storyboard"));
        const bootSplashPath = bootSplashes[0];
        if (!bootSplashPath) {
          console.error(
            "Could not find BootSplash.storyboard - try running: yarn generate-bootsplash"
          );
          return;
        }
        //Look for pbxproject
        const projectsPaths = sync(
          join(iosPath, "**", "*.xcodeproj", "*.pbxproj")
        ).filter((path) => !path.includes("Pods"));
        projectsPaths.forEach((path) => {
          const project = Xcode.project(path);
          project.parse((err) => {
            const fp = project.getFirstProject();
            const dir = basename(dirname(bootSplashPath));
            const file = project.addResourceFile(
              join(dir, "BootSplash.storyboard"),
              null,
              fp
            );
            if (!file) return;
            file.uuid = project.generateUuid();
            const nts = project.pbxNativeTargetSection();
            for (var key in nts) {
              if (key.endsWith("_comment")) continue;
              const target = project.pbxTargetByName(nts[key].name);
              file.target = key;
              project.addToPbxBuildFileSection(file); // PBXBuildFile
              project.addToPbxResourcesBuildPhase(file);
            }
            //Look for the storyboard
            const out = project.writeSync();
            writeFileSync(path, out);
          });
        });

        const plistPaths = sync(join(iosPath, "**", "Info.plist"));
        plistPaths.forEach((path) => {
          const xml = readFileSync(path, { encoding: "utf8" });
          const plist = Plist.parse(xml);
          plist.UILaunchStoryboardName = "BootSplash.storyboard";
          const out = Plist.build(plist);
          writeFileSync(path, out);
        });
      }
      if (doAndroid) {
        //Look up android stuff and take care of it
        (async () => {
          //Find manifest file
          await (async () => {
            const xmlpath = join(
              path,
              "android",
              "app",
              "src",
              "main",
              "res",
              "values",
              "styles.xml"
            );
            const xml = readFileSync(xmlpath, { encoding: "utf8" });
            const o = await parseStringPromise(xml);
            const styles = o.resources.style;
            if (!styles.some(({ $: { name } }) => name === "BootTheme")) {
              styles.push({
                $: {
                  name: "BootTheme",
                  parent: "AppTheme",
                  item: [
                    {
                      $: { name: "android:background" },
                      _: "@drawable/bootsplash",
                    },
                  ],
                },
              });
            }
            writeFileSync(xmlpath, new Builder().buildObject(o));
          })();
          await (async () => {
            const xmlpath = join(
              path,
              "android",
              "app",
              "src",
              "main",
              "AndroidManifest.xml"
            );
            const xml = readFileSync(xmlpath, { encoding: "utf8" });
            const o = await parseStringPromise(xml);
            const activities = o.manifest.application.find(
              ({ $: { "android:name": name } }) => name === ".MainApplication"
            ).activity;
            if (
              !activities.some(
                ({ $: { ["android:name"]: name } }) =>
                  name === "com.zoontek.rnbootsplash.RNBootSplashActivity"
              )
            ) {
              activities.forEach((activity) => {
                if (activity["intent-filter"]) {
                  //Make it go away!
                  delete activity["intent-filter"];
                }
              });
              activities.push({
                $: {
                  "android:name":
                    "com.zoontek.rnbootsplash.RNBootSplashActivity",
                  "android:theme": "@style/BootTheme",
                },
                "intent-filter": [
                  {
                    action: [
                      { $: { "android:name": "android.intent.action.MAIN" } },
                    ],
                    category: [
                      {
                        $: {
                          "android:name": "android.intent.category.LAUNCHER",
                        },
                      },
                    ],
                  },
                ],
              });
            }
            writeFileSync(xmlpath, new Builder().buildObject(o));
          })();
        })();
      }
    },
  },
};
