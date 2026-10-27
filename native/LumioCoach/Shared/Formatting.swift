import Foundation

/// Dates as the website sends them ("2026-11-02", "17:00", ISO timestamps), shown
/// the way a UK coach writes them: "Mon 2 Nov", "17:00", "Yesterday".
enum Fmt {
    static let london = TimeZone(identifier: "Europe/London")!

    private static let isoDay: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_GB_POSIX")
        f.timeZone = london
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static func formatter(_ format: String) -> DateFormatter {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_GB")
        f.timeZone = london
        f.setLocalizedDateFormatFromTemplate(format)
        return f
    }
    private static let shortDay = formatter("EEEdMMM")
    private static let longDay = formatter("EEEEdMMMM")
    private static let clock = formatter("HHmm")

    static func day(_ iso: String) -> Date? { isoDay.date(from: String(iso.prefix(10))) }
    static func iso(_ date: Date) -> String { isoDay.string(from: date) }
    static var todayISO: String { iso(Date()) }

    /// "Mon 2 Nov"
    static func dayShort(_ iso: String) -> String { day(iso).map { shortDay.string(from: $0) } ?? iso }
    /// "Monday 2 November"
    static func dayLong(_ iso: String) -> String { day(iso).map { longDay.string(from: $0) } ?? iso }

    /// "Today", "Tomorrow", or "Mon 2 Nov"
    static func dayFriendly(_ iso: String) -> String {
        if iso == todayISO { return "Today" }
        if let d = day(todayISO).flatMap({ Calendar.current.date(byAdding: .day, value: 1, to: $0) }), iso == self.iso(d) { return "Tomorrow" }
        return dayShort(iso)
    }

    static func time(_ t: String?) -> String { t.map { String($0.prefix(5)) } ?? "" }

    static func endTime(_ t: String?, mins: Int) -> String {
        guard let t, t.count >= 5, let h = Int(t.prefix(2)), let m = Int(t.dropFirst(3).prefix(2)) else { return "" }
        let total = h * 60 + m + mins
        return String(format: "%02d:%02d", (total / 60) % 24, total % 60)
    }

    // ISO timestamps, with or without fractional seconds.
    private static let stamp1: ISO8601DateFormatter = { let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; return f }()
    private static let stamp2: ISO8601DateFormatter = { let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime]; return f }()
    static func stamp(_ s: String?) -> Date? {
        guard let s else { return nil }
        return stamp1.date(from: s) ?? stamp2.date(from: s) ?? stamp2.date(from: s.replacingOccurrences(of: " ", with: "T") + (s.contains("+") || s.hasSuffix("Z") ? "" : "Z"))
    }

    /// "14:05" today, "Yesterday", "Mon", or "2 Nov"
    static func when(_ s: String?) -> String {
        guard let d = stamp(s) else { return "" }
        let cal = Calendar.current
        if cal.isDateInToday(d) { return clock.string(from: d) }
        if cal.isDateInYesterday(d) { return "Yesterday" }
        if let days = cal.dateComponents([.day], from: d, to: Date()).day, days < 7 { return formatter("EEE").string(from: d) }
        return formatter("dMMM").string(from: d)
    }

    /// "Mon 2 Nov, 17:20"
    static func moment(_ s: String?) -> String {
        guard let d = stamp(s) else { return "" }
        return "\(shortDay.string(from: d)), \(clock.string(from: d))"
    }

    static func money(_ pennies: Int) -> String {
        pennies % 100 == 0 ? "£\(pennies / 100)" : String(format: "£%.2f", Double(pennies) / 100)
    }

    static func greeting(_ date: Date = Date()) -> String {
        var cal = Calendar(identifier: .gregorian); cal.timeZone = london
        switch cal.component(.hour, from: date) {
        case 5..<12: return "Good morning"
        case 12..<18: return "Good afternoon"
        default: return "Good evening"
        }
    }

    static func initials(_ name: String) -> String {
        let parts = name.split(separator: " ").prefix(2)
        return parts.compactMap { $0.first }.map { String($0) }.joined().uppercased()
    }

    static func mins(_ m: Int) -> String { m % 60 == 0 ? (m == 60 ? "1 hour" : "\(m / 60) hours") : "\(m) min" }
}
