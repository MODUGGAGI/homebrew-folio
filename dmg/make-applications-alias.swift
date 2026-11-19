// Writes a Finder alias to /Applications that carries the folder's icon as its own custom icon.
// A plain symlink shows an empty dashed placeholder in a DMG window on macOS 26.
// On failure it leaves nothing behind, so the caller can fall back to a symlink.
// Usage: swift make-applications-alias.swift <output path, like stage/Applications>
import AppKit

let out = URL(fileURLWithPath: CommandLine.arguments[1])
let target = URL(fileURLWithPath: "/Applications")
try? FileManager.default.removeItem(at: out)
let data = try target.bookmarkData(options: .suitableForBookmarkFile, includingResourceValuesForKeys: nil, relativeTo: nil)
try URL.writeBookmarkData(data, to: out)
// The system's own blue icon file, so the result does not pick up this Mac's folder tint.
let icns = "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/ApplicationsFolderIcon.icns"
let icon = NSImage(contentsOfFile: icns) ?? NSWorkspace.shared.icon(forFile: target.path)
icon.size = NSSize(width: 1024, height: 1024)
guard NSWorkspace.shared.setIcon(icon, forFile: out.path) else {
    FileHandle.standardError.write(Data("Could not set the icon on \(out.path)\n".utf8))
    try? FileManager.default.removeItem(at: out)
    exit(1)
}
