import SwiftUI

/// A session plan, ready for court: focus, run sheet, drills and kit — with an
/// on-court timer, and "Finish session" to write it up.
struct RunSheetView: View {
    @Environment(CoachStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State var plan: PlanRecord
    var booking: BookingRecord? = nil
    /// Upcoming lessons without a plan, to assign this one to.
    var bookings: [BookingRecord] = []
    let changed: () async -> Void

    @State private var editing = false
    @State private var onCourt = false
    @State private var finishing = false
    @State private var assigning = false
    @State private var kitDone: Set<String> = []
    @State private var toast: Toast?
    @State private var summary: SessionRecord?

    private var phases: [Phase] { plan.runSheet ?? [] }
    private var who: String { plan.playerId.flatMap { store.player($0)?.name } ?? plan.groupName ?? plan.title ?? "Session" }

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(who).font(.title2.bold())
                        Spacer()
                        if plan.finished { Pill(text: "Finished", systemImage: "checkmark", tint: .green) }
                    }
                    Text(whenLine).foregroundStyle(.secondary)
                    if let s = RacketStages.name(plan.racketStage) { Pill(text: s, tint: .secondary) }
                }
                .padding(.vertical, 4)
                if let f = plan.focus, !f.isEmpty {
                    LabeledContent("Focus") { Text(f).multilineTextAlignment(.trailing) }
                }
            }

            if !plan.finished && !phases.isEmpty {
                Section {
                    Button { onCourt = true } label: {
                        Label("Start on court", systemImage: "timer").font(.body.weight(.semibold))
                    }
                } footer: { Text("A timer for each block, with a buzz when it's time to move on.") }
            }

            if !plan.focusLines.isEmpty {
                Section("Focus points") {
                    ForEach(Array(plan.focusLines.enumerated()), id: \.offset) { i, line in
                        Label { Text(line) } icon: { Text("\(i + 1)").font(.caption.weight(.bold)).foregroundStyle(Color.accentColor) }
                    }
                }
            }

            Section {
                if phases.isEmpty {
                    Text("No run sheet yet. Tap Edit to build one.").foregroundStyle(.secondary)
                } else {
                    PhaseBar(phases: phases).listRowInsets(EdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 16))
                    ForEach(phases) { p in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(p.phase.isEmpty ? "Block" : p.phase).font(.body.weight(.semibold))
                                Spacer()
                                Text("\(p.mins) min").font(.subheadline).monospacedDigit().foregroundStyle(.secondary)
                            }
                            if !p.detail.isEmpty { Text(p.detail).font(.subheadline) }
                            if let cue = p.cue, !cue.isEmpty { Label(cue, systemImage: "quote.bubble").font(.caption).foregroundStyle(.secondary) }
                        }
                        .padding(.vertical, 2)
                    }
                }
            } header: {
                HStack { Text("Run sheet"); Spacer(); if !phases.isEmpty { Text("\(phases.reduce(0) { $0 + $1.mins }) min") } }
            }

            if !plan.drillLines.isEmpty {
                Section("Drills") { ForEach(plan.drillLines, id: \.self) { Label($0, systemImage: "figure.tennis") } }
            }

            if let kit = plan.kit, !kit.isEmpty {
                Section("Kit") {
                    ForEach(kit, id: \.self) { item in
                        Button {
                            if kitDone.contains(item) { kitDone.remove(item) } else { kitDone.insert(item) }
                        } label: {
                            Label(item, systemImage: kitDone.contains(item) ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(kitDone.contains(item) ? Color.green : Color.primary)
                        }
                    }
                }
            }

            if let n = plan.coachNote, !n.isEmpty {
                Section("Note from Lumio Coach") { Text(n).font(.subheadline).foregroundStyle(.secondary) }
            }
            if let n = plan.notes, !n.isEmpty {
                Section("Your brief (private)") { Text(n).font(.subheadline).foregroundStyle(.secondary) }
            }

            Section {
                if !plan.finished {
                    Button { finishing = true } label: { Label("Finish session", systemImage: "flag.checkered") }
                    Button { editing = true } label: { Label("Edit plan", systemImage: "pencil") }
                }
                if plan.bookingId == nil && booking == nil && !bookings.isEmpty {
                    Button { assigning = true } label: { Label("Assign to a booking", systemImage: "calendar.badge.plus") }
                }
                ShareLink(item: shareText) { Label("Share or print", systemImage: "square.and.arrow.up") }
                ConfirmButton(title: "Delete plan", icon: "trash", prompt: "Delete this session plan?", confirm: "Delete", destructive: true) {
                    await remove()
                }
            }
        }
        .navigationTitle("Session")
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .sheet(isPresented: $editing) {
            PlanEditorView(plan: plan, booking: nil) { text in toast = Toast(text: text); Task { await reload() } }
                .environment(store)
        }
        .fullScreenCover(isPresented: $onCourt) {
            OnCourtView(title: who, phases: phases) {
                onCourt = false
                Task { try? await Task.sleep(for: .milliseconds(600)); finishing = true }
            }
        }
        .sheet(isPresented: $finishing) {
            FinishSessionView(plan: plan) { sessionId in Task { await finished(sessionId) } }
                .environment(store)
        }
        .sheet(isPresented: $assigning) {
            NavigationStack {
                List(bookings) { b in
                    Button { Task { await assign(b) } } label: {
                        VStack(alignment: .leading) {
                            Text(b.playerName ?? b.title ?? "Lesson").foregroundStyle(.primary)
                            Text("\(Fmt.dayShort(b.bookingDate ?? "")) · \(Fmt.time(b.startTime))\(b.type.map { " · \($0)" } ?? "")").font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                }
                .navigationTitle("Assign to a booking")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { assigning = false } } }
            }
        }
        .sheet(item: $summary) { s in
            NavigationStack { SummaryFormView(existing: s) { text in toast = Toast(text: text) } }
                .environment(store)
        }
    }

    private var whenLine: String {
        let parts: [String?] = [
            plan.sessionDate.map(Fmt.dayFriendly), plan.startTime.map { Fmt.time($0) },
            plan.sessionType, plan.court, plan.durationMin.map(Fmt.mins),
        ]
        let line = parts.compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
        return line.isEmpty ? "Not booked yet" : line
    }

    /// The run sheet as plain text — for Messages, Notes, or AirPrint.
    private var shareText: String {
        var out = ["\(who) — \(plan.focus ?? "")", whenLine, ""]
        if !plan.focusLines.isEmpty { out.append("Focus points:"); out += plan.focusLines.map { "• \($0)" }; out.append("") }
        if !phases.isEmpty { out.append("Run sheet:"); out += phases.map { "\($0.mins) min — \($0.phase)\($0.detail.isEmpty ? "" : ": \($0.detail)")" }; out.append("") }
        if !plan.drillLines.isEmpty { out.append("Drills: " + plan.drillLines.joined(separator: ", ")) }
        if let kit = plan.kit, !kit.isEmpty { out.append("Kit: " + kit.joined(separator: ", ")) }
        return out.joined(separator: "\n")
    }

    private func reload() async {
        if let rows: [PlanRecord] = try? await Rows.list("coach_session_plans", [("id", plan.id)]), let p = rows.first { plan = p }
        await changed()
    }

    private func finished(_ sessionId: String?) async {
        await reload()
        store.saved()
        guard let sessionId, let rows: [SessionRecord] = try? await Rows.list("coach_sessions", [("id", sessionId)]), let s = rows.first else {
            toast = Toast(text: "Session finished.")
            return
        }
        try? await Task.sleep(for: .milliseconds(700))   // let the finish sheet close first
        summary = s     // straight into the write-up, to check and send
    }

    private func assign(_ b: BookingRecord) async {
        do {
            plan = try await Rows.update("coach_session_plans", id: plan.id, [
                "booking_id": .string(b.id), "session_date": .text(b.bookingDate), "start_time": .text(Fmt.time(b.startTime)),
                "court": .text(b.court), "session_type": .text(b.type), "group_name": .text(b.playerName ?? b.title),
                "player_id": b.playerId.map { .string($0) } ?? .null,
            ])
            assigning = false
            toast = Toast(text: "Assigned to \(b.playerName ?? "the lesson") on \(Fmt.dayShort(b.bookingDate ?? "")).")
            store.saved()
            await changed()
        } catch { assigning = false; toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func remove() async {
        do {
            try await Rows.delete("coach_session_plans", id: plan.id)
            store.saved()
            await changed()
            dismiss()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// The blocks as one bar, each as wide as its share of the session.
struct PhaseBar: View {
    let phases: [Phase]
    private let colours: [Color] = [.blue, .teal, .green, .orange, .purple, .pink, .indigo]
    var body: some View {
        let total = max(1, phases.reduce(0) { $0 + $1.mins })
        GeometryReader { geo in
            HStack(spacing: 2) {
                ForEach(Array(phases.enumerated()), id: \.offset) { i, p in
                    RoundedRectangle(cornerRadius: 3)
                        .fill(colours[i % colours.count].gradient)
                        .frame(width: max(4, (geo.size.width - CGFloat(phases.count - 1) * 2) * CGFloat(p.mins) / CGFloat(total)))
                }
            }
        }
        .frame(height: 10)
        .accessibilityHidden(true)
    }
}

/// Finish a session: what was covered, a note and a rating; Lumio Coach writes
/// the summary, which then opens to check and send to the family.
struct FinishSessionView: View {
    @Environment(\.dismiss) private var dismiss
    let plan: PlanRecord
    let done: (String?) -> Void

    @State private var covered: [(String, Bool)] = []
    @State private var drills: [(String, Bool)] = []
    @State private var note = ""
    @State private var rating = 0
    @State private var writeUp = true
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                if !covered.isEmpty {
                    Section("What you covered") {
                        ForEach(covered.indices, id: \.self) { i in
                            Toggle(covered[i].0, isOn: Binding(get: { covered[i].1 }, set: { covered[i].1 = $0 })).font(.subheadline)
                        }
                    }
                }
                if !drills.isEmpty {
                    Section("Drills you ran") {
                        ForEach(drills.indices, id: \.self) { i in
                            Toggle(drills[i].0, isOn: Binding(get: { drills[i].1 }, set: { drills[i].1 = $0 })).font(.subheadline)
                        }
                    }
                }
                Section {
                    TextField("How did it go? (shared with the family)", text: $note, axis: .vertical).lineLimit(2...6)
                    Stars(rating: $rating)
                } footer: { Text("Tap the microphone on the keyboard to dictate.") }
                Section {
                    Toggle("Let Lumio Coach write the summary", isOn: $writeUp)
                } footer: { Text("You'll see it before anything goes to the family.") }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle("Finish session")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if saving { ProgressView() } else { Button("Finish") { Task { await finish() } } }
                }
            }
            .interactiveDismissDisabled(saving)
            .onAppear {
                guard covered.isEmpty && drills.isEmpty else { return }
                let phaseLines = (plan.runSheet ?? []).filter { !$0.detail.isEmpty }.map { "\($0.phase): \($0.detail)" }
                covered = Array((plan.focusLines + phaseLines).prefix(10)).map { ($0, true) }
                drills = Array(plan.drillLines.prefix(10)).map { ($0, true) }
            }
        }
    }

    private func finish() async {
        saving = true; error = nil
        defer { saving = false }
        struct Body: Encodable { let planId: String; let covered: [String]; let drills: [String]; let note: String; let rating: Int?; let writeUp: Bool }
        struct Answer: Decodable { let ok: Bool?; let sessionId: String?; let written: Bool?; let aiError: String?; let duplicate: Bool? }
        do {
            let r: Answer = try await API.shared.post("/api/coach/session-complete", body: Body(
                planId: plan.id, covered: covered.filter(\.1).map(\.0), drills: drills.filter(\.1).map(\.0),
                note: note.trimmingCharacters(in: .whitespacesAndNewlines), rating: rating > 0 ? rating : nil, writeUp: writeUp))
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            dismiss()
            done(r.sessionId)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
