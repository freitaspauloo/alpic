const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav nav');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'CLOSE −':'MENU +'});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='MENU +'}));
const dialog=document.querySelector('dialog');
document.querySelectorAll('[data-dialog]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#dialog-title').textContent=button.dataset.dialog;dialog.showModal()}));
document.querySelectorAll('.close,.close-dialog').forEach(button=>button.addEventListener('click',()=>dialog.close()));
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
document.querySelector('a[href="#pricing"]').addEventListener('click',event=>{event.preventDefault();document.querySelector('#dialog-title').textContent='Pricing';dialog.showModal()});

