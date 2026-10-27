import SwiftUI

/// Payments & Packs: the month's takings, what's owed, packs with sessions
/// left, monthly plans, and recent card payments.
struct PaymentsView: View {
    @Environment(CoachStore.self) private var store
    @State private var state: Loadable<PaymentsOverview> = .loading
    @State private var pay = PayModel()
    @State private var query = ""
    @State private var adding: AddKind?
    @State private var toast: Toast?

    enum AddKind: String, Identifiable { case line, plan; var id: String { rawValue } }

    var body: some View {
        Group {
            switch state {
            case .loading: ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .failed(let m): LoadFailed(message: m) { await load() }
            case .loaded(let o): content(o)
            }
        }
        .navigationTitle("Payments")
        .searchable(text: $query, prompt: "Search players")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button { adding = .line } label: { Label("Pack or invoice", systemImage: "doc.text") }
                    Button { adding = .plan } label: { Label("Monthly plan", systemImage: "calendar") }
                } label: { Image(systemName: "plus") }
                .accessibilityLabel("Add")
            }
        }
        .sheet(item: $adding) { kind in
            Group {
                switch kind {
                case .line: PaymentLineForm(line: nil, packages: state.value?.packages ?? []) { t in toast = Toast(text: t); Task { await load() } }
                case .plan: MembershipForm(plan: nil) { t in toast = Toast(text: t); Task { await load() } }
                }
            }
            .environment(store)
        }
        .toast($toast)
        .task { await load() }
        .refreshable { await load() }
        .onChange(of: store.changes) { _, _ in Task { await load() } }
    }

    private func content(_ o: PaymentsOverview) -> some View {
        List {
            Section {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                    tile(Fmt.money(o.totals.earnedPennies), "Earned in \(monthName(o.month))", .green)
                    tile(Fmt.money(o.totals.outstandingPennies), "Outstanding", o.totals.outstandingPennies > 0 ? .orange : .secondary)
                    tile("\(o.totals.activePacks)", "Active packs", .accentColor)
                    tile("\(o.totals.expiringPacks)", "Expiring soon", o.totals.expiringPacks > 0 ? .orange : .secondary)
                }
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets())
            }

            if !o.memberships.isEmpty {
                Section {
                    ForEach(o.memberships.filter { matches($0.playerName) }) { m in
                        NavigationLink { MembershipView(plan: m, pay: pay) { await load() } } label: {
                            VStack(alignment: .leading, spacing: 3) {
                                HStack {
                                    Text(m.playerName).font(.body.weight(.semibold))
                                    Spacer()
                                    Text(Fmt.money(m.amountPennies)).font(.subheadline.weight(.semibold)).monospacedDigit()
                                }
                                Text("\(m.name) · \(m.label)").font(.subheadline).foregroundStyle(.secondary)
                                if m.thisMonth != "—" { Text("This month: \(m.thisMonth)").font(.caption).foregroundStyle(m.thisMonth == "Failed" ? Color.red : Color.secondary) }
                            }
                        }
                    }
                } header: {
                    Text("Monthly plans")
                } footer: {
                    Text("\(Fmt.money(o.totals.monthlyPennies)) a month from running plans\(o.totals.waitingToAgree > 0 ? " · \(o.totals.waitingToAgree) waiting to agree" : "").")
                }
            }

            let byPlayer = Dictionary(grouping: o.lines.filter { matches($0.playerName) }, by: \.playerName)
            let names = byPlayer.keys.sorted { a, b in
                let oa = byPlayer[a]!.reduce(0) { $0 + $1.owedPennies }, ob = byPlayer[b]!.reduce(0) { $0 + $1.owedPennies }
                return oa != ob ? oa > ob : a.localizedCaseInsensitiveCompare(b) == .orderedAscending
            }
            Section("Packs & invoices") {
                if names.isEmpty { Text("Nothing here yet. Add a pack or invoice with +.").foregroundStyle(.secondary) }
                ForEach(names, id: \.self) { name in
                    let lines = byPlayer[name]!
                    let owed = lines.reduce(0) { $0 + $1.owedPennies }
                    DisclosureGroup {
                        ForEach(lines) { l in
                            NavigationLink { PaymentLineView(line: l, packages: o.packages, pay: pay) { await load() } } label: { lineRow(l) }
                        }
                    } label: {
                        HStack {
                            Text(name).font(.body.weight(.semibold))
                            Spacer()
                            if owed > 0 { Text("Owes \(Fmt.money(owed))").font(.subheadline.weight(.semibold)).foregroundStyle(.orange) }
                            else { Text("\(lines.count) line\(lines.count == 1 ? "" : "s")").font(.caption).foregroundStyle(.secondary) }
                        }
                    }
                }
            }

            let recent = (pay.cards?.charges ?? []).filter { $0.status != "pending" }.prefix(8)
            if !recent.isEmpty {
                Section("Recent card payments") {
                    ForEach(Array(recent)) { c in ChargeRow(charge: c, name: playerName(c.playerId)) { await pay.load() } }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private func lineRow(_ l: PaymentsOverview.Line) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Text(l.item).font(.subheadline.weight(.semibold))
                Spacer()
                if let a = l.amountPennies { Text(Fmt.money(a)).font(.subheadline).monospacedDigit() }
            }
            HStack(spacing: 6) {
                Pill(text: l.statusLabel, tint: tint(l.status))
                if l.pack, let t = l.sessionsTotal { Text("\(l.used)/\(t) used").font(.caption).foregroundStyle(.secondary) }
                if let r = l.renewsDate ?? l.dueDate { Text((l.renewsDate != nil ? "Renews " : "Due ") + Fmt.dayShort(r)).font(.caption).foregroundStyle(.secondary) }
            }
        }
    }

    private func tile(_ value: String, _ label: String, _ tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value).font(.title3.weight(.bold)).monospacedDigit().foregroundStyle(tint)
            Text(label).font(.caption).foregroundStyle(.secondary).lineLimit(1)
        }
        .frame(maxWidth: .infinity, minHeight: 62, alignment: .leading)
        .padding(.horizontal, 12)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func tint(_ status: String) -> Color {
        switch status {
        case "active", "settled": return .green
        case "expiring", "due": return .orange
        case "overdue": return .red
        default: return .secondary
        }
    }

    private func monthName(_ ym: String) -> String { Fmt.day(ym + "-01")?.formatted(.dateTime.month(.wide)) ?? ym }
    private func matches(_ name: String) -> Bool { query.isEmpty || name.localizedCaseInsensitiveContains(query) }
    private func playerName(_ id: String?) -> String { store.player(id)?.name ?? "Player" }

    private func load() async {
        async let cards: Void = pay.load()
        do { state = .loaded(try await API.shared.get("/api/app/v1/coach/payments")) }
        catch { if state.value == nil { state = .failed(error.localizedDescription) } }
        _ = await cards
    }
}

/// A card payment, with a full refund for one that went through.
struct ChargeRow: View {
    let charge: PayCards.Charge
    let name: String
    let changed: () async -> Void
    @State private var toast: Toast?

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(.subheadline.weight(.semibold))
                Text([kind, charge.createdAt.map { Fmt.when($0) }].compactMap { $0 }.joined(separator: " · ")).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(Fmt.money(charge.amountPennies ?? 0)).font(.subheadline).monospacedDigit()
                Text(state).font(.caption).foregroundStyle(charge.status == "failed" ? Color.red : Color.secondary)
            }
        }
        .swipeActions {
            if charge.status == "paid" {
                Button("Refund") { Task { await refund() } }.tint(.orange)
            }
        }
        .toast($toast)
    }

    private var kind: String? {
        switch charge.kind {
        case "lesson": return "Lesson"; case "late_cancel": return "Late cancellation"; case "no_show": return "No-show"
        case "group": return "Group"; case "membership": return "Monthly plan"; default: return "Payment"
        }
    }
    private var state: String {
        switch charge.status {
        case "paid": return "Paid"; case "processing": return "Direct Debit, on its way"; case "refunded": return "Refunded"
        case "failed": return "Failed"; case "charging": return "Taking it now"; default: return charge.status ?? ""
        }
    }

    private func refund() async {
        struct Body: Encodable { let refund: String }
        do {
            let r: ChargeResult = try await API.shared.request("POST", "/api/coach/pay/charge", body: Body(refund: charge.id), lenient: true)
            if r.ok == false { toast = Toast(text: r.error ?? "That refund didn't go through.", isError: true); return }
            toast = Toast(text: "Refunded \(Fmt.money(charge.amountPennies ?? 0)). Mark the line as not owed if it was an invoice.")
            await changed()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// One pack or invoice: mark it paid, collect it by card or link, edit or delete.
struct PaymentLineView: View {
    @Environment(CoachStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State var line: PaymentsOverview.Line
    let packages: [PaymentsOverview.Package]
    let pay: PayModel
    let changed: () async -> Void
    @State private var editing = false
    @State private var link: URL?
    @State private var toast: Toast?

    private var card: PayCards.Method? { pay.cards?.card(for: line.playerId) }

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text(line.item).font(.title3.bold())
                    Text(line.playerName).foregroundStyle(.secondary)
                    Pill(text: line.statusLabel, tint: .secondary)
                }
                .padding(.vertical, 4)
                if let a = line.amountPennies { LabeledContent("Amount", value: Fmt.money(a)) }
                if line.pack, let t = line.sessionsTotal {
                    VStack(alignment: .leading, spacing: 6) {
                        LabeledContent("Sessions", value: "\(line.used) of \(t) used")
                        ProgressView(value: Double(min(line.used, t)), total: Double(max(t, 1)))
                    }
                }
                if let r = line.renewsDate { LabeledContent("Renews", value: Fmt.dayLong(r)) }
                if let d = line.dueDate { LabeledContent("Due", value: Fmt.dayLong(d)) }
                if line.paid { LabeledContent("Paid", value: line.paidAt.map { Fmt.moment($0) } ?? "Yes") }
            }

            if line.owedPennies > 0 || line.paid {
                Section {
                    Button { Task { await togglePaid() } } label: {
                        Label(line.paid ? "Mark as not paid" : "Mark as paid", systemImage: line.paid ? "arrow.uturn.backward.circle" : "checkmark.circle")
                    }
                    if line.owedPennies > 0, line.playerId != nil {
                        if let card {
                            ConfirmButton(title: "Take \(Fmt.money(line.owedPennies)) from \(card.brand?.capitalized ?? "card") •••• \(card.last4 ?? "")", icon: "creditcard", prompt: "Take \(Fmt.money(line.owedPennies)) for \(line.item) now?", confirm: "Take payment") { await collect() }
                        }
                        Button { Task { await makeLink() } } label: { Label("Make a payment link", systemImage: "link") }
                        if let link {
                            ShareLink(item: link, subject: Text(line.item), message: Text("Here's the link to pay for \(line.item).")) {
                                Label("Share the payment link", systemImage: "square.and.arrow.up")
                            }
                        }
                    }
                } header: { Text("Payment") }
            }

            Section {
                Button { editing = true } label: { Label("Edit", systemImage: "pencil") }
                ConfirmButton(title: "Delete", icon: "trash", prompt: "Delete \(line.item) for \(line.playerName)?", confirm: "Delete", destructive: true) { await remove() }
            }
        }
        .navigationTitle(line.item)
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .sheet(isPresented: $editing) {
            PaymentLineForm(line: line, packages: packages) { t in toast = Toast(text: t); Task { await changed(); dismiss() } }
                .environment(store)
        }
    }

    private func togglePaid() async {
        var row: RowValues = ["paid": .bool(!line.paid), "paid_at": line.paid ? .null : .string(ISO8601DateFormatter().string(from: Date()))]
        if !line.paid && line.storedStatus == "overdue" { row["status"] = .string("active") }
        do {
            let _: IdRow = try await Rows.update("coach_payments", id: line.id, row)
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            await changed()
            dismiss()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func collect() async {
        guard let pid = line.playerId else { return }
        struct Body: Encodable { let paymentId: String; let playerId: String }
        do {
            let r: ChargeResult = try await API.shared.request("POST", "/api/coach/pay/charge", body: Body(paymentId: line.id, playerId: pid), lenient: true)
            if r.ok == true {
                toast = Toast(text: r.status == "processing" ? "Taken by Direct Debit — it arrives in about 3 working days." : "Paid.")
                await pay.load(); await changed()
            } else { toast = Toast(text: r.error ?? "That didn't go through.", isError: true) }
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func makeLink() async {
        struct Body: Encodable { let amount: Double; let description: String; let player_name: String; let payment_id: String; let returnPath: String }
        struct Answer: Decodable { let url: String? }
        do {
            let r: Answer = try await API.shared.post("/api/coach/pay/checkout", body: Body(amount: Double(line.owedPennies) / 100, description: "\(line.item) · \(line.playerName)", player_name: line.playerName, payment_id: line.id, returnPath: "/"))
            link = r.url.flatMap(URL.init(string:))
            if link != nil { toast = Toast(text: "Payment link ready — share it below.") }
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func remove() async {
        do { try await Rows.delete("coach_payments", id: line.id); await changed(); dismiss() }
        catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// Add or edit a pack or an invoice.
struct PaymentLineForm: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(CoachStore.self) private var store
    let line: PaymentsOverview.Line?
    let packages: [PaymentsOverview.Package]
    let saved: (String) -> Void

    @State private var playerId: String?
    @State private var newName = ""
    @State private var item = ""
    @State private var amount = ""
    @State private var isPack = true
    @State private var sessions = 10
    @State private var hasRenews = false
    @State private var renews = Calendar.current.date(byAdding: .month, value: 3, to: Date()) ?? Date()
    @State private var hasDue = false
    @State private var due = Date()
    @State private var chase = false
    @State private var error: String?
    @State private var saving = false
    @State private var ready = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if line == nil { PlayerPicker(playerId: $playerId, newName: $newName, allowNew: false) }
                    else { LabeledContent("Player", value: line!.playerName) }
                    if line == nil && !packages.isEmpty {
                        Menu {
                            ForEach(packages) { k in
                                Button("\(k.name)\(k.pricePennies.map { " · \(Fmt.money($0))" } ?? "")") {
                                    item = k.name; amount = Fmt.poundsText(k.pricePennies)
                                    if let s = k.sessions, s > 0 { isPack = true; sessions = s } else { isPack = false }
                                }
                            }
                        } label: { Label("Choose from your packages", systemImage: "list.bullet") }
                    }
                    TextField("What it's for (e.g. 10-lesson pack)", text: $item)
                    TextField("Amount (£)", text: $amount).keyboardType(.decimalPad)
                }
                Section {
                    Toggle("It's a pack of lessons", isOn: $isPack.animation())
                    if isPack {
                        Stepper(value: $sessions, in: 1...500) { LabeledContent("Lessons", value: "\(sessions)") }
                        Toggle("Renews or expires", isOn: $hasRenews.animation())
                        if hasRenews { DatePicker("On", selection: $renews, displayedComponents: .date) }
                    }
                    Toggle("Has a due date", isOn: $hasDue.animation())
                    if hasDue { DatePicker("Due", selection: $due, displayedComponents: .date) }
                    Toggle("Chase this (mark overdue)", isOn: $chase)
                }
                .environment(\.timeZone, Fmt.london)
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle(line == nil ? "New pack or invoice" : "Edit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if saving { ProgressView() } else { Button("Save") { Task { await save() } }.disabled(item.trimmingCharacters(in: .whitespaces).isEmpty || (line == nil && playerId == nil)) }
                }
            }
            .task { await store.load(); fill() }
        }
    }

    private func fill() {
        guard !ready, let l = line else { ready = true; return }
        ready = true
        item = l.item; amount = Fmt.poundsText(l.amountPennies)
        isPack = l.pack; sessions = l.sessionsTotal ?? 10
        if let r = l.renewsDate.flatMap(Fmt.day) { hasRenews = true; renews = r }
        if let d = l.dueDate.flatMap(Fmt.day) { hasDue = true; due = d }
        chase = l.storedStatus == "overdue"
    }

    private func save() async {
        error = nil
        var pounds: Double? = nil
        if !amount.trimmingCharacters(in: .whitespaces).isEmpty {
            guard let p = Fmt.pennies(amount), p <= 10_000_000 else { error = "Enter the amount in pounds, like 120 or 45.50."; return }
            pounds = Double(p) / 100
        }
        saving = true
        defer { saving = false }
        var row: RowValues = [
            "item": .string(item.trimmingCharacters(in: .whitespaces)),
            "amount": pounds.map { .double($0) } ?? .null,
            "sessions_total": isPack ? .int(sessions) : .null,
            "renews_date": isPack && hasRenews ? .string(Fmt.iso(renews)) : .null,
            "due_date": hasDue ? .string(Fmt.iso(due)) : .null,
            "status": .string(chase ? "overdue" : "active"),
        ]
        do {
            if let l = line {
                let _: IdRow = try await Rows.update("coach_payments", id: l.id, row)
            } else {
                row["player_id"] = playerId.map { .string($0) } ?? .null
                row["player_name"] = .text(store.player(playerId)?.name)
                let _: IdRow = try await Rows.insert("coach_payments", row)
            }
            store.saved()
            saved("Saved.")
            dismiss()
        } catch { self.error = error.localizedDescription }
    }
}

/// A monthly plan: how it stands, this month's bill, and pause / resume / end.
struct MembershipView: View {
    @Environment(CoachStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let plan: PaymentsOverview.Membership
    let pay: PayModel
    let changed: () async -> Void
    @State private var editing = false
    @State private var toast: Toast?

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text(plan.playerName).font(.title3.bold())
                    Text(plan.name).foregroundStyle(.secondary)
                    Pill(text: plan.label, tint: plan.label == "Running" ? .green : .orange)
                }
                .padding(.vertical, 4)
                LabeledContent("Plan", value: plan.words)
                LabeledContent("Covers", value: plan.coversWords)
                if let n = plan.nextBill { LabeledContent("Next payment", value: n.count == 10 ? Fmt.dayLong(n) : n) }
                LabeledContent("This month", value: plan.thisMonth)
            }
            Section {
                if plan.canTakeNow {
                    ConfirmButton(title: "Take this month's \(Fmt.money(plan.amountPennies)) now", icon: "creditcard", prompt: "Take \(Fmt.money(plan.amountPennies)) from \(plan.playerName)'s card now?", confirm: "Take payment") { await takeNow() }
                }
                if !plan.agreed || !plan.hasCard, let pid = plan.playerId {
                    Button { Task { await sendWelcome(pid) } } label: {
                        Label(plan.agreed ? "Send the link to add a card" : "Send the link to agree", systemImage: "paperplane")
                    }
                }
                if plan.status == "active" { Button { Task { await set("paused") } } label: { Label("Pause", systemImage: "pause.circle") } }
                if plan.status == "paused" { Button { Task { await set("active") } } label: { Label("Resume", systemImage: "play.circle") } }
                Button { editing = true } label: { Label("Edit", systemImage: "pencil") }
                ConfirmButton(title: "End this plan", icon: "stop.circle", prompt: "End \(plan.playerName)'s plan? No more monthly payments will be taken.", confirm: "End plan", destructive: true) { await set("ended") }
            } footer: { Text("Changing the amount or the day means they agree again.") }
        }
        .navigationTitle("Monthly plan")
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .sheet(isPresented: $editing) {
            MembershipForm(plan: plan) { t in toast = Toast(text: t); Task { await changed(); dismiss() } }.environment(store)
        }
    }

    private func set(_ status: String) async {
        do {
            let _: IdRow = try await Rows.update("coach_memberships", id: plan.id, ["status": .string(status)])
            await changed(); dismiss()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func takeNow() async {
        struct Body: Encodable { let action = "charge-now"; let id: String }
        struct Answer: Decodable { let ok: Bool?; let status: String?; let error: String? }
        do {
            let r: Answer = try await API.shared.request("POST", "/api/coach/memberships", body: Body(id: plan.id), lenient: true)
            if r.ok == true { toast = Toast(text: r.status == "processing" ? "Taken by Direct Debit." : "Paid."); await changed() }
            else { toast = Toast(text: r.error ?? "That didn't go through.", isError: true) }
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func sendWelcome(_ playerId: String) async {
        struct Body: Encodable { let playerIds: [String]; let version = "short"; let send = true }
        struct Answer: Decodable { let sent: Int?; let noEmail: [String]?; let failed: [String]? }
        do {
            let r: Answer = try await API.shared.post("/api/coach/welcome", body: Body(playerIds: [playerId]))
            toast = (r.sent ?? 0) > 0 ? Toast(text: "Sent.") : Toast(text: (r.noEmail?.isEmpty == false) ? "There's no email address for them yet." : "That didn't send.", isError: true)
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// Offer or change a monthly plan.
struct MembershipForm: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(CoachStore.self) private var store
    let plan: PaymentsOverview.Membership?
    let saved: (String) -> Void

    @State private var playerId: String?
    @State private var newName = ""
    @State private var name = "Monthly coaching"
    @State private var amount = ""
    @State private var day = 1
    @State private var starts = ""
    @State private var covers = "lessons"
    @State private var groupId: String?
    @State private var groups: [GroupRecord] = []
    @State private var error: String?
    @State private var saving = false

    private var months: [String] {
        let cal = Calendar(identifier: .gregorian)
        return (0...5).compactMap { cal.date(byAdding: .month, value: $0, to: Date()) }.map { String(Fmt.iso($0).prefix(7)) }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if plan == nil { PlayerPicker(playerId: $playerId, newName: $newName, allowNew: false) }
                    else { LabeledContent("Player", value: plan!.playerName) }
                    TextField("Name (e.g. Weekly private)", text: $name)
                    TextField("Amount a month (£)", text: $amount).keyboardType(.decimalPad)
                    Picker("Taken on the", selection: $day) { ForEach(1...28, id: \.self) { Text(ordinal($0)).tag($0) } }
                    Picker("Starting", selection: $starts) {
                        ForEach(months, id: \.self) { m in Text(Fmt.day(m + "-01")?.formatted(.dateTime.month(.wide).year()) ?? m).tag(m) }
                    }
                }
                Section("Covers") {
                    Picker("Covers", selection: $covers) {
                        Text("Private lessons").tag("lessons")
                        Text("A weekly group").tag("group")
                        Text("Nothing (a subscription)").tag("none")
                    }
                    .pickerStyle(.inline).labelsHidden()
                    if covers == "group" {
                        Picker("Group", selection: $groupId) {
                            Text("Choose…").tag(String?.none)
                            ForEach(groups) { Text($0.name).tag(Optional($0.id)) }
                        }
                    }
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle(plan == nil ? "New monthly plan" : "Edit plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if saving { ProgressView() } else { Button("Save") { Task { await save() } }.disabled(plan == nil && playerId == nil) }
                }
            }
            .task {
                await store.load()
                groups = (try? await Rows.list("coach_groups", order: "name.asc")) ?? []
                if let p = plan {
                    name = p.name; amount = Fmt.poundsText(p.amountPennies); day = p.dayOfMonth
                    starts = p.startsMonth ?? months[0]; covers = p.covers ?? "lessons"; groupId = p.groupId
                } else if starts.isEmpty { starts = months.count > 1 ? months[1] : months[0] }
            }
        }
    }

    private func ordinal(_ n: Int) -> String {
        let suffix = (11...13).contains(n % 100) ? "th" : ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][n % 10]
        return "\(n)\(suffix)"
    }

    private func save() async {
        error = nil
        guard let pennies = Fmt.pennies(amount), (50...200_000).contains(pennies) else { error = "Enter an amount between £0.50 and £2,000."; return }
        let n = name.trimmingCharacters(in: .whitespaces)
        guard !n.isEmpty, n.count <= 80 else { error = "Give the plan a short name."; return }
        if covers == "group" && groupId == nil { error = "Choose the group it covers."; return }
        saving = true
        defer { saving = false }
        var row: RowValues = [
            "name": .string(n), "amount_pennies": .int(pennies), "day_of_month": .int(day), "starts_month": .string(starts),
            "covers": .string(covers), "group_id": covers == "group" ? groupId.map { .string($0) } ?? .null : .null,
        ]
        do {
            if let p = plan {
                let _: IdRow = try await Rows.update("coach_memberships", id: p.id, row)
                saved(p.amountPennies != pennies || p.dayOfMonth != day ? "Saved. They'll be asked to agree to the change." : "Saved.")
            } else {
                row["player_id"] = playerId.map { .string($0) } ?? .null
                row["status"] = .string("offered")
                let _: IdRow = try await Rows.insert("coach_memberships", row)
                saved("Plan offered. Send them the link to agree from the plan.")
            }
            store.saved()
            dismiss()
        } catch { self.error = error.localizedDescription }
    }
}
