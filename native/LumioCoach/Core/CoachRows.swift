import SwiftUI

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
    let features: Features?
    let awardThreshold: Int?
    let upload: Upload?
    /// The portal's colours (Settings → Appearance).
    let theme: PortalTheme?

    struct Features: Decodable { let effort: Bool; let video: Bool; let audio: Bool; let racket: Bool }
    struct Upload: Decodable { let anonKey: String }

    /// "Purple racket" with racket progression on, else just "Purple".
    func stageWords(_ name: String) -> String { features?.racket == true ? "\(name) racket" : name }

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

// MARK: - Round 3: payments, camps, profiles, development, media

/// GET /api/app/v1/coach/payments
struct PaymentsOverview: Decodable {
    struct Totals: Decodable { let earnedPennies: Int; let outstandingPennies: Int; let activePacks: Int; let expiringPacks: Int; let monthlyPennies: Int; let waitingToAgree: Int }
    struct Line: Decodable, Identifiable, Hashable {
        let id: String
        let playerId: String?
        let playerName: String
        let item: String
        let amountPennies: Int?
        let paid: Bool
        let paidAt: String?
        let dueDate: String?
        let renewsDate: String?
        let pack: Bool
        let sessionsTotal: Int?
        let used: Int
        let status: String
        let statusLabel: String
        let owedPennies: Int
        let storedStatus: String?
    }
    struct Membership: Decodable, Identifiable, Hashable {
        let id: String
        let playerId: String?
        let playerName: String
        let name: String
        let amountPennies: Int
        let dayOfMonth: Int
        let startsMonth: String?
        let covers: String?
        let groupId: String?
        let status: String
        let agreed: Bool
        let words: String
        let coversWords: String
        let label: String
        let thisMonth: String
        let canTakeNow: Bool
        let hasCard: Bool
        let nextBill: String?
    }
    struct Package: Decodable, Identifiable, Hashable { let id: String; let name: String; let kind: String?; let pricePennies: Int?; let sessions: Int?; let period: String?; let description: String? }

    let month: String
    let canPrice: Bool
    let totals: Totals
    let lines: [Line]
    let memberships: [Membership]
    let packages: [Package]
}

/// coach_players, every column the profile shows and edits.
struct PlayerProfile: Decodable, Identifiable, Hashable {
    let id: String
    var name: String
    var category: String?
    var age: Int?
    var parentName: String?
    var parentEmail: String?
    var email: String?
    var phone: String?
    var racketStage: String?
    var level: String?
    var paymentMethod: String?
    var goal: String?
    var notes: String?
    var medicalNotes: String?
    var consentData: Bool?
    var consentPhoto: Bool?
    var consentMedical: Bool?
    var consentWearable: Bool?
    var consentRecord: Bool?
    var consentBy: String?
    var consentDate: String?
    var rateReason: String?
    var ratePennies: Int?
    var avatarUrl: String?
    var xpTotal: Int?
    var staffId: String?
    var adultLevelId: String?
    var targets: [Target]?
    var targetsNote: String?

    struct Target: Codable, Hashable { var target: String; var why: String?; var measure: String?; var by: String? }

    var isAdult: Bool { (category ?? "").lowercased().contains("adult") || (age ?? 0) >= 18 || adultLevelId != nil }
    /// Who the family app invite goes to (lib/student/bundle.ts studentAudience).
    var invitee: (email: String?, role: String, name: String) {
        let adult = (category ?? "").lowercased() == "adult" || (age ?? 0) >= 18
        return adult ? (email ?? parentEmail, "student", name) : (parentEmail ?? email, "parent", parentName ?? name)
    }

    init(from d: Decoder) throws {
        enum K: String, CodingKey {
            case id, name, category, age, parentName, parentEmail, email, phone, racketStage, level, paymentMethod, goal, notes, medicalNotes
            case consentData, consentPhoto, consentMedical, consentWearable, consentRecord, consentBy, consentDate, rateReason, ratePennies
            case avatarUrl, xpTotal, staffId, adultLevelId, targets, targetsNote
        }
        let c = try d.container(keyedBy: K.self)
        func s(_ k: K) -> String? { try? c.decodeIfPresent(String.self, forKey: k) }
        func b(_ k: K) -> Bool? { try? c.decodeIfPresent(Bool.self, forKey: k) }
        func i(_ k: K) -> Int? {
            if let v = try? c.decodeIfPresent(Int.self, forKey: k) { return v }
            if let v = try? c.decodeIfPresent(Double.self, forKey: k) { return Int(v) }
            if let v = try? c.decodeIfPresent(String.self, forKey: k) { return Int(v) }
            return nil
        }
        id = try c.decode(String.self, forKey: .id)
        name = s(.name) ?? "Player"
        category = s(.category); age = i(.age); parentName = s(.parentName); parentEmail = s(.parentEmail)
        email = s(.email); phone = s(.phone); racketStage = s(.racketStage); level = s(.level); paymentMethod = s(.paymentMethod)
        goal = s(.goal); notes = s(.notes); medicalNotes = s(.medicalNotes)
        consentData = b(.consentData); consentPhoto = b(.consentPhoto); consentMedical = b(.consentMedical)
        consentWearable = b(.consentWearable); consentRecord = b(.consentRecord); consentBy = s(.consentBy); consentDate = s(.consentDate)
        rateReason = s(.rateReason); ratePennies = i(.ratePennies); avatarUrl = s(.avatarUrl); xpTotal = i(.xpTotal)
        staffId = s(.staffId); adultLevelId = s(.adultLevelId)
        targets = try? c.decodeIfPresent([Target].self, forKey: .targets)
        targetsNote = s(.targetsNote)
    }
}

/// coach_player_notes — private notes about a player.
struct NoteRecord: Decodable, Identifiable, Hashable {
    let id: String
    let playerId: String?
    let kind: String?
    let text: String
    let notedOn: String?
    let pinned: Bool?
    let createdAt: String?

    static let kinds: [(String, String, String)] = [
        ("family", "Family", "Who's at home, siblings, who brings them"),
        ("work", "School or work", "What fills their week"),
        ("interests", "Interests", "Other sports, what they love"),
        ("holidays", "Holidays", "Trips and time away"),
        ("health", "Health", "Only with medical consent"),
        ("other", "Other", "Anything else worth remembering"),
    ]
    static func label(_ k: String?) -> String { kinds.first { $0.0 == k }?.1 ?? "Note" }
}

/// coach_attendance
struct AttendanceRecord: Decodable, Identifiable, Hashable { let id: String; let playerId: String?; let sessionDate: String?; let present: Bool? }

/// coach_player_skills
struct SkillRecord: Decodable, Identifiable, Hashable { let id: String; let playerId: String?; let skill: String; let score: Int? }

/// coach_racket_awards (written by the database)
struct RacketAwardRecord: Decodable, Identifiable, Hashable { let id: String; let fromStage: String?; let toStage: String?; let createdAt: String? }

/// coach_watch_sessions
struct WatchRecord: Decodable, Identifiable, Hashable {
    let id: String
    let source: String?
    let startedAt: String?
    let durationMin: Double?
    let effortScore: Double?
    let xpAwarded: Double?
    let voided: Bool?
}

/// coach_adult_levels / coach_adult_passes
struct AdultLevelRecord: Decodable, Identifiable, Hashable {
    let id: String
    let position: Int?
    let name: String
    let summary: String?
    let checklist: [Item]?
    struct Item: Decodable, Hashable { let id: String; let text: String }
}
struct AdultPassRecord: Decodable, Identifiable, Hashable { let id: String; let levelId: String?; let itemId: String?; let passedOn: String? }

/// coach_media
struct MediaRecord: Decodable, Identifiable, Hashable {
    let id: String
    let kind: String?
    let playerId: String?
    let playerName: String?
    let title: String?
    let status: String?
    let durationSeconds: Double?
    let clipOf: String?
    let shotType: String?
    let shotConfirmed: Bool?
    let sessionId: String?
    let error: String?
    let createdAt: String?
}

/// coach_camps
struct CampRecord: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let startDate: String?
    let endDate: String?
    let location: String?
    let region: String?
    let capacity: Int?
    let price: Double?
    let description: String?
    let paymentMode: String?
    let depositAmount: Double?
    let balanceDue: String?
    let tripSlug: String?
    let tripOpen: Bool?
    let trip: Trip?

    var past: Bool { (endDate ?? startDate ?? "9999") < Fmt.todayISO }
    var pricePennies: Int { Int(((price ?? 0) * 100).rounded()) }

    struct Trip: Decodable, Hashable {
        let intro: String?
        let stay: Place?
        let venue: Place?
        let travel: Travel?
        let contacts: [Contact]?
        let bring: [String]?
        struct Place: Decodable, Hashable { let name: String?; let address: String?; let url: String?; let notes: String?; let checkIn: String? }
        struct Travel: Decodable, Hashable { let airport: String?; let flights: String?; let transfers: String?; let arrival: String?; let departure: String?; let notes: String? }
        struct Contact: Decodable, Hashable { let name: String?; let role: String?; let phone: String?; let note: String? }
    }

    init(from d: Decoder) throws {
        enum K: String, CodingKey { case id, name, startDate, endDate, location, region, capacity, price, description, paymentMode, depositAmount, balanceDue, tripSlug, tripOpen, trip }
        let c = try d.container(keyedBy: K.self)
        func s(_ k: K) -> String? { try? c.decodeIfPresent(String.self, forKey: k) }
        func n(_ k: K) -> Double? {
            if let v = try? c.decodeIfPresent(Double.self, forKey: k) { return v }
            if let v = try? c.decodeIfPresent(String.self, forKey: k) { return Double(v) }
            return nil
        }
        id = try c.decode(String.self, forKey: .id)
        name = s(.name) ?? "Camp"
        startDate = s(.startDate); endDate = s(.endDate); location = s(.location); region = s(.region)
        capacity = n(.capacity).map { Int($0) }; price = n(.price); description = s(.description)
        paymentMode = s(.paymentMode); depositAmount = n(.depositAmount); balanceDue = s(.balanceDue)
        tripSlug = s(.tripSlug); tripOpen = try? c.decodeIfPresent(Bool.self, forKey: .tripOpen)
        trip = try? c.decodeIfPresent(Trip.self, forKey: .trip)
    }
}

/// coach_camp_attendees
struct AttendeeRecord: Decodable, Identifiable, Hashable {
    let id: String
    let campId: String
    let playerId: String?
    let playerName: String
    let paid: Bool?
    let paidPennies: Int?
    let amountPennies: Int?
    let extraPennies: Int?
    let extraLabel: String?
    let status: String?
    let source: String?
    let parentName: String?
    let parentEmail: String?
    let parentPhone: String?
    let playerAge: Int?
    let medicalNotes: String?
    let emergencyContact: String?
    let consentPhoto: Bool?
    let consentMedical: Bool?
    let room: String?
    let arrival: String?
    let campGoal: String?
    let formSubmittedAt: String?
    let formSentAt: String?
    let balanceStatus: String?

    var cancelled: Bool { status == "cancelled" }

    // camp-money.ts, in pennies.
    func due(_ camp: CampRecord) -> Int { camp.pricePennies + (extraPennies ?? 0) }
    func received(_ camp: CampRecord) -> Int {
        let d = due(camp)
        let r: Int
        if paid == true { r = d } else if let p = paidPennies { r = p } else if status == "pending" { r = 0 } else { r = amountPennies ?? 0 }
        return max(0, min(r, d))
    }
    func owed(_ camp: CampRecord) -> Int { cancelled || paid == true ? 0 : max(0, due(camp) - received(camp)) }
    func payState(_ camp: CampRecord) -> (String, Color) {
        if cancelled { return ("Cancelled", .secondary) }
        if paid == true || owed(camp) == 0 { return ("Paid", .green) }
        if received(camp) > 0 { return ("Part paid", .orange) }
        if status == "pending" { return ("Awaiting payment", .orange) }
        return ("Unpaid", .red)
    }
}
