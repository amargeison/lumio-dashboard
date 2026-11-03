import SwiftUI

/// What a player still needs to be fully set up — the website card's Setup tab
/// (LiveRoster.tsx): who can sign in to their page, a card or Direct Debit, the
/// welcome link, agreeing to recordings, and a monthly plan waiting to be agreed.
struct SetupFacts {
    var members: [FamilyAccessView.Member] = []
    var link: WelcomeLinkRecord?
    var answeredAt: String?
    var planStatus: String?
    var loaded = false

    /// The count on the Setup badge — the same five checks as the website.
    @MainActor func todo(_ p: PlayerProfile, isHead: Bool, pay: PayModel) -> Int {
        guard loaded else { return 0 }
        return [
            isHead && !members.contains { $0.status == "active" && $0.signedIn == true },
            pay.cards != nil && pay.cards?.card(for: p.id) == nil,
            link?.completedAt == nil,
            p.consentRecord != true,
            planStatus == "offered",
        ].filter { $0 }.count
    }

    static func load(_ playerId: String, isHead: Bool) async -> SetupFacts {
        async let access = members(playerId, isHead: isHead)
        async let links: [WelcomeLinkRecord]? = try? await Rows.list("coach_welcome_links", [("player_id", "eq.\(playerId)")], order: "created_at.desc", limit: 1)
        async let answers: [QuestionnaireRecord]? = try? await Rows.list("coach_questionnaires", [("player_id", "eq.\(playerId)")], order: "submitted_at.desc", limit: 1)
        async let plans: [MembershipRow]? = try? await Rows.list("coach_memberships", [("player_id", "eq.\(playerId)"), ("status", "neq.ended")], order: "created_at.desc", limit: 1)
        let (a, l, q, m) = await (access, links, answers, plans)
        return SetupFacts(members: a, link: l?.first, answeredAt: q?.first?.submittedAt, planStatus: m?.first?.status, loaded: true)
    }

    /// Who can sign in to the player's page (head coach only, as on the website).
    private static func members(_ playerId: String, isHead: Bool) async -> [FamilyAccessView.Member] {
        guard isHead else { return [] }
        struct Access: Decodable { let members: [FamilyAccessView.Member]? }
        let r: Access? = try? await API.shared.get("/api/portal/access", query: ["playerId": playerId])
        return r?.members ?? []
    }
}

struct PlayerSetupView: View {
    @Environment(CoachStore.self) private var store
    @State var player: PlayerProfile
    let pay: PayModel
    let isHead: Bool
    let changed: () async -> Void

    @State private var facts = SetupFacts()
    @State private var plan: PaymentsOverview.Membership?
    @State private var version = "short"
    @State private var busy = ""
    @State private var toast: Toast?
    @State private var newPlan = false
    @State private var withdrawing = false

    private var first: String { player.name.split(separator: " ").first.map(String.init) ?? player.name }
    private var email: String? { [player.parentEmail, player.email, player.contactEmail].compactMap { $0 }.first { !$0.isEmpty } }

    var body: some View {
        List {
            if isHead {
                Section {
                    if facts.members.isEmpty {
                        Text(facts.loaded ? "Nobody has been invited to \(first)’s page yet." : "Checking…").foregroundStyle(.secondary)
                    }
                    ForEach(facts.members) { m in
                        HStack {
                            Text(m.email ?? "").lineLimit(1)
                            Spacer()
                            Text(m.status == "revoked" ? "Access removed" : m.signedIn == true ? "Signed in" : "Invited")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(m.status == "revoked" ? Color.red : m.signedIn == true ? Color.green : Color.secondary)
                        }
                    }
                    NavigationLink { FamilyAccessView(player: player) } label: { Label("Invite or remove", systemImage: "person.badge.key") }
                } header: { status("Portal access", done: facts.members.contains { $0.status == "active" && $0.signedIn == true }) }
            }

            CardOnFileSection(playerId: player.id, pay: pay)

            Section {
                Text(welcomeWords).foregroundStyle(facts.link?.completedAt != nil ? Color.green : facts.link?.sentAt != nil ? Color.orange : Color.secondary)
                Picker("Questions", selection: $version) {
                    Text("Short (5 min)").tag("short")
                    Text("Long (15 min)").tag("long")
                }
                Button { Task { await welcome(send: true) } } label: {
                    Label(busy == "send" ? "Sending…" : (facts.link?.sentAt != nil && facts.link?.completedAt == nil ? "Send again" : "Send welcome link"), systemImage: "paperplane")
                }
                .disabled(!busy.isEmpty || email == nil)
                Button { Task { await welcome(send: false) } } label: { Label(busy == "copy" ? "Copying…" : "Copy link", systemImage: "doc.on.doc") }
                    .disabled(!busy.isEmpty)
                if let at = facts.answeredAt {
                    Text("Answered the questions \(Fmt.when(at)). Their answers are on their card on the website.").font(.caption).foregroundStyle(.secondary)
                }
            } header: { status("Welcome link & questionnaire", done: facts.link?.completedAt != nil) } footer: {
                if email == nil { Text("Add an email address to send it, or copy the link and send it yourself.") }
            }

            Section {
                Text(player.consentWords).foregroundStyle(player.consentRecord == true ? Color.green : Color.orange)
                if player.consentRecord == true {
                    Button("They withdrew it", role: .destructive) { withdrawing = true }
                } else {
                    Button { Task { await setRecord(true) } } label: { Label("They agreed in person", systemImage: "checkmark.shield") }
                }
            } header: { status("Recording lessons", done: player.consentRecord == true) } footer: {
                Text("Their welcome link asks them. Until they agree, their lessons cannot be recorded.")
            }

            Section {
                if let plan {
                    NavigationLink { MembershipView(plan: plan, pay: pay) { await reload() } } label: {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(plan.name).font(.body.weight(.semibold))
                            Text("\(Fmt.money(plan.amountPennies)) a month · \(plan.label)").font(.caption).foregroundStyle(plan.status == "offered" ? Color.orange : Color.secondary)
                        }
                    }
                } else if facts.loaded {
                    Text("No monthly plan. \(first) pays lesson by lesson (or from a pack).").foregroundStyle(.secondary)
                    Button { newPlan = true } label: { Label("Set up a monthly plan", systemImage: "calendar.badge.plus") }
                }
            } header: { status("Monthly plan", done: facts.planStatus != "offered") }
        }
        .navigationTitle("Setup")
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .task { await reload() }
        .refreshable { await reload() }
        .sheet(isPresented: $newPlan) {
            MembershipForm(plan: nil, presetPlayerId: player.id) { t in toast = Toast(text: t); Task { await reload() } }
                .environment(store)
        }
        .confirmationDialog("Note that \(first) no longer agrees to lessons being recorded?", isPresented: $withdrawing, titleVisibility: .visible) {
            Button("They withdrew it", role: .destructive) { Task { await setRecord(false) } }
            Button("Cancel", role: .cancel) {}
        } message: { Text("Recordings already made stay until you delete them.") }
    }

    private func status(_ title: String, done: Bool) -> some View {
        HStack(spacing: 6) {
            Text(title)
            if facts.loaded { Image(systemName: done ? "checkmark.circle.fill" : "exclamationmark.circle.fill").foregroundStyle(done ? Color.green : Color.orange) }
        }
    }

    private var welcomeWords: String {
        guard let l = facts.link else { return "Not sent yet." }
        if let c = l.completedAt { return "Finished \(Fmt.when(c))." }
        if let s = l.sentAt { return "Sent \(Fmt.when(s))\(l.openedAt.map { ", opened \(Fmt.when($0))" } ?? ""). Not finished yet." }
        return "Link made, not emailed."
    }

    private func reload() async {
        facts = await SetupFacts.load(player.id, isHead: isHead)
        if let o: PaymentsOverview = try? await API.shared.get("/api/app/v1/coach/payments") {
            plan = o.memberships.first { $0.playerId == player.id && $0.status != "ended" }
        }
        await changed()
    }

    private func welcome(send: Bool) async {
        busy = send ? "send" : "copy"
        defer { busy = "" }
        struct Body: Encodable { let playerIds: [String]; let version: String; let send: Bool }
        struct Answer: Decodable { let url: String?; let sent: Bool?; let noEmail: [String]?; let error: String? }
        do {
            let r: Answer = try await API.shared.post("/api/coach/welcome", body: Body(playerIds: [player.id], version: version, send: send))
            if !send, let url = r.url {
                UIPasteboard.general.string = url
                toast = Toast(text: "Link copied. Send it however suits you.")
            } else if r.sent == true {
                toast = Toast(text: "Welcome link sent\(email.map { " to \($0)" } ?? "").")
            } else {
                toast = Toast(text: r.noEmail?.isEmpty == false ? "There is no email address for \(first). Copy the link instead." : "The email didn’t send. Copy the link and send it yourself.", isError: true)
            }
            facts = await SetupFacts.load(player.id, isHead: isHead)
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func setRecord(_ ok: Bool) async {
        let now = ISO8601DateFormatter().string(from: Date())
        let row: RowValues = ok
            ? ["consent_record": .bool(true), "consent_record_at": .string(now), "consent_record_by": .string("Agreed in person"), "consent_record_how": .string("in_person")]
            : ["consent_record": .bool(false), "consent_record_at": .string(now), "consent_record_how": .string("withdrawn")]
        do {
            let _: IdRow = try await Rows.update("coach_players", id: player.id, row)
            let rows: [PlayerProfile]? = try? await Rows.list("coach_players", [("id", player.id)])
            if let p = rows?.first { player = p }
            await changed()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}
