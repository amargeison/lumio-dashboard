import SwiftUI

/// The roster, searchable, A–Z.
struct PlayersView: View {
    @State private var state: Loadable<[AppPlayer]> = .loading
    @State private var query = ""

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
        .task { if state.value == nil { await load() } }
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

/// One player: how to reach them, their next lessons and groups, and their plan,
/// packs, card and anything owed — what their family sees in their own app.
struct PlayerDetailView: View {
    @Environment(AppModel.self) private var model
    @Environment(CoachStore.self) private var store
    let player: AppPlayer
    @State private var detail: PlayerDetail?
    @State private var error: String?
    @State private var sheet: Sheet?
    @State private var toast: Toast?

    enum Sheet: String, Identifiable { case book, message, summary; var id: String { rawValue } }

    var body: some View {
        List {
            Section {
                HStack(spacing: 14) {
                    Avatar(name: player.name, size: 56)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(player.name).font(.title2.bold())
                        if !player.subtitle.isEmpty { Text(player.subtitle).foregroundStyle(.secondary) }
                        if let parent = player.parentName { Text("Parent: \(parent)").font(.subheadline).foregroundStyle(.secondary) }
                    }
                }
                .padding(.vertical, 4)
                ContactButtons(player: player)
            }

            Section {
                Button { sheet = .book } label: { Label("Book a lesson", systemImage: "calendar.badge.plus") }
                Button { sheet = .message } label: { Label("Send a message", systemImage: "bubble.left") }
                Button { sheet = .summary } label: { Label("Write a lesson summary", systemImage: "square.and.pencil") }
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
            } else if error == nil {
                Section { HStack { Spacer(); ProgressView(); Spacer() } }
            }

            Section {
                Button { model.web = WebTarget(path: model.coachWebPath("roster"), title: "Player Roster") } label: {
                    Label("Full profile, notes and progress", systemImage: "person.text.rectangle")
                }
            }
        }
        .navigationTitle(player.name)
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .sheet(item: $sheet) { which in
            Group {
                switch which {
                case .book: BookingFormView(existing: nil, presetPlayerId: player.id) { text in toast = Toast(text: text); Task { await load() } }
                case .message: ComposeView(preset: [player.id]) { text in toast = Toast(text: text) }
                case .summary: NavigationStack { SummaryFormView(existing: nil, presetPlayerId: player.id) { text in toast = Toast(text: text) } }
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
        do { detail = try await API.shared.get("/api/app/v1/coach/players/\(player.id)"); error = nil }
        catch { self.error = error.localizedDescription }
    }
}
