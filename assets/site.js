(() => {
  'use strict';
  const storageKey = 'yamashita-v7-treatment-expanded';
  const navButton = document.querySelector('.menu-btn');
  const drawer = document.getElementById('siteDrawer');
  const scrim = document.getElementById('drawerScrim');
  const closeBtn = document.querySelector('.drawer-close');
  const accordion = document.querySelector('.drawer-accordion-button');
  const submenu = document.getElementById('medicalLinks');
  let lastFocus = null;
  const getSaved = () => {try {return localStorage.getItem(storageKey)==='true'} catch(e){return false}};
  const setSaved = value => {try {localStorage.setItem(storageKey,String(value))}catch(e){}};
  const setAccordion = (expanded,save=false) => {
    if(!accordion || !submenu)return;
    accordion.setAttribute('aria-expanded', String(expanded));
    submenu.classList.toggle('is-open',expanded);
    if(save)setSaved(expanded);
  };
  setAccordion(getSaved());
  if(drawer) drawer.inert = true;
  accordion?.addEventListener('click',()=>{
    const expanding=accordion.getAttribute('aria-expanded')!=='true';
    setAccordion(expanding,true);
    if(expanding && drawer){
      // Keep the expanded section header and first choices in view inside the side sheet.
      requestAnimationFrame(()=>{
        const target=drawer.scrollTop+accordion.getBoundingClientRect().top-drawer.getBoundingClientRect().top-14;
        drawer.scrollTo({top:Math.max(0,target),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      });
    }
  });
  function setDrawer(open) {
    if (!drawer || !scrim || !navButton) return;
    drawer.classList.toggle('is-open',open);
    scrim.classList.toggle('is-open',open);
    navButton.classList.toggle('is-active',open);
    navButton.setAttribute('aria-expanded', String(open));
    navButton.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');
    drawer.setAttribute('aria-hidden',String(!open));
    drawer.inert = !open;
    scrim.setAttribute('aria-hidden',String(!open));
    document.body.classList.toggle('menu-open',open);
    if(open){lastFocus=document.activeElement;setAccordion(getSaved());closeBtn?.focus()}
    else if(lastFocus && document.contains(lastFocus))lastFocus.focus();
  }
  navButton?.addEventListener('click',()=>setDrawer(!drawer.classList.contains('is-open')));
  closeBtn?.addEventListener('click',()=>setDrawer(false));
  scrim?.addEventListener('click',()=>setDrawer(false));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && drawer?.classList.contains('is-open')){setDrawer(false);return}
    if(e.key==='Tab' && drawer?.classList.contains('is-open')) {
      const items=[...drawer.querySelectorAll('button,a')].filter(el=>el.getClientRects().length>0 && !el.disabled);
      const first=items[0],last=items[items.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus()}
    }
  });
  // Autoplay only. There are intentionally no manual controls or dots.
  const slides=[...document.querySelectorAll('.hero-slide')];
  if(slides.length>1){
    let active=0;
    // Do not animate for visitors who request reduced motion.
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      setInterval(()=>{
        if(document.hidden)return;
        slides[active].classList.remove('is-current');
        slides[active].setAttribute('aria-hidden','true');
        active=(active+1)%slides.length;
        slides[active].classList.add('is-current');
        slides[active].setAttribute('aria-hidden','false');
      },6500);
    }
  }
  // Station-to-clinic photo gallery: fullscreen view with previous, next and back/close controls.
  const routeLightbox=document.getElementById('routeLightbox');
  const routeCards=[...document.querySelectorAll('.route-zoom')];
  if(routeLightbox && routeCards.length){
    const large=routeLightbox.querySelector('#routeLightboxImage');
    const counter=routeLightbox.querySelector('#routeLightboxCounter');
    const caption=routeLightbox.querySelector('#routeLightboxCaption');
    const close=routeLightbox.querySelector('.route-lightbox-close');
    const prevButton=routeLightbox.querySelector('.route-lightbox-prev');
    const nextButton=routeLightbox.querySelector('.route-lightbox-next');
    let current=0, focusBefore=null, swipeX=null;
    const render=()=>{
      const origin=routeCards[current];
      const thumb=origin.querySelector('img');
      large.src=thumb.currentSrc || thumb.src;
      large.alt=thumb.alt;
      caption.textContent=origin.closest('figure')?.querySelector('figcaption')?.innerText || thumb.alt;
      counter.textContent=`${current+1} / ${routeCards.length}`;
      // A 12-step route has a definite start and end, never wrap around.
      if(prevButton)prevButton.disabled=current===0;
      if(nextButton)nextButton.disabled=current===routeCards.length-1;
    };
    const goto=index=>{
      current=Math.max(0,Math.min(routeCards.length-1,index));
      render();
    };
    routeCards.forEach((button,index)=>button.addEventListener('click',()=>{
      current=index;focusBefore=button;render();routeLightbox.showModal();
      document.body.classList.add('lightbox-open');close?.focus();
    }));
    close?.addEventListener('click',()=>routeLightbox.close());
    prevButton?.addEventListener('click',()=>goto(current-1));
    nextButton?.addEventListener('click',()=>goto(current+1));
    routeLightbox.addEventListener('close',()=>{document.body.classList.remove('lightbox-open');focusBefore?.focus()});
    routeLightbox.addEventListener('click',event=>{if(event.target===routeLightbox)routeLightbox.close()});
    document.addEventListener('keydown',event=>{
      if(!routeLightbox.open)return;
      if(event.key==='ArrowRight'){event.preventDefault();goto(current+1)}
      if(event.key==='ArrowLeft'){event.preventDefault();goto(current-1)}
    });
    large.addEventListener('touchstart',event=>{swipeX=event.changedTouches[0]?.screenX ?? null},{passive:true});
    large.addEventListener('touchend',event=>{
      if(swipeX===null)return;
      const diff=(event.changedTouches[0]?.screenX ?? swipeX)-swipeX;
      if(Math.abs(diff)>55)goto(current+(diff<0?1:-1));
      swipeX=null;
    },{passive:true});
  }
  // All live date/time labels follow the clinic's timezone (JST), not the visitor's timezone.
  const tokyoDateTime = () => {
    const parts = new Intl.DateTimeFormat('ja-JP',{
      timeZone:'Asia/Tokyo',year:'numeric',month:'numeric',day:'numeric',
      weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date());
    const data=Object.fromEntries(parts.filter(v=>v.type!=='literal').map(v=>[v.type,v.value]));
    return {
      year:Number(data.year),month:Number(data.month),day:Number(data.day),
      weekday:data.weekday,hour:Number(data.hour),minute:Number(data.minute)
    };
  };
  const pad2 = n => String(n).padStart(2,'0');
  const dateKey = (year,month,day) => `${year}-${pad2(month)}-${pad2(day)}`;
  // Japanese public holidays through the ordinary annual rules (valid for 2026+).
  // Vernal/autumnal equinox dates are arithmetic forecasts, not government bulletins;
  // unusual schedule changes must still be added to calendar-dates.js.
  const holidayCache=new Map();
  const holidayMapForYear = year => {
    if(holidayCache.has(year))return holidayCache.get(year);
    const days=new Map();
    const add=(m,d,name)=>days.set(dateKey(year,m,d),name);
    const nthMonday=(m,n)=>{
      const first=new Date(Date.UTC(year,m-1,1)).getUTCDay();
      return 1+(8-first)%7+(n-1)*7;
    };
    add(1,1,'元日');add(1,nthMonday(1,2),'成人の日');
    add(2,11,'建国記念の日');add(2,23,'天皇誕生日');
    add(3,Math.floor(20.8431+0.242194*(year-1980)-Math.floor((year-1980)/4)),'春分の日');
    add(4,29,'昭和の日');add(5,3,'憲法記念日');add(5,4,'みどりの日');add(5,5,'こどもの日');
    add(7,nthMonday(7,3),'海の日');add(8,11,'山の日');
    add(9,nthMonday(9,3),'敬老の日');
    add(9,Math.floor(23.2488+0.242194*(year-1980)-Math.floor((year-1980)/4)),'秋分の日');
    add(10,nthMonday(10,2),'スポーツの日');
    add(11,3,'文化の日');add(11,23,'勤労感謝の日');
    const count=Math.round((Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000);
    const keyAt=ordinal=>{
      const dt=new Date(Date.UTC(year,0,ordinal));
      return dateKey(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate());
    };
    // A weekday lying between two statutory holidays becomes a citizens' holiday.
    for(let i=2;i<count;i++){
      const k=keyAt(i);
      if(!days.has(k)&&days.has(keyAt(i-1))&&days.has(keyAt(i+1)))days.set(k,'国民の休日');
    }
    // Substitute holidays: the first following date that is not already a holiday.
    for(const [key,name] of [...days.entries()]){
      const [y,m,d]=key.split('-').map(Number);
      if(new Date(Date.UTC(y,m-1,d)).getUTCDay()!==0)continue;
      let next=new Date(Date.UTC(y,m-1,d+1));
      while(days.has(dateKey(next.getUTCFullYear(),next.getUTCMonth()+1,next.getUTCDate()))){
        next.setUTCDate(next.getUTCDate()+1);
      }
      if(next.getUTCFullYear()===year)days.set(dateKey(year,next.getUTCMonth()+1,next.getUTCDate()),'振替休日');
    }
    holidayCache.set(year,days);return days;
  };
  // Exact 2026/2027 holidays published by the Cabinet Office (including substitute days).
  const cabinetOfficeHolidays={"2026-01-01":"元日","2026-01-12":"成人の日","2026-02-11":"建国記念の日","2026-02-23":"天皇誕生日","2026-03-20":"春分の日","2026-04-29":"昭和の日","2026-05-03":"憲法記念日","2026-05-04":"みどりの日","2026-05-05":"こどもの日","2026-05-06":"振替休日","2026-07-20":"海の日","2026-08-11":"山の日","2026-09-21":"敬老の日","2026-09-22":"国民の休日","2026-09-23":"秋分の日","2026-10-12":"スポーツの日","2026-11-03":"文化の日","2026-11-23":"勤労感謝の日","2027-01-01":"元日","2027-01-11":"成人の日","2027-02-11":"建国記念の日","2027-02-23":"天皇誕生日","2027-03-21":"春分の日","2027-03-22":"振替休日","2027-04-29":"昭和の日","2027-05-03":"憲法記念日","2027-05-04":"みどりの日","2027-05-05":"こどもの日","2027-07-19":"海の日","2027-08-11":"山の日","2027-09-20":"敬老の日","2027-09-23":"秋分の日","2027-10-11":"スポーツの日","2027-11-03":"文化の日","2027-11-23":"勤労感謝の日"};
  const japanHoliday = key => (key.startsWith('2026-')||key.startsWith('2027-'))
    ? (cabinetOfficeHolidays[key] || '')
    : (holidayMapForYear(Number(key.slice(0,4))).get(key) || '');
  // Public content is generated only by the separately hosted, authenticated admin server.
  // The JS fallback also works when index.html is opened from a local folder.
  let publicData = window.YAMASHITA_PUBLIC_DATA || { calendar: [], announcements: [] };
  const verifiedOverrides = {};
  const overrideNotes = {};
  const eventLabels={
    closed:'休診日','am-closed':'午前休診','pm-closed':'午後休診',
    thyroid:'甲状腺外来 診察日（午前9:00～12:00 午後14:30～17:00）',
    early:'診療受付時間10:00まで',open:'臨時診療日'
  };
  const refreshOverrides = () => {
    Object.keys(verifiedOverrides).forEach(key=>delete verifiedOverrides[key]);
    Object.keys(overrideNotes).forEach(key=>delete overrideNotes[key]);
    (Array.isArray(publicData.calendar)?publicData.calendar:[]).forEach(item=>{
      if(!item || !/^\d{4}-\d{2}-\d{2}$/.test(item.date || ''))return;
      const [year,month,day]=item.date.split('-').map(Number);
      const utc=new Date(Date.UTC(year,month-1,day));
      if(utc.getUTCFullYear()!==year||utc.getUTCMonth()+1!==month||utc.getUTCDate()!==day)return;
      if(!Object.prototype.hasOwnProperty.call(eventLabels,item.kind))return;
      verifiedOverrides[item.date]=item.kind;
      overrideNotes[item.date]=String(item.note||'').slice(0,160);
    });
  };
  refreshOverrides();

  // Today's hours are calculated exclusively in Japan Standard Time, regardless of the visitor's locale.
  const clinicNowClock=document.getElementById('liveClinicClock');
  const clinicNowStatus=document.getElementById('liveClinicState');
  const clinicNowDetail=document.getElementById('liveClinicDetail');
  const clinicNowBox=document.querySelector('.hero-live');
  const formatClinicHour=minutes=>`${Math.floor(minutes/60)}:${pad2(minutes%60)}`;
  const renderClinicStatus=()=>{
    if(!clinicNowStatus||!clinicNowDetail)return;
    const t=tokyoDateTime();
    const key=dateKey(t.year,t.month,t.day);
    const weekday=new Date(Date.UTC(t.year,t.month-1,t.day)).getUTCDay();
    const mins=t.hour*60+t.minute;
    const override=verifiedOverrides[key];
    const holiday=japanHoliday(key);
    let headline='',detail='',inHours=false;
    const specialClosure=override==='closed';
    const regularClosure=!override && (weekday===0||weekday===4||!!holiday);
    if(specialClosure){
      headline='本日は臨時休診です';
      detail=overrideNotes[key] || '本日の診療はお休みです。';
    }else if(regularClosure){
      headline='本日は休診日です';
      detail=holiday?`${holiday}のため休診です。`:'木曜・日曜は休診です。';
    }else{
      const ordinaryDay=override==='open'||(weekday!==0&&weekday!==4&&!holiday);
      const morning=ordinaryDay && override!=='am-closed';
      const afternoon=ordinaryDay && (override==='open'||weekday!==6) && override!=='pm-closed';
      const thyroid=override==='thyroid';
      const early=override==='early';
      // An early-reception day changes the reception cutoff, not necessarily the doctor's finishing time.
      // Do not say that medical consultations have finished just because reception closed.
      if(early){
        if(mins<540){headline='本日の診療は9:00からです';detail='本日の診療受付は10:00までです。';}
        else if(mins<600){headline='ただいま診療時間内です';inHours=true;detail='本日の診療受付は10:00までです。';}
        else {headline='本日の診療受付は終了しました';detail='本日は診療受付時間が10:00までの日です。';}
      }else{
        const slots=[];
        if(morning)slots.push({start:540,end:720,name:'通常診療'});
        if(afternoon)slots.push({start:900,end:1080,name:'通常診療'});
        if(thyroid){
          slots.push({start:540,end:720,name:'甲状腺専門外来'});
          slots.push({start:870,end:1020,name:'甲状腺専門外来'});
        }
        slots.sort((a,b)=>a.start-b.start || a.end-b.end);
        const active=slots.some(slot=>mins>=slot.start&&mins<slot.end);
        const upcoming=slots.find(slot=>mins<slot.start);
        const first=slots[0];
        if(active){
          headline='ただいま診療時間内です';inHours=true;
          // After the thyroid clinic ends at 17:00, ordinary care may still run until 18:00.
          const thyroidActive=slots.some(slot=>slot.name==='甲状腺専門外来'&&mins>=slot.start&&mins<slot.end);
          detail=thyroidActive?'甲状腺専門外来：午前9:00～12:00／午後14:30～17:00（完全予約制）':`本日の診療時間：${morning?'9:00～12:00':''}${morning&&afternoon?'／':''}${afternoon?'15:00～18:00':''}`;
        }else if(upcoming){
          if(first && mins<first.start){
            headline=`本日の診療は${formatClinicHour(first.start)}からです`;
            detail=thyroid?'甲状腺専門外来は完全予約制です。':'受付は診療開始の30分前から行っています。';
          }else{
            headline='午前の診療は終了しました';
            detail=`午後の診療は${formatClinicHour(upcoming.start)}からです。`;
          }
        }else if(first){
          headline='本日の診療は終了しました';
          detail=weekday===6?'土曜の診療は午前のみです。':'次回の診療日はカレンダーをご確認ください。';
        }else{
          // An exception can remove every session, even on a normally open day.
          headline='本日は休診日です';
          detail='登録された診療予定をご確認ください。';
        }
      }
    }
    if(clinicNowClock)clinicNowClock.textContent=`${t.month}月${t.day}日（${t.weekday}）${pad2(t.hour)}:${pad2(t.minute)} JST`;
    (document.getElementById('liveClinicStateText')||clinicNowStatus).textContent=headline;
    clinicNowDetail.textContent=detail;
    clinicNowBox?.classList.toggle('is-hours',inHours);
    clinicNowBox?.classList.toggle('is-off',!inHours);
  };
  // Update exactly when the published clinic hours change, without reloading the page.
  // The offset is fixed: Japan Standard Time does not observe daylight saving time.
  // Midnight matters too: the day's closures and public holidays can change then.
  const JST_OFFSET_MS=9*60*60*1000;
  const DAY_MS=24*60*60*1000;
  const clinicStatusBoundaryMinutes=[0,540,600,720,870,900,1020,1080];
  let clinicBoundaryTimer=null;
  const millisecondsToNextStatusChange=()=>{
    const millisAfterJstMidnight=((Date.now()+JST_OFFSET_MS)%DAY_MS+DAY_MS)%DAY_MS;
    const next=clinicStatusBoundaryMinutes
      .map(minutes=>minutes*60*1000)
      .find(at=>at>millisAfterJstMidnight);
    // A small margin ensures we cross the boundary before recomputing the status.
    return Math.max(100,(next===undefined?DAY_MS:next)-millisAfterJstMidnight+150);
  };
  const scheduleNextStatusChange=()=>{
    if(!clinicNowStatus)return;
    clearTimeout(clinicBoundaryTimer);
    clinicBoundaryTimer=setTimeout(()=>{
      renderClinicStatus();
      scheduleNextStatusChange();
    },millisecondsToNextStatusChange());
  };
  const refreshClinicStatus=()=>{
    renderClinicStatus();
    scheduleNextStatusChange();
  };
  if(clinicNowStatus){
    refreshClinicStatus();
    // Backup for device clock corrections or a timer delayed by browser sleep.
    setInterval(refreshClinicStatus,60000);
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)refreshClinicStatus();
    });
    window.addEventListener('focus',refreshClinicStatus);
    window.addEventListener('pageshow',refreshClinicStatus);
  }
  // Both calendars are rebuilt at Japanese-month boundaries or on a publication refresh.
  const calendars=document.getElementById('clinicCalendars');
  let renderedCalendarMonth='';
  const renderClinicCalendars=()=>{
    if(!calendars)return;
    const names=['日','月','火','水','木','金','土'];
    const t=tokyoDateTime();
    renderedCalendarMonth=`${t.year}-${pad2(t.month)}`;
    calendars.replaceChildren();
    const kinds={closed:'休診', 'am-closed':'午前休診','pm-closed':'午後休診',thyroid:'甲状腺',early:'10時まで',open:'臨時診療'};
    for(let offset=0;offset<2;offset++){
      const first=new Date(Date.UTC(t.year,t.month-1+offset,1));
      const y=first.getUTCFullYear(),m=first.getUTCMonth()+1,days=new Date(Date.UTC(y,m,0)).getUTCDate();
      const card=document.createElement('div');card.className='calendar-card';
      const heading=document.createElement('h3');heading.textContent=`${y}年 ${m}月`;card.append(heading);
      const table=document.createElement('table');table.className='calendar-table';
      const thead=document.createElement('thead');const hr=document.createElement('tr');
      names.forEach(name=>{const th=document.createElement('th');th.scope='col';th.textContent=name;hr.append(th)});
      thead.append(hr);table.append(thead);
      const tbody=document.createElement('tbody');let tr=document.createElement('tr'),count=0;
      const empty=()=>{const td=document.createElement('td');td.className='calendar-empty';td.setAttribute('aria-hidden','true');tr.append(td);count++};
      for(let i=0;i<first.getUTCDay();i++)empty();
      for(let d=1;d<=days;d++){
        const key=dateKey(y,m,d),weekday=new Date(Date.UTC(y,m-1,d)).getUTCDay();
        const holiday=japanHoliday(key);
        let kind='',title='通常診療日';
        if(weekday===0||weekday===4){kind='closed';title='休診日'}
        else if(weekday===6){kind='pm-closed';title='午後休診'}
        if(holiday){kind='closed';title=`休診日（${holiday}）`}
        if(verifiedOverrides[key]){kind=verifiedOverrides[key];title=eventLabels[kind]||'特別日程'}
        if(overrideNotes[key])title+=`：${overrideNotes[key]}`;
        const td=document.createElement('td');td.className=[kind,(t.year===y&&t.month===m&&t.day===d)?'today':''].join(' ').trim();
        td.dataset.date=key;td.title=title;td.setAttribute('aria-label',`${m}月${d}日 ${title}`);
        const n=document.createElement('span');n.className='cal-day';n.textContent=d;td.append(n);
        if(kinds[kind]){const b=document.createElement('span');b.className='cal-note';b.textContent=kinds[kind];td.append(b)}
        tr.append(td);count++;
        if(count%7===0){tbody.append(tr);tr=document.createElement('tr')}
      }
      while(count%7!==0)empty();
      if(tr.childElementCount)tbody.append(tr);
      table.append(tbody);card.append(table);calendars.append(card);
    }
  };
  renderClinicCalendars();
  const updateCalendarDay=()=>{
    const t=tokyoDateTime();
    if(`${t.year}-${pad2(t.month)}`!==renderedCalendarMonth){renderClinicCalendars();return}
    const key=dateKey(t.year,t.month,t.day);
    calendars?.querySelectorAll('td.today').forEach(el=>el.classList.remove('today'));
    calendars?.querySelector(`td[data-date="${key}"]`)?.classList.add('today');
  };
  if(calendars)setInterval(updateCalendarDay,60000);

  // Announcements are plain text edited by clinic staff and published as a separate data file.
  // Never assign editable fields as innerHTML; use textContent to prevent XSS.
  const currentAnnouncements=()=>{
    const all=Array.isArray(publicData.announcements)?publicData.announcements:[];
    return all.filter(v=>v && v.published===true && /^[-a-zA-Z0-9]{1,60}$/.test(String(v.id||'')))
      .sort((a,b)=>(Number(!!b.pinned)-Number(!!a.pinned))||String(b.date||'').localeCompare(String(a.date||'')));
  };
  const appendAnnouncement=(list,item)=>{
    const li=document.createElement('li'),a=document.createElement('a');
    a.href=`announcement.html?id=${encodeURIComponent(item.id)}`;
    const time=document.createElement('time');time.className='news-date';
    time.dateTime=item.date;time.textContent=String(item.date).replace(/-/g,'/');
    const name=document.createElement('span');name.className='news-title';name.textContent=item.title;
    a.append(time,name);li.append(a);list.append(li);
  };
  const renderAnnouncements=()=>{
    const posts=currentAnnouncements();
    for(const id of ['publishedHomeNews','publishedAllNews']){
      const ul=document.getElementById(id);if(!ul)continue;
      ul.replaceChildren();
      const subset=id==='publishedHomeNews'?posts.slice(0,5):posts;
      if(!subset.length){const li=document.createElement('li');li.className='news-empty';li.textContent='現在、お知らせはありません。';ul.append(li)}
      else subset.forEach(item=>appendAnnouncement(ul,item));
    }
    const article=document.getElementById('publishedArticle');
    if(article){
      article.replaceChildren();
      const key=new URLSearchParams(location.search).get('id');
      const entry=posts.find(item=>item.id===key);
      const h=document.querySelector('.subhero h1');
      if(!entry){article.textContent='指定されたお知らせは見つからないか、現在公開されていません。';if(h)h.textContent='お知らせ'}
      else{
        if(h)h.textContent=entry.title;
        document.title=`${entry.title} | やましたクリニック`;
        const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=`お知らせ｜${entry.date}`;
        const time=document.createElement('time');time.className='article-date';time.dateTime=entry.date;time.textContent=String(entry.date).replace(/-/g,'/');article.append(time);
        String(entry.body||'').split(/\n\s*\n/).filter(Boolean).forEach(block=>{
          const p=document.createElement('p');p.textContent=block.trim();article.append(p);
        });
        // Assets are owner-supplied and restricted to local image paths / official PDF URLs.
        if(Array.isArray(entry.media) && entry.media.length){
          const h=document.createElement('h2');h.className='article-media-heading';h.textContent='接種料金・助成のご案内';article.append(h);
          const p=document.createElement('p');p.className='article-media-intro';p.textContent='接種期間や対象者、料金は案内画像をご確認ください。';article.append(p);
          const gallery=document.createElement('div');gallery.className='vaccine-media-grid';
          for(const item of entry.media.slice(0,12)){
            const path=String(item.src||'');
            if(!/^assets\/images\/news\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/.test(path))continue;
            const figure=document.createElement('figure');figure.className='vaccine-poster';
            const img=document.createElement('img');img.src=path;img.alt=String(item.alt||'案内画像').slice(0,140);img.loading='lazy';img.decoding='async';
            figure.append(img);
            const caption=document.createElement('figcaption');caption.textContent=String(item.caption||'').slice(0,180);figure.append(caption);
            gallery.append(figure);
          }
          article.append(gallery);
        }
        if(Array.isArray(entry.documents) && entry.documents.length){
          const h=document.createElement('h2');h.className='article-media-heading';h.textContent='接種説明・予診票';article.append(h);
          const list=document.createElement('ul');list.className='article-document-list';
          for(const doc of entry.documents.slice(0,8)){
            const href=String(doc.href||'');
            if(!/^https:\/\/www\.yamashita-cl\.com\/wp-content\/uploads\/[a-zA-Z0-9_.-]+\.pdf$/.test(href))continue;
            const li=document.createElement('li'),a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=String(doc.text||'PDF資料').slice(0,150);
            li.append(a);list.append(li);
          }
          article.append(list);
          const note=document.createElement('p');note.className='article-pdf-note';note.textContent='PDFは公式サイトの資料が新しいタブで開きます。';article.append(note);
        }
        if(h){
          const isVaccine=entry.id==='legacy-555';
          h.classList.toggle('vaccine-long-title',isVaccine);
          if(isVaccine){
            h.replaceChildren();
            ['インフルエンザワクチン、','コロナワクチンの','予防接種について'].forEach((phrase,i)=>{
              if(i)h.append(document.createElement('wbr'));
              const span=document.createElement('span');span.className='title-phrase';span.textContent=phrase;h.append(span);
            });
          }
        }

      }
    }
  };
  const applyPublicData=data=>{
    if(!data || !Array.isArray(data.calendar) || !Array.isArray(data.announcements))return;
    publicData=data;refreshOverrides();renderClinicCalendars();renderClinicStatus();renderAnnouncements();
  };
  renderAnnouncements();
  // Reconcile the published schedule every minute, also when the tab becomes active again.
  // No visitor timezone is used: clinicNowClock and all calendar calculations remain JST.
  if(location.protocol==='http:'||location.protocol==='https:'){
    let publicationFetchInFlight=false;
    let lastPublicationText='';
    const pullPublication=async()=>{
      if(publicationFetchInFlight || document.hidden)return;
      publicationFetchInFlight=true;
      try{
        const response=await fetch('data/public-content.json',{cache:'no-store',credentials:'same-origin'});
        if(!response.ok)throw new Error('publication unavailable');
        const text=await response.text();
        if(text!==lastPublicationText){
          const parsed=JSON.parse(text);
          if(parsed && Array.isArray(parsed.calendar) && Array.isArray(parsed.announcements)){
            applyPublicData(parsed);lastPublicationText=text;
          }
        }
      }catch(_error){/* Keep the bundled publication when offline. */}
      finally{publicationFetchInFlight=false;}
    };
    pullPublication();
    setInterval(pullPublication,60000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)pullPublication();});
    window.addEventListener('online',pullPublication);
  }
  // Browser-level restrictions can deter casual copying but cannot protect source assets absolutely.
  document.addEventListener('contextmenu',e=>{if(!e.target.closest('input,textarea,select')) e.preventDefault()});
  document.addEventListener('dragstart',e=>{if(e.target.closest('img'))e.preventDefault()});
  document.addEventListener('copy',e=>{if(!e.target.closest('input,textarea,select'))e.preventDefault()});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey) && ['s','u','p'].includes(e.key.toLowerCase()))e.preventDefault()});
})();
