function Report (data) {
	$.extend(this, data);
	
	this.prepareData();
}


Report.type = {
	science: 0,
	createTown: 1,
	getDeposit: 2,
	battleShort: 3,
	revolution: 4,
	worldStop: 5,
	depositMove: 6,
	subsidy: 7,
	streamChangeCost: 8,
	payment: 9,
	attackWater: 10,
	luckMove: 11,
	streamOffer: 12,
	settle: 13,
	congrat: 14,
	bonusCode: 15,
	noFuel: 16,
	switchOff: 17,
	sendMoney: 18,
	battleFull: 19,
	attackAir: 20,
	reinfDeath: 21,
	reinf: 22,
	tax: 23,
	sendRes: 24,
	tradeBarter: 25,
	tradeMoney: 26,
	hunger: 27,
	bonusEnded: 28,
	spy: 29,
	stream: 30,
	credit: 31,
	consumption: 32,
	countryJoin: 33,
	countryLeave: 34,
	infoReport: 35,
};

Report.battleResult = {
	loseT: -2,
	lose: -1,
	draw: 0,
	win: 1,
	abort: 2,
};

Report.reinfOperation = {
	gone: 0,
	back: 1,
	withdraw: 2,
};

Report.access = {
	0: {name:'open'},
	1: {name:'ha'},
	2: {name:'hd'},
	3: {name:'haa'},
	4: {name:'hda'}
};

utils.createIds(Report.access, Report.accessIds = {});


Report.prototype.prepareData = function(){
	switch(this.type){
		case Report.type.infoReport:{
			this.prepareReportInfo();
			
			break;
		}
	}
};

Report.prototype.prepareReportInfo = function(){
	this.data.info = JSON.parse(this.data.info);
	
	if( this.data.info.science ){
		this.data.info.comment = this.data.info.text;
		delete this.data.info.text;
		
		this.account = this.owner.clone().parse(this.data.info);
		this.isAccReport = true;
	}
	else{
		utils.copyProperties(this.data.info, this.data.info.main);
		delete this.data.info.main;
		
		set.world.add(this.data.info);
		
		this.data.info.comment = this.data.info.text;
		delete this.data.info.text;
		
		this.data.info.mapbonus = new MapImpList(this.data.info.mapbonus);
		
		this.data.info.resources = this.data.info.resources||{};
		//this.data.info.resources.has = "";
		this.data.info.resources.deposit = this.data.info.deposit;
		delete this.data.info.deposit;
		
		if( this.data.info.consumption )
			this.data.info.consumption = (new ResList(this.data.info.consumption)).excludeFood().onlyPositive();
		if( this.data.info.production )
			this.data.info.production.list = (new ResList(this.data.info.production.list)).onlyPositive();
		
		if( this.data.info.army ){
			this.data.info.armyAll = this.data.info.army;
			delete this.data.info.army;
		}
		
		this.town = this.town1.cloneBase().parse(this.data.info);
		
		delete this.data.info;
	}
};

Report.prototype.getId = function(){
	return this.id;
};

Report.prototype.getCode = function(){
	return this.code;
};

Report.prototype.getIdCode = function(){
	return this.getId() + (this.getCode() > 0 ? '-'+this.getCode() : '');
};

Report.prototype.isTown1Hid = function(){
	return this.town1 === undefined || this.town1.id === undefined;
};

Report.prototype.isTown2Hid = function(){
	return this.town2 === undefined || this.town2.id === undefined;
};

Report.prototype.getIdCode = function(){
	return this.getId() + (this.getCode() > 0 ? '-'+this.getCode() : '');
};

Report.prototype.isShare = function(access, isControl){
	var own = this.owner.id == wofh.account.id ? true : false, //var own = (it.accounts[wofh.account.id] || it.town1.account.id == wofh.account.id) ? true : false,
		canSee = (this.share && this.share[0] >= 0 && !this.share[access]) ? true : false;

	return isControl ? canSee : (own ? false : canSee);
};
// Специальное условия для отчета голода
Report.prototype.isHungerSpecReason = function(){
	return this.data.reason == 1;
};

Report.prototype.hasExtInfo = function(){
	return	this.type == Report.type.battleFull || 
			this.type == Report.type.spy || 
			this.type == Report.type.infoReport;
};
