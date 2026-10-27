import SwiftUI

/// Everything else: the less-used parts of Lumio (opened as the website inside
/// the app), the academy, notifications and sign-out.
struct CoachMoreView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openURL) private var openURL

    @Environment(CoachStore.self) private var store

    /// Every part of the website the app doesn't do itself, so nothing is
    /// out of reach on the phone. Head-coach-only parts are left out for an
    /// invited coach, as the website's own menu does (role-scope.ts).
    private var sections: [(String, String, String)] {
        let f = store.setup?.features
        let head = model.coach?.isHead == true
        var s: [(String, String, String)] = [
            ("development", "Player Development", "chart.line.uptrend.xyaxis"),
            ("belts", "Racket Progression", "medal"),
        ]
        if head { s.append(("venues", "Court Planner", "mappin.and.ellipse")) }
        if f?.video == true || f?.audio == true { s.append(("videoaudio", "Video & Audio", "video")) }
        if f?.effort != false { s.append(("gpsheatmaps", "Effort & Rewards", "flame")) }
        s.append(("equipment", "Equipment & Kit", "backpack"))
        s.append(("resources", "Resource Centre", "books.vertical"))
        if head { s.append(("staff", "Coaches", "person.2")) }
        s.append(("settings", "Settings", "gearshape"))
        return s
    }

    var body: some View {
        List {
            Section {
                HStack(spacing: 12) {
                    Image("LaunchMark").resizable().scaledToFit().frame(width: 40, height: 40)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(model.coach?.academyName ?? "Your academy").font(.headline)
                        Text(model.coach?.isHead == true ? "Head coach" : (model.coach?.displayName ?? "Coach")).font(.subheadline).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
                if let academies = model.coach?.academies, academies.count > 1 {
                    Menu {
                        ForEach(academies) { a in
                            Button { Task { await model.switchAcademy(a.slug) } } label: {
                                if a.current { Label(a.name ?? a.slug, systemImage: "checkmark") } else { Text(a.name ?? a.slug) }
                            }
                        }
                    } label: { Label("Switch academy", systemImage: "arrow.left.arrow.right") }
                }
                if model.isBoth {
                    Button { model.side = .family } label: { Label("Switch to my family's app", systemImage: "figure.and.child.holdinghands") }
                }
            }

            Section {
                NavigationLink { PaymentsView() } label: { Label("Payments & Packs", systemImage: "sterlingsign.circle") }
                if model.coach?.isHead == true {
                    NavigationLink { CampsView() } label: { Label("Training Camps", systemImage: "tent") }
                }
                NavigationLink { PlannerView() } label: { Label("Session Planner", systemImage: "list.clipboard") }
                NavigationLink { SummariesView() } label: { Label("Lesson Summaries", systemImage: "doc.text") }
                // Camps, groups and leads are the head coach's, as on the website.
                if model.coach?.isHead == true {
                    NavigationLink { GroupsView() } label: { Label("Weekly Groups", systemImage: "person.3") }
                    NavigationLink { LeadsView() } label: { Label("Leads", systemImage: "person.badge.plus") }
                }
            }

            Section("On the website") {
                ForEach(sections, id: \.0) { s in
                    Button { model.web = WebTarget(path: model.coachWebPath(s.0), title: s.1) } label: {
                        Label(s.1, systemImage: s.2)
                    }
                    .foregroundStyle(.primary)
                }
            }

            Section("App") {
                Button { if let u = URL(string: UIApplication.openNotificationSettingsURLString) { openURL(u) } } label: {
                    Label("Notifications", systemImage: "bell.badge")
                }
                Link(destination: Config.support) { Label("Help and support", systemImage: "questionmark.circle") }
                Link(destination: Config.privacy) { Label("Privacy", systemImage: "hand.raised") }
            }
            .foregroundStyle(.primary)

            Section {
                Button(role: .destructive) { Task { await model.signOut() } } label: {
                    Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                }
            } footer: {
                Text("Lumio Tennis Coach \(Config.appVersion)").frame(maxWidth: .infinity).padding(.top, 8)
            }
        }
        .navigationTitle("More")
    }
}
