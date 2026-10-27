import SwiftUI

/// Add or edit a booking — the website's booking form, as an iPhone form.
/// Saving tells the family and updates the coach's calendars on the server,
/// exactly as a save on the website does.
struct BookingFormView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(CoachStore.self) private var store

    /// The booking being edited, or nil for a new one.
    let existing: BookingRecord?
    var startDate: String = Fmt.todayISO
    var startTime: String = "16:00"
    var presetPlayerId: String? = nil
    let saved: (String) -> Void

    @State private var day = Date()
    @State private var time = Date()
    @State private var mins = 60
    @State private var type = "Private"
    @State private var playerId: String?
    @State private var newName = ""
    @State private var title = ""
    @State private var venueId: String?
    @State private var courtId: String?
    @State private var courtText = ""
    @State private var coachName = ""          // "" = the head coach
    @State private var status = "confirmed"
    @State private var people = ""
    @State private var priceText = ""
    @State private var notes = ""

    @State private var ready = false
    @State private var clashes: [String] = []
    @State private var quote: Quote?
    @State private var error: String?
    @State private var saving = false

    private var setup: CoachSetup? { store.setup }
    private var iso: String { Fmt.iso(day) }
    private var hhmm: String { Fmt.hhmm(time) }
    private var camp: CoachSetup.Camp? { setup?.camp(on: iso) }
    private var who: String { playerId.flatMap { store.player($0)?.name } ?? newName.trimmingCharacters(in: .whitespaces) }
    private var courtsHere: [CoachSetup.Court] { (setup?.courts ?? []).filter { venueId == nil || $0.venueId == venueId } }
    private var canSave: Bool { camp == nil && (!who.isEmpty || !title.trimmingCharacters(in: .whitespaces).isEmpty) && !saving }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    PlayerPicker(playerId: $playerId, newName: $newName)
                    TextField("Title (optional)", text: $title, prompt: Text(who.isEmpty ? "Title" : who))
                }

                Section("When") {
                    DatePicker("Date", selection: $day, displayedComponents: .date)
                    DatePicker("Start", selection: $time, displayedComponents: .hourAndMinute)
                    Stepper(value: $mins, in: 5...600, step: 5) {
                        LabeledContent("Length", value: Fmt.mins(mins))
                    }
                    if let camp {
                        Label("\(camp.name) runs that day, so lessons can't be booked.", systemImage: "tent")
                            .foregroundStyle(.red).font(.subheadline)
                    }
                    ForEach(clashes, id: \.self) { c in
                        Label(c, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.orange).font(.subheadline)
                    }
                }
                .environment(\.timeZone, Fmt.london)

                Section("Lesson") {
                    Picker("Type", selection: $type) {
                        ForEach(setup?.lessonTypes ?? ["Private", "Group", "Cardio", "Match play", "Block"], id: \.self) { Text($0).tag($0) }
                    }
                    if !(setup?.venues.isEmpty ?? true) {
                        Picker("Venue", selection: $venueId) {
                            Text("None").tag(String?.none)
                            ForEach(setup?.venues ?? []) { Text($0.name).tag(Optional($0.id)) }
                        }
                    }
                    if !courtsHere.isEmpty {
                        Picker("Court", selection: $courtId) {
                            Text("Type a court…").tag(String?.none)
                            ForEach(courtsHere) { Text($0.name).tag(Optional($0.id)) }
                        }
                    }
                    if courtId == nil {
                        TextField("Court", text: $courtText)
                    }
                    if let coaches = setup?.coaches, !coaches.isEmpty {
                        Picker("Coach", selection: $coachName) {
                            if setup?.me.isHead == true { Text("Head coach (you)").tag("") }
                            ForEach(coaches) { Text($0.name).tag($0.name) }
                        }
                    }
                    Picker("Status", selection: $status) {
                        Text("Confirmed").tag("confirmed")
                        Text("Waiting to confirm").tag("pending")
                        Text("Cancelled").tag("cancelled")
                    }
                }

                if type != "Block" {
                    Section {
                        TextField("How many playing", text: $people).keyboardType(.numberPad)
                        TextField("Price (£)", text: $priceText, prompt: Text(quote?.total.map { "£" + Fmt.poundsText($0) } ?? "Price (£)"))
                            .keyboardType(.decimalPad)
                    } header: {
                        Text("Price")
                    } footer: {
                        if let line = quoteLine { Text(line) }
                    }
                }

                Section("Notes") {
                    TextField("Notes", text: $notes, axis: .vertical).lineLimit(2...6)
                }

                if let error {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle(existing == nil ? "New booking" : "Edit booking")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if saving { ProgressView() } else { Button("Save") { Task { await save() } }.disabled(!canSave) }
                }
            }
            .interactiveDismissDisabled(saving)
            .task { await store.load(); fill() }
            .task(id: clashKey) { await checkClashes() }
            .task(id: quoteKey) {
                try? await Task.sleep(for: .milliseconds(350))
                await loadQuote()
            }
            .onChange(of: venueId) { _, _ in if let c = courtId, !courtsHere.contains(where: { $0.id == c }) { courtId = nil } }
        }
    }

    // MARK: Filling in

    private func fill() {
        guard !ready else { return }
        ready = true
        if let b = existing {
            day = Fmt.day(b.bookingDate ?? Fmt.todayISO) ?? Date()
            time = Fmt.at(b.bookingDate ?? Fmt.todayISO, b.startTime) ?? Date()
            mins = b.durationMin ?? 60
            type = b.type ?? "Private"
            playerId = b.playerId
            if b.playerId == nil { newName = b.playerName ?? "" }
            title = (b.title == b.playerName) ? "" : (b.title ?? "")
            venueId = b.venueId
            courtId = b.courtId
            courtText = b.courtId == nil ? (b.court ?? "") : ""
            coachName = b.assignedCoach ?? ""
            status = b.status ?? "confirmed"
            people = b.headcount.map(String.init) ?? ""
            priceText = Fmt.poundsText(b.pricePennies)
            notes = b.notes ?? ""
        } else {
            day = Fmt.day(startDate) ?? Date()
            time = Fmt.at(startDate, startTime) ?? Date()
            mins = setup?.defaultDuration ?? 60
            type = setup?.lessonTypes.first ?? "Private"
            playerId = presetPlayerId
            venueId = setup?.venues.first(where: \.isHome)?.id ?? (setup?.venues.count == 1 ? setup?.venues.first?.id : nil)
            // An invited coach books for themselves.
            if setup?.me.isHead == false { coachName = setup?.me.name ?? "" }
        }
    }

    // MARK: Clashes (a warning only, as on the website)

    private var clashKey: String { "\(iso)|\(hhmm)|\(mins)|\(coachName)|\(courtId ?? courtText)|\(playerId ?? newName)" }

    private func checkClashes() async {
        guard ready, camp == nil else { clashes = []; return }
        try? await Task.sleep(for: .milliseconds(300))
        guard let same: [BookingRecord] = try? await Rows.list("coach_bookings", [("booking_date", "eq.\(iso)"), ("status", "neq.cancelled")]) else { return }
        guard let start = Fmt.minutes(hhmm) else { return }
        let end = start + mins
        let myCourt = courtId.flatMap { id in setup?.courts.first { $0.id == id }?.name } ?? courtText.trimmingCharacters(in: .whitespaces)
        clashes = same.compactMap { b in
            guard b.id != existing?.id, let s = Fmt.minutes(b.startTime) else { return nil }
            let e = s + (b.durationMin ?? 60)
            guard s < end && start < e else { return nil }
            var why: [String] = []
            if (b.assignedCoach ?? "") == coachName { why.append("same coach") }
            if !myCourt.isEmpty, (b.courtId != nil && b.courtId == courtId) || (b.court ?? "").caseInsensitiveCompare(myCourt) == .orderedSame { why.append("same court") }
            if let p = playerId, b.playerId == p { why.append("same player") }
            guard !why.isEmpty else { return nil }
            let name = b.title ?? b.playerName ?? "a booking"
            return "\(Fmt.time(b.startTime))–\(Fmt.endTime(b.startTime, mins: b.durationMin ?? 60)) clashes with \(name) — \(why.joined(separator: " and ")). You can still save."
        }
    }

    // MARK: Price

    private var quoteKey: String { "\(type)|\(venueId ?? "")|\(mins)|\(people)|\(playerId ?? "")|\(priceText)" }

    private func loadQuote() async {
        guard ready, type != "Block" else { quote = nil; return }
        struct Body: Encodable { let type: String; let venueId: String?; let mins: Int; let people: Int?; let playerId: String?; let pricePennies: Int? }
        quote = try? await API.shared.post("/api/app/v1/coach/quote", body: Body(type: type, venueId: venueId, mins: mins, people: Int(people), playerId: playerId, pricePennies: Fmt.pennies(priceText)))
    }

    private var quoteLine: String? {
        guard let q = quote, let total = q.total, total > 0 else { return quote?.total == 0 ? quote?.why : nil }
        var parts = [Fmt.money(total)]
        if let each = q.each, (q.people ?? 1) > 1 { parts[0] += " (\(Fmt.money(each)) each)" }
        if let court = q.court, court > 0 { parts.append("court \(Fmt.money(court))"); parts.append("you make \(Fmt.money(total - court))") }
        if let why = q.why { parts.append(why) }
        return parts.joined(separator: " · ")
    }

    // MARK: Save

    private func save() async {
        error = nil
        guard camp == nil else { return }
        let peopleN: Int?
        let p = people.trimmingCharacters(in: .whitespaces)
        if p.isEmpty { peopleN = nil } else if let n = Int(p), (1...50).contains(n) { peopleN = n } else {
            error = "Enter how many are playing as a whole number from 1 to 50, or leave it empty."; return
        }
        let priceN: Int?
        if priceText.trimmingCharacters(in: .whitespaces).isEmpty { priceN = nil } else if let v = Fmt.pennies(priceText), v <= 1_000_000 { priceN = v } else {
            error = "Price: enter an amount in pounds, like 45 or 45.50."; return
        }
        saving = true
        defer { saving = false }
        do {
            var pid = playerId
            var pname = playerId.flatMap { store.player($0)?.name }
            if pid == nil, !newName.trimmingCharacters(in: .whitespaces).isEmpty {
                let added = try await store.ensurePlayer(named: newName)
                pid = added.id; pname = added.name
            }
            let court = courtId.flatMap { id in setup?.courts.first { $0.id == id } }
            var row: RowValues = [
                "title": .text(title.isEmpty ? (pname ?? who) : title),
                "player_id": pid.map { .string($0) } ?? .null,
                "player_name": .text(pname ?? who),
                "court": .text(court?.name ?? courtText),
                "court_id": court.map { .string($0.id) } ?? .null,
                "venue_id": (court?.venueId ?? venueId).map { .string($0) } ?? .null,
                "booking_date": .string(iso),
                "start_time": .string(hhmm),
                "duration_min": .int(mins),
                "type": .string(type),
                "status": .string(status),
                "assigned_coach": .text(coachName),
                "notes": .text(notes),
            ]
            // Only sent when set, or when clearing one that was set (as the website does).
            if peopleN != nil || existing?.headcount != nil { row["headcount"] = .number(peopleN) }
            if priceN != nil || existing?.pricePennies != nil { row["price_pennies"] = .number(priceN) }
            if status == "cancelled", existing?.isCancelled != true { row["cancelled_by"] = .string("coach") }

            let savedRow: BookingRecord
            if let existing { savedRow = try await Rows.update("coach_bookings", id: existing.id, row) }
            else { savedRow = try await Rows.insert("coach_bookings", row) }
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            store.saved()
            saved(existing == nil ? "Booked \(Fmt.dayShort(savedRow.bookingDate ?? iso)) at \(Fmt.time(savedRow.startTime))." : "Saved.")
            dismiss()
        } catch {
            UINotificationFeedbackGenerator().notificationOccurred(.error)
            self.error = error.localizedDescription
        }
    }
}
