import SwiftUI

/// Which player this is (for parents of more than one), the academy,
/// notifications and sign-out.
struct MeView: View {
    @Environment(AppModel.self) private var model
    @Environment(FamilyModel.self) private var family
    @Environment(\.openURL) private var openURL

    var body: some View {
        @Bindable var model = model
        List {
            if let p = model.selectedPlayer {
                Section {
                    HStack(spacing: 14) {
                        PlayerPhoto(name: p.name, path: family.bundle.value?.player.avatarUrl, size: 56)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(p.name).font(.title3.bold())
                            Text(p.academyName).foregroundStyle(.secondary)
                            if let level = family.bundle.value?.player.level, !level.isEmpty {
                                Text(level).font(.subheadline).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                    PhotoChanger(playerId: p.playerId, endpoint: "/api/portal/avatar") { await family.reload() }
                }
            }

            if model.family.count > 1 {
                Section("Showing") {
                    Picker("Player", selection: $model.selectedPlayerId) {
                        ForEach(model.family) { p in
                            Text("\(p.name) · \(p.academyName)").tag(p.playerId)
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }
            }

            Section("More in Lumio") {
                Button { model.web = WebTarget(path: portalPath, title: model.selectedPlayer?.name ?? "Lumio") } label: {
                    Label("Everything on the website", systemImage: "safari")
                }
                if model.isBoth {
                    Button { model.side = .coach } label: { Label("Switch to coaching", systemImage: "figure.tennis") }
                }
            }
            .foregroundStyle(.primary)

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
        .navigationTitle("Me")
    }

    /// The full player page on the website, for everything the app doesn't show natively.
    private var portalPath: String {
        guard let id = model.selectedPlayer?.playerId else { return "/portal" }
        return "/portal?player=\(id)"
    }
}
