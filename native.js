/* جسر أندرويد: تنبيهات حقيقية حتى لو التطبيق مسكّر */
(function(){
  const C=window.Capacitor;
  if(!C||!C.isNativePlatform||!C.isNativePlatform())return;
  const LN=C.Plugins&&C.Plugins.LocalNotifications;
  if(!LN)return;
  const nid=i=>Math.abs(Number(i.id)%2147483647)||1;
  let last=null,busy=false;

  async function setup(){
    try{
      await LN.requestPermissions();
      await LN.createChannel({id:'appt',name:'المواعيد',importance:4,vibration:true});
      await LN.createChannel({id:'alarm',name:'المنبهات',importance:5,vibration:true});
    }catch(e){}
  }

  async function sched(){
    if(busy)return;busy=true;
    try{
      const S=JSON.parse(localStorage.getItem('mw2')||'{}'),now=Date.now(),list=[];
      const pend=await LN.getPending();
      if(pend.notifications&&pend.notifications.length)await LN.cancel({notifications:pend.notifications});
      (S.items||[]).forEach(i=>{
        if(i.done)return;
        const at=i.sn||(i.ts-((i.trav||0)+(i.lead||0))*6e4);
        if(at<=now)return;
        const go=i.trav&&at<i.ts;
        list.push({
          id:nid(i),
          title:i.al?'منبه':'مواعيدي',
          body:go?`${i.title}: وقت الطلوع`:`${i.title}`,
          schedule:{at:new Date(at),allowWhileIdle:true},
          channelId:i.al?'alarm':'appt'
        });
      });
      if(list.length)await LN.schedule({notifications:list});
    }catch(e){}
    busy=false;
  }

  setup().then(()=>{
    sched();
    setInterval(()=>{
      const s=localStorage.getItem('mw2');
      if(s!==last){last=s;sched()}
    },3000);
  });
})();
