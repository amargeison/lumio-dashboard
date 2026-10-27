import SwiftUI

/// The session planner: what's on now, what's next, which lessons still need a
/// plan, and plans waiting for a booking.
struct PlannerView: View {
    @Environment(CoachStore.self) private var store
    @State private var bookings: [BookingRecord] = []
    @State private var plans: [PlanRecord] = []
    @State private var loaded = false
    @State private var error: String?
    @State private var showAll = false
    @State private var newPlan = false
    @State private var building: BookingRecord?
    @State private var toast: Toast?

    var body: some View {
        List {
            if let error { Section { Text(error).foregroundStyle(.red) } }
            if !loaded && error == nil {
                Section { HStack { Spacer(); ProgressView(); Spacer() } }
            } else if loaded {
                if !onNow.isEmpty {
                    Section("On now") { ForEach(onNow) { b in row(b) } }
                }
                if let next = nextUp {
                    Section("Next up") { row(next) }
                }
                Section {
                    if needsPlan.isEmpty {
                        Text("Every upcoming session has a plan. 🎾").foregroundStyle(.secondary)
                    }
                    ForEach(showAll ? needsPlan : Array(needsPlan.prefix(8))) { b in row(b) }
                    if needsPlan.count > 8 && !showAll {
                        Button("Show all \(needsPlan.count)") { showAll = true }
                    }
                } header: { Text("Needs a plan") }

                let planned = upcoming.filter { plan(for: $0) != nil && $0.id != nextUp?.id && !onNow.contains($0) }
                if !planned.isEmpty {
                    Section("Planned") { ForEach(planned.prefix(20)) { b in row(b) } }
                }
                if !unbooked.isEmpty {
                    Section {
                        ForEach(unbooked) { p in
                            NavigationLink { RunSheetView(plan: p, bookings: bookingsWithoutPlan) { await load() } } label: { planRow(p) }
                        }
                    } header: { Text("Needs a booking") } footer: { Text("Plans not tied to a lesson yet. Open one to assign it to a booking.") }
                }
            }
        }
        .navigationTitle("Session planner")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { newPlan = true } label: { Image(systemName: "plus") }.accessibilityLabel("New session plan")
            }
        }
        .sheet(isPresented: $newPlan) {
            PlanEditorView(plan: nil, booking: nil) { text in toast = Toast(text: text); Task { await load() } }
                .environment(store)
        }
        .sheet(item: $building) { b in
            PlanEditorView(plan: nil, booking: b) { text in toast = Toast(text: text); Task { await load() } }
                .environment(store)
        }
        .toast($toast)
        .task { await store.load(); await load() }
        .refreshable { await load() }
        .onChange(of: store.changes) { _, _ in Task { await load() } }
    }

    // MARK: Rows

    @ViewBuilder private func row(_ b: BookingRecord) -> some View {
        if let p = plan(for: b) {
            NavigationLink { RunSheetView(plan: p, booking: b, bookings: bookingsWithoutPlan) { await load() } } label: { bookingRow(b, plan: p) }
        } else {
            Button { building = b } label: { bookingRow(b, plan: nil) }
                .foregroundStyle(.primary)
        }
    }

    private func bookingRow(_ b: BookingRecord, plan: PlanRecord?) -> some View {
        HStack(spacing: 12) {
            Avatar(name: b.playerName ?? b.title ?? "Lesson", size: 40)
            VStack(alignment: .leading, spacing: 3) {
                Text(b.playerName ?? b.title ?? "Lesson").font(.body.weight(.semibold))
                Text([Fmt.dayFriendly(b.bookingDate ?? ""), Fmt.time(b.startTime), b.type, b.court].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "))
                    .font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                if let f = plan?.focus, !f.isEmpty {
                    Text(f).font(.subheadline).lineLimit(1)
                }
            }
            Spacer()
            if let plan {
                if plan.finished { Pill(text: "Finished", systemImage: "checkmark", tint: .green) }
            } else {
                Text("Build").font(.subheadline.weight(.semibold)).foregroundStyle(Color.accentColor)
            }
        }
        .padding(.vertical, 2)
    }

    private func planRow(_ p: PlanRecord) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(p.groupName ?? p.title ?? "Session").font(.body.weight(.semibold))
            Text([p.sessionDate.map(Fmt.dayShort), p.sessionType, p.durationMin.map(Fmt.mins)].compactMap { $0 }.joined(separator: " · "))
                .font(.subheadline).foregroundStyle(.secondary)
            if let f = p.focus { Text(f).font(.subheadline).lineLimit(1) }
        }
    }

    // MARK: Working out the lists (LiveSessionPlanner)

    private func start(_ b: BookingRecord) -> Date? { b.bookingDate.flatMap { Fmt.at($0, b.startTime) } }
    private func end(_ b: BookingRecord) -> Date? { start(b)?.addingTimeInterval(Double((b.durationMin ?? 60) * 60)) }

    private var upcoming: [BookingRecord] {
        bookings.filter { !$0.isCancelled && $0.type != "Block" && ($0.bookingDate ?? "") >= Fmt.todayISO }
            .sorted { (($0.bookingDate ?? ""), ($0.startTime ?? "")) < (($1.bookingDate ?? ""), ($1.startTime ?? "")) }
    }
    private func finished(_ b: BookingRecord) -> Bool { plan(for: b)?.finished == true }
    private var onNow: [BookingRecord] {
        let now = Date()
        return upcoming.filter { b in !finished(b) && (start(b) ?? .distantFuture) <= now && (end(b) ?? .distantPast) > now }
    }
    private var nextUp: BookingRecord? {
        upcoming.first { !finished($0) && (start($0) ?? .distantPast) > Date() }
    }
    private var needsPlan: [BookingRecord] {
        upcoming.filter { plan(for: $0) == nil && (end($0) ?? .distantFuture) > Date() }
    }
    private var bookingsWithoutPlan: [BookingRecord] { upcoming.filter { plan(for: $0) == nil } }
    private var unbooked: [PlanRecord] {
        let live = Set(bookings.filter { !$0.isCancelled }.map(\.id))
        return plans.filter { p in !p.finished && !(p.bookingId.map { live.contains($0) } ?? false) && !bookings.contains { matchesByName(p, $0) && !$0.isCancelled } }
    }

    /// The plan for a booking: by its id, or (older plans) by name and date.
    func plan(for b: BookingRecord) -> PlanRecord? {
        plans.first { $0.bookingId == b.id } ?? plans.first { matchesByName($0, b) }
    }
    private func matchesByName(_ p: PlanRecord, _ b: BookingRecord) -> Bool {
        guard p.bookingId == nil, let g = p.groupName?.trimmingCharacters(in: .whitespaces), !g.isEmpty,
              let n = b.playerName?.trimmingCharacters(in: .whitespaces), g.caseInsensitiveCompare(n) == .orderedSame,
              p.sessionDate == b.bookingDate else { return false }
        if let a = p.playerId, let c = b.playerId, a != c { return false }
        return true
    }

    private func load() async {
        error = nil
        let to = Fmt.iso(Calendar.current.date(byAdding: .day, value: 31, to: Date()) ?? Date())
        do {
            async let b: [BookingRecord] = Rows.list("coach_bookings", [("booking_date", "gte.\(Fmt.todayISO)"), ("booking_date", "lte.\(to)"), ("status", "neq.cancelled")], order: "booking_date.asc")
            async let p: [PlanRecord] = Rows.list("coach_session_plans", order: "created_at.desc", limit: 500)
            (bookings, plans) = try await (b, p)
            loaded = true
        } catch {
            self.error = error.localizedDescription
        }
    }
}
