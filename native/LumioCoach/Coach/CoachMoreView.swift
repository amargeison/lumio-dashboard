import SwiftUI

/// Everything else: the less-used parts of Lumio (opened as the website inside
/// the app), the academy, notifications and sign-out.
struct CoachMoreView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openURL) private var openURL

    private let sections: [(String, String, String)] = [
        ("planner", "Session Planner", "list.clipboard"),
        ("lessons", "Lesson Summaries", "doc.text"),
        ("payments", "Payments & Packs", "sterlingsign.circle"),
        ("groups", "Weekly Groups", "person.3"),
        ("camps", "Training Camps", "tent"),
        ("leads", "Leads", "person.badge.plus"),
        ("development", "Player Development", "chart.line.uptrend.xyaxis"),
        ("belts", "Racket Progression", "medal"),
        ("resources", "Resource Centre", "books.vertical"),
        ("settings", "Settings", "gearshape"),
    ]

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

            Section("Open in Lumio") {
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
