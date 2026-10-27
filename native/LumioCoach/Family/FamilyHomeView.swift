import SwiftUI

/// The family's first screen: the next lessons (with "I'll be there" and
/// "Can't make it"), this week's groups, booking, and the latest lesson notes.
struct FamilyHomeView: View {
    @Environment(AppModel.self) private var model
    @Environment(FamilyModel.self) private var family
    @State private var toast: Toast?
    @State private var cancelling: MyLesson?
    @State private var booking = false

    var body: some View {
        FamilyContent { b in content(b) }
            .navigationTitle(title)
            .toast($toast)
            .refreshable { await family.reload() }
            .sheet(isPresented: $booking) {
                if let my = family.my {
                    BookSessionView(playerId: family.playerId, booking: my.booking) { notice in
                        toast = Toast(text: notice)
                        Task { await family.reload() }
                    }
                }
            }
            .confirmationDialog(cancelling.map { "Cancel \(Fmt.dayFriendly($0.date)) at \(Fmt.time($0.time))?" } ?? "",
                                isPresented: Binding(get: { cancelling != nil }, set: { if !$0 { cancelling = nil } }),
                                titleVisibility: .visible,
                                presenting: cancelling) { l in
                Button("Cancel lesson", role: .destructive) {
                    Task { await lesson(l, action: "cancel") }
                }
                Button("Keep it", role: .cancel) {}
            } message: { l in
                Text(l.cancel.confirm.isEmpty ? l.cancel.words : l.cancel.confirm)
            }
    }

    private var title: String {
        if let p = model.selectedPlayer, p.isParent { return p.firstName }
        return "Lessons"
    }

    private func content(_ b: FamilyBundle) -> some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text(model.selectedPlayer?.academyName ?? "").font(.subheadline).foregroundStyle(.secondary)
                    Text("\(Fmt.greeting()), \(greetName(b))").font(.title2.bold())
                }
                .padding(.vertical, 4)
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets(top: 0, leading: 4, bottom: 0, trailing: 4))
            }

            // A camp they're booked on, from booking until it ends — the same
            // card the website shows, and the coach can hide it ("camp").
            if b.shows("camp"), !b.campCards.isEmpty {
                Section(b.campCards.count == 1 ? "Camp" : "Camps") {
                    ForEach(b.campCards) { c in
                        NavigationLink { FamilyCampView(camp: c) } label: { FamilyCampRow(camp: c) }
                    }
                }
            }

            if let my = b.my {
                Section {
                    if my.lessons.isEmpty {
                        Text("No lessons booked.").foregroundStyle(.secondary)
                    }
                    ForEach(my.lessons) { l in lessonCard(l) }
                    if my.booking.on {
                        Button { booking = true } label: {
                            Label("Book a session", systemImage: "calendar.badge.plus").font(.body.weight(.semibold))
                        }
                    }
                } header: { Text("Next lessons") }

                if !my.groups.isEmpty {
                    Section("Weekly groups") {
                        ForEach(my.groups) { g in GroupCard(group: g, toast: $toast) { await family.reload() } }
                    }
                }
            }

            if let lessons = b.lessons, !lessons.isEmpty {
                Section("From your coach") {
                    ForEach(lessons.prefix(5)) { s in
                        NavigationLink { LessonSummaryView(lesson: s) } label: { summaryRow(s) }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private func greetName(_ b: FamilyBundle) -> String {
        if let p = model.selectedPlayer, p.isParent {
            return (b.player.parentName ?? "").split(separator: " ").first.map(String.init) ?? "there"
        }
        let n = b.player.nickname?.isEmpty == false ? b.player.nickname! : (b.player.name ?? "")
        return n.split(separator: " ").first.map(String.init) ?? "there"
    }

    private func lessonCard(_ l: MyLesson) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                DayTile(iso: l.date)
                VStack(alignment: .leading, spacing: 3) {
                    Text("\(Fmt.time(l.time))–\(Fmt.endTime(l.time, mins: l.mins))").font(.headline).monospacedDigit()
                    Text([l.type, l.coach.map { "with \($0)" }].compactMap { $0 }.joined(separator: " "))
                        .font(.subheadline)
                    if let court = l.court { Text(court).font(.subheadline).foregroundStyle(.secondary) }
                    HStack(spacing: 6) {
                        if l.cover == "plan" { Pill(text: "On your plan", tint: .purple) }
                        else if l.cover == "pack" { Pill(text: "Off your pack", tint: .teal) }
                        else if l.paid { Pill(text: "Paid", systemImage: "checkmark", tint: .green) }
                    }
                }
                Spacer(minLength: 0)
            }
            if l.confirmed != nil {
                HStack {
                    Label("You'll be there", systemImage: "checkmark.circle.fill").foregroundStyle(.green).font(.subheadline.weight(.semibold))
                    Spacer()
                    Button("Can't make it") { cancelling = l }.font(.subheadline).buttonStyle(.borderless).tint(.red)
                }
            } else {
                HStack(spacing: 10) {
                    BusyButton(title: "I'll be there", systemImage: "hand.thumbsup") { await lesson(l, action: "confirm") }
                    Button { cancelling = l } label: { Text("Can't make it").frame(maxWidth: .infinity, minHeight: 22) }
                        .buttonStyle(.bordered).controlSize(.large).tint(.red)
                }
                .buttonStyle(.borderless)
            }
        }
        .padding(.vertical, 6)
    }

    private func summaryRow(_ s: LessonSummary) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(s.sessionDate.map(Fmt.dayFriendly) ?? "Lesson").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            Text(s.review?.focus ?? s.focus ?? "Lesson notes").font(.body.weight(.medium)).lineLimit(1)
            if let line = s.review?.recap ?? s.summary {
                Text(line).font(.subheadline).foregroundStyle(.secondary).lineLimit(2)
            }
        }
        .padding(.vertical, 2)
    }

    private func lesson(_ l: MyLesson, action: String) async {
        struct Body: Encodable { let playerId: String; let bookingId: String; let action: String }
        do {
            let r: OkNotice = try await API.shared.post("/api/portal/lesson", body: Body(playerId: family.playerId, bookingId: l.id, action: action))
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            if let n = r.notice { toast = Toast(text: n) }
            await family.reload()
        } catch {
            UINotificationFeedbackGenerator().notificationOccurred(.error)
            toast = Toast(text: error.localizedDescription, isError: true)
        }
    }
}

/// One weekly group: when it is next, and "Yes, I'm coming" / "Not this week".
struct GroupCard: View {
    @Environment(AppModel.self) private var model
    let group: MyGroup
    @Binding var toast: Toast?
    let changed: () async -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(group.name).font(.headline)
                    Text([group.every, group.venue].compactMap { $0 }.joined(separator: " · ")).font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                if group.price > 0 { Text(Fmt.money(group.price)).font(.subheadline).foregroundStyle(.secondary) }
            }
            if let n = group.next {
                Text("Next: \(Fmt.dayFriendly(n.date)) at \(n.time)").font(.subheadline.weight(.medium))
                if n.cancelled {
                    Pill(text: "Called off this week", systemImage: "xmark", tint: .red)
                } else if let token = n.token {
                    answerRow(n, token: token)
                } else if let askOn = n.askOn {
                    Text("You can say if you're coming from \(Fmt.dayFriendly(askOn)).").font(.footnote).foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder private func answerRow(_ n: MyGroup.Next, token: String) -> some View {
        switch n.answer {
        case "yes":
            HStack {
                Pill(text: "You're coming", systemImage: "checkmark", tint: .green)
                if n.paid || n.coveredByPlan { Pill(text: n.coveredByPlan ? "On your plan" : "Paid", tint: .secondary) }
                Spacer()
                if !n.paid && !n.coveredByPlan && group.price > 0 {
                    Button("Pay") { Task { await answer(token, "pay") } }.buttonStyle(.borderedProminent).controlSize(.small)
                }
                Button("Can't come") { Task { await answer(token, "no") } }.buttonStyle(.borderless).tint(.red).font(.subheadline)
            }
        case "no":
            HStack {
                Pill(text: "Not coming", tint: .secondary)
                Spacer()
                Button("I can come after all") { Task { await answer(token, "yes") } }.buttonStyle(.borderless).font(.subheadline)
            }
        default:
            VStack(alignment: .leading, spacing: 6) {
                if let left = n.placesLeft { Text(left == 0 ? "Full this week" : "\(left) place\(left == 1 ? "" : "s") left").font(.footnote).foregroundStyle(.secondary) }
                HStack(spacing: 10) {
                    BusyButton(title: "I'm coming", systemImage: "checkmark") { await answer(token, "yes") }
                    BusyButton(title: "Not this week", prominent: false) { await answer(token, "no") }
                }
            }
            .buttonStyle(.borderless)
        }
    }

    private func answer(_ token: String, _ action: String) async {
        struct Body: Encodable { let action: String }
        do {
            let r: GroupAnswer = try await API.shared.post("/api/group/\(token)", body: Body(action: action))
            if action == "pay", let url = r.url {
                model.web = WebTarget(path: url, title: "Pay for \(group.name)")
                return
            }
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            if let n = r.notice, !n.isEmpty { toast = Toast(text: n) }
            await changed()
        } catch {
            toast = Toast(text: error.localizedDescription, isError: true)
            await changed()
        }
    }
}
