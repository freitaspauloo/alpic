(() => {
  const section=document.querySelector('.manifesto');
  const heading=section.querySelector('h2');
  const note=section.querySelector('p');
  const text=heading.textContent.trim();
  heading.setAttribute('aria-label',text);
  const words=text.split(/\s+/).map(text=>{
    const word=document.createElement('span');
    word.className='reveal-word';word.textContent=text;
    word.setAttribute('aria-hidden','true');return word;
  });
  heading.replaceChildren(...words.flatMap((word,index)=>index?[' ',word]:[word]));
  const stage=document.createElement('div');stage.className='manifesto-stage';
  section.insertBefore(stage,note);stage.append(heading);
  // The readable static layout is the fallback if either local vendor file fails.
  if(!window.gsap||!window.ScrollTrigger)return;
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
    const timeline=gsap.timeline({scrollTrigger:{
      id:'manifesto-reveal',trigger:stage,start:'top top',
      end:()=>'+='+Math.round(Math.max(innerHeight*.85,540)),
      pin:true,pinSpacing:true,scrub:.3,anticipatePin:1,
      invalidateOnRefresh:true
    }});
    gsap.set(words,{color:'#ededed'});
    // Brief lead-in and hold keep the statement readable without delaying the next section.
    timeline.to({}, {duration:.08})
      .to(words,{color:'#000000',duration:.35,stagger:.085,ease:'none'})
      .to({}, {duration:.12});
  });
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
  if(document.readyState==='complete')ScrollTrigger.refresh();
  else addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
})();
