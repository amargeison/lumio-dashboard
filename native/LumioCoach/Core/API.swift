import Foundation

struct Session: Codable, Equatable {
    var accessToken: String
    var refreshToken: String
    /// Seconds since 1970 when the access token stops working.
    var expiresAt: Double
    var user: SessionUser

    var expiresSoon: Bool { Date(timeIntervalSince1970: expiresAt).timeIntervalSinceNow < 5 * 60 }
}

struct SessionUser: Codable, Equatable {
    var id: String
    var email: String?
}

enum APIError: LocalizedError, Equatable {
    case signedOut
    case server(String, Int)
    case network(String)
    case decoding(String)

    var errorDescription: String? {
        switch self {
        case .signedOut: return "You have been signed out. Please sign in again."
        case .server(let m, _): return m
        case .network: return "You appear to be offline. Check your connection and try again."
        case .decoding: return "Something unexpected came back. Please try again."
        }
    }

    var status: Int? { if case .server(_, let s) = self { return s }; return nil }
}

/// Talks to www.lumiosports.com. The app's sign-in travels as a Bearer token
/// with `X-Lumio-App: 1`; the website turns that into the same session its own
/// pages use, so every check the website makes applies to the app too.
@MainActor
final class API {
    static let shared = API()

    private let sessionKey = "session.v1"
    private(set) var session: Session?
    /// The coach portal's address (e.g. "pg-tennis"), sent as x-lumio-academy so a
    /// coach at two academies works in the one they chose.
    var academySlug: String?
    /// Called when the server no longer accepts the sign-in.
    var onSignedOut: (() -> Void)?

    private var refreshTask: Task<Session, Error>?

    private let urlSession: URLSession = {
        let c = URLSessionConfiguration.ephemeral
        c.httpShouldSetCookies = false
        c.httpCookieAcceptPolicy = .never
        c.timeoutIntervalForRequest = 30
        c.waitsForConnectivity = false
        return URLSession(configuration: c)
    }()

    /// Lumio Coach's writing (session plans, summaries, messages) takes 20–60 seconds
    /// with nothing sent until it's done, so those calls wait up to three minutes.
    private let slowSession: URLSession = {
        let c = URLSessionConfiguration.ephemeral
        c.httpShouldSetCookies = false
        c.httpCookieAcceptPolicy = .never
        c.timeoutIntervalForRequest = 180
        c.waitsForConnectivity = false
        return URLSession(configuration: c)
    }()
    private static let slowPaths = ["/api/coach/session-draft", "/api/coach/session-complete", "/api/coach/lesson-summary", "/api/coach/message-draft", "/api/coach/media/process"]

    private let decoder: JSONDecoder = JSONDecoder()

    init() {
        if let d = Keychain.load(sessionKey), let s = try? JSONDecoder().decode(Session.self, from: d) { session = s }
    }

    func setSession(_ s: Session?) {
        session = s
        if let s, let d = try? JSONEncoder().encode(s) { Keychain.save(d, for: sessionKey) } else { Keychain.delete(sessionKey) }
    }

    // MARK: Requests

    func get<T: Decodable>(_ path: String, query: [String: String] = [:], as type: T.Type = T.self) async throws -> T {
        try await send("GET", path, items: query.map { URLQueryItem(name: $0.key, value: $0.value) }, body: Optional<Empty>.none)
    }

    func post<T: Decodable, B: Encodable>(_ path: String, body: B, as type: T.Type = T.self) async throws -> T {
        try await send("POST", path, items: [], body: body)
    }

    func delete<B: Encodable>(_ path: String, body: B) async throws {
        let _: Empty = try await send("DELETE", path, items: [], body: body)
    }

    /// Any method, repeated query keys allowed (?booking_date=gte.…&booking_date=lte.…),
    /// and a choice of decoder (the portal's tables come back in snake_case).
    func request<T: Decodable, B: Encodable>(_ method: String, _ path: String, items: [URLQueryItem] = [], body: B?, decoder: JSONDecoder? = nil, lenient: Bool = false) async throws -> T {
        try await send(method, path, items: items, body: body, decoder: decoder, lenient: lenient)
    }

    private func send<T: Decodable, B: Encodable>(_ method: String, _ path: String, items: [URLQueryItem], body: B?, decoder custom: JSONDecoder? = nil, lenient: Bool = false, retried: Bool = false) async throws -> T {
        var comps = URLComponents(url: Config.url(path), resolvingAgainstBaseURL: false)!
        if !items.isEmpty { comps.queryItems = items }
        var req = URLRequest(url: comps.url!)
        req.httpMethod = method
        req.setValue("1", forHTTPHeaderField: "X-Lumio-App")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let slug = academySlug { req.setValue(slug, forHTTPHeaderField: "x-lumio-academy") }
        if let token = try await validAccessToken() { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body {
            req.httpBody = try JSONEncoder().encode(body)
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let data: Data, response: URLResponse
        let slow = Self.slowPaths.contains { path.hasPrefix($0) }
        if slow { req.timeoutInterval = 180 }
        do { (data, response) = try await (slow ? slowSession : urlSession).data(for: req) }
        catch {
            // The screen that asked went away (a .task is cancelled when it
            // disappears) — not being offline, so not said as that.
            if (error as? URLError)?.code == .cancelled || Task.isCancelled { throw CancellationError() }
            if (error as? URLError)?.code == .timedOut { throw APIError.server("That took too long to answer. Please try again.", 0) }
            throw APIError.network(error.localizedDescription)
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0

        if status == 401, session != nil {
            if !retried, (try? await refresh(force: true)) != nil {
                return try await send(method, path, items: items, body: body, decoder: custom, lenient: lenient, retried: true)
            }
            signOutLocally()
            throw APIError.signedOut
        }
        // Lenient: a refusal that still carries an answer (a card charge that needs
        // the client) is decoded like a success; the caller reads its fields.
        if lenient, (400..<500).contains(status), let t = try? (custom ?? decoder).decode(T.self, from: data) { return t }
        guard (200..<300).contains(status) else {
            let failed = try? decoder.decode(ServerError.self, from: data)
            let message = failed?.error ?? failed?.notice
            throw APIError.server(message ?? "That did not work (\(status)). Please try again.", status)
        }
        if T.self == Empty.self { return Empty() as! T }
        do { return try (custom ?? decoder).decode(T.self, from: data) }
        catch { throw APIError.decoding(String(describing: error)) }
    }

    // MARK: Tokens

    /// A token that will last the request, refreshed first when it is close to running out.
    func validAccessToken() async throws -> String? {
        guard let s = session else { return nil }
        if !s.expiresSoon { return s.accessToken }
        return try await refresh(force: false).accessToken
    }

    /// One refresh at a time: Supabase rotates the refresh token, so two at once would sign the app out.
    @discardableResult
    private func refresh(force: Bool) async throws -> Session {
        if let t = refreshTask { return try await t.value }
        guard let current = session else { throw APIError.signedOut }
        if !force, !current.expiresSoon { return current }
        let task = Task<Session, Error> { [urlSession] in
            var req = URLRequest(url: Config.url("/api/app/v1/auth/refresh"))
            req.httpMethod = "POST"
            req.setValue("1", forHTTPHeaderField: "X-Lumio-App")
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONEncoder().encode(["refreshToken": current.refreshToken])
            let (data, response) = try await urlSession.data(for: req)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw APIError.signedOut }
            return try JSONDecoder().decode(Session.self, from: data)
        }
        refreshTask = task
        defer { refreshTask = nil }
        do {
            let fresh = try await task.value
            setSession(fresh)
            return fresh
        } catch {
            if (error as? APIError) == .signedOut { signOutLocally() }
            throw error
        }
    }

    func signOutLocally() {
        setSession(nil)
        academySlug = nil
        onSignedOut?()
    }
}

struct Empty: Codable {}
struct ServerError: Decodable { let error: String?; let notice: String?; let code: String? }
struct OkNotice: Decodable { let ok: Bool?; let notice: String?; let error: String?; let url: String? }

/// A request stopped because its screen closed. Usually never shown (the
/// screen has gone); if it is, it says what to do rather than "offline".
extension CancellationError: @retroactive LocalizedError {
    public var errorDescription: String? { "That was interrupted. Pull down to try again." }
}
