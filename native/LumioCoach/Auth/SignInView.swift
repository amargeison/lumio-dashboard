import SwiftUI

/// Email, then the six-digit code from the email. No passwords. Coaches sign in
/// with the address they signed up with; players and parents with the address
/// their coach invited. Anyone can explore the demo without an account.
struct SignInView: View {
    @Environment(AppModel.self) private var model
    enum Stage: Equatable { case email, code(kind: String), unknown, demoOnly }

    @State private var stage: Stage = .email
    @State private var email = ""
    @State private var code = ""
    @State private var busy = false
    @State private var error: String?
    @State private var resendIn = 0
    @FocusState private var focus: Field?
    enum Field { case email, code }

    var body: some View {
        ZStack {
            LinearGradient(colors: [.lumioNavy, Color(red: 0.06, green: 0.12, blue: 0.27)], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
            ScrollView {
                VStack(spacing: 28) {
                    Spacer(minLength: 40)
                    VStack(spacing: 14) {
                        Image("LaunchMark").resizable().scaledToFit().frame(width: 84)
                        Text("Lumio Tennis Coach")
                            .font(.system(.title, design: .rounded, weight: .bold))
                            .foregroundStyle(.white)
                    }
                    card
                    Button {
                        model.web = WebTarget(path: "/app/demo", title: "Demo", signedIn: false)
                    } label: {
                        VStack(spacing: 3) {
                            Text("New to Lumio? **Explore the demo**")
                            Text("Sample data, no account needed").font(.caption).foregroundStyle(.white.opacity(0.6))
                        }
                    }
                    .foregroundStyle(.white.opacity(0.9))
                    .font(.subheadline)
                    HStack(spacing: 18) {
                        Link("Support", destination: Config.support)
                        Link("Privacy", destination: Config.privacy)
                    }
                    .font(.footnote).foregroundStyle(.white.opacity(0.55))
                    Spacer(minLength: 20)
                }
                .padding(.horizontal, 20)
                .frame(maxWidth: 480)
                .frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .preferredColorScheme(.dark)
        .onAppear { focus = .email }
        .task(id: resendIn) {
            guard resendIn > 0 else { return }
            try? await Task.sleep(for: .seconds(1))
            resendIn -= 1
        }
    }

    @ViewBuilder private var card: some View {
        VStack(alignment: .leading, spacing: 16) {
            switch stage {
            case .email:
                Text("Sign in").font(.title2.bold())
                Text("Coaches, players and parents: enter your email and we'll send you a code.")
                    .font(.subheadline).foregroundStyle(.secondary)
                TextField("you@example.com", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .submitLabel(.continue)
                    .focused($focus, equals: .email)
                    .onSubmit { Task { await start() } }
                    .padding(14)
                    .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                errorLine
                BusyButton(title: "Continue") { await start() }
                    .disabled(!email.contains("@"))

            case .code(let kind):
                Text("Enter your code").font(.title2.bold())
                Text("We sent a 6-digit code to **\(email)**.")
                    .font(.subheadline).foregroundStyle(.secondary)
                if kind == "family" {
                    Text("It comes from your coach's academy, through Lumio.").font(.footnote).foregroundStyle(.secondary)
                }
                TextField("000000", text: $code)
                    .textContentType(.oneTimeCode)
                    .keyboardType(.numberPad)
                    .font(.system(size: 34, weight: .bold, design: .monospaced))
                    .multilineTextAlignment(.center)
                    .focused($focus, equals: .code)
                    .padding(12)
                    .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .onChange(of: code) { _, new in
                        let digits = String(new.filter(\.isNumber).prefix(6))
                        if digits != new { code = digits }
                        if digits.count == 6 { Task { await verify() } }
                    }
                errorLine
                BusyButton(title: busy ? "Checking…" : "Sign in") { await verify() }
                    .disabled(code.count != 6)
                HStack {
                    Button("Use a different email") { stage = .email; code = ""; error = nil; focus = .email }
                    Spacer()
                    if resendIn > 0 { Text("Resend in \(resendIn)s").foregroundStyle(.secondary) }
                    else { Button("Resend code") { Task { await start() } } }
                }
                .font(.footnote)

            case .unknown:
                Text("We don't recognise that email").font(.title2.bold())
                Text("**\(email)** isn't on Lumio Tennis Coach yet. Players and parents: ask your coach to add you, and they'll send an invite to this address.")
                    .font(.subheadline).foregroundStyle(.secondary)
                Button("Try a different email") { stage = .email; error = nil; focus = .email }
                    .buttonStyle(.bordered).controlSize(.large).frame(maxWidth: .infinity)

            case .demoOnly:
                Text("That address has tried the demo").font(.title2.bold())
                Text("It isn't linked to an academy yet. You can carry on exploring the demo, or sign in with the address your academy uses.")
                    .font(.subheadline).foregroundStyle(.secondary)
                Button("Explore the demo") { model.web = WebTarget(path: "/app/demo", title: "Demo", signedIn: false) }
                    .buttonStyle(.borderedProminent).controlSize(.large).frame(maxWidth: .infinity)
                Button("Try a different email") { stage = .email; error = nil; focus = .email }
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(22)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .environment(\.colorScheme, .dark)
        .animation(.snappy, value: stage)
    }

    @ViewBuilder private var errorLine: some View {
        if let error { Text(error).font(.footnote).foregroundStyle(.red) }
    }

    private func start() async {
        error = nil
        let address = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard address.contains("@") else { error = "Enter a valid email address."; return }
        do {
            struct Body: Encodable { let email: String }
            let r: AuthStart = try await API.shared.post("/api/app/v1/auth/start", body: Body(email: address))
            switch r.status {
            case "code_sent":
                code = ""
                stage = .code(kind: r.kind ?? "coach")
                resendIn = 30
                focus = .code
            case "demo": stage = .demoOnly
            default: stage = .unknown
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func verify() async {
        guard !busy, code.count == 6 else { return }
        busy = true; error = nil
        defer { busy = false }
        do {
            struct Body: Encodable { let email: String; let code: String }
            let s: Session = try await API.shared.post("/api/app/v1/auth/verify", body: Body(email: email.trimmingCharacters(in: .whitespacesAndNewlines), code: code))
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            await model.signedIn(s)
        } catch {
            UINotificationFeedbackGenerator().notificationOccurred(.error)
            self.error = error.localizedDescription
            code = ""
        }
    }
}
