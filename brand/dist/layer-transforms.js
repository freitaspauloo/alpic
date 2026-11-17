export function imageMatrix(frame,settings,w,h){
  const angle=(settings.imageRotation??0)*Math.PI/180,scale=(settings.imageScale??100)/100,sx=scale*(settings.imageWidth??100)/100,sy=scale*(settings.imageHeight??100)/100;
  const a=Math.cos(angle)*sx,b=Math.sin(angle)*sx,c=-Math.sin(angle)*sy,d=Math.cos(angle)*sy,x=frame.left+frame.width/2,y=frame.top+frame.height;
  return{a,b,c,d,e:x-a*x-c*y+w*(settings.imageOffsetX??0)/100,f:y-b*x-d*y+h*(settings.imageOffsetY??0)/100};
}
export function transformPoint(point,m){return m?{x:m.a*point.x+m.c*point.y+m.e,y:m.b*point.x+m.d*point.y+m.f}:{...point}}
export function placeGraphPoint(point,pivot,frame,w,h){
  const p=transformPoint(point,frame.imageMatrix),o=transformPoint(pivot,frame.imageMatrix),angle=(frame.rotation??0)*Math.PI/180;
  const x=(p.x-o.x)*frame.scaleX/100,y=(p.y-o.y)*frame.scaleY/100;
  return{x:o.x+x*Math.cos(angle)-y*Math.sin(angle)+w*frame.offsetX/100,y:o.y+x*Math.sin(angle)+y*Math.cos(angle)+h*frame.offsetY/100};
}
