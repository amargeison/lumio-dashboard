import SwiftUI
import Observation

/// Taking payment for a booking: the lesson, a no-show, or a late cancellation —
/// from the card or Direct Debit on file, or with a payment link to share.
/// The server works out the amount and checks packs, plans and the
/// cancellation policy, exactly as on the website.
@MainActor
@Observable
final class PayModel {
    var cards: PayCards?
    func load() async {
        cards = try? await API.shared.request("GET", "/api/coach/pay/cards", body: Optional<Empty>.none, decoder: Rows.decoder)
    }
}

struct ChargeSection: View {
    let pay: PayModel
    let booking: AppBooking
    let playerName: String
    @Binding var toast: Toast?
    let changed: () -> Void

    @State private var busy = false
    @State private var link: URL?
    private var cards: PayCards? { pay.cards }

    enum Kind: String, Identifiable {
        case lesson, no_show, late_cancel
        var id: String { rawValue }
        var title: String {
            switch self {
            case .lesson: return "Charge for the lesson"
            case .no_show: return "They did not turn up"
            case .late_cancel: return "Late cancellation fee"
            }
        }
        var icon: String {
            switch self {
            case .lesson: return "sterlingsign.circle"
            case .no_show: return "person.fill.questionmark"
            case .late_cancel: return "clock.badge.xmark"
            }
        }
    }

    private var first: String { playerName.split(separator: " ").first.map(String.init) ?? playerName }
    private var card: PayCards.Method? { cards?.card(for: booking.playerId) }
    private var charges: [PayCards.Charge] { (cards?.charges ?? []).filter { $0.bookingId == booking.id } }
    private var started: Bool { (Fmt.at(booking.date, booking.time) ?? .distantFuture) <= Date() }
    private var kinds: [Kind] {
        let live = Set(charges.filter(\.live).compactMap(\.kind))
        var k: [Kind] = []
        if booking.isCancelled {
            if !live.contains("late_cancel") { k.append(.late_cancel) }
        } else {
            if !live.contains("lesson") && !live.contains("no_show") { k.append(.lesson) }
            if started && !live.contains("no_show") && !live.contains("lesson") { k.append(.no_show) }
        }
        return k
    }

    var body: some View {
        Group {
            if let cards, cards.chargesEnabled == true, booking.playerId != nil, booking.type != "Block" {
                Section {
                    ForEach(charges) { c in chargeLine(c) }
                    if let card {
                        Label("\(card.brand?.capitalized ?? (card.kind == "bacs_debit" ? "Direct Debit" : "Card")) •••• \(card.last4 ?? "")", systemImage: card.kind == "bacs_debit" ? "building.columns" : "creditcard")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                    ForEach(kinds) { k in
                        ConfirmButton(title: k.title, icon: k.icon, prompt: prompt(k), confirm: card == nil ? "Make a payment link" : "Take payment") {
                            await charge(k)
                        }
                        .disabled(busy)
                    }
                    if let link {
                        ShareLink(item: link, subject: Text("Payment for your lesson"), message: Text("Here's the link to pay for your lesson.")) {
                            Label("Share the payment link", systemImage: "square.and.arrow.up")
                        }
                    }
                } header: {
                    HStack { Text("Payment"); if busy { ProgressView().padding(.leading, 6) } }
                } footer: {
                    if card == nil && link == nil && !kinds.isEmpty { Text("No card on file — you'll get a payment link to send \(first).") }
                }
            }
        }
    }

    private func prompt(_ k: Kind) -> String {
        if let card { return "\(k.title): take it from \(first)’s \(card.brand?.capitalized ?? "card") •••• \(card.last4 ?? "")? The amount follows your prices and cancellation policy." }
        return "\(k.title): make a payment link for \(first)?"
    }

    private func chargeLine(_ c: PayCards.Charge) -> some View {
        let amount = Fmt.money((c.amountPennies ?? 0) - (c.refundedPennies ?? 0))
        let what = Kind(rawValue: c.kind ?? "")?.title ?? "Payment"
        let (text, tint): (String, Color) = {
            switch c.status {
            case "paid": return ("Paid \(amount)", .green)
            case "processing": return ("\(amount) on its way (Direct Debit)", .teal)
            case "pending", "charging": return ("\(amount) waiting for payment", .orange)
            case "refunded": return ("Refunded", .secondary)
            case "failed": return ("Didn't go through" + (c.failureReason.map { " — \($0)" } ?? ""), .red)
            default: return (c.status ?? "", .secondary)
            }
        }()
        return HStack {
            Text(what).font(.subheadline)
            Spacer()
            Text(text).font(.subheadline.weight(.medium)).foregroundStyle(tint).multilineTextAlignment(.trailing)
        }
    }

    private func load() async { await pay.load() }

    private func charge(_ k: Kind) async {
        guard let playerId = booking.playerId else { return }
        busy = true
        defer { busy = false }
        struct Body: Encodable { let playerId: String; let bookingId: String; let kind: String }
        do {
            let r: ChargeResult = try await API.shared.request("POST", "/api/coach/pay/charge", body: Body(playerId: playerId, bookingId: booking.id, kind: k.rawValue), lenient: true)
            if r.ok == true {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                toast = Toast(text: r.status == "processing" ? "Taken by Direct Debit — it arrives in about 3 working days." : "Paid \(Fmt.money(r.amountPennies ?? 0)).")
                await load(); changed()
                return
            }
            if r.needsClient == true, let amount = r.amountPennies, amount > 0 {
                try await makeLink(k, amount: amount)
                return
            }
            UINotificationFeedbackGenerator().notificationOccurred(.error)
            toast = Toast(text: r.error ?? "That didn't go through.", isError: true)
            await load()
        } catch {
            toast = Toast(text: error.localizedDescription, isError: true)
        }
    }

    private func makeLink(_ k: Kind, amount: Int) async throws {
        struct Body: Encodable {
            let amount: Double; let description: String; let player_name: String
            let booking_id: String; let kind: String; let returnPath: String
        }
        struct Answer: Decodable { let url: String? }
        let r: Answer = try await API.shared.post("/api/coach/pay/checkout", body: Body(
            amount: Double(amount) / 100, description: "\(k == .lesson ? "Lesson" : k.title) · \(playerName)",
            player_name: playerName, booking_id: booking.id, kind: k.rawValue, returnPath: "/"))
        if let u = r.url.flatMap(URL.init(string:)) {
            link = u
            toast = Toast(text: "Payment link ready for \(Fmt.money(amount)) — share it with \(first).")
            await load()
        }
    }
}

/// A list row button that asks first ("Take £45 from Sam's Visa?").
struct ConfirmButton: View {
    let title: String
    let icon: String
    let prompt: String
    let confirm: String
    var destructive = false
    let action: () async -> Void
    @State private var asking = false

    var body: some View {
        Button(role: destructive ? .destructive : nil) { asking = true } label: { Label(title, systemImage: icon) }
            .confirmationDialog(prompt, isPresented: $asking, titleVisibility: .visible) {
                Button(confirm, role: destructive ? .destructive : nil) { Task { await action() } }
                Button("Not now", role: .cancel) {}
            }
    }
}
