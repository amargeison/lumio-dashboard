import SwiftUI

/// The family's plan, lesson packs, card on file, anything to pay, and the
/// cancellation rules.
struct PlanView: View {
    @Environment(FamilyModel.self) private var family

    var body: some View {
        FamilyContent { b in
            List {
                if let account = b.my?.account {
                    if account.plan == nil && account.packs.isEmpty && account.owed.isEmpty && account.method == nil {
                        Section {
                            Text("Nothing set up yet. Your coach will add your plan or lesson pack here.").foregroundStyle(.secondary)
                        }
                    }
                    AccountSections(account: account, showPolicy: true)
                } else {
                    Section { Text("Nothing set up yet.").foregroundStyle(.secondary) }
                }
            }
            .listStyle(.insetGrouped)
        }
        .navigationTitle("Plan & payments")
        .refreshable { await family.reload() }
    }
}

/// The money side of a player's account, as list sections. The coach sees the
/// same thing on a player's page (without the policy).
struct AccountSections: View {
    @Environment(AppModel.self) private var model
    let account: MyAccount
    var showPolicy = true

    var body: some View {
        if !account.owed.isEmpty {
            // The family pays; the coach only sees what is still outstanding.
            Section(showPolicy ? "To pay" : "Still to do on their side") {
                ForEach(account.owed) { o in
                    if showPolicy {
                        Button { model.web = WebTarget(path: o.url, title: o.title) } label: { owedRow(o, chevron: true) }
                    } else {
                        owedRow(o, chevron: false)
                    }
                }
            }
        }

        if let plan = account.plan {
            Section("Monthly plan") {
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(plan.name).font(.headline)
                        Spacer()
                        Pill(text: plan.status, tint: plan.status == "Running" ? .green : plan.status == "Paused" ? .secondary : .orange)
                    }
                    Text(plan.words).font(.subheadline)
                    if !plan.covers.isEmpty { Text(plan.covers).font(.subheadline).foregroundStyle(.secondary) }
                    if let next = plan.nextBill { Text("Next payment \(next)").font(.footnote).foregroundStyle(.secondary) }
                }
                .padding(.vertical, 4)
            }
        }

        if !account.packs.isEmpty {
            Section("Lesson packs") {
                ForEach(account.packs) { p in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(p.name).font(.body.weight(.semibold))
                            Spacer()
                            Text("\(p.left) of \(p.total) left").font(.subheadline.weight(.medium)).monospacedDigit()
                                .foregroundStyle(p.left <= 1 ? Color.orange : Color.secondary)
                        }
                        ProgressView(value: Double(p.used), total: Double(max(p.total, 1)))
                            .tint(p.left <= 1 ? Color.orange : Color.accentColor)
                        if let r = p.renews { Text("Renews \(r)").font(.footnote).foregroundStyle(.secondary) }
                    }
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)
                }
            }
        }

        if let method = account.method {
            Section("Paying by") {
                Label(method, systemImage: "creditcard")
            }
        }

        if showPolicy && !account.policy.isEmpty {
            Section("If you need to cancel") {
                ForEach(account.policy) { line in
                    DisclosureGroup(line.title) {
                        Text(line.text).font(.subheadline).foregroundStyle(.secondary).padding(.vertical, 4)
                    }
                }
            }
        }
    }

    private func owedRow(_ o: MyAccount.Owed, chevron: Bool) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon(o.kind)).font(.title3).foregroundStyle(.orange).frame(width: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(o.title).font(.body.weight(.semibold)).foregroundStyle(.primary)
                Text(o.detail).font(.subheadline).foregroundStyle(.secondary)
            }
            Spacer()
            if chevron { Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary) }
        }
    }

    private func icon(_ kind: String) -> String {
        switch kind {
        case "welcome": return "hand.wave"
        case "group": return "person.3"
        default: return "sterlingsign.circle"
        }
    }
}
