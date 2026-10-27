import SwiftUI

/// What the coach wrote up after a lesson: the recap, what was covered,
/// takeaways, homework and what's next.
struct LessonSummaryView: View {
    let lesson: LessonSummary

    var body: some View {
        let r = lesson.review
        List {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    if let d = lesson.sessionDate { Text(Fmt.dayLong(d)).font(.subheadline).foregroundStyle(.secondary) }
                    Text(r?.focus ?? lesson.focus ?? "Lesson notes").font(.title2.bold())
                    if let type = r?.type, !type.isEmpty { Pill(text: type, tint: .secondary) }
                }
                .padding(.vertical, 4)
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets(top: 0, leading: 4, bottom: 0, trailing: 4))
            }

            if let note = r?.playerNote, !note.isEmpty {
                Section("A note from your coach") { Text(note) }
            }
            if let recap = r?.recap ?? lesson.summary, !recap.isEmpty {
                Section("How it went") { Text(recap) }
            }
            list("What we covered", r?.covered, icon: "checkmark.circle")
            list("Remember", r?.takeaways, icon: "lightbulb")
            if let hw = r?.homework, !hw.isEmpty {
                Section("Practise at home") { Label(hw, systemImage: "house") }
            }
            if let next = r?.nextFocus, !next.isEmpty {
                Section("Next time") { Label(next, systemImage: "arrow.forward.circle") }
            }
            if let a = r?.assessment, !a.isEmpty {
                Section("Assessment") { Text(a) }
            }
        }
        .listStyle(.insetGrouped)
        .textSelection(.enabled)
        .navigationTitle("Lesson notes")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder private func list(_ title: String, _ items: [String]?, icon: String) -> some View {
        if let items, !items.isEmpty {
            Section(title) {
                ForEach(items, id: \.self) { Label($0, systemImage: icon) }
            }
        }
    }
}
