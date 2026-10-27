import UIKit
import UserNotifications

/// Notifications: asked for once after sign-in; the phone's address goes to our
/// server (POST /api/app/push), which sends through Apple when a client books,
/// cancels or messages, and when a family's coach emails them.
@MainActor
final class Push: NSObject, UNUserNotificationCenterDelegate {
    static let shared = Push()
    private let tokenKey = "push.token"

    /// Where to go when a notification is tapped (a path on the site).
    var onOpen: ((String) -> Void)?

    var lastToken: String? {
        get { UserDefaults.standard.string(forKey: tokenKey) }
        set { UserDefaults.standard.set(newValue, forKey: tokenKey) }
    }

    func start() { UNUserNotificationCenter.current().delegate = self }

    /// After sign-in: ask (the system only ever shows the question once), then register.
    func askAndRegister() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        var allowed = settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
        if settings.authorizationStatus == .notDetermined {
            allowed = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        }
        if allowed { UIApplication.shared.registerForRemoteNotifications() }
    }

    func didRegister(_ deviceToken: Data) {
        let hex = deviceToken.map { String(format: "%02x", $0) }.joined()
        lastToken = hex
        Task {
            struct Body: Encodable { let token: String; let appVersion: String }
            let _: OkNotice? = try? await API.shared.post("/api/app/push", body: Body(token: hex, appVersion: Config.appVersion))
        }
    }

    /// Signing out: this phone stops getting that account's notifications.
    func forget() async {
        guard let token = lastToken else { return }
        struct Body: Encodable { let token: String }
        try? await API.shared.delete("/api/app/push", body: Body(token: token))
        try? await UNUserNotificationCenter.current().setBadgeCount(0)
    }

    // Show notifications while the app is open, too.
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .list, .sound]
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        let path = response.notification.request.content.userInfo["url"] as? String ?? "/app"
        await MainActor.run { self.onOpen?(path) }
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        MainActor.assumeIsolated { Push.shared.start() }
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        MainActor.assumeIsolated { Push.shared.didRegister(deviceToken) }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("[push] registration failed: \(error.localizedDescription)")
    }
}
