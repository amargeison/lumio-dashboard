import SwiftUI

/// The racket (or colour) ladder and the four skills at each stage — the same
/// fixed framework as the website (coach-db.ts RACKET_STAGES / RACKET_SKILLS).
enum Racket {
    struct Stage: Identifiable, Hashable { let id: String; let name: String; let hex: String; let skills: [Skill] }
    struct Skill: Hashable { let name: String; let note: String }

    static let stages: [Stage] = [
        Stage(id: "white", name: "White", hex: "#E5E7EB", skills: [Skill(name: "Ready position & split-step", note: "Athletic base, balanced, on toes before each ball"), Skill(name: "Forehand groundstroke", note: "Low-to-high swing, contact out front"), Skill(name: "Grips — eastern & continental", note: "Find and change grip without looking"), Skill(name: "Cooperative rally", note: "Keep 3–5 balls going with a partner")]),
        Stage(id: "yellow", name: "Yellow", hex: "#EAB308", skills: [Skill(name: "Two-handed backhand", note: "Shoulder turn, two clean hands, follow through"), Skill(name: "Footwork & recovery", note: "Small adjusting steps, recover to centre"), Skill(name: "Sustained rally (10+)", note: "Rally 10+ balls cross-court with control"), Skill(name: "Ball tracking & timing", note: "Read bounce early, meet the ball cleanly")]),
        Stage(id: "orange", name: "Orange", hex: "#F97316", skills: [Skill(name: "Forehand volley", note: "Punch, firm wrist, short backswing at the net"), Skill(name: "Backhand volley", note: "Continental grip, block forward through contact"), Skill(name: "Backhand slice", note: "High-to-low, stable face, ball stays low"), Skill(name: "Net positioning", note: "Close the net, cut angles, ready hands")]),
        Stage(id: "green", name: "Green", hex: "#22C55E", skills: [Skill(name: "Flat first serve", note: "Trophy pose, toss, pronate, land inside"), Skill(name: "Toss & rhythm", note: "Consistent toss, smooth service motion"), Skill(name: "Return of serve", note: "Split on contact, short take-back, block deep"), Skill(name: "Serve placement", note: "Hit wide / body / T targets on demand")]),
        Stage(id: "blue", name: "Blue", hex: "#3B82F6", skills: [Skill(name: "Topspin forehand", note: "Brush up the back, heavy net clearance"), Skill(name: "Topspin backhand", note: "Drive through with spin, depth and shape"), Skill(name: "Second serve (kick)", note: "Spin-first, high margin, reliable under pressure"), Skill(name: "Depth & heavy ball", note: "Land balls in the back third consistently")]),
        Stage(id: "purple", name: "Purple", hex: "#A855F7", skills: [Skill(name: "Overhead smash", note: "Turn, point, finish high balls with authority"), Skill(name: "Drop shot", note: "Disguised touch, soft hands, dies short"), Skill(name: "Offensive & defensive lob", note: "Clear the net player, reset from defence"), Skill(name: "Half-volley", note: "Short hop pick-up in transition, stable face")]),
        Stage(id: "brown", name: "Brown", hex: "#92400E", skills: [Skill(name: "Kick serve", note: "Heavy topspin serve that jumps off the court"), Skill(name: "Slice serve", note: "Curve the ball wide to open the court"), Skill(name: "Inside-out forehand", note: "Run around the backhand, attack with the FH"), Skill(name: "Approach & transition", note: "Approach off short balls, close behind it")]),
        Stage(id: "red", name: "Red", hex: "#EF4444", skills: [Skill(name: "Point construction", note: "Build the point, open space, finish the right ball"), Skill(name: "Pattern play", note: "Serve+1 and return+1 go-to patterns"), Skill(name: "Disguise & variation", note: "Change spin, pace and height to disrupt"), Skill(name: "Reading opponents", note: "Spot and exploit weaknesses live")]),
        Stage(id: "black", name: "Black", hex: "#111827", skills: [Skill(name: "Match management", note: "Manage score, momentum and game state"), Skill(name: "Pressure & mental game", note: "Routines, resets, compete on big points"), Skill(name: "In-match adaptation", note: "Change a losing plan, adjust on the fly"), Skill(name: "Closing out matches", note: "Serve out sets, convert when ahead")]),
    ]

    static func stage(_ id: String?) -> Stage? { stages.first { $0.id == id } }
    static func index(_ id: String?) -> Int? { stages.firstIndex { $0.id == id } }
    static func next(after id: String?) -> Stage? {
        guard let i = index(id) else { return stages.first }
        return i + 1 < stages.count ? stages[i + 1] : nil
    }

    /// 0 none · 1 Learning · 2 Developing · 3 Consolidating · 4 Consistent
    static let levels = ["—", "Learning", "Developing", "Consolidating", "Consistent"]
    static func levelColour(_ score: Int) -> Color {
        switch score { case 4...: return .green; case 3: return .lumioBlue; case 1, 2: return .orange; default: return .secondary }
    }
}

extension Color {
    /// "#3B82F6"
    init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let v = UInt64(h, radix: 16) ?? 0
        self.init(red: Double((v >> 16) & 0xFF) / 255, green: Double((v >> 8) & 0xFF) / 255, blue: Double(v & 0xFF) / 255)
    }
}
