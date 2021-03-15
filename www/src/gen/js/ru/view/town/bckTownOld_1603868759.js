/**
	Город
*/

cnst.town1 = {}
cnst.town1.units = [
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


    
bckTownOld = function(){
	bckTownOld.superclass.constructor.apply(this, arguments);
    
	this.sizeO = {x: 660, y: 580};
};
	
	bckTownOld.slotPos = [
	    {left:30, top:30, z:5},
	    {left:230, top:85, z:7},
	    {left:335, top:210, z:210},
	    {left:550, top:170, z:170},
	    {left:390, top:73, z:73},
	    {left:540, top:73, z:73},
	    {left:292, top:130, z:130},
	    {left:440, top:155, z:155},
	    {left:218, top:200, z:200},
	    {left:111, top:253, z:253},
	    {left:239, top:280, z:280},
	    {left:491, top:237, z:237},
	    {left:150, top:341, z:341},
	    {left:306, top:354, z:354},
	    {left:451, top:323, z:323},
	    {left:94, top:420, z:420},
	    {left:243, top:429, z:429},
	    {left:392, top:428, z:428},
	    {left:541, top:401, z:401}
	];
	
    utils.extend(bckTownOld, Block);
    
	
	bckTownOld.prototype.calcName = function(){
		return 'oldtown';
	};
	
	bckTownOld.prototype.calcTmplFolder = function(){
		return tmplMgr.oldtown;
	};
	
	bckTownOld.prototype.initOptions = function(){
		bckTownOld.superclass.initOptions.apply(this, arguments);
		
		this.options.staticZ = true;
		this.options.resizeParent = false;
	};
	
	bckTownOld.prototype.addNotif = function(){
		this.notif.show = [Notif.ids.townChange];
	};
	
    bckTownOld.prototype.calcChildren = function(){
		this.children.back = vOldTown_back;
		this.children.slots = vOldTown_slots;
		this.children.links = vOldTown_links;
		this.children.clickers = vOldTown_clickers;
    };
	
	bckTownOld.prototype.toggleInterface = function(){};
	
	bckTownOld.prototype.afterDraw = function(){
		// Перезапускаем итератор очереди строительства, если зашли в город с другого интерфейса
		notifMgr.runEvent(Notif.ids.townBuildQueue);
	};
	

    vOldTown_back = function(parent){
        this.name = 'back';
        vOldTown_back.superclass.constructor.apply(this, arguments);
    };
        utils.extend(vOldTown_back, Block);

        vOldTown_back.prototype.addNotif = function(){
            this.notif.show = [Notif.ids.townCur];
        };
		
        vOldTown_back.prototype.getTmplData = function(){
            //задник
            var terrain = wofh.town.getType();
            var back = {
                climate: wofh.town.climate,
                hill: terrain.hill==3,
                water: terrain.water};

            return back;
        };
    

    vOldTown_slots = function(parent){
        this.name = 'slots';
        vOldTown_slots.superclass.constructor.apply(this, arguments);
    };
        utils.extend(vOldTown_slots, Block);

        vOldTown_slots.prototype.addNotif = function(){
            this.notif = {
                show: [Notif.ids.townBuildings, Notif.ids.townBuildQueue, Notif.ids.accQuests]};
        };
		
        vOldTown_slots.prototype.getTmplData = function(){
            return {slots: wofh.town.slots};
        };


    vOldTown_links = function(parent){
        this.name = 'links';
        vOldTown_links.superclass.constructor.apply(this, arguments);
    };
		
        utils.extend(vOldTown_links, Block);
		
		
		vOldTown_links.coords = [
			'274,0,154,68,152,96,0,172,0,0',
			'363,0,194,94,198,125,0,229,0,174,155,97,156,68,280,0',
			'325,144,411,190,392,200,393,236,412,247,319,295,297,283,298,242,243,214,279,199,279,166',
			'600,76,498,127,497,175,575,214,600,202',
			'297,39,297,71,372,109,445,72,445,39,371,3',
			'447,38,447,70,522,108,595,71,595,38,521,2',
			'199,95,199,127,274,165,347,128,347,95,273,59',
			'348,121,348,153,423,191,496,154,496,121,422,85',
			'126,164,126,196,201,234,274,197,274,164,200,128',
			'19,216,19,248,94,286,167,249,167,216,93,180',
			'146,244,146,276,221,314,294,277,294,244,220,208',
			'398,201,398,233,473,271,546,234,546,201,472,165',
			'59,305,59,337,134,375,207,338,207,305,133,269',
			'212,319,212,351,287,389,360,352,360,319,286,283',
			'358,288,358,320,433,358,506,321,506,288,432,252',
			'2,383,3,453,75,454,150,415,149,382,76,346',
			'150,395,150,461,224,465,298,428,299,396,225,359',
			'304,394,303,458,378,464,452,427,452,394,378,358',
			'449,367,452,442,524,438,597,400,597,367,523,330'
		];
		
		
        vOldTown_links.prototype.addNotif = function(){
            this.notif = {
                show: [Notif.ids.townBuildings, Notif.ids.townBuildQueue, Notif.ids.accQuests]};
        };
        
        vOldTown_links.prototype.getTmplData = function(){
            //строения

            return {slots: wofh.town.getSlots()};
        };


    vOldTown_clickers = function(parent){
        this.name = 'clickers';
        vOldTown_clickers.superclass.constructor.apply(this, arguments);
        
        //число возможных позиций кликеров
        this.itemPosCount = 14;
    }
    
        utils.extend(vOldTown_clickers, Block);
		
        vOldTown_clickers.prototype.addNotif = function(){
            this.notif = {
                show: [Notif.ids.townClickers, Notif.ids.accQuests]};
        };
	
        vOldTown_clickers.prototype.getTmplData = function(){
            this.clickers = wofh.town.getClickers(this.itemPosCount);
			
            return this.clickers;
        };

        vOldTown_clickers.prototype.bindEvent = function(){
            var self = this;

            this.wrp.on('click', '.town-clickers-item', function(){
                var pos = $(this).attr('data-pos');
				
                var clicker = self.clickers[pos];

                new TownClicker(wndMgr.$body, clicker, {y: $(this).offset().top, x: $(this).offset().left});

                $(this).remove();

                appl.sendClicker(clicker.i, clicker.id);
            });
        };