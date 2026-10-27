import SwiftUI

/// Book a lesson in one of the coach's free slots: pick a length, a day, a time.
struct BookSessionView: View {
    @Environment(\.dismiss) private var dismiss
    let playerId: String
    let booking: MyBooking
    let booked: (String) -> Void

    @State private var mins: Int = 60
    @State private var days: Loadable<[SlotDay]> = .loading
    @State private var day: String?
    @State private var time: String?
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                if booking.durations.count > 1 {
                    Section("How long") {
                        Picker("Length", selection: $mins) {
                            ForEach(booking.durations, id: \.self) { Text(Fmt.mins($0)).tag($0) }
                        }
                        .pickerStyle(.segmented)
                    }
                }
                switch days {
                case .loading:
                    Section { HStack { Spacer(); ProgressView(); Spacer() } }
                case .failed(let m):
                    Section { Text(m).foregroundStyle(.secondary) }
                case .loaded(let list):
                    let open = list.filter { !$0.slots.isEmpty }
                    if open.isEmpty {
                        Section { Text("No free slots in the next few weeks. Message your coach and they'll find you a time.").foregroundStyle(.secondary) }
                    } else {
                        Section("Day") { dayStrip(open) }
                        if let d = open.first(where: { $0.date == day }) {
                            Section("Time") { timeGrid(d) }
                        }
                    }
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle("Book a \(booking.type.isEmpty ? "session" : booking.type.lowercased())")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            }
            .safeAreaInset(edge: .bottom) {
                if let day, let time {
                    BusyButton(title: "Book \(Fmt.dayShort(day)) at \(time)", systemImage: "checkmark") { await book(day, time) }
                        .padding(.horizontal, 16).padding(.vertical, 10)
                        .background(.bar)
                }
            }
            .task(id: mins) { await load() }
        }
        .onAppear { mins = booking.durations.contains(booking.duration) ? booking.duration : (booking.durations.first ?? 60) }
        .presentationDetents([.large])
    }

    private func dayStrip(_ list: [SlotDay]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(list) { d in
                    let on = d.date == day
                    Button { day = d.date; time = nil; UISelectionFeedbackGenerator().selectionChanged() } label: {
                        VStack(spacing: 2) {
                            Text(Fmt.day(d.date)?.formatted(.dateTime.weekday(.abbreviated)) ?? "").font(.caption.weight(.semibold))
                            Text(Fmt.day(d.date)?.formatted(.dateTime.day()) ?? "").font(.title3.weight(.bold)).monospacedDigit()
                            Text("\(d.slots.count) free").font(.caption2)
                        }
                        .frame(width: 62, height: 72)
                        .foregroundStyle(on ? Color.white : .primary)
                        .background(on ? Color.accentColor : Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(d.label), \(d.slots.count) free")
                }
            }
            .padding(.vertical, 4)
        }
        .listRowInsets(EdgeInsets(top: 6, leading: 12, bottom: 6, trailing: 12))
    }

    private func timeGrid(_ d: SlotDay) -> some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 76), spacing: 8)], spacing: 8) {
            ForEach(d.slots, id: \.self) { t in
                let on = t == time
                Button { time = t; UISelectionFeedbackGenerator().selectionChanged() } label: {
                    Text(t).font(.body.weight(.medium)).monospacedDigit()
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .foregroundStyle(on ? Color.white : Color.accentColor)
                        .background(on ? Color.accentColor : Color.accentColor.opacity(0.1), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.vertical, 4)
    }

    private func load() async {
        days = .loading; error = nil
        do {
            let r: SlotsResponse = try await API.shared.get("/api/portal/book", query: ["playerId": playerId, "mins": String(mins)])
            days = .loaded(r.days)
            let open = r.days.filter { !$0.slots.isEmpty }
            if !open.contains(where: { $0.date == day }) { day = open.first?.date; time = nil }
            else if let d = open.first(where: { $0.date == day }), let t = time, !d.slots.contains(t) { time = nil }
        } catch {
            days = .failed(error.localizedDescription)
        }
    }

    private func book(_ date: String, _ time: String) async {
        struct Body: Encodable { let playerId: String; let date: String; let time: String; let mins: Int }
        do {
            let r: OkNotice = try await API.shared.post("/api/portal/book", body: Body(playerId: playerId, date: date, time: time, mins: mins))
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            booked(r.notice ?? "Booked.")
            dismiss()
        } catch {
            UINotificationFeedbackGenerator().notificationOccurred(.error)
            let message = error.localizedDescription
            self.time = nil
            await load()            // the slot may have just gone: show what's free now
            self.error = message
        }
    }
}
