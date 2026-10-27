import SwiftUI

/// Weekly groups, and who's coming this week.
struct GroupsView: View {
    @Environment(CoachStore.self) private var store
    @State private var state: Loadable<[GroupRecord]> = .loading

    var body: some View {
        Group {
            switch state {
            case .loading: ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .failed(let m): LoadFailed(message: m) { await load() }
            case .loaded(let groups):
                List {
                    ForEach(groups) { g in
                        NavigationLink { GroupWeekView(group: g) } label: {
                            VStack(alignment: .leading, spacing: 3) {
                                HStack {
                                    Text(g.name).font(.body.weight(.semibold))
                                    if g.active == false { Pill(text: "Paused", tint: .secondary) }
                                }
                                Text("\(GroupDates.weekdayName(g.weekday))s at \(Fmt.time(g.startTime)) · \(Fmt.mins(g.durationMin ?? 60))\(g.court.map { " · \($0)" } ?? "")")
                                    .font(.subheadline).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                .overlay {
                    if groups.isEmpty {
                        ContentUnavailableView("No weekly groups", systemImage: "person.3", description: Text("Set groups up on the website, under Weekly Groups."))
                    }
                }
            }
        }
        .navigationTitle("Weekly groups")
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        do {
            let all: [GroupRecord] = try await Rows.list("coach_groups", order: "weekday.asc")
            // Running groups first, then by day and time.
            state = .loaded(all.sorted { a, b in
                let aOn = a.active ?? true, bOn = b.active ?? true
                if aOn != bOn { return aOn }
                if a.weekday != b.weekday { return a.weekday < b.weekday }
                return a.startTime < b.startTime
            })
        } catch { if state.value == nil { state = .failed(error.localizedDescription) } }
    }
}

/// The days a group meets, worked out in UK time (lib/coach/groups.ts).
enum GroupDates {
    static var cal: Calendar = { var c = Calendar(identifier: .gregorian); c.timeZone = Fmt.london; return c }()

    /// 0 = Monday … 6 = Sunday
    static func weekday(_ d: Date) -> Int { (cal.component(.weekday, from: d) + 5) % 7 }
    static func weekdayName(_ w: Int) -> String { ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][max(0, min(6, w))] }

    /// The next date the group meets that hasn't started yet.
    static func upcoming(_ g: GroupRecord, now: Date = Date()) -> String {
        let today = cal.startOfDay(for: now)
        for i in 0..<8 {
            guard let d = cal.date(byAdding: .day, value: i, to: today) else { continue }
            let iso = Fmt.iso(d)
            if weekday(d) == g.weekday, let start = Fmt.at(iso, g.startTime), start > now { return iso }
        }
        return Fmt.iso(cal.date(byAdding: .day, value: 7, to: today) ?? today)
    }
}

/// One group's coming week: who's said yes or no, who hasn't answered, who's
/// paid — with marking someone in or out, asking everyone, and calling it off.
struct GroupWeekView: View {
    @Environment(CoachStore.self) private var store
    let group: GroupRecord

    @State private var members: [GroupMemberRecord] = []
    @State private var week: GroupSessionRecord?
    @State private var replies: [GroupReplyRecord] = []
    @State private var pay = PayModel()
    @State private var loaded = false
    @State private var toast: Toast?
    @State private var adding = false

    private var date: String { GroupDates.upcoming(group) }

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text(Fmt.dayLong(date)).font(.headline)
                    Text("\(Fmt.time(group.startTime))–\(Fmt.endTime(group.startTime, mins: group.durationMin ?? 60))\(group.court.map { " · \($0)" } ?? "")")
                        .foregroundStyle(.secondary)
                    HStack(spacing: 6) {
                        Pill(text: "\(yes.count) of \(group.capacity ?? 8) coming", tint: .green)
                        if week?.status == "cancelled" { Pill(text: "Called off", tint: .red) }
                        if let p = group.pricePennies, p > 0 { Pill(text: "\(Fmt.money(p)) each", tint: .secondary) }
                    }
                }
                .padding(.vertical, 4)
            }

            if !loaded {
                Section { HStack { Spacer(); ProgressView(); Spacer() } }
            } else {
                Section("Players") {
                    if members.isEmpty { Text("No one in this group yet.").foregroundStyle(.secondary) }
                    ForEach(members) { m in memberRow(m) }
                    Button { adding = true } label: { Label("Add a player", systemImage: "person.badge.plus") }
                }

                if week?.status != "cancelled" {
                    Section {
                        BusyButton(title: week?.askedAt == nil ? "Ask everyone if they're coming" : "Ask anyone not asked yet", systemImage: "envelope", prominent: false) { await ask() }
                            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                        if let bookingId = week?.bookingId {
                            CallOffButton { reason in await callOff(bookingId, reason) }
                        }
                    } footer: {
                        if let asked = week?.askedAt { Text("Asked \(Fmt.moment(asked)).") }
                    }
                }
            }
        }
        .navigationTitle(group.name)
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .sheet(isPresented: $adding) {
            NavigationStack {
                PlayerChooser(allowNew: false, selected: nil) { id in if let id { Task { await addMember(id) } } }
                    .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { adding = false } } }
            }
            .environment(store)
        }
        .task { await load() }
        .refreshable { await load() }
    }

    private var yes: [GroupReplyRecord] { replies.filter { $0.answer == "yes" } }

    private func reply(for playerId: String) -> GroupReplyRecord? { replies.first { $0.playerId == playerId } }

    @ViewBuilder private func memberRow(_ m: GroupMemberRecord) -> some View {
        let name = store.player(m.playerId)?.name ?? "Player"
        let r = reply(for: m.playerId)
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(.body.weight(.medium))
                Text(status(r)).font(.subheadline).foregroundStyle(color(r))
            }
            Spacer()
            if let paid = payLine(r) { Text(paid).font(.caption).foregroundStyle(.secondary) }
        }
        .swipeActions(edge: .trailing) {
            if let r, week?.status != "cancelled" {
                if r.answer != "yes" { Button("Coming") { Task { await mark(r, "yes") } }.tint(.green) }
                if r.answer != "no" { Button("Not coming") { Task { await mark(r, "no") } }.tint(.orange) }
            }
            Button("Remove", role: .destructive) { Task { await removeMember(m) } }
        }
        .contextMenu {
            if let r, week?.status != "cancelled" {
                Button { Task { await mark(r, "yes") } } label: { Label("Mark as coming", systemImage: "checkmark") }
                Button { Task { await mark(r, "no") } } label: { Label("Mark as not coming", systemImage: "xmark") }
            }
            Button(role: .destructive) { Task { await removeMember(m) } } label: { Label("Remove from group", systemImage: "person.badge.minus") }
        }
    }

    private func status(_ r: GroupReplyRecord?) -> String {
        guard let r else { return "Not asked yet" }
        switch r.answer {
        case "yes": return r.answeredBy == "coach" ? "Coming (you marked)" : "Coming"
        case "no": return r.late == true ? "Cancelled late" : "Can't come"
        default: return r.openedAt != nil ? "Seen, no answer" : (r.sentAt != nil ? "Asked" : "Not asked yet")
        }
    }

    private func color(_ r: GroupReplyRecord?) -> Color {
        switch r?.answer { case "yes": return .green; case "no": return .orange; default: return .secondary }
    }

    private func payLine(_ r: GroupReplyRecord?) -> String? {
        guard let r, r.answer == "yes" else { return nil }
        guard let c = pay.cards?.charges?.first(where: { $0.replyId == r.id }) else { return nil }
        switch c.status { case "paid": return "Paid"; case "processing": return "Paying (DD)"; case "refunded": return "Refunded"; case "failed": return "Payment failed"; default: return nil }
    }

    // MARK: Loading and actions

    private func load() async {
        async let cards: Void = pay.load()
        do {
            members = try await Rows.list("coach_group_members", [("group_id", "eq.\(group.id)")])
            let weeks: [GroupSessionRecord] = try await Rows.list("coach_group_sessions", [("group_id", "eq.\(group.id)"), ("session_date", "eq.\(date)")])
            week = weeks.first
            if let w = week { replies = try await Rows.list("coach_group_replies", [("session_id", "eq.\(w.id)")]) } else { replies = [] }
        } catch {
            toast = Toast(text: error.localizedDescription, isError: true)
        }
        _ = await cards
        loaded = true
    }

    private func ask() async {
        struct Body: Encodable { let action = "ask"; let groupId: String }
        struct Answer: Decodable { let asked: Int?; let noEmail: Int?; let failed: Int?; let closed: Bool? }
        do {
            let r: Answer = try await API.shared.post("/api/coach/groups", body: Body(groupId: group.id))
            var t = (r.asked ?? 0) == 0 ? "Everyone has been asked already." : "Asked \(r.asked!) player\(r.asked == 1 ? "" : "s")."
            if let n = r.noEmail, n > 0 { t += " \(n) have no email address." }
            toast = Toast(text: t)
            await load()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func mark(_ r: GroupReplyRecord, _ answer: String) async {
        struct Body: Encodable { let action = "mark"; let replyId: String; let answer: String }
        struct Answer: Decodable { let late: Bool?; let refunded: Bool?; let warning: String? }
        do {
            let a: Answer = try await API.shared.post("/api/coach/groups", body: Body(replyId: r.id, answer: answer))
            UISelectionFeedbackGenerator().selectionChanged()
            if let w = a.warning { toast = Toast(text: w) } else if a.refunded == true { toast = Toast(text: "Marked out and refunded.") }
            await load()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func callOff(_ bookingId: String, _ reason: String) async {
        struct Body: Encodable { let bookingIds: [String]; let reason: String; let tell = true }
        do {
            let _: OkNotice = try await API.shared.post("/api/coach/rain-off", body: Body(bookingIds: [bookingId], reason: reason))
            toast = Toast(text: "Called off. Everyone coming has been told, and anyone who paid is refunded.")
            store.saved()
            await load()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func addMember(_ playerId: String) async {
        adding = false
        guard !members.contains(where: { $0.playerId == playerId }) else { return }
        do {
            let _: GroupMemberRecord = try await Rows.insert("coach_group_members", ["group_id": .string(group.id), "player_id": .string(playerId)])
            await load()
            toast = Toast(text: "Added. Use \u{201C}Ask anyone not asked yet\u{201D} to invite them this week.")
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func removeMember(_ m: GroupMemberRecord) async {
        do { try await Rows.delete("coach_group_members", id: m.id); await load() }
        catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// "Call this week off", asking why (rain, or the coach can't make it).
struct CallOffButton: View {
    let callOff: (String) async -> Void
    @State private var asking = false
    var body: some View {
        Button(role: .destructive) { asking = true } label: { Label("Call this week off", systemImage: "cloud.rain") }
            .confirmationDialog("Call this week off?", isPresented: $asking, titleVisibility: .visible) {
                Button("Rained off") { Task { await callOff("weather") } }
                Button("I can't make it") { Task { await callOff("coach") } }
                Button("Keep it on", role: .cancel) {}
            } message: {
                Text("Everyone coming is emailed, and anyone who has paid is refunded.")
            }
    }
}
