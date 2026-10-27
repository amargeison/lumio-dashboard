import SwiftUI

/// The family's conversation with their coach.
struct FamilyMessagesView: View {
    @Environment(AppModel.self) private var model
    @Environment(FamilyModel.self) private var family
    @State private var draft = ""
    @State private var toast: Toast?

    var body: some View {
        FamilyContent { b in thread(b) }
            .navigationTitle(model.selectedPlayer?.academyName ?? "Messages")
            .navigationBarTitleDisplayMode(.inline)
            .toast($toast)
    }

    private func thread(_ b: FamilyBundle) -> some View {
        let messages = (b.messages ?? []).reversed().map { m in
            ChatMessage(id: m.id, fromThem: !m.fromFamily, from: m.fromFamily ? nil : m.fromName,
                        subject: m.subject, body: m.body ?? "", at: m.createdAt ?? "")
        }
        return ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 8) {
                    if messages.isEmpty {
                        ContentUnavailableView("No messages yet", systemImage: "bubble.left.and.bubble.right",
                                               description: Text("Ask your coach anything. They'll get it straight away."))
                            .padding(.top, 60)
                    }
                    ForEach(messages) { m in Bubble(message: m).id(m.id) }
                }
                .padding(.horizontal, 12).padding(.vertical, 10)
            }
            .defaultScrollAnchor(.bottom)
            .scrollDismissesKeyboard(.interactively)
            .refreshable { await family.reload() }
            .onChange(of: messages.count) { _, _ in
                if let last = messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
            }
        }
        .safeAreaInset(edge: .bottom) {
            HStack(alignment: .bottom, spacing: 8) {
                TextField("Message your coach", text: $draft, axis: .vertical)
                    .lineLimit(1...5)
                    .padding(.horizontal, 14).padding(.vertical, 9)
                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                SendButton(enabled: !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) { await send() }
            }
            .padding(.horizontal, 12).padding(.vertical, 8)
            .background(.bar)
        }
    }

    private func send() async {
        let body = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !body.isEmpty else { return }
        struct Body: Encodable { let playerId: String; let body: String }
        do {
            let _: OkNotice = try await API.shared.post("/api/portal/message", body: Body(playerId: family.playerId, body: body))
            draft = ""
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            await family.reload()
        } catch {
            toast = Toast(text: error.localizedDescription, isError: true)
        }
    }
}
