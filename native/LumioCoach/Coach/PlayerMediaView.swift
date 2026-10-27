import SwiftUI
import PhotosUI
import AVFoundation
import UniformTypeIdentifiers
import CoreTransferable

/// A player's videos and voice notes: watch them, record or add new ones, have
/// Lumio Coach write up a lesson from one, and delete. The same rules as the
/// website's Video & Audio page — a recording needs the player's agreement,
/// a video is kept as it is (the write-up is optional), and a voice note is
/// written up straight away.
struct PlayerMediaView: View {
    @Environment(CoachStore.self) private var store
    @State var player: PlayerProfile
    let changed: () async -> Void

    @State private var items: [MediaRecord] = []
    @State private var loaded = false
    @State private var playing: PlayableItem?
    @State private var picked: PhotosPickerItem?
    @State private var camera = false
    @State private var voice = false
    @State private var uploading: Double?
    @State private var reviewing: [String: String] = [:]
    @State private var pending: Pending?
    @State private var toast: Toast?
    /// A written-up recording being deleted: ask about its lesson summary too.
    @State private var deleting: MediaRecord?

    struct Pending: Identifiable { let id = UUID(); let file: URL; let kind: String; let seconds: Int? }

    private var videoOn: Bool { store.setup?.features?.video == true }
    private var audioOn: Bool { store.setup?.features?.audio == true }
    private var recordings: [MediaRecord] { items.filter { $0.clipOf == nil && kindOn($0) } }
    private var clips: [MediaRecord] { items.filter { $0.clipOf != nil && kindOn($0) } }
    private var cameraThere: Bool { UIImagePickerController.isSourceTypeAvailable(.camera) }
    private var first: String { player.name.split(separator: " ").first.map(String.init) ?? player.name }

    private func kindOn(_ m: MediaRecord) -> Bool { (m.kind ?? "video") == "audio" ? audioOn : videoOn }

    var body: some View {
        List {
            if !videoOn && !audioOn {
                Section {
                    Text("Video and audio are switched off for your academy. The head coach can switch them on in Settings, under Plan & features.")
                        .foregroundStyle(.secondary)
                }
            } else {
                if player.consentRecord != true {
                    Section {
                        Label("\(first) hasn’t agreed to being recorded yet.", systemImage: "exclamationmark.shield")
                            .foregroundStyle(.orange)
                        ConfirmButton(title: "They agreed in person", icon: "checkmark.shield",
                                      prompt: "Record that \(player.name) (or their parent) agreed to lessons being recorded?",
                                      confirm: "Yes, they agreed") { await agree() }
                    } footer: { Text("Their family can also agree in their own app.") }
                }

                Section {
                    if let uploading {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(uploading < 1 ? "Uploading… \(Int(uploading * 100))%" : "Finishing…").font(.subheadline)
                            ProgressView(value: uploading)
                        }
                    } else {
                        if videoOn {
                            if cameraThere {
                                Button { camera = true } label: { Label("Record a video", systemImage: "video.badge.plus") }
                            }
                            PhotosPicker(selection: $picked, matching: .videos) {
                                Label("Choose a video", systemImage: "photo.on.rectangle")
                            }
                        }
                        if audioOn {
                            Button { voice = true } label: { Label("Record a voice note", systemImage: "mic.badge.plus") }
                        }
                    }
                } header: { Text("Add") } footer: {
                    Text(audioOn ? "A voice note is written up by Lumio Coach as a lesson summary. Videos are kept as they are — you can ask for a write-up afterwards." : "Videos are kept as they are — you can ask Lumio Coach for a write-up afterwards.")
                }

                Section("Recordings") {
                    if loaded && recordings.isEmpty { Text("Nothing recorded yet.").foregroundStyle(.secondary) }
                    if !loaded { HStack { Spacer(); ProgressView(); Spacer() } }
                    ForEach(recordings) { m in row(m) }
                }

                if !clips.isEmpty {
                    Section {
                        ForEach(clips) { m in row(m) }
                    } header: { Text("Highlights") } footer: { Text("Cut by Lumio Coach from your videos, one per shot you talked about.") }
                }
            }
        }
        .navigationTitle("Videos & voice notes")
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .task { await load() }
        .refreshable { await load() }
        .onChange(of: picked) { _, new in
            guard let new else { return }
            Task { await choose(new) }
        }
        .fullScreenCover(isPresented: $camera) {
            CameraRecorder { url in
                camera = false
                if let url { start(url, kind: "video", seconds: nil) }
            }
            .ignoresSafeArea()
        }
        .sheet(isPresented: $voice) {
            VoiceRecorderView { url, seconds in start(url, kind: "audio", seconds: seconds) }
        }
        .sheet(item: $playing) { MediaPlayerView(url: $0.url, title: $0.title) }
        .confirmationDialog("Delete this recording?", isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } }),
                            titleVisibility: .visible, presenting: deleting) { m in
            Button("Delete the recording and its write-up", role: .destructive) { deleting = nil; Task { await remove(m, discard: true) } }
            Button("Delete the recording only", role: .destructive) { deleting = nil; Task { await remove(m) } }
            Button("Keep it", role: .cancel) { deleting = nil }
        } message: { _ in
            Text("Lumio Coach wrote a lesson summary from it. Deleting the write-up also removes that summary and the attendance mark it added.")
        }
        .confirmationDialog(pending.map { _ in "\(player.name) hasn’t agreed to being recorded." } ?? "",
                            isPresented: Binding(get: { pending != nil }, set: { if !$0 { pending = nil } }),
                            titleVisibility: .visible, presenting: pending) { p in
            Button("They agreed in person — upload") { pending = nil; Task { await agree(); await upload(p) } }
            Button("Don’t upload", role: .cancel) { try? FileManager.default.removeItem(at: p.file); pending = nil }
        } message: { _ in
            Text("A recording is only kept when the player, or their parent, agrees. Their family can also agree in their own app.")
        }
    }

    @ViewBuilder private func row(_ m: MediaRecord) -> some View {
        let audio = m.kind == "audio"
        let stage = reviewing[m.id] ?? m.status
        Button { Task { await play(m) } } label: {
            HStack(spacing: 12) {
                Image(systemName: audio ? "waveform" : (m.clipOf == nil ? "video.fill" : "scissors"))
                    .font(.title3).foregroundStyle(Color.accentColor).frame(width: 32)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title(m)).font(.body.weight(.medium)).foregroundStyle(.primary).lineLimit(2)
                    Text([m.createdAt.map { Fmt.when($0) }, length(m.durationSeconds)].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "))
                        .font(.caption).foregroundStyle(.secondary)
                    if Self.working(stage) {
                        HStack(spacing: 6) { ProgressView().controlSize(.mini); Text(Self.stageWords(stage)).font(.caption).foregroundStyle(.secondary) }
                    } else if stage == "error" {
                        Text(m.error ?? "The write-up didn’t finish.").font(.caption).foregroundStyle(.red)
                    } else if m.sessionId != nil {
                        Label("Written up", systemImage: "doc.text").font(.caption).foregroundStyle(.green)
                    }
                }
                Spacer()
                Image(systemName: "play.circle").foregroundStyle(.secondary)
            }
        }
        .swipeActions(edge: .trailing) {
            // Not role: .destructive — that removes the row before the
            // question about the write-up is answered.
            Button { askRemove(m) } label: { Label("Delete", systemImage: "trash") }.tint(.red)
        }
        .swipeActions(edge: .leading) {
            if m.clipOf == nil, m.sessionId == nil, !Self.working(stage) {
                Button { Task { await review(m.id) } } label: { Label("Write up", systemImage: "sparkles") }.tint(.purple)
            }
        }
        .contextMenu {
            if m.clipOf == nil, m.sessionId == nil, !Self.working(stage) {
                Button { Task { await review(m.id) } } label: { Label(stage == "error" ? "Try the write-up again" : "Write it up with Lumio Coach", systemImage: "sparkles") }
            }
            Button(role: .destructive) { askRemove(m) } label: { Label("Delete", systemImage: "trash") }
        }
    }

    private func title(_ m: MediaRecord) -> String {
        if m.clipOf != nil, let shot = m.shotType, !shot.isEmpty { return shot.replacingOccurrences(of: "_", with: " ").capitalizedFirst }
        if let t = m.title, !t.isEmpty { return t }
        return m.kind == "audio" ? "Voice note" : "Video"
    }

    private func length(_ s: Double?) -> String? {
        guard let s, s > 0 else { return nil }
        let t = Int(s.rounded())
        return t >= 3600 ? String(format: "%d:%02d:%02d", t / 3600, t / 60 % 60, t % 60) : String(format: "%d:%02d", t / 60, t % 60)
    }

    static func working(_ s: String?) -> Bool { s == "processing" || s == "transcribing" || s == "summarising" }
    static func stageWords(_ s: String?) -> String {
        switch s {
        case "transcribing": return "Listening to the recording…"
        case "summarising": return "Writing the summary…"
        default: return "Getting the recording ready…"
        }
    }

    // MARK: Loading and playing

    private func load() async {
        if let rows: [MediaRecord] = try? await Rows.list("coach_media", [("player_id", "eq.\(player.id)")], order: "created_at.desc", limit: 200) {
            items = rows
        }
        loaded = true
    }

    private struct MediaState: Decodable { let status: String?; let error: String?; let url: String?; let title: String? }

    private func play(_ m: MediaRecord) async {
        do {
            let s: MediaState = try await API.shared.get("/api/coach/media/\(m.id)")
            guard let u = s.url.flatMap(URL.init(string:)) else { toast = Toast(text: "That recording couldn’t be opened.", isError: true); return }
            playing = PlayableItem(url: u, title: title(m))
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    // MARK: Adding

    private func choose(_ item: PhotosPickerItem) async {
        defer { picked = nil }
        guard let movie = try? await item.loadTransferable(type: PickedMovie.self) else {
            toast = Toast(text: "That video couldn’t be read.", isError: true); return
        }
        start(movie.url, kind: "video", seconds: nil)
    }

    /// Asks first when the player hasn't agreed yet, as the website does.
    private func start(_ file: URL, kind: String, seconds: Int?) {
        let p = Pending(file: file, kind: kind, seconds: seconds)
        if player.consentRecord != true { pending = p; return }
        Task { await upload(p) }
    }

    private func upload(_ p: Pending) async {
        uploading = 0
        defer { uploading = nil; try? FileManager.default.removeItem(at: p.file) }
        let day = Date().formatted(.dateTime.day().month(.abbreviated).year().locale(Locale(identifier: "en_GB")))
        let title = p.kind == "audio" ? "Voice note · \(day)" : "Lesson video · \(day)"
        do {
            let id = try await MediaUpload.upload(file: p.file, kind: p.kind, playerId: player.id, playerName: player.name, title: title,
                                                  anonKey: store.setup?.upload?.anonKey ?? "") { uploading = min($0, 0.99) }
            uploading = 1
            if p.kind == "video" {
                // Kept as it is; the write-up is the coach's choice.
                let _: IdRow? = try? await Rows.update("coach_media", id: id, ["status": .string("done")])
                toast = Toast(text: "Video saved to \(first)’s profile.")
                await load()
            } else {
                await load()
                Task { await review(id) }
            }
            await changed()
        } catch MediaUpload.Problem.needsConsent {
            // Agreement withdrawn since this screen opened.
            await reloadPlayer()
            toast = Toast(text: "\(player.name) hasn’t agreed to being recorded, so nothing was uploaded.", isError: true)
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func agree() async {
        let row: RowValues = [
            "consent_record": .bool(true), "consent_record_at": .string(ISO8601DateFormatter().string(from: Date())),
            "consent_record_by": .string("Agreed in person"), "consent_record_how": .string("in_person"),
        ]
        do {
            let _: IdRow = try await Rows.update("coach_players", id: player.id, row)
            await reloadPlayer()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    private func reloadPlayer() async {
        if let rows: [PlayerProfile] = try? await Rows.list("coach_players", [("id", player.id)]), let p = rows.first { player = p }
        await changed()
    }

    // MARK: Lumio Coach write-up

    private struct Ids: Encodable { let ids: [String] }

    /// Upload → check storage can hand it back → start → follow the stages,
    /// the website's own sequence (media-upload.ts).
    private func review(_ id: String) async {
        reviewing[id] = "processing"
        defer { reviewing[id] = nil }
        struct Ready: Decodable { let ready: Bool? }
        for wait in [0.0, 0.4, 0.9, 1.6, 2.6, 4, 6] {
            if wait > 0 { try? await Task.sleep(for: .seconds(wait)) }
            if let r: Ready = try? await API.shared.post("/api/coach/media/ready", body: Ids(ids: [id])), r.ready == true { break }
        }
        struct Started: Decodable { let firstId: String? }
        var started = false
        var problem = "The write-up couldn’t be started. Try again."
        for wait in [0.0, 1.2, 3] {
            if wait > 0 { try? await Task.sleep(for: .seconds(wait)) }
            do { let _: Started = try await API.shared.post("/api/coach/media/process", body: Ids(ids: [id])); started = true; break }
            catch { problem = error.localizedDescription }
        }
        guard started else { toast = Toast(text: problem, isError: true); await load(); return }

        let began = Date()
        while Date().timeIntervalSince(began) < 600 {
            try? await Task.sleep(for: .seconds(2.5))
            guard let s: MediaState = try? await API.shared.get("/api/coach/media/\(id)") else { continue }
            if let st = s.status { reviewing[id] = st }
            if s.status == "done" {
                toast = Toast(text: "Lumio Coach has written up the lesson. It’s in Lesson Summaries.")
                store.saved()
                break
            }
            if s.status == "error" { toast = Toast(text: s.error ?? "The write-up didn’t finish.", isError: true); break }
        }
        await load()
    }

    // MARK: Deleting

    private func askRemove(_ m: MediaRecord) {
        if m.clipOf == nil, m.sessionId != nil { deleting = m } else { Task { await remove(m) } }
    }

    /// `discard` is the website's "Discard" on a review: the summary and the
    /// attendance mark it made go too (?discard=1).
    private func remove(_ m: MediaRecord, discard: Bool = false) async {
        do {
            let _: Empty = try await API.shared.request("DELETE", "/api/coach/media/\(m.id)",
                                                        items: discard ? [URLQueryItem(name: "discard", value: "1")] : [],
                                                        body: Optional<Empty>.none)
            if discard { store.saved() }
            items.removeAll { $0.id == m.id || $0.clipOf == m.id }
            toast = Toast(text: m.clipOf == nil ? "Recording deleted." : "Highlight deleted.")
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }
}

// MARK: - A video from the photo library

/// A picked video, copied somewhere we can read it from.
struct PickedMovie: Transferable {
    let url: URL
    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(contentType: .movie) { SentTransferredFile($0.url) } importing: { received in
            let ext = received.file.pathExtension.isEmpty ? "mov" : received.file.pathExtension.lowercased()
            let dest = FileManager.default.temporaryDirectory.appendingPathComponent("video-\(UUID().uuidString).\(ext)")
            try FileManager.default.copyItem(at: received.file, to: dest)
            return Self(url: dest)
        }
    }
}

// MARK: - Recording a video with the camera

struct CameraRecorder: UIViewControllerRepresentable {
    let done: (URL?) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let c = UIImagePickerController()
        c.sourceType = .camera
        c.mediaTypes = [UTType.movie.identifier]
        c.cameraCaptureMode = .video
        c.videoQuality = .typeHigh
        c.videoMaximumDuration = 60 * 60
        c.delegate = context.coordinator
        return c
    }

    func updateUIViewController(_ controller: UIImagePickerController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(done) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let done: (URL?) -> Void
        init(_ done: @escaping (URL?) -> Void) { self.done = done }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            guard let url = info[.mediaURL] as? URL else { done(nil); return }
            // The camera's own file can be cleared away, so keep a copy.
            let ext = url.pathExtension.isEmpty ? "mov" : url.pathExtension.lowercased()
            let dest = FileManager.default.temporaryDirectory.appendingPathComponent("video-\(UUID().uuidString).\(ext)")
            done((try? FileManager.default.copyItem(at: url, to: dest)) != nil ? dest : url)
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) { done(nil) }
    }
}

// MARK: - Recording a voice note

struct VoiceRecorderView: View {
    @Environment(\.dismiss) private var dismiss
    let done: (URL, Int) -> Void

    @State private var recorder: AVAudioRecorder?
    @State private var startedAt: Date?
    @State private var problem: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 28) {
                Spacer()
                TimelineView(.periodic(from: .now, by: 0.5)) { ctx in
                    Text(clock(ctx.date)).font(.system(size: 56, weight: .light)).monospacedDigit()
                }
                Button { recorder == nil ? begin() : finish() } label: {
                    ZStack {
                        Circle().stroke(.secondary.opacity(0.4), lineWidth: 4).frame(width: 84, height: 84)
                        if recorder == nil {
                            Circle().fill(.red).frame(width: 66, height: 66)
                        } else {
                            RoundedRectangle(cornerRadius: 8).fill(.red).frame(width: 34, height: 34)
                        }
                    }
                }
                .accessibilityLabel(recorder == nil ? "Start recording" : "Stop and save")
                Text(recorder == nil ? "Tap to start. Talk through the lesson: what you worked on, what went well, what to practise." : "Tap to stop and save.")
                    .font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center).padding(.horizontal, 32)
                if let problem { Text(problem).font(.subheadline).foregroundStyle(.red).multilineTextAlignment(.center).padding(.horizontal, 32) }
                Spacer()
            }
            .navigationTitle("Voice note")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { recorder?.stop(); _ = recorder?.deleteRecording(); dismiss() }
                }
            }
            .interactiveDismissDisabled(recorder != nil)
        }
    }

    private func clock(_ now: Date) -> String {
        let t = startedAt.map { Int(now.timeIntervalSince($0)) } ?? 0
        return String(format: "%d:%02d", t / 60, t % 60)
    }

    private func begin() {
        problem = nil
        Task {
            guard await AVAudioApplication.requestRecordPermission() else {
                problem = "The microphone is switched off for Lumio Coach. Turn it on in the iPhone’s Settings."
                return
            }
            do {
                let session = AVAudioSession.sharedInstance()
                try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
                try session.setActive(true)
                let url = FileManager.default.temporaryDirectory.appendingPathComponent("voice-note-\(UUID().uuidString).m4a")
                let settings: [String: Any] = [
                    AVFormatIDKey: Int(kAudioFormatMPEG4AAC), AVSampleRateKey: 44_100,
                    AVNumberOfChannelsKey: 1, AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
                ]
                let r = try AVAudioRecorder(url: url, settings: settings)
                guard r.record() else { problem = "Recording couldn’t start. Try again."; return }
                recorder = r
                startedAt = Date()
            } catch { problem = "Recording couldn’t start: \(error.localizedDescription)" }
        }
    }

    private func finish() {
        guard let r = recorder else { return }
        let seconds = Int(r.currentTime.rounded())
        r.stop()
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        recorder = nil
        guard seconds >= 1 else { problem = "That was too short to keep."; startedAt = nil; return }
        let url = r.url
        dismiss()
        done(url, seconds)
    }
}
