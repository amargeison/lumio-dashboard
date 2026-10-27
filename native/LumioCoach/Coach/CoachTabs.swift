import SwiftUI

struct CoachTabs: View {
    @Environment(AppModel.self) private var model
    @State private var unread = 0
    @State private var store = CoachStore()

    var body: some View {
        @Bindable var model = model
        TabView(selection: $model.coachTab) {
            NavigationStack { TodayView() }
                .tabItem { Label("Today", systemImage: "sun.max") }
                .tag(CoachTab.today)
            NavigationStack { CalendarView() }
                .tabItem { Label("Calendar", systemImage: "calendar") }
                .tag(CoachTab.calendar)
            NavigationStack { PlayersView() }
                .tabItem { Label("Players", systemImage: "person.2") }
                .tag(CoachTab.players)
            NavigationStack { InboxView(unread: $unread) }
                .tabItem { Label("Messages", systemImage: "bubble.left.and.bubble.right") }
                .badge(unread)
                .tag(CoachTab.messages)
            NavigationStack { CoachMoreView() }
                .tabItem { Label("More", systemImage: "ellipsis.circle") }
                .tag(CoachTab.more)
        }
        .environment(store)
        .task {
            await store.load()
            // The unread count for the tab badge, before the inbox is opened.
            if let r: ConversationsResponse = try? await API.shared.get("/api/app/v1/coach/messages") {
                unread = r.conversations.reduce(0) { $0 + $1.unread }
            }
        }
    }
}

/// One booking in a list: time, who, where, and what the client has said.
struct BookingRow: View {
    let booking: AppBooking

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .trailing, spacing: 2) {
                Text(Fmt.time(booking.time)).font(.subheadline.weight(.semibold)).monospacedDigit()
                Text(Fmt.endTime(booking.time, mins: booking.mins)).font(.caption).foregroundStyle(.secondary).monospacedDigit()
            }
            .frame(width: 48, alignment: .trailing)
            RoundedRectangle(cornerRadius: 2).fill(stripe).frame(width: 4)
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    if booking.clientConfirmed != nil {
                        Image(systemName: "checkmark.circle.fill").foregroundStyle(.green).accessibilityLabel("Confirmed by the client")
                    }
                    Text(booking.title).font(.body.weight(.semibold)).strikethrough(booking.isCancelled).lineLimit(1)
                }
                Text(detail).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                if booking.isCancelled || booking.isPending || booking.paid {
                    HStack(spacing: 6) {
                        if booking.isCancelled { Pill(text: booking.cancelledByClient ? "Cancelled by client" : "Cancelled", tint: .red) }
                        if booking.isPending { Pill(text: "Waiting to confirm", systemImage: "clock", tint: .orange) }
                        if booking.paid { Pill(text: "Paid", systemImage: "sterlingsign.circle", tint: .green) }
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, 4)
        .opacity(booking.isCancelled ? 0.6 : 1)
        .accessibilityElement(children: .combine)
    }

    private var stripe: Color {
        if booking.isCancelled { return .red.opacity(0.5) }
        if booking.isGroup { return .purple }
        return .accentColor
    }

    private var detail: String {
        [booking.type, booking.court, booking.coach, booking.headcount.map { "\($0) playing" }]
            .compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
    }
}

/// A booking, opened: who and when, what the client has said, and the
/// coach's actions — edit or move, cancel, delete, and take payment.
struct BookingDetailView: View {
    @Environment(AppModel.self) private var model
    @Environment(CoachStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let booking: AppBooking
    @State private var player: AppPlayer?
    @State private var record: BookingRecord?
    @State private var editing = false
    @State private var pay = PayModel()
    @State private var toast: Toast?
    @State private var working = false
    @State private var summarising = false

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    Text(booking.title).font(.title2.bold()).strikethrough(booking.isCancelled)
                    Text("\(Fmt.dayLong(booking.date)) · \(Fmt.time(booking.time))–\(Fmt.endTime(booking.time, mins: booking.mins))")
                        .foregroundStyle(.secondary)
                    if booking.isCancelled { Pill(text: booking.cancelledByClient ? "Cancelled by the client" : "Cancelled", tint: .red) }
                }
                .padding(.vertical, 4)
            }
            // Only for a booking with a client on the roster.
            if booking.playerId != nil { Section("Client") {
                if let c = booking.clientConfirmed {
                    Label("Confirmed by \(c.by ?? "the client"), \(Fmt.moment(c.at))", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
                } else if booking.cancelledByClient {
                    Label("Cancelled by the client", systemImage: "xmark.circle.fill").foregroundStyle(.red)
                } else if booking.isPending {
                    Label("Waiting for them to confirm", systemImage: "clock").foregroundStyle(.orange)
                } else if !booking.isCancelled {
                    Label(isPast ? "They didn't confirm" : "Not confirmed yet", systemImage: "circle.dashed").foregroundStyle(.secondary)
                }
                if let p = player {
                    ContactButtons(player: p)
                } else if booking.playerId != nil {
                    // Keeps the layout still while the player loads.
                    Color.clear.frame(height: 62)
                }
            } }
            Section("Details") {
                LabeledContent("Type", value: booking.type ?? "—")
                if let court = booking.court { LabeledContent("Court", value: court) }
                if let coach = booking.coach { LabeledContent("Coach", value: coach) }
                if let n = booking.headcount { LabeledContent("Playing", value: "\(n)") }
                LabeledContent("Payment", value: booking.paid ? "Paid" : "Not paid yet")
                if let notes = booking.notes { Text(notes).font(.callout).foregroundStyle(.secondary) }
            }

            ChargeSection(pay: pay, booking: booking, playerName: player?.name ?? booking.playerName ?? booking.title, toast: $toast) {
                store.saved()
            }

            Section {
                if isPast && !booking.isCancelled && booking.type != "Block" {
                    Button { summarising = true } label: { Label("Write a lesson summary", systemImage: "square.and.pencil") }
                }
                Button { Task { await openEditor() } } label: { Label("Edit or move", systemImage: "calendar.badge.clock") }
                    .disabled(working)
                if !booking.isCancelled {
                    CancelBookingButton { by in await cancel(by: by) }
                }
                ConfirmButton(title: "Delete booking", icon: "trash", prompt: deletePrompt, confirm: "Delete", destructive: true) {
                    await remove()
                }
            }

            if let p = player {
                Section {
                    NavigationLink(value: p) { Label("Open \(p.name)'s profile", systemImage: "person.crop.circle") }
                }
            }
        }
        .navigationTitle(Fmt.dayShort(booking.date))
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: AppPlayer.self) { PlayerDetailView(player: $0) }
        .toast($toast)
        .sheet(isPresented: $editing) {
            if let record {
                BookingFormView(existing: record) { _ in dismiss() }
                    .environment(store)
            }
        }
        .sheet(isPresented: $summarising) {
            NavigationStack {
                SummaryFormView(existing: nil, presetPlayerId: booking.playerId, presetDate: booking.date) { text in toast = Toast(text: text) }
            }
            .environment(store)
        }
        .task {
            async let pays: Void = pay.load()
            if let id = booking.playerId, let d: PlayerDetail = try? await API.shared.get("/api/app/v1/coach/players/\(id)") { player = d.player }
            _ = await pays
        }
    }

    private var isPast: Bool { (Fmt.at(booking.date, booking.time) ?? .distantFuture) < Date() }

    private var deletePrompt: String {
        var p = "Delete this booking?"
        if booking.date >= Fmt.todayISO && !booking.isCancelled && booking.playerId != nil {
            p += " If the family has been told about it, they'll be sent a note that it's cancelled."
        }
        return p
    }

    private func openEditor() async {
        working = true
        defer { working = false }
        do {
            let rows: [BookingRecord] = try await Rows.list("coach_bookings", [("id", booking.id)])
            guard let r = rows.first else { toast = Toast(text: "That booking has gone.", isError: true); return }
            record = r
            editing = true
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func cancel(by: String) async {
        do {
            let _: BookingRecord = try await Rows.update("coach_bookings", id: booking.id, ["status": .string("cancelled"), "cancelled_by": .string(by)])
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            store.saved()
            dismiss()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func remove() async {
        do {
            try await Rows.delete("coach_bookings", id: booking.id)
            store.saved()
            dismiss()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// "Cancel lesson", asking who called it off: the coach (nothing to pay) or
/// the client (the cancellation policy applies).
struct CancelBookingButton: View {
    let cancel: (String) async -> Void
    @State private var asking = false

    var body: some View {
        Button(role: .destructive) { asking = true } label: { Label("Cancel lesson", systemImage: "xmark.circle") }
            .confirmationDialog("Who is cancelling?", isPresented: $asking, titleVisibility: .visible) {
                Button("I'm calling it off") { Task { await cancel("coach") } }
                Button("They cancelled") { Task { await cancel("client") } }
                Button("Keep it", role: .cancel) {}
            } message: {
                Text("The family is told straight away. If they cancelled late, a fee can then be charged under your cancellation policy.")
            }
    }
}

/// Call, text and email — the parent for a junior, else the player.
struct ContactButtons: View {
    let player: AppPlayer
    var body: some View {
        HStack(spacing: 10) {
            if let phone = player.contactPhone {
                contact("Call", "phone.fill") { Contact.call(phone) }
                contact("Text", "message.fill") { Contact.text(phone) }
            }
            if let email = player.contactEmail {
                contact("Email", "envelope.fill") { Contact.email(email) }
            }
        }
        .buttonStyle(.borderless)
        .padding(.vertical, 4)
    }

    private func contact(_ title: String, _ icon: String, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon).font(.title3)
                Text(title).font(.caption)
            }
            .frame(maxWidth: .infinity, minHeight: 54)
            .background(Color.accentColor.opacity(0.1), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .accessibilityLabel("\(title) \(player.contactName)")
    }
}
