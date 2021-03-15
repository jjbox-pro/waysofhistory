/**
	Город
*/

cnst.townBlink = {
    period: 1000,
    slot: {min: 0, max: 1},
    clicker: {min: 0, max: 0.5},
    clickerQuest: {min: 0, max: 1},
    clickerHover: {min: 0.8, max: 1}
};

cnst.townMode = {
	dragObj: 0,
	camera: 1,
	road: 2,
    shadow: 3,
	rainbow: 4,
	swapSlot: 5,
};
cnst.townObjType = {
	other: 0,
	clicker: 1,
	build: 2,
	slot: 3,
	slotAura: 5,
	roadPoint: 7,
	slotPoint: 8,
	unit: 9,
	slotLabel: 10,
	slotLabelStar: 11,
	slotLabelLevel: 12,
	clickerLabel: 14,
    eventBlink: 15,//мигающий молоток
    eventStat: 16,
    eventTimer: 17,//таймер события
    shadow: 19,
    ufo: 20,
	rainbow: 21, // Радуга и сияние
};

cnst.clickerres = {
	res: 0,
	val: 1
}

cnst.town2 = {}
cnst.town2.bldLabel = [
	{str: '#000', fill: '#8fbc8f'},
	{str: '#000', fill: '#d0a282'},
	{str: '#000', fill: '#e1a514'},
	{str: '#fff', fill: '#170000'},
	{str: '#000', fill: '#8fbc8f'}
];

//задник - вода
cnst.town2.backWater = {x: 700, y: 227};
cnst.town2.slotSize = {x: 174, y: 88};
//cnst.town2.clickerSize = {x: 62, y: 82};
cnst.town2.clickerSize = {x: 109, y: 214};
//cnst.town2.clickerDisp = {x: 0, y: 51};
cnst.town2.clickerDisp = {x: 20, y: 180};
cnst.town2.clickerYcorrect = 100;
cnst.town2.eventDisp = {x: 0, y: - 85};

//стены
cnst.town2.walls = [
	100, 430, 450, 500, 0,
	501, 700, 1, 580, 550,
	701, 750, 900, 501, 502,
	3, 4, 2000, 5, 810, 1300, 333
];

//кликеры
cnst.town2.clicker = [
	/*{x:-746,y:-116},*/
	{x:-435,y:-100},
	{x:-447,y:-53},
	/*{x:-305,y:108},*/
	{x:-225,y:222},
	/*{x:-265,y:370},*/
	{x:-194,y:387},
	{x:-156,y:368},
	{x:-252,y:446},
	{x:-291,y:474},
	{x:-291,y:508},
	{x:-256,y:536},
	{x:-225,y:474},
	{x:-190,y:505},
	{x:-122,y:470},
	{x:-47,y:135},
	{x:29,y:151},
	{x:167,y:-130},
	{x:440,y:-8},
	{x:489,y:-80},
	{x:502,y:-109},
	{x:557,y:-85},
	{x:507,y:88},
	{x:267,y:199},
	{x:318,y:221},
	{x:512,y:200},
	{x:191,y:335},
	{x:245,y:314},
	{x:183,y:431},
	{x:410,y:365}
];
//разное по муверам
cnst.town2.moversInfo = {
	steps: 10,//шагов в анимации
	dirs: 8,//направлений
	size: {x: 40, y: 40},//размер слайда
	rand: 4,//смещение
	rpRad: 5//радиус окружности дорожной точки (для отрисовки)
};
//муверы
cnst.town2.movers = [
	{speed: 0.65,aspeed: 0.5},		//0 /*vnu*/
	{speed: 0.4,aspeed: 0.4},		//1 /*ded*/
	{speed: 0.4,aspeed: 0.3},		//2 /*los*/
	{speed: 3,	aspeed: 1},			//3 ch
	{speed: 2,	aspeed: 1},			//4 ch
	{speed: 2,	aspeed: 1},			//5 ch
	{speed: 0.6,aspeed: 0.5},		//6 /*warrior*/
	{speed: 0.7,aspeed: 0.5},		//7 /*archer*/
	{speed: 0.5,aspeed: 0.5},		//8 /*catapult*/
	{speed: 0.7,aspeed: 0.5},		//9 /*prashnik*/
	{speed: 0.6,aspeed: 0.5},		//10	man fat 1
	{speed: 0.6,aspeed: 0.5},		//11	man 1
	{speed: 0.4,aspeed: 0.5},		//12	wman 1
	{speed: 0.4,aspeed: 0.5},		//13	wman 1
	{speed: 0.8,aspeed: 0.6},		//14 /*worker*/
	{speed: 1.2,aspeed: 0.8},		//15 /*horseman*/
	{speed: 0.5,aspeed: 0.5},		//16 /*petroglypher*/
	{speed: 0.7,aspeed: 0.6},		//17 /*opol*/
	{speed: 1.3,aspeed: 0.8},		//18 /*kolesn*/
	{speed: 0.6,aspeed: 0.5},		//19 /*settler*/
	{speed: 0.7,aspeed: 0.6},		//20 /*pike*/
	{speed: 0.5,aspeed: 0.5},		//21 /*treemaster*/
	{speed: 0.5,aspeed: 0.5},		//22 /*farmer*/
	{speed: 0.8,aspeed: 0.7},		//23 /*swordsman*/
	{speed: 0.7,aspeed: 0.7},		//24 /*legioneer*/
	{speed: 0.8,aspeed: 0.7},		//25 /*arbaleet*/
	{speed: 0.5,aspeed: 0.5},		//26 /*taran*/
	{speed: 0.9,aspeed: 0.7},		//27 /*war-jaguar*/
	{speed: 0.5,aspeed: 0.5},		//28 vdv
	{speed: 0.5,aspeed: 0.5},		//29 vdv guitar
	{speed: 0.5,aspeed: 0.5},		//30 /*phyloso*/
	{speed: 0.4,aspeed: 0.4},		//31 /*spy*/
	{speed: 0.4,aspeed: 0.5},		//32 /*booker*/
	{speed: 0.8,aspeed: 0.7},		//33 /*samuray*/
	{speed: 1.3,aspeed: 1},			//34 /*knight*/
	{speed: 0.6,aspeed: 0.5},		//35	/*man 2*/
	{speed: 0.6,aspeed: 0.5},		//36	/*man f 2*/
	{speed: 0.4,aspeed: 0.5},		//37	/*wman 2*/
	{speed: 0.4,aspeed: 0.5},		//38	/*wman f 2*/
	{speed: 0.3,aspeed: 0.4},		//39 /*osad tower*/
	{speed: 0.7,aspeed: 0.6},		//40 /*alebarda+pikener*/
	{speed: 0.5,aspeed: 0.5},		//41 ambasador
	{speed: 0.5,aspeed: 0.5},		//42 miner
	{speed: 0.8,aspeed: 0.7},		//43 longbow
	{speed: 0.5,aspeed: 0.5},		//44 blacksmith	
	{speed: 0.5,aspeed: 0.5},		//45 fisher
	{speed: 0.6,aspeed: 0.5},		//46	/*man 2*/
	{speed: 0.6,aspeed: 0.5},		//47	/*man f 2*/
	{speed: 0.4,aspeed: 0.5},		//48	/*wman 2*/
	{speed: 0.4,aspeed: 0.5},		//49	/*wman f 2*/
	{speed: 0.5,aspeed: 0.5},		//50 tailor
	{speed: 0.7,aspeed: 0.5},		//51 musiman
	{speed: 0.7,aspeed: 0.6},		//52 banker 1
	{speed: 0.5,aspeed: 0.5},		//53 astro
	{speed: 0.7,aspeed: 0.6},		//54 /*headcutter*/
	{speed: 0.5,aspeed: 0.5},		//55 jude
	{speed: 0.5,aspeed: 0.5},		//56 /*merchant*/
	{speed: 0.3,aspeed: 0.3},		//57 banker 2
	{speed: 2.2,aspeed: 1.2},		//58 alchemestry
	{speed: 0.2,aspeed: 0.2},		//59 printer
	{speed: 0.6,aspeed: 0.5},		//60 grenader
	{speed: 0.7,aspeed: 0.6},		//61 mushketon
	{speed: 0.5,aspeed: 0.5},		//62 bombarda
	{speed: 0.5,aspeed: 0.5},		//63 pushka
	{speed: 0.6,aspeed: 0.5},		//64 man 3
	{speed: 0.6,aspeed: 0.5},		//65 man f 3
	{speed: 0.4,aspeed: 0.5},		//66 wman 3
	{speed: 0.4,aspeed: 0.5},		//67 wman f3
	{speed: 1.3,aspeed: 0.9},		//68 dragoon
	{speed: 0.7,aspeed: 0.6},		//69 guardsman
	{speed: 1.1,aspeed: 0.9},		//70 kavaleer
	{speed: 0.5,aspeed: 0.5},		//71 auto tratatata
	{speed: 0.5,aspeed: 0.5},		//72 troop
	{speed: 0.7,aspeed: 0.6},		//73 gathleeng
	{speed: 0.6,aspeed: 0.5},		//74 jageer
	{speed: 0.3,aspeed: 0.3},		//75 wman for weel
	{speed: 0.8,aspeed: 0.5},		//76 saper
	{speed: 1.8,aspeed: 0.8},		//77 desant
	{speed: 0.6,aspeed: 0.5},		//78 bazooka
	{speed: 1.8,aspeed: 0.8},		//79 sniper
	{speed: 0.8,aspeed: 0.7},		//80 tachanka PVO
	{speed: 0.5,aspeed: 0.5},		//81 
	{speed: 0.5,aspeed: 0.5},		//82 
	{speed: 0.5,aspeed: 0.5},		//83 
	{speed: 0.5,aspeed: 0.5},		//84 
	{speed: 0.5,aspeed: 0.5},		//85 
	{speed: 0.5,aspeed: 0.5},		//86 
	{speed: 0.5,aspeed: 0.5},		//87 
	{speed: 0.5,aspeed: 0.5},		//88 
	{speed: 0.5,aspeed: 0.5},		//89 
	{speed: 0.5,aspeed: 0.5},		//90 
	{speed: 0.5,aspeed: 0.5},		//91 
	{speed: 0.5,aspeed: 0.5},		//92 
	{speed: 0.5,aspeed: 0.5},		//93 
	{speed: 0.5,aspeed: 0.5},		//94 
	{speed: 0.5,aspeed: 0.5},		//95 
	{speed: 0.5,aspeed: 0.5},		//96 
	{speed: 0.5,aspeed: 0.5},		//97 
	{speed: 0.5,aspeed: 0.5},		//98 
	{speed: 0.5,aspeed: 0.5},		//99 
	{speed: 0.7,aspeed: 0.6},		//100 telega
	{speed: 0.8,aspeed: 0.7},		//101 kareta
	{speed: 1.0,aspeed: 0.8},		//102 dillligance
	{speed: 1.8,aspeed: 0.8},		//103 
	{speed: 1.8,aspeed: 0.8},		//104 
	{speed: 1.8,aspeed: 0.8},		//105 
	{speed: 1.8,aspeed: 0.8},		//106 
	{speed: 1.8,aspeed: 0.8},		//107
	{speed: 1.8,aspeed: 0.8},		//108
	{speed: 1.8,aspeed: 0.8},		//109
	{speed: 1.8,aspeed: 0.8},		//110 auto1 cop
	{speed: 1.8,aspeed: 0.8},		//111 auto1 yellow
	{speed: 1.8,aspeed: 0.8},		//112 auto1 fire
	{speed: 1.8,aspeed: 0.8},		//113 auto1 blue
	{speed: 1.8,aspeed: 0.8},		//114 auto1 violet
	{speed: 1.8,aspeed: 0.8},		//115 auto1 red
	{speed: 1.8,aspeed: 0.8},		//116 auto1 cyan
	{speed: 1.8,aspeed: 0.8},		//117
	{speed: 1.8,aspeed: 0.8},		//118
	{speed: 1.8,aspeed: 0.8},		//119
	{speed: 2.0,aspeed: 0.9},		//120 auto2 cop
	{speed: 2.1,aspeed: 0.9},		//121 auto2 yellow
	{speed: 2.2,aspeed: 0.9},		//122 auto2 fire
	{speed: 1.9,aspeed: 0.9},		//123 auto2 blue
	{speed: 1.8,aspeed: 0.8},		//124 auto2 pink
	{speed: 2.0,aspeed: 0.9},		//125 auto2 grey
	{speed: 2.1,aspeed: 0.9},		//126 auto2 black
	{speed: 1.9,aspeed: 0.9},		//127 auto2 lightgreen
	{speed: 1.8,aspeed: 0.8},		//128 auto2 red
	{speed: 2.0,aspeed: 0.9},		//129 auto2 blue
	{speed: 2.0,aspeed: 0.9},		//130
	{speed: 2.0,aspeed: 0.9},		//131
	{speed: 2.0,aspeed: 0.9},		//132
	{speed: 2.0,aspeed: 0.9},		//133
	{speed: 2.0,aspeed: 0.9},		//134
	{speed: 2.0,aspeed: 0.9},		//135
	{speed: 2.0,aspeed: 0.9},		//136
	{speed: 2.0,aspeed: 0.9},		//137
	{speed: 2.0,aspeed: 0.9},		//138
	{speed: 2.0,aspeed: 0.9},		//139
	{speed: 0.6,aspeed: 0.5},		//140 hell-Frank
	{speed: 2.2,aspeed: 0.9},		//141 hell-Witch
	{speed: 0.6,aspeed: 0.5},		//142 hell-Casper
	{speed: 0.6,aspeed: 0.5},		//143 hell-Dracula
	{speed: 0.6,aspeed: 0.5},		//144 hell-Pumpkin
	{speed: 2.0,aspeed: 0.9},		//145 firekeeper
	{speed: 2.0,aspeed: 0.9},		//146 firekeeper fat
	{speed: 2.0,aspeed: 0.9},		//147 car of firekeeper
	{speed: 0.4,aspeed: 0.4},		//148 /*ded - red*/
	{speed: 2.0,aspeed: 0.9},		// 149 system
	{speed: 2.0,aspeed: 0.9},		//
	{speed: 2.0,aspeed: 0.9},		//
	{speed: 2.0,aspeed: 0.9},		//
	{speed: 2.0,aspeed: 0.9},		//
	{speed: 0.7,aspeed: 0.5}];
//юниты в муверы
cnst.town2.units2 = [
	{anim:6,animk:10},
	{anim:9,animk:10},
	{anim:20,animk:10},
	{anim:23,animk:10},
	{anim:40,animk:10},
	{anim:62,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:9,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:6,animk:10},
	{anim:15,animk:10},
	{anim:81,animk:10},
	{anim:68,animk:10},
	{anim:18,animk:10},
	{anim:71,animk:10},
	{anim:73,animk:10},
	{anim:87,animk:10},
	{anim:9,animk:10},
	{anim:82,animk:10},
	{anim:72,animk:10},
	{anim:43,animk:10},
	{anim:34,animk:10},
	{anim:61,animk:10},
	{anim:74,animk:10},
	{anim:70,animk:10},
	{anim:40,animk:10},
	{anim:25,animk:10},
	{anim:60,animk:10},
	{anim:88,animk:10},
	{anim:34,animk:10},
	{anim:33,animk:10},
	{anim:-1,animk:10},
	{anim:31,animk:10},
	{anim:7,animk:10},
	{anim:23,animk:10},
	{anim:63,animk:10},
	{anim:62,animk:10},
	{anim:69,animk:10},
	{anim:8,animk:10},
	{anim:26,animk:10},
	{anim:19,animk:8},
	{anim:-1,animk:10},
	{anim:8,animk:10},
	{anim:8,animk:10},
	{anim:78,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:77,animk:10},
	{anim:15,animk:10},
	{anim:15,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:14,animk:8},
	{anim:17,animk:10},
	{anim:90,animk:10},
	{anim:86,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:76,animk:10},
	{anim:79,animk:10},
	{anim:-1,animk:10},
	{anim:24,animk:10},
	{anim:27,animk:10},
	{anim:25,animk:10},
	{anim:39,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:83,animk:10},
	{anim:80,animk:10},
	{anim:89,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:91,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:84,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:92,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10},
	{anim:-1,animk:10}];

cnst.town2.z = {
	slotAuraSwap: 100,
	bldSel: 3100,
	slotSwap: 3150,
	//slotAuraStat: 3200,
    slotPolygon: 3250,
	bldLabel: 3300,
	bldEvent: 3400
};


cnst.town2.roadPoints = [
    {x:1057,y:477,next:[9,33,23]},
    {x:1192,y:431,next:[2,23]},
    {x:1284,y:472,next:[3]},
    {x:1359,y:545,next:[41]},
    {x:1458,y:655,next:[28,41,52]},
    {x:1658,y:471,next:[36,43,29]},
    {x:704,y:530,next:[19,13]},
    {x:1281,y:774,next:[21,8]},
    {x:1128,y:719,next:[9,7,15,57,58]},
    {x:1058,y:642,next:[0,8,15,57,48]},
    {x:778,y:877,next:[16,32,64,63]},
    {x:868,y:727,next:[15,42]},
    {x:1086,y:904,next:[54,56]},
    {x:773,y:569,next:[6,68,19,69]},
    {x:829,y:502,next:[33,69]},
    {x:974,y:790,next:[16,8,9,11]},
    {x:846,y:878,next:[10,15,63,64]},
    {x:761,y:683,next:[18,42]},
    {x:535,y:739,next:[37,17]},
    {x:632,y:564,next:[13,68,6]},
    {x:1689,y:752,next:[25,34]},
    {x:1379,y:696,next:[7,22,52,26,24]},
    {x:1317,y:637,next:[24,21]},
    {x:1139,y:460,next:[1,0]},
    {x:1232,y:683,next:[22,21]},
    {x:1797,y:687,next:[20,28]},
    {x:1435,y:728,next:[27,52,39,21]},
    {x:1541,y:673,next:[26,53]},
    {x:1615,y:597,next:[29,4,25,53]},
    {x:1663,y:531,next:[28,5]},
    {x:1410,y:411,next:[31,44]},
    {x:1488,y:357,next:[30]},
    {x:663,y:825,next:[10]},
    {x:901,y:446,next:[14,0]},
    {x:1693,y:804,next:[35,20]},
    {x:1577,y:848,next:[34,46,39]},
    {x:1762,y:385,next:[5]},
    {x:435,y:792,next:[18,66]},
    {x:1276,y:925,next:[40,49,54]},
    {x:1438,y:845,next:[35,49,26]},
    {x:1247,y:945,next:[47]},
    {x:1413,y:618,next:[4]},
    {x:808,y:662,next:[11,17,68]},
    {x:1529,y:420,next:[5,44]},
    {x:1472,y:432,next:[30,43]},
    {x:1679,y:959,next:[46]},
    {x:1578,y:909,next:[45,50]},
    {x:1386,y:1006,next:[40,50]},
    {x:1131,y:844,next:[54,15,9,58]},
    {x:1421,y:859,next:[39,38,50]},
    {x:1529,y:934,next:[46,47,49]},
    {x:954,y:1009,next:[55,56,61]},
    {x:1431,y:660,next:[4,21]},
    {x:1544,y:631,next:[28,27]},
    {x:1238,y:903,next:[38,48,12,55]},
    {x:1008,y:1018,next:[54,51,59]},
    {x:944,y:968,next:[12,51]},
    {x:905,y:747,next:[9,11,8,58]},
    {x:1173,y:817,next:[7,48,8,57]},
    {x:1133,y:1045,next:[55,60]},
    {x:959,y:1150,next:[59,61,62]},
    {x:839,y:1084,next:[51,60]},
    {x:961,y:1191,next:[60]},
    {x:847,y:931,next:[64,10,16,56]},
    {x:777,y:931,next:[65,63,16,10]},
    {x:626,y:1004,next:[64]},
    {x:367,y:914,next:[67,37]},
    {x:225,y:984,next:[66]},
    {x:734,y:616,next:[13,42,19]},
    {x:799,y:556,next:[14,13]}
];

cnst.town2.maxZoom = 1;
cnst.town2.minZoom = 0.6;

bckTown = function(){
	bckTown.superclass.constructor.apply(this, arguments);
    
    this.init();
};

    utils.extend(bckTown, Block);
	
	
	bckTown.resList = {};
	
	bckTown.shownTowns = {};
	
	
	bckTown.prototype.calcName = function(){
		return 'town';
	};
	
	bckTown.prototype.calcTmplFolder = function(){
		return tmplMgr.town;
	};
	
	bckTown.prototype.addNotif = function(){
		this.notif.other[Notif.ids.townChange] = this.initTown;
		this.notif.other[Notif.ids.townClickers] = this.initClickers;
		this.notif.other[Notif.ids.townRes] = this.updateBuildLabels;
		this.notif.other[Notif.ids.townResHas] = this.tryUpdateBuildLabels;
		this.notif.other[Notif.ids.townZoom] = 
		this.notif.other[Notif.ids.applFramed] = this.setZoom;
		this.notif.other[Notif.ids.townMovers] =
		this.notif.other[Notif.ids.townModeChange] = this.updateMovers;
		this.notif.other[Notif.ids.townBuildings] = 
		this.notif.other[Notif.ids.townBuildQueue] = 
		this.notif.other[Notif.ids.accQuests] = this.tsUpdNotif;
		this.notif.other[Notif.ids.townStartDrawView] = this.startDrawView;
	};
	
	bckTown.prototype.bindEvent = function(){
		this.render = this.render.bind(this);
		
		this.drawView = this.drawView.bind(this);
		
		this.initZoom();
		
		this.initCanvas();
		
		this.initTown();
		
		if( utils.isMobileDevice() )
			this.bindTouchEvent();
		else{
			if( utils.isTouchDevice() )
				this.bindTouchEvent();
			
			this.bindMouseEvent();
		}
        
		this.bindBuildQueueEvent();
	};
	
	bckTown.prototype.afterDraw = function(){
		this.startDrawView();
	};
	
	bckTown.prototype.resize = function(){
		this.setCanvasSize();
	};
	
	
	bckTown.prototype.tsUpdNotif = function(params, notifId){
		this.clearTimeout(this.tsNotifTimeoutId);
		
		if( !this.tsRelatedNotifs )
			this.tsRelatedNotifs = {};
		
		if( notifId == Notif.ids.townBuildings || (notifId == Notif.ids.townBuildQueue && params) )
			this.tsRelatedNotifs[Notif.ids.townMovers] = true;
		else if( notifId == Notif.ids.accQuests )
			this.tsRelatedNotifs[Notif.ids.townClickers] = true;
		
		var delay = notifId == Notif.ids.townBuildQueue ? 700 : 50;
		
		this.tsNotifTimeoutId = this.setTimeout(function(){
			this.initTownSlots();
			
			for(notif in this.tsRelatedNotifs)
				notifMgr.runEvent(notif);
			
			this.preDrawLayer(this.layerDyn); // Чтобы перед рисованием были выставленные корректные z-индексы
			
			this.tsRelatedNotifs = {};
		}, delay);
	};
	
	
	bckTown.prototype.init = function(){
		this.options.staticZ = true;

		this.imgLoading = 0;

		//зум
		this.zoom;

		this.mode = cnst.townMode.camera;

		/*
			Системы отсчета:
			W - масштаб окна
			O - масштаб 1:1
			с - от центра
			tl - верхний левый угол	
		*/

		// Размер вида
		this.sizeO = {x: 2400, y: 1400};

		this.sizeOMain = {x: 1920, y: 1200,	disp: {x: 240, y: 0}};
		// Размер значимой области вида - страемся, чтобы она целиком попадала в вид
		this.sizeOMin = {x: 1280, y: 750};
		//размер отображения вида
		this.sizeW = {};
		//смещение вида относительно края экрана
		this.posOtlWtl = {x: 0, y: 0};
		//смещение точки обзора относительно центра вида
		this.posWcOcO = {x: 0, y: 0};

		this.cloudSet = {
			width: 3000,//ширина облака (px)
			minDist: 100,//минимальное расстояние между облаками (px)
			speed: 0.01, //максимальная скорость облаков (px/ms)
			count: 3,//максимальное число облаков
			cloudId: 8, //количество идентификаторов облаков
			cloudType: 2, //количество типов облаков
			clearProb: 1/30 //вероятность отсутствия облаков
		};

		this.ufoSet = {
			deLorean: {
				speed: 0.5,
				xStartDelay: 100,
				maxHeight: 100,
				averageMin: 3600,
				averageMax: 7200,
				chance: 100,
				img: 'back2future_2',
				imgSize: true,
				imgDir: true,
				imgZ: true
			},
			pepelats: {
				speed: 0.3,
				xStartDelay: 100,
				maxHeight: 100,
				averageMin: 3600,
				averageMax: 7200,
				chance: 100,
				img: 'pepelats'
			}
		};

		//слои, состоят из изображений
		this.layerStat = [];
		this.layerDyn = [];

		this.layerDynCache = {};

		//структура, содержащая избранные объекты в удобном виде
		this.objNames = {};
	};
	
	bckTown.prototype.bindTouchEvent = function(){
		var self = this;
		
		this.touchDist = 0;
		
		this.wrp
				.on('touchstart', '#town-canvas', function(e){
					self.touchStart(e.originalEvent);
				})
				.on('touchmove', '#town-canvas', function(e){
					self.touchMove(e.originalEvent);
				})
				.on('touchend touchcancel', '#town-canvas',function(e){
					self.touchEnd(e.originalEvent);
				});
	};
	
	bckTown.prototype.touchStart = function(e){
		this.handleTouchEvent(e);
		
		if( e.touches.length != 1 )
			return;
		
		this.toggleHover(false);

		this.mouseHold = true;

		this.posClickWtl = this.getTouchPos(e.touches[0]);

		this.posWtl = this.posClickWtl;
	};
	
	bckTown.prototype.touchMove = function(e){
		this.handleTouchEvent(e);
		
		if( e.touches.length == 1 && !this.zooming ){
			var newPosWtl = this.getTouchPos(e.touches[0]);
			
			this.onMouseMove(newPosWtl);
		}
		
		this.touchZoom(e);
		
		this.touchMoved = true;
	};
	
	bckTown.prototype.touchEnd = function(e){
		this.handleTouchEvent(e);
		
		this.setZooming(false);
		
		this.mouseHold = false;

		if( !this.touchMoved )
			this.onMouseClick();
		
		this.touchMoved = false;
	};
	
		bckTown.prototype.handleTouchEvent = function(e){
			e.preventDefault();
		};
	
	bckTown.prototype.touchZoom = function(e){
		if( e.touches.length == 2 ){
			this.setZooming(true);
			
			var touch1 = this.getTouchPos(e.touches[0]),
				touch2 = this.getTouchPos(e.touches[1]),
				touchDist = Trade.calcDistance(touch1, touch2);
			
			if( this.touchDist ){
				var zoomK = touchDist / this.touchDist;
				
				this.setZoom(this.zoom * zoomK);
				
				this.centerView();
			}
			
			this.touchDist = touchDist;
		} 
		else
			this.touchDist = 0;
	};
	
	bckTown.prototype.setZooming = function(state){
		this.zooming = state;
	};
	
	bckTown.prototype.isZooming = function(){
		return this.zooming;
	};
	
	bckTown.prototype.getTouchPos = function(touch){
		return utils.getPosFromEvent(touch, 'page');
	};
	
	bckTown.prototype.bindMouseEvent = function(){
		var self = this;
		
		this.wrp
				.on('mousedown', '#town-canvas', function(e, pos){
					self.mouseHold = true;

					self.posClickWtl = pos||utils.getPosFromEvent(e, 'offset');

					self.posWtl = self.posClickWtl;
				})
				.on('mouseup', '#town-canvas', function(e, pos){
					var posClickWtl = pos||utils.getPosFromEvent(e, 'offset');

					var disp = utils.objMath(posClickWtl, '-', self.posClickWtl);

					if( Math.abs(disp.x) < 3 && Math.abs(disp.y) < 3 )
						self.onMouseClick(posClickWtl);

					delete self.objOver;

					delete self.posClickWtl;

					self.mouseHold = false;
				})
				.on('mousemove', '#town-canvas', function(e, pos){
					var newPosWtl = pos||utils.getPosFromEvent(e, 'offset');
					
					self.onMouseMove(newPosWtl);
				})
				.on('mouseleave', '#town-canvas', function(e){
					if( $(e.toElement).is('.tooltip-cnt') )
						return false;
					
					self.clearObjectsStatus();
					
					self.checkHover = 
					self.mouseHold = false;

					self.clearTimeout(self.tooltipTimout);
					
					tooltipMgr.hide();
				})
				// Зум
				.on('mousewheel', '#town-canvas', function(event){
					if( !wofh.platform.mouseScroll && !utils.isFullScreen() )
						return;
					
					self.setZoom(self.zoom + event.deltaY * 0.1);
					
					self.centerView();
				});
	};
	
	bckTown.prototype.bindBuildQueueEvent = function(){
		var self = this;
		
		this.wrp
			//отмена строительства
			.on('click', '.town2-bldEvent-del', function(){
				var $this = $(this);

				if( $this.hasClass('-disabled') )
					return;

				var eventI = $this.data('pos'),
					event = wofh.events.getTownEvents().getBldQueue().getList()[eventI];
					
				if( !event )
					return;
					
				wndMgr.addConfirm(tmplMgr.bldqueue.alert.cancel({event: event})).onAccept = function(){
					eventI = wofh.events.getTownEvents().getBldQueue().getElemPos(event);

					if( eventI === false ) return false; // Если события уже нет в очереди

					self.setCanBldEvent($this, false);
					
					var loaderId = contentLoader.start(
						$this, 
						0, 
						function(){
							reqMgr.buildQueueCancel(eventI, false, {
								onFail: function(){
									contentLoader.stop(loaderId);
									
									self.setCanBldEvent($this, true);
								}
							});
						},
						{icon: ContentLoader.icon.small, cssPosition: {top: 8, left: 8}}
					);
					
					// Если при полном разрушении здания было открыто окно строительства, закрываем его если разрушение было отменено
					if( Slot.actionsIds.destroy == event.getAction() ){
						var wnd = wndMgr.getWndById(event.getSlotPos(), wSlotNew);

						if( wnd ) wnd.close();
					}
				};
			})
			//ускорение строительства
			.on('click', '.town2-bldEvent-imm', function(){
				var $this = $(this);

				if( $this.hasClass('-disabled') )
					return;

				var err = wofh.town.getSlots().canBuildUp();

				if( err.isOk() )
					self.buildQueueImm($this);
				else
					wndMgr.addAlert(tmplMgr.bldqueue.alert.immediate());
			});
	};
        
        bckTown.prototype.buildQueueImm = function($el){
            var self = this;
            
            this.setCanBldEvent($el, false);
			
            var loaderId = contentLoader.start(
                $el, 
                0, 
                function(){
                    reqMgr.buildQueueImm(false, {
                        onFail: function(){
                            contentLoader.stop(loaderId);

                            self.setCanBldEvent($el, true);
                        }
                    });
                },
                {icon: ContentLoader.icon.small, cssPosition: {top: 8, left: 8}}
            );
        };
	//запускаем отрисовку
	bckTown.prototype.startDrawView = function(resetMoment){
		this.drawStop = false;
		
		if( resetMoment )
			this.moveMoment = timeMgr.getNowLocMS();
		
		this.requestDrawView();
	};
	//запрещаем отрисовку
	bckTown.prototype.stopDrawView = function(){
		this.drawStop = true;
	};
	
	bckTown.prototype.process = function(){
		this.sortLayer(this.layerDyn);
		
		this.hoverTracking(this.posWtl);
		
		this.calcMove();
		
		this.moveUnits();
		
		this.moveClouds();
		
		this.moveUFO();
	};
	
	bckTown.prototype.render = function(){
		this.moveSlotQueue();
		
		if( this.layerStat && this.refreshBack )
			this.refreshBack = !this.drawLayer(this.canvas0, this.layerStat, true);
		
		this.drawLayer(this.canvas, this.layerDyn);
	};
	
	bckTown.prototype.requestRender = function(){
		return window.requestAnimFrame(this.render);
	};
	
	bckTown.prototype.requestDrawView = function(){
		return window.requestAnimFrame(this.drawView);
	};
	
	bckTown.prototype.drawView = function(){
		if( this.isDrawStop() ) 
            return;

		this.process();

		this.render();

		this.clearDrawViewTimeout();
		
		this.to = this.setTimeout(this.requestDrawView, 28);
	};
	
	bckTown.prototype.clearDrawViewTimeout = function(){
		this.clearTimeout(this.to);
	};
	
	bckTown.prototype.isDrawStop = function(){
		return this.drawStop;
	};
	
	//сортировка слоя передний-задний план
	bckTown.prototype.sortLayer = function(layer){
		if( !layer ) return;
		
		layer.sort(function(a, b){
			return a.getZ() - b.getZ();
		});
	};
	
	bckTown.prototype.drawLayer = function(canvas, layer, isLayerStat){
		if( layer )
			this.clearCanvas(canvas);

		var	isTownShown = bckTown.shownTowns[wofh.town.id], 
			allDrawn = isLayerStat || isTownShown ? true : !(this.imgLoading > 0);

		for (var i = 0; i < layer.length; i++){
			var obj = layer[i];

			obj.beforeDraw();

			if( obj.isShow() ){
				if( isTownShown && !isLayerStat )
					obj.draw(canvas);
				else
					allDrawn = allDrawn && obj.draw(canvas);
			}
		}

		if( !isLayerStat && allDrawn )
			bckTown.shownTowns[wofh.town.id] = true;

		return allDrawn;
	};
	
	bckTown.prototype.preDrawLayer = function(layer){
		for (var i = 0; i < layer.length; i++)
			layer[i].beforeDraw();
	};
	
	bckTown.prototype.getDefZoom = function(){
        return wofh.platform.mouseScroll && !utils.isTouchDevice() ? 1 : cnst.town2.minZoom;
    };
	
	bckTown.prototype.setCanBldEvent = function($el, state){
		$el.closest('.town2-bldEvents').find('.town2-bldEvent-del, .town2-bldEvent-imm').toggleClass('-disabled', !state);	
	};
	
	bckTown.prototype.onMouseMove = function(newPosWtl){
		if( this.modeSwap )
			notifMgr.runEvent(Notif.ids.townSwapSlotTimer);        
		
		this.checkHover = true;
		
		this.viewPosTracking(newPosWtl);
		
		this.posWtl = newPosWtl;
	};
	
	bckTown.prototype.hoverTracking = function(posWtl){
		if ( this.mouseHold || !this.checkHover ) return;
		
		this.clearObjectsStatus();
		
		var list = this.sortObjList(this.getObjectsAt(posWtl)),
			noHoverAction = true;
		
		for(var obj in list){
			obj = list[obj];
			
			if( obj.onHover(posWtl) == true ){
				noHoverAction = false;
				
				break;
			}
		}
		
		if( noHoverAction )
			this.clearTimeout(this.tooltipTimout);
		
		tooltipMgr.hide({voiceHelper:{noClean: !noHoverAction}});
		
		this.checkHover = false;
	};
	
	bckTown.prototype.viewPosTracking = function(newPosWtl){
		if ( !this.mouseHold ) return;
		
		var dispO = utils.objMath(utils.objMath(newPosWtl, '-', this.posWtl), '/', this.zoom);
		
		if( this.mode != cnst.townMode.camera && this.objOver ){
			this.objOver.posView = utils.objMath(this.objOver.posView, '+', dispO);
			
			//Выводим в консоль данные о строении
			if( this.mode == cnst.townMode.dragObj ){
				var slot = this.objOver.info,
					slotPos = bckTown.slots[slot.getPos()][this.getSlotType(slot.getPos()) - 1].buildPos,
					dispStore = [];
				
				dispStore[0] = Math.round(this.objOver.posView.x - slotPos.x - this.sizeO.x / 2);
				dispStore[1] = Math.round(this.objOver.posView.y - slotPos.y - this.sizeO.y / 2 + 100);
				
				if( this.objOver.type == cnst.townObjType.build ){
					console.warn('СТРОЕНИЕ ', slot.id);
					console.warn('dNew', dispStore);
				} 
				else{
					console.warn('ТАБЛИЧКА ', slot.id);
					console.warn('tdNew', dispStore);
				}
			}
		}
		else{
			this.posWcOcO = {
				x: this.posWcOcO.x - dispO.x * 2, 
				y: this.posWcOcO.y - dispO.y * 2
			};
			
			this.checkViewBounds();
			
			this.centerView();
		}
		
		this.requestRender();
	};
	
	
    //обработка клика
	bckTown.prototype.onMouseClick = function(posWtl) {
		posWtl = posWtl||this.posWtl;
		
		if( this.modeSwap )
			notifMgr.runEvent(Notif.ids.townSwapSlotTimer);
		
		if (this.mode == cnst.townMode.road) {
			this.roadClick();
		} 
		else{
            var list = this.sortObjList(this.getObjectsAt(posWtl));
			
            for(var obj in list){
                obj = list[obj];
				
                if( obj.onClick(posWtl) == true )
                    return;
            }
		}
		
		this.checkHover = true;
		
		this.hoverTracking(posWtl);
	};
	
    //отключаем наведение у всех объектов
    bckTown.prototype.clearObjectsStatus = function(){
		this.toggleHover(false);
		
		for (var obj in this.layerDyn) {
			obj = this.layerDyn[obj];
			
			if (!obj) continue;
			
            if( obj.clearStatus )
                obj.clearStatus();
		}
    };
    
    bckTown.prototype.showTooltip = function(pos, text){
		tooltipMgr.prepareVoiceHelper({text: text});
		
		this.clearTimeout(this.tooltipTimout);
		
		this.tooltipTimout = this.setTimeout(function(){
			tooltipMgr.show(text, pos, {posSqr: {left: 10, right: 30, top: 10, bottom: 10}, voiceHelper: {noClean: true}});
		}, 300);
    };
	
	//выбор объекта по экранной позиции - новая
	bckTown.prototype.getObjectsAt = function(posWtl) {
		//получаем координаты
		var posOc = this.getPosOcByWtl(posWtl);
		
		//находим все объекты
		var selected = [];
		for (var obj in this.layerDyn) {
			obj = this.layerDyn[obj];
			
            if (!obj.isShow() && !obj.isInvis()) continue;
			
            if (obj.isPosWithin(posOc)){
				selected.push(obj);
            }
		}
		
		return selected;
    };
    
	//выбор объекта по экранной позиции - новая
	bckTown.prototype.sortObjList = function(list) {
		if( !list ) return false;
		
		list.sort(function(a, b){
            return a.getZ() > b.getZ()? -1 : 1;
        });
        
        return list;
    };
	
	//Преобразование мировых координат к экранным
	bckTown.prototype.getPosOcByWtl = function(posWtl) {
		return {
			x: (posWtl.x - this.posOtlWtl.x) / this.zoom,
			y: (posWtl.y - this.posOtlWtl.y) / this.zoom
		};
	};
	
	//Обратное Преобразование
	bckTown.prototype.getPosWtlByOc = function(posOc) {
		return {
			x: this.posOtlWtl.x + posOc.x * this.zoom,
			y: this.posOtlWtl.y + posOc.y * this.zoom
		};
	};

//ОБЛАКА

    bckTown.prototype.initClouds = function(){
        this.objNames.clouds = [];
		
        this.cloudSpeed = ((Math.random() * 2) - 1) * this.cloudSet.speed; // скорость пикселей в милисекунду
        this.cloudCount = utils.toInt(Math.random() * this.cloudSet.count) + 1; // среднее кооличество облаков - количество облаков на старте
        if ( (Math.random() < this.cloudSet.clearProb) ) this.cloudCount = 0;
		
        for (var i = 0; i < this.cloudCount; i++){
            this.addCloud();
        }
    };
    
    
    bckTown.prototype.addCloud = function(){
        var posView = {x: Math.random() * (this.cloudSet.width + this.sizeO.x) - this.cloudSet.width, y: 0};
        var cloudId = utils.toInt(Math.random()*this.cloudSet.cloudId) + 1;
        var cloudType = utils.toInt(Math.random() * this.cloudSet.cloudType) + 1;
        var img = new CanvasImg({
            town: this,
            img: this.getImg('https://test.waysofhistory.com/img/town2/clouds-'+wofh.town.getClimate()+'_'+cloudId+'_'+cloudType+'.png'), 
            z: -95 - cloudType, 
            posView: posView, 
            type: cnst.townObjType.other
        });
        this.layerDyn.push(img);
		
        this.objNames.clouds.push(img);
    };
    
    bckTown.prototype.moveClouds = function(){
        for (var img in this.objNames.clouds) {
            img = this.objNames.clouds[img];
			
            img.posView.x += this.cloudSpeed * this.movePeriod;
			
            if( img.posView.x < -this.cloudSet.width ) 
				img.posView.x = this.sizeO.x;
            if( img.posView.x > this.sizeO.x )
				img.posView.x = -this.cloudSet.width;
        }
    };
    
//ДЕЛОРИАН
    bckTown.prototype.initUFO = function(){
        this.clearLayer(this.layerDyn, [cnst.townObjType.ufo]);
		
        delete this.objNames.ufo;
        
        this.clearTimeout(this.ufoTO);
            
        for (var objSet in this.ufoSet) {
            objSet = this.ufoSet[objSet];
            if ( utils.toInt(Math.random()*objSet.chance) != 0 ) continue;
            
            this.curUFOSet = objSet;
			
            var delay = (Math.random()*(objSet.averageMax-objSet.averageMin)+objSet.averageMin) * 1000;
			
            this.ufoTO = this.setTimeout(function(){
                var dir = (Math.random() > 0.5 ? 1 : -1);
                var size = 1 + (objSet.imgSize ? utils.toInt(Math.random()*2) : 0);
                var speed = objSet.speed * dir / size;

                var imgName = objSet.img;
                if (objSet.imgDir) {
                    imgName += (dir == 1 ? 'right' : 'left');
                }
                if (objSet.imgSize) {
                    imgName += size;
                }
                
                var posView = {
					x: dir == 1 ? -objSet.xStartDelay : this.cloudSet.width + objSet.xStartDelay, 
					y: Math.random() * objSet.maxHeight
				};
				
				var img = new CanvasImg({
					town: this,
					img: this.getImg('https://test.waysofhistory.com/img/town2/ufos/' + imgName + '.png'),
					z: 200,
					posView: posView,
					type: cnst.townObjType.ufo,
					info: {
                        xSpeed: speed,
                        ySpeed: (Math.random()-0.5)*0.05
					},
					show: true
				});
				
                this.layerDyn.push(img);
                this.objNames.ufo = img;
            }, delay);
        }
    };
    
    bckTown.prototype.moveUFO = function(){
        var img = this.objNames.ufo;
		
        if( !img ) 
			return;
        
        img.posView.x += img.info.xSpeed * this.movePeriod;
        if (img.posView.x < -this.curUFOSet.xStartDelay || img.posView.x > this.cloudSet.width + this.curUFOSet.xStartDelay){
            this.initUFO();
            return;
        }
        
        var ySpeed = img.info.ySpeed;
        
        //ySpeed += (Math.random()-0.5)*0.1;
        if (img.posView.y <= 0) ySpeed = 0;
        if (img.posView.y >= this.curUFOSet.maxHeight) ySpeed = 0;
                
        img.posView.y += ySpeed * this.movePeriod;
        img.info.ySpeed = ySpeed;
    };
    
//ЗУМ
	//инициализируем зум
	bckTown.prototype.initZoom = function(){
		this.setZoom((wofh.platform.fullscreenbutton && wofh.platform.inframe) ? this.getDefZoom() : +ls.getTownZoom(this.getDefZoom()));
	};
	
	//выставляем зум
	bckTown.prototype.setZoom = function(zoom, ignore){
		if( ignore === true ) return;
		
		if( ls.getTownZoomLock(0) ){
			this.posWcOcO = {x: 0, y: 0};
			
			this.zoom = ls.getTownZoom(this.getDefZoom());
			
			this.centering(this.needCenterX(), this.needCenterY()); // Центрируем, чтобы небыло смещений при смене зума
		}
		else{
			this.zoom = zoom ? zoom : this.getDefZoom();
			
			this.zoom = Math.min(cnst.town2.maxZoom, this.zoom);
			
			ls.setTownZoom(+this.zoom.toFixed(2));	
		}

		this.checkViewBounds();
		
		this.showZoom();
	};
	
	bckTown.prototype.setMinZoom = function(){
		this.setZoom(cnst.town2.minZoom);
	};
	
	//проверка влезания всего
	bckTown.prototype.checkViewBounds = function() {
		this.centerView();
		
		if( !this.sizeW || this.sizeW.x === undefined ) 
			return;
	
		//если зум не залочен, то вычисляем зум
		if( ls.getTownZoomLock(0) == 0 ){
			//var minZoom = Math.max(this.sizeW.x / sizeO.x, this.sizeW.y / sizeO.y);//чтобы всё помещалось
			var minZoomX = this.sizeW.x / this.sizeO.x;
			var minZoomY = this.sizeW.y / this.sizeO.y;
			var minZoom = Math.max(minZoomX, minZoomY);
			var newZoom = Math.max(this.zoom, minZoom);
			
			if( newZoom != this.zoom )
				this.setZoom(Math.max(this.zoom, minZoom), utils.isTouchDevice());
		}
		
		//проверяем, влезает ли весь контент
		var centerX = this.needCenterX(),
			centerY = this.needCenterY();
		
		//если контент не влезает, центрируем его
		this.centering(centerX, centerY);
		
		//перемещаем так, чтобы не было видно края (если весь контент влезает)
        var pos0 = this.getPosWtlByOc({x:0, y: 0});
        if( !centerX && pos0.x > 0 )
            this.posWcOcO.x = this.sizeW.x / this.zoom - this.sizeO.x;
        if( !centerY && pos0.y > 0 )
            this.posWcOcO.y = this.sizeW.y / this.zoom - this.sizeO.y;
		
        var pos0 = this.getPosWtlByOc({x:this.sizeO.x, y: this.sizeO.y});
        if(!centerX && pos0.x < this.sizeW.x )
            this.posWcOcO.x = - (this.sizeW.x / this.zoom - this.sizeO.x);
        if( !centerY && pos0.y < this.sizeW.y )
            this.posWcOcO.y = - (this.sizeW.y / this.zoom - this.sizeO.y);
	};
	
	bckTown.prototype.showZoom = function(){
		this.wrp.find('.town-zoom').html(Math.round(this.zoom * 100)+'%');
        this.wrp.find('.town-zoom').addClass('-active');
		
        if( !wofh.account.isAdmin() ){
            this.clearTimeout(this.zoomTO);
			
            this.zoomTO = this.setTimeout(function(){
                this.wrp.find('.town-zoom').removeClass('-active');
            }, 4000);
        }
	};
	
	bckTown.prototype.needCenterX = function(){
		return (this.sizeW.x||0) > this.sizeO.x * this.zoom;//следует ли центрировать по оси x;
	};
	
	bckTown.prototype.needCenterY = function(){
		return (this.sizeW.y||0) > this.sizeO.y * this.zoom;//следует ли центрировать по оси y;
	};
	
	bckTown.prototype.centering = function(centerX, centerY){
		if( centerX )
			this.posWcOcO.x = (this.sizeW.x - this.sizeO.x * this.zoom)/2;
		
		if( centerY )
			this.posWcOcO.y = (this.sizeW.y - this.sizeO.y * this.zoom)/2;
	};
	
	//апдейт вида - на перемещение, зум
	bckTown.prototype.centerView = function(){
		this.posOtlWtl.x = (this.sizeW.x - (this.sizeO.x + this.posWcOcO.x) * this.zoom) / 2;
		this.posOtlWtl.y = (this.sizeW.y - (this.sizeO.y + this.posWcOcO.y) * this.zoom) / 2;
		
		this.refreshBack = true;
	};
	
//ЗАГРУЗКА ИЗОБРАЖЕНИЙ
	
	//возвращает объект картинки и начинает её загрузку
	bckTown.prototype.getImg = function(path){
		var pathArr = path.split('/'), //путь
			imgName = pathArr.splice(-1);//имя файла
		
		if( !pathArr[0] )
			pathArr.shift();
		
		var resList = bckTown.resList;
		
		for(var item in pathArr){
			item = pathArr[item];
			
			if( !resList[item] )
				resList[item] = {};
			
			resList = resList[item];
		}
		
		if( !resList[imgName] )
			resList[imgName] = this.loadImg(path);
		
		return resList[imgName];
	};
	
	//загрузка изображения
	bckTown.prototype.loadImg = function(url){
        var self = this;
        
		var img = new Image(); 
		
		img.onerror = function(){
			self.checkLoadImg(false);
			
			console.error('Can\'t load image: ' + url);
			
			this.onload = this.onerror = null; // Избавляемся от утечки памяти. Т.к. img храниться в статическом свойстве класса bckTown, то тянет за собой self через замыкание.
		};
		
		img.onload = function(){
			self.checkLoadImg(false);
			
			this.onload = this.onerror = null; // Избавляемся от утечки памяти. Т.к. img храниться в статическом свойстве класса bckTown, то тянет за собой self через замыкание.
		};
		
		this.checkLoadImg(true);
		
		img.src = url;
		
		return img;
	};
	
	bckTown.prototype.checkLoadImg = function(inc){
		this.imgLoading += inc ? 1 : -1;
		
		if( this.parent.loadIndicator )
			this.parent.loadIndicator.toggle(this.imgLoading > 0);
	};
	
	
//ДАННЫЕ ОБЪЕКТОВ
	
	//получение размеров объекта
	bckTown.prototype.getObjSize = function(obj){
		if(!obj.size) return {x: obj.img.width, y: obj.img.height}
		return obj.size;
	}
	
	
//РАБОТА СО СЛОЕМ
	
    bckTown.prototype.clearLayer = function(layer, typesArr){
		for (var i = 0; i < layer.length; ){
			var obj = layer[i];

			if( utils.inArray(typesArr, obj.type) ){
				obj = layer.splice(i, 1)[0];

				if( obj.getCacheId() )
					this.layerDynCache[obj.getCacheId()] = obj; // Записываем в хранилище ранее отрисовываемый объект
			}
			else
				i++;
		}
    };
    
    
	//нужно для ведения id, чтобы удалять объекты можно было. 
	bckTown.prototype.getObjects = function(layer, type){
        var list = [];
        for (var i = 0; i < layer.length; i++){
            var obj = layer[i];
            if (obj.type == type) {
                list.push(obj);
            }
        }
        return list;
	};
    
	//нужно для ведения id, чтобы удалять объекты можно было. 
	bckTown.prototype.pushObj = function(layer, obj){
		layer.push(obj);
	}
    
	bckTown.prototype.removeObj = function(layer, obj){
		for (var i in layer) {
			if (layer[i] == obj) {
				layer.splice(i, 1);
				return;
			}
		}
	};
	
	bckTown.prototype.cloneLayer = function(layer){
		var clone = [];
		
		for(var i = 0; i < layer.length; i++) 
			clone[i] = layer[i];
		
		return clone;
	};
	
	
	
//ИНИЦИАЛИЗАЦИЯ ОБЪЕКТОВ
	
	//инициализация города
	bckTown.prototype.initTown = function(){
		this.clearCanvas(this.canvas);
		this.clearCanvas(this.canvas0);
		
		this.refreshBack = true;
		this.objNames = {};
		this.layerStat = [];
		this.layerDyn = [];
		this.moversList = false;
		
		this.preloadRes(); // Подгружаем заранее некоторые ресурсы
		
		this.initTownBack();
		
		this.initTownSlots();
		
		if( wofh.account.isAdmin() ){
            this.initRoadPoints();
			
            this.initSlotPoints();
        }
		
		if( ls.getMoversAnim(true) )
			this.initTownMovers();
		
		if( !wofh.account.hasRainbowMode() )
			this.initClouds();
        
        this.initUFO();
        //this.initDeLorean();
        
        this.initClickers();
		
		if( wofh.account.isAdmin() )
			this.initClickersLabels();

		var garbage = +utils.urlToObj().garbage;
		
		if( garbage )
			this.initGarbage(garbage);
	};
    
	bckTown.prototype.preloadRes = function(){
		if( !utils.isEmpty(bckTown.resList) )
			return false;
		
		var resList = [];
		
		// Плашки уровней слотов
		for(var i = 0; i < 6; i++)
			resList.push('https://test.waysofhistory.com/img/town2/building_lvl'+i+'.png');
		
		// Задники городов по климатам
		var townClimates = {};
		for(var town in wofh.towns)
			townClimates[wofh.towns[town].climate] = true;
		
		for(var clim in townClimates)
			resList.push('https://test.waysofhistory.com/img/town2/backgrounds-2/' + clim + '/plate.jpg');
		
		
		for(var res in resList)
			this.getImg(resList[res]);
	};
	
	bckTown.prototype.initGarbage = function(count){
		while(count){
			count--;

			var imgId = utils.random(664) + 1;/*1-664*/
			var posView = {
				x: utils.random(1500) + 300,
				y: utils.random(1000)
			};
			var z = utils.random(2000);

			this.layerDyn.push(new CanvasImg({
	            town: this,
	            img: this.getImg('https://test.waysofhistory.com/img/town2/houses/kill_after_test/'+imgId+'.png'), 
	            type: cnst.townObjType.other,
				posView: posView,
				z: z
	        }));
		}
	};
	
	//инициализация фона для города
	bckTown.prototype.initTownBack = function(){
		var terrain = wofh.town.getType();
		
		var clim = wofh.town.climate;
		var hill = terrain.hill==3;
		var water = terrain.water;
		
		var pathC = 'https://test.waysofhistory.com/img/town2/backgrounds-2/' + clim + '/';
		var pos = this.sizeOMain.disp;
		
        this.layerStat.push(new CanvasImg({
            town: this,
            img: this.getImg(pathC + 'plate.jpg'), 
            z: -100, 
            type: cnst.townObjType.other
        }));
		
		if (hill) {
			this.layerDyn.push(new CanvasImg({
                town: this,
                img: this.getImg(pathC+'hill.png'), 
                z: -85, 
                type: cnst.townObjType.other
            }));
		}
		
		this.layerDyn.push(new CanvasImg({
            town: this,
            img: this.getImg(pathC+'center.png'), 
            z: -90, 
            type: cnst.townObjType.other
        }));
		
		this.layerDyn.push(new CanvasImg({
            town: this,
            img: this.getImg(pathC+'layer0.png'), 
            z: -80, 
            type: cnst.townObjType.other
        }));
		
		if( water ){
			this.layerStat.push(new CanvasImg({
                town: this,
				img: this.getImg(pathC+'w'+water+'.png'), 
				z: -90, 
				posView: cnst.town2.backWater,
				type: cnst.townObjType.other
			}));
		}
		
		if( this.hasWonderBay() ){
			this.layerStat.push(new CanvasImg({
                town: this,
                img: this.getImg(pathC+'w.png'), 
                z: -80, 
                type: cnst.townObjType.other
            }));
		}
		
		if( wofh.account.isAdmin() ){
			var obj = new CanvasImg({
                town: this,
                img: this.getImg('https://test.waysofhistory.com/img/gui/town2/terrain/slots.png'), 
                z: 100, 
                posView: pos, 
                type: cnst.townObjType.other, 
                show: false
            });
			this.objNames.slots = obj;
			this.layerDyn.push(obj);
            
			var obj = new CanvasImg({
                town: this,
                img: this.getImg('https://test.waysofhistory.com/img/town2/shadow.png'), 
                z: 100000, 
                posView: {x: 0, y: 197}, 
                type: cnst.townObjType.shadow, 
                show: false});
			
			obj.draw = function(canvas){
				var operation = canvas.globalCompositeOperation;
				
				canvas.globalCompositeOperation = 'darken';
				
				CanvasImg.prototype.draw.apply(this, arguments);
				
				canvas.globalCompositeOperation = operation;
			};
			
			this.objNames.shadow = obj;
			
			this.layerDyn.push(obj);
		}
		
		this.initTownObj();
	};
	
	bckTown.prototype.hasWonderBay = function(){
		var terrain = wofh.town.getType();
		var water = terrain.water;
		
		if (water > 1) {
			var wonder = wofh.town.slots.getElem(Build.slotGroup.wonder);
			var event = wonder.getEvent();
			if (event && event.getAction() != Slot.actionsIds.destroy && event.getAction() != Slot.actionsIds.destroylevel){
				wonder = wonder.applyEvent();
			} 
			if (wonder.isWaterWonder() || (wonder.isEmpty() && wofh.town.id%2)){
				return true;
			}
		}
		
		return false;
	};
	
	//инициализация строений города
	bckTown.prototype.initTownSlots = function(){
		this.objNames.slotLabel = {};
		this.objNames.slotLabelLevel = {};
		this.objNames.slotLabelStar = {};
		this.objNames.slotGroup = {};
		this.objNames.slotSwapGroup = {};
		this.objNames.toggleIf = [];
		
		var layer = this.layerDyn;
		
        this.clearLayer(layer, [
			cnst.townObjType.slotAura,
			cnst.townObjType.build,
			cnst.townObjType.slot,
			cnst.townObjType.eventStat,
			cnst.townObjType.eventTimer,
			cnst.townObjType.slotLabel,
			cnst.townObjType.slotLabelStar
		]);
		
		for (var slotId in wofh.town.slots.getList()) {
			var slot = wofh.town.slots.getElem(slotId);
            
            var slotGroup = new CanvasGroup({
				town: this, 
				slotHover: false, 
				isPerimetr: slot.getSlotType() == Build.slotType.perimetr,
				needLoadCheck: true
			});
			
			this.objNames.slotGroup[slot.getPos()] = slotGroup;
            
			this.initSlot(slot, slotGroup);
			
			if( slot.canShow() ){
				var selDisp = bckTown.slots[slot.getPos()].auraPos;
				
				//свечение
                var imgPath = 'https://test.waysofhistory.com/img/town2/quarter-' + slot.getPos() + '_' + (this.getSlotType(slot.getPos()) - 1) + '.png';
                
				var auraBlink = new CanvasImg({
                    town: this,
                    name: 'auraBlink',
					img: this.getImg(imgPath), 
					posView: {
						x: this.sizeO.x / 2 + selDisp.x, 
						y: this.sizeO.y / 2 - 100 + selDisp.y + (slot.getId() == Slot.ids.wall ? 10 : 0)},
					info: {slot: slot},
					type: cnst.townObjType.slotAura,
					realZ: slotGroup.getSlotRealZ() - 1,
					alpha: 0,
                    anim: {blink: {}}
				});
				
                auraBlink.beforeDraw = function(){
                    this.show = (this.alpha > 0.1 || this.parent.slotHover) && !this.town.modeSwap;
					
                    if( this.show ){
						if( this.parent.slotHover ){
							if( this.parent.isPerimetr )
								this.z = this.realZ + cnst.town2.z.bldSel;
							else
								this.z = cnst.town2.z.bldSel - 1;
						}
						else
							this.z = this.realZ;
						
                        this.animBlink();
					}
					else if( this.anim.blink.start ){
						this.anim.blink.start = 0; // Сбрасываем в 0, чтобы анимация начиналась с одного и тогоже момента
						
						this.z = this.realZ;
					}
                };
				
				this.pushObj(layer, auraBlink);
				
				slotGroup.addChild(auraBlink);
				
				if( 
					!slotGroup.isPerimetr && 
					slot.canSwapErr() == Slot.buildErr.ok
				){
					var pos = bckTown.slots[slot.getPos()][this.getSlotType(slot.getPos()) - 1].buildPos;
					
					var auraSwap = new CanvasImg({
						town: this,
						name: 'auraSwap',
						img: this.getImg('https://test.waysofhistory.com/img/gui/town/move_building_net-blue.png'), 
						imgInactive: this.getImg('https://test.waysofhistory.com/img/gui/town/move_building_net-gray.png'),
						posView: {
							x: pos.x + this.sizeO.x / 2 - 135, 
							y: pos.y + this.sizeO.y / 2 - 100 + 30},
						info: {slot: slot},
						type: cnst.townObjType.slotAura,
						show: false,
						alpha: 0.8,
						z: cnst.town2.z.slotAuraSwap
					});
					
					auraSwap.getImg = function(){
						if( 
							this.town.modeSwap && 
							this.town.modeSwap.slot && 
							this.town.modeSwap.slot.getSlotType() != this.info.slot.getSlotType()
						)
							return this.imgInactive;
						
						return this.img;
					};
					auraSwap.beforeDraw = function(){
						if( !this.show )
							return;
						
						if( this.town.modeSwap.slot && this.town.modeSwap.slot.getPos() == this.info.slot.getPos() )
							this.alpha = 1;
						else
							this.alpha = 0.8;
					};
					
					this.pushObj(layer, auraSwap);
					slotGroup.addChild(auraSwap);
					
					var auraSwapActive = new CanvasImg({
						town: this,
						name: 'auraSwapActive',
						img: this.getImg('https://test.waysofhistory.com/img/gui/town/move_building_net-yellow.png'), 
						posView: {
							x: pos.x + this.sizeO.x / 2 - 135, 
							y: pos.y + this.sizeO.y / 2 - 100 + 30},
						info: {slot: slot},
						type: cnst.townObjType.slotAura,
						invis: true,
						show: false,
						alpha: 0.8,
						z: cnst.town2.z.slotAuraSwap + 1,
						anim: {blink: {}}
					});
					
					auraSwapActive.beforeDraw = function(){
						if( this.isShow() )
							this.animBlink();
					};
					auraSwapActive.isShow = function(){
						if( this.show && this.parent.slotHover ){
							if( !this.town.modeSwap.slot )
								return true;
							
							return	this.info.slot.getSlotType() == this.town.modeSwap.slot.getSlotType() && 
									this.info.slot.getPos() != this.town.modeSwap.slot.getPos()
						}
						
						return false;
					};
					
					this.pushObj(layer, auraSwapActive);
					slotGroup.addChild(auraSwapActive);
				}
			}
		}
		
		this.initSlotsSwap(layer);
		
        this.showSlotQueue();
		
		this.updIftoggle();
		
		this.layerDynCache = {};
	};
    
	bckTown.prototype.initSlotsSwap = function(layer){
		var slotSwap = new CanvasImg({
			town: this,
			name: 'slotSwap',
			img: false, 
			posView: {x: 0, y: 0},
			info: {},
			type: cnst.townObjType.slot,
			show: false,
			alpha: 1,
			z: cnst.town2.z.slotSwap
		});

		slotSwap.beforeDraw = function(){
			if( !this.town.modeSwap || !this.town.modeSwap.slot ){
				if( this.info.slot )
					this.info = {};

				return;
			}
			else if( this.info.slot ){
				this.posView.x = this.town.posWtl.x;
				this.posView.y = this.town.posWtl.y;

				return;
			}

			this.info.slot = this.town.modeSwap.slot;
			this.info.slotInTown = this.town.objNames.slotGroup[this.info.slot.getPos()].getSlot();

			this.img = this.info.slotInTown.getImg();

			this.sizeView = this.info.slotInTown.sizeView;

			this.posView.x = this.town.posWtl.x;
			this.posView.y = this.town.posWtl.y;

			if( this.info.slot.isEmpty() )
				this.slotDisp = [-135, 77-80];
			else
				this.slotDisp = this.town.getSlotDisp(this.info.slot);
		};
		slotSwap.draw = function(canvas){
			var arcFrom = new Vector2D(this.posView.x, this.posView.y),
				slotInTownPosView = this.info.slotInTown.getPosWtlByOc(this.info.slotInTown.getTLPos()),
				slotInTownSize = this.info.slotInTown.getSize();

				slotInTownPosView.x += slotInTownSize.x * 0.5;
				slotInTownPosView.y += slotInTownSize.y * 0.5;

			var arcTo = new Vector2D(slotInTownPosView.x, slotInTownPosView.y),
				arcControlPoint = arcTo.getDiffVector(arcFrom).doMultScalar(0.5),
				cosA = arcControlPoint.getNormalized().x; // Косинус угла между направлением куда ведем арку и осью Х

			arcControlPoint = arcControlPoint
											.getPerp()
											.doMultScalar(cosA)
											.addVector(arcControlPoint.doMultScalar(2-Math.abs(cosA)))
											.addVector(arcFrom);

			canvas.save();

			canvas.lineCap = 'round';

			var grad = canvas.createLinearGradient(arcTo.x, arcTo.y, arcFrom.x, arcFrom.y);

			grad.addColorStop(0.02, 'rgba(75, 148, 243, 0)');
			grad.addColorStop(0.2, '#4b94f3');
			grad.addColorStop(0.97, '#4b94f3');
			grad.addColorStop(1, 'rgba(75, 148, 243, 0)');

			canvas.strokeStyle = grad;
			canvas.lineWidth = 7;

			canvas.shadowColor = '#4b94f3';
			canvas.shadowBlur = 2;

			canvas.beginPath();
			canvas.moveTo(arcFrom.x, arcFrom.y);
			canvas.quadraticCurveTo(arcControlPoint.x, arcControlPoint.y, arcTo.x, arcTo.y);
			canvas.stroke();


			grad = canvas.createLinearGradient(arcTo.x, arcTo.y, arcFrom.x, arcFrom.y);

			grad.addColorStop(0.02, 'rgba(255, 255, 255, 0)');
			grad.addColorStop(0.2, 'white');
			grad.addColorStop(0.5, 'white');
			grad.addColorStop(0.97, '#fad912');
			grad.addColorStop(1, 'rgba(250, 217, 18, 0)');

			canvas.strokeStyle = grad;
			canvas.lineWidth = 5;

			canvas.shadowBlur = 0;

			canvas.beginPath();
			canvas.moveTo(arcFrom.x, arcFrom.y);
			canvas.quadraticCurveTo(arcControlPoint.x, arcControlPoint.y, arcTo.x, arcTo.y);
			canvas.stroke();

			canvas.restore();

			CanvasImg.prototype.draw.apply(this, arguments);
		};
		slotSwap.isShow = function(){
			return !!this.info.slot;
		};
		slotSwap.getTLPos = function(){
			var size = this.getPosSize();

			return {x: this.posView.x - (size.x * this.town.zoom) * 0.5 , y: this.posView.y - (size.y * this.town.zoom) * 0.5};
		};
		slotSwap.getPosWtlByOc = function(posView){
			return posView;
		};

		this.pushObj(layer, slotSwap);
		this.objNames.slotSwapGroup[slotSwap.name] = slotSwap;

		var slotSwapForce = new CanvasImg({
			town: this,
			name: 'slotSwapForce',
			img: this.getImg('https://test.waysofhistory.com/img/gui/town/move_building_force-blue.png'), 
			posView: {x: 0, y: 0},
			type: cnst.townObjType.slot,
			show: false,
			alpha: 1,
			z: 2,
			slotSwap: slotSwap
		});

		slotSwapForce.beforeDraw = function(){
			this.posView.x = this.slotSwap.posView.x;
			this.posView.y = this.slotSwap.posView.y;

			this.z = this.slotSwap.z-2;
		};
		slotSwapForce.isShow = function(){
			return this.slotSwap.isShow();
		};
		slotSwapForce.getTLPos = function(){
			var sizeSlotSwap = this.slotSwap.getPosSize(),
				size = this.getPosSize();

			return {
				x: this.posView.x - (size.x * this.town.zoom) * 0.5, 
				y: this.posView.y + (sizeSlotSwap.y * this.town.zoom) * 0.25 /*- Math.abs(this.slotSwap.slotDisp[1] * this.town.zoom)*/
			};
		};
		slotSwapForce.getPosWtlByOc = function(posView){
			return posView;
		};

		this.pushObj(layer, slotSwapForce);
		this.objNames.slotSwapGroup[slotSwapForce.name] = slotSwapForce;

		slotSwapForce = new CanvasImg({
			town: this,
			name: 'slotSwapForceA',
			img: this.getImg('https://test.waysofhistory.com/img/gui/town/move_building_force-yellow.png'), 
			posView: {x: 0, y: 0},
			type: cnst.townObjType.slot,
			show: false,
			alpha: 1,
			z: 2,
			slotSwap: slotSwap,
			anim: {blink:{}}
		});

		slotSwapForce.beforeDraw = function(){
			this.posView.x = this.slotSwap.posView.x;
			this.posView.y = this.slotSwap.posView.y;

			this.z = this.slotSwap.z-1;

			if( this.isShow() )
				this.animBlink();
		};
		slotSwapForce.isShow = function(){
			return this.slotSwap.isShow();
		};
		slotSwapForce.getTLPos = function(){
			var sizeSlotSwap = this.slotSwap.getPosSize(),
				size = this.getPosSize();

			return {
				x: this.posView.x - (size.x * this.town.zoom) * 0.5, 
				y: this.posView.y + (sizeSlotSwap.y * this.town.zoom) * 0.25 /*- Math.abs(this.slotSwap.slotDisp[1] * this.town.zoom)*/
			};
		};
		slotSwapForce.getPosWtlByOc = function(posView){
			return posView;
		};

		this.pushObj(layer, slotSwapForce);
		this.objNames.slotSwapGroup[slotSwapForce.name] = slotSwapForce;

		if( this.modeSwap )
			this.setSwappedSlots();
	};
	
	bckTown.prototype.updateBuildLabels = function(){
		var labels = this.getObjects(this.layerDyn, cnst.townObjType.slotLabel);
		
		for (var obj in labels) {
			var obj = labels[obj];
			
			var slot = obj.info;
            
			obj.img = this.getImg('https://test.waysofhistory.com/img/town2/building_lvl'+snip.slotLevelBigType(slot)+'.png');
        }
		
		delete this.updateBuildLabelsTO;
	};
	
	bckTown.prototype.tryUpdateBuildLabels = function(){
		if( this.updateBuildLabelsTO )
			return;
		
		this.updateBuildLabelsTO = this.setTimeout(this.updateBuildLabels, 3000);
    };
	
	bckTown.prototype.toggleInterface = function(){
		this.isIfhidden = !this.isIfhidden;
		
		this.updIftoggle();
	};
	
	bckTown.prototype.updIftoggle = function(){
		for (var label in this.objNames.toggleIf){
			label = this.objNames.toggleIf[label];
			
			label.show = !this.isIfhidden;
		}
	};
	
	bckTown.prototype.initSlot = function(slot, group) {
        var self = this;
		
        if ( slot.canShow() ) {
			var alpha = !slot.getActions().isEmpty() && slot.isEmpty() && !slot.isFirstInBldQueue() ? 0.5 : 1;
            
            var layer = this.layerDyn;
									
            var slotImg = slot.dispPrepare2();
            
            //область - полигон
            var objArea = new CanvasPolygon({
                town: this,
                name: 'area',
                points: bckTown.slots[slot.pos][this.getSlotType(slot.getPos()) - 1].area,
                show: false,
                slot: slot,
				type: cnst.townObjType.slotAura,
                invis: true,
                z: 400,
                hint: snip.slotTitle(slot)
            });
            objArea.beforeDraw = function(){
                this.parent.slotHover = this.hover;
            };
            objArea.onHover = function(pos){
				CanvasPolygon.prototype.onHover.apply(this, arguments);
				
				self.toggleHover(true);
				
				return true;
            };
            objArea.onClick = function(){
				if( this.town.modeSwap )
					this.town.trySwapSlots(this);
				else
					wndMgr.addWnd(wSlot.selectType(slot.pos), slot.pos);
            };
			
            this.pushObj(layer, objArea);
			
			group.addChild(objArea);
            
            // строение
            if( slotImg.getSlotType() == Build.slotType.perimetr )
            	self.initSlotPerimetr(slot, group, alpha, layer, slotImg);
            else
            	self.initSlotNotPerimetr(slot, group, alpha, layer, slotImg);
			
            if( debug.isTownHouse() )
            	self.initSlotHouses(slot, group);
			
			group.checkLoadedRes();
        }
	};

	bckTown.prototype.initSlotHouses = function(slot, group) {
        var houses = HousesMatrix.calc(slot.pos, 1);
        if (houses.length == 0) return;
        for (var housePos in houses) {
        	var house = houses[housePos];
            var obj = new CanvasImg({
                town: this,
                name: 'house'+housePos,
                img: this.getImg('https://test.waysofhistory.com/img/town2/houses/'+house.img+'.png'), 
                posView: house.posPx,
                zLevel: house.zLevel,
            });
            this.pushObj(this.layerDyn, obj);

			group.addChild(obj);
        }

	};
	
	bckTown.prototype.initSlotPerimetr = function(slot, group, alpha, layer, slotImg){
        var terrain = wofh.town.getType();
		
		//периметр
        this.objNames.perimetr = [];
		
        var pos = {x: 0, y: 0};
		
        for (var segm = 1; segm <= 22; segm ++) {
            if( (segm == 15 && terrain.water) || (segm == 16 && terrain.hill != 3) || (segm == 1 && this.hasWonderBay()) || (segm == 22 && !this.hasWonderBay()) )
                continue;
			
			var objData = {
				town: this,
				segm: segm,
				info: slotImg, 
				type: cnst.townObjType.slot,
				realZ: cnst.town2.walls[segm-1],
				getCacheId: function(){
					return 'perimetr' + this.segm;
				}
			};
			
            if( !slotImg.isEmpty() ){
                var bldDisp = slotImg.getDispArr();
				
                if ( bldDisp[0] instanceof Object )
                    bldDisp = bldDisp[segm-1];
				
				if( bldDisp[2] )
					objData.realZ = bldDisp[2];
				
                var picLevel = slotImg.getLevelPic(true);
				
				objData.name = 'building'+segm;
				objData.img = this.getImg('https://test.waysofhistory.com/img/buildings2/'+slotImg.getId()+'_'+picLevel+'_'+segm+'.png');
				objData.alpha = alpha;
				objData.beforeDraw = function(){
					this.z = this.parent.slotHover ? this.realZ + cnst.town2.z.bldSel : this.realZ;
				};
            } 
			else {
                if( segm == 22 ) continue;
				
                var bldDisp = Build.lib[Build.emptyWall].dNew;
				
                if( bldDisp[0] instanceof Object )
                    bldDisp = bldDisp[segm-1];
				
				objData.name = 'sign'+segm;
				objData.img = this.getImg('https://test.waysofhistory.com/img/town2/slots/signboard_0_'+slotImg.getSlotType()+'_'+utils.twoDigits(segm)+'_0_0.png');
				objData.beforeDraw = function(){
					this.z = this.parent.slotHover ? cnst.town2.z.bldSel : this.realZ;
				};
            }
			
			objData.posView = {
				x: this.sizeO.x / 2 + bldDisp[0], 
				y: this.sizeO.y / 2 - 100 + bldDisp[1]
			};
			
			var obj = new CanvasImg(objData);
			
			group.addChild(obj);
			
			this.objNames.perimetr.push(obj);
			
            this.pushObj(layer, obj);
			
            //подпись
            if( segm == 11 ){
				// Периметр считается полностью загруженным, когда все его сигменты загружены
				obj.isLoaded = function(){
					if( this.allSegmIsLoaded )
						return true;
					
					var perimetr = this.town.objNames.perimetr,
						isLoaded = true;
					
					for(var i = 0; i < perimetr.length; i++){
						if( !perimetr[i].isSelfLoaded() ){
							isLoaded = false;

							break;
						}
					}
					
					return this.allSegmIsLoaded = isLoaded;
				};
				obj.setCachedObj = function(){
					// Устанавливем объекты из хранилища всем сигментам периметра
					var perimetr = this.town.objNames.perimetr;
					
					for(var i = 0; i < perimetr.length; i++)
						CanvasObj.prototype.setCachedObj.apply(perimetr[i]);
				};
				
                this.initSlotLabel(pos, group, slotImg, cnst.town2.walls[segm-1]+1);
			}
        }
	};

	bckTown.prototype.initSlotNotPerimetr = function(slot, group, alpha, layer, slotImg){
		var pos = bckTown.slots[slot.getPos()][this.getSlotType(slot.getPos()) - 1].buildPos;
		
		var allowShow=false,
			// Общие данные
			objData = {
				town: this,
				info: slotImg,
				alpha: alpha,
				getCacheId: function(){
					return 'building' + this.info.getPos();
				}
			};
		
	    if ( !slotImg.isEmpty() ){
			allowShow = true;
			
			//слот мигающий
			var blinked = !slotImg.haveActions() && slotImg.getLevel() < slotImg.getMaxLevel() && utils.inArray(wofh.account.getQuestsBuilds(), slotImg.id),
				bldDisp = this.getSlotDisp(slotImg, blinked),
				picLevel = slotImg.getLevelPic(true);
			
			objData.name = 'building';
			objData.posView = {
				x: pos.x + this.sizeO.x / 2 + bldDisp[0], 
				y: pos.y + this.sizeO.y / 2 - 100 + bldDisp[1]
			};
			objData.type = cnst.townObjType.build;
			objData.realZ = pos.y + this.sizeO.y / 2;
			objData.anim = {dy:{min: -10, max: 0}};
			objData.beforeDraw = function(){
				this.z = this.parent.slotHover ? cnst.town2.z.bldSel : this.realZ;
				
				this.animSwap();
			};
			
	        if( blinked )
		        objData.img = this.getImg('https://test.waysofhistory.com/img/buildings2/'+slotImg.getId()+'_'+picLevel+'_'+slotImg.getImgSubtype()+'_0.png');
			else
		        objData.img = this.getImg('https://test.waysofhistory.com/img/buildings2/'+slotImg.getId()+'_'+picLevel+'_'+slotImg.getImgSubtype()+'.png');
	    } 
		else if( slotImg.canShow() ){
			allowShow = true;
			
	        var terrain = slotImg.getSlotType();
			
	        var subtype = 1;
	        if( terrain == Build.slotType.normal)
	            subtype = (slotImg.getPos()+wofh.town.id)%3 + 1;
	        else if( terrain == Build.slotType.water)
	            subtype = (slotImg.getPos()+wofh.town.id)%5 + 1;
	        else if (slotImg.getPos() == 3)
	            subtype = 2;
	         
	        var highlight = +slot.isEmptySlotHighlighted();
	        
			objData.name = 'sign';
			objData.img = this.getImg('https://test.waysofhistory.com/img/town2/slots/signboard_0_'+terrain+'_'+utils.twoDigits(subtype)+'_'+(+slotImg.isNeedPay())+'_'+highlight+'.png');
			objData.posView = {
				x: pos.x + this.sizeO.x / 2, 
				y: pos.y + this.sizeO.y / 2 - 80
			};
			objData.type = cnst.townObjType.slot;
			objData.sizeView = {x: 209, y: 197};
			objData.anchor = {x: 0.5, y: 0.5};
			objData.anim = {dy:{min: -10, max: 0}};
			objData.realZ = objData.posView.y + 175;
			objData.beforeDraw = function(){
	            this.z = this.parent.slotHover ? cnst.town2.z.bldSel : this.realZ;
				
				this.sprite = {x: 0, y: 0};
				
				if( this.parent.slotHover && (!this.town.modeSwap || !this.town.modeSwap.slot || this.town.modeSwap.slot.getSlotType() == this.info.getSlotType()) )
					this.sprite = {x: 209, y: 0};
				
				this.animSwap();
	        };
	    }
		
		if( allowShow ){
			var obj = new CanvasImg(objData);
			
			group.addChild(obj);

			this.pushObj(layer, obj);
			
			if( blinked ){
				obj = new CanvasImg({
					town: this,
					name: 'building-blink',
					img: this.getImg('https://test.waysofhistory.com/img/buildings2/'+slotImg.getId()+'_'+picLevel+'_'+slotImg.getImgSubtype()+'_1.png'),
					posView: utils.clone(objData.posView),
					info: slotImg,
					type: objData.type,
					realZ: objData.realZ,
					alpha: alpha,
					anim: {blink: {}, dy: {min: -10, max: 0}},
					beforeDraw: function(){
						this.z = this.parent.slotHover ? cnst.town2.z.bldSel : this.realZ;
						
						this.animBlink();
						
						this.animSwap();
					},
					getCacheId: objData.getCacheId
				});
				
				group.addChild(obj);
				
				this.pushObj(layer, obj);
			}
			
			this.initSlotLabel(pos, group, slotImg, obj.realZ + 1);
		}
	};
	
    //показываем всплывалки очереди строительства
    bckTown.prototype.showSlotQueue = function(){
        for(var slotPos in this.slotQueue){
            this.slotQueue[slotPos].remove();
        }
        
        this.slotQueue = {};
        
        wofh.town.getSlots().each(function(slot){ 
            if( slot.getActions().getLength() ){
                var cont = $(tmplMgr.town.bldEvents({slot: slot}));
                
                this.cont.append(cont);
                
                this.slotQueue[slot.getPos()] = cont;
            }
        }, this);
        
		delete this.slotQueuePos;
		
        //переставляем
        this.moveSlotQueue();
    };
    
    //перемещаем всплывалки
    bckTown.prototype.moveSlotQueue = function(){
		if( this.slotQueuePos ){
			if( 
				this.slotQueuePos.x == this.posOtlWtl.x && 
				this.slotQueuePos.y == this.posOtlWtl.y &&
				this.slotQueuePos.zoom == this.zoom
			){
				return;
			}
		}
		else
			this.slotQueuePos = {};
		
        for (var slotId in this.slotQueue){
            var slotCont = this.slotQueue[slotId];
            
            var slot = wofh.town.getSlot(slotId);
			
            if( slot.getPos() == 1 )
                var slotPos = {x: -260, y: 20};
            else
                var slotPos = utils.clone(bckTown.slots[slotId][this.getSlotType(slot.getPos()) - 1].buildPos);
            
            slotPos.x += this.sizeO.x / 2;
            slotPos.y += this.sizeO.y / 2;
            slotPos.y -= this.getSlotPosOffsetY();
            slotPos = this.getPosWtlByOc(slotPos);
			
            slotCont.css({left: slotPos.x, top: slotPos.y});
        }
		
		this.slotQueuePos.x = this.posOtlWtl.x;
		this.slotQueuePos.y = this.posOtlWtl.y;
		this.slotQueuePos.zoom = this.zoom;
    };
    
    bckTown.prototype.getSlotPosOffsetY = function(){
        return 100;
    };
    
    //переключатор наведения(меняется стиль указателя)
    bckTown.prototype.toggleHover = function(toggle){
        $(this.canvasEl).toggleClass('-hover', toggle);
    };
    
    bckTown.prototype.initSlotLabel = function (pos, slotGroup, slot, z){
        if( slot.isEmpty() ) return;
        //подпись
        
        var levelDisp = slot.getLevelDisp();
		
        var labelBack = new CanvasImg({
            town: this,
            name: 'levelBack',
            img: this.getImg('https://test.waysofhistory.com/img/town2/building_lvl'+snip.slotLevelBigType(slot)+'.png'), 
            posView: {
                x: pos.x + this.sizeO.x / 2 + levelDisp.x, 
                y: pos.y + this.sizeO.y / 2 - 100 + levelDisp.y
			},
            info: slot,
            type: cnst.townObjType.slotLabel,
            realZ: z
        });
		
        labelBack.beforeDraw = function(){
            this.z = this.parent.getSlot().z + 1;
        };
		
		labelBack.isLoaded = function(){
			var isLoaded = CanvasImg.prototype.isLoaded.apply(this, arguments);
			
			if( isLoaded )
				return this.parent.getSlot().isLoaded();
			
			return isLoaded;
		};
		
        slotGroup.addChild(labelBack);
        
        this.objNames.toggleIf.push(labelBack);
		
        this.objNames.slotLabel[slot.getPos()] = labelBack;
		
        this.pushObj(this.layerDyn, labelBack);


        //var slotClone = slot.clone();//нужно убрать события
        //slotClone.actions.list = [];
        
        if( slot.getLevel() == lib.build.maxlevel ){
			var labelStar = new CanvasImg({
				town: this,
				name: 'levelStar',
				img: this.getImg('https://test.waysofhistory.com/img/town2/building_lvl_star.png'), 
				posView: {
					x: pos.x + this.sizeO.x / 2 + levelDisp.x + 26, 
					y: pos.y + this.sizeO.y / 2 - 100 + levelDisp.y + 26},
				info: slot,
				type: cnst.townObjType.slotLabelStar,
				realZ: z
			});
			
			labelStar.beforeDraw = function(){
				this.z = this.parent.getSlot().z + 2;
			};
			
			labelStar.isLoaded = labelBack.isLoaded;
			
			slotGroup.addChild(labelStar);
			
			this.pushObj(this.layerDyn, labelStar);
			
			this.objNames.slotLabelStar[slot.getPos()] = labelStar;
			
			this.objNames.toggleIf.push(labelStar);
        }
		else{
            var labelLevel = new CanvasText({
                town: this, 
                name: 'levelNumber', 
                posView: {
                    x: pos.x + this.sizeO.x / 2 + levelDisp.x + 33, 
                    y: pos.y + this.sizeO.y / 2 - 100 + levelDisp.y + 32
				},
                info: slot,
                type: cnst.townObjType.slotLabel,
                realZ: z,
                text: slot.level,
                fontsize: 14,
                fillStyle: snip.slotLevelBigType(slot) == 4 ? '#fff' : '#000'
            });
			
            labelLevel.beforeDraw = function(){
            	this.z = this.parent.getSlot().z + 2;
            };
			
            slotGroup.addChild(labelLevel);
            
			this.objNames.toggleIf.push(labelLevel);
			
            this.objNames.slotLabelLevel[slot.getPos()] = labelLevel;
			
			this.pushObj(this.layerDyn, labelLevel);
        }
    };
	
	bckTown.prototype.getSlotDisp = function(slot, blinked) {
		var disp = slot.getDispArr(blinked);
		if (typeof(disp[0]) == 'object') {
			disp = disp[slot.getImgSubtype()];
		}
		return disp;
	};
	
	//определяем тип используемого слота
	bckTown.prototype.getSlotType = function(slot) {
		var terrain = wofh.town.getType();
		switch (slot) {
			//водные
			case 15: return terrain.water>3? 2: 1;
			case 16: return terrain.water>2? 2: 1;
			case 17: return terrain.water>1? 2: 1;
			case 18: return terrain.water>0? 2: 1;
			default: return 1;
		}
	};
	
	//обновление человечеков
    bckTown.prototype.updateMovers = function(){
		if( !this.moversList )
			return;
		
        //вычисляем, кого нужно добавить, кого убрать
        var moversAdd = this.calcMovers();
        var moversDel = [];
        
        var newMoversList = utils.clone(moversAdd);
        
        for (var unitHasPos = 0; unitHasPos < this.moversList.length;) {
            var unitHas = this.moversList[unitHasPos];
            var find = false;
            for (var unitNewPos in moversAdd) {
                var unitNew = moversAdd[unitNewPos];
                if (unitNew == unitHas) {
                    moversAdd.splice(unitNewPos, 1);
                    find = true;
                    unitHasPos ++;
                    break;
                }
            }
            if (!find) {
                this.moversList.splice(unitHasPos, 1);
                moversDel.push(unitHas);
            }
        }
        this.moversList = newMoversList;
        
        this.addMovers(moversAdd);
		
        this.removeMovers(moversDel);
    };
    
    bckTown.prototype.removeMovers = function(idList){
        var objList = this.getObjects(this.layerDyn, cnst.townObjType.unit);
        for (var obj in objList) {
            obj = objList[obj];
            for (var unitPos in idList) {
                var unitId = idList[unitPos];
                if (obj.info.id == unitId){
                    this.removeObj(this.layerDyn, obj);
                    idList.splice(unitPos, 1);
                    break;
                }
            }
        }
    }
    
	//вычисление юнитов, которые будут бегать по городу
	bckTown.prototype.calcMovers = function(){
        if( !this.moversSeed )
            this.moversSeed = new Date().getTime();
		
        invwk.setSeed(this.moversSeed);
        
		var movers = [];
		
		if( this.mode == cnst.townMode.swapSlot )
			return movers;
		
		if( this.mode == cnst.townMode.road ){
			for(var i = 0; i < 10; i++)
				movers.push(149);
			
			return movers;
		}
		
		
		//горожане - трутни
		var eraDisp;
		if (new Science(82).isKnown()){
			eraDisp = 10;
		} else if (new Science(25).isKnown()){
			eraDisp = 35;
		} else if (new Science(36).isKnown()){
			eraDisp = 46;
		} else {
			eraDisp = 64;
		}
		
		movers.push(utils.randomSeed(4) + eraDisp, utils.randomSeed(4) + eraDisp);
		//повозки
		if (new Science(68).isKnown() && !new Science(111).isKnown()) {//Повозки - Образование
			movers.push(100, 100);
		}
		if (new Science(23).isKnown() && !new Science(31).isKnown()) {//Монархия - Паровой двигатель
			movers.push(101, 101);
		}
		if (new Science(33).isKnown() && !new Science(74).isKnown()) {//Электричество - Бронетехника
			movers.push(102, 102);
		}
		if (new Science(44).isKnown() && !new Science(75).isKnown()) {//Автомобиль - Комбинированные армии
			movers.push(utils.randomSeed(7)+100, utils.randomSeed(7)+100);
		}
		
		//работники
		for (var i in wofh.town.slots.getList()){
			var building = wofh.town.slots.getElem(i);
            
			if( !building.isActive() ) 
				continue;
			
			var level = building.level;
			
			switch( building.id ){
				case 85://Хижина
				case 48://Дом
				case 96://Дом собирателя
					movers.push(utils.randomSeed(4)+eraDisp);
					if(level>10) movers.push(utils.randomSeed(4)+eraDisp);
					break;
				case 4://Колодец
					movers.push(75);
					if(level>10) movers.push(75);
					break;
				case 34://Фонтан
					if(level<=4) movers.push(75,75);
					break;
				case 88://Петроглиф
					movers.push(16);
					if(level>5) movers.push(16);
					if(level>10) movers.push(16);
					if(level>15) movers.push(16);
					break;
				case 33://Философская школа
					movers.push(30);
					if(level>5) movers.push(30);
					if(level>10) movers.push(30);
					if(level>15) movers.push(30);
					break;
				case 35://Библиотека
					movers.push(32);
					if(level>10) movers.push(32);
					break;
				case 5://Лесоповал
					movers.push(21);
					if(level>10) movers.push(21);
					break;
				case 6://Ферма
				case 28://Фруктовая плантация
				case 29://Кукурузная плантация
				case 30://Пшеничное поле
				case 31://Рисовая плантация
					movers.push(22);
					if(level>10) movers.push(22);
					break;
				case 13://Посольство
					movers.push(41);
					if(level>10) movers.push(41);
					break;
				case 12://Гранитный карьер
				case 21://Шахта
					movers.push(42);
					if(level>10) movers.push(42);
					break;
				case 32://Мастерская
				case 90://Кузница
					movers.push(44);
					if(level>10) movers.push(44);
					break;
				case 24://Промысловый порт
				case 84://Ловушка для рыб
					movers.push(45);
					if(level>10) movers.push(45);
					break;
				case 52://Ткацкая фабрика
					movers.push(50);
					if(level>10) movers.push(50);
					break;
				case 18://Филармония
					movers.push(51);
					if(level>10) movers.push(51);
					break;
				case 51://Монетный двор
					movers.push(52);
					if(level>10) movers.push(52);
					break;
				case 40://Банк
					if(level<=5) movers.push(52);
					else if(level<=10) movers.push(57);
					else movers.push(57,57);
					break;
				case 80://Обсерватория
					movers.push(53);
					if(level>10) movers.push(53);
					break;
				case 14://Суд
					if(level<=5) movers.push(54);
					else if(level<=10) movers.push(54,54);
					else movers.push(55,55);
					break;
				case 87://Площадь
					movers.push(56);
					break;
				case 26://Рынок
					movers.push(56,56);
					if(level>10) movers.push(56);
					break;
				case 104://Торговая база
					movers.push(56,56,56);
					if(level>10) movers.push(56);
					break;
				case 72://Лаборатория
					movers.push(58);
					if(level>10) movers.push(58);
					if(level>18) movers.push(58);
					break;
				case 42://Типография
					movers.push(59);
					if(level>10) movers.push(59);
				break;
			}
		}
		
		//войска
		for (var unitId in wofh.town.army.intown.getList()) {
		
			var unitCount = wofh.town.army.intown.getCount(unitId);
			if (unitCount==0) continue;
			
			var unitLib = cnst.town2.units2[unitId];
			var moverId = unitLib.anim;
			if (moverId == -1) continue;
			movers.push(moverId);
			if (unitCount >= unitLib.animk) movers.push(moverId);
			if (unitCount >= Math.pow(unitLib.animk, 2)) movers.push(moverId);
		}
		
		//Хэллоуин
		if (wofh.gameEvent.has(GameEvent.ids.helloween)) {
		
			/* 3, 4, 5 */
			movers.push(3, 4, 5);
			
			/* 3-5 x 5 */
			for (var i=0; i< 5; i++){
				movers.push(~~(Math.random()*3) + 3);
			}
			
			/* 140-144 x 3 */
			for (var i=0; i< 3; i++){
				movers.push(~~(Math.random()*5) + 140);
			}
		}
		
		//Новый Год
		if (wofh.gameEvent.has(GameEvent.ids.newYear)) {
			/* 3-5 x 10 *///детишки
			for (var i=0; i< 10; i++){
				movers.push(~~(Math.random()*3) + 3);
			}
			
		}
		if (wofh.gameEvent.has(GameEvent.ids.newYear2Stage)) {
            if (debug.getLang() == 'en'){
                movers.push(0, 148, 2, 2, 2, 2, 2, 2);
            } else {
                movers.push(0, 1, 2, 2, 2, 2, 2, 2);
            }
        }
		if (wofh.gameEvent.has(GameEvent.ids.newYear3Stage)) {
			movers.push(2);
        }
		
		return movers;
	};
	
	//инициализация юнитов
	bckTown.prototype.initTownMovers = function(){
		this.moversList = this.calcMovers();
		
		//this.moversList = this.moversList.concat(this.moversList);

		//this.moversList = [60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60];
		
		
		this.objNames.units = [];
		
        this.clearLayer(this.layerDyn, [cnst.townObjType.unit]);
		
        this.addMovers(this.moversList);
	};
	
    bckTown.prototype.addMovers = function(list){
		for (var unit in list) {
			unit = list[unit];
			var roadPoint = utils.toInt(Math.random() * cnst.town2.roadPoints.length);
			var obj = new CanvasImg({
                town: this,
				img: this.getImg('https://test.waysofhistory.com/img/help/people/'+utils.prepZero(unit, 3)+'.png'),
				info: {
					id: unit,
					step: utils.toInt(Math.round() * cnst.town2.moversInfo.steps),
					target: roadPoint
				},
				posView: {
					x: cnst.town2.roadPoints[roadPoint].x, 
					y: cnst.town2.roadPoints[roadPoint].y},
				sizeView: {
					x: cnst.town2.moversInfo.size.x,
					y: cnst.town2.moversInfo.size.y},
				type: cnst.townObjType.unit,
			});
			
			this.setNewTarget(obj);
			
            this.objNames.units.push(obj);
            this.layerDyn.push(obj);
		}
    };
    
	//инициализация кликеров
	bckTown.prototype.initClickers = function(){
        var self = this;
        
        this.clickerQuest = utils.sizeOf(wofh.towns) == 1 && wofh.town.pop.has < 100;
        
		var clickers = wofh.town.getClickers(cnst.town2.clicker.length);
		
        if (utils.urlToObj().allClickers){
			clickers = [];
			for(var i = 0; i < 27; i++){
				clickers.push({
					i: i,
					id: 2,
					pos: i,
					res: new Resource(Resource.ids.fruit, 15)
				});
			}
        }
		
		this.objNames.clickersGroup = {};
		this.objNames.clickers = [];
		
        //чистим старые
        this.clearLayer(this.layerDyn, [cnst.townObjType.clicker]);
		
		var layer = this.layerDyn;
		
		for (var clicker in clickers) {
			clicker = clickers[clicker];
			
			//var clickerInfo = lib.town.production.clickerres[clicker.id];
			
            var clickerGroup = new CanvasGroup({
                town: this,
                hint: new Resource(lib.town.production.clickerres[clicker.id-1][0]).getName(),
                clickable: true,
            });
			
            this.objNames.clickersGroup[clicker.pos] = clickerGroup;
            
			var obj = new CanvasImg({
                town: this,
                name: 'clickerStat',
				img: this.getImg('https://test.waysofhistory.com/img/town2/clickers/clicker-0_'+(wofh.town.climate-2)+'_'+clicker.id+'_'+(this.clickerQuest?1:0)+'.png'), 
                sizeView: {x: 109, y: 214},
				//img: this.getImg('/p/b3/clickers/tester.png'), 
				posView: {
					x: this.sizeO.x / 2 + cnst.town2.clicker[clicker.pos].x - cnst.town2.clickerDisp.x,
					y: this.sizeO.y / 2 - cnst.town2.clickerYcorrect + cnst.town2.clicker[clicker.pos].y - cnst.town2.clickerDisp.y
				},
				type: cnst.townObjType.clicker, 
                clicker: clicker
            });
			obj.z = obj.posView.y + cnst.town2.clickerSize.y + (cnst.town2.clickerYcorrect*0.5);
            obj.onClick = function(pos){
                this.parent.show = false;
				
				self.runClicker(this.clicker, pos);
                
                appl.sendClicker(this.clicker.i, this.clicker.id);
				
                return true;
            };
            clickerGroup.addChild(obj);
			this.pushObj(layer, obj);
			this.objNames.clickers.push(obj);
            
			var obj = new CanvasImg({
                town: this,
                name: 'clickerBlink',
				img: this.getImg('https://test.waysofhistory.com/img/town2/clickers/clicker-0_'+(wofh.town.climate-2)+'_'+clicker.id+'_'+(this.clickerQuest?1:0)+'.png'), 
                sizeView: {x: 109, y: 214},
				//img: this.getImg('/p/b3/clickers/tester.png'), 
				posView: {
					x: this.sizeO.x / 2 + cnst.town2.clicker[clicker.pos].x - cnst.town2.clickerDisp.x,
					y: this.sizeO.y / 2 - cnst.town2.clickerYcorrect + cnst.town2.clicker[clicker.pos].y - cnst.town2.clickerDisp.y
				},
				type: cnst.townObjType.clicker, 
                sprite: {x: cnst.town2.clickerSize.x, y: 0},
                anim: {blink: {}}
            });
			obj.z = obj.posView.y + cnst.town2.clickerSize.y + (cnst.town2.clickerYcorrect*0.5) + 0.1;
            obj.beforeDraw = function(){
                this.animBlink();
            };
			
            clickerGroup.addChild(obj);
			this.pushObj(layer, obj);
			this.objNames.clickers.push(obj);
		}
	};
	
	bckTown.prototype.runClicker = function(clicker, pos){
		new TownClicker(this.cont, clicker, this.posClickWtl);
	};
	
	// Инициализация объектов города
	bckTown.prototype.initTownObj = function(){
		if( 
			wofh.gameEvent.has(GameEvent.ids.newYear1Stage) || 
			wofh.gameEvent.has(GameEvent.ids.newYear2Stage) ||
			wofh.gameEvent.has(GameEvent.ids.newYear3Stage)
		){
			// Снеговик
			var snowman = new CanvasImg({
                town: this,
				img: 'https://test.waysofhistory.com/img/gui/events/',
				posView: {
					x: 1475,
					y: 815
				},
				type: cnst.townObjType.other,
				z: 900
			});
			if( wofh.gameEvent.has(GameEvent.ids.newYear1Stage) ){
				snowman.img += 'snowman0';
			}
			else if( wofh.gameEvent.has(GameEvent.ids.newYear2Stage) ){
				snowman.img += 'snowman0';
			}
			else if( wofh.gameEvent.has(GameEvent.ids.newYear3Stage) ){
				snowman.img += 'snowman1';
			}

			snowman.img += '-' + debug.getLang();
			snowman.img += '.png';
			snowman.img = this.getImg(snowman.img);
			this.layerDyn.push(snowman);
			
			
			// Елка
			var xmas_tree = new CanvasImg({
                town: this,
				img: 'https://test.waysofhistory.com/img/gui/events/',
				posView: {
					x: 610,
					y: 460
				},
				type: cnst.townObjType.other,
				z: 604
			});
			if( wofh.gameEvent.has(GameEvent.ids.newYear1Stage) ){
				xmas_tree.img += 'xmas_tree0.png';
			}
			else if( wofh.gameEvent.has(GameEvent.ids.newYear2Stage) ){
				xmas_tree.img += 'xmas_tree1.png';
			}
			else if( wofh.gameEvent.has(GameEvent.ids.newYear3Stage) ){
				xmas_tree.img += 'xmas_tree2.png';
			}

			xmas_tree.img = this.getImg(xmas_tree.img);
			this.layerDyn.push(xmas_tree);
			
			
			// Сани
			if( wofh.gameEvent.has(GameEvent.ids.newYear2Stage) ){   
                var sledge = new CanvasImg({
                	town: this,
                    img: this.getImg('https://test.waysofhistory.com/img/gui/events/sledge-'+(debug.getLang()=='ru'?'ru':'eng')+'.png'),
                    posView: {
                        x: 1040,
                        y: 730
                    },
                    type: cnst.townObjType.other,
                    z: 775
                });
				this.layerDyn.push(sledge);
			}
		}
		
		if( wofh.account.hasRainbowMode() ){
			this.initRainbow();
		}
	};
	
	// Инициализация радуги и северного сияния
	bckTown.prototype.initRainbow = function(){
		var zIndex = 300;
		
		if( utils.random(2) ){ // Радуга
			var rainbow = new CanvasImg({
				town: this,
				img: this.getImg('https://test.waysofhistory.com/img/town2/rainbows/rainbow1.png'),
				posView: {
					x: 100,
					y: 0
				},
				type: cnst.townObjType.rainbow,
				z: zIndex
			});

			this.layerDyn.push(rainbow);
		}
		else{ // Сияние
			var lightsGroup = new CanvasGroup({
				town: this, 
				animBlink:{min:1, max:0, period: 10000},
				alpha: 1
			});
			
			lightsGroup.animate = function(){
				this.animFirstImg.alpha = this.animFirstImg.getSinFunc(this.animBlink);
				this.animSecondImg.alpha = 1 - this.animFirstImg.alpha;
				// Пройден цикл анимации. 1 - изображение скрыто, второе показано. Меняем изображения
				if( this.alpha < this.animFirstImg.alpha ){
					this.animBlink.start = 0;
					
					this.animFirstImg.alpha = 0;
					this.animFirstImg.show = false;
					this.animFirstImg = this.animSecondImg;
					this.animFirstImg.alpha = 1;
					this.animSecondImg = this.children['light' + (this.animSecondImg.index%this.childCount+1)];
					this.animSecondImg.show = true;
				}
				this.alpha = this.animFirstImg.alpha;
			};
			
			var obj = new CanvasImg({
				index: 1,
				name: 'light1',
				town: this,
				img: this.getImg('https://test.waysofhistory.com/img/town2/rainbows/northern_lights1.png'), 
				posView: {
					x: 0,
					y: 0
				},
				type: cnst.townObjType.rainbow,
				z: zIndex
			});
			obj.beforeDraw = function(){
				this.parent.animate();
			};

			lightsGroup.addChild(obj);
			lightsGroup.animFirstImg = obj;
			this.layerDyn.push(obj);

			obj = new CanvasImg({
				index: 2,
				name: 'light2',
				town: this,
				alpha: 0,
				img: this.getImg('https://test.waysofhistory.com/img/town2/rainbows/northern_lights2.png'), 
				posView: {
					x: 0,
					y: 0
				},
				type: cnst.townObjType.rainbow,
				z: zIndex
			});
			
			lightsGroup.addChild(obj);
			lightsGroup.animSecondImg = obj;
			this.layerDyn.push(obj);

			
			obj = new CanvasImg({
				index: 3,
				name: 'light3',
				town: this,
				show: false,
				alpha: 0,
				img: this.getImg('https://test.waysofhistory.com/img/town2/rainbows/northern_lights3.png'), 
				posView: {
					x: 0,
					y: 0
				},
				type: cnst.townObjType.rainbow,
				z: zIndex
			});

			lightsGroup.addChild(obj);
			this.layerDyn.push(obj);
			
			obj = new CanvasImg({
				index: 4,
				name: 'light4',
				town: this,
				show: false,
				alpha: 0,
				img: this.getImg('https://test.waysofhistory.com/img/town2/rainbows/northern_lights4.png'), 
				posView: {
					x: 0,
					y: 0
				},
				type: cnst.townObjType.rainbow,
				z: zIndex
			});

			lightsGroup.addChild(obj);
			this.layerDyn.push(obj);
			
			obj = new CanvasImg({
				index: 4,
				name: 'light4',
				town: this,
				show: false,
				alpha: 0,
				img: this.getImg('https://test.waysofhistory.com/img/town2/rainbows/northern_lights5.png'), 
				posView: {
					x: 0,
					y: 0
				},
				type: cnst.townObjType.rainbow,
				z: zIndex
			});

			lightsGroup.addChild(obj);
			this.layerDyn.push(obj);
			
			lightsGroup.childCount = utils.sizeOf(lightsGroup.children);
		}
	};
	
//ОТРИСОВКА
	
	//инициализация холста
	bckTown.prototype.initCanvas = function(){
		this.canvasEl0 = this.wrp.find('#town-canvas0').get(0);
		this.canvasEl = this.wrp.find('#town-canvas').get(0);
		
		this.setCanvasSize();
	};
	
	//реакция на изменение размера окна
	bckTown.prototype.setCanvasSize = function(){
		//запоминаем размеры
		this.canvasEl0.width = 0;
		this.canvasEl0.height = 0;
		this.canvasEl.width = 0;
		this.canvasEl.height = 0;

		this.setCanvasDimension();
		
		//апдейтим зум так, чтобы
		this.checkViewBounds();
		
		this.showZoom();
		
		this.centerView();
		
		//устанавливаем размеры канваса
		this.canvasEl0.width = this.sizeW.x;
		this.canvasEl0.height = this.sizeW.y;
		this.canvasEl.width = this.sizeW.x;
		this.canvasEl.height = this.sizeW.y;
		this.canvas0 = this.canvasEl0.getContext('2d');
		this.canvas = this.canvasEl.getContext('2d');
		
		this.requestRender();
	};
	
	bckTown.prototype.setCanvasDimension = function(){
		this.sizeW.x = Math.min(this.sizeO.x, $(document).width());
		this.sizeW.y = Math.min(this.sizeO.y, $(document).height());

		var canvasDisp = {
			left: Math.max(0, ($(document).width() - this.sizeO.x)/2),
			top: Math.max(0, ($(document).height() - this.sizeO.y)/2)
		};
		
		this.wrp.find('.view-town').css({margin: canvasDisp.top+'px '+canvasDisp.left+'px'});
	};
	
	//чистка канваса
	bckTown.prototype.clearCanvas = function(canvas){
		canvas.clearRect(0, 0, this.sizeW.x, this.sizeW.y);
	};

	//Убираем всё, что свешивается с краёв
	bckTown.prototype.clearCanvasBorders = function(canvas){
		/*
			***************
			*      1      *
			***************
			* 2 *город* 3 *
			***************
			*      4      *
			***************
			
		*/

		//считаем углы изображения
		var left = this.posOtlWtl.x;
		var top = this.posOtlWtl.y;
		var right = left + this.sizeO.x * this.zoom;
		var bottom = top + this.sizeO.y * this.zoom;

		//вырезаем все 4 области
		canvas.clearRect(0, 0, this.sizeW.x, top);
		canvas.clearRect(0, top, left, bottom);
		canvas.clearRect(right, top, this.sizeW.x, bottom);
		canvas.clearRect(0, bottom, this.sizeW.x, this.sizeW.y);
	};
	        
	//прозрачность для мерцания выделения слотов
	bckTown.prototype.getSlotEventZoom = function(obj){
		var period = 1000;
        var min = 0.7
        var max = 1.2
        
		var now = new Date().getTime();
        if (!obj.info) {
            obj.info = {time: now}
        }
		var dif = now - obj.info.time;
		if (!obj.info.time || dif > period) {
            obj.info.time = now;
            dif = 0;
		}
		return min + (1 - Math.abs(1 - dif / period * 2)) * (max - min);
	}
    
	
//АНИМАЦИЯ ЮНИТОВ
	bckTown.prototype.setUnitSprt = function(obj){
		obj.sprite = {
			x: cnst.town2.moversInfo.size.x * utils.toInt(obj.info.step),
			y: cnst.town2.moversInfo.size.y * obj.info.dir
		};
	};
    
    bckTown.prototype.calcMove = function(){
		var now = timeMgr.getNowLocMS();
		
		//сколько времени прошло с последнего запуска
		this.movePeriod = this.moveMoment ? now - this.moveMoment : 0;
        
		this.moveMoment = now;
    };
	
	//шаг анимации юнитов
	bckTown.prototype.moveUnits = function(){
		var disp = Math.min(1, this.movePeriod / 50);
		
		for(var obj in this.objNames.units) {
			obj = this.objNames.units[obj];
			
			var moverInfo = cnst.town2.movers[obj.info.id];
			
			if( obj.show == false )
				continue;
			
			//выбираем новую цель
			if( obj.info.t < 0 )
				this.setNewTarget(obj);
			
			if( obj.info.dir != obj.info.dirNeed ){
				var turnSpeed = 100; // Поворот
				
				if( this.moveMoment - obj.info.lastTurn > turnSpeed ){
					obj.info.dir += this.getDirDisp(obj.info.dir, obj.info.dirNeed) + 8;
					obj.info.dir = obj.info.dir%8;
					obj.info.lastTurn += turnSpeed;
				}
			} 
			else{
				//шаг
				obj.posView.x += obj.info.dx * disp;
				obj.posView.y += obj.info.dy * disp;
				
				obj.info.t -= disp;
				obj.info.step = (obj.info.step + disp * moverInfo.aspeed) % cnst.town2.moversInfo.steps;
				
				obj.z = obj.calcZ();
			}
			
			this.setUnitSprt(obj);
		}
	};
	
	bckTown.prototype.getDirDisp = function(from, to) {
		var disp = to - from;
		return ((disp <= 4 && disp >= 0) || disp <= -4)? 1: -1;
	};
	
	bckTown.prototype.setNewTarget = function(obj){
		var moverInfo = cnst.town2.movers[obj.info.id];
		
		//цель - ид
		var trgList = utils.clone(wofh.account.isAdmin()? this.objNames.roadPoints[obj.info.target].info.next: cnst.town2.roadPoints[obj.info.target].next);
		
		if (!trgList || !trgList.length) {
			obj.show = false;
			alert(1);
			return;
		}
		
		if( trgList.length > 1 ){
			for (var i in trgList) {
				if (trgList[i] == obj.info.from){
					trgList.splice(i, 1);
					break;
				}
			}
		}
		
		obj.info.from = obj.info.target;
		obj.info.target = trgList[~~(Math.random() * trgList.length)];
		
		//координаты цели в пикселях (используем рандомное смещение, чтобы не ходили одной тропой)
		obj.info.targetPos = utils.clone(wofh.account.isAdmin()? this.objNames.roadPoints[obj.info.target].posView :cnst.town2.roadPoints[obj.info.target])
		var rand = (Math.random() * 2 - 1) * cnst.town2.moversInfo.rand;
		obj.info.targetPos.x += rand;
		var rand = (Math.random() * 2 - 1) * cnst.town2.moversInfo.rand;
		obj.info.targetPos.y += rand / 2;
		
		//общее смещения
		obj.info.dx = obj.info.targetPos.x - obj.posView.x;
		obj.info.dy = obj.info.targetPos.y - obj.posView.y;
		
		//направление, в котором юнит должен идти (используем поворот)
		obj.info.dirNeed = (Math.atan2(obj.info.dy * 1.5, obj.info.dx) / Math.PI * 4) + 4.5;
		obj.info.dirNeed = ~~(obj.info.dirNeed % cnst.town2.moversInfo.dirs);
		if (typeof(obj.info.dir) == 'undefined') {
			obj.info.dir = obj.info.dirNeed;
		}
		//время последнего поворота юнита
		obj.info.lastTurn = new Date().getTime();
		
		//смещения в координатах
		var d = Math.sqrt(obj.info.dx * obj.info.dx + obj.info.dy * obj.info.dy);
		obj.info.t = d / moverInfo.speed;
		obj.info.dx /= obj.info.t;
		obj.info.dy /= obj.info.t;
	};
    
//НАСТРОЕЧНЫЕ ФУНКЦИИ
	// Hежим перемещения слотов
	bckTown.prototype.toggleModeSwapSlot = function(slot, mousePos) {
		if( this.mode == cnst.townMode.swapSlot ){
			this.mode = cnst.townMode.camera;
			
			this.restoreSwapModeBackup();
			
			this.unsetSwappedSlots();
			
			var noCenterView = true;
		}
		else{
			this.mode = cnst.townMode.swapSlot;
			
			this.modeSwap = {slot: slot, town: wofh.town};
			
			this.saveSwapModeBackup();
			
			ls.setTownZoomLock(0);
			
			this.setMinZoom();
			
			this.setSwappedSlots(mousePos);
		}
		
		this.onModeChange(noCenterView);
	};
	
	bckTown.prototype.setSwappedSlots = function(mousePos){
		// Если слоты были поменяны местами, то удаляем текущий выбранный слот
		if( this.reqSwapSlot ){
			delete this.modeSwap.slot;
			
			delete this.reqSwapSlot;
		}
		if( this.modeSwap.town.id != wofh.town.id ){
			delete this.modeSwap.slot;
			
			this.modeSwap.town = wofh.town;
		}
		
		for (var slotGroup in this.objNames.slotGroup) {
				slotGroup = this.objNames.slotGroup[slotGroup];
				
				if( slotGroup.children.auraSwap ){
					for (var child in slotGroup.children) {
						child = slotGroup.children[child];
						
						if( child.name == 'auraSwap' || child.name == 'auraSwapActive' )
							child.show = true;
						else
							child.alpha *= 0.6;
					}
				}
				else
					slotGroup.show = false;
			}
			
		for (var clickerGroup in this.objNames.clickersGroup) {
			clickerGroup = this.objNames.clickersGroup[clickerGroup];

			clickerGroup.show = false;
		}
		
		this.setPosToSwappedSlot(mousePos);
		
		notifMgr.runEvent(Notif.ids.townSwapSlot);
	};
	
	bckTown.prototype.setPosToSwappedSlot = function(mousePos){
		if( !mousePos )
			return;
		
		this.wrp.find('.town-canvas').trigger('mousemove', [mousePos]);
	};
	
	bckTown.prototype.unsetSwappedSlots = function(){
		for (var slotGroup in this.objNames.slotGroup) {
				slotGroup = this.objNames.slotGroup[slotGroup];
				
				if( slotGroup.children.auraSwap ){
					for (var child in slotGroup.children) {
						child = slotGroup.children[child];
						
						if( child.name == 'auraSwap' || child.name == 'auraSwapActive' )
							child.show = false;
						else
							child.alpha /= 0.6;
					}
				}
				else
					slotGroup.show = true;
			}

		for (var clickerGroup in this.objNames.clickersGroup) {
			clickerGroup = this.objNames.clickersGroup[clickerGroup];

			clickerGroup.show = true;
		}
		
		notifMgr.runEvent(Notif.ids.townSwapSlot);
	};
	
	bckTown.prototype.trySwapSlots = function(slotArea){
		if( !slotArea.parent.isShow() )
			return;
		
		if( slotArea.town.modeSwap.slot ){
			if( slotArea.town.modeSwap.slot.getPos() == slotArea.slot.getPos() ){
				delete slotArea.town.modeSwap.slot;

				notifMgr.runEvent(Notif.ids.townSwapSlot);
			} 
			else{
				if( slotArea.town.modeSwap.slot.getSlotType() != slotArea.slot.getSlotType() )
					return;
				
				wndMgr.addConfirm(tmplMgr.slotbld.swapAlert({slot1: slotArea.town.modeSwap.slot, slot2: slotArea.slot}), {
					rubber: true,
					data: {
						bckTown: slotArea.town,
						townId: slotArea.town.modeSwap.town.id,
						slot1: slotArea.town.modeSwap.slot.getPos(),
						slot2: slotArea.slot.getPos()
					},
					callbacks: {
						bindEvent: function(){
							var wnd = this;
							
							this.wrp
								.off('click', '.js-popup-ok')
								.on('click', '.js-popup-ok', function(){
									if( wofh.account.getCoinsBoughtMoved() < lib.luckbonus.swapslotcost ){
										wndMgr.addAlert(tmplMgr.snipet.noCoins());
										
										return;
									}
									
									wnd.noClose = true;
									
									wnd.data.bckTown.reqSwapSlot = true;
									
									wnd.loaderId = contentLoader.start(
										wnd.wrp.find('.wnd-cont-wrp'), 
										0,
										function (){		
											reqMgr.swapSlots(wnd.data.townId, wnd.data.slot1, wnd.data.slot2, function(){
												contentLoader.stop(wnd.loaderId);
												
												wnd.noClose = false;
												
												wnd.close();
											});
										}
									);
								})
								.on('click', '.js-popup-cancel, .wnd-back-wrp', function(event){
									if( !wnd.noClose )
										wnd.data.bckTown.setPosToSwappedSlot(utils.getPosFromEvent(event, 'client'));
								});
						},
						beforeClose: function(){
							return this.noClose;
						}
					}
				});
				
				notifMgr.runEvent(Notif.ids.townSwapSlotHold);

				return;
			}
		}
		else{
			slotArea.town.modeSwap.slot = slotArea.slot;
			
			notifMgr.runEvent(Notif.ids.townSwapSlot);
		}
	};
	
	bckTown.prototype.saveSwapModeBackup = function(){
		if( !this.modeSwap )
			return;
		
		this.modeSwap.backup = {
			zoom: this.zoom, // Отодвигаем город и сохраняем страй зум
			zoomLock: ls.getTownZoomLock(0)
		};
	};
	
	bckTown.prototype.restoreSwapModeBackup = function(){
		if( !this.modeSwap )
			return;
		
		this.restoreSwapModeZoom();
		
		delete this.modeSwap;
	};
	
	bckTown.prototype.restoreSwapModeZoom = function(){
		this.setZoom(this.modeSwap.backup.zoom);
		
		ls.setTownZoomLock(this.modeSwap.backup.zoomLock);
	};
	
	bckTown.prototype.toggleMode = function(mode) {
		this.objOver = false;
		this.mode = mode;
		
		for (var obj in this.layerDyn) {
			obj = this.layerDyn[obj];
			
			if( obj.name == 'area' )
				obj.show = this.mode == cnst.townMode.dragObj || this.mode == cnst.townMode.road;
		}
		
		for (var obj in this.objNames.units) {
			obj = this.objNames.units[obj];
			obj.show = true;
		}
		
		this.objNames.slots.show = this.mode == cnst.townMode.dragObj || this.mode == cnst.townMode.road;
		this.objNames.shadow.show = this.mode == cnst.townMode.shadow;
		
		for (var obj in this.objNames.roadPoints) {
			obj = this.objNames.roadPoints[obj];
			obj.show = this.mode == cnst.townMode.road;
		}
        
		for (var obj in this.objNames.slotPoints) {
			obj = this.objNames.slotPoints[obj];
			obj.show = this.mode == cnst.townMode.road;
		}
		
		//подписи к кликерам
		for (var obj in this.objNames.clickersLabels) {
			obj = this.objNames.clickersLabels[obj];
			obj.show = this.mode == cnst.townMode.road;
		}
		
		this.onModeChange();
	};
	
	bckTown.prototype.onModeChange = function(noCenterView){
		if( !noCenterView )
			this.centerView();
		
		notifMgr.runEvent(Notif.ids.townModeChange);
		
		this.requestRender();
	};
	
	//сохранение позиций домиков
	bckTown.prototype.savePos = function(text){
		switch (this.mode) {
			case cnst.townMode.road: 
				var arr = [];
				for (var obj in this.objNames.roadPoints) {
					obj = this.objNames.roadPoints[obj];
					arr.push({
						x: Math.round(obj.posView.x), 
						y: Math.round(obj.posView.y), 
						next: obj.info.next});
				}
				return JSON.stringify(arr);
			case cnst.townMode.dragObj:
				for (var obj in this.layerDyn) {
					obj = this.layerDyn[obj];
					if (obj.type == cnst.townObjType.build) {
						
                        var slot = new Slot(obj.info.id);
						var dispStore = slot.getDisp();
						
						var slotBuildPos = bckTown.slots[obj.info.slot][this.getSlotType(slot.getPos()) - 1].buildPos;

						dispStore[0] = Math.round(obj.posView.x - this.sizeO.x / 2 - slotBuildPos.x);
						dispStore[1] = Math.round(obj.posView.y - this.sizeO.y / 2 - slotBuildPos.y);
					}
				}
				return JSON.stringify(Build.lib);
		}
		return '';
	};
	
	bckTown.prototype.initRoadPoints = function(){
		for (var pointId in cnst.town2.roadPoints) {
			var point = cnst.town2.roadPoints[pointId];
			this.initRoadPoint(point, false);
		}
	};
	
	bckTown.prototype.initRoadPoint = function(pos, show){
		if (!this.objNames.roadPoints) this.objNames.roadPoints = [];
		var id = this.objNames.roadPoints.length;
		
		var obj = new CanvasRoad({
            town: this,
			z: 10000, 
			posView: pos, 
			type: cnst.townObjType.roadPoint, 
			sizeView: {x: cnst.town2.moversInfo.rpRad * 2, y: cnst.town2.moversInfo.rpRad * 2},
			info: {
				id: id, 
				next: cnst.town2.roadPoints[id]? cnst.town2.roadPoints[id].next: []},
			show: show
        });
		
		this.objNames.roadPoints.push(obj);
		
		this.pushObj(this.layerDyn, obj); 
	};
    
	bckTown.prototype.initSlotPoints = function(){
		this.objNames.slotPoints = [];
		
		for (var slotId in wofh.town.slots.getList()) {
			var slot = wofh.town.slots.getElem(slotId);
								
            var slotPos = utils.clone(bckTown.slots[slot.getPos()][this.getSlotType(slot.getPos()) - 1].buildPos);
            
            slotPos.x += this.sizeO.x / 2;
            slotPos.y += this.sizeO.y / 2;
            
            var obj = new CanvasPoint({
                town: this,
                z: 10000, 
                posView: slotPos, 
                type: cnst.townObjType.slotPoint, 
                sizeView: {x: cnst.town2.moversInfo.rpRad * 2, y: cnst.town2.moversInfo.rpRad * 2},
                show: false
            });
            this.objNames.slotPoints.push(obj);
            this.pushObj(this.layerDyn, obj); 
        }
    };
	
	bckTown.prototype.calcSlotLabelStyle = function (slot){
		if (slot.id != 0 && slot.slot != 0 && (!slot.active && !slot.isWonder())) return 3;
		if (slot.level == lib.build.maxlevel) return 2
		if (slot.level >= (wofh.account.research.build[slot.id]||0)) return 1;
		return 0;
	}
	
	bckTown.prototype.roadClick = function(){
		if (this.objOver) {
			if (this.objSel) {
				if(this.objSel.info.id == this.objOver.info.id){
					this.objSel = false;//снимаем выделение
					return;
				}
				
				var find = false;
				for (var point in this.objSel.info.next) {
					if (this.objSel.info.next[point] == this.objOver.info.id){
						this.objSel.info.next.splice(point, 1);//уничтожение дороги
						return;
					}
				}
				
				this.objSel.info.next.push(this.objOver.info.id);//прокладка дороги
			} else {//выбор точки
				this.objSel = this.objOver;
			}
		} else {
			if (this.objSel) {//снимаем выделение
				this.objSel = false;
			} else {//создаём точку
				var posOc = this.getPosOcByWtl(this.posClickWtl);
				this.initRoadPoint(posOc, true);
			}
		}
	};
	
	//подписи кликерам
	bckTown.prototype.initClickersLabels = function(){
		var clickers = cnst.town2.clicker;
		
		this.objNames.clickersLabels = [];
		
		for (var clickerId in clickers) {
			var clicker = clickers[clickerId];
			
			var obj = new CanvasText({
                town: this,
				posView: {
					x: this.sizeO.x / 2 + clicker.x + 25,
					y: this.sizeO.y / 2 + clicker.y - 90
				},
				text: clickerId,
                fontsize: 8,
                sizeView: {x: 10, y: 10},
                rect: 'white',
				type: cnst.townObjType.clickerLabel,
				z: cnst.town2.z.bldLabel,
				show: false
			});
			
			this.pushObj(this.layerDyn, obj);
			
			this.objNames.clickersLabels.push(obj);
		}
	};
	
	bckTown.prototype.clearWrp = function(){
		this.drawStop = true;
		this.clearTimeout(this.ufoTO);
		this.clearTimeout(this.zoomTO);
		this.clearDrawViewTimeout();
        
        bckTown.superclass.clearWrp.apply(this, arguments);
	};
	


//объект канваса - базовый класс, сам не используется
CanvasObj = function(data){
    this.town = data.town;//ссылка на город
    
    this.posView = {x: 0, y: 0}//позиция исходной точки относительно вида
    this.posScreen = {x: 0, y: 0}//дополнительное смещение исходной точки относительно экрана
    this.sizeView = {x: 0, y: 0};//размер в пикселях вида
    this.sizeScreen = {x: 0, y: 0};//размер в пикселях экрана
    this.anchor = {x: 0, y: 0}//якорь! 0-1 0 -лево-верх, 1-право-низ
    this.anim = {}//параметры для анимации
    this.hover = false;//наведена ли мышь на элемент
    this.clickable = false;//меняет курсор мыши при наведении
    this.show = true;//отображение - если  отключено, объект не показывается
    this.invis = false;//когда объект не отображается, но может быть выделен
    this.zLevel = false;//отступ от верхней границы до точки, от которой считается z. Если не указано, ьерется высота картинки
};

	CanvasObj.prototype.getPosByMatrix = function(){
		var x = bckTown.matrix.origin.x + this.matrPos.x - this.matrPos.y;
		var y = bckTown.matrix.origin.y + this.matrPos.x + this.matrPos.y;
		return {x: x, y: y};
	}


    //поолучение верхнего левого угла
    //все рабочие координаты - координаты вида - без учёта зума
    CanvasObj.prototype.getTLPos = function(){
        var size = this.getPosSize();
		
        return {
			x: this.posView.x + this.posScreen.x / this.town.zoom - this.anchor.x * size.x, 
			y: this.posView.y + this.posScreen.y / this.town.zoom - this.anchor.y * size.y
		};
    };
    
	CanvasObj.prototype.getPosWtlByOc = function(posView){
        return this.town.getPosWtlByOc(posView);
    };
    //получение координат центра
    CanvasObj.prototype.getCCPos = function(){
        var size = this.getPosSize();
        var pos = this.getTLPos();
        pos.x += size.x/2;
        pos.y += size.y/2;
        return pos;
    };
    
    CanvasObj.prototype.getSize = function(){
        var width = this.sizeView.x + this.sizeScreen.x / this.town.zoom;
        var height = this.sizeView.y + this.sizeScreen.y / this.town.zoom;
		
        return {x: width, y: height};
    };
    //размер картинки для функции позиционирования
    CanvasObj.prototype.getPosSize = function(){
        return this.getSize();
    };
    //положение по z, складывается своё и родителя
    CanvasObj.prototype.getZ = function(){
        var z = this.z;
		
        if( z === undefined )
            z = this.z = this.calcZ();
		
        if( this.parent )
            z += this.parent.getZ();
		
        return z;
    };

	CanvasObj.prototype.getZLevel = function(){
		return this.zLevel||this.getPosSize().y;
	};
    
	CanvasObj.prototype.calcZ = function(){
		var z;
		
		if ( this.type == cnst.townObjType.build )
			z = this.getTLPos().y - this.town.getSlotDisp(this.info)[1] + 85 * 0.5;
		else
			z = this.getTLPos().y + this.getZLevel();
		
		return z;
	};
    //передрисованием
    CanvasObj.prototype.beforeDraw = function(){};
    //отрисовка объекта
    CanvasObj.prototype.draw = function(canvas){};
    //Обработка наведения - true-обработка проведена, false-продолжаем
    CanvasObj.prototype.onHover = function(pos){
        this.hover = true;
		
        if( this.clickable )
            this.town.toggleHover(true);
		
        if( this.hint ){ 
            this.town.showTooltip(pos, this.hint);
			
            return true;
		}
		
        if( this.parent )
            return this.parent.onHover(pos);
		
        return false;
    };
    //Обработка нажатия
    CanvasObj.prototype.onMouseDown = function(pos){
        this.mouseDown = true;
        return false;
    }
    
    CanvasObj.prototype.onClick = function(pos){
        return false;
    };
    
    //отключаем наведение
    CanvasObj.prototype.clearStatus = function(){
        this.mouseDown = false;
        this.hover = false;
    };
                                                                                                                                   
    CanvasObj.prototype.isShow = function(){
        if (!this.show) return false;
		
        if (this.parent)
            return this.parent.isShow();
		
        return this.show;
    };
	
	CanvasObj.prototype.isInvis = function(){
        return this.invis;
    };
	
    //раходится ли точка внутри объекта
    CanvasObj.prototype.isPosWithin = function(posOc){
        var objSize = this.getSize();
        var objTL = this.getTLPos();
		
        var left = posOc.x > objTL.x;
        var top = posOc.y > objTL.y;
        var right = posOc.x < objTL.x + objSize.x;
        var bottom = posOc.y < objTL.y + objSize.y;
        
        return left && right && top && bottom;
    };
	
	CanvasObj.prototype.isLoaded = function(){
		return true;
	};
	
	CanvasObj.prototype.setCachedObj = function(){
		if( this.town ){
			var cacheId = this.getCacheId();
			
			if( !cacheId )
				return;
			
			this.cachedObj = this.town.layerDynCache[this.getCacheId()];
			
			if( !this.cachedObj )
				delete this.cachedObj; // Чтобы не моячило undefined свойство
		}
	};
	
	CanvasObj.prototype.getCacheId = function(){
		return 0;
	};	
	
    
    

    //текстовый объект
    CanvasText = function(data){
        CanvasText.superclass.constructor.apply(this, arguments);
		
        this.fontsize = 18;//размер шрифта
        this.fontzoom = true;//размер шрифта корректируется зумом
        this.fillStyle = 'black';//заливка текста
        this.strokeStyle;//отчёркивание краёв - по умолчанию отсутствует
        this.anchor = {x: 0.5, y: 0.5};//выводится по умолчанию по центру
		
        $.extend(this, data);
    };
		
        utils.extend(CanvasText, CanvasObj);

        CanvasText.prototype.draw = function(canvas){
			if( !this.isLoaded() ){
				// В случае если изображение не загружено, пытаемся нарисовать ранее отрисовываемое изображение, если оно имеется
				if( this.cachedObj )
					return this.cachedObj.draw(canvas);
				else
					return false;
			}
			else if( this.cachedObj )
				delete this.cachedObj;
			
            canvas.closePath();
            canvas.beginPath();
			
            canvas.textAlign = 'center';
            canvas.textBaseline = 'middle';
			
            var fontsize = this.fontsize * (this.fontzoom? this.town.zoom: 1);
			
            canvas.font = 'bold ' + fontsize + "px Tahoma";

            var posWtl_cc = this.town.getPosWtlByOc(this.getCCPos());
                        
            if( this.rect )
                this.drawRect(canvas);
            
            canvas.fillStyle = this.fillStyle;
            canvas.fillText(this.text, 
                posWtl_cc.x, 
                posWtl_cc.y);

            if( this.strokeStyle ){
                canvas.strokeStyle = this.strokeStyle;
                canvas.strokeText(this.text, 
                    posWtl_cc.x, 
                    posWtl_cc.y);
            }
			
            canvas.stroke();
			
            canvas.closePath();

            return true;
        };
        
        CanvasText.prototype.drawRect = function(canvas){
            var posWtl_tl = this.town.getPosWtlByOc(this.getTLPos());
            var size = this.getSize();

            canvas.fillStyle = this.rect;
            canvas.fillRect(
                posWtl_tl.x, 
                posWtl_tl.y, 
                size.x * this.town.zoom,
                size.y * this.town.zoom);
        };
        
        CanvasText.prototype.animTimer = function(){
            this.text = timeMgr.fPeriod(this.anim.timer - timeMgr.getNow());
        }
		
		CanvasText.prototype.isLoaded = function(){
			if( this.parent && this.parent.needLoadCheck )
				return this.parent.isLoaded();
				
			return true;
		};
		
		CanvasText.prototype.getCacheId = function(){
			if( this.info instanceof Slot )
				return this.name + '_pos' + this.info.getPos();
			
			return 0;
		};

        
        
    CanvasImg = function(data){
        CanvasImg.superclass.constructor.apply(this, arguments);
        
		this.img;//картинка
        this.imgZoom = true;//нужно ли зумить картинку вместе с городом
        this.zoom = 1;//статичный зум
        this.alpha = 1;//прозрачность
        this.sprite = {x: 0, y: 0};//картинка в спрайте
        delete this.sizeView;//по умолчанию удаляем, данные высчитываются
		
        $.extend(this, data);
		
		if( this.z === undefined )
			this.z = this.realZ;
    };
    
        utils.extend(CanvasImg, CanvasObj);
        
		CanvasImg.prototype.getImg = function(){
            return this.img;
        };
		
        //размер, который нужно вырезать из спрайта
        CanvasImg.prototype.getImgSize = function(img){
            if( this.sizeView )
                return utils.clone(this.sizeView);
			
			img = img||this.getImg();
			
            return {x: img.width, y: img.height};
        };
        
        //размер картинки для позиционирования
        CanvasImg.prototype.getPosSize = function(){
            var size = this.getImgSize();
			
            var zoom = this.zoom / (this.imgZoom ? 1 : this.town.zoom);
            
            size.x *= zoom;
            size.y *= zoom;
			
            return size;
        };
        
        //размер картинки в виде
        CanvasImg.prototype.getSize = function(img){
            var size = this.getImgSize(img);
			
            var zoom = this.zoom * (this.imgZoom ? this.town.zoom : 1) ;
			
            size.x *= zoom;
            size.y *= zoom;
			
            return size;
        };
        
        CanvasImg.prototype.getSprite = function(){
            if( this.spriteHover && this.hover )
                return this.spriteHover;
            
            return this.sprite;
        };
        
        CanvasImg.prototype.draw = function(canvas){
			var img = this.getImg();
			
			if( !this.isLoaded(img) ){
				// В случае если изображение не загружено, пытаемся нарисовать ранее отрисовываемое изображение, если оно имеется
				if( this.cachedObj )
					return this.cachedObj.draw(canvas);
				else
					return false;
			}
			else if( this.cachedObj )
				delete this.cachedObj;
			
            if( this.alpha != 1 )
                canvas.globalAlpha = this.alpha;
			
			var imgSize = this.getImgSize(img),
				size = this.getSize(img),
				posView = this.getTLPos(),
				posWtl = this.getPosWtlByOc(posView),
				sprite = this.getSprite();
			
			if( this.dy )
				posWtl.y += this.dy;
			
            canvas.drawImage(
                img,
                sprite.x,
                sprite.y,
                imgSize.x,
                imgSize.y,
                posWtl.x,
                posWtl.y,
                size.x,
                size.y);

            if( canvas.globalAlpha != 1 )
                canvas.globalAlpha = 1;
			
            return true;
        };
        
		CanvasImg.prototype.isLoaded = function(img){
			if( this.parent && this.parent.needLoadCheck )
				return this.parent.isLoaded();
			
			return this.isSelfLoaded(img);
		};
		
		CanvasImg.prototype.isSelfLoaded = function(img){
			img = img||this.getImg();
			
			return img.complete && img.height;
		};
		
        //раходится ли точка внутри объекта
        CanvasImg.prototype.isPosWithin = function(posOc){
            var objSize = this.getImgSize();
            var objTL = this.getTLPos();

            var left = posOc.x > objTL.x;
            var top = posOc.y > objTL.y;
            var right = posOc.x < objTL.x + objSize.x;
            var bottom = posOc.y < objTL.y + objSize.y;

            return left && right && top && bottom;
        };
        
        //временная функция синусоиды
        CanvasImg.prototype.getSinFunc = function(params){
            var now = timeMgr.getNowLocMS();
			
            params.start = params.start||now;
			
            if( params.min === undefined ) params.min = 0;
            if( params.max === undefined ) params.max = 1;
            params.period = params.period||1000;
            
            var dif = (now - params.start) % params.period;
			
            return params.min + (1 - Math.abs(1 - dif / params.period * 2)) * (params.max - params.min);
        };
        
        //анимация вспыхивающего и затухающего зума 
        //anim.zoom.period-период анимации
        //anim.zoom.min-минимальный зум
        //anim.zoom.max-максимальный зум
        CanvasImg.prototype.animZoom = function(){
            this.zoom = this.getSinFunc(this.anim.zoom);
        };
        
        //мерцака
        CanvasImg.prototype.animBlink = function(){
            this.alpha = this.getSinFunc(this.anim.blink);
        };
		
		CanvasImg.prototype.animDy = function(){
            this.dy = this.getSinFunc(this.anim.dy);
        };
		
		CanvasImg.prototype.animSwap = function(){
			if( 
				!this.town.modeSwap || 
				!this.town.modeSwap.slot || 
				(!this.parent.slotHover && this.oldAlpha === undefined) || 
				!this.isShow() || 
				this.town.modeSwap.slot.getSlotType() != this.info.getSlotType()
			){
				this.dy = 0;
				
				return;
			}
			
            if( this.parent.slotHover ){
				if( this.town.modeSwap.slot.getPos() == this.info.getPos() )
					return;

				if( this.oldAlpha === undefined ){
					this.oldAlpha = this.alpha;

					this.alpha = 1;

					for(var slotSwap in this.town.objNames.slotSwapGroup)
						this.town.objNames.slotSwapGroup[slotSwap].alpha = 0.5;
				}

				this.animDy();
			}
			else if( this.oldAlpha !== undefined ){
				this.dy = 0;

				this.alpha = this.oldAlpha;

				delete this.oldAlpha;

				for(var slotSwap in this.town.objNames.slotSwapGroup)
					this.town.objNames.slotSwapGroup[slotSwap].alpha = 1;
			}
        };
		
		CanvasImg.prototype.getCacheId = function(){
			if( this.info instanceof Slot )
				return this.name + '_pos' + this.info.getPos();
			
			return 0;
		};
		
        
    //группировка объектов
    CanvasGroup = function(data){
        CanvasGroup.superclass.constructor.apply(this, arguments);
		
        this.children = {};//дочерние элементы
		
        $.extend(this, data);
    };
		
        utils.extend(CanvasGroup, CanvasObj);
        
        CanvasGroup.prototype.addChild = function(child){
            this.children[child.name] = child;
			
            child.parent = this;
        };
		
		CanvasGroup.prototype.getSlot = function(noBlink){
			var building = noBlink ? false : this.getSlotBlink();
			
			if( !building ) 
				building = this.children.building || this.children.sign || this.children.building11 || this.children.sign11;

			return building;
		};
		
		CanvasGroup.prototype.getSlotBlink = function(){
			return this.children['building-blink'];
		};
		
		CanvasGroup.prototype.getSlotLabel = function(){
			return this.children.levelBack;
		};
		
		CanvasGroup.prototype.getSlotLabelImg = function(){
			return this.children.levelStar;
		};
		
		CanvasGroup.prototype.getSlotLabelText = function(){
			return this.children.levelNumber;
		};
		
		CanvasGroup.prototype.checkLoadedRes = function(){
			if( this.isLoaded() )
				return;
			
			// Устанавливаем сохранённые для предыдущего состояния города объекты.
			// Они будут отрисовываться до тех пор пока у объектов группы не будут загружены все актуальные ресурсы.
			for(var obj in this.needLoadList){
				obj = this.needLoadList[obj];
				
				if( obj )
					obj.setCachedObj();
			}
		};
		
		CanvasGroup.prototype.isLoaded = function(){
			if( this.allResLoaded && this.isPerimetr )
				this.isPerimetr = this.isPerimetr;
			
			if( this.allResLoaded || !this.needLoadCheck )
				return true;
			
			var slot = this.getSlot();
			
			if( !slot )
				return this.allResLoaded = true;
			
			var isLoaded = true;
			
			this.needLoadList = this.needLoadList||{
				slot: slot,
				slotBlink: this.getSlotBlink(),
				slotLabelBack: this.getSlotLabel(),
				slotLabelImg: this.getSlotLabelImg(),
				slotLabelText: this.getSlotLabelText()
			};
			
			this.needLoadCheck = false; // Избавляемся от зацикленности.
			
			for(var obj in this.needLoadList){
				obj = this.needLoadList[obj];
				
				if( obj && !obj.isLoaded() ){
					isLoaded = false;
					
					break;
				}
			}
			
			this.needLoadCheck = true;
			
			return this.allResLoaded = isLoaded;
		};
		
		CanvasGroup.prototype.getSlotRealZ = function(){
			if( !this.isPerimetr )
				return this.getSlot().realZ;
			
			var realZ = 999999999;
			
			for(var child in this.children){
				child = this.children[child];
				
				if( child.type == cnst.townObjType.slot && child.realZ < realZ )
					realZ = child.realZ;
			}
			
            return realZ;
        };
		
        
    CanvasPoint = function(data){
        CanvasImg.superclass.constructor.apply(this, arguments);
        this.strokeStyle = 'red';
        $.extend(this, data);
    };
        utils.extend(CanvasPoint, CanvasObj);
        
        CanvasPoint.prototype.draw = function(canvas){
            canvas.closePath();
            canvas.strokeStyle = this.strokeStyle;
			
            canvas.beginPath();
			
            var posOcl = utils.clone(this.posView);
			
			// Учитываем смещение координат в левый верхний угол спрайта
			if( this instanceof CanvasRoad ){
				posOcl.x += cnst.town2.moversInfo.size.x * 0.5;
				posOcl.y += cnst.town2.moversInfo.size.y * 0.5;
			}
			
            var posWtl = this.town.getPosWtlByOc(posOcl);

            canvas.moveTo(
                posWtl.x, 
                posWtl.y
            );
            canvas.arc(
                posWtl.x, 
                posWtl.y, 
                cnst.town2.moversInfo.rpRad * this.town.zoom, 
                0, 
                2 * Math.PI, 
                false);
                
            canvas.stroke();

            return true;
        };
    
        CanvasRoad = function(data){
            CanvasImg.superclass.constructor.apply(this, arguments);
            this.strokeStyle = 'black';
            $.extend(this, data);
        };
            utils.extend(CanvasRoad, CanvasPoint);
			
            CanvasRoad.prototype.draw = function(canvas){
                CanvasPoint.prototype.draw.apply(this, arguments);
				
                if( this.town.objSel == this || !this.town.objSel ) {
                    var posOcl = utils.clone(this.posView);
					
					// Учитываем смещение координат в левый верхний угол спрайта
					posOcl.x += cnst.town2.moversInfo.size.x * 0.5;
					posOcl.y += cnst.town2.moversInfo.size.y * 0.5;
					
                    var posWtl = this.town.getPosWtlByOc(posOcl);
                    
                    for (var point2 in this.info.next){
                        var point2 = this.town.objNames.roadPoints[this.info.next[point2]];

                        var posOcl = utils.clone(point2.posView);
						
						// Учитываем смещение координат в левый верхний угол спрайта
						posOcl.x += cnst.town2.moversInfo.size.x * 0.5;
						posOcl.y += cnst.town2.moversInfo.size.y * 0.5;
						
                        var pos2Wtl = this.town.getPosWtlByOc(posOcl);

                        canvas.moveTo(
                            posWtl.x, 
                            posWtl.y
                        );
                        canvas.lineTo(
                            pos2Wtl.x, 
                            pos2Wtl.y
                        );
                    }
                }
                
                canvas.stroke();
				
                return true;
            };
            
        CanvasPolygon = function(data){
            CanvasPolygon.superclass.constructor.apply(this, arguments);
            
			this.points = [];
			
            $.extend(this, data);
        };

            utils.extend(CanvasPolygon, CanvasPoint);
            
            CanvasPolygon.prototype.isPosWithin = function(pos){
                
                pos = utils.clone(pos);
                pos.x -= this.town.sizeOMain.disp.x;
                pos.y -= this.town.sizeOMain.disp.y;
                
                var matches = 0;
                for (var i=0; i< this.points.length; i++) {
                    var A = this.points[i%this.points.length];
                    var B = this.points[(i+1)%this.points.length];

                    if (pos.x == A.x) {
                    } else if (pos.x == B.x) {
                        if (B.y > pos.y) {
                            var C = this.points[(i+2)%this.points.length];
                            if (C.x == B.x) {
                                var C = this.points[(i+3)%this.points.length];
                            }
                            if ((B.x - A.x) * (B.x - C.x) < 0){
                                matches ++;
                            }
                        }
                    } else if (A.y == B.y){
                        if (pos.y <= A.y && ((pos.x <= A.x && pos.x > B.x) || (pos.x >= A.x && pos.x < B.x))) {
                            matches ++;
                        }
                    } else {
                        var Xy = (A.y-B.y)/(A.x-B.x)*(pos.x-B.x)+B.y;

                        if (Xy >= pos.y && ((Xy <= A.y && Xy > B.y) || (Xy >= A.y && Xy < B.y))) {
                            matches ++;
                        }
                    }
                }
                return matches%2 == 1;
            }
            
            CanvasPolygon.prototype.draw = function(canvas){
                canvas.closePath();
                canvas.strokeStyle = this.strokeStyle;

                canvas.beginPath();
				
                var first = true;
                for(var point = 0; point <= this.points.length; point++){
                    
                    var pointPos = point%this.points.length;
                    
                    var posOcl = utils.clone(this.points[pointPos]);
                    
                    posOcl.x+=this.town.sizeOMain.disp.x;
                    posOcl.y+=this.town.sizeOMain.disp.y;

                    var posWtl = this.town.getPosWtlByOc(posOcl);

                    if(first){
                        canvas.moveTo(
                            posWtl.x, 
                            posWtl.y
                        );
                    } else {
                        canvas.lineTo(
                            posWtl.x, 
                            posWtl.y
                        );
                    }
                    
                    first = false;
                }
				
                canvas.stroke();
				
                return true;
            };
        

bckTown.houses = [
	{size: {x:1, y:1}, dispImg: {x:-35, y:-12}, zLevel:22}, 
	{size: {x:1, y:2}, dispImg: {x:-60, y:-50}, zLevel:65}, 
	{size: {x:1, y:3}, dispImg: {x:-65, y:0}, zLevel:22}, 
	{size: {x:2, y:1}, dispImg: {x:-33, y:-33}, zLevel:50}, 
	{size: {x:2, y:2}, dispImg: {x:-50, y:-29}, zLevel:45}, 
	//{size: {x:2, y:2}, dispImg: {x:-50, y:-19}, zLevel:40, img: '2x2_2'}, 
	{size: {x:2, y:3}, dispImg: {x:-80, y:-32}, zLevel:55}, 
	{size: {x:3, y:1}, dispImg: {x:-21, y:0}, zLevel:22},
	{size: {x:3, y:2}, dispImg: {x:-62, y:-40}, zLevel:67},
];

bckTown.houseCellDisp = {
	x: 22,
	y: 11,
};

bckTown.matrix = {
	origin: {x: 500, y: 10},
	tileDisp: {x: 20, y: 20}
}

bckTown.slots = {
	0: {
		auraPos: {x:77, y:-329},
		0: {
			area: [{x:1061,y:0},{x:1733,y:0},{x:1733,y:292},{x:1720,y:324},{x:1658,y:323},{x:1569,y:310},{x:1416,y:372},{x:1330,y:389},{x:1215,y:373},{x:1081,y:334},{x:1061,y:319}],
			buildPos: {x:290, y:-375},
		},
	},
	1: {
		auraPos: {x:-907, y:-319},
		0: {
			area: [{x:45,y:310},{x:75,y:285},{x:125,y:320},{x:210,y:525},{x:250,y:730},{x:375,y:805},{x:690,y:665},{x:735,y:660},{x:795,y:635},{x:795,y:590},{x:750,y:525},{x:565,y:475},{x:485,y:440},{x:515,y:420},{x:580,y:445},{x:695,y:480},{x:770,y:495},{x:810,y:555},{x:900,y:555},{x:1070,y:460},{x:1135,y:410},{x:1040,y:380},{x:1035,y:360},{x:1050,y:350},{x:1260,y:420},{x:1380,y:390},{x:1450,y:425},{x:1595,y:465},{x:1620,y:540},{x:1735,y:590},{x:1740,y:610},{x:1725,y:620},{x:1595,y:565},{x:1575,y:495},{x:1430,y:455},{x:1370,y:425},{x:1260,y:455},{x:1175,y:425},{x:1115,y:465},{x:1120,y:490},{x:900,y:605},{x:830,y:595},{x:825,y:650},{x:745,y:695},{x:695,y:700},{x:390,y:830},{x:260,y:895},{x:270,y:955},{x:415,y:1045},{x:710,y:1190},{x:715,y:1200},{x:615,y:1200},{x:210,y:985},{x:195,y:890},{x:310,y:805},{x:225,y:750},{x:175,y:680},{x:120,y:520},{x:95,y:335}],
			buildPos: {x:-873, y:-655},
		},
	},
	2: {
		auraPos: {x:-334, y:-293},
		0: {
			area: [{x:627,y:0},{x:1027,y:0},{x:1027,y:384},{x:1036,y:398},{x:1037,y:434},{x:1015,y:459},{x:973,y:453},{x:952,y:472},{x:906,y:493},{x:798,y:495},{x:744,y:483},{x:642,y:442},{x:626,y:407}],
			buildPos: {x:-126, y:-293},
		},
		1: {
			area: [{x:627,y:0},{x:1027,y:0},{x:1027,y:384},{x:1036,y:398},{x:1037,y:434},{x:1015,y:459},{x:973,y:453},{x:952,y:472},{x:906,y:493},{x:798,y:495},{x:744,y:483},{x:642,y:442},{x:626,y:407}],
			buildPos: {x:-586, y:-343},
		},
	},
	3: {
		auraPos: {x:-642, y:-298},
		0: {
			area: [{x:316,y:383},{x:316,y:250},{x:578,y:250},{x:578,y:326},{x:522,y:396},{x:472,y:419},{x:453,y:444},{x:439,y:444}],
			buildPos: {x:-586, y:-343},
		},
	},
	4: {
		auraPos: {x:-699, y:-154},
		houses: {
			pos: {x:655, y:448},
			matrix: [
				[1,1,1,1,1,1,0],
				[1,0,0,0,0,1,1],
				[1,0,0,0,0,1,1],
				[1,0,0,0,0,1,0],
				[1,0,0,0,0,1,0],
				[1,1,1,1,1,1,0],
				[0,1,1,1,1,1,0],
				[0,0,1,1,0,0,0],
				[0,0,1,0,0,0,0],
			]
		},
		0: {
			area: [{x:190,y:367},{x:256,y:367},{x:549,y:513},{x:549,y:542},{x:512,y:561},{x:481,y:546},{x:397,y:588},{x:283,y:526},{x:283,y:501},{x:242,y:480},{x:190,y:480}],
			buildPos: {x:-545, y:-185},
		},
	},
	5: {
		auraPos: {x:-722, y:-36},
		houses: {
			pos: {x:589, y:568},
			matrix: [
				[1,1,1,1,1,1,1,0,0],
				[1,1,1,0,0,0,0,1,0],
				[1,1,1,0,0,0,0,1,1],
				[1,1,1,0,0,0,0,1,1],
				[1,1,1,0,0,0,0,1,1],
				[0,0,1,1,1,1,1,1,0],
				[0,0,0,1,1,1,1,1,0],
				[0,0,0,0,1,1,1,1,0],
				[0,0,0,0,0,1,1,1,0],
			]
		},
		0: {
			area: [{x:210,y:522},{x:282,y:522},{x:282,y:528},{x:504,y:644},{x:504,y:689},{x:437,y:722},{x:327,y:754},{x:261,y:722},{x:261,y:658},{x:229,y:614},{x:217,y:557},{x:220,y:547}],
			buildPos: {x:-567, y:-43},
		},
	},
	6: {
		auraPos: {x:-686, y:243},
		houses: {
			pos: {x:624, y:851},
			matrix: [
				[1,0,0,1,1,1,1],
				[1,0,1,0,0,0,0],
				[0,0,1,0,0,0,0],
				[0,1,1,0,0,0,0],
				[1,1,1,0,0,0,0],
				[0,1,1,1,1,1,1],
				[0,0,0,0,1,1,0],
			]
		},
		0: {
			area: [{x:275,y:904},{x:395,y:844},{x:418,y:856},{x:449,y:881},{x:540,y:926},{x:409,y:992},{x:363,y:992},{x:319,y:970},{x:275,y:926}],
			buildPos: {x:-530, y:239},
		},
	},
	7: {
		auraPos: {x:-551, y:371},
		houses: {
			pos: {x:834, y:945},
			matrix: [
				[0,0,0,1,1,0,0],
				[0,0,0,1,1,1,0],
				[0,1,1,1,1,1,0],
				[1,1,1,0,0,0,0],
				[1,0,0,0,0,0,0],
				[1,0,0,0,0,0,0],
				[1,0,0,0,0,0,0],
				[1,0,0,1,1,1,1],
			]
		},
		0: {
			area: [{x:409,y:1028},{x:521,y:972},{x:579,y:979},{x:665,y:979},{x:710,y:1001},{x:710,y:1023},{x:686,y:1057},{x:577,y:1112}],
			buildPos: {x:-360, y:358},
		},
	},
	8: {
		auraPos: {x:-328, y:242},
		houses: {
			pos: {x:1045, y:833},
			matrix: [
				[0,1,0,1,1,1],
				[1,1,1,1,0,0],
				[1,1,1,1,1,0],
				[1,0,0,0,0,0],
				[1,0,0,0,0,0],
				[1,0,0,0,0,0],
				[1,0,0,0,0,0],
				[1,1,0,0,0,0],
			]
		},
		0: {
			area: [{x:629,y:920},{x:783,y:843},{x:828,y:843},{x:938,y:898},{x:916,y:909},{x:872,y:909},{x:761,y:964},{x:676,y:943}],
			buildPos: {x:-200, y:222},
		},
	},
	9: {
		auraPos: {x:-522, y:156},
		houses: {
			pos: {x:832, y:747},
			matrix: [
				[0,1,1,1,1],
				[1,0,0,0,0],
				[1,0,0,0,0],
				[1,0,0,0,0],
				[1,0,0,0,0],
				[1,1,1,1,1],
				[0,0,1,1,0],
			]
		},
		0: {
			area: [{x:438,y:823},{x:570,y:757},{x:615,y:757},{x:703,y:801},{x:571,y:867},{x:526,y:867}],
			buildPos: {x:-367, y:114},
		},
	},
	10: {
		auraPos: {x:-433, y:-69},
		houses: {
			pos: {x:922, y:522},
			matrix: [
				[0,1,1,1,0,0,0],
				[1,0,0,0,0,1,0],
				[0,0,0,0,0,1,1],
				[0,0,0,0,0,1,1],
				[0,0,0,0,0,1,1],
				[0,0,1,1,1,1,0],
				[0,1,1,1,1,1,0],
				[0,0,1,1,1,1,0],
				[0,0,1,1,1,1,0],
			]
		},
		0: {
			area: [{x:528,y:642},{x:549,y:610},{x:597,y:586},{x:638,y:543},{x:660,y:532},{x:705,y:532},{x:772,y:566},{x:793,y:598},{x:793,y:620},{x:727,y:653},{x:615,y:686}],
			buildPos: {x:-274, y:-111},
		},
	},
	11: {
		auraPos: {x:-57, y:-25},
		houses: {
			pos: {x:1234, y:566},
			matrix: [
				[0,1,1,0,0],
				[1,0,0,0,0],
				[1,0,0,0,0],
				[1,0,0,0,0],
				[1,0,0,0,0],
				[0,1,1,1,1],
				[0,0,1,1,1],
				[0,0,0,0,1],
			]
		},
		0: {
			area: [{x:904,y:620},{x:992,y:576},{x:1037,y:576},{x:1082,y:598},{x:1102,y:631},{x:948,y:708},{x:926,y:697},{x:904,y:664}],
			buildPos: {x:55, y:-67},
		},
	},
	12: {
		auraPos: {x:173, y:-155},
		houses: {
			pos: {x:1528, y:447},
			matrix: [
				[1,1,0,0,0,0,0],
				[1,1,1,1,1,1,1],
				[1,1,0,0,0,0,1],
				[1,1,0,0,0,0,0],
				[1,1,0,0,0,0,0],
				[1,1,0,0,0,0,0],
				[1,1,1,1,1,1,0],
				[0,1,1,1,1,1,0],
				[0,0,0,1,1,1,0],
			]
		},
		0: {
			area: [{x:1134,y:523},{x:1289,y:446},{x:1333,y:468},{x:1421,y:534},{x:1377,y:557},{x:1289,y:578},{x:1222,y:611},{x:1156,y:578},{x:1134,y:545}],
			buildPos: {x:330, y:-164},
		},
	},
	13: {
		auraPos: {x:266, y:35},
		houses: {
			pos: {x:1621, y:637},
			matrix: [
				[1,1,1,0,0,0,0,0],
				[1,1,1,0,0,0,0,0],
				[0,1,1,0,0,0,0,0],
				[0,1,1,0,0,0,0,0],
				[0,1,1,1,1,1,1,0],
				[0,1,1,1,1,1,1,1],
				[0,1,1,1,0,0,0,0],
				[0,1,1,1,0,0,0,0],
				[0,0,1,1,0,0,0,0],
				[0,0,0,1,0,0,0,0],
			]
		},
		0: {
			area: [{x:1227,y:735},{x:1337,y:680},{x:1337,y:658},{x:1381,y:636},{x:1448,y:669},{x:1390,y:698},{x:1390,y:728},{x:1448,y:757},{x:1448,y:779},{x:1338,y:834},{x:1227,y:779}],
			buildPos: {x:378, y:92},
		},
	},
	14: {
		auraPos: {x:-39, y:187},
		houses: {
			pos: {x:1359, y:767},
			matrix: [
				[0,0,1,0,0],
				[0,0,1,1,0],
				[1,1,1,1,1],
				[1,1,1,1,1],
				[1,0,0,0,0],
				[1,0,0,0,0],
				[1,0,0,0,0],
				[1,0,0,0,0],
				[1,0,0,0,0],
			]
		},
		0: {
			area: [{x:921,y:865},{x:1075,y:788},{x:1120,y:810},{x:1163,y:788},{x:1186,y:799},{x:1186,y:873},{x:1062,y:935}],
			buildPos: {x:94, y:167},
		},
	},
	15: {
		auraPos: {x:-133, y:353},
		houses: {
			pos: {x:1199, y:955},
			matrix: [
				[0,0,0,0,1,1,0],
				[1,1,1,1,1,1,1],
				[1,1,0,0,0,0,0],
				[1,0,0,0,0,0,0],
				[1,1,0,0,0,0,0],
				[1,0,0,0,0,0,0],
			]
		},
		0: {
			area: [{x:827,y:1020},{x:959,y:954},{x:1108,y:1028},{x:1108,y:1051},{x:998,y:1106}],
			buildPos: {x:38, y:363},
		},
		1: {
			area: [{x:827,y:1020},{x:959,y:954},{x:1108,y:1028},{x:1108,y:1051},{x:1227,y:1113},{x:1227,y:1135},{x:1110,y:1193},{x:1045,y:1193},{x:940,y:1140},{x:940,y:1078}],
			buildPos: {x:152, y:445},
		},
	},
	16: {
		auraPos: {x:235, y:357},
		houses: {
			pos: {x:1567, y:959},
			matrix: [
				[1,0,0,1,1,0,0],
				[1,1,1,1,1,1,0],
				[1,1,1,1,1,1,1],
				[1,0,0,0,0,0,0],
				[0,0,0,0,0,0,0],
				[1,1,0,0,0,0,0],
			]
		},
		0: {
			area: [{x:1195,y:1024},{x:1328,y:958},{x:1438,y:1013},{x:1438,y:1058},{x:1413,y:1070},{x:1306,y:1102},{x:1221,y:1059}],
			buildPos: {x:346, y:359},
		},
		1: {
			area: [{x:1195,y:1024},{x:1328,y:958},{x:1570,y:1080},{x:1570,y:1135},{x:1455,y:1195},{x:1385,y:1195},{x:1283,y:1140}],
			buildPos: {x:487, y:435},
		},
	},
	17: {
		auraPos: {x:410, y:234},
		houses: {
			pos: {x:1764, y:825},
			matrix: [
				[0,1,1,1,0,0],
				[1,1,1,1,1,0],
				[1,1,1,1,1,1],
				[0,0,0,0,0,0],
				[1,1,0,0,0,0],
				[1,1,0,0,0,0],
				[1,1,0,0,0,0],
				[0,0,1,1,0,0],
			]
		},
		0: {
			area: [{x:1370,y:901},{x:1502,y:835},{x:1547,y:835},{x:1613,y:868},{x:1613,y:913},{x:1503,y:968},{x:1437,y:957},{x:1392,y:934}],
			buildPos: {x:544, y:225},
		},
		1: {
			area: [{x:1370,y:901},{x:1502,y:835},{x:1547,y:835},{x:1858,y:992},{x:1858,y:1045},{x:1740,y:1104},{x:1670,y:1104},{x:1500,y:1015},{x:1437,y:957},{x:1392,y:934}],
			buildPos: {x:707, y:315},
		},
	},
	18: {
		auraPos: {x:494, y:-68},
		houses: {
			pos: {x:1761, y:534},
			matrix: [
				[1,1,1,1,1,1,1],
				[1,1,1,0,0,0,0],
				[1,1,1,0,0,0,0],
				[0,1,1,0,0,0,0],
				[0,0,1,0,0,0,0],
			]
		},
		0: {
			area: [{x:1455,y:566},{x:1521,y:533},{x:1676,y:610},{x:1566,y:665},{x:1455,y:610}],
			buildPos: {x:607, y:-77},
		},
		1: {
			area: [{x:1455,y:566},{x:1521,y:533},{x:1855,y:703},{x:1855,y:754},{x:1805,y:780},{x:1735,y:780},{x:1569,y:700},{x:1566,y:665},{x:1455,y:610}],
			buildPos: {x:757, y:0},
		},
	},
}




var HousesMatrix = {};
	
	HousesMatrix.getHouseArea = function(house){
		return house.size.x * house.size.y;
	}
	
	//пробуем установить слот по координатам
	HousesMatrix.trySetHouse = function(house, x, y){
		//находим все постройки, считаем у них сумму площадей
		var area = this.getHouseArea(house);
		var concArea = 0;
		var concHouses = [];
		
		//перебираем все клетки в области будущего дома
		for (xi = x; xi < x + house.size.x; xi ++){
			for (yi = y; yi < y + house.size.y; yi ++){
				if (!this.isPosAvail(xi, yi)) return false;
				var concHouse = this.getHouseAt(xi, yi);
				if (concHouse) {
					concArea += this.getHouseArea(concHouse);
					if (concArea >= area) return;
					/*if (concArea == area && concHouses.length == 0) return;*/
					concHouses.push(concHouse);
				}
			}
		}
		
		for (var i in concHouses){
			this.removeHouse(concHouses[i]);
		}
		this.setHouse(house, x, y);
	}
	
	//удаляем домик из списка
	HousesMatrix.removeHouse = function(house){
		for (var houseIPos in this.houses) {
			var houseI = this.houses[houseIPos];
			if (houseI.pos.x == house.pos.x && houseI.pos.y == house.pos.y) {
				this.houses.splice(houseIPos, 1);
				return;
			}
		}
	}
	
	
	//пинаем дом в матрицу
	HousesMatrix.setHouse = function(house, x, y){
		//тут мы переходим от библиотечного домика к домику с привязкой. Поэтому делаем клонирование
		house = utils.clone(house);
		house.pos = {x: x, y: y};
		house.img = house.size.x+'x'+house.size.y+'_'+(utils.random(5)+1);
		
		this.houses.push(house);
	}
	
	//выбираем постройку, которую будем вставлять;
	HousesMatrix.selectHouse = function(){
		i = utils.random(bckTown.houses.length);
		return bckTown.houses[i];
	}
	
	HousesMatrix.eachCell = function(callback){
		for (var y in this.matrix){
			for (var x in this.matrix[y]){
				callback(this.matrix[y][x], x, y);
			}
		}
	}
	
	HousesMatrix.getHouseAt = function(x, y){
		for (var house in this.houses) {
			house = this.houses[house];
			if (house.pos.x <= x && house.pos.x + house.size.x > x) {
				if (house.pos.y <= y && house.pos.y + house.size.y > y) {
					return house;
				}
			}
		}
		return false;
	}
	
	HousesMatrix.calcDensity = function(){
		var availCount = 0;
		var busyCount = 0;
		
		this.eachCell(function(val, x, y){
			if (val == 1) {
				availCount ++;
			}
			if (this.getHouseAt(x, y)){
				busyCount ++;
			}
		}.bind(this));
		
		return busyCount / availCount;
	}
	
	
	//доступен ли слот
	HousesMatrix.isPosAvail = function(x, y){
		return this.matrix[y] && this.matrix[y][x];
	}
	
	HousesMatrix.calc = function(slotPos, density){
		this.houses = [];

		this.lib = bckTown.slots[slotPos].houses;
		if (this.lib) {
			this.matrix = this.lib.matrix;
			
			this.calcHouses(density);
			this.posHouses();	
		}

		return this.houses;
	}
	
	HousesMatrix.calcHouses = function(density){
		var matrixSize = {x: this.matrix[0].length, y: this.matrix.length};
		
		if (this.calcDensity() < density){
			var i = 0;
			while (true){
				var house = this.selectHouse(i);
				i++;
				
				var x = ~~(Math.random() * matrixSize.x);
				var y = ~~(Math.random() * matrixSize.y);
				
				this.trySetHouse(house, x, y);
				
				if (this.calcDensity() >= density){
					break;
				}
			}
		}
		
		return this.houses;
	}
	
	//позиционирование домиков в координатах игры
	HousesMatrix.posHouses = function(){
		for (var house in this.houses) {
			house = this.houses[house];
			
			house.posPx = {}
			house.posPx.x = this.lib.pos.x + house.dispImg.x + (house.pos.x - house.pos.y) * bckTown.houseCellDisp.x;
			house.posPx.y = this.lib.pos.y + house.dispImg.y + (house.pos.x + house.pos.y) * bckTown.houseCellDisp.y;
		}
	}