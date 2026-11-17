/* Flat mountain studies. Every mark is a 2D line segment or a square. */
(() => {
  'use strict';
  const presets = [
    {name:'The Alpine',short:'Alpine',code:'ALP',description:'A few lines to the top.',height:76,width:78,detail:65,
      points:[[-1,.03],[-.58,.43],[-.3,.27],[.02,1],[.34,.48],[.51,.66],[1,.03],[-.24,.06],[.52,.05]],ridge:7,
      connections:[[1,7],[3,7],[4,7],[5,8],[7,8],[8,6],[2,7],[4,8],[1,3],[0,7]]},
    {name:'The Needle',short:'Needle',code:'NDL',description:'One quiet, sharp idea.',height:91,width:55,detail:45,
      points:[[-1,.02],[-.43,.21],[.14,1],[.48,.25],[1,.03],[-.06,.04],[.2,.43]],ridge:5,
      connections:[[2,5],[1,5],[3,5],[2,6],[6,3],[6,5],[1,6],[5,4]]},
    {name:'Twin Peaks',short:'Twins',code:'TWN',description:'A little space between summits.',height:72,width:83,detail:60,
      points:[[-1,.04],[-.49,.92],[-.03,.32],[.42,.98],[1,.04],[-.53,.08],[.32,.06]],ridge:5,
      connections:[[1,5],[2,5],[2,6],[3,6],[5,6],[0,5],[6,4],[1,2],[1,6]]},
    {name:'The Ridgeline',short:'Ridgeline',code:'RDG',description:'Take the scenic line.',height:60,width:94,detail:50,
      points:[[-1,.05],[-.77,.46],[-.55,.3],[-.29,.79],[-.05,.44],[.19,.95],[.42,.46],[.67,.7],[1,.06],[-.35,.03],[.4,.02]],ridge:9,
      connections:[[1,9],[3,9],[5,9],[5,10],[7,10],[9,10],[2,9],[6,10],[10,8],[0,9]]},
    {name:'The Glacier',short:'Glacier',code:'GLC',description:'Room to breathe.',height:50,width:87,detail:55,
      points:[[-1,.04],[-.73,.49],[-.44,.58],[-.19,.94],[.07,.75],[.38,.83],[.74,.29],[1,.05],[-.3,.1],[.38,.08]],ridge:8,
      connections:[[2,8],[3,8],[4,8],[5,9],[6,9],[8,9],[1,8],[4,9],[9,7]]},
    {name:'The Caldera',short:'Caldera',code:'CLD',description:'A pause at the very top.',height:62,width:80,detail:60,
      points:[[-1,.03],[-.55,.83],[-.29,1],[0,.67],[.32,.99],[.55,.78],[1,.04],[-.39,.05],[.42,.04]],ridge:7,
      connections:[[2,7],[3,7],[3,8],[4,8],[7,8],[1,7],[5,8],[2,4],[8,6],[0,7]]},
    {name:'Sawtooth',short:'Sawtooth',code:'SAW',description:'Beautifully irregular.',height:73,width:92,detail:60,
      points:[[-1,.04],[-.78,.47],[-.63,.26],[-.43,.82],[-.27,.46],[-.06,1],[.14,.4],[.34,.8],[.51,.34],[.72,.62],[1,.04],[-.38,.03],[.4,.03]],ridge:11,
      connections:[[1,11],[3,11],[5,11],[5,12],[7,12],[9,12],[11,12],[4,11],[6,12],[8,12],[12,10]]},
    {name:'The Essential',short:'Essential',code:'ESS',description:'Nothing more than it needs.',height:74,width:73,detail:0,
      points:[[-1,.04],[.02,1],[1,.04],[-.08,.18]],ridge:3,
      connections:[[1,3],[0,3],[3,2]]},
    {name:'The Foothills',short:'Foothills',code:'FTH',description:'Good things start small.',height:42,width:93,detail:50,
      points:[[-1,.05],[-.66,.59],[-.36,.24],[-.04,.82],[.28,.39],[.58,.65],[1,.04],[-.35,.03],[.42,.04]],ridge:7,
      connections:[[1,7],[3,7],[3,8],[5,8],[7,8],[2,7],[4,8],[8,6],[0,7]]},
    {name:'The Ascent',short:'Ascent',code:'ASC',description:'Keep looking up.',height:82,width:84,detail:55,
      points:[[-1,.04],[-.68,.27],[-.48,.16],[-.15,.58],[.02,.41],[.47,1],[1,.03],[-.15,.05],[.47,.13]],ridge:7,
      connections:[[1,7],[3,7],[5,7],[5,8],[8,6],[7,8],[4,8],[3,5],[0,7]]}
  ];
  presets.forEach(p => {p.category='Outline';p.mode='outline';p.density=20;p.irregularity=0});
  const studies=[
    {name:'Alpine Lattice',short:'Lattice',code:'LAT',mode:'network',category:'Network',source:0,density:60,detail:55,irregularity:18,dot:11,nodeStyle:'outline',stroke:.7,lineOpacity:55,description:'Hollow junctions. A mountain of connections.'},
    {name:'Fractured Peaks',short:'Fracture',code:'FRC',mode:'scatter',category:'Network',source:6,density:55,detail:60,irregularity:38,dot:5,nodeStyle:'outline',stroke:.55,lineOpacity:70,description:'Fine lines, crossing familiar ground.'},
    {name:'Pixel Snow',short:'Pixel Snow',code:'PXL',mode:'pixel',category:'Field',source:0,density:72,detail:0,irregularity:4,dot:3,nodeStyle:'solid',stroke:.5,lineOpacity:35,description:'A summit assembled one square at a time.',highlight:14},
    {name:'Signal Field',short:'Signal',code:'SGN',mode:'pixel',category:'Field',source:2,density:60,detail:12,irregularity:0,dot:7,nodeStyle:'solid',stroke:.5,lineOpacity:20,squareOpacity:22,highlight:7,description:'Quiet pixels. A few bright signals.'},
    {name:'Radiant Summit',short:'Radiant',code:'RAD',mode:'rays',category:'Signal',source:0,density:65,detail:60,irregularity:8,dot:2.5,nodeStyle:'solid',stroke:.45,lineOpacity:65,description:'Every line starts somewhere.'},
    {name:'Contour Weave',short:'Weave',code:'WEV',mode:'weave',category:'Signal',source:3,density:70,detail:65,irregularity:8,dot:1.5,nodeStyle:'solid',stroke:.6,lineOpacity:70,description:'A landscape traced in threads.'},
    {name:'Vertical Strata',short:'Strata',code:'STR',mode:'hatch',category:'Signal',source:0,density:65,detail:55,irregularity:28,dot:0,nodeStyle:'solid',stroke:.9,lineOpacity:85,description:'Little marks. A larger landscape.'},
    {name:'Binary Summit',short:'Binary',code:'BIN',mode:'binary',category:'Field',source:9,density:72,detail:0,irregularity:0,dot:5,nodeStyle:'outline',squareStroke:.65,stroke:.5,lineOpacity:20,description:'An alpine silhouette in a digital language.'},
    {name:'Summit Atlas',short:'Atlas',code:'ATL',mode:'network',category:'Network',source:2,density:90,detail:85,irregularity:30,dot:4,nodeStyle:'mixed',stroke:.45,lineOpacity:45,description:'More paths. More possibilities.'},
    {name:'Glacial Constellation',short:'Stellar',code:'STL',mode:'scatter',category:'Network',source:4,density:70,detail:30,irregularity:70,dot:8,nodeStyle:'outline',stroke:.65,lineOpacity:45,description:'A constellation with an alpine outline.'}
  ];
  studies.forEach((s,i)=>presets.push({...presets[s.source],...s,height:82,width:92,seed:701+i*113}));
  const alpineStudies=[
    {name:'Grand Alpine',short:'Grand Alpine',code:'GRA',density:56,detail:68,irregularity:35,dot:5,nodeStyle:'outline',stroke:.7,lineOpacity:78,
      description:'A decisive summit. Ridges all the way down.',
      points:[[-1,.025],[-.78,.14],[-.62,.32],[-.45,.4],[-.25,.67],[-.09,.83],[.03,1],[.2,.74],[.3,.61],[.44,.66],[.61,.39],[.79,.2],[1,.025]],
      spines:[[[.03,1],[-.04,.77],[.13,.51],[.02,.27],[.12,.025]],[[.03,1],[-.29,.46],[-.58,.025]],[[.44,.66],[.38,.38],[.67,.025]]]},
    {name:'Matterhorn Network',short:'Matterhorn',code:'MTN',density:44,detail:58,irregularity:40,dot:6.5,nodeStyle:'outline',stroke:.75,lineOpacity:82,width:77,height:94,
      description:'A sharp pyramid with a beautifully broken shoulder.',
      points:[[-1,.025],[-.74,.12],[-.55,.29],[-.34,.42],[-.24,.58],[-.05,1],[.1,.91],[.28,.56],[.47,.32],[.63,.25],[.78,.11],[1,.025]],
      spines:[[[-.05,1],[.04,.72],[-.07,.4],[.04,.025]],[[-.05,1],[-.32,.36],[-.48,.025]],[[.28,.56],[.31,.28],[.64,.025]]]},
    {name:'Twin Sentinels',short:'Sentinels',code:'SNT',density:66,detail:72,irregularity:46,dot:4.5,nodeStyle:'mixed',stroke:.6,lineOpacity:80,
      description:'Two distinct summits, joined by a high alpine saddle.',
      points:[[-1,.025],[-.83,.2],[-.63,.49],[-.47,.88],[-.34,.98],[-.18,.71],[-.05,.59],[.08,.67],[.3,1],[.49,.7],[.58,.49],[.8,.23],[1,.025]],
      spines:[[[-.34,.98],[-.38,.64],[-.23,.34],[-.42,.025]],[[.3,1],[.21,.64],[.42,.37],[.37,.025]],[[-.05,.59],[.04,.29],[-.07,.025]]]},
    {name:'Serrated Horizon',short:'Serrated',code:'SRR',density:70,detail:80,irregularity:65,dot:3.5,nodeStyle:'outline',stroke:.55,lineOpacity:78,height:75,width:97,
      description:'A full range, stitched together with fine connections.',
      points:[[-1,.025],[-.87,.21],[-.73,.55],[-.61,.39],[-.43,.88],[-.27,.6],[-.07,1],[.09,.65],[.28,.84],[.42,.48],[.6,.7],[.77,.27],[1,.025]],
      spines:[[[-.73,.55],[-.75,.29],[-.7,.025]],[[-.43,.88],[-.43,.5],[-.32,.025]],[[-.07,1],[.05,.51],[-.05,.025]],[[.28,.84],[.3,.4],[.39,.025]],[[.6,.7],[.59,.32],[.76,.025]]]},
    {name:'Mont Blanc Web',short:'Mont Blanc',code:'MBW',density:82,detail:76,irregularity:30,dot:3,nodeStyle:'mixed',stroke:.5,lineOpacity:75,width:96,height:79,
      description:'Broad snow shoulders, a quiet crown, intricate paths.',
      points:[[-1,.025],[-.84,.17],[-.66,.38],[-.49,.58],[-.35,.68],[-.22,.86],[-.05,.94],[.11,1],[.26,.93],[.37,.77],[.54,.63],[.72,.31],[.87,.14],[1,.025]],
      spines:[[[.11,1],[.04,.77],[.17,.56],[.02,.24],[.15,.025]],[[-.22,.86],[-.35,.51],[-.62,.025]],[[.37,.77],[.35,.49],[.64,.025]]]},
    {name:'Glacial Spine',short:'Glacial Spine',code:'GSP',density:28,detail:35,irregularity:48,dot:8,nodeStyle:'outline',stroke:.75,lineOpacity:75,width:85,height:91,
      description:'An expressive silhouette with room between the junctions.',
      points:[[-1,.025],[-.78,.16],[-.61,.39],[-.49,.32],[-.27,.64],[-.04,1],[.12,.81],[.24,.51],[.43,.62],[.59,.36],[.8,.2],[1,.025]],
      spines:[[[-.04,1],[-.12,.7],[.05,.43],[-.12,.025]],[[-.27,.64],[-.4,.32],[-.65,.025]],[[.43,.62],[.38,.33],[.68,.025]]]},
    {name:'The North Face',short:'North Face',code:'NFC',density:61,detail:74,irregularity:54,dot:4,nodeStyle:'outline',stroke:.65,lineOpacity:86,width:89,height:92,distribution:'cloud',
      description:'A bold face with a steep summit and a sweeping descent.',
      points:[[-1,.025],[-.81,.11],[-.62,.24],[-.48,.29],[-.32,.48],[-.23,.69],[-.08,1],[.09,.83],[.28,.72],[.44,.48],[.57,.43],[.79,.18],[1,.025]],
      spines:[[[-.08,1],[.02,.7],[-.07,.44],[.1,.025]],[[-.08,1],[-.26,.57],[-.53,.025]],[[.28,.72],[.28,.44],[.64,.025]]]},
    {name:'High Atlas Range',short:'High Atlas',code:'HAR',density:92,detail:88,irregularity:68,dot:2.5,nodeStyle:'mixed',stroke:.45,lineOpacity:77,width:98,height:80,distribution:'cloud',
      description:'A detailed mountain chain, held together by its ridgelines.',
      points:[[-1,.025],[-.85,.25],[-.69,.62],[-.56,.45],[-.38,.88],[-.24,.72],[-.06,1],[.13,.61],[.32,.86],[.47,.57],[.61,.72],[.79,.3],[1,.025]],
      spines:[[[-.69,.62],[-.72,.32],[-.69,.025]],[[-.38,.88],[-.34,.45],[-.44,.025]],[[-.06,1],[.04,.52],[-.01,.025]],[[.32,.86],[.3,.42],[.39,.025]],[[.61,.72],[.61,.4],[.78,.025]]]}
  ];
  alpineStudies.forEach((p,i)=>presets.push({height:88,width:93,motionStyle:'breathe',amplitude:18,...p,ridge:p.points.length,connections:[],category:'Network',family:'Alpine',mode:'alpine',seed:3101+i*157}));
  window.AlpicTemplates=presets;
})();
