import SwiftUI
import PhotosUI
import AVFoundation
import UniformTypeIdentifiers
import CoreTransferable

/// One player's videos and voice notes — the Video & Audio screen, fixed to them.
struct PlayerMediaView: View {
    let player: PlayerProfile
    let changed: () async -> Void
    var body: some View { MediaLibraryView(fixed: player, changed: changed) }
}

/// Video & Audio: record a lesson — in one go or in parts — or add recordings
/// from the phone, have Lumio Coach write the lesson up, and watch, write up
/// or delete anything recorded. The website's rules (LiveVideoAudio and the
/// capture window): a recording needs the player's agreement, parts of one
/// lesson are written up together as one summary, and the academy's own
/// video and audio switches decide what's here.
struct MediaLibraryView: View {
    @Environment(CoachStore.self) private var store
    /// Set on a player's page; nil on the academy's Video & Audio.
    let fixed: PlayerProfile?
    var changed: () async -> Void = {}

    /// Who the next recording is of.
    @State private var player: PlayerProfile?
    @State private var pickId: String?
    @State private var newName = ""
    /// The academy view: one player's recordings, or everyone's.
    @State private var filter: String?
    @State private var kindTab = ""

    @State private var items: [MediaRecord] = []
    @State private var loaded = false
    @State private var playing: PlayableItem?
    @State private var pickedVideos: [PhotosPickerItem] = []
    @State private var importing = false
    @State private var camera = false
    @State private var voice = false
    /// The lesson being put together: one recording, or several parts.
    @State private var parts: [Part] = []
    @State private var writeUp = true
    @State private var sending: Sending?
    @State private var reviewing: [String: String] = [:]
    @State private var askConsent = false
    @State private var toast: Toast?
    /// A written-up recording being deleted: ask about its lesson summary too.
    @State private var deleting: MediaRecord?

    struct Part: Identifiable { let id = UUID(); let file: URL; let kind: String; let seconds: Int? }
    struct Sending: Equatable { var index: Int; var total: Int; var pct: Double }

    private var videoOn: Bool { store.setup?.features?.video == true }
    private var audioOn: Bool { store.setup?.features?.audio == true }
    private var cameraThere: Bool { UIImagePickerController.isSourceTypeAvailable(.camera) }
    private var hub: Bool { fixed == nil }
    private var who: PlayerProfile? { fixed.map { player ?? $0 } ?? player }
    private var whoName: String { who?.name ?? newName.trimmingCharacters(in: .whitespaces) }
    private var first: String { whoName.split(separator: " ").first.map(String.init) ?? whoName }
    private var canRecord: Bool { !hub || who != nil || !newName.trimmingCharacters(in: .whitespaces).isEmpty }
    private var tab: String { kindTab.isEmpty ? (videoOn ? "video" : "audio") : kindTab }

    private func kindOn(_ m: MediaRecord) -> Bool { (m.kind ?? "video") == "audio" ? audioOn : videoOn }
    private func shown(_ m: MediaRecord) -> Bool {
        guard kindOn(m) else { return false }
        guard hub else { return true }
        if videoOn && audioOn && (m.kind ?? "video") != tab { return false }
        if let filter, m.playerId != filter { return false }
        return true
    }
    private var recordings: [MediaRecord] { items.filter { $0.clipOf == nil && shown($0) } }
    private var clips: [MediaRecord] { items.filter { $0.clipOf != nil && shown($0) } }
    /// Everyone with something recorded, for the academy view's filter.
    private var people: [(id: String, name: String)] {
        var seen = Set<String>(), out: [(id: String, name: String)] = []
        for m in items { if let id = m.playerId, !seen.contains(id) { seen.insert(id); out.append((id, m.playerName ?? "Player")) } }
        return out.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    var body: some View {
        List {
            if !videoOn && !audioOn {
                Section {
                    Text("Video and audio are switched off for your academy. The head coach can switch them on in Settings, under Plan & features.")
                        .foregroundStyle(.secondary)
                }
            } else {
                if hub {
                    Section {
                        PlayerPicker(playerId: $pickId, newName: $newName)
                    } header: { Text("Who’s the lesson with?") } footer: {
                        Text("The recording and Lumio Coach’s summary are saved to their profile.")
                    }
                }

                if let p = who, p.consentRecord != true {
                    Section {
                        Label("\(first) hasn’t agreed to being recorded yet.", systemImage: "exclamationmark.shield")
                            .foregroundStyle(.orange)
                        ConfirmButton(title: "They agreed in person", icon: "checkmark.shield",
                                      prompt: "Record that \(p.name) (or their parent) agreed to lessons being recorded?",
                                      confirm: "Yes, they agreed") { await agree() }
                    } footer: { Text("Their family can also agree in their own app.") }
                }

                Section {
                    if videoOn {
                        if cameraThere {
                            Button { camera = true } label: { Label(parts.isEmpty ? "Record a video" : "Record another part on video", systemImage: "video.badge.plus") }
                        }
                        PhotosPicker(selection: $pickedVideos, maxSelectionCount: 10, matching: .videos) {
                            Label("Choose videos from Photos", systemImage: "photo.on.rectangle")
                        }
                    }
                    if audioOn {
                        Button { voice = true } label: { Label(parts.isEmpty ? "Record audio" : "Record another part as audio", systemImage: "mic.badge.plus") }
                        Button { importing = true } label: { Label("Choose audio files", systemImage: "folder") }
                    }
                } header: { Text("Record a lesson") } footer: {
                    Text(canRecord ? "Recorded the lesson in parts? Add each one — they’re written up together as one lesson summary." : "Choose who the lesson was with first.")
                }
                .disabled(!canRecord || sending != nil)

                if !parts.isEmpty || sending != nil { lessonSection }

                if hub && videoOn && audioOn {
                    Section {
                        Picker("Show", selection: Binding(get: { tab }, set: { kindTab = $0 })) {
                            Text("Video · \(items.filter { $0.clipOf == nil && ($0.kind ?? "video") == "video" }.count)").tag("video")
                            Text("Audio · \(items.filter { $0.clipOf == nil && $0.kind == "audio" }.count)").tag("audio")
                        }
                        .pickerStyle(.segmented)
                    }
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())
                }

                Section {
                    if loaded && recordings.isEmpty { Text("Nothing recorded yet.").foregroundStyle(.secondary) }
                    if !loaded { HStack { Spacer(); ProgressView(); Spacer() } }
                    ForEach(recordings) { m in row(m) }
                } header: {
                    HStack {
                        Text(hub ? "Library" : "Recordings")
                        Spacer()
                        if hub && !people.isEmpty {
                            Menu {
                                Button { filter = nil } label: { if filter == nil { Label("Everyone", systemImage: "checkmark") } else { Text("Everyone") } }
                                ForEach(people, id: \.id) { p in
                                    Button { filter = p.id } label: { if filter == p.id { Label(p.name, systemImage: "checkmark") } else { Text(p.name) } }
                                }
                            } label: {
                                Label(people.first { $0.id == filter }?.name ?? "Everyone", systemImage: "line.3.horizontal.decrease.circle")
                                    .font(.caption.weight(.semibold)).textCase(nil)
                            }
                        }
                    }
                }

                if !clips.isEmpty {
                    Section {
                        ForEach(clips) { m in row(m) }
                    } header: { Text("Highlights") } footer: { Text("Cut by Lumio Coach from your videos, one per shot you talked about.") }
                }
            }
        }
        .navigationTitle(hub ? "Video & Audio" : "Videos & voice notes")
        .navigationBarTitleDisplayMode(.inline)
        .toast($toast)
        .task { if let fixed, player == nil { player = fixed }; await load() }
        .refreshable { await load() }
        .onChange(of: pickId) { _, id in Task { await choosePlayer(id) } }
        .onChange(of: pickedVideos) { _, new in
            guard !new.isEmpty else { return }
            Task { await addVideos(new) }
        }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.audio], allowsMultipleSelection: true) { result in
            addFiles(result)
        }
        .fullScreenCover(isPresented: $camera) {
            CameraRecorder { url in
                camera = false
                if let url { parts.append(Part(file: url, kind: "video", seconds: nil)) }
            }
            .ignoresSafeArea()
        }
        .sheet(isPresented: $voice) {
            VoiceRecorderView { url, seconds in parts.append(Part(file: url, kind: "audio", seconds: seconds)) }
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
        .confirmationDialog("\(whoName) hasn’t agreed to being recorded.", isPresented: $askConsent, titleVisibility: .visible) {
            Button("They agreed in person — upload") { Task { await agree(); await send() } }
            Button("Not now", role: .cancel) {}
        } message: {
            Text("A recording is only kept when the player, or their parent, agrees. Their family can also agree in their own app.")
        }
    }

    // MARK: The lesson being sent

    private var lessonSection: some View {
        Section {
            ForEach(Array(parts.enumerated()), id: \.element.id) { i, p in
                HStack(spacing: 10) {
                    Image(systemName: p.kind == "audio" ? "waveform" : "video.fill").foregroundStyle(Color.accentColor).frame(width: 24)
                    Text(parts.count > 1 ? "Part \(i + 1)" : (p.kind == "audio" ? "Audio" : "Video"))
                    Spacer()
                    if let s = p.seconds { Text(Self.length(Double(s)) ?? "").font(.caption).foregroundStyle(.secondary).monospacedDigit() }
                }
                .swipeActions { Button { drop(p) } label: { Label("Remove", systemImage: "trash") }.tint(.red) }
            }
            if let s = sending {
                VStack(alignment: .leading, spacing: 6) {
                    Text(s.total > 1 ? "Uploading part \(s.index + 1) of \(s.total)… \(Int(s.pct * 100))%" : "Uploading… \(Int(s.pct * 100))%").font(.subheadline)
                    ProgressView(value: (Double(s.index) + s.pct) / Double(max(s.total, 1)))
                }
            } else {
                Toggle(isOn: $writeUp) { Label("Lumio Coach writes up the lesson", systemImage: "sparkles") }
                BusyButton(title: parts.count > 1 ? "Upload \(parts.count) parts" : "Upload", systemImage: "arrow.up.circle.fill") { await send() }
                Button("Start again", role: .destructive) { parts.forEach { try? FileManager.default.removeItem(at: $0.file) }; parts = [] }
            }
        } header: { Text(whoName.isEmpty ? "This lesson" : "Lesson with \(whoName)") } footer: {
            if sending == nil {
                Text(writeUp ? "The summary goes into Lesson Summaries for you to check before it’s sent." : "Kept as it is. You can ask for a write-up later.")
            }
        }
    }

    private func drop(_ p: Part) {
        try? FileManager.default.removeItem(at: p.file)
        parts.removeAll { $0.id == p.id }
    }

    // MARK: Rows

    @ViewBuilder private func row(_ m: MediaRecord) -> some View {
        let audio = m.kind == "audio"
        let stage = reviewing[m.id] ?? m.status
        Button { Task { await play(m) } } label: {
            HStack(spacing: 12) {
                Image(systemName: audio ? "waveform" : (m.clipOf == nil ? "video.fill" : "scissors"))
                    .font(.title3).foregroundStyle(Color.accentColor).frame(width: 32)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title(m)).font(.body.weight(.medium)).foregroundStyle(.primary).lineLimit(2)
                    Text([hub ? m.playerName : nil, m.createdAt.map { Fmt.when($0) }, Self.length(m.durationSeconds)].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "))
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
                Button { Task { await review([m.id]) } } label: { Label("Write up", systemImage: "sparkles") }.tint(.purple)
            }
        }
        .contextMenu {
            if m.clipOf == nil, m.sessionId == nil, !Self.working(stage) {
                Button { Task { await review([m.id]) } } label: { Label(stage == "error" ? "Try the write-up again" : "Write it up with Lumio Coach", systemImage: "sparkles") }
            }
            Button(role: .destructive) { askRemove(m) } label: { Label("Delete", systemImage: "trash") }
        }
    }

    private func title(_ m: MediaRecord) -> String {
        if m.clipOf != nil, let shot = m.shotType, !shot.isEmpty { return shot.replacingOccurrences(of: "_", with: " ").capitalizedFirst }
        if let t = m.title, !t.isEmpty { return t }
        return m.kind == "audio" ? "Voice note" : "Video"
    }

    static func length(_ s: Double?) -> String? {
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
        let filters: [(String, String)] = fixed.map { [("player_id", "eq.\($0.id)")] } ?? []
        if let rows: [MediaRecord] = try? await Rows.list("coach_media", filters, order: "created_at.desc", limit: hub ? 300 : 200) {
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

    // MARK: Who it's with

    private func choosePlayer(_ id: String?) async {
        guard let id else { player = nil; return }
        player = await profile(id)
        if hub { filter = id }
    }

    private func profile(_ id: String) async -> PlayerProfile? {
        let rows: [PlayerProfile]? = try? await Rows.list("coach_players", [("id", id)])
        return rows?.first
    }

    private func reloadPlayer() async {
        if let id = who?.id, let p = await profile(id) { player = p }
        await changed()
    }

    private func agree() async {
        guard let p = who else { return }
        let row: RowValues = [
            "consent_record": .bool(true), "consent_record_at": .string(ISO8601DateFormatter().string(from: Date())),
            "consent_record_by": .string("Agreed in person"), "consent_record_how": .string("in_person"),
        ]
        do {
            let _: IdRow = try await Rows.update("coach_players", id: p.id, row)
            await reloadPlayer()
        } catch { toast = Toast(text: error.localizedDescription, isError: true) }
    }

    // MARK: Adding parts

    private func addVideos(_ picked: [PhotosPickerItem]) async {
        defer { pickedVideos = [] }
        var failed = 0
        for item in picked {
            if let movie = try? await item.loadTransferable(type: PickedMovie.self) { parts.append(Part(file: movie.url, kind: "video", seconds: nil)) }
            else { failed += 1 }
        }
        if failed > 0 { toast = Toast(text: failed == 1 ? "One video couldn’t be read." : "\(failed) videos couldn’t be read.", isError: true) }
    }

    private func addFiles(_ result: Result<[URL], Error>) {
        guard case .success(let urls) = result else { return }
        for url in urls {
            let scoped = url.startAccessingSecurityScopedResource()
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            let ext = url.pathExtension.isEmpty ? "m4a" : url.pathExtension.lowercased()
            let dest = FileManager.default.temporaryDirectory.appendingPathComponent("audio-\(UUID().uuidString).\(ext)")
            if (try? FileManager.default.copyItem(at: url, to: dest)) != nil { parts.append(Part(file: dest, kind: "audio", seconds: nil)) }
        }
    }

    // MARK: Sending

    /// Each part is uploaded, then (if asked) all of them are written up as
    /// one lesson — the website's capture window does the same.
    private func send() async {
        guard !parts.isEmpty, sending == nil else { return }
        var person = who
        if person == nil, hub {
            let name = newName.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !name.isEmpty else { toast = Toast(text: "Choose who the lesson was with first.", isError: true); return }
            do {
                let added = try await store.ensurePlayer(named: name)
                person = await profile(added.id)
                player = person
                pickId = added.id
                newName = ""
            } catch { toast = Toast(text: error.localizedDescription, isError: true); return }
        }
        guard let person else { toast = Toast(text: "Choose who the lesson was with first.", isError: true); return }
        if person.consentRecord != true { askConsent = true; return }

        let batch = parts
        let day = Date().formatted(.dateTime.day().month(.abbreviated).year().locale(Locale(identifier: "en_GB")))
        var sent: [(id: String, kind: String)] = []
        do {
            for (i, p) in batch.enumerated() {
                sending = Sending(index: i, total: batch.count, pct: 0)
                let title = batch.count > 1 ? "Lesson · part \(i + 1) of \(batch.count) · \(day)"
                    : (p.kind == "audio" ? "Voice note · \(day)" : "Lesson video · \(day)")
                let id = try await MediaUpload.upload(file: p.file, kind: p.kind, playerId: person.id, playerName: person.name, title: title,
                                                      anonKey: store.setup?.upload?.anonKey ?? "") { pct in
                    sending = Sending(index: i, total: batch.count, pct: min(pct, 0.99))
                }
                sent.append((id, p.kind))
                drop(p)
            }
        } catch MediaUpload.Problem.needsConsent {
            sending = nil
            await reloadPlayer()
            toast = Toast(text: "\(person.name) hasn’t agreed to being recorded, so nothing more was uploaded.", isError: true)
            await load(); return
        } catch {
            sending = nil
            toast = Toast(text: sent.isEmpty ? error.localizedDescription : "\(sent.count) of \(batch.count) parts uploaded. \(error.localizedDescription)", isError: true)
            await load(); return
        }
        sending = nil
        if writeUp {
            await load()
            toast = Toast(text: "Uploaded. Lumio Coach is writing up the lesson.")
            Task { await review(sent.map { $0.id }) }
        } else {
            for s in sent where s.kind == "video" {
                let _: IdRow? = try? await Rows.update("coach_media", id: s.id, ["status": .string("done")])
            }
            toast = Toast(text: sent.count > 1 ? "\(sent.count) recordings saved to \(person.name)’s profile." : "Saved to \(person.name)’s profile.")
            await load()
        }
        await changed()
    }

    // MARK: Lumio Coach write-up

    private struct Ids: Encodable { let ids: [String] }

    /// Check storage can hand the files back → start → follow the stages of
    /// the first, the website's own sequence (media-upload.ts).
    private func review(_ ids: [String]) async {
        guard let firstId = ids.first else { return }
        for id in ids { reviewing[id] = "processing" }
        defer { for id in ids { reviewing[id] = nil } }
        struct Ready: Decodable { let ready: Bool? }
        for wait in [0.0, 0.4, 0.9, 1.6, 2.6, 4, 6] {
            if wait > 0 { try? await Task.sleep(for: .seconds(wait)) }
            if let r: Ready = try? await API.shared.post("/api/coach/media/ready", body: Ids(ids: ids)), r.ready == true { break }
        }
        struct Started: Decodable { let firstId: String? }
        var started = false
        var problem = "The write-up couldn’t be started. Try again."
        for wait in [0.0, 1.2, 3] {
            if wait > 0 { try? await Task.sleep(for: .seconds(wait)) }
            do { let _: Started = try await API.shared.post("/api/coach/media/process", body: Ids(ids: ids)); started = true; break }
            catch { problem = error.localizedDescription }
        }
        guard started else { toast = Toast(text: problem, isError: true); await load(); return }

        let began = Date()
        while Date().timeIntervalSince(began) < 600 {
            try? await Task.sleep(for: .seconds(2.5))
            guard let s: MediaState = try? await API.shared.get("/api/coach/media/\(firstId)") else { continue }
            if let st = s.status { for id in ids { reviewing[id] = st } }
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
