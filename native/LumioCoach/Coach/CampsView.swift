import SwiftUI

/// Training camps: upcoming and past, each with its register, money and trip.
struct CampsView: View {
    @Environment(CoachStore.self) private var store
    @State private var state: Loadable<[CampRecord]> = .loading
    @State private var showPast = false

    var body: some View {
        Group {
            switch state {
            case .loading: ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .failed(let m): LoadFailed(message: m) { await load() }
            case .loaded(let camps):
                let upcoming = camps.filter { !$0.past }.sorted { ($0.startDate ?? "") < ($1.startDate ?? "") }
                let past = camps.filter(\.past)
                List {
                    Section("Upcoming") {
                        if upcoming.isEmpty { Text("No camps coming up. Create camps on the website.").foregroundStyle(.secondary) }
                        ForEach(upcoming) { c in NavigationLink { CampDetailView(camp: c) } label: { row(c) } }
                    }
                    if !past.isEmpty {
                        Section {
                            DisclosureGroup("Past camps · \(past.count)", isExpanded: $showPast) {
                                ForEach(past) { c in NavigationLink { CampDetailView(camp: c) } label: { row(c) } }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Camps")
        .task { await load() }
        .refreshable { await load() }
    }

    private func row(_ c: CampRecord) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(c.name).font(.body.weight(.semibold))
            Text([dates(c), c.location ?? c.region].compactMap { $0 }.joined(separator: " · ")).font(.subheadline).foregroundStyle(.secondary)
        }
    }

    private func dates(_ c: CampRecord) -> String? {
        guard let s = c.startDate else { return nil }
        if let e = c.endDate, e != s { return "\(Fmt.dayShort(s)) – \(Fmt.dayShort(e))" }
        return Fmt.dayShort(s)
    }

    private func load() async {
        do { state = .loaded(try await Rows.list("coach_camps", order: "start_date.desc", limit: 200)) }
        catch { if state.value == nil { state = .failed(error.localizedDescription) } }
    }
}

/// One camp: who's coming, what's been paid, forms, the trip, and messaging everyone.
struct CampDetailView: View {
    @Environment(CoachStore.self) private var store
    @State var camp: CampRecord
    @State private var people: [AttendeeRecord] = []
    @State private var loaded = false
    @State private var adding = false
    @State private var messaging = false
    @State private var toast: Toast?

    private var live: [AttendeeRecord] { people.filter { !$0.cancelled } }
    private var booked: Int { live.reduce(0) { $0 + $1.due(camp) } }
    private var collected: Int { live.reduce(0) { $0 + $1.received(camp) } }

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text(camp.name).font(.title2.bold())
                    Text([camp.startDate.map { Fmt.dayLong($0) }, camp.endDate.flatMap { $0 != camp.startDate ? "to \(Fmt.dayLong($0))" : nil }].compactMap { $0 }.joined(separator: " ")).foregroundStyle(.secondary)
                    if let l = camp.location ?? camp.region { Label(l, systemImage: "mappin.and.ellipse").font(.subheadline) }
                }
                .padding(.vertical, 4)
                HStack {
                    stat("\(live.count)\(camp.capacity.map { "/\($0)" } ?? "")", "Booked")
                    stat(Fmt.money(camp.pricePennies), "Per head")
                    stat(Fmt.money(collected), "Collected")
                    stat(Fmt.money(max(0, booked - collected)), "Still owed")
                }
            }

            Section {
                if !loaded { HStack { Spacer(); ProgressView(); Spacer() } }
                if loaded && people.isEmpty { Text("No one booked yet.").foregroundStyle(.secondary) }
                ForEach(people.sorted { ($0.cancelled ? 1 : 0, $0.playerName) < ($1.cancelled ? 1 : 0, $1.playerName) }) { a in
                    NavigationLink { AttendeeView(camp: camp, attendee: a) { await load() } } label: { attendeeRow(a) }
                }
                Button { adding = true } label: { Label("Add a player", systemImage: "person.badge.plus") }
            } header: { Text("Who's coming") }

            Section {
                Button { messaging = true } label: { Label("Message everyone on the camp", systemImage: "bubble.left.and.bubble.right") }
                    .disabled(live.isEmpty)
                let missing = live.filter { $0.formSubmittedAt == nil }.count
                if missing > 0 {
                    Button { Task { await sendForms(nil) } } label: { Label("Send the info form to \(missing) still to answer", systemImage: "list.clipboard") }
                }
            }

            if let trip = camp.trip { TripSection(camp: $camp, trip: trip) }
        }
        .navigationTitle(camp.name)
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .task { await load() }
        .refreshable { await load() }
        .sheet(isPresented: $adding) {
            NavigationStack {
                PlayerChooser(allowNew: false, selected: nil) { id in if let id { Task { await add(id) } } }
                    .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { adding = false } } }
            }
            .environment(store)
        }
        .sheet(isPresented: $messaging) {
            CampMessageView(camp: camp, people: live) { t in toast = Toast(text: t) }
        }
    }

    private func attendeeRow(_ a: AttendeeRecord) -> some View {
        let (state, tint) = a.payState(camp)
        return HStack(spacing: 12) {
            Avatar(name: a.playerName, size: 36)
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(a.playerName).font(.body.weight(.semibold)).strikethrough(a.cancelled)
                    if !(a.medicalNotes ?? "").isEmpty { Image(systemName: "cross.case.fill").foregroundStyle(.red).font(.caption).accessibilityLabel("Medical notes") }
                    if a.playerId == nil { Pill(text: "Not on roster", tint: .secondary) }
                }
                HStack(spacing: 6) {
                    Pill(text: state, tint: tint)
                    if a.formSubmittedAt == nil && !a.cancelled { Text("Form to do").font(.caption).foregroundStyle(.orange) }
                    if let r = a.room, !r.isEmpty { Text(r).font(.caption).foregroundStyle(.secondary) }
                }
            }
        }
    }

    private func stat(_ v: String, _ l: String) -> some View {
        VStack(spacing: 2) {
            Text(v).font(.subheadline.weight(.bold)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.7)
            Text(l).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func load() async {
        people = (try? await Rows.list("coach_camp_attendees", [("camp_id", "eq.\(camp.id)")], order: "player_name.asc")) ?? people
        loaded = true
    }

    private func add(_ playerId: String) async {
        adding = false
        guard let p = store.player(playerId) else { return }
        do {
            let a: AttendeeRecord = try await Rows.insert("coach_camp_attendees", ["camp_id": .string(camp.id), "player_id": .string(p.id), "player_name": .string(p.name)])
            // The website confirms the place straight after: in-app note and email with the info form.
            struct Body: Encodable { let attendeeId: String }
            struct Answer: Decodable { let emailedTo: String? }
            let r: Answer? = try? await API.shared.post("/api/coach/camps/confirm", body: Body(attendeeId: a.id))
            toast = Toast(text: "\(p.name) is booked on.\(r?.emailedTo.map { " Confirmation sent to \($0)." } ?? "")")
            await load()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func sendForms(_ attendeeId: String?) async {
        struct Body: Encodable { let campId: String; let attendeeId: String? }
        struct Answer: Decodable { let sent: Int?; let noAddress: [String]? }
        do {
            let r: Answer = try await API.shared.post("/api/coach/camps/form-send", body: Body(campId: camp.id, attendeeId: attendeeId))
            var t = "Sent to \(r.sent ?? 0)."
            if let n = r.noAddress, !n.isEmpty { t += " No email for \(n.joined(separator: ", "))." }
            toast = Toast(text: t)
            await load()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// One person on a camp: contacts, medical, room and arrival, and what they've paid.
struct AttendeeView: View {
    @Environment(\.dismiss) private var dismiss
    let camp: CampRecord
    @State var attendee: AttendeeRecord
    let changed: () async -> Void
    @State private var received = ""
    @State private var room = ""
    @State private var arrival = ""
    @State private var goal = ""
    @State private var toast: Toast?

    var body: some View {
        let a = attendee
        let pay = a.payState(camp)
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text(a.playerName).font(.title2.bold())
                    Text([a.playerAge.map { "Age \($0)" }, a.parentName.map { "Parent: \($0)" }].compactMap { $0 }.joined(separator: " · ")).foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
                HStack(spacing: 10) {
                    if let phone = a.parentPhone, !phone.isEmpty {
                        contact("Call", "phone.fill") { Contact.call(phone) }
                        contact("Text", "message.fill") { Contact.text(phone) }
                    }
                    if let email = a.parentEmail, !email.isEmpty { contact("Email", "envelope.fill") { Contact.email(email) } }
                }
                .buttonStyle(.borderless)
            }

            Section("Health and emergencies") {
                if let m = a.medicalNotes, !m.isEmpty { Label { Text(m) } icon: { Image(systemName: "cross.case.fill").foregroundStyle(.red) } }
                else { Text("No medical notes.").foregroundStyle(.secondary) }
                if let e = a.emergencyContact, !e.isEmpty { LabeledContent("Emergency contact", value: e) }
                LabeledContent("Photo consent", value: a.consentPhoto == true ? "Yes" : "No")
                LabeledContent("First aid consent", value: a.consentMedical == true ? "Yes" : "No")
                LabeledContent("Info form", value: a.formSubmittedAt != nil ? "Answered" : (a.formSentAt != nil ? "Sent, not answered" : "Not sent"))
            }

            Section {
                TextField("Room", text: $room).onSubmit { Task { await save(["room": .text(room)]) } }
                TextField("Arriving (flight, time)", text: $arrival).onSubmit { Task { await save(["arrival": .text(arrival)]) } }
                TextField("Their goal for the camp", text: $goal).onSubmit { Task { await save(["camp_goal": .text(goal)]) } }
            } header: { Text("On the camp") } footer: { Text("Press return to save each one.") }

            Section {
                LabeledContent("Due", value: Fmt.money(a.due(camp)))
                LabeledContent("Received", value: Fmt.money(a.received(camp)))
                HStack { Text("Status"); Spacer(); Pill(text: pay.0, tint: pay.1) }
                if !a.cancelled {
                    Button { Task { await togglePaid() } } label: {
                        Label(a.paid == true ? "Untick paid in full" : "Mark paid in full", systemImage: a.paid == true ? "arrow.uturn.backward.circle" : "checkmark.circle")
                    }
                    HStack {
                        TextField("Amount received (£)", text: $received).keyboardType(.decimalPad)
                        Button("Save") { Task { await saveReceived() } }.disabled(received.isEmpty)
                    }
                }
            } header: { Text("Money") }

            Section {
                ConfirmButton(title: "Remove from the camp", icon: "person.badge.minus", prompt: "Take \(a.playerName) off \(camp.name)?", confirm: "Remove", destructive: true) { await remove() }
            }
        }
        .navigationTitle(a.playerName)
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .onAppear {
            room = attendee.room ?? ""; arrival = attendee.arrival ?? ""; goal = attendee.campGoal ?? ""
        }
    }

    private func contact(_ title: String, _ icon: String, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) { Image(systemName: icon).font(.title3); Text(title).font(.caption) }
                .frame(maxWidth: .infinity, minHeight: 54)
                .background(Color.accentColor.opacity(0.1), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private func save(_ row: RowValues) async {
        do {
            attendee = try await Rows.update("coach_camp_attendees", id: attendee.id, row)
            toast = Toast(text: "Saved.")
            await changed()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    /// FinanceBoard rules: ticking confirms a pending online place; unticking an unpaid online one puts it back to pending.
    private func togglePaid() async {
        let a = attendee
        var row: RowValues = ["paid": .bool(a.paid != true)]
        if a.paid != true, a.status == "pending" { row["status"] = .string("confirmed"); row["paid_pennies"] = .int(a.paidPennies ?? 0) }
        if a.paid == true, a.status == "confirmed", a.source == "signup", (a.amountPennies ?? 0) > 0, (a.paidPennies ?? 0) == 0 { row["status"] = .string("pending") }
        await save(row)
    }

    private func saveReceived() async {
        guard let x = Fmt.pennies(received.replacingOccurrences(of: ",", with: ".")) else { toast = Toast(text: "Enter an amount in pounds, like 150 or 75.50.", isError: true); return }
        let due = attendee.due(camp)
        var row: RowValues = ["paid_pennies": .int(x), "paid": .bool(due > 0 && x >= due)]
        if x > 0, attendee.status == "pending" { row["status"] = .string("confirmed") }
        received = ""
        await save(row)
    }

    private func remove() async {
        do { try await Rows.delete("coach_camp_attendees", id: attendee.id); await changed(); dismiss() }
        catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// The trip hub: where they're staying, travel and contacts — and sharing the trip page.
struct TripSection: View {
    @Binding var camp: CampRecord
    let trip: CampRecord.Trip
    @State private var toast: Toast?

    var body: some View {
        Section {
            if let i = trip.intro, !i.isEmpty { Text(i).font(.subheadline) }
            if let s = trip.stay, let n = s.name, !n.isEmpty { place("Staying", s, icon: "bed.double") }
            if let v = trip.venue, let n = v.name, !n.isEmpty { place("Tennis", v, icon: "figure.tennis") }
            if let t = trip.travel {
                ForEach([("Airport", t.airport), ("Flights", t.flights), ("Transfers", t.transfers), ("Arriving", t.arrival), ("Leaving", t.departure)].compactMap { k, v in v.flatMap { $0.isEmpty ? nil : (k, $0) } }, id: \.0) { k, v in
                    LabeledContent(k) { Text(v).multilineTextAlignment(.trailing) }
                }
            }
            ForEach(trip.contacts ?? [], id: \.self) { c in
                Button { if let p = c.phone { Contact.call(p) } } label: {
                    Label { VStack(alignment: .leading) {
                        Text(c.name ?? "Contact").foregroundStyle(.primary)
                        Text([c.role, c.phone].compactMap { $0 }.joined(separator: " · ")).font(.caption).foregroundStyle(.secondary)
                    } } icon: { Image(systemName: "phone.circle.fill") }
                }
                .disabled(c.phone == nil)
            }
            if let bring = trip.bring, !bring.isEmpty { LabeledContent("Bring") { Text(bring.joined(separator: ", ")).multilineTextAlignment(.trailing) } }
            if camp.tripOpen == true, let slug = camp.tripSlug, let url = URL(string: "\(Config.site.absoluteString)/trip/\(slug)") {
                ShareLink(item: url) { Label("Share the trip page", systemImage: "square.and.arrow.up") }
                Button(role: .destructive) { Task { await share(false) } } label: { Label("Stop sharing", systemImage: "eye.slash") }
            } else {
                Button { Task { await share(true) } } label: { Label("Share the trip page with families", systemImage: "eye") }
            }
        } header: { Text("The trip") }
        .toast($toast)
    }

    private func place(_ label: String, _ p: CampRecord.Trip.Place, icon: String) -> some View {
        Button {
            let q = [p.name, p.address].compactMap { $0 }.joined(separator: ", ").addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
            if let u = URL(string: "maps://?q=\(q)") { UIApplication.shared.open(u) }
        } label: {
            Label { VStack(alignment: .leading, spacing: 2) {
                Text("\(label): \(p.name ?? "")").foregroundStyle(.primary)
                if let a = p.address, !a.isEmpty { Text(a).font(.caption).foregroundStyle(.secondary) }
                if let n = p.notes, !n.isEmpty { Text(n).font(.caption).foregroundStyle(.secondary) }
            } } icon: { Image(systemName: icon) }
        }
    }

    private func share(_ on: Bool) async {
        var row: RowValues = ["trip_open": .bool(on)]
        if on && (camp.tripSlug ?? "").isEmpty {
            let base = camp.name.lowercased().map { $0.isLetter || $0.isNumber ? $0 : "-" }.reduce("") { $0 + String($1) }
            row["trip_slug"] = .string(String(base.split(separator: "-").joined(separator: "-").prefix(40)) + "-" + String(UUID().uuidString.prefix(4)).lowercased())
        }
        do { camp = try await Rows.update("coach_camps", id: camp.id, row) }
        catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// Message the whole camp — players, families and the camp's coaches — in the app and by email.
struct CampMessageView: View {
    @Environment(\.dismiss) private var dismiss
    let camp: CampRecord
    let people: [AttendeeRecord]
    let sent: (String) -> Void
    @State private var text = ""
    @State private var email = true
    @State private var sending = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section { Text("\(people.count) on \(camp.name)").foregroundStyle(.secondary) }
                Section {
                    Toggle("Also by email", isOn: $email)
                    TextField("Message", text: $text, axis: .vertical).lineLimit(5...14)
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle("Message the camp")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if sending { ProgressView() } else { Button("Send") { Task { await send() } }.disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) }
                }
            }
        }
    }

    private func send() async {
        sending = true; error = nil
        defer { sending = false }
        struct To: Encodable { let playerId: String?; let attendeeId: String?; let name: String }
        struct Body: Encodable { let recipients: [To]; let channels: [String]; let body: String; let campId: String }
        struct Answer: Decodable { let status: String?; let results: [R]?; struct R: Decodable { let ok: Bool?; let detail: String? } }
        var seen = Set<String>()
        let to: [To] = people.compactMap { a in
            let key = a.playerId ?? a.id
            guard seen.insert(key).inserted else { return nil }
            return a.playerId != nil ? To(playerId: a.playerId, attendeeId: nil, name: a.playerName) : To(playerId: nil, attendeeId: a.id, name: a.playerName)
        }
        do {
            let r: Answer = try await API.shared.post("/api/coach/message/send", body: Body(recipients: to, channels: email ? ["inapp", "email"] : ["inapp"], body: text.trimmingCharacters(in: .whitespacesAndNewlines), campId: camp.id))
            if r.status == "failed" { error = r.results?.first(where: { $0.ok != true })?.detail ?? "Nothing was sent."; return }
            sent(r.status == "partial" ? "Sent, but not to everyone." : "Sent to the camp.")
            dismiss()
        } catch { self.error = error.localizedDescription }
    }
}
