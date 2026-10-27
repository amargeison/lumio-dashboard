import Foundation

// The shapes the website sends. Field names follow the website exactly; where
// it uses snake_case, CodingKeys map it.

// MARK: Sign-in

struct AuthStart: Decodable {
    let status: String      // code_sent | unknown | demo
    let kind: String?       // coach | family (wording only)
}

// MARK: Who am I

/// GET /api/coach/whoami — a coach at an academy.
struct CoachMe: Decodable, Equatable {
    let academyId: String
    let staffId: String?
    let isHead: Bool
    let brandName: String?
    let slug: String?
    let displayName: String?
    let academies: [AcademyChoice]?

    struct AcademyChoice: Decodable, Equatable, Identifiable {
        let slug: String
        let name: String?
        let isHead: Bool
        let current: Bool
        var id: String { slug }
    }

    var academyName: String { (brandName?.isEmpty == false ? brandName : nil) ?? "Your academy" }
}

/// GET /api/portal/me — a player, or a parent of one or more players.
struct FamilyMe: Decodable {
    let role: String?
    let email: String?
    let players: [FamilyPlayer]?
}

struct FamilyPlayer: Decodable, Equatable, Identifiable, Hashable {
    let playerId: String
    let name: String
    let role: String
    let academyId: String
    let academyName: String
    var id: String { playerId }
    var firstName: String { name.split(separator: " ").first.map(String.init) ?? name }
    var isParent: Bool { role == "parent" }
}

// MARK: Coach

struct AppBooking: Decodable, Identifiable, Equatable, Hashable {
    let id: String
    let date: String
    let time: String?
    let mins: Int
    let title: String
    let type: String?
    let court: String?
    let playerId: String?
    let playerName: String?
    let coach: String?
    let status: String          // confirmed | pending | cancelled
    let clientConfirmed: Confirmation?
    let cancelledByClient: Bool
    let paid: Bool
    let headcount: Int?
    let notes: String?

    var isCancelled: Bool { status == "cancelled" }
    var isPending: Bool { status == "pending" }
    var isGroup: Bool { (type ?? "").lowercased().contains("group") || (headcount ?? 0) > 1 }
}

struct Confirmation: Decodable, Equatable, Hashable {
    let at: String
    let by: String?
}

struct CoachToday: Decodable {
    struct Academy: Decodable { let id: String; let name: String?; let slug: String?; let isHead: Bool }
    struct Counts: Decodable { let today: Int; let confirmedByClients: Int; let thisWeek: Int; let pending: Int }
    let academy: Academy
    let date: String
    let sessions: [AppBooking]
    let counts: Counts
    let tomorrow: [AppBooking]
}

struct BookingRange: Decodable { let from: String; let to: String; let bookings: [AppBooking] }

struct AppPlayer: Decodable, Identifiable, Equatable, Hashable {
    let id: String
    let name: String
    let email: String?
    let phone: String?
    let parentName: String?
    let parentEmail: String?
    let parentPhone: String?
    let category: String?
    let level: String?
    let age: Int?
    let nextLesson: NextLesson?

    struct NextLesson: Decodable, Equatable, Hashable { let date: String; let time: String? }

    var subtitle: String { [category, level].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ") }
    /// Who to call or email: the parent for a junior, else the player.
    var contactPhone: String? { parentPhone ?? phone }
    var contactEmail: String? { parentEmail ?? email }
    var contactName: String { parentName ?? name }
}

struct PlayersResponse: Decodable { let players: [AppPlayer] }
struct PlayerDetail: Decodable { let player: AppPlayer; let page: MyPage }

struct Conversation: Decodable, Identifiable, Equatable, Hashable {
    let id: String
    let title: String
    let tag: String?
    let playerId: String?
    let last: Last?
    let unread: Int
    let canReply: Bool

    struct Last: Decodable, Equatable, Hashable { let body: String; let at: String; let fromThem: Bool }
}

struct ConversationsResponse: Decodable { let conversations: [Conversation] }

struct ChatMessage: Decodable, Identifiable, Equatable {
    let id: String
    let fromThem: Bool
    let from: String?
    let subject: String?
    let body: String
    let at: String
}

struct ThreadResponse: Decodable { let id: String; let messages: [ChatMessage] }

// MARK: Family (the player app)

struct MyPage: Decodable, Equatable {
    let lessons: [MyLesson]
    let groups: [MyGroup]
    let account: MyAccount
    let booking: MyBooking
}

struct MyLesson: Decodable, Identifiable, Equatable {
    let id: String
    let date: String
    let time: String?
    let mins: Int
    let type: String?
    let court: String?
    let coach: String?
    let paid: Bool
    let cover: String?          // plan | pack | nil
    let confirmed: Confirmation?
    let cancel: CancelTerms

    struct CancelTerms: Decodable, Equatable { let free: Bool; let words: String; let confirm: String }
}

struct MyGroup: Decodable, Identifiable, Equatable {
    let id: String
    let name: String
    let every: String
    let price: Int
    let venue: String?
    let next: Next?

    struct Next: Decodable, Equatable {
        let date: String
        let time: String
        let token: String?
        let askOn: String?
        let answer: String?     // yes | no | nil
        let paid: Bool
        let coveredByPlan: Bool
        let placesLeft: Int?
        let freeUntil: String?
        let cancelled: Bool
    }
}

struct MyAccount: Decodable, Equatable {
    let plan: Plan?
    let packs: [Pack]
    let method: String?
    let policy: [PolicyLine]
    let owed: [Owed]

    struct Plan: Decodable, Equatable { let name: String; let words: String; let covers: String; let status: String; let nextBill: String?; let agreed: Bool }
    struct Pack: Decodable, Equatable, Identifiable { let name: String; let used: Int; let total: Int; let left: Int; let renews: String?; var id: String { name + String(total) } }
    struct PolicyLine: Decodable, Equatable, Identifiable { let title: String; let text: String; var id: String { title } }
    struct Owed: Decodable, Equatable, Identifiable { let kind: String; let title: String; let detail: String; let url: String; var id: String { url } }
}

struct MyBooking: Decodable, Equatable {
    let on: Bool
    let durations: [Int]
    let duration: Int
    let type: String
}

struct SlotDay: Decodable, Identifiable, Equatable {
    let date: String
    let label: String
    let slots: [String]
    var id: String { date }
}

struct SlotsResponse: Decodable { let days: [SlotDay] }

/// GET /api/portal/player — what the family's page shows.
struct FamilyBundle: Decodable {
    let player: Player
    let lessons: [LessonSummary]?
    let messages: [FamilyMessage]?
    let my: MyPage?
    // Progress, videos and rewards. Each is read on its own, so one odd field
    // never stops the rest of the page showing.
    let skills: [Skill]
    let watch: [WatchSession]
    let highlights: [Clip]
    let media: [VoiceNote]
    let resources: [Resource]
    let books: [Book]
    let nextSession: NextSession?
    let features: Features?
    let sectionsOff: [String]
    let awardThreshold: Int
    let adultLevel: AdultLevel?
    /// Camps they hold a place on, already laid out by the server (camp-view.ts).
    let campCards: [CampCard]

    enum CodingKeys: String, CodingKey {
        case player, lessons, messages, my, skills, watch, highlights, media, resources, books
        case nextSession, features, sectionsOff, awardThreshold, adultLevel, campCards
    }

    init(from d: Decoder) throws {
        let c = try d.container(keyedBy: CodingKeys.self)
        player = try c.decode(Player.self, forKey: .player)
        lessons = try? c.decodeIfPresent([LessonSummary].self, forKey: .lessons)
        messages = try? c.decodeIfPresent([FamilyMessage].self, forKey: .messages)
        my = try? c.decodeIfPresent(MyPage.self, forKey: .my)
        skills = (try? c.decodeIfPresent([Skill].self, forKey: .skills)) ?? []
        watch = (try? c.decodeIfPresent([WatchSession].self, forKey: .watch)) ?? []
        highlights = (try? c.decodeIfPresent([Clip].self, forKey: .highlights)) ?? []
        media = (try? c.decodeIfPresent([VoiceNote].self, forKey: .media)) ?? []
        resources = (try? c.decodeIfPresent([Resource].self, forKey: .resources)) ?? []
        books = (try? c.decodeIfPresent([Book].self, forKey: .books)) ?? []
        nextSession = try? c.decodeIfPresent(NextSession.self, forKey: .nextSession)
        features = try? c.decodeIfPresent(Features.self, forKey: .features)
        sectionsOff = (try? c.decodeIfPresent([String].self, forKey: .sectionsOff)) ?? []
        awardThreshold = (try? c.decodeIfPresent(Int.self, forKey: .awardThreshold)) ?? 3
        adultLevel = try? c.decodeIfPresent(AdultLevel.self, forKey: .adultLevel)
        campCards = (try? c.decodeIfPresent([CampCard].self, forKey: .campCards)) ?? []
    }

    /// A module is shown when it's on (no flags means everything on) and the coach hasn't hidden its section.
    func shows(_ section: String, module: KeyPath<Features, Bool?>? = nil) -> Bool {
        if sectionsOff.contains(section) { return false }
        guard let module, let f = features else { return true }
        return f[keyPath: module] != false
    }

    struct Player: Decodable {
        let id: String
        let name: String?
        let nickname: String?
        let level: String?
        let category: String?
        let age: Int?
        let parentName: String?
        let racketStage: String?
        let goal: String?
        let xpTotal: Int?
        let avatarUrl: String?

        enum CodingKeys: String, CodingKey {
            case id, name, nickname, level, category, age, goal
            case parentName = "parent_name"
            case racketStage = "racket_stage"
            case xpTotal = "xp_total"
            case avatarUrl = "avatar_url"
        }

        init(from d: Decoder) throws {
            let c = try d.container(keyedBy: CodingKeys.self)
            id = try c.decode(String.self, forKey: .id)
            name = try? c.decodeIfPresent(String.self, forKey: .name)
            nickname = try? c.decodeIfPresent(String.self, forKey: .nickname)
            level = try? c.decodeIfPresent(String.self, forKey: .level)
            category = try? c.decodeIfPresent(String.self, forKey: .category)
            // Age arrives as a number or a string, depending on how it was entered.
            if let n = try? c.decodeIfPresent(Int.self, forKey: .age) { age = n }
            else if let s = try? c.decodeIfPresent(String.self, forKey: .age) { age = Int(s) }
            else { age = nil }
            parentName = try? c.decodeIfPresent(String.self, forKey: .parentName)
            racketStage = try? c.decodeIfPresent(String.self, forKey: .racketStage)
            goal = try? c.decodeIfPresent(String.self, forKey: .goal)
            if let n = try? c.decodeIfPresent(Int.self, forKey: .xpTotal) { xpTotal = n }
            else if let x = try? c.decodeIfPresent(Double.self, forKey: .xpTotal) { xpTotal = Int(x) }
            else { xpTotal = nil }
            avatarUrl = try? c.decodeIfPresent(String.self, forKey: .avatarUrl)
        }
    }

    struct Skill: Decodable, Hashable { let skill: String; let score: Int }

    struct WatchSession: Decodable, Hashable, Identifiable {
        let startedAt: String?
        let durationMin: Double?
        let avgHr: Double?
        let maxHr: Double?
        let distanceM: Double?
        let effortScore: Double?
        let movementScore: Double?
        let consistencyScore: Double?
        let xpAwarded: Double?
        var id: String { (startedAt ?? "") + String(durationMin ?? 0) }
        enum CodingKeys: String, CodingKey {
            case startedAt = "started_at", durationMin = "duration_min", avgHr = "avg_hr", maxHr = "max_hr"
            case distanceM = "distance_m", effortScore = "effort_score", movementScore = "movement_score"
            case consistencyScore = "consistency_score", xpAwarded = "xp_awarded"
        }
    }

    struct Clip: Decodable, Hashable, Identifiable {
        let id: String
        let title: String?
        let shotType: String?
        let durationSeconds: Double?
        let createdAt: String?
        let url: String?
        enum CodingKeys: String, CodingKey {
            case id, title, url
            case shotType = "shot_type", durationSeconds = "duration_seconds", createdAt = "created_at"
        }
    }

    struct VoiceNote: Decodable, Hashable, Identifiable {
        let id: String
        let title: String?
        let durationSeconds: Double?
        let createdAt: String?
        let url: String?
        enum CodingKeys: String, CodingKey {
            case id, title, url
            case durationSeconds = "duration_seconds", createdAt = "created_at"
        }
    }

    struct Resource: Decodable, Hashable, Identifiable {
        let id: String
        let title: String?
        let category: String?
        let format: String?
        let notes: String?
        let url: String?
    }

    struct Book: Decodable, Hashable, Identifiable {
        let id: String
        let title: String?
        let author: String?
        let note: String?
    }

    struct NextSession: Decodable {
        let date: String?
        let startTime: String?
        let durationMin: Int?
        let type: String?
        let court: String?
        let coach: String?
        let plan: Plan?
        struct Plan: Decodable {
            let title: String?
            let focus: String?
            let runSheet: [Phase]?
            let drills: [String]?
        }
        enum CodingKeys: String, CodingKey {
            case date, type, court, coach, plan
            case startTime = "start_time", durationMin = "duration_min"
        }
        init(from d: Decoder) throws {
            let c = try d.container(keyedBy: CodingKeys.self)
            date = try? c.decodeIfPresent(String.self, forKey: .date)
            startTime = try? c.decodeIfPresent(String.self, forKey: .startTime)
            durationMin = try? c.decodeIfPresent(Int.self, forKey: .durationMin)
            type = try? c.decodeIfPresent(String.self, forKey: .type)
            court = try? c.decodeIfPresent(String.self, forKey: .court)
            coach = try? c.decodeIfPresent(String.self, forKey: .coach)
            plan = try? c.decodeIfPresent(Plan.self, forKey: .plan)
        }
    }

    struct Features: Decodable { let effort: Bool?; let video: Bool?; let audio: Bool?; let racket: Bool? }

    struct AdultLevel: Decodable {
        let name: String?
        let summary: String?
        let number: Int?
        let of: Int?
        let next: String?
        let checklist: [Item]?
        let done: Int?
        let total: Int?
        struct Item: Decodable, Hashable { let text: String; let passed: Bool }
    }
}

struct LessonSummary: Decodable, Identifiable {
    let id: String
    let sessionDate: String?
    let focus: String?
    let summary: String?
    let review: Review?
    let rating: Double?

    struct Review: Decodable {
        let focus: String?
        let type: String?
        let recap: String?
        let takeaways: [String]?
        let covered: [String]?
        let homework: String?
        let nextFocus: String?
        let playerNote: String?
        let assessment: String?
    }

    enum CodingKeys: String, CodingKey {
        case id, focus, summary, rating
        case sessionDate = "session_date"
        case review = "review_json"
    }
}

struct FamilyMessage: Decodable, Identifiable {
    let id: String
    let direction: String?
    let fromName: String?
    let subject: String?
    let body: String?
    let createdAt: String?

    /// "in" on the coach's side means the family wrote it.
    var fromFamily: Bool { direction == "in" }

    enum CodingKeys: String, CodingKey {
        case id, direction, subject, body
        case fromName = "from_name"
        case createdAt = "created_at"
    }
}

/// POST /api/group/<token> answers with the week as it now stands, plus a notice.
struct GroupAnswer: Decodable { let notice: String?; let error: String?; let url: String? }
struct WebSessionResponse: Decodable { let url: String }


// MARK: - A family's camp

/// One camp, as the website's camp card shows it, in plain blocks
/// (src/lib/student/camp-view.ts → campCardForApp).
struct CampCard: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let place: String
    let startDate: String?
    let endDate: String?
    let daysUntil: Int?
    let dayOf: String?
    let intro: [String]
    let balanceLink: String?
    let tabs: [Tab]

    struct Tab: Decodable, Identifiable, Hashable {
        let id: String
        let label: String
        let icon: String
        let blocks: [Block]
    }

    struct Fact: Decodable, Hashable { let label: String; let value: String }
    struct Day: Decodable, Hashable { let label: String; let date: String?; let focus: String?; let detail: String? }
    struct TimeRow: Decodable, Hashable { let when: String; let what: String }
    struct Place: Decodable, Hashable { let name: String; let kind: String?; let address: String?; let phone: String?; let note: String?; let map: String?; let web: String? }
    struct Person: Decodable, Hashable { let name: String; let role: String?; let phone: String?; let note: String? }

    /// One piece of a tab. Anything this version of the app doesn't know is skipped.
    enum Block: Decodable, Hashable {
        case highlight(label: String, text: String)
        case text(String)
        case timetable(title: String, rows: [TimeRow])
        case days(title: String, days: [Day])
        case list(title: String, icon: String, style: String, items: [String], note: String?, measure: String?)
        case facts(title: String, icon: String, address: String?, rows: [Fact], map: String?, web: String?)
        case places(title: String, icon: String, places: [Place])
        case contacts([Person])
        case link(label: String, url: String)
        case unknown

        enum K: String, CodingKey { case kind, label, text, title, rows, days, icon, style, items, note, measure, address, map, web, places, people, url }

        init(from d: Decoder) throws {
            let c = try d.container(keyedBy: K.self)
            func s(_ k: K) -> String? { (try? c.decodeIfPresent(String.self, forKey: k)) ?? nil }
            switch s(.kind) {
            case "highlight": self = .highlight(label: s(.label) ?? "", text: s(.text) ?? "")
            case "text": self = .text(s(.text) ?? "")
            case "timetable": self = .timetable(title: s(.title) ?? "", rows: (try? c.decode([TimeRow].self, forKey: .rows)) ?? [])
            case "days": self = .days(title: s(.title) ?? "", days: (try? c.decode([Day].self, forKey: .days)) ?? [])
            case "list": self = .list(title: s(.title) ?? "", icon: s(.icon) ?? "", style: s(.style) ?? "bullet",
                                      items: (try? c.decode([String].self, forKey: .items)) ?? [], note: s(.note), measure: s(.measure))
            case "facts": self = .facts(title: s(.title) ?? "", icon: s(.icon) ?? "", address: s(.address),
                                        rows: (try? c.decode([Fact].self, forKey: .rows)) ?? [], map: s(.map), web: s(.web))
            case "places": self = .places(title: s(.title) ?? "", icon: s(.icon) ?? "", places: (try? c.decode([Place].self, forKey: .places)) ?? [])
            case "contacts": self = .contacts((try? c.decode([Person].self, forKey: .people)) ?? [])
            case "link": self = .link(label: s(.label) ?? "", url: s(.url) ?? "")
            default: self = .unknown
            }
        }
    }
}

// MARK: - The coach's dashboard (src/lib/app/coach-dashboard.ts)

struct CoachDashboard: Decodable {
    struct Figure: Decodable, Hashable { let label: String; let value: String; let tone: String }
    struct Camp: Decodable {
        let id: String; let name: String; let place: String; let running: Bool; let when: String; let whenTone: String; let fill: Double?; let figures: [Figure]; let note: String
        enum CodingKeys: String, CodingKey { case id, name, place = "where", running, when, whenTone, fill, figures, note }
    }
    struct Next: Decodable { let label: String; let date: String }
    struct Person: Decodable, Identifiable, Hashable { let id: String; let name: String }
    struct Stats: Decodable { let thisWeek: Int; let next: Next?; let players: Int; let unbooked: [Person]; let paymentsDue: String; let paymentsLabel: String }
    struct InboxItem: Decodable, Identifiable { let id: String; let who: String; let incoming: Bool; let tag: String; let text: String; let at: String?; let unread: Bool; let playerId: String?; let reaction: String? }
    struct Need: Decodable, Identifiable { let id: String; let name: String; let reason: String; let avatar: String? }
    struct Upcoming: Decodable, Identifiable { let id: String; let kind: String; let when: String; let date: String; let title: String; let sub: String }
    struct Recent: Decodable, Identifiable { let id: String; let player: String; let when: String; let focus: String }
    struct KitItem: Decodable, Identifiable { let id: String; let name: String; let state: String; let tone: String }
    struct Kit: Decodable { let items: [KitItem]; let more: Int; let empty: String }
    struct Signal: Codable, Hashable { let tag: String; let pri: String; let text: String }
    struct Briefing: Decodable { let signals: [Signal]; let todayCount: Int; let role: String }

    let greeting: String
    let greetName: String
    let clubName: String
    let headline: String
    let racketsDue: Int
    let camp: Camp?
    let stats: Stats
    let inbox: [InboxItem]
    let needs: [Need]
    let needsMore: Int
    let upcoming: [Upcoming]
    let recent: [Recent]
    let kit: Kit
    let briefing: Briefing
    let sectionsOff: [String]

    func shows(_ section: String) -> Bool { !sectionsOff.contains(section) }
}
