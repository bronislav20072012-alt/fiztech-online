"use strict";
document.addEventListener("DOMContentLoaded",function(){
  // External event listeners keep image fallbacks compatible with a strict CSP.
  function prepareLogo(image,loadedClass,fallback){
    let fallbackAttempted=false;
    function loaded(){image.parentElement.classList.add(loadedClass);}
    function failed(){
      image.parentElement.classList.remove(loadedClass);
      if(fallback&&!fallbackAttempted){
        fallbackAttempted=true;
        image.src=fallback;
      }
    }
    image.addEventListener("load",loaded);
    image.addEventListener("error",failed);
    if(image.complete){if(image.naturalWidth>0)loaded();else failed();}
  }
  document.querySelectorAll(".logo-full-image").forEach(function(image){prepareLogo(image,"logo-image-loaded");});
  document.querySelectorAll(".planet-logo").forEach(function(image){prepareLogo(image,"has-logo","assets/ft-symbol.svg");});

  // Keep mobile autoplay refusals retryable and allow an explicit motion preference.
  const headerVideo=document.querySelector("[data-header-video]");
  if(headerVideo){
    const headerMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
    const headerConnection=navigator.connection;
    const headerControls=Array.from(document.querySelectorAll("[data-header-animation-toggle]"));
    let headerVideoFailed=false,headerPlaybackBlocked=false,headerHasPlayed=false,headerPlayPending=false;
    let headerUserChoice=null,headerPlaybackVersion=0;
    headerVideo.muted=true;
    headerVideo.defaultMuted=true;
    headerVideo.autoplay=true;
    headerVideo.playsInline=true;
    headerVideo.setAttribute("webkit-playsinline","");
    function headerPlaybackAllowed(){
      return headerUserChoice===true||(headerUserChoice!==false&&!headerMotion.matches&&!(headerConnection&&headerConnection.saveData));
    }
    function updateHeaderControls(){
      const playing=headerHasPlayed&&!headerVideo.paused&&!headerVideo.ended;
      const action=playing?"Остановить анимацию":"Включить анимацию";
      headerControls.forEach(function(control){
        control.hidden=false;
        control.classList.toggle("is-playing",playing);
        control.setAttribute("aria-label",action+" в шапке");
        const label=control.querySelector("[data-header-animation-label]");
        if(label)label.textContent=action;
      });
    }
    function showHeaderPoster(){
      headerPlaybackVersion++;
      headerPlayPending=false;
      headerHasPlayed=false;
      headerPlaybackBlocked=false;
      headerVideo.pause();
      if(headerVideo.hasAttribute("src")){
        headerVideo.removeAttribute("src");
        headerVideo.load();
      }
      updateHeaderControls();
    }
    function headerPlaybackError(error,version){
      if(version!==headerPlaybackVersion||error.name==="AbortError")return;
      headerPlayPending=false;
      if(error.name==="NotAllowedError"){
        headerPlaybackBlocked=true;
        updateHeaderControls();
      }else{headerVideoFailed=true;showHeaderPoster();}
    }
    function updateHeaderVideo(fromGesture){
      if(headerVideoFailed||!headerPlaybackAllowed()){showHeaderPoster();return;}
      if(document.hidden){
        headerPlaybackVersion++;headerPlayPending=false;headerVideo.pause();updateHeaderControls();return;
      }
      if(headerPlaybackBlocked&&!fromGesture){updateHeaderControls();return;}
      if(!headerVideo.hasAttribute("src")){
        headerHasPlayed=false;
        headerVideo.src=headerVideo.dataset.videoSrc;
      }
      if(!fromGesture&&(headerVideo.readyState===0||headerPlayPending||(!headerVideo.paused&&headerHasPlayed))){updateHeaderControls();return;}
      headerPlaybackBlocked=false;headerPlayPending=true;
      const version=headerPlaybackVersion;
      let playback;
      try{playback=headerVideo.play();}catch(error){headerPlaybackError(error,version);return;}
      if(playback&&typeof playback.then==="function")playback.then(function(){
        if(version===headerPlaybackVersion){headerPlayPending=false;updateHeaderControls();}
      },function(error){headerPlaybackError(error,version);});
      else{headerPlayPending=false;updateHeaderControls();}
    }
    function resumeHeaderFromGesture(event){
      if(event.target instanceof Element&&event.target.closest("[data-header-animation-toggle]"))return;
      if(!headerVideoFailed&&headerPlaybackAllowed()&&(headerPlaybackBlocked||!headerHasPlayed||headerVideo.paused))updateHeaderVideo(true);
    }
    function updateHeaderPreference(){updateHeaderVideo(false);}
    headerControls.forEach(function(control){
      control.addEventListener("click",function(){
        headerUserChoice=!(headerHasPlayed&&!headerVideo.paused&&!headerVideo.ended);
        headerVideoFailed=false;headerPlaybackBlocked=false;
        updateHeaderVideo(true);
      });
    });
    headerVideo.addEventListener("playing",function(){
      if(!headerPlaybackAllowed()||headerVideoFailed){showHeaderPoster();return;}
      if(document.hidden){headerVideo.pause();updateHeaderControls();return;}
      headerHasPlayed=true;headerPlaybackBlocked=false;headerPlayPending=false;updateHeaderControls();
    });
    headerVideo.addEventListener("pause",updateHeaderControls);
    headerVideo.addEventListener("loadedmetadata",function(){updateHeaderVideo(false);});
    headerVideo.addEventListener("canplay",function(){updateHeaderVideo(false);});
    headerVideo.addEventListener("ended",function(){updateHeaderVideo(false);});
    headerVideo.addEventListener("error",function(){headerVideoFailed=true;showHeaderPoster();});
    document.addEventListener("click",resumeHeaderFromGesture,{passive:true});
    document.addEventListener("touchend",resumeHeaderFromGesture,{passive:true});
    document.addEventListener("keydown",resumeHeaderFromGesture);
    document.addEventListener("visibilitychange",function(){updateHeaderVideo(false);});
    window.addEventListener("pagehide",function(){headerPlaybackVersion++;headerPlayPending=false;headerVideo.pause();});
    window.addEventListener("pageshow",function(){updateHeaderVideo(false);});
    if(typeof headerMotion.addEventListener==="function")headerMotion.addEventListener("change",updateHeaderPreference);
    else if(typeof headerMotion.addListener==="function")headerMotion.addListener(updateHeaderPreference);
    if(headerConnection&&typeof headerConnection.addEventListener==="function")headerConnection.addEventListener("change",updateHeaderPreference);
    updateHeaderVideo(false);
  }

  const qrDialog=document.getElementById("social-qr-dialog");
  if(qrDialog&&typeof qrDialog.showModal==="function"){
    const qrMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
    let qrOpener=null,qrCloseTimer=0,qrBackdropPress=false;
    function outsideQR(event){
      const bounds=qrDialog.getBoundingClientRect();
      return event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom;
    }
    function closeQR(){
      if(!qrDialog.open||qrDialog.classList.contains("is-closing"))return;
      if(qrMotion.matches){qrDialog.close();return;}
      qrDialog.classList.add("is-closing");
      qrCloseTimer=window.setTimeout(function(){qrDialog.close();},180);
    }
    document.querySelectorAll("[data-open-social-qr]").forEach(function(button){
      button.hidden=false;
      button.addEventListener("click",function(){
        window.clearTimeout(qrCloseTimer);
        qrDialog.classList.remove("is-closing");
        qrOpener=button;
        document.documentElement.classList.add("social-qr-open");
        if(!qrDialog.open)qrDialog.showModal();
      });
    });
    qrDialog.querySelector("[data-close-social-qr]").addEventListener("click",closeQR);
    qrDialog.addEventListener("cancel",function(event){event.preventDefault();closeQR();});
    qrDialog.addEventListener("pointerdown",function(event){qrBackdropPress=outsideQR(event);});
    qrDialog.addEventListener("click",function(event){
      if(qrBackdropPress&&outsideQR(event))closeQR();
      qrBackdropPress=false;
    });
    qrDialog.addEventListener("close",function(){
      window.clearTimeout(qrCloseTimer);
      qrDialog.classList.remove("is-closing");
      document.documentElement.classList.remove("social-qr-open");
      qrBackdropPress=false;
      if(qrOpener)qrOpener.focus({preventScroll:true});
    });
  }
  const menuButton=document.querySelector(".menu-toggle");
  const menu=document.getElementById("mobile-navigation");
  if(menuButton&&menu){
    function setMenuOpen(open){
      menu.hidden=!open;
      menuButton.setAttribute("aria-expanded",String(open));
      menuButton.setAttribute("aria-label",open?"Закрыть меню":"Открыть меню");
      menuButton.classList.toggle("is-open",open);
    }
    menuButton.addEventListener("click",function(){
      setMenuOpen(menuButton.getAttribute("aria-expanded")!=="true");
    });
    menu.querySelectorAll("a").forEach(function(link){
      link.addEventListener("click",function(){setMenuOpen(false);});
    });
    document.addEventListener("pointerdown",function(event){
      if(!menu.hidden&&!menu.contains(event.target)&&!menuButton.contains(event.target))setMenuOpen(false);
    });
    document.addEventListener("keydown",function(event){
      if(event.key==="Escape"&&!menu.hidden){
        setMenuOpen(false);
        menuButton.focus();
      }
    });
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


  // Interactive sample planner for each day of the week, not an AI service.
  const demoWeek={
    mon:{name:"Понедельник",items:[["book","Уроки","Математика и информатика"],["bulb","Мой проект","Поставить цель на неделю"],["target","Развитие","Составить список полезных привычек"]]},
    tue:{name:"Вторник",items:[["book","Уроки","Русский язык и физика"],["flask","Мой проект","Провести первый эксперимент"],["compass","Развитие","Прочитать научную статью"]]},
    wed:{name:"Среда",items:[["book","Уроки","Математика и английский"],["bulb","Мой проект","Проверить три гипотезы"],["mentor","Развитие","Обсудить идеи с наставником"]]},
    thu:{name:"Четверг",items:[["book","Уроки","Физика и технология"],["chip","Мой проект","Создать простой прототип"],["users","Развитие","Провести командную встречу"]]},
    fri:{name:"Пятница",items:[["book","Уроки","Закрепить материал недели"],["rocket","Мой проект","Подготовить презентацию идеи"],["target","Развитие","Подвести итоги недели"]]},
    sat:{name:"Суббота",items:[["book","Уроки","Повторение по желанию"],["users","Мой проект","Встретиться с командой"],["compass","Развитие","Посетить интересное место"]]},
    sun:{name:"Воскресенье",items:[["book","Уроки","Лёгкое чтение"],["bulb","Мой проект","Записать новые идеи"],["heart","Развитие","Отдохнуть и спланировать неделю"]]}
  };
  const demoAlternativeTasks={
    mon:[["book","Уроки","Разобрать сложную тему"],["chip","Мой проект","Нарисовать схему будущего продукта"],["mentor","Развитие","Поговорить с наставником"]],
    tue:[["book","Уроки","Заняться самостоятельной практикой"],["bulb","Мой проект","Опросить будущих пользователей"],["target","Развитие","Потренировать навык презентации"]],
    wed:[["book","Уроки","Повторить пройденное"],["flask","Мой проект","Проверить идею на практике"],["compass","Развитие","Изучить новую технологию"]],
    thu:[["book","Уроки","Решить задачи по предметам"],["chip","Мой проект","Улучшить прототип"],["mentor","Развитие","Получить обратную связь"]],
    fri:[["book","Уроки","Закрыть учебные задачи"],["rocket","Мой проект","Показать результат команде"],["target","Развитие","Зафиксировать достижения"]],
    sat:[["book","Уроки","Почитать о науке"],["flask","Мой проект","Сделать домашний эксперимент"],["heart","Развитие","Погулять и восстановить силы"]],
    sun:[["book","Уроки","Подготовиться к новой неделе"],["bulb","Мой проект","Выбрать следующий шаг"],["compass","Развитие","Составить личный план"]]
  };
  const demoWeekButtons=Array.from(document.querySelectorAll("[data-demo-day]"));
  const demoTaskList=document.getElementById("demo-task-list");
  const demoDayHeading=document.getElementById("demo-day-heading");
  const demoDial=document.getElementById("demo-dial");
  const demoProgressNumber=document.getElementById("demo-progress-number");
  const createDemoPlan=document.getElementById("demo-create-plan");
  if(demoWeekButtons.length&&demoTaskList&&demoDayHeading&&demoDial&&demoProgressNumber){
    const completedByDay={wed:[true,false,false]};
    const planVersions={};
    let activeDemoDay="wed";
    function currentItems(day){return planVersions[day]?demoAlternativeTasks[day]:demoWeek[day].items;}
    function updateDemoProgress(){
      const completed=completedByDay[activeDemoDay]||[];
      const count=completed.filter(Boolean).length;
      const percent=Math.round(count/currentItems(activeDemoDay).length*100);
      demoDial.style.setProperty("--percent",String(percent));
      demoProgressNumber.textContent=percent+"%";
    }
    function renderDemoDay(day){
      if(!Object.prototype.hasOwnProperty.call(demoWeek,day))return;
      activeDemoDay=day;
      const items=currentItems(day);
      const completed=completedByDay[day]||(completedByDay[day]=items.map(function(){return false;}));
      demoWeekButtons.forEach(function(button){
        const active=button.dataset.demoDay===day;
        button.classList.toggle("is-day-active",active);
        button.setAttribute("aria-pressed",String(active));
      });
      demoDayHeading.textContent=demoWeek[day].name+" · план на день";
      demoTaskList.replaceChildren();
      items.forEach(function(item,index){
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
    if(createDemoPlan){
      createDemoPlan.addEventListener("click",function(){
        planVersions[activeDemoDay]=!planVersions[activeDemoDay];
        completedByDay[activeDemoDay]=[false,false,false];
        renderDemoDay(activeDemoDay);
        createDemoPlan.classList.remove("plan-created");
        void createDemoPlan.offsetWidth;
        createDemoPlan.classList.add("plan-created");
      });
    }
    renderDemoDay(activeDemoDay);
  }

  // Click the big level number to preview subsequent creator levels.
  const levelButton=document.getElementById("passport-next-level");
  const levelNumber=document.getElementById("passport-level-number");
  const nextNumber=document.getElementById("passport-next-number");
  const xpLabel=document.getElementById("passport-xp");
  const xpBar=document.getElementById("passport-level-fill");
  const levelProgress=document.getElementById("passport-level-progress");
  if(levelButton&&levelNumber&&nextNumber&&xpLabel&&xpBar&&levelProgress){
    let level=10;
    const progressValues=[68,34,51,76,42,85,27,63];
    function renderPassportLevel(){
      const percent=progressValues[(level-10)%progressValues.length];
      levelNumber.textContent=String(level);
      nextNumber.textContent=(level+1)+" уровень";
      xpLabel.textContent=(percent*10)+" / 1000 XP";
      levelProgress.setAttribute("aria-valuenow",String(percent));
      levelButton.setAttribute("aria-label","Уровень "+level+". Нажми, чтобы перейти на уровень "+(level+1));
      xpBar.style.width=percent+"%";
    }
    levelButton.addEventListener("click",function(){
      level+=1;
      renderPassportLevel();
    });
    renderPassportLevel();
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
  const formStatus=document.getElementById("form-status");
  document.querySelectorAll("[data-program-interest]").forEach(function(link){
    link.addEventListener("click",function(){
      const grade=document.getElementById("interest-grade");
      const comment=document.getElementById("interest-comment");
      if(grade)grade.value=link.dataset.programGrade;
      if(comment&&!comment.value.trim()){
        comment.value="Здравствуйте! Хочу узнать подробнее о программе «"+link.dataset.programInterest+"».";
      }
      if(formStatus)formStatus.textContent="Выбрана программа «"+link.dataset.programInterest+"». Укажите имя, почту для ответа и дополните сообщение своим вопросом.";
    });
  });
  if(interestForm&&formStatus){
    const contactSubmit=interestForm.querySelector('[type="submit"]');
    const nextPage=interestForm.querySelector('[name="_next"]');
    let contactSubmitting=false;
    if(nextPage)nextPage.value=new URL("contact-success.html",window.location.href).href;
    function resetContactSubmission(){
      contactSubmitting=false;
      interestForm.removeAttribute("aria-busy");
      if(contactSubmit){contactSubmit.disabled=false;contactSubmit.removeAttribute("aria-disabled");}
      if(formStatus.dataset.submitting==="true"){
        formStatus.textContent="";
        delete formStatus.dataset.submitting;
      }
    }
    window.addEventListener("pageshow",resetContactSubmission);
    interestForm.addEventListener("submit",function(event){
      if(contactSubmitting){event.preventDefault();return;}
      if(window.location.protocol!=="https:"){
        event.preventDefault();
        formStatus.textContent="Для отправки обращения откройте защищённую версию сайта: https://phystechonline.ru/";
        return;
      }
      ["interest-name","interest-email","interest-comment"].forEach(function(id){
        const input=document.getElementById(id);
        if(input)input.value=input.value.trim();
      });
      if(!interestForm.reportValidity()){event.preventDefault();return;}
      contactSubmitting=true;
      interestForm.setAttribute("aria-busy","true");
      if(contactSubmit){contactSubmit.disabled=true;contactSubmit.setAttribute("aria-disabled","true");}
      formStatus.dataset.submitting="true";
      formStatus.textContent="Отправляем обращение. При необходимости подтвердите отправку на странице проверки.";
      // Leave native submission intact so the provider can validate and deliver it.
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
      ["✦ ИИ + наставник","Идея → проект"],
      ["✦ Среда развития","Интерес → навык"],
      ["✦ Меценатство","Возможность → успех"],
      ["✦ Сильное сообщество","Команда → результат"],
      ["✦ Проекты и практика","Знания → действие"]
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
      const preferred=window.innerWidth<=440?116:window.innerWidth<=760?150:195;
      const halfLabel=window.innerWidth<=440?58:window.innerWidth<=760?72.5:95;
      const bounds=heroVisual.getBoundingClientRect();
      const center=bounds.left+bounds.width/2;
      return Math.max(0,Math.min(preferred,center-halfLabel-4,window.innerWidth-center-halfLabel-4));
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
