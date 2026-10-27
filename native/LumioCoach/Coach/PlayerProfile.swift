import SwiftUI
import PhotosUI

// The full player profile: details and consents, notes, attendance, the family
// app, their card, and adding or removing a player.

enum PlayerOptions {
    static let categories = ["Junior", "Performance", "Adult"]
    static let levels = ["Red ball (5–8)", "Orange ball (8–10)", "Green ball (9–11)", "Yellow ball — beginner", "Yellow ball — intermediate", "Yellow ball — advanced", "Performance", "Adult — beginner", "Adult — improver", "Adult — intermediate", "Adult — advanced", "Social / cardio"]
    static let paymentMethods = ["Direct debit", "Standing order", "Bank transfer", "Card", "Cash", "Invoice", "Childcare vouchers"]
    static let rateReasons = ["Legacy rate", "Regular", "Family", "Friend", "Introductory"]
}

/// Add a player, or edit one — the website's player form.
struct PlayerEditView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(CoachStore.self) private var store
    let player: PlayerProfile?
    let saved: (String?) -> Void

    @State private var p = Draft()
    @State private var error: String?
    @State private var saving = false
    @State private var ready = false
    @State private var deleteInfo: String?
    @State private var confirmingDelete = false

    struct Draft {
        var name = "", category = "", age = "", parentName = "", parentEmail = "", email = "", phone = ""
        var stage = "", level = "", paymentMethod = "", goal = "", notes = "", medical = ""
        var consentData = false, consentPhoto = false, consentMedical = false, consentWearable = false
        var consentBy = "", hasConsentDate = false, consentDate = Date()
        var rate = "", rateReason = ""
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Name", text: $p.name).textInputAutocapitalization(.words)
                    Picker("Category", selection: $p.category) { Text("—").tag(""); ForEach(PlayerOptions.categories, id: \.self) { Text($0).tag($0) } }
                    TextField("Age", text: $p.age).keyboardType(.numberPad)
                    Picker("Level", selection: $p.level) {
                        Text("—").tag("")
                        ForEach(levelChoices, id: \.self) { Text($0).tag($0) }
                    }
                    Picker(store.setup?.features?.racket == true ? "Racket" : "Colour", selection: $p.stage) {
                        Text("Not started").tag("")
                        ForEach(Racket.stages) { Text($0.name).tag($0.id) }
                    }
                }
                Section("Contact") {
                    TextField("Email", text: $p.email).keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                    TextField("Phone", text: $p.phone).keyboardType(.phonePad)
                    TextField("Parent's name", text: $p.parentName).textInputAutocapitalization(.words)
                    TextField("Parent's email", text: $p.parentEmail).keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                }
                Section("About them") {
                    TextField("Goal", text: $p.goal, axis: .vertical).lineLimit(1...3)
                    TextField("Notes", text: $p.notes, axis: .vertical).lineLimit(1...5)
                    TextField("Medical notes", text: $p.medical, axis: .vertical).lineLimit(1...4)
                }
                Section {
                    Toggle("Keep their details", isOn: $p.consentData)
                    Toggle("Photos and video", isOn: $p.consentPhoto)
                    Toggle("First aid and medical", isOn: $p.consentMedical)
                    Toggle("Wearable tracking", isOn: $p.consentWearable)
                    TextField("Given by", text: $p.consentBy)
                    Toggle("Date given", isOn: $p.hasConsentDate.animation())
                    if p.hasConsentDate { DatePicker("On", selection: $p.consentDate, in: ...Date(), displayedComponents: .date) }
                } header: { Text("Consent") }
                Section {
                    Picker("Pays by", selection: $p.paymentMethod) { Text("—").tag(""); ForEach(paymentChoices, id: \.self) { Text($0).tag($0) } }
                    TextField("Their own hourly rate (£, optional)", text: $p.rate).keyboardType(.decimalPad)
                    if !p.rate.isEmpty {
                        Picker("Why", selection: $p.rateReason) { Text("—").tag(""); ForEach(PlayerOptions.rateReasons, id: \.self) { Text($0).tag($0) } }
                    }
                } header: { Text("Paying") }

                if let error { Section { Text(error).foregroundStyle(.red) } }

                if player != nil {
                    Section {
                        Button(role: .destructive) { Task { await askDelete() } } label: { Label("Delete this player", systemImage: "trash") }
                    } footer: { Text("Deleting erases them. Payments and paid camp places are kept as \u{201C}Removed player\u{201D}.") }
                }
            }
            .navigationTitle(player == nil ? "New player" : "Edit player")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if saving { ProgressView() } else { Button("Save") { Task { await save() } }.disabled(p.name.trimmingCharacters(in: .whitespaces).isEmpty) }
                }
            }
            .confirmationDialog("Delete \(player?.name ?? "this player")?", isPresented: $confirmingDelete, titleVisibility: .visible) {
                Button("Delete", role: .destructive) { Task { await delete() } }
                Button("Keep them", role: .cancel) {}
            } message: { Text(deleteInfo ?? "") }
            .onAppear { fill() }
        }
    }

    private var levelChoices: [String] { PlayerOptions.levels + ((!p.level.isEmpty && !PlayerOptions.levels.contains(p.level)) ? [p.level] : []) }
    private var paymentChoices: [String] { PlayerOptions.paymentMethods + ((!p.paymentMethod.isEmpty && !PlayerOptions.paymentMethods.contains(p.paymentMethod)) ? [p.paymentMethod] : []) }

    private func fill() {
        guard !ready else { return }
        ready = true
        guard let x = player else { return }
        p.name = x.name; p.category = x.category ?? ""; p.age = x.age.map(String.init) ?? ""
        p.parentName = x.parentName ?? ""; p.parentEmail = x.parentEmail ?? ""; p.email = x.email ?? ""; p.phone = x.phone ?? ""
        p.stage = x.racketStage ?? ""; p.level = x.level ?? ""; p.paymentMethod = x.paymentMethod ?? ""
        p.goal = x.goal ?? ""; p.notes = x.notes ?? ""; p.medical = x.medicalNotes ?? ""
        p.consentData = x.consentData ?? false; p.consentPhoto = x.consentPhoto ?? false
        p.consentMedical = x.consentMedical ?? false; p.consentWearable = x.consentWearable ?? false
        p.consentBy = x.consentBy ?? ""
        if let d = x.consentDate.flatMap(Fmt.day) { p.hasConsentDate = true; p.consentDate = d }
        p.rate = Fmt.poundsText(x.ratePennies); p.rateReason = x.rateReason ?? ""
    }

    private static let emailRule = #"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"#

    private func problem() -> String? {
        let name = p.name.split(whereSeparator: \.isWhitespace).joined(separator: " ")
        if name.isEmpty || name.count > 80 { return "Enter their name (up to 80 letters)." }
        if !p.age.isEmpty, Int(p.age).map({ !(1...120).contains($0) }) ?? true { return "Age should be a number from 1 to 120." }
        for (label, e) in [("Email", p.email), ("Parent's email", p.parentEmail)] where !e.isEmpty {
            if e.range(of: Self.emailRule, options: .regularExpression) == nil { return "\(label) doesn't look like an email address." }
        }
        if !p.phone.isEmpty {
            let digits = p.phone.filter(\.isNumber).count
            if p.phone.range(of: #"^[+\d][\d\s().-]*$"#, options: .regularExpression) == nil || !(7...15).contains(digits) { return "Check the phone number." }
        }
        if !p.rate.isEmpty, (Fmt.pennies(p.rate) ?? 1_000_000) > 100_000 { return "Their rate should be up to £1,000 an hour." }
        return nil
    }

    private func save() async {
        error = problem()
        guard error == nil else { return }
        saving = true
        defer { saving = false }
        let rate = p.rate.isEmpty ? nil : Fmt.pennies(p.rate)
        let row: RowValues = [
            "name": .string(p.name.split(whereSeparator: \.isWhitespace).joined(separator: " ")),
            "category": .text(p.category), "age": .number(Int(p.age)),
            "parent_name": .text(p.parentName), "parent_email": .text(p.parentEmail.lowercased()),
            "email": .text(p.email.lowercased()), "phone": .text(p.phone),
            "racket_stage": .text(p.stage), "level": .text(p.level), "payment_method": .text(p.paymentMethod),
            "goal": .text(p.goal), "notes": .text(p.notes), "medical_notes": .text(p.medical),
            "consent_data": .bool(p.consentData), "consent_photo": .bool(p.consentPhoto),
            "consent_medical": .bool(p.consentMedical), "consent_wearable": .bool(p.consentWearable),
            "consent_by": .text(p.consentBy), "consent_date": p.hasConsentDate ? .string(Fmt.iso(p.consentDate)) : .null,
            "rate_pennies": .number(rate), "rate_reason": rate == nil ? .null : .text(p.rateReason),
        ]
        do {
            if let x = player {
                let _: IdRow = try await Rows.update("coach_players", id: x.id, row)
                saved(nil)
            } else {
                let added: IdRow = try await Rows.insert("coach_players", row)
                saved(added.id)
            }
            await store.load(force: true)
            store.saved()
            dismiss()
        } catch { self.error = error.localizedDescription }
    }

    private struct DeleteCheck: Decodable {
        let has: Has?
        struct Has: Decodable { let familyLogins: Int?; let upcomingBookings: Int?; let lessons: Int?; let unpaidPayments: Int?; let campPlaces: Int?; let recordings: Int?; let messages: Int? }
    }

    private func askDelete() async {
        guard let x = player else { return }
        let c: DeleteCheck? = try? await API.shared.get("/api/coach/players/delete", query: ["id": x.id])
        var parts: [String] = []
        if let h = c?.has {
            if let n = h.upcomingBookings, n > 0 { parts.append("\(n) upcoming lesson\(n == 1 ? "" : "s") will be removed") }
            if let n = h.lessons, n > 0 { parts.append("\(n) lesson summar\(n == 1 ? "y" : "ies")") }
            if let n = h.recordings, n > 0 { parts.append("\(n) recording\(n == 1 ? "" : "s")") }
            if let n = h.familyLogins, n > 0 { parts.append("their family loses access to the app") }
            if let n = h.unpaidPayments, n > 0 { parts.append("\(n) unpaid payment\(n == 1 ? "" : "s") are kept as \u{201C}Removed player\u{201D}") }
        }
        deleteInfo = parts.isEmpty ? "This can't be undone." : parts.joined(separator: "; ").capitalizedFirst + ". This can't be undone."
        confirmingDelete = true
    }

    private func delete() async {
        guard let x = player else { return }
        struct Body: Encodable { let id: String }
        do {
            let _: Empty = try await API.shared.post("/api/coach/players/delete", body: Body(id: x.id))
            await store.load(force: true)
            store.saved()
            saved("deleted")
            dismiss()
        } catch { self.error = error.localizedDescription }
    }
}

extension String {
    var capitalizedFirst: String { prefix(1).uppercased() + dropFirst() }
}

/// Private notes about a player — family, school, interests — never shown to the family.
struct NotesView: View {
    let player: PlayerProfile
    @State private var notes: [NoteRecord] = []
    @State private var kind = "family"
    @State private var text = ""
    @State private var toast: Toast?

    var body: some View {
        List {
            Section {
                Picker("About", selection: $kind) { ForEach(NoteRecord.kinds, id: \.0) { Text($0.1).tag($0.0) } }
                TextField(NoteRecord.kinds.first { $0.0 == kind }?.2 ?? "Note", text: $text, axis: .vertical).lineLimit(1...6)
                Button("Add note") { Task { await add() } }.disabled(text.trimmingCharacters(in: .whitespaces).isEmpty)
            } footer: {
                if kind == "health" && player.consentMedical != true { Text("Health notes need their medical consent first.") }
            }
            Section {
                if notes.isEmpty { Text("Nothing yet. Notes are just for you — the family never sees them.").foregroundStyle(.secondary) }
                ForEach(notes) { n in
                    VStack(alignment: .leading, spacing: 3) {
                        HStack {
                            if n.pinned == true { Image(systemName: "pin.fill").foregroundStyle(.orange).font(.caption) }
                            Text(NoteRecord.label(n.kind)).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                            Spacer()
                            Text(n.notedOn.map(Fmt.dayShort) ?? "").font(.caption).foregroundStyle(.secondary)
                        }
                        Text(n.text)
                    }
                    .swipeActions(edge: .leading) {
                        Button(n.pinned == true ? "Unpin" : "Pin") { Task { await pin(n) } }.tint(.orange)
                    }
                    .swipeActions(edge: .trailing) {
                        Button("Delete", role: .destructive) { Task { await remove(n) } }
                    }
                }
            }
        }
        .navigationTitle("Notes")
        .toast($toast)
        .task { await load() }
    }

    private func load() async {
        let all: [NoteRecord] = (try? await Rows.list("coach_player_notes", [("player_id", "eq.\(player.id)")], order: "noted_on.desc")) ?? []
        notes = all.sorted { ($0.pinned == true ? 0 : 1, $1.notedOn ?? "") < ($1.pinned == true ? 0 : 1, $0.notedOn ?? "") }
    }

    private func add() async {
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (1...1000).contains(t.count) else { toast = Toast(text: "Keep a note under 1,000 characters.", isError: true); return }
        var row: RowValues = ["player_id": .string(player.id), "kind": .string(kind), "text": .string(t), "noted_on": .string(Fmt.todayISO)]
        if let s = player.staffId { row["staff_id"] = .string(s) }
        do {
            let _: NoteRecord = try await Rows.insert("coach_player_notes", row)
            text = ""
            await load()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func pin(_ n: NoteRecord) async {
        let _: NoteRecord? = try? await Rows.update("coach_player_notes", id: n.id, ["pinned": .bool(n.pinned != true)])
        await load()
    }

    private func remove(_ n: NoteRecord) async {
        try? await Rows.delete("coach_player_notes", id: n.id)
        await load()
    }
}

/// Who came, and marking a day present or absent.
struct AttendanceView: View {
    let player: PlayerProfile
    @State private var rows: [AttendanceRecord] = []
    @State private var day = Date()
    @State private var toast: Toast?

    var body: some View {
        List {
            Section {
                DatePicker("Day", selection: $day, in: ...Date(), displayedComponents: .date).environment(\.timeZone, Fmt.london)
                HStack(spacing: 10) {
                    BusyButton(title: "Present", systemImage: "checkmark") { await mark(true) }
                    BusyButton(title: "Absent", systemImage: "xmark", prominent: false) { await mark(false) }
                }
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
            }
            Section {
                ForEach(rows) { r in
                    HStack {
                        Text(r.sessionDate.map(Fmt.dayLong) ?? "")
                        Spacer()
                        Text(r.present == false ? "Absent" : "Present").foregroundStyle(r.present == false ? Color.red : Color.green)
                    }
                    .swipeActions { Button("Delete", role: .destructive) { Task { await remove(r) } } }
                }
            } header: {
                Text(summary)
            }
        }
        .navigationTitle("Attendance")
        .toast($toast)
        .task { await load() }
    }

    /// Always a Text (never an empty header), so it redraws when the last day goes.
    private var summary: String {
        guard !rows.isEmpty else { return "No days marked yet" }
        let present = rows.filter { $0.present != false }.count
        return "\(present) of \(rows.count) present · \(Int((Double(present) / Double(rows.count) * 100).rounded()))%"
    }

    private func remove(_ r: AttendanceRecord) async {
        rows.removeAll { $0.id == r.id }
        do { try await Rows.delete("coach_attendance", id: r.id) }
        catch { toast = Toast(text: error.localizedDescription, isError: true) }
        await load()
    }

    private func load() async {
        rows = (try? await Rows.list("coach_attendance", [("player_id", "eq.\(player.id)")], order: "session_date.desc", limit: 200)) ?? []
    }

    private func mark(_ present: Bool) async {
        let iso = Fmt.iso(day)
        do {
            if let r = rows.first(where: { $0.sessionDate == iso }) {
                let _: AttendanceRecord = try await Rows.update("coach_attendance", id: r.id, ["present": .bool(present)])
            } else {
                let _: AttendanceRecord = try await Rows.insert("coach_attendance", ["player_id": .string(player.id), "session_date": .string(iso), "present": .bool(present)])
            }
            UISelectionFeedbackGenerator().selectionChanged()
            await load()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// The family's access to this app: who's invited, who has signed in, invite and remove.
struct FamilyAccessView: View {
    let player: PlayerProfile
    @State private var members: [Member] = []
    @State private var loaded = false
    @State private var toast: Toast?

    struct Member: Decodable, Identifiable { let id: String; let email: String?; let role: String?; let status: String?; let signedIn: Bool?; let invitedAt: String? }

    var body: some View {
        List {
            Section {
                if loaded && members.isEmpty { Text("No one has been invited yet.").foregroundStyle(.secondary) }
                ForEach(members) { m in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(m.email ?? "").font(.body.weight(.medium))
                        Text(status(m)).font(.caption).foregroundStyle(m.status == "revoked" ? Color.red : Color.secondary)
                    }
                    .swipeActions {
                        if m.status != "revoked" { Button("Remove", role: .destructive) { Task { await revoke(m) } } }
                    }
                }
            }
            Section {
                let who = player.invitee
                if let email = who.email {
                    BusyButton(title: "Invite \(email)", systemImage: "paperplane") { await invite() }
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                } else {
                    Text("Add an email address to their profile to invite them.").foregroundStyle(.secondary)
                }
            } footer: { Text("They get an email with a link to sign in to this app and the website. Swipe to remove someone's access.") }
        }
        .navigationTitle("Family app")
        .toast($toast)
        .task { await load() }
    }

    private func status(_ m: Member) -> String {
        if m.status == "revoked" { return "Access removed" }
        let role = m.role == "student" ? "Player" : "Parent"
        return m.signedIn == true ? "\(role) · signed in" : "\(role) · invited, not signed in yet"
    }

    private func load() async {
        struct Answer: Decodable { let members: [Member]? }
        let r: Answer? = try? await API.shared.get("/api/portal/access", query: ["playerId": player.id])
        members = r?.members ?? []
        loaded = true
    }

    private func invite() async {
        let who = player.invitee
        guard let email = who.email else { return }
        struct Body: Encodable { let email: String; let role: String; let scopePlayerId: String; let name: String }
        struct Answer: Decodable { let emailed: Bool?; let reason: String? }
        do {
            let r: Answer = try await API.shared.post("/api/portal/invite", body: Body(email: email, role: who.role, scopePlayerId: player.id, name: who.name))
            toast = Toast(text: r.emailed == true ? "Invite sent to \(email)." : (r.reason ?? "They were invited a moment ago."))
            await load()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func revoke(_ m: Member) async {
        struct Body: Encodable { let memberId: String }
        do { try await API.shared.delete("/api/portal/access", body: Body(memberId: m.id)); await load() }
        catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// Their card or Direct Debit, and asking the family to save one.
struct CardOnFileSection: View {
    let playerId: String
    let pay: PayModel
    @State private var toast: Toast?

    var body: some View {
        if pay.cards?.chargesEnabled == true {
            let methods = (pay.cards?.methods ?? []).filter { $0.playerId == playerId }
            Section {
                if let m = methods.first(where: { $0.status == "active" }) {
                    Label("\(m.kind == "bacs_debit" ? "Direct Debit" : (m.brand?.capitalized ?? "Card")) •••• \(m.last4 ?? "")", systemImage: m.kind == "bacs_debit" ? "building.columns" : "creditcard")
                } else {
                    if methods.contains(where: { $0.status == "invited" }) { Text("Asked to save a card — not done yet.").foregroundStyle(.secondary) }
                    Button { Task { await invite() } } label: { Label("Ask them to save a card", systemImage: "creditcard.and.123") }
                }
            } header: { Text("Card on file") }
            .toast($toast)
        }
    }

    private func invite() async {
        struct Body: Encodable { let playerId: String; let send = true }
        struct Answer: Decodable { let sent: Bool?; let to: String? }
        do {
            let r: Answer = try await API.shared.post("/api/coach/pay/cards", body: Body(playerId: playerId))
            toast = Toast(text: r.sent == true ? "Sent to \(r.to ?? "them")." : "Link made, but there's no email to send it to.")
            await pay.load()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// Change a player's photo from the camera roll.
struct PhotoChanger: View {
    let playerId: String
    /// The coach's route, or the family's own (/api/portal/avatar).
    var endpoint = "/api/coach/avatar"
    let changed: () async -> Void
    @State private var item: PhotosPickerItem?
    @State private var busy = false
    @State private var toast: Toast?

    var body: some View {
        PhotosPicker(selection: $item, matching: .images) {
            Label(busy ? "Uploading…" : "Change photo", systemImage: "camera")
        }
        .disabled(busy)
        .onChange(of: item) { _, new in
            guard let new else { return }
            Task { await upload(new) }
        }
        .toast($toast)
    }

    private func upload(_ item: PhotosPickerItem) async {
        busy = true
        defer { busy = false; self.item = nil }
        guard let data = try? await item.loadTransferable(type: Data.self), let image = UIImage(data: data), let url = PhotoPrep.avatarDataURL(image) else {
            toast = Toast(text: "That photo couldn't be read.", isError: true); return
        }
        struct Body: Encodable { let playerId: String; let dataUrl: String }
        do {
            let _: Empty = try await API.shared.post(endpoint, body: Body(playerId: playerId, dataUrl: url))
            await changed()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}
