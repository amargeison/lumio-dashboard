import SwiftUI

/// The family's progress: their racket (or colour) and skills, the adult level,
/// effort rewards and practice they log, the coach's highlights and voice notes,
/// and things to read and watch.
struct ProgressTabView: View {
    @Environment(AppModel.self) private var model
    @Environment(FamilyModel.self) private var family
    @State private var playing: PlayableItem?
    @State private var logging = false
    @State private var toast: Toast?

    var body: some View {
        FamilyContent { b in content(b) }
            .navigationTitle("Progress")
            .refreshable { await family.reload() }
            .sheet(item: $playing) { MediaPlayerView(url: $0.url, title: $0.title) }
            .sheet(isPresented: $logging) {
                LogPracticeView(playerId: family.playerId) { text in toast = Toast(text: text); Task { await family.reload() } }
            }
            .toast($toast)
    }

    private func content(_ b: FamilyBundle) -> some View {
        List {
            header(b)
            if let n = b.nextSession, b.shows("nextsession") { nextSession(n) }
            if b.shows("racket", module: \.racket), b.player.racketStage != nil { racket(b) }
            if let level = b.adultLevel, b.shows("adultlevel", module: \.racket) { adult(level) }
            if b.shows("rewards", module: \.effort) { effort(b) }
            if b.shows("highlights", module: \.video), !b.highlights.isEmpty { highlights(b) }
            if b.shows("highlights", module: \.audio), !b.media.isEmpty { voiceNotes(b) }
            if b.shows("resources"), !(b.resources.isEmpty && b.books.isEmpty) { reading(b) }
        }
        .listStyle(.insetGrouped)
    }

    // MARK: Sections

    private func header(_ b: FamilyBundle) -> some View {
        Section {
            HStack(spacing: 14) {
                PlayerPhoto(name: b.player.name ?? "", path: b.player.avatarUrl, size: 64)
                VStack(alignment: .leading, spacing: 3) {
                    Text(b.player.nickname?.isEmpty == false ? b.player.nickname! : (b.player.name ?? "")).font(.title2.bold())
                    if let s = Racket.stage(b.player.racketStage) {
                        HStack(spacing: 6) {
                            Circle().fill(Color(hex: s.hex)).frame(width: 12, height: 12).overlay(Circle().stroke(.secondary.opacity(0.4)))
                            Text(stageWords(s.name, b)).font(.subheadline.weight(.semibold))
                        }
                    } else if let level = b.player.level { Text(level).font(.subheadline).foregroundStyle(.secondary) }
                }
            }
            .padding(.vertical, 4)
            if let goal = b.player.goal, !goal.isEmpty {
                Label { Text(goal) } icon: { Image(systemName: "scope").foregroundStyle(Color.accentColor) }
                    .font(.subheadline)
            }
        }
    }

    private func stageWords(_ name: String, _ b: FamilyBundle) -> String {
        b.features?.racket == false ? name : "\(name) racket"
    }

    private func nextSession(_ n: FamilyBundle.NextSession) -> some View {
        Section("Next session") {
            VStack(alignment: .leading, spacing: 4) {
                Text([n.date.map(Fmt.dayFriendly), n.startTime.map { Fmt.time($0) }].compactMap { $0 }.joined(separator: " · ")).font(.headline)
                Text([n.type, n.court, n.coach.map { "with \($0)" }].compactMap { $0 }.joined(separator: " · ")).font(.subheadline).foregroundStyle(.secondary)
            }
            if let plan = n.plan {
                if let f = plan.focus, !f.isEmpty { Label(f, systemImage: "scope").font(.subheadline) }
                ForEach(plan.runSheet ?? []) { p in
                    HStack(alignment: .top) {
                        Text("\(p.mins)′").font(.caption.monospacedDigit()).foregroundStyle(.secondary).frame(width: 30, alignment: .leading)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(p.phase).font(.subheadline.weight(.semibold))
                            if !p.detail.isEmpty { Text(p.detail).font(.caption).foregroundStyle(.secondary).lineLimit(3) }
                        }
                    }
                }
            }
        }
    }

    private func racket(_ b: FamilyBundle) -> some View {
        let stage = Racket.stage(b.player.racketStage) ?? Racket.stages[0]
        let scores = Dictionary(b.skills.map { ($0.skill, $0.score) }, uniquingKeysWith: { a, _ in a })
        let mastered = stage.skills.filter { (scores[$0.name] ?? 0) >= 4 }.count
        let next = Racket.next(after: stage.id)
        return Section {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(stageWords(stage.name, b)).font(.headline)
                    Spacer()
                    Text("\(mastered * 25)% mastered").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
                }
                Ladder(current: stage.id)
                Text(next.map { mastered == 4 ? "Ready for \($0.name) — your coach will move you up." : "\(4 - mastered) skill\(4 - mastered == 1 ? "" : "s") to master before \($0.name)." } ?? "Top of the ladder.")
                    .font(.caption).foregroundStyle(.secondary)
            }
            .padding(.vertical, 4)
            ForEach(stage.skills, id: \.name) { s in
                let score = scores[s.name] ?? 0
                VStack(alignment: .leading, spacing: 5) {
                    HStack {
                        Text(s.name).font(.subheadline.weight(.semibold))
                        Spacer()
                        if score >= b.awardThreshold { Image(systemName: "checkmark.seal.fill").foregroundStyle(.green) }
                        Text(Racket.levels[min(max(score, 0), 4)]).font(.caption).foregroundStyle(.secondary)
                    }
                    LevelBars(score: score)
                    Text(s.note).font(.caption).foregroundStyle(.secondary)
                }
                .padding(.vertical, 2)
            }
        } header: { Text(b.features?.racket == false ? "Colour" : "Racket progression") }
    }

    private func adult(_ l: FamilyBundle.AdultLevel) -> some View {
        Section("Your level") {
            VStack(alignment: .leading, spacing: 4) {
                Text(l.name ?? "Level").font(.headline)
                if let n = l.number, let of = l.of { Text("Level \(n) of \(of)").font(.caption).foregroundStyle(.secondary) }
                if let s = l.summary, !s.isEmpty { Text(s).font(.subheadline) }
                if let done = l.done, let total = l.total, total > 0 {
                    ProgressView(value: Double(done), total: Double(total)).tint(.green)
                    Text("\(done) of \(total) passed").font(.caption).foregroundStyle(.secondary)
                }
            }
            ForEach(l.checklist ?? [], id: \.self) { i in
                Label(i.text, systemImage: i.passed ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(i.passed ? Color.green : Color.primary).font(.subheadline)
            }
        }
    }

    private func effort(_ b: FamilyBundle) -> some View {
        let xp = b.player.xpTotal ?? 0
        let level = EffortLevels.family(xp)
        return Section {
            if xp > 0 {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .firstTextBaseline) {
                        Text("\(xp)").font(.system(size: 34, weight: .bold, design: .rounded)).monospacedDigit()
                        Text("XP").font(.headline).foregroundStyle(.secondary)
                        Spacer()
                        Pill(text: level.name, systemImage: "bolt.fill", tint: .orange)
                    }
                    if let next = level.next {
                        ProgressView(value: Double(xp - level.min), total: Double(next.min - level.min)).tint(.orange)
                        Text("\(next.min - xp) XP to \(next.name)").font(.caption).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }
            if let s = b.watch.first, b.shows("report", module: \.effort) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Last session\(s.startedAt.map { " · \(Fmt.when($0))" } ?? "")").font(.subheadline.weight(.semibold))
                    HStack {
                        stat(s.durationMin.map { "\(Int($0)) min" } ?? "—", "Time")
                        stat(s.distanceM.map { String(format: "%.1f km", $0 / 1000) } ?? "—", "Distance")
                        stat(s.avgHr.map { "\(Int($0))" } ?? "—", "Avg HR")
                        stat(effortBand(s.effortScore), "Effort")
                    }
                }
            }
            Button { logging = true } label: { Label("Log practice", systemImage: "plus.circle.fill").font(.body.weight(.semibold)) }
        } header: { Text("Effort & rewards") } footer: { Text("Practice at home earns XP too — up to three sessions a day.") }
    }

    private func stat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.subheadline.weight(.bold)).monospacedDigit()
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func effortBand(_ e: Double?) -> String {
        guard let e else { return "—" }
        return e >= 70 ? "High" : e >= 40 ? "Medium" : "Low"
    }

    private func highlights(_ b: FamilyBundle) -> some View {
        Section("Highlights from your coach") {
            ForEach(b.highlights) { c in
                Button {
                    if let u = c.url.flatMap(URL.init(string:)) { playing = PlayableItem(url: u, title: c.title ?? "Highlight") }
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "play.rectangle.fill").font(.title2).foregroundStyle(Color.accentColor)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(c.title ?? c.shotType?.capitalized ?? "Highlight").foregroundStyle(.primary)
                            Text([c.durationSeconds.map { "\(Int($0))s" }, c.createdAt.map { Fmt.when($0) }].compactMap { $0 }.joined(separator: " · "))
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
    }

    private func voiceNotes(_ b: FamilyBundle) -> some View {
        Section("Voice notes from your coach") {
            ForEach(b.media) { m in
                Button {
                    if let u = m.url.flatMap(URL.init(string:)) { playing = PlayableItem(url: u, title: m.title ?? "Voice note") }
                } label: {
                    Label { VStack(alignment: .leading) {
                        Text(m.title ?? "Voice note").foregroundStyle(.primary)
                        Text(m.createdAt.map { Fmt.when($0) } ?? "").font(.caption).foregroundStyle(.secondary)
                    } } icon: { Image(systemName: "waveform.circle.fill").foregroundStyle(Color.accentColor) }
                }
            }
        }
    }

    private func reading(_ b: FamilyBundle) -> some View {
        Section("To read and watch") {
            ForEach(b.resources.filter { !($0.url ?? "").hasPrefix("lumio:") }) { r in
                Button { open(r.url) } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(r.title ?? "Resource").foregroundStyle(.primary)
                        Text([r.category, r.format].compactMap { $0 }.joined(separator: " · ")).font(.caption).foregroundStyle(.secondary)
                        if let n = r.notes, !n.isEmpty { Text(n).font(.caption).foregroundStyle(.secondary).lineLimit(2) }
                    }
                }
                .disabled(r.url == nil)
            }
            ForEach(b.books) { book in
                Label { VStack(alignment: .leading) {
                    Text(book.title ?? "Book")
                    Text([book.author, book.note].compactMap { $0 }.joined(separator: " · ")).font(.caption).foregroundStyle(.secondary)
                } } icon: { Image(systemName: "book.closed.fill").foregroundStyle(.brown) }
            }
        }
    }

    private func open(_ url: String?) {
        guard let url, !url.isEmpty else { return }
        if url.hasPrefix("/") { model.web = WebTarget(path: url, title: "Resource") }
        else if let u = URL(string: url) { UIApplication.shared.open(u) }
    }
}

/// The nine colours as a strip, with the current one marked.
struct Ladder: View {
    let current: String?
    var body: some View {
        HStack(spacing: 3) {
            ForEach(Racket.stages) { s in
                let here = s.id == current
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color(hex: s.hex))
                    .frame(height: here ? 14 : 8)
                    .overlay(RoundedRectangle(cornerRadius: 3).stroke(here ? Color.primary : Color.clear, lineWidth: 1.5))
            }
        }
        .frame(height: 14)
        .accessibilityHidden(true)
    }
}

/// Four bars: Learning → Consistent.
struct LevelBars: View {
    let score: Int
    var tap: ((Int) -> Void)? = nil
    var body: some View {
        HStack(spacing: 4) {
            ForEach(1...4, id: \.self) { lv in
                RoundedRectangle(cornerRadius: 3)
                    .fill(lv <= score ? Racket.levelColour(score) : Color.secondary.opacity(0.2))
                    .frame(height: tap == nil ? 8 : 26)
                    .contentShape(Rectangle())
                    .onTapGesture { tap?(lv) }
                    .accessibilityLabel(Racket.levels[lv])
                    .accessibilityAddTraits(tap == nil ? [] : .isButton)
            }
        }
    }
}

/// XP levels. The family page and the coach page use different steps today;
/// each keeps its own (LiveStudentView / effort-rewards.ts).
enum EffortLevels {
    struct Level { let name: String; let min: Int; let next: (name: String, min: Int)? }
    static let familySteps: [(String, Int)] = [("Rookie", 0), ("Mover", 500), ("Grinder", 1500), ("Athlete", 3500), ("Machine", 7000)]
    static let coachSteps: [(String, Int)] = [("Rookie", 0), ("Mover", 300), ("Grinder", 800), ("Competitor", 1500), ("Athlete", 2500), ("Elite", 4000)]
    static func family(_ xp: Int) -> Level { level(xp, familySteps) }
    static func coach(_ xp: Int) -> Level { level(xp, coachSteps) }
    private static func level(_ xp: Int, _ steps: [(String, Int)]) -> Level {
        var i = 0
        for (n, s) in steps.enumerated() where xp >= s.1 { i = n }
        let next = i + 1 < steps.count ? (name: steps[i + 1].0, min: steps[i + 1].1) : nil
        return Level(name: steps[i].0, min: steps[i].1, next: next)
    }
}

/// Logging practice done at home (or a match) for effort XP.
struct LogPracticeView: View {
    @Environment(\.dismiss) private var dismiss
    let playerId: String
    var coachMode = false
    let done: (String) -> Void

    @State private var mins = 30
    @State private var effort = 6.0
    @State private var distance = ""
    @State private var note = ""
    @State private var when = Date()
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Stepper(value: $mins, in: 10...300, step: 5) { LabeledContent("How long", value: Fmt.mins(mins)) }
                    VStack(alignment: .leading) {
                        LabeledContent("How hard", value: "\(Int(effort)) / 10")
                        Slider(value: $effort, in: 1...10, step: 1)
                    }
                    TextField("Distance in km (optional)", text: $distance).keyboardType(.decimalPad)
                    DatePicker("When", selection: $when, in: Calendar.current.date(byAdding: .day, value: coachMode ? -30 : -7, to: Date())!...Date())
                    TextField("What did you work on? (optional)", text: $note)
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle("Log practice")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if saving { ProgressView() } else { Button("Save") { Task { await save() } } }
                }
            }
        }
    }

    private func save() async {
        saving = true; error = nil
        defer { saving = false }
        struct Body: Encodable {
            let playerId: String?; let player_id: String?
            let duration_min: Int; let perceived_effort: Int; let distance_m: Int?; let note: String?; let started_at: String
        }
        struct Answer: Decodable { let xp_awarded: Double?; let xp_total: Double?; let duplicate: Bool? }
        let metres = Double(distance.replacingOccurrences(of: ",", with: ".")).map { Int($0 * 1000) }
        let body = Body(playerId: coachMode ? nil : playerId, player_id: coachMode ? playerId : nil, duration_min: mins, perceived_effort: Int(effort),
                        distance_m: metres, note: note.isEmpty ? nil : String(note.prefix(280)), started_at: ISO8601DateFormatter().string(from: when))
        do {
            let a: Answer = try await API.shared.post(coachMode ? "/api/coach/watch/log" : "/api/portal/watch/log", body: body)
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            done(a.duplicate == true ? "That session was already logged." : "Logged — +\(Int(a.xp_awarded ?? 0)) XP.")
            dismiss()
        } catch { self.error = error.localizedDescription }
    }
}
