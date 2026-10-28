import SwiftUI
import Observation

/// What the coach's forms share: the academy's set-up (lesson types, venues,
/// courts, coaches, camps) and the roster, loaded once and refreshed after saves.
@MainActor
@Observable
final class CoachStore {
    var setup: CoachSetup?
    var players: [PlayerRecord] = []
    /// Bumped after any save, so open lists reload.
    var changes = 0

    func load(force: Bool = false) async {
        if force || setup == nil, let s: CoachSetup = try? await API.shared.get("/api/app/v1/coach/setup") { setup = s }
        if force || players.isEmpty, let p: [PlayerRecord] = try? await Rows.list("coach_players", order: "name.asc") { players = p }
    }

    func saved() { changes += 1 }

    /// The academy's look, as on the website; the portal's dark default until loaded.
    var theme: PortalTheme { setup?.theme ?? .standard }

    func player(_ id: String?) -> PlayerRecord? { players.first { $0.id == id } }

    enum PlayerProblem: LocalizedError {
        case twoCalled(String)
        var errorDescription: String? {
            if case .twoCalled(let n) = self { return "There is more than one player called \(n). Pick the right one from the list." }
            return nil
        }
    }

    /// The roster player with this name, added if there isn't one — as the
    /// website's booking form does (ensureRosterPlayer).
    func ensurePlayer(named raw: String) async throws -> PlayerRecord {
        let name = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        let same = players.filter { $0.name.trimmingCharacters(in: .whitespaces).caseInsensitiveCompare(name) == .orderedSame }
        if same.count > 1 { throw PlayerProblem.twoCalled(name) }
        if let one = same.first { return one }
        let added: PlayerRecord = try await Rows.insert("coach_players", ["name": .string(name)])
        players.append(added)
        players.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        return added
    }
}

/// Pick a player from the roster (searchable), or type a new name.
struct PlayerPicker: View {
    @Environment(CoachStore.self) private var store
    @Binding var playerId: String?
    @Binding var newName: String
    var allowNew = true
    @State private var typing = false
    @State private var started = false

    var body: some View {
        NavigationLink {
            PlayerChooser(allowNew: allowNew, selected: playerId) { picked in
                if let picked { playerId = picked; newName = ""; typing = false }
                else { playerId = nil; typing = true }
            }
        } label: {
            LabeledContent("Player", value: typing ? "New player" : (store.player(playerId)?.name ?? "Choose…"))
        }
        // Once only: coming back from the chooser must not undo "New player".
        .onAppear { if !started { started = true; typing = playerId == nil && !newName.isEmpty } }
        if typing {
            TextField("New player's name", text: $newName)
                .textInputAutocapitalization(.words)
                .autocorrectionDisabled()
        }
    }
}

struct PlayerChooser: View {
    @Environment(CoachStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let allowNew: Bool
    let selected: String?
    /// The chosen player's id, or nil for "a new player".
    let pick: (String?) -> Void
    @State private var query = ""

    var body: some View {
        List {
            if allowNew && query.isEmpty {
                Button { pick(nil); dismiss() } label: { Label("New player…", systemImage: "person.badge.plus") }
            }
            ForEach(shown) { p in
                Button { pick(p.id); dismiss() } label: {
                    HStack {
                        Text(p.name).foregroundStyle(.primary)
                        if let c = p.category { Text(c).font(.caption).foregroundStyle(.secondary) }
                        Spacer()
                        if p.id == selected { Image(systemName: "checkmark").foregroundStyle(Color.accentColor) }
                    }
                }
            }
        }
        .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search players")
        .navigationTitle("Player")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var shown: [PlayerRecord] {
        let q = query.trimmingCharacters(in: .whitespaces)
        return q.isEmpty ? store.players : store.players.filter { $0.name.localizedCaseInsensitiveContains(q) }
    }
}
