(function () {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  function el(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }
  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#i-" + name);
    svg.setAttribute("aria-hidden", "true");
    svg.append(use);
    return svg;
  }
  function button(label, className, action) {
    const node = el("button", className, label);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  }
  let toastTimer;
  function toast(message) {
    clearTimeout(toastTimer);
    $("#os-toast").textContent = message;
    $("#os-toast").hidden = false;
    toastTimer = setTimeout(() => { $("#os-toast").hidden = true; }, 3600);
  }

  // All state is deliberately confined to this page. No requests or persistence.
  const names = {home:"Мой день",courses:"Мои курсы",messages:"Мессенджер",journal:"Дневник",projects:"Мои проекты",community:"Сообщество",notifications:"Уведомления",ai:"Физтех AI",passport:"Мой профиль"};
  const menuButton = $(".os-mobile-menu");
  const sidebar = $(".os-sidebar");
  const backdrop = $(".os-nav-backdrop");
  function setMenu(open, restoreFocus) {
    sidebar.classList.toggle("is-open", open);
    backdrop.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Закрыть меню кабинета" : "Открыть меню кабинета");
    if (open) sidebar.querySelector("a").focus();
    else if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener("click", () => setMenu(!sidebar.classList.contains("is-open")));
  backdrop.addEventListener("click", () => setMenu(false, true));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar.classList.contains("is-open")) setMenu(false, true);
    if (event.key === "Tab" && sidebar.classList.contains("is-open")) {
      const links = Array.from(sidebar.querySelectorAll("a"));
      if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); links[links.length-1].focus(); }
      if (!event.shiftKey && document.activeElement === links[links.length-1]) { event.preventDefault(); links[0].focus(); }
    }
  });
  matchMedia("(min-width:701px)").addEventListener("change", () => setMenu(false));
  function activateView(focus) {
    const raw = location.hash.slice(1);
    const view = Object.hasOwn(names, raw) ? raw : "courses";
    $$("[data-os-panel]").forEach(panel => { panel.hidden = panel.dataset.osPanel !== view; });
    $$("[data-os-view]").forEach(link => {
      if (link.dataset.osView === view) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    $("#os-current-section").textContent = names[view];
    document.title = names[view] + " — Физтех OS";
    setMenu(false);
    if (focus) { $("#heading-" + view).focus({preventScroll:true}); window.scrollTo(0,0); }
  }
  function navigate(view) {
    if (!Object.hasOwn(names, view)) return;
    if (location.hash === "#" + view) activateView(true);
    else location.hash = view;
  }
  $$("[data-os-view]").forEach(link => link.addEventListener("click", event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(link.dataset.osView);
  }));
  window.addEventListener("hashchange", () => activateView(true));
  window.addEventListener("os:navigate", event => {
    if (event.detail === "journal") journalTab($("#tab-schedule"));
    if (event.detail === "messages") selectChat(chats[1]);
    navigate(event.detail);
  });

  // Course catalogue with independent grade/year progress and real filters.
  const subjectData = [
    ["math","Алгебра","Квадратные уравнения","math",6,24],
    ["geometry","Геометрия","Подобие треугольников","math",4,20],
    ["physics","Физика","Движение и законы природы","physics",5,22],
    ["code","Информатика","Алгоритмы и программирование","code",8,24],
    ["biology","Биология","Живые системы вокруг нас","biology",3,20],
    ["english","Английский язык","Общаемся и понимаем мир","english",7,24],
    ["literature","Литература","Книги, идеи и смыслы","literature",4,18],
    ["russian","Русский язык","Язык, который объединяет","literature",6,22],
    ["history","История","Люди и события, изменившие мир","history",3,20],
    ["geography","География","Открываем нашу планету","geography",5,20]
  ];
  const completed = new Map();
  let selectedCourse;
  function catalogue() {
    const grade = Number($("#course-grade").value);
    let data = subjectData;
    if (grade <= 4) data = subjectData.filter(c => ["math","english","literature","russian","biology","code"].includes(c[0]));
    else if (grade <= 6) data = subjectData.filter(c => !["geometry","physics"].includes(c[0]));
    return data.map(c => {
      const entry = {id:c[0],name:c[1],topic:c[2],art:c[3],done:c[4],total:c[5],grade,year:$("#course-year").value};
      if (grade<=6 && entry.id==="math") { entry.name="Математика"; entry.topic=grade<=4?"Числа, открытия и простые задачи":"Дроби и математические закономерности"; }
      if (grade<=4 && entry.id==="biology") { entry.name="Окружающий мир"; entry.topic="Наблюдаем, исследуем, удивляемся"; }
      if (grade<=4 && entry.id==="code") { entry.name="Творческая мастерская"; entry.topic="Первые идеи и маленькие изобретения"; }
      entry.key = [entry.year,grade,entry.id].join(":");
      entry.done = completed.get(entry.key) ?? entry.done;
      return entry;
    });
  }
  function fillSubjects() {
    const select = $("#course-subject");
    const previous = select.value;
    select.replaceChildren();
    const all = el("option", "", "Все предметы"); all.value="all"; select.append(all);
    catalogue().forEach(c => { const option=el("option","",c.name); option.value=c.id; select.append(option); });
    select.value = Array.from(select.options).some(o => o.value===previous) ? previous : "all";
  }
  function renderCourses() {
    const search = $("#course-search").value.trim().toLocaleLowerCase("ru");
    const subject = $("#course-subject").value;
    const list = catalogue().filter(c => (subject==="all" || c.id===subject) && (c.name+" "+c.topic).toLocaleLowerCase("ru").includes(search));
    const grid = $("#course-grid"); grid.replaceChildren();
    list.forEach(c => {
      const card = button("", "os-course-card", () => openCourse(c));
      card.dataset.courseKey = c.key;
      card.setAttribute("aria-label", "Открыть курс «"+c.name+"», "+c.grade+" класс");
      const art = el("div","os-course-art");
      const image = el("img"); image.src="assets/courses/"+c.art+".svg"; image.alt=""; image.width=400; image.height=220; image.loading="lazy";
      const badge = (c.grade===9 && ["math","geometry","russian"].includes(c.id)) ? "ГОТОВИМСЯ К ОГЭ" : (c.grade>=10 ? "УГЛУБЛЯЕМ ЗНАНИЯ" : "ОСНОВНОЙ КУРС");
      art.append(image,el("span","os-course-badge",badge));
      const body=el("div","os-course-body"); const heading=el("div","os-course-heading");
      heading.append(el("h2","",c.name),el("span","os-course-grade",c.grade+" класс"));
      const progress=el("progress"); progress.max=c.total; progress.value=c.done; progress.setAttribute("aria-label","Прогресс курса: "+c.done+" из "+c.total);
      const foot=el("div","os-course-footer"); const arrow=el("span","os-round-arrow"); arrow.append(icon("arrow"));
      foot.append(el("span","",c.done+" из "+c.total+" уроков"),arrow);
      body.append(heading,el("p","os-course-topic",c.topic),progress,foot); card.append(art,body); grid.append(card);
    });
    $("#course-count").textContent="Курсов: "+list.length+" · "+$("#course-grade").value+" класс · "+$("#course-year").value;
    $("#course-empty").hidden = list.length > 0;
  }
  function courseDetails() {
    const c=selectedCourse;
    $("#course-dialog-kicker").textContent=c.grade+" КЛАСС · "+c.year;
    $("#course-dialog-title").textContent=c.name;
    $("#course-dialog-desc").textContent=c.topic+". Разбирайся в теме, пробуй на практике и замечай свой прогресс.";
    $("#course-dialog-summary").textContent="Пройдено "+c.done+" из "+c.total+" уроков · "+Math.round(c.done/c.total*100)+"% курса";
    const list=$("#course-dialog-lessons"); list.replaceChildren();
    ["Знакомство с темой","Разбираем на примерах","Попробуй самостоятельно"].forEach((title,i) => {
      const row=el("div","os-course-lesson"); row.append(icon(i===0?"check":"book"),el("span","",title),el("small","",i===0?"Теория":"Практика")); list.append(row);
    });
    $("#course-continue").disabled=c.done>=c.total;
  }
  function openCourse(course) { selectedCourse=course; courseDetails(); $("#course-dialog-status").textContent="В демо можно отметить урок как пройденный."; $("#course-dialog").showModal(); }
  $("#course-continue").addEventListener("click", () => {
    selectedCourse.done=Math.min(selectedCourse.total,selectedCourse.done+1);
    completed.set(selectedCourse.key, selectedCourse.done); courseDetails(); renderCourses();
    $("#course-dialog-status").textContent="Отлично! Демо-урок отмечен как пройденный. Прогресс обновлён.";
  });
  $("#course-dialog").addEventListener("close", () => {
    const card = $$(".os-course-card").find(node => node.dataset.courseKey === selectedCourse?.key);
    if (card) card.focus({preventScroll:true});
  });
  $("#course-search").addEventListener("input",renderCourses);
  $("#course-subject").addEventListener("change",renderCourses);
  $("#course-year").addEventListener("change",renderCourses);
  $("#course-grade").addEventListener("change",() => {fillSubjects();renderCourses();});
  $("#course-reset").addEventListener("click",()=>{$("#course-search").value="";$("#course-subject").value="all";renderCourses();});
  $$("[data-course-layout]").forEach(control => control.addEventListener("click",()=>{
    $("#course-grid").classList.toggle("is-list",control.dataset.courseLayout==="list");
    $$("[data-course-layout]").forEach(b=>{const active=b===control;b.classList.toggle("is-active",active);b.setAttribute("aria-pressed",String(active));});
  }));
  $$("dialog").forEach(dialog=>{
    dialog.querySelector("[data-close-dialog]").addEventListener("click",()=>dialog.close());
    dialog.addEventListener("click",event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  });

  // Daily plan and timetable.
  const dayNames=["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
  const shortDays=["ПН","ВТ","СР","ЧТ","ПТ","СБ","ВС"];
  const timetable=[
    [["09:00","Алгебра","Квадратные уравнения"],["10:00","Английский язык","Разговорная практика"],["12:00","Проектная мастерская","Идеи и первые прототипы"]],
    [["09:00","Русский язык","Практикум по тексту"],["10:00","Физика","Механика в жизни"],["12:00","Литература","Обсуждаем прочитанное"]],
    [["09:00","Геометрия","Исследуем фигуры"],["10:00","Биология","Живые системы"],["12:00","Встреча с наставником","Цели и обратная связь"]],
    [["09:00","Алгебра","Решаем вместе"],["10:00","Информатика","Пишем первый алгоритм"],["12:00","Проектная мастерская","Проверяем гипотезы"]],
    [["09:00","Английский язык","Общаемся в команде"],["10:00","История","События и открытия"],["12:00","Клуб идей","Делимся находками недели"]],
    [["11:00","Клуб исследователей","Свободная встреча по интересам"]],
    []
  ];
  let currentDay=(new Date().getDay()+6)%7;
  let scheduleDay=currentDay;
  const dayPlans=dayNames.map((_,i)=>({version:0,checked:[true,false,false],items:i<5?[[timetable[i][0][1],"Разобраться в новой теме"],["Мой проект","Сделать один шаг к прототипу"],["Развитие","Записать главное открытие дня"]]:[["Время для себя","Отдохнуть и восстановить силы"],["Идея для проекта","Понаблюдать за миром вокруг"],["Свободное чтение","Выбрать интересную книгу"]]}));
  function drawWeek(container,active,action){container.replaceChildren();shortDays.forEach((name,i)=>{const b=button(name,"",()=>action(i));b.setAttribute("aria-label",dayNames[i]);b.setAttribute("aria-pressed",String(i===active));container.append(b);});}
  function updateDayProgress(){const count=dayPlans[currentDay].checked.filter(Boolean).length;$("#day-progress").value=count;$("#day-progress-label").textContent=count+" / 3";}
  function renderDay(){
    drawWeek($("#day-selector"),currentDay,i=>{currentDay=i;renderDay();});
    $("#day-caption").textContent=dayNames[currentDay]+" · твой план";
    const tasks=$("#day-tasks");tasks.replaceChildren();
    dayPlans[currentDay].items.forEach((item,i)=>{const label=el("label","os-task");const box=el("input");box.type="checkbox";box.checked=dayPlans[currentDay].checked[i];box.addEventListener("change",()=>{dayPlans[currentDay].checked[i]=box.checked;updateDayProgress();});const copy=el("span");copy.append(el("strong","",item[0]),el("small","",item[1]));label.append(box,copy);tasks.append(label);});
    updateDayProgress();
    const list=$("#home-lessons");list.replaceChildren();
    timetable[currentDay].forEach(item=>{const row=el("div","os-lesson");const content=el("span");content.append(el("b","",item[1]),el("small","",item[2]));row.append(el("time","",item[0]),content);list.append(row);});
    if(!timetable[currentDay].length) list.append(el("p","os-context-note","Свободный день. Время для отдыха и собственных открытий."));
  }
  $("#create-day-plan").addEventListener("click",()=>{const plan=dayPlans[currentDay];plan.version++;plan.items=plan.version%2?[["Учебный практикум","Решить три задачи и разобрать ошибки"],["Мой проект","Задать команде один важный вопрос"],["Личный итог","Записать, что удалось сегодня"]]:[["Новая тема","Сформулировать вопросы к следующему уроку"],["Исследование","Найти три примера из жизни"],["Команда","Поделиться своим открытием"]];plan.checked=[false,false,false];renderDay();toast("Подобран новый пример плана на день");});
  $("#os-today").textContent=new Intl.DateTimeFormat("ru-RU",{weekday:"long",day:"numeric",month:"long"}).format(new Date()).toUpperCase();
  function renderSchedule(){drawWeek($("#schedule-days"),scheduleDay,i=>{scheduleDay=i;renderSchedule();});const list=$("#schedule-list");list.replaceChildren();timetable[scheduleDay].forEach(item=>{const row=el("article","os-schedule-item");const copy=el("div");copy.append(el("h3","",item[1]),el("p","",item[2]));row.append(el("time","os-schedule-time",item[0]),copy,el("span","os-soft-tag","Онлайн · 45 минут"));list.append(row);});if(!timetable[scheduleDay].length){const empty=el("div","os-empty");empty.append(icon("spark"),el("h2","","Сегодня без уроков"),el("p","","Можно отдохнуть, почитать или вернуться к любимому проекту."));list.append(empty);}}
  const journalTabs=$$("[data-journal-tab]");
  function journalTab(tab){journalTabs.forEach(b=>{const active=b===tab;b.setAttribute("aria-selected",String(active));b.tabIndex=active?0:-1;});$$("[data-journal-panel]").forEach(p=>{p.hidden=p.dataset.journalPanel!==tab.dataset.journalTab;});}
  journalTabs.forEach((tab,i)=>{tab.addEventListener("click",()=>journalTab(tab));tab.addEventListener("keydown",e=>{let index;if(e.key==="ArrowRight")index=(i+1)%3;else if(e.key==="ArrowLeft")index=(i+2)%3;else if(e.key==="Home")index=0;else if(e.key==="End")index=2;else return;e.preventDefault();journalTabs[index].focus();journalTab(journalTabs[index]);});});
  [["Алгебра",[5,4,5,5]],["Английский язык",[5,5,4,5]],["Геометрия",[4,5,4,5]],["Физика",[5,5,5,4]],["Биология",[5,4,5,4]],["Русский язык",[4,5,5,5]],["Литература",[5,5,5,5]]].forEach(([subject,grades])=>{const row=el("tr");row.append(el("td","",subject));const marks=el("td");grades.forEach(g=>marks.append(el("span","os-grade-chip"+(g===5?" is-five":""),g)));const avg=(grades.reduce((a,b)=>a+b,0)/grades.length).toFixed(2).replace(".",",");row.append(marks,el("td","os-grade-average",avg),el("td","","—"),el("td","","—"));$("#grades-body").append(row);});
  [["Алгебра","Решить задачи на квадратные уравнения · к следующему уроку"],["Физика","Подготовить пример применения закона инерции"],["Мой проект","Описать три гипотезы для проверки"]].forEach(([title,desc])=>{const row=el("article","os-assignment");const copy=el("div");copy.append(el("h3","",title),el("p","",desc));let done=false;const control=button("Отметить выполненным","os-button os-button-secondary",()=>{done=!done;row.classList.toggle("is-done",done);control.textContent=done?"Выполнено ✓":"Отметить выполненным";control.setAttribute("aria-pressed",String(done));});control.setAttribute("aria-pressed","false");row.append(icon("journal"),copy,control);$("#assignment-list").append(row);});

  // Messenger: local demo conversations, not actual external communication.
  const chats=[
    {id:"class",name:"Наш 9-й класс",avatar:"9",members:"Учебная группа · 24 участника",unread:2,messages:[["Наставник","Привет, команда! В пятницу встречаемся в клубе идей. Каждый может показать своё маленькое открытие.","10:20"],["Ученик","Я принесу прототип датчика для теплицы!","10:24"]]},
    {id:"mentor",name:"Мой наставник",avatar:"М",members:"Личный диалог",personal:true,unread:1,messages:[["Наставник","Привет! Как идёт неделя? Если хочется обсудить идею или сложную задачу — напиши здесь.","09:15"]]},
    {id:"greenhouse",name:"Умная теплица",avatar:"Т",members:"Проектная команда · 4 участника",unread:0,messages:[["Команда","Давайте сначала проверим, как меняется влажность почвы в течение дня.","11:30"],["Ученик","Составлю таблицу наблюдений. Потом сравним результаты.","11:34"]]},
    {id:"physics",name:"Физика · 9 класс",avatar:"Ф",members:"Предметный чат",unread:0,messages:[["Преподаватель","На следующем уроке исследуем движение. Подумайте, где вы замечаете инерцию в повседневной жизни.","12:00"]]},
    {id:"ideas",name:"Клуб идей",avatar:"И",members:"Клуб по интересам",unread:0,messages:[["Клуб","Какая небольшая вещь могла бы сделать жизнь вашей школы удобнее? Делитесь идеями!","13:10"]]}
  ];
  let activeChat=chats[0];let chatFilter="all";
  function chatCounts(){const count=chats.reduce((n,c)=>n+c.unread,0);$("[data-chat-count]").textContent=count;$("[data-chat-count]").hidden=!count;}
  function renderChatList(){const list=$("#chat-list");list.replaceChildren();const query=$("#chat-search").value.trim().toLocaleLowerCase("ru");chats.filter(c=>(chatFilter!=="personal"||c.personal)&&c.name.toLocaleLowerCase("ru").includes(query)).forEach(c=>{const control=button("","os-chat-item",()=>selectChat(c));control.setAttribute("aria-pressed",String(c===activeChat));const copy=el("span");copy.append(el("strong","",c.name),el("small","",c.messages[c.messages.length-1][1]));control.append(el("span","os-avatar",c.avatar),copy);if(c.unread)control.append(el("b","os-chat-unread",c.unread));list.append(control);});if(!list.children.length)list.append(el("p","os-chat-empty","Чат не найден. Попробуй изменить поиск."));chatCounts();}
  function renderChat(){ $("#chat-title").textContent=activeChat.name;$("#chat-members").textContent=activeChat.members;$("#chat-avatar").textContent=activeChat.avatar;const log=$("#chat-history");log.replaceChildren(el("span","os-chat-date","Пример переписки"));activeChat.messages.forEach(([author,copy,time])=>{const message=el("article","os-message"+(author==="Ты"?" is-own":""));message.append(el("strong","",author),el("p","",copy),el("time","",time));log.append(message);});log.scrollTop=log.scrollHeight;}
  function selectChat(chat){activeChat=chat;activeChat.unread=0;renderChatList();renderChat();$(".os-messenger").classList.add("is-room-open");}
  function addMessage(copy){activeChat.messages.push(["Ты",copy,new Intl.DateTimeFormat("ru-RU",{hour:"2-digit",minute:"2-digit"}).format(new Date())]);renderChatList();renderChat();}
  $("#chat-search").addEventListener("input",renderChatList);
  $$("[data-chat-filter]").forEach(b=>b.addEventListener("click",()=>{chatFilter=b.dataset.chatFilter;$$("[data-chat-filter]").forEach(c=>c.setAttribute("aria-pressed",String(c===b)));renderChatList();}));
  $("#chat-form").addEventListener("submit",event=>{event.preventDefault();const value=$("#chat-input").value.trim();if(!value)return;addMessage(value);$("#chat-input").value="";});
  $("#chat-file").addEventListener("change",event=>{const file=event.target.files[0];if(!file)return;addMessage("Прикреплён файл: "+file.name+" · "+Math.max(1,Math.ceil(file.size/1024))+" КБ (локальное демо)");event.target.value="";});
  $(".os-chat-mobile-back").addEventListener("click",()=>{$(".os-messenger").classList.remove("is-room-open");$("#chat-search").focus();});
  $("#write-mentor").addEventListener("click",()=>{selectChat(chats[1]);navigate("messages");});

  const projects=[
    ["Умная теплица","Прототип","Датчики и наблюдения помогают понять, что нужно растениям.","project",["Понаблюдать за влажностью почвы","Проверить точность датчика","Собрать простой прототип","Показать результаты команде"]],
    ["Приложение для школы","Идея","Исследуем, какие школьные задачи можно сделать удобнее.","spark",["Поговорить с пятью учениками","Выбрать одну важную проблему","Нарисовать первые экраны","Собрать обратную связь"]],
    ["Фестиваль открытий","Командный проект","Событие, на котором каждый может поделиться своим открытием.","users",["Собрать команду организаторов","Выбрать темы мастерских","Подготовить программу","Провести встречу и обсудить впечатления"]]
  ];
  projects.forEach(project=>{const card=el("article","os-project-card");const art=el("div","os-project-visual");art.append(icon(project[3]));const copy=el("div","os-project-copy");copy.append(el("span","os-soft-tag",project[1]),el("h2","",project[0]),el("p","",project[2]),button("Открыть проект ↗","os-button os-button-secondary",()=>{$("#project-dialog-title").textContent=project[0];$("#project-dialog-desc").textContent=project[2];$("#project-dialog-steps").replaceChildren(...project[4].map(t=>el("li","",t)));$("#project-dialog").showModal();}));card.append(art,copy);$("#project-grid").append(card);});
  [["Клуб исследователей","Наблюдаем за миром, ставим эксперименты и обсуждаем неожиданные результаты.","spark"],["Инженерная мастерская","От первого эскиза — к прототипу. Создаём устройства и учимся работать в команде.","project"],["Книжный клуб","Истории, которые помогают понимать других и находить собственный голос.","book"]].forEach(([title,desc,glyph])=>{const card=el("article","os-club");let joined=false;const control=button("Присоединиться","os-button os-button-secondary",()=>{joined=!joined;control.textContent=joined?"Вы в клубе ✓":"Присоединиться";control.setAttribute("aria-pressed",String(joined));toast(joined?"Участие отмечено в демо":"Участие в демо отменено");});control.setAttribute("aria-pressed","false");card.append(icon(glyph),el("h2","",title),el("p","",desc),control);$("#club-grid").append(card);});

  const notices=[{title:"Новое задание по алгебре",copy:"Практика по квадратным уравнениям уже в дневнике.",time:"Сегодня · 09:00",read:false,view:"journal"},{title:"Встреча клуба идей",copy:"Подготовь одно маленькое открытие, которым хочется поделиться.",time:"Сегодня · 10:20",read:false,view:"community"}];
  let noticeFilter="new";
  function renderNotices(){const list=$("#notification-list");list.replaceChildren();const unread=notices.filter(n=>!n.read).length;$("[data-notice-count]").textContent=unread;$("[data-notice-count]").hidden=!unread;$("[data-notice-dot]").hidden=!unread;$("#read-all-notices").disabled=!unread;notices.filter(n=>n.read===(noticeFilter==="read")).forEach(n=>{const row=el("article","os-notification");const copy=el("div");copy.append(el("h2","",n.title),el("p","",n.copy),el("time","",n.time));row.append(icon("bell"),copy,button(n.read?"Открыть":"Прочитать","os-button os-button-secondary",()=>{if(n.read){navigate(n.view);}else{n.read=true;renderNotices();}}));list.append(row);});if(!list.children.length){const empty=el("div","os-empty");empty.append(icon("check"),el("h2","",noticeFilter==="new"?"Ты всё прочитал":"Здесь будут прочитанные уведомления"),el("p","",noticeFilter==="new"?"Ничего важного не осталось незамеченным.":"Новые сообщения находятся в соседней вкладке."));list.append(empty);}}
  $$("[data-notice-filter]").forEach(b=>b.addEventListener("click",()=>{noticeFilter=b.dataset.noticeFilter;$$("[data-notice-filter]").forEach(c=>c.setAttribute("aria-pressed",String(c===b)));renderNotices();}));
  $("#read-all-notices").addEventListener("click",()=>{notices.forEach(n=>{n.read=true;});renderNotices();});

  function aiReply(){const value=$("#os-idea").value.trim();if(!value)return;const lower=value.toLocaleLowerCase("ru");let prompts;
    if(/прилож|сайт|программ/.test(lower))prompts=["Кому именно поможет приложение?","Как эту задачу решают сейчас?","Как проверить идею простым макетом до разработки?"];
    else if(/теплиц|растени|датчик|робот/.test(lower))prompts=["Что ты хочешь измерять и почему?","Какое наблюдение поможет проверить гипотезу?","Как собрать безопасный простой прототип вместе с наставником?"];
    else if(/фестив|меропр|клуб/.test(lower))prompts=["Для кого ты хочешь провести встречу?","Что участники смогут попробовать или узнать?","Кого стоит пригласить в команду организаторов?"];
    else prompts=["Для кого важна эта идея?","Какую конкретную проблему она решает?","Как проверить предположение небольшим экспериментом?"];
    const answer=$("#os-ai-answer");answer.textContent="Попробуем посмотреть на идею внимательнее:\n\n"+prompts.map((p,i)=>(i+1)+". "+p).join("\n")+"\n\nНачни с одного вопроса и обсуди ответ с наставником.";answer.hidden=false;
  }
  $("#os-ai-form").addEventListener("submit",event=>{event.preventDefault();aiReply();});
  $$("[data-ai-prompt]").forEach(b=>b.addEventListener("click",()=>{$("#os-idea").value=b.dataset.aiPrompt;aiReply();}));
  let level=10;$("#level-next").addEventListener("click",()=>{level++;$("#level-number").textContent=level;$("#level-progress").value=0;$("#level-xp").textContent="0 / 1000 XP · новый этап";toast("Демо: открыт "+level+" уровень");});

  fillSubjects();renderCourses();renderDay();renderSchedule();renderChatList();renderChat();renderNotices();activateView(false);
})();
