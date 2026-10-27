import SwiftUI
import WebKit
import SafariServices

/// A page of the website shown over the app — the less-used parts of Lumio
/// (settings, camps, leads, payments) and pages from emails (a group answer, a
/// trip balance). Opened already signed in: the app asks the website for a
/// one-minute, one-use link that signs this web view in as the same account.
struct WebSheet: View {
    let target: WebTarget
    @Environment(\.dismiss) private var dismiss
    @State private var url: URL?
    @State private var failed: String?
    @State private var progress: Double = 0
    @State private var external: ExternalLink?

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                if let url {
                    WebView(url: url, progress: $progress, openExternally: { external = ExternalLink(url: $0) })
                        .ignoresSafeArea(edges: .bottom)
                } else if let failed {
                    LoadFailed(message: failed) { await prepare() }
                } else {
                    ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                if progress > 0 && progress < 1 {
                    ProgressView(value: progress).progressViewStyle(.linear).tint(.accentColor)
                }
            }
            .navigationTitle(target.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }.fontWeight(.semibold)
                }
            }
        }
        .task { await prepare() }
        .sheet(item: $external) { SafariView(url: $0.url).ignoresSafeArea() }
    }

    private func prepare() async {
        failed = nil
        // A full address (a payment page) opens as it is; our own paths open signed in.
        guard target.signedIn, !target.path.hasPrefix("http"), API.shared.session != nil else { url = Config.url(target.path); return }
        do {
            struct Body: Encodable { let path: String }
            let r: WebSessionResponse = try await API.shared.post("/api/app/v1/web-session", body: Body(path: target.path))
            url = Config.url(r.url)
        } catch {
            failed = error.localizedDescription
        }
    }
}

struct ExternalLink: Identifiable { let url: URL; var id: String { url.absoluteString } }

struct SafariView: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController { SFSafariViewController(url: url) }
    func updateUIViewController(_ vc: SFSafariViewController, context: Context) {}
}

struct WebView: UIViewRepresentable {
    let url: URL
    @Binding var progress: Double
    let openExternally: (URL) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()          // stays signed in between sheets
        config.applicationNameForUserAgent = Config.userAgentSuffix
        config.allowsInlineMediaPlayback = true
        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        web.allowsBackForwardNavigationGestures = true
        web.isOpaque = false
        web.backgroundColor = .systemBackground
        context.coordinator.observe(web)
        web.load(URLRequest(url: url))
        return web
    }

    func updateUIView(_ web: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let parent: WebView
        private var watch: NSKeyValueObservation?
        init(_ parent: WebView) { self.parent = parent }

        func observe(_ web: WKWebView) {
            watch = web.observe(\.estimatedProgress, options: [.new]) { [weak self] w, _ in
                DispatchQueue.main.async { self?.parent.progress = w.estimatedProgress }
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { return decisionHandler(.allow) }
            let scheme = url.scheme?.lowercased() ?? ""
            if ["tel", "mailto", "sms", "maps", "whatsapp"].contains(scheme) {
                UIApplication.shared.open(url); return decisionHandler(.cancel)
            }
            if scheme == "about" || scheme == "blob" || scheme == "data" { return decisionHandler(.allow) }
            if Config.staysInWebView(url.host) || action.targetFrame?.isMainFrame == false { return decisionHandler(.allow) }
            parent.openExternally(url)
            decisionHandler(.cancel)
        }

        // target=_blank: our own pages open here, others in Safari.
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = action.request.url {
                if Config.staysInWebView(url.host) { webView.load(URLRequest(url: url)) } else { parent.openExternally(url) }
            }
            return nil
        }
    }
}
