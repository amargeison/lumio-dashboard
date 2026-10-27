import SwiftUI
import Observation

/// A page of the website to show inside the app (settings, camps, a payment…).
struct WebTarget: Identifiable, Equatable {
    let id = UUID()
    let path: String
    let title: String
    /// Open it signed in as this account (most pages), or as anyone (the demo, public pages).
    var signedIn = true
}

/// Who is signed in, and which side of the app they see.
@MainActor
@Observable
final class AppModel {
    enum Phase: Equatable {
        case launching
        case signedOut
        case ready
        case noAccess(String)
    }
    enum Side: String { case coach, family }

    var phase: Phase = .launching
    var coach: CoachMe?
    var family: [FamilyPlayer] = []
    /// A coach who is also a parent can switch between the two.
    var side: Side = .coach
    /// The website page shown over the app, if any.
    var web: WebTarget?
    /// Which family tab / coach tab to show after a notification is tapped.
    var familyTab: FamilyTab = .home
    var coachTab: CoachTab = .today

    /// The player a parent is looking at. Observed (so the tabs reload when it
    /// changes) and remembered on this phone.
    var selectedPlayerId: String = UserDefaults.standard.string(forKey: "family.selectedPlayer") ?? "" {
        didSet { UserDefaults.standard.set(selectedPlayerId, forKey: "family.selectedPlayer") }
    }
    @ObservationIgnored @AppStorage("coach.academy") private var savedAcademy: String = ""

    var selectedPlayer: FamilyPlayer? {
        family.first { $0.playerId == selectedPlayerId } ?? family.first
    }
    var isBoth: Bool { coach != nil && !family.isEmpty }

    init() {
        API.shared.onSignedOut = { [weak self] in
            guard let self else { return }
            self.coach = nil; self.family = []; self.phase = .signedOut
        }
        Push.shared.onOpen = { [weak self] path in self?.open(path: path) }
    }

    func start() async {
        guard API.shared.session != nil else { phase = .signedOut; return }
        await loadWho()
    }

    func signedIn(_ session: Session) async {
        API.shared.setSession(session)
        phase = .launching
        await loadWho()
        if phase == .ready { await Push.shared.askAndRegister() }
    }

    /// Ask the website who this is: a coach (whoami), a family (portal/me), or both.
    func loadWho() async {
        if !savedAcademy.isEmpty { API.shared.academySlug = savedAcademy }
        async let c: CoachMe? = try? API.shared.get("/api/coach/whoami")
        async let f: FamilyMe? = try? API.shared.get("/api/portal/me")
        let (coachMe, familyMe) = await (c, f)
        guard API.shared.session != nil else { phase = .signedOut; return }
        coach = coachMe
        if let slug = coachMe?.slug { API.shared.academySlug = slug; savedAcademy = slug }
        family = familyMe?.players ?? []
        if !family.isEmpty, !family.contains(where: { $0.playerId == selectedPlayerId }) { selectedPlayerId = family[0].playerId }
        if coach == nil && family.isEmpty {
            phase = .noAccess("This account isn't a coach or a player at an academy on Lumio Tennis Coach yet. If your coach has invited you, sign in with the address the invite was sent to.")
            return
        }
        if coach == nil { side = .family } else if family.isEmpty { side = .coach }
        phase = .ready
    }

    func switchAcademy(_ slug: String) async {
        savedAcademy = slug
        API.shared.academySlug = slug
        await loadWho()
    }

    func signOut() async {
        await Push.shared.forget()
        savedAcademy = ""
        selectedPlayerId = ""
        API.shared.signOutLocally()
    }

    // MARK: Links from notifications and emails

    /// Opens a path on the site: our own screen where there is one, otherwise the page itself.
    func open(path: String) {
        guard phase == .ready else { return }
        let p = path.isEmpty ? "/app" : path
        if p == "/app" || p.hasPrefix("/app?") { return }
        if p.hasPrefix("/portal") {
            side = family.isEmpty ? side : .family
            familyTab = .home
            return
        }
        web = WebTarget(path: p, title: title(for: p))
    }

    func openURL(_ url: URL) {
        guard Config.isOwnHost(url.host) else { return }
        var p = url.path
        if let q = url.query { p += "?\(q)" }
        open(path: p)
    }

    private func title(for path: String) -> String {
        if path.hasPrefix("/lesson/") { return "Your lesson" }
        if path.hasPrefix("/group/") { return "This week's group" }
        if path.hasPrefix("/slot/") { return "Free slot" }
        if path.hasPrefix("/welcome/") { return "Welcome" }
        if path.hasPrefix("/pay-balance/") { return "Trip balance" }
        return "Lumio"
    }

    /// A section of the coach's web portal: /tennis/coach/<slug>#payments
    func coachWebPath(_ section: String) -> String {
        "/tennis/coach/\(coach?.slug ?? "")#\(section)"
    }
}

enum CoachTab: Hashable { case today, calendar, players, messages, more }
enum FamilyTab: Hashable { case home, plan, messages, me }
