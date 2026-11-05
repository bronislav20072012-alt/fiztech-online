/* A local, scenario-based guide. No account data, storage, or remote services. */
(function () {
  "use strict";

  function startAssistant() {
    if (document.getElementById("os-helper-panel")) return;

    function element(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function svgElement(tag, attributes) {
      const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.keys(attributes).forEach(function (name) {
        node.setAttribute(name, attributes[name]);
      });
      return node;
    }

    const launcher = element("button", "os-helper");
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Открыть помощника Физтех OS");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", "os-helper-panel");
    launcher.setAttribute("aria-haspopup", "dialog");

    const atom = svgElement("svg", {
      viewBox: "0 0 96 96",
      "aria-hidden": "true",
      focusable: "false",
      class: "os-helper-atom"
    });
    ["one", "two", "three"].forEach(function (name) {
      const orbit = svgElement("g", {
        class: "os-helper-orbit os-helper-orbit--" + name
      });
      orbit.appendChild(svgElement("ellipse", {
        cx: "48", cy: "48", rx: "41", ry: "17",
        class: "os-helper-orbit-line"
      }));
      orbit.appendChild(svgElement("circle", {
        cx: "89", cy: "48", r: "3.5", class: "os-helper-electron"
      }));
      atom.appendChild(orbit);
    });
    const logo = element("img", "os-helper-logo");
    logo.src = "assets/ft-symbol.svg";
    logo.alt = "";
    logo.width = 32;
    logo.height = 32;
    launcher.append(atom, logo);

    const panel = element("section", "os-helper-panel");
    panel.id = "os-helper-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-labelledby", "os-helper-title");
    panel.setAttribute("aria-describedby", "os-helper-note");

    const header = element("div", "os-helper-header");
    const heading = element("div", "os-helper-heading");
    const title = element("h2", "os-helper-title", "Помощник Физтех OS");
    title.id = "os-helper-title";
    heading.append(title, element("span", "os-helper-online", "Помогу освоиться в кабинете"));
    const close = element("button", "os-helper-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Закрыть помощника");
    header.append(heading, close);

    const messages = element("div", "os-helper-messages");
    messages.setAttribute("role", "log");
    messages.setAttribute("aria-label", "Диалог с помощником");
    messages.setAttribute("aria-live", "polite");
    messages.setAttribute("aria-relevant", "additions");
    messages.tabIndex = 0;

    function addMessage(text, user, action) {
      const bubble = element("div", "os-helper-message" + (user ? " os-helper-message--user" : ""));
      bubble.append(
        element("span", "os-helper-sender", user ? "Вы" : "Физтех OS"),
        element("p", "os-helper-message-text", text)
      );
      if (action) {
        const button = element("button", "os-helper-action", action.label + " →");
        button.type = "button";
        button.addEventListener("click", function () {
          setOpen(false, false);
          window.dispatchEvent(new CustomEvent("os:navigate", { detail: action.page }));
        });
        bubble.appendChild(button);
      }
      messages.appendChild(bubble);
      while (messages.children.length > 12) messages.firstElementChild.remove();
      messages.scrollTop = messages.scrollHeight;
    }

    addMessage("Привет! Я помощник Физтех OS. Подскажу, где найти курсы, расписание и сообщения наставнику. Выбери вопрос или напиши свой.", false);

    const chips = element("div", "os-helper-chips");
    chips.setAttribute("aria-label", "Частые вопросы");
    const faq = [
      { question: "Как найти курс?", text: "Открой раздел «Курсы»: там можно выбрать предмет и посмотреть учебные материалы.", action: { page: "courses", label: "Открыть курсы" } },
      { question: "Где расписание?", text: "Расписание и учебные задачи находятся в дневнике. Открой его, чтобы посмотреть план занятий.", action: { page: "journal", label: "Открыть дневник" } },
      { question: "Как написать наставнику?", text: "Открой раздел сообщений и выбери диалог с наставником. В демо можно познакомиться с интерфейсом переписки.", action: { page: "messages", label: "Открыть сообщения" } },
      { question: "Что умеет помощник?", text: "Я справочный помощник: отвечаю на частые вопросы и помогаю найти нужный раздел. Ответы подготовлены заранее; я не проверяю задания и не связываюсь с настоящим наставником." }
    ];

    function answer(question, entry) {
      addMessage(question, true);
      addMessage(entry.text, false, entry.action);
    }

    faq.forEach(function (entry) {
      const button = element("button", "os-helper-chip", entry.question);
      button.type = "button";
      button.addEventListener("click", function () { answer(entry.question, entry); });
      chips.appendChild(button);
    });

    const form = element("form", "os-helper-form");
    const label = element("label", "os-helper-input-label", "Вопрос помощнику");
    label.htmlFor = "os-helper-input";
    const input = element("input", "os-helper-input");
    input.id = "os-helper-input";
    input.type = "text";
    input.maxLength = 240;
    input.placeholder = "Напиши свой вопрос…";
    input.autocomplete = "off";
    const submit = element("button", "os-helper-submit", "↑");
    submit.type = "submit";
    submit.setAttribute("aria-label", "Задать вопрос помощнику");
    form.append(label, input, submit);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const question = input.value.trim();
      if (!question) { input.focus(); return; }
      const normalized = question.toLowerCase().normalize("NFKC").replace(/ё/g, "е");
      let entry;
      if (/распис|дневник|журнал|когда|план/.test(normalized)) entry = faq[1];
      else if (/настав|напис|сообщ|учител|переписк/.test(normalized)) entry = faq[2];
      else if (/курс|предмет|урок|материал|учеб|заняти/.test(normalized)) entry = faq[0];
      else if (/уме|помощ|можеш|кто ты|что ты/.test(normalized)) entry = faq[3];
      else if (/привет|здравств|добрый/.test(normalized)) entry = { text: "Привет! Помогу найти курс, расписание или сообщения наставнику. О чём хочешь узнать?" };
      else if (/спасиб/.test(normalized)) entry = { text: "Пожалуйста! Если понадобится помощь с кабинетом, я рядом." };
      else entry = { text: "Пока я отвечаю на вопросы о курсах, расписании и сообщениях наставнику. Попробуй один из вопросов выше — подскажу, куда перейти." };
      answer(question, entry);
      input.value = "";
      input.focus({ preventScroll: true });
    });

    const note = element("p", "os-helper-note", "Справочный помощник · ответы по сценариям");
    note.id = "os-helper-note";
    panel.append(header, messages, chips, form, note);
    document.body.append(panel, launcher);

    function setOpen(open, restoreFocus) {
      panel.hidden = !open;
      launcher.setAttribute("aria-expanded", String(open));
      launcher.setAttribute("aria-label", open ? "Закрыть помощника Физтех OS" : "Открыть помощника Физтех OS");
      launcher.classList.toggle("os-helper--open", open);
      if (open) {
        close.focus({ preventScroll: true });
        messages.scrollTop = messages.scrollHeight;
      } else if (restoreFocus) launcher.focus({ preventScroll: true });
    }

    launcher.addEventListener("click", function () { setOpen(panel.hidden, false); });
    close.addEventListener("click", function () { setOpen(false, true); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panel.hidden) {
        event.preventDefault();
        setOpen(false, true);
      }
    });
    document.addEventListener("pointerdown", function (event) {
      if (!panel.hidden && !panel.contains(event.target) && !launcher.contains(event.target)) setOpen(false, false);
    });
    document.addEventListener("focusin", function (event) {
      if (!panel.hidden && !panel.contains(event.target) && !launcher.contains(event.target)) setOpen(false, false);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startAssistant, { once: true });
  else startAssistant();
}());
