// Очки рейтинга
function RatePoints(id, count) {
	'use strict';
	
	this.id = id;
	this.count = count||0;
}

utils.extend(RatePoints, Element);

RatePoints.getEarnTimeoutTime = function(){
	return Math.max(0, lib.mode.ratepointsdays * timeMgr.DtS - (timeMgr.getNow() - wofh.global.starttime));
};

RatePoints.isEarnTimeout = function(){
	return (timeMgr.getNow() - wofh.global.starttime) * timeMgr.invDtS > lib.mode.ratepointsdays;
};


// МУ аккаунта
function AccountCoins(data){
	'use strict';
	
	utils.copy(this, data);
	
	this.bought = this.bought||0;
	this.moved = this.moved||0;
	this.free = this.free||0;

	this.bonus = this.bonus||false;
	this.bonusspecialist = this.bonusspecialist||false; // Бонус получения ВГ за покупку определенного количества МУ
};

// Аккаунты страны
function CountryAccounts(data){
	'use strict';

	utils.copy(this, data);
};

// Армия города
function TownArmy(data){
	'use strict';

	utils.copy(this, data);
};


// Элемент простой выбиралки
function smplSelectElem(data){
	'use strict';
	
	smplSelectElem.superclass.constructor.apply(this, arguments);
};

utils.extend(smplSelectElem, ArrayElem);

smplSelectElem.prototype.getText = function(){
	return this.text;
};

smplSelectElem.prototype.getVal = function(){
	return this.val;
};



// Математический двухмерный вектор
function Vector2D (x, y) {
	'use strict';
	
	this.set(x, y);
};

Vector2D.prototype.set = function(x, y){
	if( typeof(x) == 'object' ){
		this.x = x.x||0;
		this.y = x.y||0;
	}
	else{
		this.x = x||0;
		this.y = y||0;
	}
};

Vector2D.prototype.clone = function(){
	return new Vector2D(this.x, this.y);
};

Vector2D.prototype.getLength = function(){
	return Math.sqrt(this.x*this.x + this.y*this.y);
};

Vector2D.prototype.doPerp = function(){
	var x = this.x;
	
	this.x = this.y;
	this.y = -x;
	
	return this;
};

Vector2D.prototype.getPerp = function(){
	return new Vector2D(this.y, -this.x);
};

Vector2D.prototype.getNormalized = function(){
	return this.clone().doNormalize();
};

Vector2D.prototype.doNormalize = function(){
	var length = this.getLength();
	
	this.x /= length;
	this.y /= length;
	
	return this;
};

Vector2D.prototype.doMultScalar = function(scalar){
	this.x *= scalar;
	this.y *= scalar;
	
	return this;
};

Vector2D.prototype.getMultScalar = function(scalar){
	return this.clone().doMultScalar(scalar);
};

Vector2D.prototype.toInt = function(){
	this.x = utils.toInt(this.x);
	this.y = utils.toInt(this.y);
	
	return this;
};

Vector2D.prototype.getPoint = function(){
	this.x = utils.toInt(this.x);
	this.y = utils.toInt(this.y);
	
	return {
		x: this.x,
		y: this.y
	};
};


Vector2D.prototype.mult = function(vec){
	this.x *= vec.x;
	this.y *= vec.y;
	
	return this;
};

Vector2D.prototype.addVector = function(vector){
	this.x += vector.x;
	this.y += vector.y;
	
	return this;
};

Vector2D.prototype.diffVector = function(vector){
	this.x -= vector.x;
	this.y -= vector.y;
	
	return this;
};

Vector2D.prototype.getAddVector = function(vector){
	return this.clone().addVector(vector);
};

Vector2D.prototype.getDiffVector = function(vector){
	return this.clone().diffVector(vector);
};

// Переместить по направления вектора
Vector2D.prototype.moveInDir = function(dist){
	return this.doNormalize().doMultScalar(dist);
};

// Переместить вдоль прямой по заданному направлению
Vector2D.prototype.moveAlongLineInDir = function(from, dist){
	return this.getDiffVector(from).moveInDir(dist).addVector(this);
};





// Заказ ресурса
function ResOrder(data) {
	'use strict';
	
	if( data )
		this.parse(data);
};

utils.extend(ResOrder, BaseItem);

ResOrder.prototype.unpack = function(){
	this.unpackResLest();
	
	this.unpackBaseResList();
};

ResOrder.prototype.unpackResLest = function(){
	if( this.res instanceof ResList ) return;
	
	this.res = new ResList(this.res);
};

ResOrder.prototype.unpackBaseResList = function(){
	if( this.resbase instanceof ResList ) return;
	
	this.resbase = new ResList(this.resbase);
};

ResOrder.prototype.getId = function(){
	return this.id;
};

ResOrder.prototype.getResList = function(){
	return this.res;
};

ResOrder.prototype.getBaseResList = function(){
	return this.resbase;
};

ResOrder.prototype.getTown = function(){
	return this.town;
};

ResOrder.prototype.getStatus = function(){
	return this.status;
};

ResOrder.prototype.getText = function(){
	return this.text;
};

ResOrder.prototype.getGroup = function(){
	return this.group;
};

ResOrder.prototype.getDist = function(){
	return this.distance;
};

ResOrder.prototype.getPath = function(){
	return this.path;
};

ResOrder.prototype.isForTown = function(town){
	town = town||wofh.town;
	
	return this.getTown().id == town.id;
};

ResOrder.prototype.isForAccount = function(account){
	account = account||wofh.account;
	
	return this.getTown().account.id == account.id;
};

ResOrder.prototype.isSendable = function(){
	return !this.isForAccount() && (this.getStatus() == ResOrder.statusIds.confirmed || this.getStatus() == ResOrder.statusIds.notConfirmed);
};

ResOrder.prototype.isClosed = function(){
	return this.getStatus() == ResOrder.statusIds.closed;
};

ResOrder.prototype.isFinished = function(){
	return this.getStatus() == ResOrder.statusIds.finished;
};

ResOrder.prototype.isConfirmed = function(){
	return this.getStatus() == ResOrder.statusIds.confirmed;
};

ResOrder.prototype.isRejected = function(){
	return this.getStatus() == ResOrder.statusIds.rejected;
};

ResOrder.prototype.calcProgress = function(){
	return utils.toPercent(1 - (this.getResList().calcSum()/this.getBaseResList().calcSum()));
};


ResOrder.status = {
	0: {name:'notConfirmed', txt:'Nicht geprüft', label: 'Auf Verifizierung'},
	1: {name:'rejected', txt:'Abgelehnt', label: 'Abgelehnt'},
	2: {name:'confirmed', txt:'Geprüft', label: 'Verifiziert'},
	3: {name:'finished', txt:'Abgeschlossen', label: 'Abgeschlossen'},
	4: {name:'closed', txt:'Gelöscht', label: 'Gelöscht'}
};

utils.createIds(ResOrder.status, ResOrder.statusIds = {});



function Contact() {
	Contact.superclass.constructor.apply(this, arguments);
}

utils.extend(Contact, Account);



Contact.types = {
    0: {name: 'other', title: 'Alle'},
    1: {name: 'friends', title: 'Freunde'},
    2: {name: 'enemies', title: 'Feinde'}
};

utils.createIds(Contact.types, Contact.typeIds = {});


Contact.prototype.unpack = function(){
	this.unpackRace();
};

Contact.prototype.cloneBase = function(){
	var clone = Contact.superclass.cloneBase.apply(this, arguments);
	
	if( clone.race instanceof Race )
		clone.race = clone.race.id;
	
	if( !clone.race )
		delete clone.country;

	clone.type = this.type;
	
	return clone;
};

Contact.prototype.getType = function(){
	return this.type;
};

Contact.prototype.setType = function(type){
	this.type = type;
	
	return  this;
};

Contact.prototype.getTypeName = function(){
	return Contact.types[this.getType()].name;
};

Contact.prototype.extractData = function(){
	return utils.copyProperties({}, this.cloneBase());
};





function MMBtn(parent, data) {
	'use strict';
	
	this.setTmpl(tmplMgr.mmenu.btns.btn);
	this.setContTmpl(tmplMgr.mmenu.btns.btn.cont);
	this.setParent(parent);
	this.setData(data);
};

MMBtn.prototype.getAttrs = function(){return '';};

MMBtn.prototype.getType = function(){return this.type;};

MMBtn.prototype.getHref = function(){return this.href;};

MMBtn.prototype.canDisplay = function(){return true;};

MMBtn.prototype.getTitle = function(){return this.title||'';};

MMBtn.prototype.getCls = function(){return '';};

MMBtn.prototype.getTmpl = function(){return this.tmpl(this);};

MMBtn.prototype.setTmpl = function(tmpl){
	this.tmpl = tmpl;
	
	return this;
};

MMBtn.prototype.getContTmpl = function(){return this.contTmpl(this);};

MMBtn.prototype.setContTmpl = function(contTmpl){
	this.contTmpl = contTmpl;
	
	return this;
};

MMBtn.prototype.getParent = function(){return this.parent||false;};

MMBtn.prototype.setParent = function(parent){
	this.parent = parent;
	
	return this;
};

MMBtn.prototype.getData = function(){return this.data||{};};

MMBtn.prototype.setData = function(data){
	this.data = data;
	
	return this;
};

MMBtn.prototype.isExt = function(){
	if( this.getParent() )
		return this.getParent().data.ext;
	
	return false;
};


	
	function MMBtn_towns() {
		'use strict';
		
		MMBtn_towns.superclass.constructor.apply(this, arguments);
		
		this.type = 'towns';
		this.href = hashMgr.getWndHref('towns');
		this.title = 'Stadtübersicht';
	};
	
	utils.extend(MMBtn_towns, MMBtn);
	
	MMBtn_towns.prototype.canDisplay = function(){return wofh.account.isPremium();};
	
	
	function MMBtn_map() {
		'use strict';
		
		MMBtn_map.superclass.constructor.apply(this, arguments);
		
		this.type = 'map';
		this.href = hashMgr.getHref('#map');
		this.title = 'Karte';
	}
	
	utils.extend(MMBtn_map, MMBtn);

	MMBtn_map.prototype.canDisplay = function(){return wofh.account.ability.get(Ability.ids.map);};
	
	MMBtn.prototype.getCls = function(){return '';};
	
	
	function MMBtn_town() {
		'use strict';
		
		MMBtn_map.superclass.constructor.apply(this, arguments);
		
		this.type = 'town';
		this.href = hashMgr.getHref('#town');
		this.title = 'In die Stadt';
	}
	
	utils.extend(MMBtn_town, MMBtn);
	
	
	function MMBtn_report() {
		'use strict';
		
		MMBtn_report.superclass.constructor.apply(this, arguments);
		
		this.type = 'report';
		this.href = hashMgr.getWndHref('reports');
		this.title = 'Berichte';
	}
	
	utils.extend(MMBtn_report, MMBtn);

	MMBtn_report.prototype.canDisplay = function(){return wofh.account.ability.get(Ability.ids.report);};
	
	MMBtn_report.prototype.getCls = function(){return wofh.account.hasNewReports() ? '-active' : '';};
	
	
	function MMBtn_message() {
		'use strict';
		
		MMBtn_message.superclass.constructor.apply(this, arguments);
		
		this.type = 'message';
		this.href = hashMgr.getWndHref('messages');
		this.title = 'Mitteilungen';
	}
	
	utils.extend(MMBtn_message, MMBtn);

	MMBtn_message.prototype.canDisplay = function(){return wofh.account.ability.get(Ability.ids.message);};
	
	MMBtn_message.prototype.getCls = function(){return wofh.account.hasNewMessages() ? '-active' : '';};
	
	
	function MMBtn_rate() {
		'use strict';
		
		MMBtn_rate.superclass.constructor.apply(this, arguments);
		
		this.type = 'rate';
		this.href = hashMgr.getWndHref('rate');
		this.title = 'Ratings';
	}
	
	utils.extend(MMBtn_rate, MMBtn);

	MMBtn_rate.prototype.canDisplay = function(){return wofh.account.ability.get(Ability.ids.rate);};
	
	
	function MMBtn_country() {
		'use strict';
		
		MMBtn_country.superclass.constructor.apply(this, arguments);
		
		this.contTmpl = tmplMgr.mmenu.btns.btn.contCountry;
		
		this.type = 'country';
		this.href = hashMgr.getWndHref('country');
		this.title = 'Land ';
	}
	
	utils.extend(MMBtn_country, MMBtn);

	MMBtn_country.prototype.canDisplay = function(){return wofh.country || wofh.account.research.build[Slot.ids.embassy] || wofh.account.research.build[Slot.ids.embassyAfro] || Quest.isAvail(Quest.ids.country) || wofh.account.invites.length;};
	
	
	function MMBtn_money() {
		'use strict';
		
		MMBtn_money.superclass.constructor.apply(this, arguments);
		
		this.contTmpl = tmplMgr.mmenu.btns.btn.money.cont;
		
		this.type = 'money';
		this.href = hashMgr.getWndHref('money');
	}
	
	utils.extend(MMBtn_money, MMBtn);

	MMBtn_money.prototype.canDisplay = function(){return wofh.account.knowsMoney();};
	
	MMBtn_money.prototype.getTitle = function(){
		var money = this.getParent().data.money,
			title = 'Schatzkammer (';
		
		title += utils.formatNum(money.sum, {int:true, stages:true});
		title += ') — Reserve (';
		title += utils.formatNum(money.reserve, {int:true, stages:true});
		title += ') = Verfügbar (';
		title += utils.formatNum(money.treasury, {int:true, stages:true});
		title += ')';
		
		return utils.escapeHtml(snip.wrp('', title));
	};
	
	
	function MMBtn_science() {
		'use strict';
		
		MMBtn_science.superclass.constructor.apply(this, arguments);
		
		this.contTmpl = tmplMgr.mmenu.btns.btn.science.cont;
		
		this.type = 'science';
		this.href = hashMgr.getWndHref('science');
	}
	
	utils.extend(MMBtn_science, MMBtn);
	
	MMBtn_science.prototype.canDisplay = function(){return Quest.isAvail(Quest.ids.sciSelect) && ScienceList.hasAvail(wofh.country);};
	
	MMBtn_science.prototype.getTitle = function(){
		var science = this.getParent().data.science;
		
		if( science.isEmpty() )
			return '';
		
		var title = science.getName() + ' ';
		
		if( science.isDebt() )
			title += utils.formatNum(science.getCost(), {int: true, stages: true});
		else{
			title += utils.formatNum(science.getProgress(true), {int: true, stages: true});
			title += ' / ';
			title += utils.formatNum(science.getCost(), {int: true, stages: true});
		}
		
		return title;
	};
	
	MMBtn_science.prototype.getAttrs = function(){return 'data-id="'+ this.getParent().data.science.id +'"';};
	
	MMBtn_science.prototype.getCls = function(){return 'mmenu-sci';};
	
	
	
	
	
function Ticket(){
	'use strict';
}


Ticket.getDataFromLS = function(id){
	return ls.getTicketsData({})[id]||{};
};

Ticket.setDataToLS = function(id, data){
	var ticketsData = ls.getTicketsData({});
	
	ticketsData[id] = data;
	
	ls.setTicketsData(ticketsData);
};

Ticket.getLabelFromLS = function(id){
	return Ticket.getDataFromLS(id).label||'0';
};

Ticket.setLabelToLS = function(id, label){
	var ticketData = Ticket.getDataFromLS(id);
	
	ticketData.label = label;
	
	Ticket.setDataToLS(id, ticketData);
};

Ticket.labels = {
	0: {type: '0'},
	1: {type: '1'},
	2: {type: '2'},
	3: {type: '3'}
};
	