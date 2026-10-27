import SwiftUI

@main
struct LumioCoachApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var delegate
    @State private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .task { await model.start() }
                // Links to www.lumiosports.com tapped in Mail or Messages
                // (SwiftUI hands universal links to onOpenURL too).
                .onOpenURL { model.openURL($0) }
        }
    }
}

struct RootView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var model = model
        Group {
            switch model.phase {
            case .launching:
                LaunchView()
            case .signedOut:
                SignInView()
            case .noAccess(let why):
                NoAccessView(message: why)
            case .ready:
                if model.side == .coach, model.coach != nil {
                    CoachTabs()
                } else {
                    FamilyTabs()
                }
            }
        }
        .animation(.default, value: model.phase)
        .sheet(item: $model.web) { target in
            WebSheet(target: target)
        }
    }
}

struct LaunchView: View {
    var body: some View {
        ZStack {
            Color.lumioNavy.ignoresSafeArea()
            VStack(spacing: 18) {
                Image("LaunchMark").resizable().scaledToFit().frame(width: 96)
                ProgressView().tint(.white)
            }
        }
    }
}

struct NoAccessView: View {
    @Environment(AppModel.self) private var model
    let message: String
    var body: some View {
        ContentUnavailableView {
            Label("Nothing to show yet", systemImage: "person.crop.circle.badge.questionmark")
        } description: {
            Text(message)
        } actions: {
            Button("Sign out") { Task { await model.signOut() } }.buttonStyle(.bordered)
            Button("Try again") { Task { await model.loadWho() } }.buttonStyle(.borderedProminent)
        }
    }
}
