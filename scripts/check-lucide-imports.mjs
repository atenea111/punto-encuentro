import fs from "fs"

const file = process.argv[2] || "app/page.tsx"
const src = fs.readFileSync(file, "utf8")

const m = src.match(/import \{([\s\S]*?)\} from "lucide-react"/)
const imported = new Set(
  m
    ? m[1]
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : []
)

const localComponents = new Set()
for (const match of src.matchAll(/function\s+([A-Z][a-zA-Z0-9]*)/g)) {
  localComponents.add(match[1])
}

const ui = new Set([
  "Card",
  "CardContent",
  "Button",
  "Input",
  "Label",
  "Badge",
  "CustomAlert",
  "LogoText",
  "NearByMap",
  "StoriesShelf",
  "ProviderStoriesManager",
  "GoogleSignInButton",
  "FloatingAssistant",
  "AlertDialog",
  "AlertDialogAction",
  "AlertDialogCancel",
  "AlertDialogContent",
  "AlertDialogDescription",
  "AlertDialogFooter",
  "AlertDialogHeader",
  "AlertDialogTitle",
  "AdminStatCard",
  "ChatNavButton",
  "ChatInboxRow",
  "Icon",
  "StoryViewer",
  "StoryMedia",
  "Select",
  "SelectContent",
  "SelectItem",
  "SelectTrigger",
  "SelectValue",
  "Textarea",
])

const used = new Map()
for (const match of src.matchAll(/<([A-Z][a-zA-Z0-9]*)\s/g)) {
  const name = match[1]
  if (ui.has(name) || localComponents.has(name)) continue
  used.set(name, (used.get(name) || 0) + 1)
}

const missing = [...used.keys()].filter((n) => !imported.has(n)).sort()
console.log("File:", file)
console.log("Lucide/icons likely missing:", missing.length ? missing.join(", ") : "none")
