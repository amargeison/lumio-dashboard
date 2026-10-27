import SwiftUI

/// A new message to one player, several, or everyone — in the app, by email or
/// both — with Lumio Coach to help write it.
struct ComposeView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(CoachStore.self) private var store
    var preset: [String] = []
    let sent: (String) -> Void

    @State private var picked: Set<String> = []
    @State private var everyone = false
    @State private var inApp = true
    @State private var email = true
    @State private var urgent = false
    @State private var text = ""
    @State private var intent = ""
    @State private var drafting = false
    @State private var sending = false
    @State private var error: String?
    @State private var choosing = false

    private var recipients: [PlayerRecord] { everyone ? store.players : store.players.filter { picked.contains($0.id) } }
    private var canSend: Bool { !recipients.isEmpty && (inApp || email) && !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !sending }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Toggle("Everyone on the roster", isOn: $everyone)
                    if !everyone {
                        Button { choosing = true } label: {
                            LabeledContent("To", value: summary)
                        }
                        .foregroundStyle(.primary)
                    }
                } header: { Text("Who") } footer: {
                    if everyone { Text("\(store.players.count) players.") }
                }

                Section("How") {
                    Toggle(isOn: $inApp) { Label("In their Lumio app", systemImage: "app.badge") }
                    Toggle(isOn: $email) { Label("By email", systemImage: "envelope") }
                    Toggle(isOn: $urgent) { Label("Mark as urgent", systemImage: "exclamationmark.circle") }
                }

                Section {
                    TextField("What do you want to say? e.g. \"rain tonight, sessions off, back next week\"", text: $intent, axis: .vertical).lineLimit(2...5)
                    Button { Task { await draft() } } label: {
                        HStack { if drafting { ProgressView() } else { Image(systemName: "sparkles") }; Text("Write it for me") }
                    }
                    .disabled(drafting || intent.trimmingCharacters(in: .whitespaces).isEmpty)
                } header: { Text("Lumio Coach") } footer: { Text("Or skip this and write the message yourself below.") }

                Section("Message") {
                    TextField("Message", text: $text, axis: .vertical).lineLimit(5...14)
                }

                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle("New message")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if sending { ProgressView() } else { Button("Send") { Task { await send() } }.disabled(!canSend) }
                }
            }
            .sheet(isPresented: $choosing) {
                NavigationStack { RecipientChooser(picked: $picked) }.environment(store)
            }
            .task { await store.load(); if picked.isEmpty { picked = Set(preset) } }
        }
    }

    private var summary: String {
        let names = recipients.map(\.name)
        switch names.count {
        case 0: return "Choose…"
        case 1...2: return names.joined(separator: ", ")
        default: return "\(names[0]) and \(names.count - 1) others"
        }
    }

    private func draft() async {
        drafting = true; error = nil
        defer { drafting = false }
        struct Body: Encodable { let intent: String; let recipients: [String]; let channels: [String]; let urgent: Bool }
        struct Answer: Decodable { let text: String? }
        do {
            let channels = [inApp ? "In-app" : nil, email ? "Email" : nil].compactMap { $0 }
            let r: Answer = try await API.shared.post("/api/coach/message-draft", body: Body(intent: String(intent.prefix(2000)), recipients: Array(recipients.prefix(40).map(\.name)), channels: channels, urgent: urgent))
            text = Self.plain(r.text ?? "")
        } catch { self.error = error.localizedDescription }
    }

    /// The draft without Markdown marks (**bold**, # headings).
    static func plain(_ s: String) -> String {
        s.replacingOccurrences(of: "**", with: "")
            .replacingOccurrences(of: #"(?m)^#{1,6}\s*"#, with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func send() async {
        sending = true; error = nil
        defer { sending = false }
        struct To: Encodable { let playerId: String }
        struct Body: Encodable { let recipients: [To]; let channels: [String]; let body: String; let urgent: Bool }
        struct Result: Decodable { let name: String?; let channel: String?; let ok: Bool?; let detail: String? }
        struct Answer: Decodable { let status: String?; let results: [Result]? }
        do {
            let channels = [inApp ? "inapp" : nil, email ? "email" : nil].compactMap { $0 }
            let r: Answer = try await API.shared.post("/api/coach/message/send", body: Body(recipients: recipients.map { To(playerId: $0.id) }, channels: channels, body: text.trimmingCharacters(in: .whitespacesAndNewlines), urgent: urgent))
            let results = r.results ?? []
            let reached = Set(results.filter { $0.ok == true }.compactMap(\.name))
            if r.status == "failed" || reached.isEmpty {
                error = results.first(where: { $0.ok != true })?.detail ?? "Nothing was sent."
                UINotificationFeedbackGenerator().notificationOccurred(.error)
                return
            }
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            store.saved()
            let missed = Set(results.filter { $0.ok != true }.compactMap(\.name)).subtracting(reached)
            sent(missed.isEmpty ? "Sent to \(reached.count == 1 ? reached.first! : "\(reached.count) people")." : "Sent, but not to \(missed.sorted().joined(separator: ", ")).")
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

/// Tick the players a message goes to.
struct RecipientChooser: View {
    @Environment(CoachStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Binding var picked: Set<String>
    @State private var query = ""

    var body: some View {
        List {
            ForEach(shown) { p in
                Button {
                    if picked.contains(p.id) { picked.remove(p.id) } else { picked.insert(p.id) }
                } label: {
                    HStack {
                        Image(systemName: picked.contains(p.id) ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(picked.contains(p.id) ? Color.accentColor : Color.secondary)
                        Text(p.name).foregroundStyle(.primary)
                        Spacer()
                        if !p.hasEmail { Text("no email").font(.caption).foregroundStyle(.secondary) }
                    }
                }
            }
        }
        .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search players")
        .navigationTitle(picked.isEmpty ? "Choose players" : "\(picked.count) chosen")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            ToolbarItem(placement: .topBarLeading) { if !picked.isEmpty { Button("Clear") { picked = [] } } }
        }
    }

    private var shown: [PlayerRecord] {
        let q = query.trimmingCharacters(in: .whitespaces)
        return q.isEmpty ? store.players : store.players.filter { $0.name.localizedCaseInsensitiveContains(q) }
    }
}
