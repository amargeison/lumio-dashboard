import SwiftUI

/// A camp on the family's home screen: its name, where, and how long to go.
struct FamilyCampRow: View {
    let camp: CampCard

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "sun.max.fill").font(.title2).foregroundStyle(.orange).frame(width: 34)
            VStack(alignment: .leading, spacing: 3) {
                Text(camp.name).font(.body.weight(.semibold))
                Text(camp.place).font(.subheadline).foregroundStyle(.secondary)
                Text(FamilyCampView.countdown(camp)).font(.caption.weight(.semibold)).foregroundStyle(Color.accentColor)
            }
            Spacer()
            if camp.balanceLink != nil { Pill(text: "Balance due", tint: .orange) }
        }
        .padding(.vertical, 4)
    }
}

/// Everything the coach has filled in for a camp — the week, goals, what to
/// bring, travel, where they stay, out and about, who to ring — in the same
/// tabs as the website's camp card. Tabs with nothing in them aren't there.
struct FamilyCampView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openURL) private var openURL
    let camp: CampCard
    @State private var tab: String = ""

    private var current: CampCard.Tab? { camp.tabs.first { $0.id == tab } ?? camp.tabs.first }

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    Text(camp.name).font(.title2.bold())
                    Label(camp.place, systemImage: "mappin.and.ellipse").font(.subheadline).foregroundStyle(.secondary)
                    if let dates = Self.dates(camp) { Label(dates, systemImage: "calendar").font(.subheadline).foregroundStyle(.secondary) }
                    Text(Self.countdown(camp)).font(.headline).foregroundStyle(Color.accentColor).padding(.top, 2)
                }
                .padding(.vertical, 4)
                ForEach(camp.intro, id: \.self) { Text($0).font(.subheadline) }
                if let link = camp.balanceLink {
                    Button { pay(link) } label: { Label("Pay the balance", systemImage: "sterlingsign.circle.fill").font(.body.weight(.semibold)) }
                }
            }

            if camp.tabs.count > 1 {
                Section {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(camp.tabs) { t in
                                let on = t.id == current?.id
                                Button { withAnimation(.snappy) { tab = t.id } } label: {
                                    Label(t.label, systemImage: Self.symbol(t.icon))
                                        .font(.subheadline.weight(on ? .bold : .medium))
                                        .padding(.horizontal, 12).padding(.vertical, 8)
                                        .foregroundStyle(on ? Color.white : Color.primary)
                                        .background(on ? Color.accentColor : Color(.tertiarySystemFill), in: Capsule())
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                    .listRowInsets(EdgeInsets(top: 6, leading: 12, bottom: 6, trailing: 12))
                    .listRowBackground(Color.clear)
                }
            }

            if let t = current {
                ForEach(Array(t.blocks.enumerated()), id: \.offset) { _, b in block(b) }
            } else {
                Section { Text("Your coach hasn’t added the details yet.").foregroundStyle(.secondary) }
            }
        }
        .navigationTitle(current?.label ?? "Camp")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: Blocks

    @ViewBuilder private func block(_ b: CampCard.Block) -> some View {
        switch b {
        case .highlight(let label, let text):
            Section(label) { Text(text).font(.body.weight(.semibold)) }
        case .text(let text):
            Section { Text(text) }
        case .timetable(let title, let rows):
            Section(title) {
                ForEach(rows, id: \.self) { r in
                    HStack(alignment: .firstTextBaseline, spacing: 12) {
                        if !r.when.isEmpty { Text(r.when).font(.subheadline.weight(.bold)).foregroundStyle(Color.accentColor).frame(minWidth: 52, alignment: .leading) }
                        Text(r.what).font(.subheadline)
                    }
                }
            }
        case .days(let title, let days):
            Section(title) {
                ForEach(Array(days.enumerated()), id: \.offset) { i, d in
                    HStack(alignment: .top, spacing: 12) {
                        Text(String(d.label.filter(\.isNumber)).isEmpty ? "\(i + 1)" : String(d.label.filter(\.isNumber)))
                            .font(.caption.weight(.heavy)).foregroundStyle(Color.accentColor)
                            .frame(width: 30, height: 30).background(Color.accentColor.opacity(0.15), in: Circle())
                        VStack(alignment: .leading, spacing: 3) {
                            HStack {
                                Text(d.focus ?? d.label).font(.subheadline.weight(.semibold))
                                Spacer()
                                if let date = d.date { Text(Fmt.dayShort(date)).font(.caption).foregroundStyle(.secondary) }
                            }
                            if let detail = d.detail { Text(detail).font(.caption).foregroundStyle(.secondary) }
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
        case .list(let title, let icon, let style, let items, let note, let measure):
            Section {
                ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        switch style {
                        case "number": Text("\(i + 1).").font(.subheadline.weight(.bold)).foregroundStyle(Color.accentColor)
                        case "tick": Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                        default: Image(systemName: "circle.fill").font(.system(size: 6)).foregroundStyle(.secondary)
                        }
                        Text(item).font(.subheadline)
                    }
                }
                if let measure { Label("How we’ll know: \(measure)", systemImage: "checkmark.seal").font(.caption) }
            } header: { Text("\(icon) \(title)") } footer: { if let note { Text(note) } }
        case .facts(let title, let icon, let address, let rows, let map, let web):
            Section("\(icon) \(title)") {
                if let address, !address.isEmpty { Text(address).font(.subheadline).foregroundStyle(.secondary) }
                ForEach(rows, id: \.self) { LabeledContent($0.label, value: $0.value) }
                links(map: map, web: web)
            }
        case .places(let title, let icon, let places):
            Section("\(icon) \(title)") {
                ForEach(places, id: \.self) { p in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(p.name).font(.subheadline.weight(.semibold))
                            if let k = p.kind, !k.isEmpty { Text(k).font(.caption).foregroundStyle(.secondary) }
                        }
                        if let a = p.address, !a.isEmpty { Text(a).font(.caption).foregroundStyle(.secondary) }
                        if let n = p.note, !n.isEmpty { Text(n).font(.caption) }
                        HStack(spacing: 16) {
                            if let phone = p.phone, !phone.isEmpty { Button { Contact.call(phone) } label: { Label(phone, systemImage: "phone.fill") } }
                            links(map: p.map, web: p.web)
                        }
                        .font(.caption.weight(.semibold))
                        .buttonStyle(.borderless)
                    }
                    .padding(.vertical, 2)
                }
            }
        case .contacts(let people):
            Section("Who to ring") {
                ForEach(people, id: \.self) { c in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(c.name).font(.subheadline.weight(.semibold))
                        if let r = c.role, !r.isEmpty { Text(r).font(.caption).foregroundStyle(.secondary) }
                        if let n = c.note, !n.isEmpty { Text(n).font(.caption) }
                        if let phone = c.phone, !phone.isEmpty {
                            Button { Contact.call(phone) } label: { Label(phone, systemImage: "phone.fill").font(.subheadline.weight(.semibold)) }
                                .buttonStyle(.borderless)
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
        case .link(let label, let url):
            Section { if let u = URL(string: url) { Link(destination: u) { Label(label, systemImage: "map") } } }
        case .unknown:
            EmptyView()
        }
    }

    @ViewBuilder private func links(map: String?, web: String?) -> some View {
        if let m = map, let u = URL(string: m) { Link(destination: u) { Label("Map", systemImage: "map") } }
        if let w = web, let u = URL(string: w) { Link(destination: u) { Label("Website", systemImage: "safari") } }
    }

    private func pay(_ link: String) {
        // Our own payment page opens in the app; anyone else's in Safari.
        if let u = URL(string: link), let host = u.host, !Config.isOwnHost(host) { openURL(u) }
        else { model.web = WebTarget(path: link, title: "Pay the balance") }
    }

    // MARK: Words

    static func countdown(_ c: CampCard) -> String {
        if let d = c.dayOf { return d }
        guard let n = c.daysUntil else { return "Dates to be confirmed" }
        if n <= 0 { return "On now" }
        if n == 1 { return "Starts tomorrow" }
        if n < 14 { return "Starts in \(n) days" }
        return "Starts in \(n / 7) weeks"
    }

    static func dates(_ c: CampCard) -> String? {
        guard let s = c.startDate else { return nil }
        guard let e = c.endDate, e.prefix(10) != s.prefix(10) else { return Fmt.dayLong(s) }
        return "\(Fmt.dayShort(s)) – \(Fmt.dayShort(e))"
    }

    /// The website's icon names, as SF Symbols.
    static func symbol(_ icon: String) -> String {
        switch icon {
        case "calendar": return "calendar"
        case "flag": return "flag.fill"
        case "bag": return "backpack.fill"
        case "airplane": return "airplane"
        case "bed.double": return "bed.double.fill"
        case "globe": return "globe.europe.africa.fill"
        case "phone": return "phone.fill"
        default: return "note.text"
        }
    }
}
