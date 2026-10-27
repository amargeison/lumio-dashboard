import Foundation

/// A value in a row the app saves: the portal's tables take plain JSON.
enum JSONValue: Encodable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case null
    case list([String])
    /// Any Encodable value (e.g. a lesson summary's review_json object).
    case object(any Encodable)

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let s): try c.encode(s)
        case .int(let i): try c.encode(i)
        case .double(let d): try c.encode(d)
        case .bool(let b): try c.encode(b)
        case .null: try c.encodeNil()
        case .list(let l): try c.encode(l)
        case .object(let o): try c.encode(o)
        }
    }

    /// Text, or null when empty (the portal saves blanks as null too).
    static func text(_ s: String?) -> JSONValue {
        guard let t = s?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty else { return .null }
        return .string(t)
    }
    static func number(_ i: Int?) -> JSONValue { i.map { .int($0) } ?? .null }
}

typealias RowValues = [String: JSONValue]

/// The coach portal's own tables, read and saved through /api/app/v1/coach/rows —
/// the same rules and follow-ups (family told, calendars updated) as the website.
@MainActor
enum Rows {
    static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        return d
    }()

    private struct List<T: Decodable>: Decodable { let rows: [T] }
    private struct One<T: Decodable>: Decodable { let row: T }
    private struct Body: Encodable { let row: RowValues }

    /// Filters as PostgREST writes them: ("booking_date", "gte.2026-11-01").
    static func list<T: Decodable>(_ table: String, _ filters: [(String, String)] = [], order: String? = nil, limit: Int? = nil, as type: T.Type = T.self) async throws -> [T] {
        var items = filters.map { URLQueryItem(name: $0.0, value: $0.1) }
        if let order { items.append(URLQueryItem(name: "order", value: order)) }
        if let limit { items.append(URLQueryItem(name: "limit", value: String(limit))) }
        let r: List<T> = try await API.shared.request("GET", "/api/app/v1/coach/rows/\(table)", items: items, body: Optional<Empty>.none, decoder: decoder)
        return r.rows
    }

    static func insert<T: Decodable>(_ table: String, _ row: RowValues, as type: T.Type = T.self) async throws -> T {
        let r: One<T> = try await API.shared.request("POST", "/api/app/v1/coach/rows/\(table)", body: Body(row: row), decoder: decoder)
        return r.row
    }

    static func update<T: Decodable>(_ table: String, id: String, _ row: RowValues, as type: T.Type = T.self) async throws -> T {
        let r: One<T> = try await API.shared.request("PATCH", "/api/app/v1/coach/rows/\(table)", items: [URLQueryItem(name: "id", value: id)], body: Body(row: row), decoder: decoder)
        return r.row
    }

    static func delete(_ table: String, id: String) async throws {
        let _: OkNotice = try await API.shared.request("DELETE", "/api/app/v1/coach/rows/\(table)", items: [URLQueryItem(name: "id", value: id)], body: Optional<Empty>.none)
    }
}

/// A row we only need the id of.
struct IdRow: Decodable, Identifiable, Hashable { let id: String }
