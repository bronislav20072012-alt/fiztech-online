#!/usr/bin/env python3
"""Check the public site's browser security policy before publishing changes."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import sys

ROOT = Path(__file__).resolve().parent.parent
CONTACT_ACTION = "https://formsubmit.co/phystechonline3@gmail.com"
REQUIRED = {
    "default-src": ["'none'"],
    "script-src": ["'self'"],
    "script-src-attr": ["'none'"],
    "style-src": ["'self'"],
    "style-src-attr": ["'none'"],
    "img-src": ["'self'"],
    "font-src": ["'self'"],
    "connect-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'none'"],
    "frame-src": ["'none'"],
    "worker-src": ["'none'"],
}


class SecurityCheck(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.policies = []
        self.referrers = []
        self.scripts = []
        self.in_script = False
        self.errors = []

    def error(self, message):
        self.errors.append(f"{self.path.name}:{self.getpos()[0]}: {message}")

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        for name, value in attributes:
            if name.startswith("on") or name == "style":
                self.error(f"Inline executable/style attribute: {name}")
            if name in {"href", "src", "action", "formaction"} and value:
                parsed = urlsplit(value)
                if parsed.scheme and parsed.scheme not in {"https", "mailto", "tel"}:
                    self.error(f"Unsafe URL scheme on {name}")
                if value.startswith("//"):
                    self.error(f"Protocol-relative URL on {name}")
        if tag == "meta":
            if attrs.get("http-equiv", "").lower() == "content-security-policy":
                policy = {}
                for directive in attrs.get("content", "").split(";"):
                    parts = directive.split()
                    if parts:
                        if parts[0] in policy:
                            self.error("Duplicate CSP directive")
                        policy[parts[0]] = parts[1:]
                self.policies.append(policy)
            if attrs.get("name", "").lower() == "referrer":
                self.referrers.append(attrs.get("content"))
        if tag in {"script", "link", "img", "iframe"}:
            if not self.policies:
                self.error("Resource appears before the security policy")
            url = attrs.get("src", attrs.get("href", ""))
            if urlsplit(url).netloc:
                self.error(f"External {tag} resource")
        if tag in {"style", "base", "iframe", "object", "embed"}:
            self.error(f"Unexpected active element: {tag}")
        if tag == "script":
            self.in_script = True
            self.scripts.append(urlsplit(attrs.get("src", "")).path)
        if tag == "form" and self.path.name == "index.html":
            if attrs.get("action") != CONTACT_ACTION or attrs.get("method", "").upper() != "POST":
                self.error("Contact form must use the fixed HTTPS POST endpoint")
        if attrs.get("target") == "_blank":
            if not {"noopener", "noreferrer"}.issubset(set(attrs.get("rel", "").split())):
                self.error("New-tab link must isolate the opener and referrer")

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_script = False

    def handle_data(self, data):
        if self.in_script and data.strip():
            self.error("Inline script")

    def check(self):
        self.feed(self.path.read_text(encoding="utf-8"))
        self.close()
        if len(self.policies) != 1:
            self.error("Exactly one early CSP is required")
        elif self.policies:
            expected = dict(REQUIRED)
            expected["form-action"] = (
                ["'self'", CONTACT_ACTION] if self.path.name == "index.html" else ["'none'"]
            )
            if self.policies[0] != expected:
                self.error("CSP was weakened or changed; review its security impact")
        if self.referrers != ["strict-origin-when-cross-origin"]:
            self.error("Referrer privacy policy is missing or changed")
        if self.scripts != ["https.js", "script.js"]:
            self.error("Only the HTTPS guard and application script are allowed")
        return self.errors


def main():
    pages = sorted(ROOT.glob("*.html"))
    errors = [error for path in pages for error in SecurityCheck(path).check()]
    if not pages:
        errors.append("No HTML pages found")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"Security policy checks passed for {len(pages)} pages.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
