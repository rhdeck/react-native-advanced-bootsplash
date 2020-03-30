const Xcode = require("@raydeck/xcode");
const Plist = require("plist");
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { join, dirname, basename } = require("path");
const { sync } = require("glob");
module.exports = {
  startupClasses: ["RNSBootsplash"],
  prelink: [
    () => {
      const assetsDir = join(process.cwd(), "assets");
      if (!existsSync(assetsDir)) mkdirSync(assetsDir);
      const iosPath = join(process.cwd(), "ios");
      const bootSplashes = sync(join(iosPath, "**", "Bootsplash.storyboard"));
      const bootSplashPath = bootSplashes[0];
      if (!bootSplashPath) {
        console.error(
          "Could not find BootSplash.storyboard - try running: yarn generate-bootsplash"
        );
        process.exit(1);
      }
      //Look for pbxproject
      const projectsPaths = sync(
        join(iosPath, "**", "*.xcodeproj", "*.pbxproj")
      ).filter(path => !path.includes("Pods"));
      projectsPaths.forEach(path => {
        const project = Xcode.project(path);
        project.parse(err => {
          const fp = project.getFirstProject();
          const dir = basename(dirname(bootSplashPath));
          const file = project.addResourceFile(
            join(dir, "BootSplash.storyboard"),
            null,
            fp
          );
          if (!file) return;
          console.log("COndinuting with file obj", file);
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
          console.log("I wrote out", path);
        });
      });

      const plistPaths = sync(join(iosPath, "**", "Info.plist"));
      plistPaths.forEach(path => {
        const xml = readFileSync(path, { encoding: "utf8" });
        const plist = Plist.parse(xml);
        plist.UILaunchStoryboardName = "BootSplash.storyboard";
        const out = Plist.build(plist);
        writeFileSync(path, out);
      });
    }
  ]
};
