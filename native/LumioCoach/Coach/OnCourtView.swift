import SwiftUI
import AudioToolbox

/// On court: one block at a time, big enough to read from the baseline, with a
/// countdown and a buzz when it's time to move on. The screen stays awake.
struct OnCourtView: View {
    @Environment(\.dismiss) private var dismiss
    let title: String
    let phases: [Phase]
    let finish: () -> Void

    @State private var index = 0
    @State private var endsAt: Date?          // running when set
    @State private var leftWhenPaused: TimeInterval?
    @State private var buzzed = false

    private var phase: Phase { phases[min(index, phases.count - 1)] }
    private var length: TimeInterval { TimeInterval(max(1, phase.mins) * 60) }
    private var isLast: Bool { index >= phases.count - 1 }

    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.5)) { context in
            let left = remaining(at: context.date)
            VStack(spacing: 18) {
                HStack {
                    Button { dismiss() } label: { Image(systemName: "xmark").font(.title3.weight(.semibold)).frame(width: 44, height: 44) }
                        .accessibilityLabel("Close")
                    Spacer()
                    Text(title).font(.headline).lineLimit(1)
                    Spacer()
                    Text("\(index + 1)/\(phases.count)").font(.subheadline.monospacedDigit()).foregroundStyle(.secondary).frame(width: 44)
                }

                PhaseBar(phases: phases).padding(.horizontal, 4)

                Spacer(minLength: 0)
                Text(phase.phase.isEmpty ? "Block \(index + 1)" : phase.phase)
                    .font(.largeTitle.bold()).multilineTextAlignment(.center)
                Text(clock(left))
                    .font(.system(size: 88, weight: .bold, design: .rounded)).monospacedDigit()
                    .foregroundStyle(left <= 0 ? Color.orange : (left < 60 ? Color.yellow : Color.primary))
                    .contentTransition(.numericText())
                // Long blocks scroll rather than being cut off.
                ScrollView {
                    VStack(spacing: 12) {
                        if !phase.detail.isEmpty {
                            Text(phase.detail).font(.title3).multilineTextAlignment(.center)
                        }
                        if let cue = phase.cue, !cue.isEmpty {
                            Label(cue, systemImage: "quote.bubble").font(.headline).foregroundStyle(.secondary).multilineTextAlignment(.center)
                        }
                    }
                    .padding(.horizontal)
                    .frame(maxWidth: .infinity)
                }
                .frame(maxHeight: 260)
                .scrollBounceBehavior(.basedOnSize)
                Spacer(minLength: 0)

                if !isLast {
                    Text("Next: \(phases[index + 1].phase) · \(phases[index + 1].mins) min").font(.subheadline).foregroundStyle(.secondary)
                }

                HStack(spacing: 14) {
                    roundButton("backward.fill", "Previous block") { go(index - 1) }.disabled(index == 0)
                    Button { toggle() } label: {
                        Image(systemName: endsAt == nil ? "play.fill" : "pause.fill")
                            .font(.title.weight(.bold)).frame(width: 84, height: 84)
                            .background(Color.accentColor, in: Circle()).foregroundStyle(.white)
                    }
                    .accessibilityLabel(endsAt == nil ? "Start" : "Pause")
                    if isLast {
                        roundButton("flag.checkered", "Finish session") { dismiss(); finish() }
                    } else {
                        roundButton("forward.fill", "Next block") { go(index + 1) }
                    }
                }
                .padding(.bottom, 8)
            }
            .padding(20)
            .onChange(of: left <= 0) { _, over in if over && !buzzed { buzz() } }
        }
        .background(Color(.systemBackground))
        .onAppear { UIApplication.shared.isIdleTimerDisabled = true }
        .onDisappear { UIApplication.shared.isIdleTimerDisabled = false }
    }

    private func roundButton(_ icon: String, _ label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon).font(.title2.weight(.semibold)).frame(width: 64, height: 64)
                .background(Color(.secondarySystemBackground), in: Circle())
        }
        .accessibilityLabel(label)
    }

    private func remaining(at now: Date) -> TimeInterval {
        if let endsAt { return endsAt.timeIntervalSince(now) }
        return leftWhenPaused ?? length
    }

    private func clock(_ t: TimeInterval) -> String {
        let s = Int(abs(t.rounded(.up)))
        return (t < 0 ? "+" : "") + String(format: "%d:%02d", s / 60, s % 60)
    }

    private func toggle() {
        if let endsAt {
            leftWhenPaused = endsAt.timeIntervalSinceNow
            self.endsAt = nil
        } else {
            endsAt = Date().addingTimeInterval(leftWhenPaused ?? length)
            leftWhenPaused = nil
        }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    /// Moving to another block starts its clock straight away if the clock was running.
    private func go(_ i: Int) {
        guard phases.indices.contains(i) else { return }
        let running = endsAt != nil
        index = i
        buzzed = false
        leftWhenPaused = nil
        endsAt = running ? Date().addingTimeInterval(length) : nil
        UISelectionFeedbackGenerator().selectionChanged()
    }

    private func buzz() {
        buzzed = true
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
        AudioServicesPlaySystemSound(1005)
    }
}
