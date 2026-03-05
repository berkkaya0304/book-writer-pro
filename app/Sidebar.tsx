"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, 
  PenTool, 
  Settings, 
  Download, 
  Library,
  Sparkles,
  LineChart,
  LayoutDashboard,
  BookMarked,
  Users,
  Type,
  AlertCircle,
  Hash,
  GitFork,
  Activity,
  ShieldCheck,
  GitCommit,
  MessageSquare,
  Calendar,
  LayoutTemplate,
  Link2,
  FileSearch,
  Tags,
  ListOrdered,
  BookCopy,
  Image,
  Table2,
  ClipboardCheck,
  ScanSearch,
  Users2,
  Scale,
  Sigma,
  FlaskConical,
  Globe
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    category: "General",
    items: [
      { label: "Dashboard",     href: "/",                  icon: Library },
      { label: "Chapters",      href: "/chapters",          icon: BookOpen },
      { label: "Write",         href: "/write",             icon: PenTool },
      { label: "Analytics",     href: "/analytics",         icon: LineChart },
    ],
  },
  {
    category: "Planning",
    items: [
      { label: "Outline Gen",   href: "/outline-generator", icon: Sparkles },
      { label: "Plot Board",    href: "/plot",              icon: LayoutDashboard },
      { label: "Calendar",      href: "/calendar",          icon: Calendar },
      { label: "Templates",     href: "/templates",         icon: LayoutTemplate },
    ],
  },
  {
    category: "Content",
    items: [
      { label: "References",    href: "/references",           icon: BookMarked },
      { label: "Footnotes",     href: "/footnotes",            icon: Hash },
      { label: "Abbreviations", href: "/abbreviations",        icon: Type },
      { label: "Errata",        href: "/errata",               icon: AlertCircle },
      { label: "Abstract Gen",  href: "/abstract-generator",   icon: FileSearch },
      { label: "Keywords",      href: "/keyword-extractor",    icon: Tags },
      { label: "Section #",     href: "/section-numbering",    icon: ListOrdered },
      { label: "Related Work",  href: "/related-work",         icon: BookCopy },
      { label: "Captions",      href: "/captions",             icon: Image },
    ],
  },
  {
    category: "Quality",
    items: [
      { label: "Readability",   href: "/readability",          icon: Activity },
      { label: "Style Guide",   href: "/style-guide",          icon: ShieldCheck },
      { label: "URL Checker",   href: "/url-checker",          icon: Link2 },
      { label: "Dep. Graph",    href: "/dependency-graph",     icon: GitFork },
      { label: "Submission",    href: "/submission-checker",   icon: ClipboardCheck },
      { label: "Plagiarism",    href: "/plagiarism-check",     icon: ScanSearch },
      { label: "Contribution",  href: "/contribution-statement", icon: Users2 },
      { label: "Ethics",        href: "/ethics-checklist",     icon: Scale },
    ],
  },
  {
    category: "Tools",
    items: [
      { label: "Table Builder",  href: "/table-builder",       icon: Table2 },
      { label: "Reproducibility",href: "/reproducibility",     icon: FlaskConical },
      { label: "Math & Sigma",   href: "/section-numbering",   icon: Sigma },
      { label: "Site Builder",   href: "/static-site-builder", icon: Globe },
    ],
  },
  {
    category: "Collaboration",
    items: [
      { label: "Peer Review",   href: "/peer-review",       icon: MessageSquare },
      { label: "Changelog",     href: "/changelog",         icon: GitCommit },
      { label: "Reader Profile",href: "/reader-profile",    icon: Users },
      { label: "GitHub Sync",   href: "/github-sync",       icon: GitFork },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" style={{ padding: "14px 10px" }}>
      {/* Logo */}
      <div className="sidebar-header">
        <PenTool size={18} />
        <span>Book Writer</span>
      </div>

      {/* Grouped Nav */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingRight: "2px" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.category} style={{ marginBottom: "8px" }}>
            {/* Category Label */}
            <div style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              padding: "4px 10px 2px",
              marginTop: "4px",
            }}>
              {group.category}
            </div>

            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  <item.icon size={15} style={{ flexShrink: 0 }} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: Export + Settings */}
      <div className="sidebar-bottom">
        {[
          { label: "Export",   href: "/export",   icon: Download },
          { label: "Settings", href: "/settings", icon: Settings },
        ].map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? "active" : ""}`}
            >
              <item.icon size={15} style={{ flexShrink: 0 }} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
