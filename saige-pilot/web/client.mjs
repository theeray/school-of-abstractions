/* Firebase web config is public app identification, NOT an OpenAI/server credential. */
let shared;
export async function connect(){
  if(shared)return shared;
  shared=(async()=>{
    const r=await fetch('./runtime-config.json',{cache:'no-store'});
    if(!r.ok)throw new Error('Pilot configuration is unavailable.');
    const config=await r.json();
    if(config.enabled!==true||!config.firebase||!config.appCheckSiteKey)
      throw new Error('This pilot is prepared but not activated. The existing written exhibition is still available.');
    if(config.firebase.projectId!=='project-6c1d195b-969f-4318-8f2')throw new Error('The configured project is not the exhibition project.');
    const root='https://www.gstatic.com/firebasejs/13.1.0/';
    const [appSDK,checkSDK,functionsSDK,authSDK]=await Promise.all([
      import(root+'firebase-app.js'),import(root+'firebase-app-check.js'),
      import(root+'firebase-functions.js'),import(root+'firebase-auth.js')]);
    const app=appSDK.initializeApp(config.firebase,'saige-pilot');
    checkSDK.initializeAppCheck(app,{provider:new checkSDK.ReCaptchaEnterpriseProvider(config.appCheckSiteKey),isTokenAutoRefreshEnabled:true});
    const functions=functionsSDK.getFunctions(app,'us-central1'), auth=authSDK.getAuth(app);
    await authSDK.setPersistence(auth,authSDK.inMemoryPersistence);
    return {config,auth,
      call:async(name,data={})=>(await functionsSDK.httpsCallable(functions,name,{limitedUseAppCheckTokens:true,timeout:55000})(data)).data,
      login:()=>authSDK.signInWithPopup(auth,new authSDK.GoogleAuthProvider()),
      logout:()=>authSDK.signOut(auth)};
  })();
  return shared;
}
export function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
export function friendly(error){
  const text=String(error?.message||'This action could not complete.');
  // App-defined errors are safe; never print structured errors/requests/tokens.
  return text.replace(/^Firebase:\s*/,'').slice(0,220);
}
