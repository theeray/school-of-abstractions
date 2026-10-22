import {connect,node,friendly} from './client.mjs';
const $=id=>document.getElementById(id);let api,session,deadline=0,interval,busy=false,recorder,stream,recordTimeout,player,discardRecording=false;
const status=t=>$('status').textContent=t;
function syncConsent(){const save=$('log').checked;$('name-consent').disabled=!save;if(!save)$('name-consent').checked=false;$('name').disabled=!save||!$('name-consent').checked;if($('name').disabled)$('name').value='';}
$('log').onchange=syncConsent;$('name-consent').onchange=syncConsent;
function stopAudio(){discardRecording=true;clearTimeout(recordTimeout);if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());stream=null;player?.pause();player=null;}
function show(who,text){const block=node('article',undefined,who==='You'?'message user':'message');block.append(node('strong',who),node('p',text));$('messages').append(block);block.scrollIntoView({block:'nearest'});}
function tick(){if(!session)return;const seconds=Math.max(0,Math.ceil((deadline-performance.now())/1000));$('timer').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;if(seconds===0)end('Your five-minute session has ended. Thank you for exploring the work.');}
async function end(text='Your session has ended.'){
 const old=session;session=null;clearInterval(interval);stopAudio();$('composer').hidden=true;$('audio-choice').hidden=true;$('messages').replaceChildren();show('Saige',text);$('timer').textContent='0:00';
 if(old)try{await api.call('saigeEnd',{sessionToken:old.sessionToken});}catch{/* The server independently expires the session. */}
}
$('consent').onsubmit=async event=>{
 event.preventDefault();if(!api)return;$('start').disabled=true;
 try{session=await api.call('saigeStart',{processConsent:$('process').checked,logConsent:$('log').checked,nameConsent:$('name-consent').checked,firstName:$('name').value,noticeVersion:api.config.noticeVersion});
  deadline=performance.now()+Math.max(0,session.endsAt-session.serverNow);$('consent').hidden=true;$('conversation').hidden=false;
  if(session.deletionCode){const code=session.deletionCode;$('receipt').hidden=false;
   $('download-code').onclick=()=>{const b=new Blob([`Private Saige deletion code: ${code}\nUse the exhibition owner to request deletion, or the delete control while this tab remains open.\nDo not post this code publicly.\n`],{type:'text/plain'}),url=URL.createObjectURL(b),a=node('a');a.href=url;a.download='Saige-private-deletion-code.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
   $('forget').onclick=async()=>{try{await api.call('saigeForget',{deletionCode:code});$('receipt').hidden=true;status('Your saved review record was deleted. No further review entries will be added for this session.');}catch(e){status(friendly(e));}};
  }
  $('record').hidden=!api.config.microphone;$('audio-choice').hidden=!api.config.microphone;
  show('Saige','I’m Saige. Eric and I made School of Abstractions together. Ask about a figure, a reference, or a decision in the painting.');status(session.reviewSaved?'Private review logging is on, with your permission.':'No conversation review record will be saved by this app.');
  interval=setInterval(tick,500);tick();
 }catch(e){status(friendly(e));$('start').disabled=false;}
};
async function ask(input,label){
 if(!session||busy)return;busy=true;const current=session.sessionToken;$('send').disabled=true;$('record').disabled=true;show('You',label);
 try{const reply=await api.call('saigeTurn',{sessionToken:current,...input});
  if(!session||session.sessionToken!==current)return;
  deadline=performance.now()+Math.max(0,reply.endsAt-reply.serverNow);show('Saige',reply.answer);
  if(api.config.audioReplies&&/^[a-z-]+$/.test(reply.answerId)){
   player?.pause();player=new Audio(`./audio/${reply.answerId}.mp3`);
   try{await player.play();}catch{status('The approved reply is shown in text. Audio could not play.');}
  }
 }catch(e){status(friendly(e));}finally{busy=false;$('send').disabled=false;$('record').disabled=false;tick();}
}
$('composer').onsubmit=event=>{event.preventDefault();const q=$('question').value.trim();if(!q||!session)return;$('question').value='';ask({question:q},q);};
$('end').onclick=()=>end();
$('record').onclick=async()=>{
 if(recorder?.state==='recording'){recorder.stop();return;}
 if(!session||busy)return;if(!$('audio-consent').checked){status('Accept optional microphone processing first, or type your question.');return;}
 try{
  player?.pause();stream=await navigator.mediaDevices.getUserMedia({audio:true});
  if(!session){stream.getTracks().forEach(t=>t.stop());return;}
  const mime=['audio/webm','audio/mp4','audio/ogg'].find(x=>MediaRecorder.isTypeSupported(x));if(!mime)throw new Error('Please type your question; this browser has no supported recorder.');
  discardRecording=false;let chunks=[],total=0;recorder=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:48000});
  recorder.ondataavailable=e=>{total+=e.data.size;if(total>750000){discardRecording=true;if(recorder.state==='recording')recorder.stop();status('Recording was too large. Please use a shorter question.');}else chunks.push(e.data);};
  recorder.onstop=async()=>{clearTimeout(recordTimeout);stream?.getTracks().forEach(t=>t.stop());stream=null;$('record').textContent='Record a question';
   if(discardRecording||!session||!chunks.length){chunks=[];return;}
   const blob=new Blob(chunks,{type:mime});chunks=[];const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   ask({audio:{base64:btoa(binary),mime},audioConsent:true},'Spoken question (audio is not saved by the exhibition)');
  };
  recorder.start(250);$('record').textContent='Stop and send';recordTimeout=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},20000);
 }catch(e){stream?.getTracks().forEach(t=>t.stop());status(friendly(e));}
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAudio();});window.addEventListener('pagehide',stopAudio);
try{api=await connect();$('start').disabled=false;status('Choose your privacy settings to begin.');}catch(e){status(friendly(e));}
