import SwiftUI

/// Every conversation — players, camps, contacts — newest first.
struct InboxView: View {
    @Environment(AppModel.self) private var model
    @Environment(CoachStore.self) private var store
    @Binding var unread: Int
    @State private var state: Loadable<[Conversation]> = .loading
    @State private var composing = false
    @State private var toast: Toast?

    var body: some View {
        Group {
            switch state {
            case .loading: ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .failed(let m): LoadFailed(message: m) { await load() }
            case .loaded(let list):
                if list.isEmpty {
                    ContentUnavailableView("No messages yet", systemImage: "bubble.left.and.bubble.right", description: Text("Messages from families and replies to your emails land here."))
                } else {
                    List(list) { c in
                        NavigationLink(value: c) { row(c) }
                    }
                    .listStyle(.plain)
                }
            }
        }
        .navigationTitle("Messages")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { composing = true } label: { Image(systemName: "square.and.pencil") }
                    .accessibilityLabel("New message")
            }
        }
        .navigationDestination(for: Conversation.self) { c in
            ThreadView(conversation: c) { Task { await load() } }
        }
        .task { await load() }
        .refreshable { await load() }
        .onChange(of: store.changes) { _, _ in Task { await load() } }
        .sheet(isPresented: $composing) {
            ComposeView { text in toast = Toast(text: text) }.environment(store)
        }
        .toast($toast)
    }

    private func row(_ c: Conversation) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack(alignment: .topLeading) {
                Avatar(name: c.title, size: 44)
                if c.unread > 0 {
                    Circle().fill(Color.accentColor).frame(width: 12, height: 12).overlay(Circle().stroke(Color(.systemBackground), lineWidth: 2)).offset(x: -2, y: -2)
                }
            }
            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(c.title).font(.body.weight(c.unread > 0 ? .bold : .semibold)).lineLimit(1)
                    if let tag = c.tag, tag != "Player" { Pill(text: tag, tint: .secondary) }
                    Spacer()
                    Text(Fmt.when(c.last?.at)).font(.caption).foregroundStyle(.secondary)
                }
                Text((c.last?.fromThem == false ? "You: " : "") + (c.last?.body ?? ""))
                    .font(.subheadline).foregroundStyle(c.unread > 0 ? .primary : .secondary).lineLimit(2)
            }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
        .accessibilityHint(c.unread > 0 ? "\(c.unread) unread" : "")
    }

    private func load() async {
        do {
            let r: ConversationsResponse = try await API.shared.get("/api/app/v1/coach/messages")
            state = .loaded(r.conversations)
            unread = r.conversations.reduce(0) { $0 + $1.unread }
        } catch {
            if state.value == nil { state = .failed(error.localizedDescription) }
        }
    }
}

/// One conversation, as chat bubbles, with a reply box for players.
struct ThreadView: View {
    @Environment(AppModel.self) private var model
    let conversation: Conversation
    let onChange: () -> Void
    @State private var messages: [ChatMessage] = []
    @State private var draft = ""
    @State private var loading = true
    @State private var toast: Toast?
    @FocusState private var typing: Bool

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 8) {
                    if loading && messages.isEmpty { ProgressView().padding(.top, 40) }
                    ForEach(messages) { m in Bubble(message: m).id(m.id) }
                }
                .padding(.horizontal, 12).padding(.vertical, 10)
            }
            .defaultScrollAnchor(.bottom)
            .scrollDismissesKeyboard(.interactively)
            .onChange(of: messages.count) { _, _ in
                if let last = messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
            }
        }
        .safeAreaInset(edge: .bottom) { composer }
        .navigationTitle(conversation.title)
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .task { await load(); onChange() }
    }

    @ViewBuilder private var composer: some View {
        if conversation.canReply {
            HStack(alignment: .bottom, spacing: 8) {
                TextField("Message", text: $draft, axis: .vertical)
                    .lineLimit(1...5)
                    .focused($typing)
                    .padding(.horizontal, 14).padding(.vertical, 9)
                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                SendButton(enabled: !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) { await send() }
            }
            .padding(.horizontal, 12).padding(.vertical, 8)
            .background(.bar)
        } else {
            Button { model.web = WebTarget(path: model.coachWebPath("messages"), title: "Messages") } label: {
                Label("Reply on the website", systemImage: "arrow.up.right.square").frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered).controlSize(.large)
            .padding(12).background(.bar)
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        if let r: ThreadResponse = try? await API.shared.get("/api/app/v1/coach/messages/thread", query: ["id": conversation.id]) {
            messages = r.messages
        }
    }

    private func send() async {
        let body = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !body.isEmpty else { return }
        do {
            struct Body: Encodable { let id: String; let body: String }
            let _: Empty = try await API.shared.post("/api/app/v1/coach/messages/reply", body: Body(id: conversation.id, body: body))
            draft = ""
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            await load()
            onChange()
        } catch {
            toast = Toast(text: error.localizedDescription, isError: true)
        }
    }
}

struct Bubble: View {
    let message: ChatMessage
    var body: some View {
        let mine = !message.fromThem
        HStack {
            if mine { Spacer(minLength: 48) }
            VStack(alignment: mine ? .trailing : .leading, spacing: 3) {
                if let subject = message.subject, !subject.isEmpty {
                    Text(subject).font(.caption.weight(.semibold)).foregroundStyle(mine ? Color.white.opacity(0.85) : Color.secondary)
                }
                Text(Self.rich(message.body))
                    .foregroundStyle(mine ? Color.white : Color.primary)
                    .tint(mine ? Color.white : Color.accentColor)
                    .textSelection(.enabled)
                Text([message.fromThem ? message.from : nil, Fmt.when(message.at)].compactMap { $0 }.joined(separator: " · "))
                    .font(.caption2).foregroundStyle(mine ? Color.white.opacity(0.75) : Color.secondary)
            }
            .padding(.horizontal, 12).padding(.vertical, 8)
            .background(mine ? Color.accentColor : Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            if !mine { Spacer(minLength: 48) }
        }
    }
}

extension Bubble {
    /// Messages can carry Markdown links ("[Google Calendar](https://…)"): show
    /// them as tappable words, not the raw address.
    static func rich(_ body: String) -> AttributedString {
        let text = body.isEmpty ? " " : body
        let options = AttributedString.MarkdownParsingOptions(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        if var a = try? AttributedString(markdown: text, options: options) {
            for run in a.runs where run.link != nil { a[run.range].underlineStyle = .single }
            return a
        }
        return AttributedString(text)
    }
}

struct SendButton: View {
    let enabled: Bool
    let action: () async -> Void
    @State private var busy = false
    var body: some View {
        Button {
            guard !busy else { return }
            busy = true
            Task { await action(); busy = false }
        } label: {
            ZStack {
                if busy { ProgressView() } else { Image(systemName: "arrow.up.circle.fill").font(.system(size: 32)) }
            }
            .frame(width: 36, height: 36)
        }
        .disabled(!enabled || busy)
        .accessibilityLabel("Send")
    }
}
