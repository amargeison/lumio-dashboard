import SwiftUI

/// The academy's look, as the website draws it (Settings → Appearance): the
/// theme's colours and the chosen accent, made readable together on the server
/// by the same code the portal uses (coach/_lib/theme.ts).
struct PortalTheme: Decodable, Equatable {
    var isDark = true
    var bg = "#0B0E14"
    var panel = "#11151D"
    var panel2 = "#161B25"
    var border = "rgba(255,255,255,0.06)"
    var text = "#E8EAEE"
    var text2 = "rgba(232,234,238,0.64)"
    var text3 = "rgba(232,234,238,0.42)"
    var good = "#6FA88A"
    var bad = "#C77878"
    var warn = "#C9A06B"
    var btnText = "#0B0E14"
    var accent = "#3A8EE0"
    var accentDim = "rgba(58,142,224,0.16)"
    var accentBorder = "rgba(58,142,224,0.45)"
    var accentText = "#3A8EE0"

    /// Before the academy's own look has loaded: the portal's dark default.
    static let standard = PortalTheme()

    var cBg: Color { Color(css: bg) }
    var cPanel: Color { Color(css: panel) }
    var cPanel2: Color { Color(css: panel2) }
    var cBorder: Color { Color(css: border) }
    var cText: Color { Color(css: text) }
    var cText2: Color { Color(css: text2) }
    var cText3: Color { Color(css: text3) }
    var cGood: Color { Color(css: good) }
    var cBad: Color { Color(css: bad) }
    var cWarn: Color { Color(css: warn) }
    var cBtnText: Color { Color(css: btnText) }
    var cAccent: Color { Color(css: accent) }
    var cAccentDim: Color { Color(css: accentDim) }
    var cAccentBorder: Color { Color(css: accentBorder) }
    var cAccentText: Color { Color(css: accentText) }
    var scheme: ColorScheme { isDark ? .dark : .light }

    enum K: String, CodingKey { case isDark, bg, panel, panel2, border, text, text2, text3, good, bad, warn, btnText, accent, accentDim, accentBorder, accentText }
    init() {}
    init(from d: Decoder) throws {
        let c = try d.container(keyedBy: K.self)
        func s(_ k: K, _ fallback: String) -> String { ((try? c.decodeIfPresent(String.self, forKey: k)) ?? nil) ?? fallback }
        let base = PortalTheme()
        isDark = ((try? c.decodeIfPresent(Bool.self, forKey: .isDark)) ?? nil) ?? true
        bg = s(.bg, base.bg); panel = s(.panel, base.panel); panel2 = s(.panel2, base.panel2); border = s(.border, base.border)
        text = s(.text, base.text); text2 = s(.text2, base.text2); text3 = s(.text3, base.text3)
        good = s(.good, base.good); bad = s(.bad, base.bad); warn = s(.warn, base.warn); btnText = s(.btnText, base.btnText)
        accent = s(.accent, base.accent); accentDim = s(.accentDim, base.accentDim)
        accentBorder = s(.accentBorder, base.accentBorder); accentText = s(.accentText, base.accentText)
    }
}

extension Color {
    /// A CSS colour as the website writes them: "#3A8EE0" or "rgba(58,142,224,0.16)".
    init(css: String) {
        let t = css.trimmingCharacters(in: .whitespaces).lowercased()
        if t.hasPrefix("rgb") {
            let nums = t.drop { $0 != "(" }.dropFirst().prefix { $0 != ")" }
                .split(separator: ",").map { Double($0.trimmingCharacters(in: .whitespaces)) ?? 0 }
            let r = nums.count > 0 ? nums[0] : 0, g = nums.count > 1 ? nums[1] : 0, b = nums.count > 2 ? nums[2] : 0
            self.init(.sRGB, red: r / 255, green: g / 255, blue: b / 255, opacity: nums.count > 3 ? nums[3] : 1)
        } else {
            self.init(hex: t)
        }
    }
}

private struct PortalThemeKey: EnvironmentKey { static let defaultValue = PortalTheme.standard }
extension EnvironmentValues {
    var portal: PortalTheme {
        get { self[PortalThemeKey.self] }
        set { self[PortalThemeKey.self] = newValue }
    }
}

/// A card as the portal draws one: its panel colour, a hairline border, rounded.
struct PortalCard<Content: View>: View {
    @Environment(\.portal) private var T
    var padding: CGFloat = 16
    var background: AnyShapeStyle? = nil
    var leftStripe: Color? = nil
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) { content() }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(padding)
            .background(background ?? AnyShapeStyle(T.cPanel), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(alignment: .leading) {
                if let leftStripe {
                    UnevenRoundedRectangle(topLeadingRadius: 14, bottomLeadingRadius: 14, style: .continuous).fill(leftStripe).frame(width: 3)
                }
            }
            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(T.cBorder, lineWidth: 1))
    }
}

/// The portal's section heading inside a card ("Inbox", "Today").
struct PortalTitle: View {
    @Environment(\.portal) private var T
    let text: String
    var sub: String? = nil
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 5) {
            Text(text).font(.system(size: 15, weight: .bold)).foregroundStyle(T.cText)
            if let sub { Text("· \(sub)").font(.system(size: 13)).foregroundStyle(T.cText3) }
        }
    }
}

/// Buttons that wrap onto the next line, like the portal's quick actions.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowH: CGFloat = 0, widest: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x > 0, x + s.width > width { x = 0; y += rowH + spacing; rowH = 0 }
            x += s.width + spacing; rowH = max(rowH, s.height); widest = max(widest, x - spacing)
        }
        return CGSize(width: proposal.width ?? widest, height: y + rowH)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowH: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x > bounds.minX, x + s.width > bounds.maxX { x = bounds.minX; y += rowH + spacing; rowH = 0 }
            v.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(s))
            x += s.width + spacing; rowH = max(rowH, s.height)
        }
    }
}
