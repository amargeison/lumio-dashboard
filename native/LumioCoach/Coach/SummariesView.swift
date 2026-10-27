import SwiftUI

/// Lesson summaries, newest first: what's been sent to families, what's
/// waiting, and a button to write a new one.
struct SummariesView: View {
    @Environment(CoachStore.self) private var store
    @State private var state: Loadable<[SessionRecord]> = .loading
    @State private var writing = false
    @State private var toast: Toast?
    @State private var query = ""

    var body: some View {
        Group {
            switch state {
            case .loading: ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .failed(let m): LoadFailed(message: m) { await load() }
            case .loaded(let all):
                let list = filter(all)
                List {
                    ForEach(list) { s in
                        NavigationLink {
                            SummaryFormView(existing: s) { text in toast = Toast(text: text); Task { await load() } }
                        } label: { row(s) }
                    }
                }
                .listStyle(.plain)
                .overlay {
                    if all.isEmpty {
                        ContentUnavailableView("No lesson summaries yet", systemImage: "doc.text", description: Text("Write one after a lesson and send it to the family."))
                    } else if list.isEmpty {
                        ContentUnavailableView.search(text: query)
                    }
                }
            }
        }
        .navigationTitle("Lesson summaries")
        .searchable(text: $query, prompt: "Search by player or focus")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { writing = true } label: { Image(systemName: "square.and.pencil") }
                    .accessibilityLabel("Write a lesson summary")
            }
        }
        .sheet(isPresented: $writing) {
            NavigationStack {
                SummaryFormView(existing: nil) { text in toast = Toast(text: text); Task { await load() } }
            }
            .environment(store)
        }
        .toast($toast)
        .task { await load() }
        .refreshable { await load() }
    }

    private func filter(_ all: [SessionRecord]) -> [SessionRecord] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return all }
        return all.filter { ($0.playerName ?? "").localizedCaseInsensitiveContains(q) || ($0.focus ?? "").localizedCaseInsensitiveContains(q) }
    }

    private func row(_ s: SessionRecord) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(s.playerName ?? "Lesson").font(.body.weight(.semibold))
                Spacer()
                Text(s.sessionDate.map(Fmt.dayShort) ?? "").font(.caption).foregroundStyle(.secondary)
            }
            if let f = s.focus, !f.isEmpty { Text(f).font(.subheadline).foregroundStyle(.secondary).lineLimit(1) }
            HStack(spacing: 6) {
                if s.sent { Pill(text: "Sent", systemImage: "checkmark", tint: .green) }
                else if s.scheduled { Pill(text: "Sends \(Fmt.moment(s.shareDueAt))", systemImage: "clock", tint: .teal) }
                else { Pill(text: "Not sent", tint: .orange) }
                if let e = s.shareError, !e.isEmpty, !s.sent { Pill(text: "Couldn't send", tint: .red) }
            }
        }
        .padding(.vertical, 2)
    }

    private func load() async {
        do { state = .loaded(try await Rows.list("coach_sessions", order: "session_date.desc", limit: 300)) }
        catch { if state.value == nil { state = .failed(error.localizedDescription) } }
    }
}

/// Write or edit a lesson summary — with a quick note turned into a draft by
/// Lumio Coach — then send it to the family.
struct SummaryFormView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(CoachStore.self) private var store

    let existing: SessionRecord?
    var presetPlayerId: String? = nil
    var presetDate: String? = nil
    let done: (String) -> Void

    @State private var playerId: String?
    @State private var newName = ""
    @State private var day = Date()
    @State private var type = "Private"
    @State private var mins = 60
    @State private var focus = ""
    @State private var rating = 3
    @State private var note = ""
    @State private var covered = ""
    @State private var takeaways = ""
    @State private var drills = ""
    @State private var homework = ""
    @State private var nextFocus = ""
    @State private var playerNote = ""
    @State private var coachNote = ""
    @State private var carried = SessionRecord.Review()   // assessment, recap, technique kept through edits

    @State private var ready = false
    @State private var drafting = false
    @State private var saving = false
    @State private var error: String?
    @State private var savedRecord: SessionRecord?

    private var who: String { playerId.flatMap { store.player($0)?.name } ?? newName.trimmingCharacters(in: .whitespaces) }
    private var record: SessionRecord? { savedRecord ?? existing }

    var body: some View {
        Form {
            Section {
                PlayerPicker(playerId: $playerId, newName: $newName)
                DatePicker("Date", selection: $day, displayedComponents: .date)
                    .environment(\.timeZone, Fmt.london)
                Picker("Type", selection: $type) {
                    ForEach((store.setup?.lessonTypes ?? ["Private", "Group", "Cardio", "Match play"]).filter { $0 != "Block" }, id: \.self) { Text($0).tag($0) }
                }
                Stepper(value: $mins, in: 5...600, step: 5) { LabeledContent("Length", value: Fmt.mins(mins)) }
                TextField("Focus (required)", text: $focus)
                Stars(rating: $rating)
            }

            Section {
                TextField("Quick note — what you worked on, how it went", text: $note, axis: .vertical).lineLimit(3...8)
                Button { Task { await draft() } } label: {
                    HStack { if drafting { ProgressView() } else { Image(systemName: "sparkles") }; Text("Draft it with Lumio Coach") }
                }
                .disabled(drafting || (focus.trimmingCharacters(in: .whitespaces).isEmpty && note.trimmingCharacters(in: .whitespaces).isEmpty))
            } footer: {
                Text("Tap the microphone on the keyboard to dictate. The draft fills in the boxes below for you to check.")
            }

            Section("What we covered") { lines($covered, "One point per line") }
            Section("Key takeaways") { lines($takeaways, "One per line") }
            Section("Drills") { lines($drills, "One per line") }
            Section("Homework") { TextField("Homework", text: $homework, axis: .vertical).lineLimit(1...4) }
            Section("Next session") { TextField("Next session focus", text: $nextFocus, axis: .vertical).lineLimit(1...4) }
            Section {
                TextField("A note to the player", text: $playerNote, axis: .vertical).lineLimit(2...6)
            } header: { Text("Note to the player (shared)") }
            Section {
                TextField("Only you see this", text: $coachNote, axis: .vertical).lineLimit(2...6)
            } header: { Text("Private note") } footer: { Text("Never shown to the family.") }

            if let error { Section { Text(error).foregroundStyle(.red) } }

            if let r = record {
                SendSummarySection(record: r, playerId: r.playerId ?? playerId, hasEmail: store.player(r.playerId ?? playerId)?.hasEmail ?? false) { text in
                    done(text)
                    Task { await reloadRecord() }
                }
            }
        }
        .navigationTitle(existing == nil ? "New summary" : "Lesson summary")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if existing == nil {
                ToolbarItem(placement: .cancellationAction) { Button(savedRecord == nil ? "Cancel" : "Done") { dismiss() } }
            }
            ToolbarItem(placement: .confirmationAction) {
                if saving { ProgressView() } else {
                    Button("Save") { Task { await save() } }
                        .disabled(focus.trimmingCharacters(in: .whitespaces).isEmpty || who.isEmpty)
                }
            }
        }
        .task { await store.load(); fill() }
    }

    private func lines(_ text: Binding<String>, _ prompt: String) -> some View {
        TextField(prompt, text: text, axis: .vertical).lineLimit(2...8)
    }

    private func split(_ s: String) -> [String] {
        s.split(whereSeparator: \.isNewline).map { $0.trimmingCharacters(in: .whitespaces).trimmingCharacters(in: CharacterSet(charactersIn: "•-– ")) }.filter { !$0.isEmpty }
    }

    private func fill() {
        guard !ready else { return }
        ready = true
        guard let s = existing else {
            playerId = presetPlayerId
            if let d = presetDate.flatMap(Fmt.day) { day = d }
            mins = store.setup?.defaultDuration ?? 60
            type = store.setup?.lessonTypes.first ?? "Private"
            return
        }
        let r = s.reviewJson ?? SessionRecord.Review()
        playerId = s.playerId
        if s.playerId == nil { newName = s.playerName ?? "" }
        day = Fmt.day(s.sessionDate ?? Fmt.todayISO) ?? Date()
        type = r.type ?? "Private"
        mins = r.duration ?? 60
        focus = r.focus ?? s.focus ?? ""
        rating = r.rating ?? s.rating ?? 3
        covered = (r.covered ?? []).joined(separator: "\n")
        takeaways = (r.takeaways ?? []).joined(separator: "\n")
        drills = (r.drills ?? []).joined(separator: "\n")
        homework = r.homework ?? ""
        nextFocus = r.nextFocus ?? ""
        playerNote = r.playerNote ?? ""
        coachNote = r.coachNote ?? ""
        carried.assessment = r.assessment; carried.recap = r.recap; carried.technique = r.technique
        carried.skillsWorked = r.skillsWorked; carried.time = r.time; carried.court = r.court
    }

    private func draft() async {
        drafting = true; error = nil
        defer { drafting = false }
        struct Body: Encodable { let player: String; let playerId: String?; let focus: String; let note: String; let rating: Int; let date: String }
        struct Draft: Decodable { let assessment: String?; let covered: [String]?; let takeaways: [String]?; let drills: [String]?; let homework: String?; let nextFocus: String?; let recap: String? }
        do {
            let d: Draft = try await API.shared.post("/api/coach/lesson-summary", body: Body(player: who, playerId: playerId, focus: String(focus.prefix(300)), note: String(note.prefix(4000)), rating: rating, date: Fmt.iso(day)))
            covered = (d.covered ?? []).joined(separator: "\n")
            takeaways = (d.takeaways ?? []).joined(separator: "\n")
            drills = (d.drills ?? []).joined(separator: "\n")
            homework = d.homework ?? homework
            nextFocus = d.nextFocus ?? nextFocus
            carried.assessment = d.assessment ?? carried.assessment
            carried.recap = d.recap ?? carried.recap
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func save() async {
        saving = true; error = nil
        defer { saving = false }
        do {
            var pid = playerId
            var pname = playerId.flatMap { store.player($0)?.name }
            if pid == nil, !newName.trimmingCharacters(in: .whitespaces).isEmpty {
                let added = try await store.ensurePlayer(named: newName)
                pid = added.id; pname = added.name
            }
            var r = SessionRecord.Review()
            r.assessment = carried.assessment; r.recap = carried.recap; r.technique = carried.technique
            r.skillsWorked = carried.skillsWorked ?? []
            r.focus = focus.trimmingCharacters(in: .whitespaces)
            r.covered = split(covered); r.takeaways = split(takeaways); r.drills = split(drills)
            r.homework = homework.trimmingCharacters(in: .whitespacesAndNewlines)
            r.nextFocus = nextFocus.trimmingCharacters(in: .whitespacesAndNewlines)
            r.coachNote = coachNote.trimmingCharacters(in: .whitespacesAndNewlines)
            r.playerNote = playerNote.trimmingCharacters(in: .whitespacesAndNewlines)
            r.rating = rating; r.type = type; r.duration = mins
            r.time = carried.time ?? ""; r.court = carried.court ?? ""

            // `summary` is the shared one-liner: never the private note.
            let shared = [r.playerNote, r.takeaways?.first, r.focus].compactMap { $0 }.first { !$0.isEmpty } ?? ""
            let row: RowValues = [
                "player_id": pid.map { .string($0) } ?? .null,
                "player_name": .text(pname ?? who),
                "session_date": .string(Fmt.iso(day)),
                "focus": .text(r.focus),
                "rating": .int(rating),
                "summary": .text(existing?.summary.flatMap { keepSummary($0, r) } ?? shared),
                "ai_review": .string(Self.reviewText(r)),
                "review_json": .object(r),
            ]
            let saved: SessionRecord
            if let id = record?.id { saved = try await Rows.update("coach_sessions", id: id, row) }
            else {
                saved = try await Rows.insert("coach_sessions", row)
                await markAttended(pid, Fmt.iso(day))
            }
            savedRecord = saved
            store.saved()
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            done(existing == nil ? "Summary saved. Send it to the family below." : "Saved.")
        } catch {
            self.error = error.localizedDescription
        }
    }

    /// A summary line written on its own (not derived from the fields) is kept through an edit.
    private func keepSummary(_ old: String, _ r: SessionRecord.Review) -> String? {
        let before = existing?.reviewJson
        let derived = [before?.playerNote, before?.takeaways?.first, existing?.focus, before?.focus].compactMap { $0 }
        return derived.contains(old) ? nil : old
    }

    /// The website's attendance mark for a lesson with a summary.
    private func markAttended(_ playerId: String?, _ date: String) async {
        guard let playerId else { return }
        let have: [IdRow] = (try? await Rows.list("coach_attendance", [("player_id", "eq.\(playerId)"), ("session_date", "eq.\(date)")])) ?? []
        if have.isEmpty {
            let _: IdRow? = try? await Rows.insert("coach_attendance", ["player_id": .string(playerId), "session_date": .string(date), "present": .bool(true)])
        }
    }

    private func reloadRecord() async {
        guard let id = record?.id, let rows: [SessionRecord] = try? await Rows.list("coach_sessions", [("id", id)]), let r = rows.first else { return }
        savedRecord = r
    }

    /// The shareable text version (ai_review) — never the private note.
    static func reviewText(_ r: SessionRecord.Review) -> String {
        var out: [String] = []
        if let f = r.focus, !f.isEmpty { out.append("Focus: \(f)") }
        if let a = r.assessment, !a.isEmpty { out.append("\nAssessment:\n\(a)") }
        if let c = r.covered, !c.isEmpty { out.append("\nWhat we covered:\n" + c.map { "• \($0)" }.joined(separator: "\n")) }
        if let t = r.technique, !t.isEmpty { out.append("\nHow we worked on it:\n" + t.map { "• \($0)" }.joined(separator: "\n")) }
        if let k = r.takeaways, !k.isEmpty { out.append("\nKey takeaways:\n" + k.map { "• \($0)" }.joined(separator: "\n")) }
        if let d = r.drills, !d.isEmpty { out.append("\nDrills: " + d.joined(separator: ", ")) }
        if let h = r.homework, !h.isEmpty { out.append("\nHomework: \(h)") }
        if let n = r.nextFocus, !n.isEmpty { out.append("\nNext session focus: \(n)") }
        if let p = r.playerNote, !p.isEmpty { out.append("\n\(p)") }
        return out.joined(separator: "\n")
    }
}

/// Send a saved summary to the family: now, at the academy's set time, or not yet.
struct SendSummarySection: View {
    @Environment(CoachStore.self) private var store
    let record: SessionRecord
    let playerId: String?
    let hasEmail: Bool
    let changed: (String) -> Void
    @State private var busy = false
    @State private var error: String?

    var body: some View {
        Section {
            if record.sent {
                Label("Sent \(Fmt.moment(record.sharedAt))\(record.sharedTo.map { " to \($0)" } ?? "")", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
            } else if record.scheduled {
                Label("Sends \(Fmt.moment(record.shareDueAt))", systemImage: "clock").foregroundStyle(.teal)
                Button("Don't send it") { Task { await send("cancel") } }
            }
            if !record.sent {
                BusyButton(title: "Send to the family now", systemImage: "paperplane.fill", enabled: playerId != nil && hasEmail) { await send("now") }
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                if store.setup?.summaries.send == "time" && !record.scheduled {
                    Button("Approve · send at \(store.setup?.summaries.at ?? "22:00")") { Task { await send("schedule") } }
                }
            }
            if let error { Text(error).foregroundStyle(.red).font(.footnote) }
        } header: {
            Text("Send to the family")
        } footer: {
            if playerId == nil { Text("Link this summary to a player on your roster to send it.") }
            else if !hasEmail { Text("There's no email address for this player yet. Add one on their profile.") }
            else { Text("They get an email and a notification in their Lumio app. Your private note is never included.") }
        }
    }

    private func send(_ when: String) async {
        busy = true; error = nil
        defer { busy = false }
        struct Body: Encodable { let sessionId: String; let when: String }
        struct Answer: Decodable { let ok: Bool?; let sentTo: String?; let scheduled: String?; let at: String?; let error: String? }
        do {
            let r: Answer = try await API.shared.post("/api/coach/lesson-summary/send", body: Body(sessionId: record.id, when: when))
            if r.ok == false { error = r.error ?? "That didn't send."; return }
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            switch when {
            case "now": changed("Sent\(r.sentTo.map { " to \($0)" } ?? "").")
            case "schedule": changed("It'll go at \(r.at ?? "the set time").")
            default: changed("It won't be sent.")
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

/// One to five stars.
struct Stars: View {
    @Binding var rating: Int
    var body: some View {
        HStack {
            Text("How it went")
            Spacer()
            ForEach(1...5, id: \.self) { i in
                Image(systemName: i <= rating ? "star.fill" : "star")
                    .foregroundStyle(i <= rating ? Color.yellow : Color.secondary)
                    .onTapGesture { rating = i; UISelectionFeedbackGenerator().selectionChanged() }
                    .accessibilityLabel("\(i) star\(i == 1 ? "" : "s")")
            }
        }
        .accessibilityElement(children: .contain)
    }
}
