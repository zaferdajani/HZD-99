import UIKit
import WebKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// THE GAME'S OWN VIEW CONTROLLER (Main.storyboard names it). Everything the
// Android MainActivity does for the same reasons (NATIVE.md), done here:
//
//  - the score starts with the picture: no tap is required before audio or the
//    opening film may play, and video plays inline rather than taking the screen;
//  - landscape only, no status bar, the home indicator dimmed, and a swipe from
//    any edge needs a second swipe before iOS takes it — the touch controls live
//    exactly where those gestures start;
//  - the screen stays awake through a long fight;
//  - the web view never rubber-bands, never zooms, never previews a link.
class GameViewController: CAPBridgeViewController {
    override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let config = super.webViewConfiguration(for: instanceConfiguration)
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        return config
    }

    override open func viewDidLoad() {
        super.viewDidLoad()
        let night = UIColor(red: 5.0 / 255.0, green: 7.0 / 255.0, blue: 11.0 / 255.0, alpha: 1)
        view.backgroundColor = night
        if let web = webView {
            web.isOpaque = false
            web.backgroundColor = night
            web.scrollView.backgroundColor = night
            web.scrollView.bounces = false
            web.scrollView.isScrollEnabled = false
            web.scrollView.contentInsetAdjustmentBehavior = .never
            web.allowsLinkPreview = false
            web.allowsBackForwardNavigationGestures = false
        }
    }

    override open func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        UIApplication.shared.isIdleTimerDisabled = true
        setNeedsUpdateOfHomeIndicatorAutoHidden()
        setNeedsUpdateOfScreenEdgesDeferringSystemGestures()
    }

    override open var prefersStatusBarHidden: Bool { return true }
    override open var prefersHomeIndicatorAutoHidden: Bool { return true }
    override open var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { return .all }
    override open var supportedInterfaceOrientations: UIInterfaceOrientationMask { return .landscape }
}
