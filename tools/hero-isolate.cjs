// Remove disconnected neighbouring frame fragments, preserving body alpha and colour.
// Four-connected silhouette plus an eight-pixel neighbourhood retains antialiasing
// and fine whiskers; original delivered PNGs are never changed.
function isolateFigure(image, distance=8){
 const {data:d,width:w,height:h}=image,n=w*h,seen=new Uint8Array(n),groups=[];
 for(let p=0;p<n;p++){
  if(seen[p]||d[p*4+3]<24)continue;
  const q=[p];seen[p]=1;
  for(let j=0;j<q.length;j++){
   const k=q[j],x=k%w,y=(k/w)|0;
   for(const t of [x?k-1:-1,x<w-1?k+1:-1,y?k-w:-1,y<h-1?k+w:-1])if(t>=0&&!seen[t]&&d[t*4+3]>=24){seen[t]=1;q.push(t);}
  }
  groups.push(q);
 }
 groups.sort((a,b)=>b.length-a.length);if(!groups.length)return image;
 const near=new Uint8Array(n),keep=new Uint8Array(n);
 for(const p of groups[0]){keep[p]=1;const x=p%w,y=(p/w)|0;for(let yy=Math.max(0,y-distance);yy<=Math.min(h-1,y+distance);yy++)for(let xx=Math.max(0,x-distance);xx<=Math.min(w-1,x+distance);xx++)near[yy*w+xx]=1;}
 for(const g of groups.slice(1))if(g.some(p=>near[p]))for(const p of g)keep[p]=1;
 for(let p=0;p<n;p++)if(!keep[p]&&!near[p])d[p*4+3]=0;
 return image;
}
module.exports={isolateFigure};
