import SwiftUI

/// The coach's dashboard — the website's dashboard, drawn natively in the
/// academy's own colours: the greeting card with its quick actions (Record a
/// session among them), today's sessions, the camp, the week's numbers, the
/// inbox, Lumio Coach's briefing, who needs attention, the week ahead, recent
/// summaries and kit. Its figures come from the server, worked out by the
/// portal's own rules (src/lib/app/coach-dashboard.ts).
struct TodayView: View {
    @Environment(AppModel.self) private var model
    @Environment(CoachStore.self) private var store
    @Environment(\.portal) private var T
    @State private var state: Loadable<CoachToday> = .loading
    @State private var dash: CoachDashboard?
    /// Why the rest of the dashboard didn't load, said instead of a spinner that never stops.
    @State private var dashProblem: String?
    @State private var adding = false
    @State private var writing = false
    @State private var composing = false
    @State private var showUnbooked = false
    @State private var toast: Toast?
    @State private var brief = BriefState()

    private var mediaOn: Bool { store.setup?.features?.video == true || store.setup?.features?.audio == true }

    var body: some View {
        Group {
            switch state {
            case .loading: ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .failed(let m): LoadFailed(message: m) { await load() }
            case .loaded(let t): content(t)
            }
        }
        .background(T.cBg.ignoresSafeArea())
        .navigationTitle("Dashboard")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(T.cBg, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { adding = true } label: { Image(systemName: "plus") }
                    .accessibilityLabel("Add a booking")
            }
        }
        .navigationDestination(for: AppBooking.self) { BookingDetailView(booking: $0) }
        .task { if state.value == nil { await load() } }
        .onChange(of: store.changes) { _, _ in Task { await load() } }
        .sheet(isPresented: $adding) {
            BookingFormView(existing: nil) { text in toast = Toast(text: text) }
                .environment(store)
        }
        .sheet(isPresented: $writing) {
            NavigationStack { SummaryFormView(existing: nil) { text in toast = Toast(text: text) } }
                .environment(store)
        }
        .sheet(isPresented: $composing) {
            ComposeView { text in toast = Toast(text: text) }
                .environment(store)
        }
        .toast($toast)
        .refreshable { await load() }
    }

    // MARK: Layout

    private func content(_ t: CoachToday) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                hero(t)
                if dash?.shows("today") != false { todayCard(t) }
                if let camp = dash?.camp { campCard(camp) }
                if let d = dash {
                    if d.shows("stats") { stats(d) }
                    if d.shows("inbox") { inbox(d) }
                    if d.shows("briefing") { BriefingCard(briefing: d.briefing, day: t.date, scope: "\(model.coach?.slug ?? "")|\(d.briefing.role)", state: $brief) }
                    if d.shows("needs") { needs(d) }
                    if d.shows("upcoming") { upcoming(d) }
                    if d.shows("summaries") { recent(d) }
                    if d.shows("kit") { kit(d) }
                } else {
                    if let dashProblem {
                        PortalCard {
                            Text("The rest of your dashboard didn’t load.").font(.system(size: 15, weight: .semibold)).foregroundStyle(T.cText)
                            Text(dashProblem).font(.system(size: 12)).foregroundStyle(T.cText3).padding(.top, 4)
                            Button("Try again") { Task { await load() } }.font(.system(size: 14, weight: .bold)).foregroundStyle(T.cAccentText).padding(.top, 10)
                        }
                    } else {
                        HStack { Spacer(); ProgressView(); Spacer() }.padding(.vertical, 20)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .scrollIndicators(.hidden)
    }

    // MARK: The greeting card

    private func hero(_ t: CoachToday) -> some View {
        PortalCard(background: AnyShapeStyle(LinearGradient(colors: [T.cAccentDim, T.cPanel], startPoint: .topLeading, endPoint: .bottomTrailing))) {
            Text(Self.longDate(t.date)).font(.system(size: 13)).foregroundStyle(T.cText3)
            Text(greetLine).font(.system(size: 12, weight: .bold)).kerning(1.4).textCase(.uppercase)
                .foregroundStyle(T.cAccentText).padding(.top, 6)
            Text(dash?.headline ?? "\(t.counts.today) session\(t.counts.today == 1 ? "" : "s") today")
                .font(.system(size: 26, weight: .heavy)).foregroundStyle(T.cText).padding(.top, 8)
                .fixedSize(horizontal: false, vertical: true)
            FlowLayout(spacing: 8) {
                pill("+ Add booking", filled: true) { adding = true }
                if mediaOn {
                    NavigationLink { MediaLibraryView(fixed: nil) } label: { pillLabel("Record a session", filled: true, record: true) }
                        .buttonStyle(.plain)
                }
                NavigationLink { PaymentsView() } label: { pillLabel("Take a payment") }.buttonStyle(.plain)
                NavigationLink { SummariesView() } label: { pillLabel("Lesson Summaries") }.buttonStyle(.plain)
                pill("Open calendar") { model.coachTab = .calendar }
                pill("Send message") { composing = true }
            }
            .padding(.top, 16)
        }
    }

    private var greetLine: String {
        let g = dash?.greeting ?? Fmt.greeting()
        let name = dash?.greetName ?? ""
        let club = dash?.clubName ?? (model.coach?.academyName ?? "")
        return "\(g)\(name.isEmpty ? "" : ", \(name)")\(club.isEmpty ? "" : " · \(club)")"
    }

    private func pill(_ title: String, filled: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) { pillLabel(title, filled: filled) }.buttonStyle(.plain)
    }

    private func pillLabel(_ title: String, filled: Bool = false, record: Bool = false) -> some View {
        HStack(spacing: 7) {
            if record { Circle().fill(filled ? T.cBtnText : Color.red).frame(width: 9, height: 9) }
            Text(title).font(.system(size: 15, weight: filled ? .bold : .semibold))
        }
        .padding(.horizontal, 15).padding(.vertical, 11)
        .foregroundStyle(filled ? T.cBtnText : T.cText2)
        .background(filled ? AnyShapeStyle(record ? Color(red: 0.86, green: 0.2, blue: 0.2) : T.cAccent) : AnyShapeStyle(Color.clear),
                    in: RoundedRectangle(cornerRadius: 11, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 11, style: .continuous).stroke(filled ? Color.clear : T.cBorder, lineWidth: 1))
        .contentShape(Rectangle())
    }

    // MARK: Today

    private func todayCard(_ t: CoachToday) -> some View {
        let live = t.sessions.filter { !$0.isCancelled }
        let nowHM = Fmt.hhmm(Date())
        let nextId = (live.first { ($0.time ?? "") >= nowHM } ?? live.first)?.id
        return PortalCard {
            HStack {
                PortalTitle(text: "Today")
                Spacer()
                if live.count > 4 { Text("\(live.count) sessions").font(.caption).foregroundStyle(T.cText3) }
            }
            .padding(.bottom, 10)
            if live.isEmpty {
                HStack(spacing: 4) {
                    Text("No sessions today.").foregroundStyle(T.cText3)
                    Button("Add a booking →") { adding = true }.font(.body.weight(.bold)).foregroundStyle(T.cAccentText)
                }
                .font(.system(size: 15))
            } else {
                ForEach(live) { b in
                    let hl = b.id == nextId
                    NavigationLink(value: b) {
                        HStack(spacing: 12) {
                            Text(Fmt.time(b.time).isEmpty ? "—" : Fmt.time(b.time)).font(.system(size: 13).monospacedDigit())
                                .foregroundStyle(hl ? T.cAccent : T.cText3).frame(width: 44, alignment: .leading)
                            Circle().strokeBorder(hl ? T.cAccent : T.cBorder, lineWidth: 1.5)
                                .background(Circle().fill(hl ? T.cAccent : T.cPanel)).frame(width: 8, height: 8)
                            if b.clientConfirmed != nil { Text("✓").font(.system(size: 13, weight: .heavy)).foregroundStyle(T.cGood) }
                            Text(b.playerName ?? b.title).font(.system(size: 15, weight: hl ? .semibold : .medium)).foregroundStyle(T.cText).lineLimit(1)
                            let sub = [b.court, b.type].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
                            if !sub.isEmpty { Text(sub).font(.system(size: 12)).foregroundStyle(T.cText3).lineLimit(1) }
                            Spacer(minLength: 0)
                        }
                        .frame(minHeight: 34)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: The camp

    private func campCard(_ c: CoachDashboard.Camp) -> some View {
        NavigationLink { CampLoaderView(id: c.id) } label: {
            PortalCard(leftStripe: Self.campColour) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(c.running ? "CAMP RUNNING NOW" : "CAMP COMING UP").font(.system(size: 12, weight: .heavy)).kerning(0.8).foregroundStyle(Self.campColour)
                    Text(c.name).font(.system(size: 17, weight: .heavy)).foregroundStyle(T.cText).lineLimit(2)
                }
                HStack {
                    if !c.place.isEmpty { Text(c.place).font(.system(size: 14)).foregroundStyle(T.cText3) }
                    Spacer()
                    Text(c.when).font(.system(size: 14, weight: .bold))
                        .foregroundStyle(c.whenTone == "good" ? T.cGood : c.whenTone == "warn" ? T.cWarn : T.cText2)
                }
                .padding(.top, 6)
                if let fill = c.fill {
                    GeometryReader { g in
                        ZStack(alignment: .leading) {
                            Capsule().fill(T.cBorder)
                            Capsule().fill(Self.campColour).frame(width: g.size.width * fill)
                        }
                    }
                    .frame(height: 6).padding(.top, 12)
                }
                LazyVGrid(columns: [GridItem(.flexible(), alignment: .leading), GridItem(.flexible(), alignment: .leading)], alignment: .leading, spacing: 14) {
                    ForEach(c.figures, id: \.self) { f in
                        VStack(alignment: .leading, spacing: 3) {
                            Text(f.label).font(.system(size: 13)).foregroundStyle(T.cText3)
                            Text(f.value).font(.system(size: 22, weight: .heavy)).foregroundStyle(tone(f.tone))
                        }
                    }
                }
                .padding(.top, 14)
                Text(c.note).font(.system(size: 13)).foregroundStyle(T.cText3).padding(.top, 12)
            }
        }
        .buttonStyle(.plain)
    }

    static let campColour = Color(hex: "#7c5cbf")

    private func tone(_ t: String) -> Color {
        switch t {
        case "good": return T.cGood
        case "warn": return T.cWarn
        case "bad": return T.cBad
        case "muted": return T.cText3
        default: return T.cText
        }
    }

    // MARK: The week's numbers

    private func stats(_ d: CoachDashboard) -> some View {
        VStack(spacing: 12) {
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                statTile("This week", sub: "Mon–Sun", value: "\(d.stats.thisWeek)") { model.coachTab = .calendar }
                statTile("Next session", value: d.stats.next?.label ?? "—", small: true) { model.coachTab = .calendar }
                statTile("Players", value: "\(d.stats.players)") { model.coachTab = .players }
                statTile("Nothing booked", value: "\(d.stats.unbooked.count)", on: showUnbooked) { withAnimation { showUnbooked.toggle() } }
                NavigationLink { PaymentsView() } label: { tileBody(d.stats.paymentsLabel, sub: nil, value: d.stats.paymentsDue, small: d.stats.paymentsDue.count > 9, on: false) }
                    .buttonStyle(.plain)
            }
            if showUnbooked {
                PortalCard {
                    HStack {
                        PortalTitle(text: "Nothing booked", sub: "\(d.stats.unbooked.count) player\(d.stats.unbooked.count == 1 ? "" : "s")")
                        Spacer()
                        Button("Close") { withAnimation { showUnbooked = false } }.font(.caption.weight(.bold)).foregroundStyle(T.cAccentText)
                    }
                    .padding(.bottom, 10)
                    if d.stats.unbooked.isEmpty {
                        Text("Every player has a session booked.").font(.system(size: 14)).foregroundStyle(T.cText3)
                    } else {
                        FlowLayout(spacing: 6) {
                            ForEach(d.stats.unbooked) { p in
                                Text(p.name).font(.system(size: 13, weight: .semibold)).foregroundStyle(T.cText)
                                    .padding(.horizontal, 10).padding(.vertical, 6)
                                    .background(T.cPanel2, in: RoundedRectangle(cornerRadius: 8))
                                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(T.cBorder))
                            }
                        }
                    }
                }
            }
        }
    }

    private func statTile(_ label: String, sub: String? = nil, value: String, small: Bool = false, on: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) { tileBody(label, sub: sub, value: value, small: small, on: on) }.buttonStyle(.plain)
    }

    private func tileBody(_ label: String, sub: String?, value: String, small: Bool, on: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 3) {
                Text(label).foregroundStyle(T.cText3)
                if let sub { Text("· \(sub)").foregroundStyle(T.cText3.opacity(0.75)) }
            }
            .font(.system(size: 13)).lineLimit(1)
            Text(value).font(.system(size: small ? 17 : 28, weight: .heavy)).foregroundStyle(T.cText).lineLimit(2).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, minHeight: 88, alignment: .topLeading)
        .padding(16)
        .background(T.cPanel, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(on ? T.cAccentBorder : T.cBorder, lineWidth: 1))
    }

    // MARK: Inbox

    private func inbox(_ d: CoachDashboard) -> some View {
        PortalCard {
            HStack {
                PortalTitle(text: "Inbox")
                Spacer()
                Button("All →") { model.coachTab = .messages }.font(.system(size: 13, weight: .bold)).foregroundStyle(T.cAccentText)
            }
            .padding(.bottom, 8)
            if d.inbox.isEmpty {
                HStack(spacing: 4) {
                    Text("No messages yet.").foregroundStyle(T.cText3)
                    Button("Send one →") { composing = true }.fontWeight(.bold).foregroundStyle(T.cAccentText)
                }
                .font(.system(size: 14))
            }
            ForEach(Array(d.inbox.enumerated()), id: \.element.id) { i, m in
                Button { model.coachTab = .messages } label: {
                    HStack(alignment: .top, spacing: 10) {
                        Circle().fill(m.unread ? T.cAccent : T.cBorder).frame(width: 7, height: 7).padding(.top, 6)
                        VStack(alignment: .leading, spacing: 3) {
                            HStack(spacing: 6) {
                                Text("\(m.incoming ? "↩ " : "To ")\(m.who)").font(.system(size: 14, weight: m.unread ? .bold : .semibold)).foregroundStyle(T.cText).lineLimit(1)
                                Text(m.tag.uppercased()).font(.system(size: 9.5, weight: .bold)).foregroundStyle(tagColour(m.tag))
                                    .padding(.horizontal, 6).padding(.vertical, 2).background(tagColour(m.tag).opacity(0.14), in: RoundedRectangle(cornerRadius: 4))
                                if let r = m.reaction { Text(r).font(.system(size: 12)) }
                                Spacer(minLength: 4)
                                Text(Self.shortDate(m.at)).font(.system(size: 12)).foregroundStyle(T.cText3)
                            }
                            Text(m.text).font(.system(size: 13)).foregroundStyle(T.cText3).lineLimit(1)
                        }
                    }
                    .padding(.vertical, 9)
                    .overlay(alignment: .bottom) { if i < d.inbox.count - 1 { Rectangle().fill(T.cBorder).frame(height: 1) } }
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func tagColour(_ tag: String) -> Color {
        switch tag {
        case "Venue": return Color(hex: "#3A8EE0")
        case "Coach": return T.cAccent
        case "Player": return T.cGood
        default: return T.cText3
        }
    }

    // MARK: Needs attention

    private func needs(_ d: CoachDashboard) -> some View {
        PortalCard {
            PortalTitle(text: "Needs attention").padding(.bottom, 10)
            VStack(spacing: 8) {
                if d.needs.isEmpty && d.racketsDue == 0 {
                    Text("Everyone’s on track. 🎾").font(.system(size: 14)).foregroundStyle(T.cText3).frame(maxWidth: .infinity, alignment: .leading)
                }
                ForEach(d.needs) { n in
                    Button { model.coachTab = .players } label: {
                        HStack(spacing: 10) {
                            PlayerPhoto(name: n.name, path: Avatars.path(n.avatar), size: 30)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(n.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(T.cText).lineLimit(1)
                                Text(n.reason).font(.system(size: 12)).foregroundStyle(T.cText3)
                            }
                            Spacer()
                            Circle().fill(T.cWarn).frame(width: 8, height: 8)
                        }
                        .padding(8)
                        .background(T.cPanel2, in: RoundedRectangle(cornerRadius: 9))
                        .overlay(RoundedRectangle(cornerRadius: 9).stroke(T.cBorder))
                    }
                    .buttonStyle(.plain)
                }
                if d.needsMore > 0 {
                    Button("+\(d.needsMore) more on the roster →") { model.coachTab = .players }
                        .font(.system(size: 13, weight: .bold)).foregroundStyle(T.cAccentText).frame(maxWidth: .infinity, alignment: .leading)
                }
                if d.racketsDue > 0 {
                    HStack(spacing: 8) {
                        Text("🏆")
                        Text("\(d.racketsDue) racket assessment\(d.racketsDue == 1 ? "" : "s") due").font(.system(size: 14, weight: .semibold)).foregroundStyle(T.cText)
                        Spacer()
                    }
                    .padding(9)
                    .background(T.cAccentDim, in: RoundedRectangle(cornerRadius: 9))
                    .overlay(RoundedRectangle(cornerRadius: 9).stroke(T.cAccentBorder))
                }
            }
        }
    }

    // MARK: The week ahead, recent summaries, kit

    private func upcoming(_ d: CoachDashboard) -> some View {
        PortalCard {
            HStack {
                PortalTitle(text: "Upcoming", sub: "next 7 days")
                Spacer()
                Button("Calendar →") { model.coachTab = .calendar }.font(.system(size: 13, weight: .bold)).foregroundStyle(T.cAccentText)
            }
            .padding(.bottom, 8)
            if d.upcoming.isEmpty {
                Text("Nothing booked in the next 7 days.").font(.system(size: 14)).foregroundStyle(T.cText3)
            }
            ForEach(d.upcoming) { u in
                let camp = u.kind == "camp"
                HStack(alignment: .top, spacing: 10) {
                    Text(u.when).font(.system(size: 13, weight: camp ? .bold : .semibold))
                        .foregroundStyle(camp ? Self.campColour : T.cAccentText).frame(width: 118, alignment: .leading)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(u.title).font(.system(size: 14, weight: .bold)).foregroundStyle(T.cText).lineLimit(1)
                        if !u.sub.isEmpty { Text(u.sub).font(.system(size: 12)).foregroundStyle(T.cText3).lineLimit(1) }
                    }
                    Spacer(minLength: 0)
                    if camp { Text("CAMP").font(.system(size: 10, weight: .bold)).foregroundStyle(Self.campColour) }
                }
                .padding(camp ? 9 : 0)
                .padding(.vertical, camp ? 0 : 8)
                .background(camp ? Self.campColour.opacity(0.08) : Color.clear, in: RoundedRectangle(cornerRadius: 8))
                .overlay(alignment: .bottom) { if !camp { Rectangle().fill(T.cBorder).frame(height: 1) } }
                .contentShape(Rectangle())
                .onTapGesture { model.coachTab = .calendar }
            }
        }
    }

    private func recent(_ d: CoachDashboard) -> some View {
        PortalCard {
            HStack {
                PortalTitle(text: "Recent summaries")
                Spacer()
                NavigationLink { SummariesView() } label: { Text("All →").font(.system(size: 13, weight: .bold)).foregroundStyle(T.cAccentText) }
            }
            .padding(.bottom, 8)
            if d.recent.isEmpty { Text("No summaries yet.").font(.system(size: 14)).foregroundStyle(T.cText3) }
            ForEach(d.recent) { r in
                NavigationLink { SummariesView() } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(r.player).font(.system(size: 14, weight: .semibold)).foregroundStyle(T.cText).lineLimit(1)
                        Text([r.when, r.focus].filter { !$0.isEmpty }.joined(separator: " · ")).font(.system(size: 12)).foregroundStyle(T.cText3).lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
                    .overlay(alignment: .bottom) { Rectangle().fill(T.cBorder).frame(height: 1) }
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func kit(_ d: CoachDashboard) -> some View {
        PortalCard {
            HStack {
                PortalTitle(text: d.kit.items.isEmpty ? "Kit needing attention" : "Kit needing attention · \(d.kit.items.count + d.kit.more)")
                Spacer()
                Button("Equipment →") { model.web = WebTarget(path: model.coachWebPath("equipment"), title: "Equipment & Kit") }
                    .font(.system(size: 13, weight: .bold)).foregroundStyle(T.cAccentText)
            }
            .padding(.bottom, 8)
            if d.kit.items.isEmpty { Text(d.kit.empty).font(.system(size: 14)).foregroundStyle(T.cText3) }
            ForEach(d.kit.items) { k in
                HStack(spacing: 8) {
                    Circle().fill(k.tone == "bad" ? T.cBad : k.tone == "order" ? Color(hex: "#3A8EE0") : T.cWarn).frame(width: 7, height: 7)
                    Text(k.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(T.cText).lineLimit(1)
                    Spacer()
                    Text(k.state.uppercased()).font(.system(size: 11)).foregroundStyle(T.cText3)
                }
                .padding(.vertical, 8)
                .overlay(alignment: .bottom) { Rectangle().fill(T.cBorder).frame(height: 1) }
            }
            if d.kit.more > 0 { Text("+\(d.kit.more) more").font(.system(size: 13, weight: .bold)).foregroundStyle(T.cAccentText).padding(.top, 8) }
        }
    }

    // MARK: Words and loading

    static func longDate(_ iso: String) -> String {
        guard let d = Fmt.day(iso) else { return iso }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_GB"); f.timeZone = Fmt.london; f.dateFormat = "EEEE d MMMM"
        return f.string(from: d)
    }

    static func shortDate(_ s: String?) -> String {
        guard let d = Fmt.stamp(s) else { return "" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_GB"); f.timeZone = Fmt.london; f.dateFormat = "dd MMM"
        return f.string(from: d)
    }

    private func load() async {
        async let board = Self.fetchBoard()
        do { state = .loaded(try await API.shared.get("/api/app/v1/coach/today")) }
        catch is CancellationError {}
        catch { if state.value == nil { state = .failed(error.localizedDescription) } }
        switch await board {
        case .success(let b): dash = b; dashProblem = nil
        case .failure(let e):
            if e is CancellationError { return }
            if dash == nil {
                // The detail matters here: it says which part of the reply didn't fit.
                if case APIError.decoding(let detail) = e { dashProblem = "\(e.localizedDescription) (\(detail.prefix(300)))" }
                else { dashProblem = e.localizedDescription }
            }
        }
    }

    private static func fetchBoard() async -> Result<CoachDashboard, Error> {
        do { return .success(try await API.shared.get("/api/app/v1/coach/dashboard")) }
        catch { return .failure(error) }
    }
}

/// Opens a camp from the dashboard: loads it, then shows the camp.
struct CampLoaderView: View {
    let id: String
    @State private var camp: CampRecord?
    @State private var failed = false

    var body: some View {
        Group {
            if let camp { CampDetailView(camp: camp) }
            else if failed { ContentUnavailableView("That camp couldn’t be opened", systemImage: "tent") }
            else { ProgressView() }
        }
        .task {
            let rows: [CampRecord]? = try? await Rows.list("coach_camps", [("id", id)])
            if let c = rows?.first { camp = c } else { failed = true }
        }
    }
}

// MARK: - Lumio Coach's briefing

struct BriefState { var items: [CoachDashboard.Signal]? = nil; var prose = ""; var at = ""; var loading = false; var key = "" }

/// The morning briefing: Lumio Coach turns the dashboard's facts into the few
/// things worth saying, once a day (the website's rule), kept on the phone
/// until tomorrow or until the coach asks for a fresh one.
struct BriefingCard: View {
    @Environment(\.portal) private var T
    let briefing: CoachDashboard.Briefing
    let day: String
    let scope: String
    @Binding var state: BriefState
    @State private var openTag: String?

    private var cacheKey: String { "lumio.brief.\(scope).\(day)" }
    private var rows: [CoachDashboard.Signal] { state.items ?? (state.prose.isEmpty ? briefing.signals : []) }

    var body: some View {
        PortalCard {
            HStack(spacing: 7) {
                Text("✦").foregroundStyle(T.cAccent)
                PortalTitle(text: "Coach AI briefing")
                Spacer()
                if !state.at.isEmpty { Text(state.at).font(.system(size: 12).monospacedDigit()).foregroundStyle(T.cText3) }
                Button { Task { await ask(force: true) } } label: { Image(systemName: "arrow.clockwise") }
                    .font(.system(size: 13)).foregroundStyle(T.cText3).accessibilityLabel("Rewrite the briefing now")
            }
            .padding(.bottom, 10)
            if state.loading && state.items == nil && state.prose.isEmpty {
                Text("Lumio Coach is reading your week…").font(.system(size: 13)).foregroundStyle(T.cText3).padding(.bottom, 8)
            }
            if !state.prose.isEmpty {
                Text(state.prose).font(.system(size: 14)).foregroundStyle(T.cText)
            } else {
                ForEach(Array(rows.enumerated()), id: \.offset) { i, r in
                    HStack(alignment: .top, spacing: 10) {
                        Text(r.tag.uppercased()).font(.system(size: 10, design: .monospaced)).kerning(0.5)
                            .foregroundStyle(r.pri == "high" ? T.cBad : T.cText3)
                            .padding(.horizontal, 6).padding(.vertical, 3)
                            .background(r.pri == "high" ? T.cBad.opacity(0.12) : T.cPanel2, in: RoundedRectangle(cornerRadius: 4))
                        Text(r.text).font(.system(size: 14)).foregroundStyle(T.cText).fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                    .padding(.vertical, 8)
                    .overlay(alignment: .top) { if i > 0 { Rectangle().fill(T.cBorder).frame(height: 1) } }
                }
            }
            let mentioned = Set(rows.map(\.tag))
            let rest = briefing.signals.filter { !mentioned.contains($0.tag) }
            if !rest.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    FlowLayout(spacing: 6) {
                        Text("ALSO WATCHING").font(.system(size: 10, weight: .bold)).kerning(0.6).foregroundStyle(T.cText3)
                        ForEach(rest, id: \.tag) { r in
                            Button { withAnimation { openTag = openTag == r.tag ? nil : r.tag } } label: {
                                Text(r.tag.uppercased()).font(.system(size: 10, design: .monospaced))
                                    .foregroundStyle(openTag == r.tag ? T.cAccentText : T.cText2)
                                    .padding(.horizontal, 7).padding(.vertical, 4)
                                    .overlay(RoundedRectangle(cornerRadius: 5).stroke(openTag == r.tag ? T.cAccentBorder : T.cBorder))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    if let t = openTag, let r = rest.first(where: { $0.tag == t }) {
                        Text(r.text).font(.system(size: 13)).foregroundStyle(T.cText2)
                    }
                }
                .padding(.top, 10)
                .overlay(alignment: .top) { Rectangle().fill(T.cBorder).frame(height: 1).offset(y: 2) }
            }
        }
        .task(id: cacheKey) { await ask(force: false) }
    }

    private struct Cache: Codable { var items: [CoachDashboard.Signal]?; var prose: String?; var at: String }
    private struct BriefRequest: Encodable { let signals: [Fact]; let todayCount: Int; let role: String; struct Fact: Encodable { let tag: String; let fact: String } }
    private struct Answer: Decodable { let items: [CoachDashboard.Signal]?; let briefing: String?; let at: String?; let limited: Bool? }

    private func ask(force: Bool) async {
        if !force, state.key == cacheKey, state.items != nil || !state.prose.isEmpty { return }
        if !force, let data = UserDefaults.standard.data(forKey: cacheKey), let c = try? JSONDecoder().decode(Cache.self, from: data) {
            state = BriefState(items: c.items, prose: c.prose ?? "", at: c.at, loading: false, key: cacheKey)
            return
        }
        guard !briefing.signals.isEmpty else { return }
        state.loading = true
        state.key = cacheKey
        defer { state.loading = false }
        let body = BriefRequest(signals: briefing.signals.map { BriefRequest.Fact(tag: $0.tag, fact: $0.text) }, todayCount: briefing.todayCount, role: briefing.role)
        guard let a: Answer = try? await API.shared.request("POST", "/api/coach/briefing", body: body, lenient: true),
              (a.items?.isEmpty == false) || (a.briefing?.isEmpty == false) else { return }
        let at = Self.clock(a.at)
        state = BriefState(items: a.items, prose: a.items == nil ? (a.briefing ?? "") : "", at: at, loading: false, key: cacheKey)
        if let data = try? JSONEncoder().encode(Cache(items: a.items, prose: a.briefing, at: at)) { UserDefaults.standard.set(data, forKey: cacheKey) }
    }

    private static func clock(_ s: String?) -> String {
        guard let d = Fmt.stamp(s) else { return "" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_GB"); f.timeZone = Fmt.london; f.dateFormat = "HH:mm"
        return f.string(from: d)
    }
}
