import SwiftUI
import AVKit
import UIKit

// MARK: - Signed-in pictures

/// A picture from our own site that needs the sign-in (a player's photo).
/// AsyncImage can't send the sign-in, so this fetches the bytes itself.
struct AuthImage<Placeholder: View>: View {
    let path: String?
    @ViewBuilder let placeholder: () -> Placeholder
    @State private var image: UIImage?

    var body: some View {
        Group {
            if let image { Image(uiImage: image).resizable().scaledToFill() } else { placeholder() }
        }
        .task(id: path) {
            image = nil
            guard let path, !path.isEmpty, let data = try? await API.shared.bytes(path) else { return }
            image = UIImage(data: data)
        }
    }
}

/// Where a stored photo can be fetched from — lib/avatar.ts avatarSrc: photos
/// live in a private store, so a bare path (or an old public address) goes
/// through the signed-in picture route.
enum Avatars {
    static func path(_ value: String?) -> String? {
        guard let v = value, !v.isEmpty, !v.hasPrefix("data:") else { return nil }
        if v.contains("/object/sign/") { return v }
        let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-_.~"))
        if let r = v.range(of: "/avatars/") {
            let rest = String(v[r.upperBound...]).split(separator: "?").first.map(String.init) ?? ""
            return "/api/coach/avatar-img?p=" + (rest.addingPercentEncoding(withAllowedCharacters: allowed) ?? rest)
        }
        if v.hasPrefix("http") || v.hasPrefix("/") { return v }
        return "/api/coach/avatar-img?p=" + (v.addingPercentEncoding(withAllowedCharacters: allowed) ?? v)
    }
}

/// A player's photo in a circle, falling back to their initials.
struct PlayerPhoto: View {
    let name: String
    let path: String?
    var size: CGFloat = 56
    var body: some View {
        AuthImage(path: path) { Avatar(name: name, size: size) }
            .frame(width: size, height: size)
            .clipShape(Circle())
    }
}

extension API {
    /// Raw bytes from one of our own pages (pictures), sent signed in.
    func bytes(_ path: String) async throws -> Data {
        var req = URLRequest(url: Config.url(path))
        req.setValue("1", forHTTPHeaderField: "X-Lumio-App")
        if let slug = academySlug { req.setValue(slug, forHTTPHeaderField: "x-lumio-academy") }
        if let token = try await validAccessToken() { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw APIError.server("That picture could not be loaded.", (response as? HTTPURLResponse)?.statusCode ?? 0) }
        return data
    }
}

/// A photo ready to send: square, 256×256, JPEG — what the website sends (lib/avatar.ts).
enum PhotoPrep {
    static func avatarDataURL(_ image: UIImage) -> String? {
        let side = min(image.size.width, image.size.height)
        guard side > 0 else { return nil }
        let crop = CGRect(x: (image.size.width - side) / 2, y: (image.size.height - side) / 2, width: side, height: side)
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 256, height: 256), format: { let f = UIGraphicsImageRendererFormat(); f.scale = 1; return f }())
        let out = renderer.image { _ in
            image.draw(in: CGRect(x: -crop.minX * 256 / side, y: -crop.minY * 256 / side, width: image.size.width * 256 / side, height: image.size.height * 256 / side))
        }
        guard let jpeg = out.jpegData(compressionQuality: 0.85) else { return nil }
        return "data:image/jpeg;base64," + jpeg.base64EncodedString()
    }
}

// MARK: - Playing

/// A video or voice note from a signed link, full screen.
struct MediaPlayerView: View {
    @Environment(\.dismiss) private var dismiss
    let url: URL
    let title: String
    @State private var player: AVPlayer?

    var body: some View {
        NavigationStack {
            Group {
                if let player { VideoPlayer(player: player).ignoresSafeArea(edges: .bottom) } else { ProgressView() }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
            .onAppear {
                try? AVAudioSession.sharedInstance().setCategory(.playback)
                let p = AVPlayer(url: url)
                player = p
                p.play()
            }
            .onDisappear { player?.pause() }
        }
    }
}

struct PlayableItem: Identifiable { let id = UUID(); let url: URL; let title: String }

// MARK: - Uploading a recording (coach)

/// Video and audio go straight to storage with a signed upload address, as the
/// website does: sign → upload → (optionally) Lumio Coach writes it up.
enum MediaUpload {
    struct Signed: Decodable { let id: String; let path: String?; let token: String?; let signedUrl: String? }
    enum Problem: LocalizedError {
        case needsConsent(String)
        case failed(String)
        var errorDescription: String? {
            switch self { case .needsConsent(let m), .failed(let m): return m }
        }
    }

    /// Returns the new recording's id.
    @MainActor
    static func upload(file: URL, kind: String, playerId: String?, playerName: String?, title: String?, anonKey: String, progress: @escaping (Double) -> Void) async throws -> String {
        struct SignBody: Encodable { let kind: String; let fileName: String; let playerId: String?; let playerName: String? }
        struct SignAnswer: Decodable { let id: String?; let signedUrl: String?; let error: String?; let needsConsent: Bool? }
        let a: SignAnswer = try await API.shared.request("POST", "/api/coach/media/sign", body: SignBody(kind: kind, fileName: file.lastPathComponent, playerId: playerId, playerName: playerName), lenient: true)
        if a.needsConsent == true { throw Problem.needsConsent(a.error ?? "This player hasn't agreed to recordings yet.") }
        guard let id = a.id, let signed = a.signedUrl, let url = URL(string: signed) else { throw Problem.failed(a.error ?? "The upload could not be started.") }

        // The same request supabase-js makes: multipart with cacheControl and the file.
        let boundary = "lumio-\(UUID().uuidString)"
        let body = FileManager.default.temporaryDirectory.appendingPathComponent("upload-\(UUID().uuidString)")
        FileManager.default.createFile(atPath: body.path, contents: nil)
        let out = try FileHandle(forWritingTo: body)
        func write(_ s: String) { out.write(Data(s.utf8)) }
        write("--\(boundary)\r\nContent-Disposition: form-data; name=\"cacheControl\"\r\n\r\n3600\r\n")
        write("--\(boundary)\r\nContent-Disposition: form-data; name=\"\"; filename=\"\(file.lastPathComponent)\"\r\nContent-Type: \(mime(file))\r\n\r\n")
        let input = try FileHandle(forReadingFrom: file)
        while let chunk = try input.read(upToCount: 4 << 20), !chunk.isEmpty { out.write(chunk) }
        try input.close()
        write("\r\n--\(boundary)--\r\n")
        try out.close()
        defer { try? FileManager.default.removeItem(at: body) }

        var req = URLRequest(url: url)
        req.httpMethod = "PUT"
        req.timeoutInterval = 600
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        req.setValue("false", forHTTPHeaderField: "x-upsert")
        if !anonKey.isEmpty { req.setValue(anonKey, forHTTPHeaderField: "apikey") }
        if let token = try await API.shared.validAccessToken() { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        let delegate = UploadProgress(progress)
        let (_, response) = try await URLSession.shared.upload(for: req, fromFile: body, delegate: delegate)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            let _: Empty? = try? await API.shared.request("DELETE", "/api/coach/media/\(id)", body: Optional<Empty>.none)
            throw Problem.failed("The upload didn't finish (\(status)). Please try again.")
        }

        // Details the sign step doesn't store.
        var row: RowValues = ["mime_type": .string(mime(file))]
        if let size = (try? FileManager.default.attributesOfItem(atPath: file.path)[.size]) as? Int { row["size_bytes"] = .int(size) }
        let seconds = try? await AVURLAsset(url: file).load(.duration).seconds
        if let seconds, seconds.isFinite { row["duration_seconds"] = .int(Int(seconds.rounded())) }
        if let title, !title.isEmpty { row["title"] = .string(title) }
        let _: IdRow? = try? await Rows.update("coach_media", id: id, row)
        return id
    }

    static func mime(_ file: URL) -> String {
        switch file.pathExtension.lowercased() {
        case "mov": return "video/quicktime"
        case "mp4", "m4v": return "video/mp4"
        case "m4a": return "audio/mp4"
        case "caf": return "audio/x-caf"
        case "wav": return "audio/wav"
        case "mp3": return "audio/mpeg"
        default: return "application/octet-stream"
        }
    }
}

final class UploadProgress: NSObject, URLSessionTaskDelegate {
    let report: (Double) -> Void
    init(_ report: @escaping (Double) -> Void) { self.report = report }
    func urlSession(_ session: URLSession, task: URLSessionTask, didSendBodyData bytesSent: Int64, totalBytesSent: Int64, totalBytesExpectedToSend: Int64) {
        guard totalBytesExpectedToSend > 0 else { return }
        let pct = Double(totalBytesSent) / Double(totalBytesExpectedToSend)
        Task { @MainActor in self.report(pct) }
    }
}
