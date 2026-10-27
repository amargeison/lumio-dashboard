import SwiftUI

/// Build or edit a session plan: who and what, then Lumio Coach writes the run
/// sheet (or the coach does), then fine-tune the blocks. A plan for a booked
/// lesson takes its player, time and court from the booking.
struct PlanEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(CoachStore.self) private var store

    let plan: PlanRecord?
    let booking: BookingRecord?
    let saved: (String) -> Void

    static let types = ["Private", "Group", "Cardio", "Match play", "Mini / red ball"]

    @State private var playerId: String?
    @State private var groupName = ""
    @State private var type = "Private"
    @State private var hasDate = false
    @State private var day = Date()
    @State private var hasTime = false
    @State private var time = Date()
    @State private var court = ""
    @State private var mins = 60
    @State private var stage = ""
    @State private var standard = ""
    @State private var focus = ""
    @State private var brief = ""
    @State private var focusPoints = ""
    @State private var drills = ""
    @State private var phases: [Phase] = []
    @State private var kit: [String] = []
    @State private var coachNote = ""
    @State private var rebuilt = false
    @State private var builtOn: String?

    @State private var ready = false
    @State private var building = false
    @State private var saving = false
    @State private var error: String?
    @State private var lastLesson: String?
    @State private var reordering = false

    private var locked: Bool { booking != nil || plan?.bookingId != nil }
    private var who: String { playerId.flatMap { store.player($0)?.name } ?? groupName.trimmingCharacters(in: .whitespaces) }
    private var total: Int { phases.reduce(0) { $0 + $1.mins } }

    var body: some View {
        NavigationStack {
            Form {
                if locked {
                    Section {
                        LabeledContent("Player", value: who.isEmpty ? "—" : who)
                        LabeledContent("When", value: [hasDate ? Fmt.dayShort(Fmt.iso(day)) : nil, hasTime ? Fmt.hhmm(time) : nil].compactMap { $0 }.joined(separator: " · "))
                        LabeledContent("Lesson", value: [type, court.isEmpty ? nil : court].compactMap { $0 }.joined(separator: " · "))
                    } footer: { Text("From the booking. Change those in the calendar.") }
                } else {
                    Section {
                        PlayerPicker(playerId: $playerId, newName: $groupName)
                        Picker("Type", selection: $type) { ForEach(Self.types, id: \.self) { Text($0) } }
                        Toggle("On a date", isOn: $hasDate.animation())
                        if hasDate { DatePicker("Date", selection: $day, displayedComponents: .date) }
                        Toggle("At a time", isOn: $hasTime.animation())
                        if hasTime { DatePicker("Start", selection: $time, displayedComponents: .hourAndMinute) }
                        TextField("Court (optional)", text: $court)
                    } footer: { Text("Typing a name that isn't on your roster is fine for a group or someone new — it isn't added to your players.") }
                    .environment(\.timeZone, Fmt.london)
                }

                Section {
                    Stepper(value: $mins, in: 5...600, step: 5) { LabeledContent("Length", value: Fmt.mins(mins)) }
                    Picker("Stage", selection: $stage) {
                        Text("—").tag("")
                        ForEach(RacketStages.ids, id: \.self) { Text($0.capitalized).tag($0) }
                    }
                    TextField("Standard (optional, e.g. club level)", text: $standard)
                    TextField("Focus (required)", text: $focus, axis: .vertical).lineLimit(1...3)
                    if let lastLesson, focus.isEmpty {
                        Button { focus = lastLesson } label: { Label("Last time: \(lastLesson)", systemImage: "arrow.uturn.backward") }
                            .font(.subheadline)
                    }
                    TextField("Anything Lumio Coach should know (private)", text: $brief, axis: .vertical).lineLimit(1...4)
                } header: { Text("The session") }

                Section {
                    Button { Task { await build() } } label: {
                        HStack {
                            if building { ProgressView() } else { Image(systemName: "sparkles") }
                            Text(phases.isEmpty ? "Build it with Lumio Coach" : "Rebuild with Lumio Coach")
                        }
                    }
                    .disabled(building || focus.trimmingCharacters(in: .whitespaces).isEmpty)
                } footer: {
                    if let builtOn { Text(builtOn) }
                    else { Text("Uses the player's recent lessons and questionnaire answers. Takes about 20 seconds.") }
                }

                Section {
                    if phases.isEmpty {
                        Text("No blocks yet. Build with Lumio Coach, or add your own.").foregroundStyle(.secondary)
                    }
                    ForEach($phases) { $p in PhaseEditor(phase: $p) }
                        .onDelete { phases.remove(atOffsets: $0) }
                        .onMove { phases.move(fromOffsets: $0, toOffset: $1) }
                    Button { phases.append(Phase(phase: "", mins: 10, detail: "")) } label: { Label("Add a block", systemImage: "plus") }
                } header: {
                    HStack {
                        Text("Run sheet")
                        Spacer()
                        if !phases.isEmpty {
                            Text("\(total) of \(mins) min").foregroundStyle(total == mins ? Color.secondary : Color.orange)
                        }
                        if phases.count > 1 {
                            Button(reordering ? "Done" : "Reorder") { withAnimation { reordering.toggle() } }
                                .font(.caption.weight(.semibold)).textCase(nil).padding(.leading, 8)
                        }
                    }
                } footer: {
                    if !phases.isEmpty && total != mins { Text("The blocks add up to \(total) minutes, not \(mins). You can still save.") }
                }

                Section("Focus points") { TextField("One per line", text: $focusPoints, axis: .vertical).lineLimit(2...8) }
                Section("Drills") { TextField("One per line", text: $drills, axis: .vertical).lineLimit(2...8) }
                if !kit.isEmpty {
                    Section("Kit") { Text(kit.joined(separator: " · ")).font(.subheadline) }
                }
                if !coachNote.isEmpty {
                    Section("Note from Lumio Coach") { Text(coachNote).font(.subheadline).foregroundStyle(.secondary) }
                }

                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .environment(\.editMode, .constant(reordering ? .active : .inactive))
            .navigationTitle(plan == nil ? "New session" : "Edit session")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if saving { ProgressView() } else {
                        Button("Save") { Task { await save() } }
                            .disabled(focus.trimmingCharacters(in: .whitespaces).isEmpty || building)
                    }
                }
            }
            .interactiveDismissDisabled(saving || building)
            .task { await store.load(); await fill() }
        }
    }

    // MARK: Filling in

    private func fill() async {
        guard !ready else { return }
        ready = true
        if let p = plan {
            playerId = p.playerId
            groupName = p.playerId == nil ? (p.groupName ?? "") : ""
            type = Self.types.contains(p.sessionType ?? "") ? p.sessionType! : "Private"
            if let d = p.sessionDate.flatMap(Fmt.day) { hasDate = true; day = d }
            if let d = p.sessionDate, let t = p.startTime, let at = Fmt.at(d, t) { hasTime = true; time = at }
            court = p.court ?? ""
            mins = p.durationMin ?? 60
            stage = p.racketStage ?? ""
            standard = p.standard ?? ""
            focus = p.focus ?? ""
            brief = p.notes ?? ""
            focusPoints = p.focusLines.joined(separator: "\n")
            drills = p.drillLines.joined(separator: "\n")
            phases = p.runSheet ?? []
            kit = p.kit ?? []
            coachNote = p.coachNote ?? ""
        } else if let b = booking {
            playerId = b.playerId ?? uniqueRosterId(b.playerName)
            if playerId == nil { groupName = b.playerName ?? b.title ?? "" }
            type = Self.types.contains(b.type ?? "") ? b.type! : (b.isGroupish ? "Group" : "Private")
            if let d = b.bookingDate.flatMap(Fmt.day) { hasDate = true; day = d }
            if let d = b.bookingDate, let at = Fmt.at(d, b.startTime) { hasTime = true; time = at }
            court = b.court ?? ""
            mins = b.durationMin ?? 60
        } else {
            mins = store.setup?.defaultDuration ?? 60
        }
        if stage.isEmpty, let pid = playerId, let s = store.player(pid)?.racketStage { stage = s }
        await loadLastFocus()
        if plan == nil, focus.isEmpty, let last = lastLesson { focus = last }
    }

    private func uniqueRosterId(_ name: String?) -> String? {
        guard let n = name?.trimmingCharacters(in: .whitespaces), !n.isEmpty else { return nil }
        let same = store.players.filter { $0.name.caseInsensitiveCompare(n) == .orderedSame }
        return same.count == 1 ? same[0].id : nil
    }

    /// What the last lesson said to work on next.
    private func loadLastFocus() async {
        guard let pid = playerId else { return }
        let last: [SessionRecord] = (try? await Rows.list("coach_sessions", [("player_id", "eq.\(pid)")], order: "session_date.desc", limit: 1)) ?? []
        if let s = last.first {
            let next = s.reviewJson?.nextFocus ?? s.focus
            if let n = next?.trimmingCharacters(in: .whitespacesAndNewlines), !n.isEmpty { lastLesson = n }
        }
    }

    // MARK: Lumio Coach

    private func build() async {
        building = true; error = nil
        defer { building = false }
        struct Body: Encodable {
            let type: String; let focus: String; let racket: String?; let standard: String
            let duration: Int; let note: String; let player: String; let playerId: String?
        }
        do {
            let d: SessionDraft = try await API.shared.request("POST", "/api/coach/session-draft", body: Body(
                type: type, focus: focus.trimmingCharacters(in: .whitespacesAndNewlines), racket: RacketStages.name(stage),
                standard: standard, duration: max(15, min(240, mins)), note: brief, player: who, playerId: playerId), decoder: Rows.decoder)
            guard let sheet = d.runSheet, !sheet.isEmpty else { error = "Lumio Coach didn't come back with a run sheet. Please try again."; return }
            phases = sheet
            focusPoints = (d.focusPoints ?? []).joined(separator: "\n")
            drills = (d.drills ?? []).joined(separator: "\n")
            kit = d.kit ?? []
            coachNote = d.coachNote ?? ""
            rebuilt = true
            switch (d.builtOnHistory == true, d.builtOnAnswers == true) {
            case (true, true): builtOn = "Built on their recent lessons and questionnaire answers."
            case (true, false): builtOn = "Built on their recent lessons."
            case (false, true): builtOn = "Built on their questionnaire answers."
            default: builtOn = "No history for this player yet, so it's built on the focus alone."
            }
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: Save

    private func save() async {
        error = nil
        let f = focus.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !f.isEmpty else { error = "Add a focus for the session."; return }
        saving = true
        defer { saving = false }
        let blocks = phases
            .filter { !$0.phase.trimmingCharacters(in: .whitespaces).isEmpty || !$0.detail.trimmingCharacters(in: .whitespaces).isEmpty }
            .map { Phase(phase: $0.phase.trimmingCharacters(in: .whitespaces), mins: max(1, $0.mins), detail: $0.detail.trimmingCharacters(in: .whitespacesAndNewlines), cue: $0.cue) }
        let name = who.isEmpty ? type : who
        var row: RowValues = [
            "title": .string(String("\(name) — \(f)".prefix(120))),
            "focus": .string(f),
            "duration_min": .int(mins),
            "racket_stage": .text(stage),
            "standard": .text(standard),
            "focus_points": .text(focusPoints),
            "drills": .text(drills),
            "notes": .text(brief),
            "run_sheet": blocks.isEmpty ? .null : .object(blocks),
            "kit": kit.isEmpty ? .null : .list(kit),
            "coach_note": .text(coachNote),
        ]
        if !locked {
            row["session_type"] = .string(type)
            row["group_name"] = .text(playerId.flatMap { store.player($0)?.name } ?? groupName)
            row["player_id"] = playerId.map { .string($0) } ?? .null
            row["session_date"] = hasDate ? .string(Fmt.iso(day)) : .null
            row["start_time"] = hasTime ? .string(Fmt.hhmm(time)) : .null
            row["court"] = .text(court)
        }
        do {
            if let p = plan {
                if rebuilt { row["built_by"] = .string("lumio-coach"); row["designed_at"] = .string(ISO8601DateFormatter().string(from: Date())) }
                let _: PlanRecord = try await Rows.update("coach_session_plans", id: p.id, row)
                saved("Plan saved.")
            } else {
                if let b = booking {
                    row["booking_id"] = .string(b.id)
                    row["session_type"] = .string(type)
                    row["group_name"] = .text(b.playerName ?? who)
                    row["player_id"] = playerId.map { .string($0) } ?? .null
                    row["session_date"] = b.bookingDate.map { .string($0) } ?? .null
                    row["start_time"] = .text(Fmt.time(b.startTime))
                    row["court"] = .text(b.court)
                }
                row["built_by"] = .string(phases.isEmpty || !rebuilt ? "coach" : "lumio-coach")
                row["designed_at"] = .string(ISO8601DateFormatter().string(from: Date()))
                row["source"] = .string("planner")
                let _: PlanRecord = try await Rows.insert("coach_session_plans", row)
                saved("Plan saved.")
            }
            store.saved()
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

/// One block: name, minutes and what happens.
struct PhaseEditor: View {
    @Binding var phase: Phase
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                TextField("Block (e.g. Warm-up)", text: $phase.phase).font(.body.weight(.semibold))
                Stepper("\(phase.mins) min", value: $phase.mins, in: 1...240).fixedSize()
                    .font(.subheadline).monospacedDigit()
            }
            TextField("What happens", text: $phase.detail, axis: .vertical).font(.subheadline).lineLimit(1...6)
            if let cue = phase.cue, !cue.isEmpty {
                Label(cue, systemImage: "quote.bubble").font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

extension BookingRecord {
    var isGroupish: Bool { (type ?? "").lowercased().contains("group") || (headcount ?? 0) > 1 }
}
