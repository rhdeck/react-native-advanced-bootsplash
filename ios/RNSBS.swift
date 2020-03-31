import ReactNativeSwiftRegistry
@objc
open class RNSBootSplash:NSObject, RNSStartable {
    @objc public static func runOnStart() -> Void {
        let _ = RNSMainRegistry.addEvent(type: "app.didFinishLaunchingWithOptions", key: "bootsplash", callback: {data in
            if let ad = UIApplication.shared.delegate {
                if let w = ad.window {
                    if let rvc = w?.rootViewController {
                        if let rv = rvc.view as? RCTRootView {
                            RNBootSplash.initWithStoryboard("BootSplash", rootView: rv)
                        }
                    }
                }
            }
            return true;
        })
    }
}

