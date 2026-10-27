import SwiftUI

extension Color {
    static let lumioBlue = Color(red: 0x3A / 255, green: 0x8E / 255, blue: 0xE0 / 255)
    static let lumioNavy = Color(red: 0x09 / 255, green: 0x10 / 255, blue: 0x29 / 255)
    static let ball = Color(red: 0xC9 / 255, green: 0xE0 / 255, blue: 0x4A / 255)
}

/// What a screen is doing: loading, showing, or showing why it can't.
enum Loadable<T> {
    case loading
    case loaded(T)
    case failed(String)

    var value: T? { if case .loaded(let v) = self { return v }; return nil }
}

/// A small coloured label: "Confirmed", "Off your pack", "Paid".
struct Pill: View {
    let text: String
    var systemImage: String? = nil
    var tint: Color = .accentColor

    var body: some View {
        HStack(spacing: 4) {
            if let systemImage { Image(systemName: systemImage).imageScale(.small) }
            Text(text)
        }
        .font(.caption.weight(.semibold))
        .padding(.horizontal, 8).padding(.vertical, 3)
        .foregroundStyle(tint)
        .background(tint.opacity(0.14), in: Capsule())
        .accessibilityElement(children: .combine)
    }
}

/// Initials in a circle, for a player or a coach.
struct Avatar: View {
    let name: String
    var size: CGFloat = 40
    var body: some View {
        Text(Fmt.initials(name))
            .font(.system(size: size * 0.38, weight: .semibold, design: .rounded))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(LinearGradient(colors: [.lumioBlue, .lumioBlue.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing), in: Circle())
            .accessibilityHidden(true)
    }
}

/// The date tile on a lesson card: "MON / 2 / Nov".
struct DayTile: View {
    let iso: String
    var body: some View {
        let d = Fmt.day(iso)
        VStack(spacing: 0) {
            Text(d.map { $0.formatted(.dateTime.weekday(.abbreviated)) }?.uppercased() ?? "")
                .font(.caption2.weight(.bold)).foregroundStyle(Color.accentColor)
            Text(d.map { $0.formatted(.dateTime.day()) } ?? "")
                .font(.title2.weight(.bold)).monospacedDigit()
            Text(d.map { $0.formatted(.dateTime.month(.abbreviated)) } ?? "")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .frame(width: 52, height: 60)
        .background(Color.accentColor.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Fmt.dayLong(iso))
    }
}

/// The standard "couldn't load" view with a retry.
struct LoadFailed: View {
    let message: String
    let retry: () async -> Void
    var body: some View {
        ContentUnavailableView {
            Label("Couldn't load", systemImage: "wifi.exclamationmark")
        } description: {
            Text(message)
        } actions: {
            Button("Try again") { Task { await retry() } }.buttonStyle(.borderedProminent)
        }
    }
}

/// A short message that slides in at the bottom ("Booked for Tue 10 Nov, 17:00").
struct Toast: Equatable { let text: String; var isError = false }

struct ToastModifier: ViewModifier {
    @Binding var toast: Toast?
    func body(content: Content) -> some View {
        content.overlay(alignment: .bottom) {
            if let toast {
                Text(toast.text)
                    .font(.subheadline.weight(.medium))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 16).padding(.vertical, 12)
                    .foregroundStyle(.white)
                    .background(toast.isError ? Color.red.gradient : Color.black.opacity(0.85).gradient, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .padding(.horizontal, 20).padding(.bottom, 12)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .task(id: toast) {
                        try? await Task.sleep(for: .seconds(toast.isError ? 5 : 3))
                        withAnimation { self.toast = nil }
                    }
                    .onTapGesture { withAnimation { self.toast = nil } }
            }
        }
        .animation(.spring(duration: 0.35), value: toast)
    }
}

extension View {
    func toast(_ toast: Binding<Toast?>) -> some View { modifier(ToastModifier(toast: toast)) }
}

/// A full-width primary button that shows a spinner while its work runs.
struct BusyButton: View {
    let title: String
    var systemImage: String? = nil
    var role: ButtonRole? = nil
    var prominent = true
    let action: () async -> Void
    @State private var busy = false

    var body: some View {
        Button(role: role) {
            guard !busy else { return }
            busy = true
            Task { await action(); busy = false }
        } label: {
            HStack {
                if busy { ProgressView().tint(prominent ? .white : nil) }
                else if let systemImage { Image(systemName: systemImage) }
                Text(title)
            }
            .frame(maxWidth: .infinity, minHeight: 22)
        }
        .modifier(ProminentIf(prominent: prominent))
        .controlSize(.large)
        .disabled(busy)
    }
}

private struct ProminentIf: ViewModifier {
    let prominent: Bool
    func body(content: Content) -> some View {
        if prominent { content.buttonStyle(.borderedProminent) } else { content.buttonStyle(.bordered) }
    }
}

/// Opens tel:, sms: and mailto: links.
enum Contact {
    static func call(_ phone: String) { open("tel:\(digits(phone))") }
    static func text(_ phone: String) { open("sms:\(digits(phone))") }
    static func email(_ address: String) { open("mailto:\(address)") }
    private static func digits(_ s: String) -> String { s.filter { $0.isNumber || $0 == "+" } }
    private static func open(_ s: String) { if let u = URL(string: s) { UIApplication.shared.open(u) } }
}
