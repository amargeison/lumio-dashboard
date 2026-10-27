import SwiftUI

/// A week at a time: a strip of days, and the chosen day's bookings.
struct CalendarView: View {
    @Environment(AppModel.self) private var model
    @State private var weekStart: Date = CalendarView.monday(of: Date())
    @State private var selected: String = Fmt.todayISO
    @State private var bookings: [AppBooking] = []
    @State private var loading = false
    @State private var error: String?

    private static var cal: Calendar = { var c = Calendar(identifier: .gregorian); c.timeZone = Fmt.london; c.firstWeekday = 2; return c }()
    static func monday(of d: Date) -> Date {
        cal.date(from: cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: d)) ?? d
    }
    private var days: [Date] { (0..<7).compactMap { Self.cal.date(byAdding: .day, value: $0, to: weekStart) } }
    private var dayBookings: [AppBooking] { bookings.filter { $0.date == selected } }

    var body: some View {
        VStack(spacing: 0) {
            weekStrip
            Divider()
            List {
                if let error {
                    Text(error).foregroundStyle(.red)
                }
                Section(Fmt.dayLong(selected)) {
                    if dayBookings.isEmpty && !loading {
                        Text("Nothing booked.").foregroundStyle(.secondary)
                    }
                    ForEach(dayBookings) { b in NavigationLink(value: b) { BookingRow(booking: b) } }
                }
            }
            .listStyle(.insetGrouped)
            .overlay { if loading && bookings.isEmpty { ProgressView() } }
            .refreshable { await load() }
        }
        .navigationTitle(monthTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Today") { jump(to: Date()) }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button { model.web = WebTarget(path: model.coachWebPath("calendar"), title: "Booking Calendar") } label: { Image(systemName: "plus") }
                    .accessibilityLabel("Add a booking")
            }
        }
        .navigationDestination(for: AppBooking.self) { BookingDetailView(booking: $0) }
        .task(id: weekStart) { await load() }
    }

    private var weekStrip: some View {
        HStack(spacing: 4) {
            Button { shift(-7) } label: { Image(systemName: "chevron.left").frame(width: 28, height: 44) }
                .accessibilityLabel("Previous week")
            ForEach(days, id: \.self) { d in
                let iso = Fmt.iso(d)
                let count = bookings.filter { $0.date == iso && !$0.isCancelled }.count
                Button { selected = iso } label: {
                    VStack(spacing: 3) {
                        Text(d.formatted(.dateTime.weekday(.narrow))).font(.caption2).foregroundStyle(.secondary)
                        Text(d.formatted(.dateTime.day())).font(.callout.weight(iso == selected ? .bold : .regular)).monospacedDigit()
                        Circle().fill(count > 0 ? Color.accentColor : .clear).frame(width: 5, height: 5)
                    }
                    .frame(maxWidth: .infinity, minHeight: 56)
                    .foregroundStyle(iso == selected ? Color.white : (iso == Fmt.todayISO ? Color.accentColor : Color.primary))
                    .background(iso == selected ? Color.accentColor : .clear, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
                .accessibilityLabel("\(Fmt.dayLong(iso)), \(count) booking\(count == 1 ? "" : "s")")
            }
            Button { shift(7) } label: { Image(systemName: "chevron.right").frame(width: 28, height: 44) }
                .accessibilityLabel("Next week")
        }
        .padding(.horizontal, 6).padding(.vertical, 8)
        .gesture(DragGesture(minimumDistance: 30).onEnded { v in
            if v.translation.width < -40 { shift(7) } else if v.translation.width > 40 { shift(-7) }
        })
    }

    private var monthTitle: String { (Fmt.day(selected) ?? weekStart).formatted(.dateTime.month(.wide).year()) }

    private func shift(_ days: Int) {
        guard let w = Self.cal.date(byAdding: .day, value: days, to: weekStart) else { return }
        weekStart = w
        if let s = Fmt.day(selected), let moved = Self.cal.date(byAdding: .day, value: days, to: s) { selected = Fmt.iso(moved) }
        UISelectionFeedbackGenerator().selectionChanged()
    }

    private func jump(to d: Date) {
        weekStart = Self.monday(of: d)
        selected = Fmt.iso(d)
    }

    private func load() async {
        loading = true; error = nil
        defer { loading = false }
        let from = Fmt.iso(weekStart)
        let to = Fmt.iso(Self.cal.date(byAdding: .day, value: 6, to: weekStart) ?? weekStart)
        do {
            let r: BookingRange = try await API.shared.get("/api/app/v1/coach/bookings", query: ["from": from, "to": to])
            bookings = r.bookings
        } catch {
            self.error = error.localizedDescription
        }
    }
}
