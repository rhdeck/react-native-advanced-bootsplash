import ReactNativeSwiftRegistry
@objc
open class RNSBootSplash:NSObject {
    func runOnStart() -> Void {
        let _ = RNSMainRegistry.addEvent(type: "app.didFinishLaunchingWithOptions.start", key: "bootsplash", callback: {data in
            print("Hello");
            return true;
        })
    }
}
