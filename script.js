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