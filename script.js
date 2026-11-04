"use strict";
document.addEventListener("DOMContentLoaded",function(){
  // One deliberate screen-to-screen transition from the hero to "О школе".
  // Other page sections retain normal scrolling and direct anchor navigation.
  const chapterOverlay=document.getElementById("chapter-transition");
  const firstChapter=document.getElementById("top");
  const secondChapter=document.getElementById("about");
  const reducedChapterMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(chapterOverlay&&firstChapter&&secondChapter&&!reducedChapterMotion){
    let transitioning=false;
    let lastTransitionAt=-10000;
    function nearFirstScreen(){
      const heroBottom=firstChapter.getBoundingClientRect().bottom;
      return window.scrollY<Math.min(180,window.innerHeight*.3)&&heroBottom>window.innerHeight*.45;
    }
    function runChapterTransition(){
      if(transitioning||performance.now()-lastTransitionAt<2300||!nearFirstScreen())return false;
      transitioning=true;
      lastTransitionAt=performance.now();
      chapterOverlay.classList.remove("is-exiting");
      chapterOverlay.classList.add("is-active");
      chapterOverlay.setAttribute("aria-hidden","true");
      document.documentElement.classList.add("chapter-transition-running");
      window.setTimeout(function(){
        const headingOffset=secondChapter.getBoundingClientRect().top+window.scrollY-85;
        window.scrollTo({top:headingOffset,behavior:"smooth"});
        chapterOverlay.classList.add("is-exiting");
      },1450);
      window.setTimeout(function(){
        chapterOverlay.classList.remove("is-active","is-exiting");
        document.documentElement.classList.remove("chapter-transition-running");
        transitioning=false;
      },2350);
      return true;
    }
    window.addEventListener("wheel",function(event){
      if(transitioning){event.preventDefault();return;}
      if(event.deltaY>8&&nearFirstScreen()){
        if(runChapterTransition())event.preventDefault();
      }
    },{passive:false});
    window.addEventListener("keydown",function(event){
      if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.target.closest("input,textarea,select,button,a,[contenteditable]"))return;
      if((event.key==="PageDown"||event.key==="ArrowDown"||event.key===" ")&&nearFirstScreen()){
        if(runChapterTransition())event.preventDefault();
      }
    });
    let touchStartY=null;
    firstChapter.addEventListener("touchstart",function(e){
      if(e.touches.length===1)touchStartY=e.touches[0].clientY;
    },{passive:true});
    firstChapter.addEventListener("touchend",function(e){
      if(touchStartY===null||!e.changedTouches.length)return;
      const distance=touchStartY-e.changedTouches[0].clientY;
      touchStartY=null;
      if(distance>55&&nearFirstScreen())runChapterTransition();
    },{passive:true});
  }

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