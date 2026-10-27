import SwiftUI

/// The two pipelines and their stages (lib/coach/leads.ts).
enum Pipelines {
    static let coaching = ["Enquired", "Contacted", "Communicated with", "Trial", "Keen for future", "Not keen", "Joined"]
    static let holiday = ["Enquired", "Contact attempted", "Spoken to", "Keen for future", "Not keen", "Already been"]
    static let sources = ["Meta ad", "Website", "Referral", "Google", "Walk-in", "Import", "Other"]
    static let methods = ["WhatsApp", "Email", "Phone", "In person"]

    static func stages(_ p: String?) -> [String] { p == "holiday" ? holiday : coaching }
    static func closed(_ p: String?) -> [String] { p == "holiday" ? ["Not keen", "Already been"] : ["Not keen", "Joined"] }

    /// Points for a move: Joined 5, Trial / Spoken to 2, any other step forward 1, back 0.
    static func points(_ p: String?, from: String?, to: String) -> Int {
        let st = stages(p)
        let a = from.flatMap { st.firstIndex(of: $0) } ?? -1
        guard let b = st.firstIndex(of: to), b > a else { return 0 }
        if to == "Joined" { return 5 }
        if to == "Trial" || to == "Spoken to" { return 2 }
        return 1
    }
}

/// Leads: who has enquired, where each one is, and who to follow up today.
struct LeadsView: View {
    @Environment(CoachStore.self) private var store
    @State private var pipeline = "coaching"
    @State private var state: Loadable<[LeadRecord]> = .loading
    @State private var showClosed = false
    @State private var adding = false
    @State private var query = ""

    var body: some View {
        Group {
            switch state {
            case .loading: ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .failed(let m): LoadFailed(message: m) { await load() }
            case .loaded(let all):
                let mine = all.filter { ($0.pipeline ?? "coaching") == pipeline && matches($0) }
                List {
                    Picker("Pipeline", selection: $pipeline) {
                        Text("UK coaching").tag("coaching")
                        Text("Holidays").tag("holiday")
                    }
                    .pickerStyle(.segmented)
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())

                    let due = mine.filter { ($0.nextActionAt ?? "9999") <= Fmt.todayISO && !Pipelines.closed(pipeline).contains($0.stage ?? "") }
                    if !due.isEmpty {
                        Section("Follow up today") { ForEach(due) { link($0, showStage: true) } }
                    }
                    ForEach(Pipelines.stages(pipeline).filter { !Pipelines.closed(pipeline).contains($0) }, id: \.self) { stage in
                        let here = mine.filter { ($0.stage ?? "Enquired") == stage }
                        if !here.isEmpty {
                            Section("\(stage) · \(here.count)") { ForEach(here) { link($0, showStage: false) } }
                        }
                    }
                    let closed = mine.filter { Pipelines.closed(pipeline).contains($0.stage ?? "") }
                    if !closed.isEmpty {
                        Section {
                            DisclosureGroup("Closed · \(closed.count)", isExpanded: $showClosed) {
                                ForEach(closed) { link($0, showStage: true) }
                            }
                        }
                    }
                }
                .overlay {
                    if mine.isEmpty && query.isEmpty {
                        ContentUnavailableView("No leads here yet", systemImage: "person.badge.plus", description: Text("Add one with +, or connect your ads and website form on the website."))
                    }
                }
            }
        }
        .navigationTitle("Leads")
        .searchable(text: $query, prompt: "Search leads")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { adding = true } label: { Image(systemName: "plus") }.accessibilityLabel("Add a lead")
            }
        }
        .sheet(isPresented: $adding) {
            NewLeadView(pipeline: pipeline) { Task { await load() } }.environment(store)
        }
        .task { await load() }
        .refreshable { await load() }
    }

    private func matches(_ l: LeadRecord) -> Bool {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return true }
        return [l.name, l.forName ?? "", l.email ?? "", l.phone ?? ""].joined(separator: " ").localizedCaseInsensitiveContains(q)
    }

    private func link(_ l: LeadRecord, showStage: Bool) -> some View {
        NavigationLink { LeadDetailView(lead: l) { Task { await load() } } } label: {
            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(l.name).font(.body.weight(.semibold))
                    if let f = l.forName, !f.isEmpty { Text("for \(f)").font(.subheadline).foregroundStyle(.secondary) }
                }
                HStack(spacing: 6) {
                    if showStage, let s = l.stage { Pill(text: s, tint: .secondary) }
                    if let src = l.source { Text(src).font(.caption).foregroundStyle(.secondary) }
                    if let next = l.nextActionAt {
                        Label(next <= Fmt.todayISO ? "Follow up today" : "Follow up \(Fmt.dayShort(next))", systemImage: "bell")
                            .font(.caption).foregroundStyle(next <= Fmt.todayISO ? Color.orange : Color.secondary)
                    }
                }
            }
        }
    }

    private func load() async {
        do { state = .loaded(try await Rows.list("coach_leads", order: "created_at.desc", limit: 2000)) }
        catch { if state.value == nil { state = .failed(error.localizedDescription) } }
    }
}

/// One lead: get in touch, move them along, note what happened, plan the next
/// follow-up, and add them to the roster when they join.
struct LeadDetailView: View {
    @Environment(CoachStore.self) private var store
    @State var lead: LeadRecord
    let changed: () -> Void

    @State private var events: [LeadEventRecord] = []
    @State private var note = ""
    @State private var followDate = Date()
    @State private var followWhat = ""
    @State private var planning = false
    @State private var toast: Toast?

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text(lead.name).font(.title2.bold())
                    if let f = lead.forName, !f.isEmpty { Text("Enquiring for \(f)").foregroundStyle(.secondary) }
                    if let s = lead.source { Text([s, lead.campaign].compactMap { $0 }.joined(separator: " · ")).font(.subheadline).foregroundStyle(.secondary) }
                }
                .padding(.vertical, 4)
                HStack(spacing: 10) {
                    if let phone = lead.phone, !phone.isEmpty {
                        contact("Call", "phone.fill") { Contact.call(phone) }
                        contact("WhatsApp", "message.fill") { openWhatsApp(phone) }
                    }
                    if let email = lead.email, !email.isEmpty { contact("Email", "envelope.fill") { Contact.email(email) } }
                }
                .buttonStyle(.borderless)
            }

            if let m = lead.message, !m.isEmpty {
                Section("Their message") { Text(m).textSelection(.enabled) }
            }

            Section("Stage") {
                Picker("Stage", selection: Binding(get: { lead.stage ?? "Enquired" }, set: { new in Task { await move(to: new) } })) {
                    ForEach(Pipelines.stages(lead.pipeline), id: \.self) { Text($0).tag($0) }
                }
                if lead.playerId == nil {
                    ConfirmButton(title: "Add to my players", icon: "person.crop.circle.badge.plus", prompt: "Add \(lead.forName?.isEmpty == false ? lead.forName! : lead.name) to your roster?", confirm: "Add to players") {
                        await convert()
                    }
                } else {
                    Label("On your roster", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
                }
            }

            Section("Follow-up") {
                if let next = lead.nextActionAt {
                    LabeledContent(next <= Fmt.todayISO ? "Due" : Fmt.dayShort(next), value: lead.nextAction ?? "Follow up")
                    BusyButton(title: "Done", systemImage: "checkmark", prominent: false) { await followUpDone() }
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                }
                if planning {
                    DatePicker("When", selection: $followDate, in: Date()..., displayedComponents: .date).environment(\.timeZone, Fmt.london)
                    TextField("What to do (e.g. call about a trial)", text: $followWhat)
                    Button("Set follow-up") { Task { await planFollowUp() } }
                } else {
                    Button { planning = true } label: { Label(lead.nextActionAt == nil ? "Plan a follow-up" : "Change the follow-up", systemImage: "bell.badge") }
                }
            }

            Section("Notes") {
                TextField("What happened? (e.g. left a voicemail)", text: $note, axis: .vertical).lineLimit(1...5)
                Button("Add note") { Task { await addNote() } }.disabled(note.trimmingCharacters(in: .whitespaces).isEmpty)
                if let n = lead.notes, !n.isEmpty { Text(n).font(.callout).foregroundStyle(.secondary).textSelection(.enabled) }
            }

            if !events.isEmpty {
                Section("History") {
                    ForEach(events) { e in
                        HStack(alignment: .top) {
                            Text(eventText(e)).font(.subheadline)
                            Spacer()
                            Text(Fmt.when(e.createdAt)).font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle(lead.name)
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .task { await loadEvents() }
    }

    private func contact(_ title: String, _ icon: String, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) { Image(systemName: icon).font(.title3); Text(title).font(.caption) }
                .frame(maxWidth: .infinity, minHeight: 54)
                .background(Color.accentColor.opacity(0.1), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private func openWhatsApp(_ phone: String) {
        var digits = phone.filter(\.isNumber)
        if digits.hasPrefix("0") { digits = "44" + digits.dropFirst() }
        if let u = URL(string: "https://wa.me/\(digits)") { UIApplication.shared.open(u) }
    }

    private func eventText(_ e: LeadEventRecord) -> String {
        switch e.kind {
        case "created": return "Added\(e.toStage.map { " · \($0)" } ?? "")"
        case "stage": return "\(e.fromStage ?? "—") → \(e.toStage ?? "—")"
        case "note": return e.text ?? "Note"
        case "followup": return "Followed up" + (e.text.map { ": \($0)" } ?? "")
        default: return e.kind
        }
    }

    private func stampNote(_ text: String) -> String {
        let line = "[\(Fmt.todayISO)] \(text)"
        let all = [lead.notes ?? "", line].filter { !$0.isEmpty }.joined(separator: "\n")
        return String(all.suffix(5000))
    }

    private func event(_ values: RowValues) async {
        var v = values
        v["lead_id"] = .string(lead.id)
        let _: LeadEventRecord? = try? await Rows.insert("coach_lead_events", v)
        await loadEvents()
    }

    private func loadEvents() async {
        events = (try? await Rows.list("coach_lead_events", [("lead_id", "eq.\(lead.id)")], order: "created_at.desc", limit: 50)) ?? []
    }

    private func move(to stage: String) async {
        let from = lead.stage
        guard stage != from else { return }
        do {
            lead = try await Rows.update("coach_leads", id: lead.id, ["stage": .string(stage), "stage_changed_at": .string(ISO8601DateFormatter().string(from: Date()))])
            await event(["kind": .string("stage"), "from_stage": .text(from), "to_stage": .string(stage), "points": .int(Pipelines.points(lead.pipeline, from: from, to: stage))])
            UISelectionFeedbackGenerator().selectionChanged()
            changed()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func addNote() async {
        let text = note.trimmingCharacters(in: .whitespacesAndNewlines)
        do {
            lead = try await Rows.update("coach_leads", id: lead.id, ["notes": .string(stampNote(text))])
            await event(["kind": .string("note"), "text": .string(String(text.prefix(300))), "points": .int(0)])
            note = ""
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func planFollowUp() async {
        do {
            lead = try await Rows.update("coach_leads", id: lead.id, ["next_action_at": .string(Fmt.iso(followDate)), "next_action": .text(followWhat)])
            planning = false; followWhat = ""
            changed()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func followUpDone() async {
        let onTime = (lead.nextActionAt ?? "") >= Fmt.todayISO
        let what = lead.nextAction ?? "Follow-up"
        do {
            lead = try await Rows.update("coach_leads", id: lead.id, ["next_action_at": .null, "next_action": .null, "notes": .string(stampNote("Done: \(what)"))])
            await event(["kind": .string("followup"), "text": .string(String(what.prefix(300))), "points": .int(onTime ? 1 : 0)])
            toast = Toast(text: onTime ? "Done — a point for following up on time." : "Done.")
            changed()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    /// The website's "Convert to player": a junior if they enquired for a child.
    private func convert() async {
        let child = (lead.forName ?? "").trimmingCharacters(in: .whitespaces)
        let row: RowValues = child.isEmpty
            ? ["name": .string(lead.name), "email": .text(lead.email), "phone": .text(lead.phone), "category": .string("Adult")]
            : ["name": .string(child), "parent_name": .string(lead.name), "parent_email": .text(lead.email), "phone": .text(lead.phone), "category": .string("Junior")]
        do {
            let p: PlayerRecord = try await Rows.insert("coach_players", row)
            store.players.append(p)
            lead = try await Rows.update("coach_leads", id: lead.id, ["player_id": .string(p.id)])
            if (lead.pipeline ?? "coaching") == "coaching", lead.stage != "Joined" { await move(to: "Joined") }
            toast = Toast(text: "\(p.name) is on your roster.")
            changed()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

/// A new lead, typed in after a phone call or a chat at the club.
struct NewLeadView: View {
    @Environment(\.dismiss) private var dismiss
    let pipeline: String
    let added: () -> Void
    @State private var name = ""
    @State private var forName = ""
    @State private var phone = ""
    @State private var email = ""
    @State private var source = "Walk-in"
    @State private var method = "Phone"
    @State private var note = ""
    @State private var error: String?
    @State private var saving = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Name", text: $name).textInputAutocapitalization(.words)
                    TextField("Enquiring for (child's name, optional)", text: $forName).textInputAutocapitalization(.words)
                    TextField("Phone", text: $phone).keyboardType(.phonePad).textContentType(.telephoneNumber)
                    TextField("Email", text: $email).keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                }
                Section {
                    Picker("Where from", selection: $source) { ForEach(Pipelines.sources, id: \.self) { Text($0) } }
                    Picker("Best way to reach them", selection: $method) { ForEach(Pipelines.methods, id: \.self) { Text($0) } }
                }
                Section("Note") { TextField("Anything to remember", text: $note, axis: .vertical).lineLimit(2...5) }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle(pipeline == "holiday" ? "New holiday lead" : "New lead")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if saving { ProgressView() } else { Button("Add") { Task { await save() } }.disabled(name.trimmingCharacters(in: .whitespaces).isEmpty) }
                }
            }
        }
    }

    private func save() async {
        saving = true; error = nil
        defer { saving = false }
        let n = note.trimmingCharacters(in: .whitespacesAndNewlines)
        do {
            let lead: LeadRecord = try await Rows.insert("coach_leads", [
                "pipeline": .string(pipeline), "stage": .string("Enquired"), "name": .string(name.trimmingCharacters(in: .whitespaces)),
                "for_name": .text(forName), "phone": .text(phone), "email": .text(email),
                "source": .string(source), "contact_method": .string(method),
                "notes": n.isEmpty ? .null : .string("[\(Fmt.todayISO)] \(n)"),
            ])
            let _: LeadEventRecord? = try? await Rows.insert("coach_lead_events", ["lead_id": .string(lead.id), "kind": .string("created"), "to_stage": .string("Enquired"), "points": .int(0)])
            added()
            dismiss()
        } catch { self.error = error.localizedDescription }
    }
}
