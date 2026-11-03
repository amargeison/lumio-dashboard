import SwiftUI

/// A player's development: their racket (or colour), the four skills at it with
/// tap-to-score bars, moving them up, their goal and targets, effort XP, and
/// the adult level checklist.
struct DevelopmentView: View {
    @Environment(CoachStore.self) private var store
    @State var player: PlayerProfile
    let changed: () async -> Void

    @State private var skills: [SkillRecord] = []
    @State private var awards: [RacketAwardRecord] = []
    @State private var sessions: [WatchRecord] = []
    @State private var levels: [AdultLevelRecord] = []
    @State private var passes: [AdultPassRecord] = []
    @State private var goal = ""
    @State private var targeting = false
    @State private var logging = false
    @State private var toast: Toast?
    @State private var lastStage: String?
    /// A score shown straight away while it saves.
    @State private var saving: [String: Int] = [:]

    private var racketOn: Bool { store.setup?.features?.racket == true }
    private var stage: Racket.Stage { Racket.stage(player.racketStage) ?? Racket.stages[0] }
    private func score(_ name: String) -> Int { saving[name] ?? skills.first { $0.skill == name }?.score ?? 0 }
    private var mastered: Int { stage.skills.filter { score($0.name) >= 4 }.count }

    var body: some View {
        List {
            // Adults are on the academy's adult levels, not the junior colour
            // ladder (lib/coach/adult-levels.ts isAdultPlayer: Adult category,
            // 18 or over, or already on a level) — as on the website's card.
            if player.isAdult { adultSection }
            if !player.isAdult {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Circle().fill(Color(hex: stage.hex)).frame(width: 16, height: 16).overlay(Circle().stroke(.secondary.opacity(0.4)))
                        Text(player.racketStage == nil ? "Not started" : (store.setup?.stageWords(stage.name) ?? stage.name)).font(.headline)
                        Spacer()
                        Text("\(mastered * 25)% mastered").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
                    }
                    Ladder(current: player.racketStage)
                }
                .padding(.vertical, 4)
                ForEach(stage.skills, id: \.name) { s in
                    let sc = score(s.name)
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(s.name).font(.subheadline.weight(.semibold))
                            Spacer()
                            Text(Racket.levels[min(max(sc, 0), 4)]).font(.caption).foregroundStyle(Racket.levelColour(sc))
                        }
                        LevelBars(score: sc) { lv in Task { await setScore(s.name, lv == sc ? lv - 1 : lv) } }
                        Text(s.note).font(.caption).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 2)
                }
                if let next = Racket.next(after: player.racketStage == nil ? nil : stage.id) {
                    ConfirmButton(title: player.racketStage == nil ? "Start them on \(next.name)" : "Move up to \(store.setup?.stageWords(next.name) ?? next.name)",
                                  icon: "arrow.up.circle.fill",
                                  prompt: mastered == 4 || player.racketStage == nil ? "Move \(player.name) to \(next.name)?" : "\(player.name) has mastered \(mastered) of 4 skills. Move them to \(next.name) anyway?",
                                  confirm: "Move up") { await setStage(next.id) }
                }
                if let lastStage {
                    Button { Task { await setStage(lastStage, undo: true) } } label: { Label("Undo", systemImage: "arrow.uturn.backward") }
                }
            } header: { Text(racketOn ? "Racket progression" : "Colour") } footer: {
                Text("Tap a bar to set the level; tap the current level to step it back. Their family sees this in their app.")
            }

            }

            if !player.isAdult, !awards.isEmpty {
                Section("History") {
                    ForEach(awards.prefix(6)) { a in
                        HStack {
                            Text("\(Racket.stage(a.fromStage)?.name ?? "Start") → \(Racket.stage(a.toStage)?.name ?? "—")")
                            Spacer()
                            Text(a.createdAt.map { Fmt.when($0) } ?? "").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }

            Section {
                TextField("Their goal", text: $goal, axis: .vertical).lineLimit(1...3)
                    .onSubmit { Task { await saveGoal() } }
                if goal != (player.goal ?? "") { Button("Save goal") { Task { await saveGoal() } } }
            } header: { Text("Goal") }

            Section {
                ForEach(player.targets ?? [], id: \.self) { t in
                    VStack(alignment: .leading, spacing: 3) {
                        Text(t.target).font(.subheadline.weight(.semibold))
                        if let w = t.why, !w.isEmpty { Text(w).font(.caption).foregroundStyle(.secondary) }
                        Text([t.measure, t.by.map { "by \($0)" }].compactMap { $0 }.joined(separator: " · ")).font(.caption).foregroundStyle(.secondary)
                    }
                }
                Button { Task { await makeTargets() } } label: {
                    HStack { if targeting { ProgressView() } else { Image(systemName: "sparkles") }; Text((player.targets ?? []).isEmpty ? "Suggest targets with Lumio Coach" : "Suggest new targets") }
                }
                .disabled(targeting)
            } header: { Text("Targets") } footer: { if let n = player.targetsNote, !n.isEmpty { Text(n) } }

            if store.setup?.features?.effort != false {
                Section {
                    let xp = player.xpTotal ?? 0
                    let level = EffortLevels.coach(xp)
                    HStack {
                        Text("\(xp) XP").font(.headline).monospacedDigit()
                        Spacer()
                        Pill(text: level.name, systemImage: "bolt.fill", tint: .orange)
                    }
                    ForEach(sessions.prefix(8)) { s in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(Int(s.durationMin ?? 0)) min · \(s.source == "manual" ? "logged" : (s.source ?? ""))").font(.subheadline).strikethrough(s.voided == true)
                                Text(s.startedAt.map { Fmt.when($0) } ?? "").font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text("+\(Int(s.xpAwarded ?? 0))").font(.subheadline.monospacedDigit()).foregroundStyle(s.voided == true ? Color.secondary : Color.orange)
                        }
                        .swipeActions { Button(s.voided == true ? "Restore" : "Void") { Task { await void(s) } }.tint(.orange) }
                    }
                    Button { logging = true } label: { Label("Log a session", systemImage: "plus.circle") }
                } header: { Text("Effort & rewards") }
            }

        }
        .navigationTitle("Development")
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .task { await load() }
        .refreshable { await load() }
        .sheet(isPresented: $logging) {
            LogPracticeView(playerId: player.id, coachMode: true) { t in toast = Toast(text: t); Task { await reloadPlayer(); await load() } }
        }
        .onAppear { goal = player.goal ?? "" }
    }

    @State private var pick: String = ""

    private var ladder: [AdultLevelRecord] { AdultStanding.ordered(levels) }
    private var standing: AdultStanding? { AdultStanding.of(player, levels: levels, passes: passes) }

    @ViewBuilder private var adultSection: some View {
        let a = standing
        Section {
            if let a, let level = a.level {
                HStack {
                    RoundedRectangle(cornerRadius: 3).fill(a.colour ?? .clear).frame(width: 18, height: 12).overlay(RoundedRectangle(cornerRadius: 3).stroke(.secondary.opacity(0.4)))
                    Text("Working on · \(a.short)").font(.headline)
                    Spacer()
                    if a.total > 0 { Text("\(a.done)/\(a.total)").font(.subheadline.weight(.semibold)).foregroundStyle(a.done == a.total ? Color.green : Color.accentColor) }
                }
                if let s = level.summary, !s.isEmpty { Text(s).font(.subheadline).foregroundStyle(.secondary) }
                if (level.checklist ?? []).isEmpty { Text("This level has no checklist yet. Add one on the website, under Adult levels.").foregroundStyle(.secondary) }
                ForEach(level.checklist ?? [], id: \.id) { item in
                    let on = a.passed.contains(item.id)
                    let when = passes.first { $0.levelId == level.id && $0.itemId == item.id }?.passedOn
                    Button { Task { await toggle(item.id, level: level.id, passed: on) } } label: {
                        HStack(alignment: .firstTextBaseline, spacing: 10) {
                            Image(systemName: on ? "checkmark.circle.fill" : "circle").foregroundStyle(on ? Color.green : Color.secondary)
                            Text(item.text).foregroundStyle(on ? Color.primary : Color.secondary)
                            Spacer(minLength: 4)
                            if on, let when { Text(Fmt.day(when)?.formatted(.dateTime.day().month(.abbreviated).locale(Locale(identifier: "en_GB"))) ?? "").font(.caption).foregroundStyle(.secondary) }
                        }
                    }
                    .buttonStyle(.plain)
                }
                if a.total > 0 && a.done == a.total {
                    Label("\(level.name) passed", systemImage: "checkmark.seal.fill").foregroundStyle(.green).font(.subheadline.weight(.semibold))
                    if a.number < ladder.count {
                        let next = ladder[a.number]
                        ConfirmButton(title: "Move up to \(next.name)", icon: "arrow.up.circle.fill",
                                      prompt: "Move \(player.name) up to \(next.name)?", confirm: "Move up") { await setAdultLevel(next.id) }
                    } else {
                        Text("That is the top level.").font(.caption).foregroundStyle(.secondary)
                    }
                }
            } else if ladder.isEmpty {
                Text("No adult levels set up yet. Set them up on the website: Racket Progression → Adult levels.").foregroundStyle(.secondary)
            } else {
                Text("No adult level yet").font(.headline)
                Picker("Level", selection: $pick) {
                    ForEach(Array(ladder.enumerated()), id: \.element.id) { i, l in Text("\(i + 1). \(l.name)").tag(l.id) }
                }
                Button { Task { await setAdultLevel(pick.isEmpty ? ladder.first?.id : pick) } } label: { Label("Set level", systemImage: "checkmark.circle") }
            }
        } header: { Text("Adult level") }

        if !ladder.isEmpty {
            Section("Adult levels") {
                ForEach(Array(ladder.enumerated()), id: \.element.id) { i, l in
                    let n = a?.number ?? 0
                    HStack {
                        RoundedRectangle(cornerRadius: 3).fill(AdultStanding.colour(i)).frame(width: 20, height: 12).overlay(RoundedRectangle(cornerRadius: 3).stroke(.secondary.opacity(0.4)))
                        Text("\(i + 1). \(l.name)").fontWeight(i + 1 == n ? .bold : .regular)
                        Spacer()
                        if n > 0 && i + 1 < n { Image(systemName: "checkmark").foregroundStyle(.green) }
                        if i + 1 == n { Text("NOW").font(.caption2.weight(.bold)).foregroundStyle(Color.accentColor) }
                    }
                    .opacity(n == 0 || i + 1 > n ? 0.45 : 1)
                }
            }
        }
    }

    // MARK: Loading and saving

    private func load() async {
        async let s: [SkillRecord] = (try? Rows.list("coach_player_skills", [("player_id", "eq.\(player.id)")])) ?? []
        async let a: [RacketAwardRecord] = (try? Rows.list("coach_racket_awards", [("player_id", "eq.\(player.id)")], order: "created_at.desc", limit: 10)) ?? []
        async let w: [WatchRecord] = (try? Rows.list("coach_watch_sessions", [("player_id", "eq.\(player.id)")], order: "started_at.desc", limit: 20)) ?? []
        async let l: [AdultLevelRecord] = (try? Rows.list("coach_adult_levels", order: "position.asc")) ?? []
        async let p: [AdultPassRecord] = (try? Rows.list("coach_adult_passes", [("player_id", "eq.\(player.id)")])) ?? []
        (skills, awards, sessions, levels, passes) = await (s, a, w, l, p)
        if pick.isEmpty { pick = AdultStanding.ordered(levels).first?.id ?? "" }
    }

    private func reloadPlayer() async {
        if let rows: [PlayerProfile] = try? await Rows.list("coach_players", [("id", player.id)]), let p = rows.first { player = p }
        await changed()
    }

    private func setScore(_ skill: String, _ value: Int) async {
        let v = max(0, min(4, value))
        saving[skill] = v
        defer { saving[skill] = nil }
        do {
            if let existing = skills.first(where: { $0.skill == skill }) {
                let _: SkillRecord = try await Rows.update("coach_player_skills", id: existing.id, ["score": .int(v)])
            } else {
                let _: SkillRecord = try await Rows.insert("coach_player_skills", ["player_id": .string(player.id), "skill": .string(skill), "score": .int(v)])
            }
            UISelectionFeedbackGenerator().selectionChanged()
            skills = (try? await Rows.list("coach_player_skills", [("player_id", "eq.\(player.id)")])) ?? skills
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func setStage(_ id: String?, undo: Bool = false) async {
        let before = player.racketStage
        do {
            let _: IdRow = try await Rows.update("coach_players", id: player.id, ["racket_stage": id.map { .string($0) } ?? .null])
            lastStage = undo ? nil : before
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            if !undo, let s = Racket.stage(id) { toast = Toast(text: "\(player.name) is now on \(store.setup?.stageWords(s.name) ?? s.name).") }
            await reloadPlayer()
            await load()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func saveGoal() async {
        do {
            let _: IdRow = try await Rows.update("coach_players", id: player.id, ["goal": .text(goal)])
            await reloadPlayer()
            toast = Toast(text: "Goal saved.")
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func makeTargets() async {
        targeting = true
        defer { targeting = false }
        struct Body: Encodable { let playerId: String }
        do {
            let _: Empty = try await API.shared.post("/api/coach/player-targets", body: Body(playerId: player.id))
            await reloadPlayer()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func void(_ s: WatchRecord) async {
        struct Body: Encodable { let id: String; let voided: Bool }
        do {
            let _: Empty = try await API.shared.post("/api/coach/watch/void", body: Body(id: s.id, voided: s.voided != true))
            await reloadPlayer(); await load()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func setAdultLevel(_ id: String?) async {
        do {
            let _: IdRow = try await Rows.update("coach_players", id: player.id, ["adult_level_id": id.map { .string($0) } ?? .null])
            await reloadPlayer()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func toggle(_ item: String, level: String, passed: Bool) async {
        do {
            if passed {
                for p in passes where p.levelId == level && p.itemId == item { try await Rows.delete("coach_adult_passes", id: p.id) }
            } else {
                var row: RowValues = ["player_id": .string(player.id), "level_id": .string(level), "item_id": .string(item), "passed_on": .string(Fmt.todayISO)]
                if let s = player.staffId { row["staff_id"] = .string(s) }
                let _: AdultPassRecord = try await Rows.insert("coach_adult_passes", row)
            }
            passes = (try? await Rows.list("coach_adult_passes", [("player_id", "eq.\(player.id)")])) ?? passes
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}
