"use strict";
document.addEventListener("DOMContentLoaded",function(){
  const menuButton=document.querySelector(".menu-toggle");
  const menu=document.querySelector(".mobile-nav");
  if(menuButton&&menu){
    menuButton.addEventListener("click",function(){
      const opened=menuButton.getAttribute("aria-expanded")==="true";
      menuButton.setAttribute("aria-expanded",String(!opened));
      menu.hidden=opened;
      menuButton.textContent=opened?"☰":"×";
    });
    menu.querySelectorAll("a").forEach(function(link){link.addEventListener("click",function(){menu.hidden=true;menuButton.setAttribute("aria-expanded","false");menuButton.textContent="☰";});});
  }

  function activateTab(buttons,panels,selection,tabAttr,panelAttr){
    buttons.forEach(function(button){
      const selected=button.getAttribute(tabAttr)===selection;
      button.setAttribute("aria-selected",String(selected));
      button.tabIndex=selected?0:-1;
    });
    panels.forEach(function(panel){panel.hidden=panel.getAttribute(panelAttr)!==selection;});
  }

  const tabs=Array.from(document.querySelectorAll("[data-tab]"));
  const panels=Array.from(document.querySelectorAll("[data-panel]"));
  tabs.forEach(function(tab,index){
    tab.addEventListener("click",function(){activateTab(tabs,panels,tab.dataset.tab,"data-tab","data-panel");});
    tab.addEventListener("keydown",function(e){
      if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;
      e.preventDefault();const delta=e.key==="ArrowRight"?1:-1;
      const next=tabs[(index+delta+tabs.length)%tabs.length];next.focus();next.click();
    });
  });

  // Flip the three school direction cards; click, Enter and Space work on native buttons.
  document.querySelectorAll(".track-flip").forEach(function(card){
    const title=card.querySelector(".track-title")?.textContent||"Направление";
    card.addEventListener("click",function(){
      const expanded=card.getAttribute("aria-pressed")==="true";
      card.setAttribute("aria-pressed",String(!expanded));
      card.setAttribute("aria-label",title+(expanded?". Нажмите, чтобы узнать подробнее":". Описание открыто. Нажмите, чтобы вернуться"));
    });
  });

  const demoTabs=Array.from(document.querySelectorAll("[data-demo-tab]"));
  const demoPanels=Array.from(document.querySelectorAll("[data-demo-panel]"));
  demoTabs.forEach(function(tab,index){
    tab.addEventListener("click",function(){activateTab(demoTabs,demoPanels,tab.dataset.demoTab,"data-demo-tab","data-demo-panel");});
    tab.addEventListener("keydown",function(e){
      if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;
      e.preventDefault();const next=demoTabs[(index+(e.key==="ArrowRight"?1:-1)+demoTabs.length)%demoTabs.length];next.focus();next.click();
    });
  });


  // Seven sample timetables in the Fiztekh OS demo; each weekday remembers its ticks locally.
  const demoWeek={
    mon:{name:"Понедельник",items:[["book","Математика","Повторить уравнения"],["chip","Информатика","Написать первую программу"],["mentor","План недели","Поставить три цели"]]},
    tue:{name:"Вторник",items:[["flask","Физика","Провести небольшой эксперимент"],["book","Русский язык","Подготовить письменный ответ"],["bulb","Мой проект","Найти проблему для исследования"]]},
    wed:{name:"Среда",items:[["book","Математика","Разобрать новую тему"],["bulb","Мой проект","Проверить три гипотезы"],["mentor","Наставник","Обсудить цели недели"]]},
    thu:{name:"Четверг",items:[["chip","Технологии","Создать простой прототип"],["users","Командная встреча","Распределить задачи"],["book","Английский язык","Подготовить рассказ о проекте"]]},
    fri:{name:"Пятница",items:[["rocket","Презентация идеи","Подготовить три слайда"],["target","Обратная связь","Показать идею наставнику"],["book","Повторение","Закрепить темы недели"]]},
    sat:{name:"Суббота",items:[["compass","Исследование","Посетить музей или лабораторию"],["users","Клуб создателей","Обсудить идеи с друзьями"],["bulb","Личный проект","Улучшить прототип"]]},
    sun:{name:"Воскресенье",items:[["book","Чтение","Прочитать интересную главу"],["heart","Время с семьёй","Поделиться открытиями недели"],["target","Планирование","Выбрать цель на понедельник"]]}
  };
  const demoWeekButtons=Array.from(document.querySelectorAll("[data-demo-day]"));
  const demoTaskList=document.getElementById("demo-task-list");
  const demoDayHeading=document.getElementById("demo-day-heading");
  const demoDial=document.getElementById("demo-dial");
  const demoProgressNumber=document.getElementById("demo-progress-number");
  if(demoWeekButtons.length&&demoTaskList&&demoDayHeading&&demoDial&&demoProgressNumber){
    const completedByDay={wed:[true,false,false]};
    let activeDemoDay="wed";
    function updateDemoProgress(){
      const completed=completedByDay[activeDemoDay]||[];
      const count=completed.filter(Boolean).length;
      const percent=Math.round(count/demoWeek[activeDemoDay].items.length*100);
      demoDial.style.setProperty("--percent",String(percent));
      demoProgressNumber.textContent=percent+"%";
    }
    function renderDemoDay(day){
      if(!Object.prototype.hasOwnProperty.call(demoWeek,day))return;
      activeDemoDay=day;
      const dayData=demoWeek[day];
      const completed=completedByDay[day]||(completedByDay[day]=dayData.items.map(function(){return false;}));
      demoWeekButtons.forEach(function(button){
        const active=button.dataset.demoDay===day;
        button.classList.toggle("is-day-active",active);
        button.setAttribute("aria-pressed",String(active));
      });
      demoDayHeading.textContent=dayData.name+" · учебный план";
      demoTaskList.replaceChildren();
      dayData.items.forEach(function(item,index){
        const label=document.createElement("label");
        label.className="demo-task demo-check-task";
        const check=document.createElement("input");
        check.type="checkbox";
        check.checked=Boolean(completed[index]);
        check.setAttribute("aria-label",item[1]+": "+item[2]);
        check.addEventListener("change",function(){completed[index]=check.checked;updateDemoProgress();});
        const glyph=document.createElement("span");
        glyph.className="demo-task-glyph";
        const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
        svg.setAttribute("class","brand-glyph");
        svg.setAttribute("aria-hidden","true");
        const use=document.createElementNS("http://www.w3.org/2000/svg","use");
        use.setAttribute("href","#ico-"+item[0]);
        svg.appendChild(use);
        glyph.appendChild(svg);
        const details=document.createElement("span");
        const title=document.createElement("b");
        title.textContent=item[1];
        const desc=document.createElement("small");
        desc.textContent=item[2];
        details.append(title,desc);
        const tick=document.createElement("span");
        tick.className="demo-task-check";
        tick.textContent="✓";
        tick.setAttribute("aria-hidden","true");
        label.append(check,glyph,details,tick);
        demoTaskList.appendChild(label);
      });
      updateDemoProgress();
    }
    demoWeekButtons.forEach(function(button){
      button.addEventListener("click",function(){renderDemoDay(button.dataset.demoDay);});
    });
    renderDemoDay(activeDemoDay);
  }

  // Gallery of school events (not a test).
  const eventTabs=Array.from(document.querySelectorAll("[data-event-tab]"));
  const eventPanels=Array.from(document.querySelectorAll("[data-event-panel]"));
  eventTabs.forEach(function(tab,index){
    tab.addEventListener("click",function(){
      activateTab(eventTabs,eventPanels,tab.dataset.eventTab,"data-event-tab","data-event-panel");
    });
    tab.addEventListener("keydown",function(e){
      if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;
      e.preventDefault();
      const direction=e.key==="ArrowRight"?1:-1;
      const next=eventTabs[(index+direction+eventTabs.length)%eventTabs.length];
      next.focus();next.click();
    });
  });

  // Lightweight progress indicator for long pages.
  const progressBar=document.getElementById("reading-progress-bar");
  if(progressBar){
    let scheduled=false;
    function updateReadingProgress(){
      const maxScroll=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
      const percent=Math.max(0,Math.min(100,(window.scrollY/maxScroll)*100));
      progressBar.style.width=percent.toFixed(2)+"%";
      scheduled=false;
    }
    window.addEventListener("scroll",function(){
      if(!scheduled){scheduled=true;requestAnimationFrame(updateReadingProgress);}
    },{passive:true});
    window.addEventListener("resize",updateReadingProgress,{passive:true});
    updateReadingProgress();
  }

  const aiForm=document.getElementById("demo-ai-form");
  const aiInput=document.getElementById("idea-input");
  const aiReply=document.getElementById("demo-reply");
  if(aiForm&&aiInput&&aiReply){
    aiForm.addEventListener("submit",function(e){
      e.preventDefault();
      const idea=aiInput.value.trim();if(!idea)return;
      aiReply.textContent="Интересная идея: «"+idea.slice(0,180)+"». Начни с исследования: кто сталкивается с этой проблемой? Как ты можешь задать пяти людям вопросы о сложности, не предлагая им пока готовое решение?";
      aiReply.hidden=false;
    });
  }

  const interestForm=document.getElementById("interest-form");
  const interestResult=document.getElementById("interest-result");
  const interestPreview=document.getElementById("interest-preview");
  const formStatus=document.getElementById("form-status");
  let generatedText="";
  if(interestForm&&interestResult&&interestPreview&&formStatus){
    interestForm.addEventListener("submit",function(e){
      e.preventDefault();
      if(!interestForm.reportValidity())return;
      const form=new FormData(interestForm);
      generatedText=[
        "Обращение по проекту «Физтех Онлайн»",
        "Имя: "+String(form.get("name")||"").trim(),
        "Статус: "+String(form.get("role")||""),
        "Класс: "+String(form.get("grade")||""),
        "Комментарий: "+String(form.get("comment")||"").trim()
      ].join("\n");
      interestPreview.textContent=generatedText;
      interestResult.hidden=false;
      formStatus.textContent="Текст подготовлен. Он не отправлен организаторам и не сохранён на сервере.";
    });
  }
  const copyButton=document.getElementById("copy-interest");
  if(copyButton&&formStatus){
    copyButton.addEventListener("click",async function(){
      if(!generatedText)return;
      try{await navigator.clipboard.writeText(generatedText);formStatus.textContent="Текст скопирован. Для отправки потребуется контакт организаторов проекта.";}
      catch(e){formStatus.textContent="Выдели текст обращения и скопируй его вручную.";}
    });
  }

  // Progressive-enhancement animations. Content stays visible if JS is disabled.
  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!reduceMotion&&"IntersectionObserver" in window){
    document.querySelectorAll(".feature-grid .card,.tracks-grid .card,.mentor-grid .card,.project-grid .card,.patron-directions .card,.donor-grid .card,.roadmap-grid article,.event-showcase,.faq-list details").forEach(function(element){
      element.classList.add("reveal");
    });
    const observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target);}
      });
    },{threshold:0.04,rootMargin:"0px 0px -20px 0px"});
    document.querySelectorAll(".reveal").forEach(function(element){
      if(element.getBoundingClientRect().top<window.innerHeight*0.85){element.classList.add("visible");}
      else{observer.observe(element);}
    });
    document.documentElement.classList.add("js-motion");
  }


  // Two short hero messages rotate together every 1.5 seconds.
  const topHeroLabel=document.getElementById("hero-label-top");
  const bottomHeroLabel=document.getElementById("hero-label-bottom");
  if(topHeroLabel&&bottomHeroLabel){
    const phrases=[
      ["✦ ИИ + наставник","↗ Идея → проект"],
      ["✦ Среда развития","↗ Интерес → навык"],
      ["✦ Меценатство","↗ Возможность → успех"],
      ["✦ Сильное сообщество","↗ Команда → результат"],
      ["✦ Проекты и практика","↗ Знания → действие"]
    ];
    const labels=[topHeroLabel,bottomHeroLabel];
    const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let phraseIndex=0;
    window.setInterval(function(){
      const nextIndex=(phraseIndex+1)%phrases.length;
      if(!reducedMotion){labels.forEach(function(label){label.classList.add("is-changing");});}
      window.setTimeout(function(){
        phraseIndex=nextIndex;
        labels[0].textContent=phrases[phraseIndex][0];
        labels[1].textContent=phrases[phraseIndex][1];
        labels.forEach(function(label){label.classList.remove("is-changing");});
      },reducedMotion?0:280);
    },1500);
  }

  // Orbit around the logo without rotating the cards: labels stay horizontal.
  const badgeOrbitOne=document.querySelector(".badge-orbit-one");
  const badgeOrbitTwo=document.querySelector(".badge-orbit-two");
  if(badgeOrbitOne&&badgeOrbitTwo){
    const motionOff=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const heroVisual=document.querySelector(".hero-visual");
    function orbitRadius(){
      return window.innerWidth<=440?116:window.innerWidth<=760?150:195;
    }
    function placeOrbit(angle){
      const radius=orbitRadius();
      [badgeOrbitOne,badgeOrbitTwo].forEach(function(badge,index){
        const a=angle+index*Math.PI;
        const x=Math.cos(a)*radius;
        const y=Math.sin(a)*radius;
        badge.style.transform="translate("+x.toFixed(2)+"px,"+y.toFixed(2)+"px)";
      });
    }
    // Start opposite each other, to the top right and bottom left.
    placeOrbit(-Math.PI/4);
    if(!motionOff){
      const revolutionMs=24000;
      let active=true,elapsed=0,lastTimestamp=null,rafId=0;
      if("IntersectionObserver" in window&&heroVisual){
        const watch=new IntersectionObserver(function(entries){
          active=entries[0].isIntersecting;
          if(!active)lastTimestamp=null;
        },{threshold:0});
        watch.observe(heroVisual);
      }
      function orbitFrame(timestamp){
        if(active&&!document.hidden){
          if(lastTimestamp!==null)elapsed+=(timestamp-lastTimestamp);
          placeOrbit(-Math.PI/4+elapsed/revolutionMs*Math.PI*2);
          lastTimestamp=timestamp;
        }else{lastTimestamp=null;}
        rafId=requestAnimationFrame(orbitFrame);
      }
      rafId=requestAnimationFrame(orbitFrame);
    }
    window.addEventListener("resize",function(){
      if(motionOff)placeOrbit(-Math.PI/4);
    },{passive:true});
  }

  // Interactive depth on desktop cards; small perspective angles preserve readability.
  if(!reduceMotion&&window.matchMedia("(hover:hover) and (pointer:fine)").matches){
    const cards=document.querySelectorAll(".project-grid .project-card,.feature-grid .card,.mentor-grid .card,.tracks-grid .card,.patron-directions .card,.donor-grid .card");
    cards.forEach(function(card){
      card.classList.add("tilt-3d");
      let raf=0;
      let pointerX=0,pointerY=0;
      card.addEventListener("pointermove",function(e){
        if(e.pointerType==="touch")return;
        const rect=card.getBoundingClientRect();
        pointerX=(e.clientX-rect.left)/rect.width;
        pointerY=(e.clientY-rect.top)/rect.height;
        if(raf)return;
        raf=requestAnimationFrame(function(){
          const x=Math.max(-1,Math.min(1,(pointerX-.5)*2));
          const y=Math.max(-1,Math.min(1,(pointerY-.5)*2));
          card.style.setProperty("--card-rx",(-y*6).toFixed(1)+"deg");
          card.style.setProperty("--card-ry",(x*7).toFixed(1)+"deg");
          card.style.setProperty("--card-lift","-4px");
          card.style.setProperty("--shine-x",(pointerX*100).toFixed(1)+"%");
          card.style.setProperty("--shine-y",(pointerY*100).toFixed(1)+"%");
          raf=0;
        });
      },{passive:true});
      card.addEventListener("pointerleave",function(){
        if(raf){cancelAnimationFrame(raf);raf=0;}
        card.style.setProperty("--card-rx","0deg");
        card.style.setProperty("--card-ry","0deg");
        card.style.setProperty("--card-lift","0px");
      });
    });
  }

  // Gentle hero parallax for mouse/trackpad only.
  const hero=document.querySelector(".hero");
  const planet=document.querySelector(".planet");
  if(hero&&planet&&!reduceMotion&&window.matchMedia("(hover: hover) and (pointer: fine)").matches){
    let frame=0;
    hero.addEventListener("pointermove",function(event){
      if(frame)return;
      const rect=hero.getBoundingClientRect();
      const x=((event.clientX-rect.left)/rect.width-.5)*14;
      const y=((event.clientY-rect.top)/rect.height-.5)*14;
      frame=requestAnimationFrame(function(){
        planet.style.setProperty("--tilt-x",x.toFixed(1)+"px");
        planet.style.setProperty("--tilt-y",y.toFixed(1)+"px");
        planet.style.setProperty("--hero-rx",(-y*.65).toFixed(1)+"deg");
        planet.style.setProperty("--hero-ry",(x*.85).toFixed(1)+"deg");
        frame=0;
      });
    },{passive:true});
    hero.addEventListener("pointerleave",function(){
      planet.style.setProperty("--tilt-x","0px");
      planet.style.setProperty("--tilt-y","0px");
      planet.style.setProperty("--hero-rx","0deg");
      planet.style.setProperty("--hero-ry","0deg");
    });
  }
});