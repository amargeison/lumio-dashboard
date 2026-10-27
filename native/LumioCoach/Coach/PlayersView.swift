import SwiftUI

/// The roster, searchable, A–Z.
struct PlayersView: View {
    @Environment(CoachStore.self) private var store
    @State private var state: Loadable<[AppPlayer]> = .loading
    @State private var query = ""
    @State private var adding = false

    var body: some View {
        Group {
            switch state {
            case .loading: ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .failed(let m): LoadFailed(message: m) { await load() }
            case .loaded(let players):
                let shown = filter(players)
                List(shown) { p in
                    NavigationLink(value: p) {
                        HStack(spacing: 12) {
                            Avatar(name: p.name)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(p.name).font(.body.weight(.semibold))
                                Text(line(p)).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                            }
                        }
                    }
                }
                .listStyle(.plain)
                .overlay {
                    if shown.isEmpty {
                        ContentUnavailableView.search(text: query)
                    }
                }
            }
        }
        .navigationTitle("Players")
        .searchable(text: $query, prompt: "Search players")
        .navigationDestination(for: AppPlayer.self) { PlayerDetailView(player: $0) }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { adding = true } label: { Image(systemName: "plus") }.accessibilityLabel("Add a player")
            }
        }
        .sheet(isPresented: $adding) {
            PlayerEditView(player: nil) { _ in Task { await load() } }.environment(store)
        }
        .task { if state.value == nil { await load() } }
        .onChange(of: store.changes) { Task { await load() } }
        .refreshable { await load() }
    }

    private func filter(_ list: [AppPlayer]) -> [AppPlayer] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return list }
        return list.filter { [$0.name, $0.parentName ?? "", $0.email ?? ""].joined(separator: " ").lowercased().contains(q) }
    }

    private func line(_ p: AppPlayer) -> String {
        let next = p.nextLesson.map { "Next: \(Fmt.dayFriendly($0.date)) \(Fmt.time($0.time))" } ?? "No lesson booked"
        return [p.subtitle, next].filter { !$0.isEmpty }.joined(separator: " · ")
    }

    private func load() async {
        do { state = .loaded(try await API.shared.get("/api/app/v1/coach/players", as: PlayersResponse.self).players) }
        catch { if state.value == nil { state = .failed(error.localizedDescription) } }
    }
}

/// One player: how to reach them, their next lessons and groups, their plan,
/// packs, card and anything owed, and everything about them as a player —
/// profile, development, recordings, notes, attendance and their family's app.
struct PlayerDetailView: View {
    @Environment(CoachStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let player: AppPlayer
    @State private var detail: PlayerDetail?
    @State private var profile: PlayerProfile?
    @State private var error: String?
    @State private var sheet: Sheet?
    @State private var toast: Toast?
    @State private var pay = PayModel()

    enum Sheet: String, Identifiable { case book, message, summary, edit; var id: String { rawValue } }

    private var name: String { profile?.name ?? player.name }
    private var mediaOn: Bool { store.setup?.features?.video == true || store.setup?.features?.audio == true }

    var body: some View {
        List {
            Section {
                HStack(spacing: 14) {
                    PlayerPhoto(name: name, path: Avatars.path(profile?.avatarUrl), size: 64)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(name).font(.title2.bold())
                        if !player.subtitle.isEmpty { Text(player.subtitle).foregroundStyle(.secondary) }
                        if let parent = profile?.parentName ?? player.parentName, !parent.isEmpty {
                            Text("Parent: \(parent)").font(.subheadline).foregroundStyle(.secondary)
                        }
                        if let id = profile?.racketStage, let s = Racket.stage(id) {
                            HStack(spacing: 5) {
                                Circle().fill(Color(hex: s.hex)).frame(width: 10, height: 10).overlay(Circle().stroke(.secondary.opacity(0.4)))
                                Text(store.setup?.stageWords(s.name) ?? s.name).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                .padding(.vertical, 4)
                ContactButtons(player: player)
                PhotoChanger(playerId: player.id) { await loadProfile(); store.saved() }
            }

            Section {
                Button { sheet = .book } label: { Label("Book a lesson", systemImage: "calendar.badge.plus") }
                Button { sheet = .message } label: { Label("Send a message", systemImage: "bubble.left") }
                Button { sheet = .summary } label: { Label("Write a lesson summary", systemImage: "square.and.pencil") }
            }

            if let profile {
                Section {
                    NavigationLink { DevelopmentView(player: profile) { await loadProfile() } } label: {
                        Label("Development", systemImage: "chart.line.uptrend.xyaxis")
                    }
                    if mediaOn {
                        NavigationLink { PlayerMediaView(player: profile) { await loadProfile() } } label: {
                            Label("Videos & voice notes", systemImage: "video")
                        }
                    }
                    NavigationLink { NotesView(player: profile) } label: { Label("Notes", systemImage: "note.text") }
                    NavigationLink { AttendanceView(player: profile) } label: { Label("Attendance", systemImage: "checklist") }
                    NavigationLink { FamilyAccessView(player: profile) } label: { Label("Their family’s app", systemImage: "iphone") }
                } header: { Text("Player") }
            }

            if let error { Section { Text(error).foregroundStyle(.red) } }

            if let page = detail?.page {
                Section("Next lessons") {
                    if page.lessons.isEmpty { Text("Nothing booked.").foregroundStyle(.secondary) }
                    ForEach(page.lessons) { l in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(Fmt.dayFriendly(l.date)) · \(Fmt.time(l.time))").font(.body.weight(.medium))
                                Text([l.type, l.court, l.coach].compactMap { $0 }.joined(separator: " · ")).font(.subheadline).foregroundStyle(.secondary)
                            }
                            Spacer()
                            if l.confirmed != nil { Image(systemName: "checkmark.circle.fill").foregroundStyle(.green).accessibilityLabel("Confirmed") }
                            if l.cover == "plan" { Pill(text: "Plan", tint: .purple) }
                            if l.cover == "pack" { Pill(text: "Pack", tint: .teal) }
                        }
                    }
                }
                if !page.groups.isEmpty {
                    Section("Weekly groups") {
                        ForEach(page.groups) { g in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(g.name).font(.body.weight(.medium))
                                Text(groupLine(g)).font(.subheadline).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                AccountSections(account: page.account, showPolicy: false)
                CardOnFileSection(playerId: player.id, pay: pay)
            } else if error == nil {
                Section { HStack { Spacer(); ProgressView(); Spacer() } }
            }
        }
        .navigationTitle(name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if profile != nil {
                ToolbarItem(placement: .primaryAction) { Button("Edit") { sheet = .edit } }
            }
        }
        .toast($toast)
        .sheet(item: $sheet) { which in
            Group {
                switch which {
                case .book: BookingFormView(existing: nil, presetPlayerId: player.id) { text in toast = Toast(text: text); Task { await load() } }
                case .message: ComposeView(preset: [player.id]) { text in toast = Toast(text: text) }
                case .summary: NavigationStack { SummaryFormView(existing: nil, presetPlayerId: player.id) { text in toast = Toast(text: text) } }
                case .edit:
                    PlayerEditView(player: profile) { result in
                        if result == "deleted" { dismiss() } else { toast = Toast(text: "Saved."); Task { await load() } }
                    }
                }
            }
            .environment(store)
        }
        .task { await load() }
        .refreshable { await load() }
    }

    private func groupLine(_ g: MyGroup) -> String {
        guard let n = g.next else { return g.every }
        let answer = n.cancelled ? "called off" : n.answer == "yes" ? "coming" : n.answer == "no" ? "not coming" : "not answered yet"
        return "\(Fmt.dayFriendly(n.date)) \(n.time) · \(answer)"
    }

    private func load() async {
        async let p: Void = loadProfile()
        async let c: Void = pay.load()
        do { detail = try await API.shared.get("/api/app/v1/coach/players/\(player.id)"); error = nil }
        catch { self.error = error.localizedDescription }
        await p; await c
    }

    private func loadProfile() async {
        if let rows: [PlayerProfile] = try? await Rows.list("coach_players", [("id", player.id)]), let p = rows.first { profile = p }
    }
}
