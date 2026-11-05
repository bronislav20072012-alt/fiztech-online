"use strict";

// A fallback for old HTTP bookmarks. Server-side HTTPS enforcement is still required.
if (window.location.protocol === "http:" && [
  "phystechonline.ru",
  "www.phystechonline.ru",
  "bronislav20072012-alt.github.io"
].includes(window.location.hostname)) {
  const secureURL = new URL(window.location.href);
  secureURL.protocol = "https:";
  secureURL.port = "";
  if (secureURL.hostname === "www.phystechonline.ru") {
    secureURL.hostname = "phystechonline.ru";
  }
  window.location.replace(secureURL.href);
}
