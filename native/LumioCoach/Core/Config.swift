import Foundation

/// Where the app talks to. Everything goes to the live Lumio site; the app keeps
/// no data of its own beyond the sign-in, which lives in the Keychain.
enum Config {
    static let site = URL(string: "https://www.lumiosports.com")!
    static let privacy = URL(string: "https://www.lumiosports.com/privacy")!
    static let support = URL(string: "https://www.lumiosports.com/tennis-coach/support")!

    /// A path on the site ("/api/…", "/portal?x=1") as a full address.
    static func url(_ path: String) -> URL {
        URL(string: path, relativeTo: site)?.absoluteURL ?? site
    }

    /// Added to the web view's user agent so the website knows it is inside the app
    /// (it then hides "Add to Home Screen" and the sign-up links).
    static var userAgentSuffix: String {
        let v = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "2.0"
        return "LumioTennisCoachApp/\(v) Native"
    }

    static var appVersion: String {
        let v = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "2.0"
        let b = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "0"
        return "\(v) (\(b))"
    }

    /// Hosts the in-app web view shows itself. Anything else opens in Safari.
    static func isOwnHost(_ host: String?) -> Bool {
        guard let h = host?.lowercased() else { return false }
        return h == "www.lumiosports.com" || h == "lumiosports.com"
    }

    /// Payment pages that must stay inside the web view so the return trip lands back in it.
    static func staysInWebView(_ host: String?) -> Bool {
        guard let h = host?.lowercased() else { return false }
        return isOwnHost(h) || h == "stripe.com" || h.hasSuffix(".stripe.com") || h.hasSuffix(".stripe.network")
    }
}
