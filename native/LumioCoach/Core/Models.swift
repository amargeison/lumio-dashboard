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

    struct Player: Decodable {
        let id: String
        let name: String?
        let nickname: String?
        let level: String?
        let category: String?
        let age: Int?
        let parentName: String?

        enum CodingKeys: String, CodingKey {
            case id, name, nickname, level, category, age
            case parentName = "parent_name"
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
        }
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
