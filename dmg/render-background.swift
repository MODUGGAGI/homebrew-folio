// Renders background.svg with WebKit into background.tiff, which holds a 660x440 and a 1320x880 image.
// Run it after editing background.svg, and commit the new background.tiff.
// Usage: cd dmg && swift render-background.swift
import AppKit
import WebKit

let size = CGSize(width: 660, height: 440)
let folder = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let svg = try String(contentsOf: folder.appendingPathComponent("background.svg"), encoding: .utf8)
let html = "<html><body style='margin:0;overflow:hidden'>\(svg)</body></html>"

final class Renderer: NSObject, WKNavigationDelegate {
    let web = WKWebView(frame: CGRect(origin: .zero, size: size))
    func start() {
        web.navigationDelegate = self
        web.loadHTMLString(html, baseURL: folder)
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        Task { @MainActor in
            for (scale, name) in [(1, "background.png"), (2, "background@2x.png")] {
                let config = WKSnapshotConfiguration()
                config.rect = CGRect(origin: .zero, size: size)
                let image = try await webView.takeSnapshot(configuration: config)
                // Redraw at an exact pixel size so the result does not depend on this Mac's screen scale.
                let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width) * scale,
                    pixelsHigh: Int(size.height) * scale, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                    isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
                rep.size = size
                NSGraphicsContext.saveGraphicsState()
                NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
                image.draw(in: CGRect(origin: .zero, size: size))
                NSGraphicsContext.restoreGraphicsState()
                try rep.representation(using: .png, properties: [:])!.write(to: folder.appendingPathComponent(name))
            }
            let tiffutil = Process()
            tiffutil.executableURL = URL(fileURLWithPath: "/usr/bin/tiffutil")
            tiffutil.currentDirectoryURL = folder
            tiffutil.arguments = ["-cathidpicheck", "background.png", "background@2x.png", "-out", "background.tiff"]
            try tiffutil.run()
            tiffutil.waitUntilExit()
            for name in ["background.png", "background@2x.png"] {
                try FileManager.default.removeItem(at: folder.appendingPathComponent(name))
            }
            exit(tiffutil.terminationStatus)
        }
    }
}

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
let renderer = Renderer()
renderer.start()
app.run()
