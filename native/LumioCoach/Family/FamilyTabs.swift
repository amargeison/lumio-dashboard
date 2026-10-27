import SwiftUI
import Observation

/// Everything the family's tabs share: the chosen player and their page.
@MainActor
@Observable
final class FamilyModel {
    var bundle: Loadable<FamilyBundle> = .loading
    private(set) var playerId: String = ""

    var my: MyPage? { bundle.value?.my }

    func load(_ playerId: String) async {
        if playerId != self.playerId { self.playerId = playerId; bundle = .loading }
        guard !playerId.isEmpty else { return }
        do {
            // The page reads ?player= (not playerId, which the booking and lesson routes use).
            let b: FamilyBundle = try await API.shared.get("/api/portal/player", query: ["player": playerId])
            bundle = .loaded(b)
        } catch {
            // Keep showing what we had on a failed refresh; only an empty screen shows the error.
            if bundle.value == nil { bundle = .failed(error.localizedDescription) }
        }
    }

    func reload() async { await load(playerId) }
}

/// The family's app: their lessons, their plan, their coach, and them.
struct FamilyTabs: View {
    @Environment(AppModel.self) private var model
    @State private var family = FamilyModel()

    var body: some View {
        @Bindable var model = model
        TabView(selection: $model.familyTab) {
            NavigationStack { FamilyHomeView() }
                .tabItem { Label("Lessons", systemImage: "tennisball") }
                .tag(FamilyTab.home)
            NavigationStack { ProgressTabView() }
                .tabItem { Label("Progress", systemImage: "chart.line.uptrend.xyaxis") }
                .tag(FamilyTab.progress)
            NavigationStack { PlanView() }
                .tabItem { Label("Plan", systemImage: "creditcard") }
                .tag(FamilyTab.plan)
            NavigationStack { FamilyMessagesView() }
                .tabItem { Label("Messages", systemImage: "bubble.left.and.bubble.right") }
                .tag(FamilyTab.messages)
            NavigationStack { MeView() }
                .tabItem { Label("Me", systemImage: "person.crop.circle") }
                .tag(FamilyTab.me)
        }
        .environment(family)
        .task(id: model.selectedPlayer?.playerId) {
            await family.load(model.selectedPlayer?.playerId ?? "")
        }
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)) { _ in
            Task { await family.reload() }
        }
    }
}

/// Shared wrapper: spinner, error, or the page.
struct FamilyContent<Content: View>: View {
    @Environment(FamilyModel.self) private var family
    @ViewBuilder let content: (FamilyBundle) -> Content

    var body: some View {
        switch family.bundle {
        case .loading: ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
        case .failed(let m): LoadFailed(message: m) { await family.reload() }
        case .loaded(let b): content(b)
        }
    }
}
