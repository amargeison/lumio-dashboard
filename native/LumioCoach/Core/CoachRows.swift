import Foundation

// Rows of the coach portal's tables, as /api/app/v1/coach/rows returns them
// (decoded with Rows.decoder: snake_case → camelCase). Only the columns the app
// uses; everything is optional where the database allows null.

/// GET /api/app/v1/coach/setup
struct CoachSetup: Decodable {
    struct Venue: Decodable, Identifiable, Hashable { let id: String; let name: String; let isHome: Bool }
    struct Court: Decodable, Identifiable, Hashable { let id: String; let name: String; let venueId: String? }
    struct Coach: Decodable, Identifiable, Hashable { let id: String; let name: String }
    struct Me: Decodable { let isHead: Bool; let staffId: String?; let name: String? }
    struct Camp: Decodable, Identifiable, Hashable { let id: String; let name: String; let start: String; let end: String }
    struct Summaries: Decodable { let send: String; let at: String }

    let lessonTypes: [String]
    let defaultDuration: Int
    let venues: [Venue]
    let courts: [Court]
    let coaches: [Coach]
    let me: Me
    let camps: [Camp]
    let summaries: Summaries

    /// The camp running on a day, if any (no lessons can be booked then).
    func camp(on iso: String) -> Camp? { camps.first { $0.start <= iso && iso <= $0.end } }
}

/// POST /api/app/v1/coach/quote
struct Quote: Decodable, Equatable {
    let total: Int?
    let each: Int?
    let people: Int?
    let why: String?
    let court: Int?
}

/// coach_bookings
struct BookingRecord: Decodable, Identifiable, Hashable {
    let id: String
    let bookingDate: String?
    let startTime: String?
    let durationMin: Int?
    let title: String?
    let type: String?
    let status: String?
    let playerId: String?
    let playerName: String?
    let court: String?
    let courtId: String?
    let venueId: String?
    let assignedCoach: String?
    let notes: String?
    let headcount: Int?
    let pricePennies: Int?
    let cancelledBy: String?
    let toldState: String?

    var isCancelled: Bool { status == "cancelled" }
    /// The family has been sent a booking confirmation for it.
    var familyTold: Bool { (toldState ?? "").hasSuffix("|booked") || (toldState ?? "").contains("|booked|") }
}

/// coach_players (the few columns the forms need)
struct PlayerRecord: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let email: String?
    let parentEmail: String?
    let contactEmail: String?
    let phone: String?
    let category: String?
    let racketStage: String?
    var hasEmail: Bool { [email, parentEmail, contactEmail].contains { ($0 ?? "").contains("@") } }
}

/// coach_sessions — a lesson summary.
struct SessionRecord: Decodable, Identifiable, Hashable {
    let id: String
    let playerId: String?
    let playerName: String?
    let sessionDate: String?
    let focus: String?
    let rating: Int?
    let summary: String?
    let reviewJson: Review?
    let sharedAt: String?
    let sharedTo: String?
    let shareDueAt: String?
    let shareError: String?
    let createdAt: String?

    struct Review: Codable, Hashable {
        var focus: String?
        var type: String?
        var time: String?
        var court: String?
        var duration: Int?
        var rating: Int?
        var covered: [String]?
        var takeaways: [String]?
        var drills: [String]?
        var skillsWorked: [String]?
        var technique: [String]?
        var homework: String?
        var nextFocus: String?
        var assessment: String?
        var recap: String?
        var playerNote: String?
        var coachNote: String?

        init() {}
        init(from d: Decoder) throws {
            let c = try d.container(keyedBy: CodingKeys.self)
            func s(_ k: CodingKeys) -> String? { try? c.decodeIfPresent(String.self, forKey: k) }
            func l(_ k: CodingKeys) -> [String]? { try? c.decodeIfPresent([String].self, forKey: k) }
            func n(_ k: CodingKeys) -> Int? {
                if let i = try? c.decodeIfPresent(Int.self, forKey: k) { return i }
                if let t = try? c.decodeIfPresent(String.self, forKey: k) { return Int(t.filter(\.isNumber)) }
                return nil
            }
            focus = s(.focus); type = s(.type); time = s(.time); court = s(.court)
            duration = n(.duration); rating = n(.rating)
            covered = l(.covered); takeaways = l(.takeaways); drills = l(.drills)
            skillsWorked = l(.skillsWorked); technique = l(.technique)
            homework = s(.homework); nextFocus = s(.nextFocus); assessment = s(.assessment)
            recap = s(.recap); playerNote = s(.playerNote); coachNote = s(.coachNote)
        }
    }

    var sent: Bool { sharedAt != nil }
    var scheduled: Bool { shareDueAt != nil && sharedAt == nil }
}

/// coach_groups
struct GroupRecord: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let weekday: Int
    let startTime: String
    let durationMin: Int?
    let venueId: String?
    let court: String?
    let capacity: Int?
    let pricePennies: Int?
    let askDays: Int?
    let active: Bool?
}

struct GroupMemberRecord: Decodable, Identifiable, Hashable { let id: String; let groupId: String; let playerId: String }

struct GroupSessionRecord: Decodable, Identifiable, Hashable {
    let id: String
    let groupId: String
    let sessionDate: String
    let bookingId: String?
    let status: String?
    let askedAt: String?
}

struct GroupReplyRecord: Decodable, Identifiable, Hashable {
    let id: String
    let sessionId: String
    let playerId: String
    let answer: String?
    let answeredBy: String?
    let late: Bool?
    let sentAt: String?
    let openedAt: String?
}

/// coach_leads
struct LeadRecord: Decodable, Identifiable, Hashable {
    let id: String
    let pipeline: String?
    let stage: String?
    let name: String
    let forName: String?
    let email: String?
    let phone: String?
    let source: String?
    let campaign: String?
    let message: String?
    let notes: String?
    let contactMethod: String?
    let nextActionAt: String?
    let nextAction: String?
    let playerId: String?
    let stageChangedAt: String?
    let createdAt: String?
}

struct LeadEventRecord: Decodable, Identifiable, Hashable {
    let id: String
    let leadId: String
    let kind: String
    let fromStage: String?
    let toStage: String?
    let text: String?
    let points: Int?
    let createdAt: String?
}

/// GET /api/coach/pay/cards — cards on file, and what has been charged.
struct PayCards: Decodable {
    struct Method: Decodable, Identifiable, Hashable {
        let id: String
        let playerId: String?
        let status: String?
        let kind: String?
        let brand: String?
        let last4: String?
    }
    struct Charge: Decodable, Identifiable, Hashable {
        let id: String
        let bookingId: String?
        let replyId: String?
        let playerId: String?
        let kind: String?
        let status: String?
        let amountPennies: Int?
        let refundedPennies: Int?
        let failureReason: String?
        let createdAt: String?
        var live: Bool { ["pending", "charging", "processing", "paid"].contains(status ?? "") }
    }
    let connected: Bool?
    let chargesEnabled: Bool?
    let methods: [Method]?
    let charges: [Charge]?

    func card(for playerId: String?) -> Method? {
        guard let playerId else { return nil }
        return methods?.first { $0.playerId == playerId && $0.status == "active" }
    }
}

/// POST /api/coach/pay/charge
struct ChargeResult: Decodable {
    let ok: Bool?
    let status: String?
    let error: String?
    let chargeId: String?
    let needsClient: Bool?
    let amountPennies: Int?
}

/// coach_session_plans — a session plan, usually for a booked lesson.
struct PlanRecord: Decodable, Identifiable, Hashable {
    let id: String
    let title: String?
    let sessionDate: String?
    let startTime: String?
    let sessionType: String?
    let court: String?
    let groupName: String?
    let focus: String?
    let durationMin: Int?
    let racketStage: String?
    let playerId: String?
    let standard: String?
    let focusPoints: String?
    let drills: String?
    let notes: String?
    let runSheet: [Phase]?
    let kit: [String]?
    let coachNote: String?
    let builtBy: String?
    let bookingId: String?
    let completedAt: String?

    var finished: Bool { completedAt != nil }
    var focusLines: [String] { Self.lines(focusPoints) }
    var drillLines: [String] { Self.lines(drills) }
    static func lines(_ s: String?) -> [String] {
        (s ?? "").split(whereSeparator: \.isNewline).map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
    }

    /// Tolerant of a run sheet or kit saved in an older shape: a bad one reads as empty.
    init(from d: Decoder) throws {
        enum K: String, CodingKey {
            case id, title, sessionDate, startTime, sessionType, court, groupName, focus, durationMin, racketStage
            case playerId, standard, focusPoints, drills, notes, runSheet, kit, coachNote, builtBy, bookingId, completedAt
        }
        let c = try d.container(keyedBy: K.self)
        func s(_ k: K) -> String? { try? c.decodeIfPresent(String.self, forKey: k) }
        id = try c.decode(String.self, forKey: .id)
        title = s(.title); sessionDate = s(.sessionDate); startTime = s(.startTime); sessionType = s(.sessionType)
        court = s(.court); groupName = s(.groupName); focus = s(.focus)
        durationMin = try? c.decodeIfPresent(Int.self, forKey: .durationMin)
        racketStage = s(.racketStage); playerId = s(.playerId); standard = s(.standard)
        focusPoints = s(.focusPoints); drills = s(.drills); notes = s(.notes)
        runSheet = try? c.decodeIfPresent([Phase].self, forKey: .runSheet)
        kit = try? c.decodeIfPresent([String].self, forKey: .kit)
        coachNote = s(.coachNote); builtBy = s(.builtBy); bookingId = s(.bookingId); completedAt = s(.completedAt)
    }
}

/// One block of a run sheet: "Warm-up · 10 min".
struct Phase: Codable, Hashable, Identifiable {
    var id = UUID()
    var phase: String
    var mins: Int
    var detail: String
    var cue: String?

    enum CodingKeys: String, CodingKey { case phase, mins, detail, cue }

    init(phase: String, mins: Int, detail: String, cue: String? = nil) {
        self.phase = phase; self.mins = mins; self.detail = detail; self.cue = cue
    }
    init(from d: Decoder) throws {
        let c = try d.container(keyedBy: CodingKeys.self)
        let name: String? = try? c.decodeIfPresent(String.self, forKey: .phase)
        phase = name ?? ""
        let whole: Int? = try? c.decodeIfPresent(Int.self, forKey: .mins)
        let decimal: Double? = try? c.decodeIfPresent(Double.self, forKey: .mins)
        let text: String? = try? c.decodeIfPresent(String.self, forKey: .mins)
        mins = whole ?? decimal.map { Int($0) } ?? text.flatMap { Int($0) } ?? 5
        let body: String? = try? c.decodeIfPresent(String.self, forKey: .detail)
        detail = body ?? ""
        cue = try? c.decodeIfPresent(String.self, forKey: .cue)
    }
    func encode(to e: Encoder) throws {
        var c = e.container(keyedBy: CodingKeys.self)
        try c.encode(phase, forKey: .phase)
        try c.encode(mins, forKey: .mins)
        try c.encode(detail, forKey: .detail)
        if let cue, !cue.isEmpty { try c.encode(cue, forKey: .cue) }
    }
}

/// POST /api/coach/session-draft
struct SessionDraft: Decodable {
    let focusPoints: [String]?
    let drills: [String]?
    let runSheet: [Phase]?
    let kit: [String]?
    let coachNote: String?
    let builtOnHistory: Bool?
    let builtOnAnswers: Bool?
}

/// The racket (or colour) stages, in order.
enum RacketStages {
    static let ids = ["white", "yellow", "orange", "green", "blue", "purple", "brown", "red", "black"]
    static func name(_ id: String?) -> String? { id.flatMap { ids.contains($0) ? $0.capitalized : nil } }
}
