import SwiftUI

/// Which player this is (for parents of more than one), the academy,
/// notifications and sign-out.
struct MeView: View {
    @Environment(AppModel.self) private var model
    @Environment(FamilyModel.self) private var family
    @Environment(\.openURL) private var openURL
    @State private var toast: Toast?

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

            if let prefs = family.my?.prefs { ChoicesSection(prefs: prefs, playerId: family.playerId, toast: $toast) { await family.reload() } }

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
        .toast($toast)
    }

    /// The full player page on the website, for everything the app doesn't show natively.
    private var portalPath: String {
        guard let id = model.selectedPlayer?.playerId else { return "/portal" }
        return "/portal?player=\(id)"
    }
}

/// Their own choices, which used to need an email link: hearing about free
/// slots, and whether lessons may be recorded (asked on the welcome link).
struct ChoicesSection: View {
    let prefs: MyPrefs
    let playerId: String
    @Binding var toast: Toast?
    let changed: () async -> Void
    @State private var busy = false
    @State private var stopping = false
    @State private var why = false

    var body: some View {
        Section {
            Toggle(isOn: Binding(get: { prefs.freeSlots }, set: { on in Task { await save(freeSlots: on) } })) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Free slots")
                    Text("Hear when your coach has a gap you could take.").font(.caption).foregroundStyle(.secondary)
                }
            }
            .disabled(busy)
            VStack(alignment: .leading, spacing: 6) {
                Text(prefs.recording.ask).font(.body.weight(.semibold))
                Text(prefs.recording.words).font(.subheadline).foregroundStyle(prefs.recording.agreed ? Color.green : Color.secondary)
                DisclosureGroup("What this means", isExpanded: $why) {
                    Text(prefs.recording.explain).font(.footnote).foregroundStyle(.secondary)
                }
                .font(.subheadline)
                if prefs.recording.agreed {
                    Button("Change my mind", role: .destructive) { stopping = true }.buttonStyle(.borderless).disabled(busy)
                } else {
                    Button { Task { await save(recording: true) } } label: { Label("Yes, that’s fine", systemImage: "checkmark.shield") }
                        .buttonStyle(.borderedProminent).disabled(busy)
                }
            }
            .padding(.vertical, 4)
        } header: { Text("Your choices") } footer: { Text("Change these at any time.") }
        .confirmationDialog("Stop lessons being recorded?", isPresented: $stopping, titleVisibility: .visible) {
            Button("Stop recording", role: .destructive) { Task { await save(recording: false) } }
            Button("Keep it", role: .cancel) {}
        } message: { Text("Recordings already made stay with your coach until they are deleted.") }
    }

    private func save(freeSlots: Bool? = nil, recording: Bool? = nil) async {
        struct Body: Encodable { let playerId: String; let freeSlots: Bool?; let recording: Bool? }
        busy = true
        defer { busy = false }
        do {
            let r: OkNotice = try await API.shared.post("/api/portal/prefs", body: Body(playerId: playerId, freeSlots: freeSlots, recording: recording))
            if let n = r.notice { toast = Toast(text: n) }
            await changed()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}
