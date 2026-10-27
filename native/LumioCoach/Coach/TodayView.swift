import SwiftUI

/// The coach's first screen: who's on today, who has said they'll be there,
/// and what's coming tomorrow.
struct TodayView: View {
    @Environment(AppModel.self) private var model
    @Environment(CoachStore.self) private var store
    @State private var state: Loadable<CoachToday> = .loading
    @State private var adding = false
    @State private var writing = false
    @State private var toast: Toast?

    var body: some View {
        Group {
            switch state {
            case .loading: ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .failed(let m): LoadFailed(message: m) { await load() }
            case .loaded(let t): content(t)
            }
        }
        .navigationTitle("Today")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { adding = true } label: { Image(systemName: "plus") }
                .accessibilityLabel("Add a booking")
            }
        }
        .navigationDestination(for: AppBooking.self) { BookingDetailView(booking: $0) }
        .task { if state.value == nil { await load() } }
        .onChange(of: store.changes) { _, _ in Task { await load() } }
        .sheet(isPresented: $adding) {
            BookingFormView(existing: nil) { text in toast = Toast(text: text) }
                .environment(store)
        }
        .sheet(isPresented: $writing) {
            NavigationStack { SummaryFormView(existing: nil) { text in toast = Toast(text: text) } }
                .environment(store)
        }
        .toast($toast)
        .refreshable { await load() }
    }

    private func content(_ t: CoachToday) -> some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text(Fmt.dayLong(t.date)).font(.subheadline).foregroundStyle(.secondary)
                    Text("\(Fmt.greeting()), \(firstName)").font(.title2.bold())
                    Text(headline(t)).font(.callout).foregroundStyle(.secondary)
                }
                .padding(.vertical, 6)
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets(top: 0, leading: 4, bottom: 8, trailing: 4))

                HStack(spacing: 10) {
                    stat("\(t.counts.today)", "Today")
                    stat("\(t.counts.confirmedByClients)/\(t.counts.today)", "Confirmed")
                    stat("\(t.counts.thisWeek)", "This week")
                    if t.counts.pending > 0 { stat("\(t.counts.pending)", "Waiting", tint: .orange) }
                }
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets())
            }

            Section("Today") {
                if let camp = store.setup?.camp(on: t.date) {
                    Label("\(camp.name) is on", systemImage: "tent").foregroundStyle(.orange).font(.body.weight(.semibold))
                }
                if t.sessions.isEmpty {
                    Text("Nothing booked today.").foregroundStyle(.secondary)
                } else {
                    ForEach(t.sessions) { b in NavigationLink(value: b) { BookingRow(booking: b) } }
                }
            }
            if !t.tomorrow.isEmpty {
                Section("Tomorrow") {
                    ForEach(t.tomorrow) { b in NavigationLink(value: b) { BookingRow(booking: b) } }
                }
            }
            Section {
                NavigationLink { PaymentsView() } label: {
                    Label("Payments & packs", systemImage: "sterlingsign.circle")
                }
                NavigationLink { PlannerView() } label: {
                    Label("Session planner", systemImage: "list.clipboard")
                }
                Button { writing = true } label: {
                    Label("Write a lesson summary", systemImage: "square.and.pencil")
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private var firstName: String {
        let n = model.coach?.displayName ?? model.coach?.brandName ?? ""
        return n.split(separator: " ").first.map(String.init) ?? "coach"
    }

    private func headline(_ t: CoachToday) -> String {
        switch t.counts.today {
        case 0: return "A free day. Enjoy it."
        case 1: return "1 session today."
        default: return "\(t.counts.today) sessions today."
        }
    }

    private func stat(_ value: String, _ label: String, tint: Color = .accentColor) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).monospacedDigit().foregroundStyle(tint)
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 60)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .accessibilityElement(children: .combine)
    }

    private func load() async {
        do { state = .loaded(try await API.shared.get("/api/app/v1/coach/today")) }
        catch { if state.value == nil { state = .failed(error.localizedDescription) } }
    }
}
