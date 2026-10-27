import SwiftUI

struct CoachTabs: View {
    @Environment(AppModel.self) private var model
    @State private var unread = 0

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
        .task {
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

/// A booking, opened.
struct BookingDetailView: View {
    @Environment(AppModel.self) private var model
    let booking: AppBooking
    @State private var player: AppPlayer?

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    Text(booking.title).font(.title2.bold())
                    Text("\(Fmt.dayLong(booking.date)) · \(Fmt.time(booking.time))–\(Fmt.endTime(booking.time, mins: booking.mins))")
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            }
            Section("Client") {
                if let c = booking.clientConfirmed {
                    Label("Confirmed by \(c.by ?? "the client"), \(Fmt.moment(c.at))", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
                } else if booking.cancelledByClient {
                    Label("Cancelled by the client", systemImage: "xmark.circle.fill").foregroundStyle(.red)
                } else if booking.isPending {
                    Label("Waiting for them to confirm", systemImage: "clock").foregroundStyle(.orange)
                } else {
                    Label("Not confirmed yet", systemImage: "circle.dashed").foregroundStyle(.secondary)
                }
                if let p = player {
                    ContactButtons(player: p)
                }
            }
            Section("Details") {
                LabeledContent("Type", value: booking.type ?? "—")
                if let court = booking.court { LabeledContent("Court", value: court) }
                if let coach = booking.coach { LabeledContent("Coach", value: coach) }
                if let n = booking.headcount { LabeledContent("Playing", value: "\(n)") }
                LabeledContent("Payment", value: booking.paid ? "Paid" : "Not paid yet")
                if let notes = booking.notes { Text(notes).font(.callout).foregroundStyle(.secondary) }
            }
            Section {
                Button {
                    model.web = WebTarget(path: model.coachWebPath("calendar"), title: "Booking Calendar")
                } label: { Label("Edit, move or charge in the calendar", systemImage: "calendar.badge.clock") }
                if let p = player {
                    NavigationLink(value: p) { Label("Open \(p.name)'s profile", systemImage: "person.crop.circle") }
                }
            }
        }
        .navigationTitle(Fmt.dayShort(booking.date))
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: AppPlayer.self) { PlayerDetailView(player: $0) }
        .task {
            guard let id = booking.playerId else { return }
            if let d: PlayerDetail = try? await API.shared.get("/api/app/v1/coach/players/\(id)") { player = d.player }
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
