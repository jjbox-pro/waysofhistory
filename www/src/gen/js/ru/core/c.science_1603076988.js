function Science (id) {
    if (typeof(id) == 'undefined') return this;
    if (!Science.list[id]) return this.getAttributes(id);
    else return Science.get(id).clone();
	//if (typeof id != 'undefined') 
}

utils.extend(Science, Element);

Science.prototype.clone = function(){
    var clone =  new Science();
	
	utils.copyProperties(clone, this);
	
    return clone;
};

Science.prototype.init = function(){ 
    this.initArmy();
	
	this.initBuilds();
	
	this.initOther();
};

Science.prototype.initArmy = function(){
	var army = new Army();
	
    for (var unit in this.units){
        unit = this.units[unit];
		
        if( army.hasElem(unit) ){
            var armyUnit = army.getElem(unit);
			
            armyUnit.isHalf = false;
        } 
		else{
            var armyUnit = army.addElem(unit);
			
            armyUnit.isHalf = true;
        }
    }
	
    this.units = army;
};

Science.prototype.initBuilds = function(){
	var list = new BuildList();
	
    if( this.builds != null ){
		var build;
		
        for (var id in this.builds) {
            list.setCount(this.builds[id][0], this.builds[id][1]);
			
			build = list.getElem(this.builds[id][0]);
			
			if( build.isHidden() )
				list.delElem(build);
			else{
				list.getElem(this.builds[id][0]).level = this.builds[id][1];
				
				list.getElem(this.builds[id][0]).active = false;
			}
        }
    }
	
    this.builds = list;
};

Science.prototype.initOther = function(){
	// Бонусы
	var bonuses = {},
		abilities = {};
	
    for(var bonus in this.bonuses){
        bonus = this.bonuses[bonus];
		
        var bonusId = bonus[0],
			bonusVal = bonus[1];
		
        if( bonusId == Science.bonus.ability1 || bonuses[bonusId] == Science.bonus.ability2 )
        	abilities[bonusVal] = true;
		else{
        	bonuses[bonusId] = bonusVal;
			
			Science.bonusHas[utils.cnstName(Science.bonus, bonusId)] = bonusId;
        }
    }
	
    this.bonuses = bonuses;
	
    this.abilities = abilities;
	
    // Улучшения
    var list = [];
    for (var imp in this.envs){
        imp = new MapImp(this.envs[imp]);
		
        list.push(imp);
    }
	
    this.envs = list;
    
    // Месторождения
    this.deposits = [];
    
    // Специалисты (ВГ)
	this.initSpecialists();
};

Science.prototype.initSpecialists = function(){
	this.specialistList = new SpecialistList(this.specialists);
};


Science.prototype.initNext = function () { 
    this.next = new ScienceList();
	
    for(var sciId in this.takes){
        sciId = this.takes[sciId];
		
        if( sciId != Science.no )
            this.next.addElem(Science.get(sciId));
    }
};

Science.prototype.initPrev = function () { 
    this.require = new ScienceList();
	
    for (var sciId in this.need) {
        sciId = this.need[sciId];
		
        if( sciId != Science.no )
            this.require.addElem(Science.get(sciId));
    }
};

Science.prototype.setParent = function (sciList) {
    this.parent = sciList;
};

Science.prototype.getAttributes = function (id) {
	this.id = +id;
	for (var i in lib.science.list[this.id]) {
		this[i] = lib.science.list[this.id][i];
	}

	return this;
};

Science.prototype.getId = function () {
	return this.id;
};

Science.prototype.getName = function () {
	return this._getAddLib().name;
};

Science.prototype.getDesc = function () {
	return this._getAddLib().desc;
};


//удалить
Science.prototype.hasUnitsAny = function () {
	return !this.units.isEmpty();
};

Science.prototype.getUnits = function () {
	return this.units;
};

//удалить
Science.prototype.getArmy = function () {
	return this.units;
};

Science.prototype.isEmpty = function () {
	return this.id == Science.no;
};

Science.prototype.isDebt = function () {
	return this.id == Science.debt;
};

Science.prototype.hasBuildsAny = function () {
	if (this.builds.isEmpty()) return false;

	for (var bld in this.builds.getList()) {
		bld = this.builds.getElem(bld);
		
		if (!bld.isWonder()) {
			return true;
		}
	}
	return false;
};

Science.prototype.getBuilds = function () {
	if (this.builds.isEmpty()) return false;

	var list = [];
	for (var bld in this.builds.getList()) {
		bld = this.builds.getElem(bld);
		if (bld.isWonder()) {
			continue;
		}
		list.push(bld);
	}

	if (!list.length) {
		list = null;
	}

	return list;
};

Science.prototype.getBuilds2 = function () {
    var list = new BuildList();
    
	if (this.builds === null) return list;

	for (var id in this.builds) {
		list.setCount(this.builds[id][0],this.builds[id][1]);
	}

	return list;
};

Science.prototype.hasBuild = function(buildId){
	if (!this.builds) return false;
	
	return this.builds.hasElem(buildId);
};

Science.prototype.getBuildLevel = function(buildId) {
	return this.builds.getCount(buildId)||0;
};

Science.prototype.hasWondersAny = function () {
	if (this.builds.isEmpty()) return false;

	for (var bld in this.builds.getList()) {
		bld = this.builds.getElem(bld);
		
		if (bld.isWonder()) {
			return true;
		}
	}
	return false;
};

Science.prototype.getWonders = function () {
	if (this.builds.isEmpty()) return false;

	var list = [];
	for (var bld in this.builds.getList()) {
		bld = this.builds.getElem(bld);
		if (!bld.isWonder()) {
			continue;
		}
		list.push(bld);

	}

	if (!list.length) {
		list = null;
	}

	return list;
};

Science.prototype.hasBonusesAny = function () {
	return this.bonuses !== null && utils.sizeOf(this.bonuses)>0;
};

Science.prototype.getBonuses = function () {
	return this.bonuses||[];
};

Science.prototype.getAbilities = function () {
	return this.abilities||[];
};

//удалить
Science.prototype.hasUnit = function (unit) {
    unit = Unit.getId();
	for (var i in this.units) {
		if (this.units[i] != unit) continue;
		return true;
	}
	return false;
};

Science.prototype.getDeposits = function () {
	return this.constructor.getDeposits(this.id);
};

Science.prototype.hasDepositsAny = function () {
	return this.getDeposits() ? true : false;
};

Science.prototype.getKnown = function(byCountry, ignoreParent) {
    if (this.parent && !ignoreParent) {
        return this.parent.state[this.id];
    }
    if (byCountry && wofh.country && wofh.country.science){
        return wofh.country.science.state[this.id];
    } 
    if (wofh.account && wofh.account.science){
        return wofh.account.science.state[this.id];
    }
    return Science.known.done;
};

Science.prototype.isKnown = function (byCountry, ignoreParent) {
	return this.getKnown(byCountry, ignoreParent) == Science.known.done;
};

Science.prototype.isAvail = function (byCountry, ignoreParent) {
	return this.getKnown(byCountry, ignoreParent) == Science.known.avail;
};

Science.prototype.isUnavail = function (byCountry, ignoreParent) {
	return this.getKnown(byCountry, ignoreParent) == Science.known.unavail;
};

Science.prototype.checkDone = function () {
    if (this.isKnown()) return Science.known.done;
    
    for (var sci in this.require.getList()) {
        
        sci = this.parent ? this.parent.getElem(sci) : Science.get(sci);
        if (!sci.isKnown()) return Science.known.unavail;
    }
    return Science.known.avail;
};

Science.prototype.getMapImp = function () {
    var list = [];
    for (var imp in this.envs) {
        imp = new MapImp(this.envs[imp]);
        list.push(imp);
    }
    return list;
}

//коэффициент бонуса
/*Science.prototype.getBonusK = function (bonusId) {
	var bonuses = this.getBonuses();
	for (var i in bonuses) {
		var item = bonuses[i];
		
		if (item[0] == bonusId) return item[1];
	}
	return 0;
}*/

Science.prototype.getBonusK = function (bonusId) {
	var bonuses = this.getBonuses();
	if (bonuses[bonusId]){
		return bonuses[bonusId];
	}
	return 0;
}

//значение бонуса
Science.prototype.getBonus = function (bonusId) {
	return this.getBonusK(bonusId) * Science.getBonusMult(bonusId);
}

/*
Science.prototype.getBonuses = function () {
    var bonuses = {};
    for (var bonus in this.bonuses){
        bonus = this.bonuses[bonus];
        bonuses[bonus[0]] = bonus[1];
    }
    return bonuses;
}*/

Science.prototype.hasAbility = function (ability) {
    return this.getAbilities()[ability]||false;
};


Science.prototype.hasRoadAbility = function () {
    return (
        this.hasAbility(Science.ability.roadDirt) ||
        this.hasAbility(Science.ability.roadHighway) ||
        this.hasAbility(Science.ability.roadRailway) ||
        this.hasAbility(Science.ability.roadMaglev) ||
		this.hasAbility(Science.ability.roadTunnel));
};

Science.prototype.getCost = function () {
	// Научная зодолженность
	if( this.isDebt() )
		return Science.getScienceData(this).debt||0;
	
	return this.cost;
};

Science.prototype.getProgress = function (byCountry){
    if ( this.isEmpty() || this.isDebt() )
		return 0;
	
	return Science.getScienceData(byCountry).progress[this.getId()] || 0;
};

Science.prototype.getProgressPerc = function (byCountry) {
	if( this.isDebt() )
		return 0;
	
	return utils.toInt(this.getProgress(byCountry) / this.getCost() * 100);
};

// Возвращает время в часах 
// Если передается curScience, то getTimeLeft возвращает время с учетом наук в очереди изучения
// onlyAvail - возвращает время только для доступной к изучению науки
Science.prototype.getTimeLeft = function (byCountry, curScience, onlyAvail) {
	var scienceData = Science.getScienceData(byCountry);
	
    if ( !scienceData.inc || scienceData.incReal == 0 ) return false;
	
	if( curScience && utils.inArray(scienceData.queue, +this.getId()) ){
		var timeLeft = 0,
			sciKnowList = ScienceList.getAll().filterKnown(Science.known.avail, byCountry);
		
		for( var science in scienceData.queue ){
			science = new Science(scienceData.queue[science]);
			
			if( science.getId() == curScience.getId() ){
				timeLeft += science.getTimeLeft(byCountry);
				
				if( science.getId() == this.getId() ) break;
			}
			else if( !science.isEmpty() ){
				var	needNext = science.getCost() - science.getProgress(byCountry),
					flow = science.getInc(byCountry, curScience, sciKnowList) * timeLeft;
				
				if( flow > needNext ){
					if( science.getId() == this.getId() ){
						timeLeft = (needNext / flow) * timeLeft;
						break;
					}
				}
				else{
					var coef = 1;
					coef += (sciKnowList.getLength() - 1) > 0 ? 0 : lib.science.otherlearning;
					
					timeLeft += (((needNext - flow) / (scienceData.incReal||0)) * coef);
					
					if( science.getId() == this.getId() ) break;
				}
			}
		}
		
		return timeLeft;
	}
	else if( onlyAvail && !this.isAvail(byCountry, true) ){
		return 0;
	}
	
	return (this.getCost() - this.getProgress(byCountry)) / this.getInc(byCountry);
};

// Возвращает inc (в час) с учетом коэффициента распределения
Science.prototype.getInc = function (byCountry, curScience, sciKnowList) {
	sciKnowList = sciKnowList||ScienceList.getAll().filterKnown(Science.known.avail, byCountry);
	
	var coef = 1,
		scienceProgCount = sciKnowList.getLength() - 1;
	
	if( this.getId() != Science.getCurrent(byCountry, curScience).id && scienceProgCount > 0 ){
		if( this.isAvail(byCountry) )
			coef = lib.science.otherlearning/scienceProgCount;
		else
			coef = 0;
	}
	else if( scienceProgCount == 0 ){
		coef += lib.science.otherlearning;
	}
	
	return (Science.getScienceData(byCountry).incReal||0) * coef;
};

Science.prototype.isCurrent = function (byCountry) {
    return this.getId() == Science.getScienceData(byCountry).current;
};

Science.prototype.isNext = function (byCountry, curScience) {
	if( curScience )
		return this.getId() != curScience.getId();
	else
		return this.getId() == Science.getScienceData(byCountry).next;
};

Science.prototype.getFuel = function () {
};
 
Science.prototype.getNeedSciences = function () {
    return this.require.clone().filterKnown([Science.known.avail, Science.known.unavail], true);
};
 
/**
 * статические методы
 */

Science.getCurrent = function(byCountry, curScience) {
	return curScience||(new Science(Science.getScienceData(byCountry).current));
};

// получение названия науки
Science.getName = function (id) {
	return lib.science.list[id].name;
};

// получение зданий, открывающихся изучением науки
Science.getBuilds = function (id) {
	return lib.science.list[id].builds;
};

Science.getScienceCount = function () {
	var known = wofh.account ? wofh.account.scienceown.state : '-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------',
		num = 0;
	for (var i = 0; i < known.length; ++i) {
		num += known[i] == 2 ? 1 : 0;
	}
	return num;
};

Science.getKnown = function (id) {
    if( this.state )
        return this.state[id];
    else
        return (wofh.account && wofh.account.scienceown && wofh.account.scienceown.state) ? wofh.account.scienceown.state[id] : Science.known.done;
};

Science.isKnown = function (id) {
	return Science.getKnown(id) == Science.known.done;
};

// Расчет процента передачи знаний
Science.calcSpm = function (spm, townPos) {
	return spm[0] * (-Math.atan((townPos + 1 - spm[1]) * spm[2]) / Math.PI + 0.5);
};

    
Science.getBonusMult = function (type) {
	return lib.science.bonus[type];
};

Science.getTownSpm = function (pos, scienceBonusLevel) {
	if (scienceBonusLevel > 14) return 0;
	return lib.science.spm[scienceBonusLevel][0] * (-Math.atan((pos - lib.science.spm[scienceBonusLevel][1]) * lib.science.spm[scienceBonusLevel][2]) / Math.PI + 0.5);
};

/**
 * функция инициализации данных класса
 */

Science.get = function(id){
    id = Science.getId(id);
    return Science.list[id];
};

Science.getScienceData = function (byCountry, account, country) {
	account = account||wofh.account;
	country = country||wofh.country;
	
    if (byCountry && country && country.science) return country.science;
    else return account.science;
};

//инициализация класса
Science.init = function(){
    Science.list = [];
	
    for (var sci in lib.science.list){
        sci = new Science(sci);
        Science.list[sci.getId()] = sci;
        sci.init();
    }

    for (var sci in lib.science.list) {
        sci = Science.list[sci];
        sci.initNext();
        sci.initPrev();
    }
    
    sci = new Science(Science.no);
    Science.list[sci.getId()] = sci;
	
    sci.init();
	
	Science.initDebt();
    
    //топливо
    var resList = new ResList(lib.trade.fuelscience);
    for (var res in resList.getList()){
        res = resList.getElem(res);
        var sciId = res.getCount();
		
        if( sciId != Science.no )
            Science.list[sciId].fuel = res;
    }
    
    //местороды
	for (var deposit in Deposit.list) {
		deposit = Deposit.list[deposit];
		
		if( deposit.science != Science.no )
			Science.list[deposit.science].deposits.push(deposit);
	}
};

//инициализация элемента списка
Science.initItem = function(){
    
}

Science.initDebt = function(){
	var sci = new Science(Science.debt);
	sci.next = new ScienceList();
	sci.require = new ScienceList();
	sci.takes = [];
	for(var i = 0; i < 7; i++){
		sci.takes.push(Science.no);
	}
    sci.init();
	
	Science.list[sci.getId()] = sci;
};

//получение элемента списка
Science.get = function (id) {
	return Science.list[id];
};


Science.getListClone = function(){
    var list = [];
    for (var i in Science.list) {
        list[i] = Science.list[i];
    }
    return list;
};

Science.getSortedListByCost = function(){
    var list = Science.getListClone();
    list.length = lib.science.list.length;
    list.sort(function(a, b){
        return (a.cost||0) - (b.cost||0);
    });
    
    return list;
};

/**
 * константы
 */
Science.ids = {
    money: 19,
    monarchy: 23,
    education: 111,
    fabrics: 141,//ткани
    fishing: 146,
	chemistry: 56
};

// Науки открывающие возможность производства ресурса
Science.production = {};
Science.production[Science.ids.money] = true; // Производство денег
Science.production[Science.ids.fabrics] = true; // Производство одежды
Science.production[Science.ids.fishing] = true; // Производство рыбы

Science.bonus = {
	grown: 0,
	culture: 1,
	income: 2,
	knowledge: 3,
	war: 4,
	production: 5,
	view: 7,
	store: 8,
	trader: 9,
	fish: 11,
	stone: 12,
	iron: 13,
	ability1: 6,
	ability2: 10,
};

// Бонусы, которые действительно есть у наук
Science.bonusHas = {};

// доп.возможности
Science.ability = {
	fish: 0,//abilityFishProduction = 0;
	openMap: 1,
	noBarter: 2,
	money: 3,
	cloth: 4,//abilityClothesProduction = 4;
	roadDirt: 5,
	roadHighway: 6,
	roadRailway: 7,
	roadMaglev: 8,
	longTrade: 9,
	tactics: 10,
	roadTunnel: 13,
};

Science.known = {
	done: '+',
	avail: '*',
	unavail: '-',
};

Science.no = lib.science.noscience;
Science.debt = 998; // id науки "Научная задолженность"

Science.lib = [
    {
        name: 'Разведение огня',
        desc: 'Древнейшие следы применения Огня найдены при раскопках стоянок синантропов и неандертальцев. Вначале, видимо, использовали природный Огонь, возникавший от молнии или самопроизвольного возгорания органических остатков. Искусственное добывание Огня относится к гораздо более позднему времени — вероятно, началу верхнего палеолита. Известно несколько древних способов добывания Огня: скобление, сверление и пиление, основанные на трении двух кусков древесины друг о друга, высекание искр из кремня. Последний способ с начала железного века был усовершенствован при помощи огнива и применялся до изобретения фосфорных спичек.',
    },
    {
        name: 'Земледелие',
        desc: 'В древние времена начался процесс перехода человека от охотника и собирателя к земледелию. При осёдлом образе жизни оно давало гарантированное пропитание. Племя людское размножалось, началось освоение предгорий и плодородных речных долин. Важнейшим и в то же время простейшим и самым распространенным орудием первобытного человека была прямая деревянная копательная палка, заостренная на одном конце. Такая палка-копалка служила не столько для выкапывания, сколько для разрыхления земли. После разрыхления земля выгребалась руками и таким образом добывался нужный для пищи корень.',
    },
    {
        name: 'Орудия труда',
        desc: 'Одним из главных отличий человека от животных является использование орудий труда. Древнейший человек использовал в качестве оружия деревянные палки, дубины, копья, камни. Двумя-тремя грубыми сколами заострив конец гальки, получали первые орудия труда. На протяжении сотен тысяч лет раннего палеолита, изменения в приемах обработки камня были невелики, и человек пользовался лишь несколькими установившимися формами орудий, среди которых наиболее известны скребло и остроконечник.',
    },
    {
        name: 'Приручение животных',
        desc: 'Начав приручать животных, человек сделал один из величайших шагов на пути развития цивилизации. Среди первых была приручена собака, которая помогала в охоте. Примерно в тоже время были приручены животные, которые могли обеспечить запас пищи: крупный рогатый скот, козы, овцы и свиньи. Вероятно, вскоре за ними последовали птицы. Поскольку прирученные животные давали человеку пропитание и уверенность в своих съестных запасах, то он больше не зависел только от охоты и собирательства. Теперь он мог осесть в каком-то постоянном жилище, обзавестись имуществом и начать строить новый тип общества.',
    },
    {
        name: 'Охота',
        desc: 'В первом периоде своего развития охота была главным источником пропитания многих народов; затем по мере открытия новых источников существования, а также по мере истребления опасных для жизни и скотоводства хищных зверей охота постепенно отходит на второй план, оставаясь, однако, по силе привычки и врождённой наследственной потребности одним из главных удовольствий.',
    },
    {
        name: 'Колесо',
        desc: 'Благодаря колесу существенно изменились маршруты движения, которые до этого пролегали вдоль рек. Без колеса доставка груза была возможна только на лодках и санях. Когда сани таскали по земле, то под них клали брёвна, которые играли роль катков. Первые телеги представляли собой сани к которым прикрепили колёса жестко соединенные осью. Колёса и ось составляли единое целое. При поворотах внешнее колесо едет дальше чем внутреннее, поэтому такие колёса обязательно скользили или буксовали.',
    },
    {
        name: 'Алфавит',
        desc: 'До изобретения алфавита человек, чтобы записать какие-либо события или передать сообщение, использовал рисунки. Изображение нескольких антилоп могло обозначать «здесь хорошая охота», то есть это была форма письма. Такое «изобразительное письмо» было широко распространено.<br>Но однажды было сделано открытие, которое приблизило их к созданию алфавита. Люди осознали, что один и тот же знак можно использовать для одного звука во всех сочетаниях, поэтому они применяли ограниченное число знаков в этих целях. Такие знаки и стали алфавитом.',
    },
    {
        name: 'Обработка бронзы',
        desc: 'Были времена когда бронза была самым важным материалом для изготовления инструментов и оружия. Этот период неожиданно был назван бронзовым веком. В это время человек уже обнаружил олово и научился смешивать его с медью для получения бронзы. Бронза привлекала людей прочностью и хорошей ковкостью, что делало ее пригодной для изготовления орудий труда и охоты, посуды, украшений.',
    },
    {
        name: 'Глиноделие',
        desc: 'Первые гончарные изделия появились примерно в глубокой древности. Корзины для зерна изнутри обмазывали влажной глиной чтобы содержимое не просыпалось наружу. Возможно, однажды одна такая корзина загорелась. Тростник сгорел, и получилось первое гончарное изделие.<br>Позже и появился гончарный круг. Гончар клал кусок глины в центр круга, во время вращения которого он придавал глине необходимую форму, надавливая на нее пальцами.',
    },
    {
        name: 'Ритуал погребения',
        desc: 'Отмечать могилы тем или иным способом было принято в очень древние времена. Древний человек устанавливал камень или делал какую-то другую отметку на могиле не только для того, чтобы помешать злым духам подняться, но чтобы отметить место и не допустить повторного погребения в одном и том же месте. Эволюция погребальной обрядности и разные, порою резко отличные друг от друга, формы погребального обряда отмечают существенные перемены в той картине мира, которую древний человек создавал себе из сочетания познаваемой реальности с изменяющимися представлениями о предполагаемых, вымышленных силах, рассеянных, как ему казалось, в природе.',
    },
    {
        name: 'Обработка металлов',
        desc: 'Человек научился получать и обрабатывать железо. Руда перемешивалась с древесным углем и закладывалась в печь. При высокой температуре создаваемой горением угля, углерод начинал соединяться не только с атмосферным кислородом, но и с тем, который был связан с атомами железа. После выгорания угля в печи оставался комок вещества с примесью восстановленного железа, который потом снова разогревали и подвергали обработке ковкой, выколачивая железо из шлака. Сталь производилась уже из готового железа путём науглероживания.<br>Орудия и инструменты из чистого железа выходили слишком мягкими, а из чистой стали — слишком хрупкими. Потому, чтобы изготовить, например, меч, приходилось делать бутерброд из двух пластин железа, между которыми закладывалась стальная пластина. Общими недостатками этой технологии являлись излишняя массивность и недостаточная прочность изделий.',
    },
    {
        name: 'Каменная кладка',
        desc: 'Народы древнего мира возводили искусственные каменные сооружения различного назначения, применяя для этого разнообразные материалы, конструкции и способы возведения.<br>Необычайно высокая трудоёмкость добывания и доставки крупных камней привели к созданию кирпича, который укладывался на глиняных, а затем на известковых растворах. Широкое распространение долгое время имел необожжённый кирпич-сырец, в глину которого часто добавляли резаную солому. Из кирпича выкладывали сложные конструкции, в том числе арки, своды и т. п. Формовали кирпич вручную, сушили только летом, обжигали в напольных печах-времянках, выложенных из высушенного кирпича-сырца.',
    },
    {
        name: 'Письменность',
        desc: 'Письменность позволила хранить человеческие знания с большей надёжностью, чем устная речь. Исторические сведения смогли передаваться другим культурам и храниться очень долго. Первоначальная письменность была основана на изображениях предметов, затем письмо стало идеографическим, т.е передающим идею. Затем появилась силлабическая письменность, когда каждому звуку начал соответствовать определённый символ.',
    },
    {
        name: 'Свод законов',
        desc: 'Свод законов Хаммурапи (или Кодекс Хаммурапи), созданный в глубокой древности является одним из старейших законодательных памятников. Этот свод из 282 законов представляет собой чёрный базальтовый столб.<br>Законы выбиты клинописью на обеих сторонах столба на классическом вавилонском диалекте аккадского языка. В верхней части столба изображен сам Хаммурапи, получающий законы из рук бога солнца Шамаша.<br>Законы Хаммурапи непосредственно вытекают из шумерской правовой традиции. В центре внимания законов хозяйственные, экономические и семейные отношения. Ограничиваются и регламентируются частнособственнические отношения, утверждается государственный контроль над хозяйственной жизнью.<br>Основное внимание уделено описанию наказаний за различные правонарушения. Законы предусматривают суровую систему наказаний: практически любая кража карается смертной казнью.',
    },
    {
        name: 'Строительство',
        desc: 'Cтроительство — это вид человеческой деятельности, направленный на создание зданий, инженерных сооружений (мостов, дорог и т.д.), а также сопутствующих им объектов (инженерных сетей, малых архитектурных форм и т. д.). Зародившись на заре развития человечества, как инстинктивная деятельность человека по целевому изменению или приспособлению окружающей среды для своих нужд, в настоящее время строительство представляет собой сложный и многогранный процесс, находящийся на пересечении технических, экономических, правовых и социальных аспектов.<br>С экономической точки зрения, строительство — отрасль материально-технического производства, в которой создаются основные фонды производственного и непроизводственного назначения: готовые к эксплуатации здания, сооружения и их комплексы.',
    },
    {
        name: 'Речь',
        desc: 'Важным отличием человека от животного является устная речь. Благодаря ей люди смогли общаться, передавать накопленный жизненный опыт, организовывать сложное взаимодействие.',
    },
    {
        name: 'Язычество',
        desc: 'Одна из ранних форм религии, основанная на вере в добрых и злых духов, которые управляют миром, окружающим человека. Постепенно сложился довольно развитый пантеон богов, в котором объединялись общие и местные божества. В образе богов явно видны следы обожествления сил природы.<br>Местами поклонения богам служили возвышенности, священные рощи. Там сооружались деревянные и каменные изваяния, которым приносились жертвы. Кроме того у каждого племени существовали общие святилища, где совершались обряды во время праздников и решались важнейшие вопросы племенной жизни.',
    },
    {
        name: 'Литература',
        desc: 'Развитие литературы сопровождалось развитием науки и искусства, став показателем культуры общества. Библиотеки служили центрами образования и распространения новых идей посредством рукописей, также они стали в своём роде хранилищами знаний. Первоначально доступ к литературе имели только богатые слои общества и монахи.',
    },
    {
        name: 'Математика',
        desc: 'Счет предметов на самых ранних ступенях развития культуры привел к созданию простейших понятий арифметики натуральных чисел. Только на основе разработанной системы устного счисления возникают письменные системы счисления и постепенно вырабатываются приемы выполнения над натуральными числами четырех арифметических действий. Потребности измерения (количества зерна, длины дороги и т. п.) приводят к появлению названий и обозначений простейших дробных чисел и к разработке приемов выполнения арифметических действий над дробями. Таким образом накапливается материал, складывающийся постепенно в древнейшую математическую науку — арифметику. Измерение площадей и объемов, потребности строительной техники, а несколько позднее астрономии вызывают развитие начатков геометрии. Эти процессы шли у многих народов в значительной степени независимо и параллельно. На основе развитой техники арифметических вычислений появились также зачатки алгебры, а в связи с запросами астрономии — зачатки тригонометрии.',
    },
    {
        name: 'Деньги',
        desc: 'Считается, что самые первые монеты появились достаточно рано в человеческой истории. Один великий царь совершил экономическую революцию в своём государстве, введя в обращение монеты и заменив ими бартер.<br>Деньги — особый вид универсального товара, используемого в качестве всеобщего эквивалента, посредством которого выражается стоимость всех других товаров. Не деньги делают товары соизмеримыми. Наоборот. Именно потому, что все товары как стоимости представляют собой овеществлённый человеческий труд и, следовательно, сами по себе соизмеримы.',
    },
    {
        name: 'Демократия',
        desc: 'Демократия — «власть народа». Это вид политического устройства государства или политической системы общества, при которой единственно легитимным источником власти в государстве признается его народ. При этом управление государством осуществляется народом либо напрямую (прямая демократия), либо косвенно, через избираемых посредников или через судебные разбирательства (представительная демократия). В современной политической науке термин «демократия» употребляется как для обозначения теоретической идеальной модели (нормативный подход), так и для описания реально существующих государственных систем в странах, где политический процесс относительно полно отвечает требованиям, предъявляемым к демократии как идеалу (эмпирический подход).<br>Главным признаком демократии является законодательно обеспеченные выборные формы как пропорционального представительства во власти (коллективный орган) так и авторитарного представительства, и обязательного наличия любых форм неотъемлемых прав граждан, несущих в себе механизм защиты интересов меньшинств.',
    },
    {
        name: 'Рабство',
        desc: 'Раб представляет собой лишь «живое орудие», одушевлённую собственность, вьючный скот. Рабы обычно используются как рабочая сила в сельскохозяйственном и другом производстве, в качестве слуг, либо для удовлетворения иных потребностей хозяина. Вещный характер раба, прежде всего, выражается в том, что все продукты рабского труда становятся собственностью владельца; зато и забота о прокормлении и о других нуждах рабов лежит на хозяине. Раб не имеет своей собственности, он может распоряжаться лишь тем, что господин пожелает дать ему. Раб не может вступать в законный брак без разрешения господина, продолжительность брачной связи — если она дозволена — зависит от произвола рабовладельца, которому принадлежат также и дети раба. Как и всякая составная часть имущества, раб может стать предметом всевозможных торговых сделок.',
    },
    {
        name: 'Изобретательство',
        desc: 'Поиск технического решения, обладающее новизной, практической применимостью, полезностью для хозяйственной деятельности. Чтобы быть признанным изобретением, это решение также должно иметь изобретательский уровень, то есть, не быть очевидным, исходя из текущего уровня знаний специалистов. В настоящее время объектами изобретения могут признаваться: устройство, способ, вещество, а также новое применение известного ранее устройства, способа, вещества, штамма.',
    },
    {
        name: 'Монархия',
        desc: 'Монархия — форма правления, при которой верховная государственная власть принадлежит одному лицу — монарху (королю, царю, императору, герцогу, эрцгерцогу, султану, эмиру, хану...) и, как правило, передаётся по наследству.',
    },
    {
        name: 'Навигация',
        desc: 'Навигация зародилась в глубокой древности. К первым мореплавателям относят египтян и финикийцев, однако и другие народы того времени имели навыки путешествий по морю.<br>Основы морской навигации были созданы при начале использования магнитной стрелки компаса для определения курса судна. Важным этапом развития навигации стало начало составления карт в прямой равноугольной цилиндрической проекции, в более ранние времена в картографии не было единого стандарта.',
    },
    {
        name: 'Феодализм',
        desc: 'Феодализм — социально-политическая структура, характеризующаяся наличием двух социальных классов — феодалов (землевладельцев) и крестьян, экономически зависящих от них. Феодалы при этом связаны друг с другом специфическим типом правовых обязательств, известных как феодальная лестница.',
    },
    {
        name: 'Банковское дело',
        desc: 'Многие функции современных банков известны со времен древних цивилизаций. Дошедшие до нас письменные древние источники свидетельствуют о широком распространении ссуд под проценты. Менялы из старинных городов-государств принимали вклады и выдавали ссуды под залог имущества. Наиболее ранние свидетельства существования средневековых банкиров были обнаружены в старинных письменных источниках. Обычно банкир, занимаясь делами, сидел за похожим на скамью столом, называемым bancum, так что само слово «банкир» происходит от bancherius.',
    },
    {
        name: 'Проектирование',
        desc: 'Проектирование — процесс создания проекта, прототипа, прообраза предполагаемого или возможного объекта, состояния.<br>В технике — разработка проектной, конструкторской и другой технической документации, предназначенной для осуществления строительства, создания новых видов и образцов. В процессе проектирования выполняются технические и экономические расчёты, схемы, графики, пояснительные записки, сметы, калькуляции и описания.',
    },
    {
        name: 'Порох',
        desc: 'Первым представителем пороха и взрывчатых веществ был дымный порох — механическая смесь калиевой селитры, угля и серы, обычно в соотношении 75:15:10. Существует устойчивое мнение, что подобные составы появились ещё в древности и применялись главным образом в качестве зажигательных и разрушительных средств. Однако материальных или надёжных документальных подтверждений этого не найдено. В природе месторождения селитры встречаются редко, а калиевая селитра, необходимая для изготовления достаточно стабильных составов, не встречается вообще.',
    },
    {
        name: 'Металлургия',
        desc: 'Первые свидетельства того, что человек занимался металлургией, относятся к глубокой древности. Однако, как это нередко случается со столь давними явлениями, возраст не всегда может быть точно определён.<br>В культуре ранних времён присутствуют серебро, медь, олово и метеоритное железо, позволявшие вести ограниченную металлообработку. Но, научившись добывать медь и олово из горной породы и получать сплав, названный бронзой, люди вступили в Бронзовый век.<br>Получение железа из руды и выплавка металла было гораздо сложнее. Считается, что технология была несколько позже, что стало началом Железного века.',
    },
    {
        name: 'Печатный станок',
        desc: 'Печатание производилось следующим образом: на деревянных козлах, на которых вырезывались выпуклые буквы, наносили жидкую краску, затем сверху накладывали лист бумаги и тёрли мягкой щёткой. Этот способ печати, употреблялся в средние века печатниками на деревянных печатных досках; попытка вырезать слова из меди не привилась.<br>История книгопечатания в современном смысле этого слова начинается с того момента, когда стали изготавливать металлические, подвижные, выпуклые буквы, вырезанные в зеркальном отображении. Из них набирали строки и с помощью пресса оттискивали на бумаге.',
    },
    {
        name: 'Паровой двигатель',
        desc: 'Идея парового двигателя была подсказана его изобретателям конструкцией поршневого водяного насоса, который был известен еще во времена античности. Позднее был придуман самодействующий распределительный механизм, который автоматически включал или отключал пар и впускал воду. Конструкция была дополнена паровым котелом с предохранительным клапаном. Но принципиальная схема машины оставалась неизменна на протяжении 50 лет, пока ее усовершенствованием не занялся механик университета один из преподавателей.<br>Благодаря полученному в результате многочисленных преобразований вращательному движению рабочего вала новый двигатель годился для привода других рабочих машин. Это позволило ему сыграть революционную роль в развитии крупной машинной индустрии. Их применяли буквально во всех сферах производства.',
    },
    {
        name: 'Внутреннее сгорание',
        desc: 'Двигатель внутреннего сгорания — это тип двигателя, тепловая машина, в которой химическая энергия топлива (обычно применяется жидкое или газообразное углеводородное топливо), сгорающего в рабочей зоне, преобразуется в механическую работу.<br>Несмотря на то, что двигатели внутреннего сгорания относятся к относительно несовершенному типу тепловых машин (сильный шум, токсичные выбросы, небольшой ресурс), благодаря своей автономности (используемое топливо содержит гораздо больше энергии, чем лучшие электрические аккумуляторы) двигатели внутреннего сгорания очень широко распространены, например в транспорте.',
    },
    {
        name: 'Электричество',
        desc: 'Вероятно, нет необходимости объяснять значение электричества для обеспечения нормальной жизнедеятельности каждого человека. Не будет преувеличением сказать, что сегодня оно является такой же её составной частью, как вода, тепло, пища. И если в доме погас свет, ты, обжигая пальцы о зажжённую спичку, немедленно звонишь к нам.<br>Долгий и трудный путь проходит электричество прежде, чем попасть в твой дом. Выработанное из топлива на электростанции, оно путешествует через трансформаторные и коммутационные подстанции, через тысячи километров линий, укреплённых на десятках тысяч опор.<br>Электричество сегодня — это совершенная технология, надёжное и качественное электроснабжение, забота о потребителе и его обслуживание.',
    },
    {
        name: 'Календарь',
        desc: 'Календарь — система счисления больших промежутков времени, основанная на периодичности движения небесных тел: Солнца — в солнечных календарях, Луны — в лунных календарях и одновременно Солнца и Луны в лунно-солнечных календарях.<br>Каждый народ использовал свои способы датировки исторических событий. Одни пытались вести отсчёт лет от сотворения мира, другие от освоения Нового Города. Третьи вели отсчёт лет от вступления на трон первого царя. Каждая мировая религия и цивилизация основывала свой календарь летосчисления.',
    },
    {
        name: 'Торговля',
        desc: 'Торговля — процесс обмена товарами, услугами, ценностями и деньгами. Торговля возникла с появлением как разделения труда, так и обменом излишками производимых продуктов или изделий. Обмен сначала носил натуральный характер; с возникновением денег возникли предпосылки для установления товарно-денежных отношений. Торговля, как процесс обмена товарно-материальными ценностями, известна начиная с каменного века. Как в то время, так и сейчас, сутью торговли является предложение к обмену, либо к продаже товарно-материальных, а так же не материальных ценностей с целью извлечения выгоды из этого обмена.',
    },
    {
        name: 'Индустриализация',
        desc: 'Индустриализация (или промышленный переворот) — процесс ускоренного социально-экономического перехода от традиционного этапа развития к индустриальному, с преобладанием производства в экономике. Этот процесс связан с развитием новых технологий, особенно в таких отраслях, как энергетика и металлургия. В ходе индустриализации общество также претерпевает некоторые изменения в философском плане, меняется его мировосприятие.',
    },
    {
        name: 'Железная дорога',
        desc: 'Понятие железная дорога обозначает оборудованную рельсами полосу земли, которая используется для движения рельсовых транспортных средств. Железные дороги бывают с электрической, дизельной, турбинной, паровой или комбинированной тягой. Особый вид железных дорог — зубчатые. Поезда зубчатых железных дорог могут преодолевать гораздо большие подъёмы, чем на обычных железных дорогах. Первый рельсовый путь появился для перевозки породы на рудниках. На этом пути использовались деревянные рельсы и деревянные вагонетки. Когда работоспособных паровозов в то время ещё не было, в качестве тяговой силы использовались лошади.',
    },
    {
        name: 'Сталь',
        desc: 'Сталь — деформируемый (ковкий) сплав железа с углеродом (и другими элементами), характеризующийся эвтектоидным превращением. Содержание углерода в стали не более 2,14 %, но не менее 0,022 %. Углерод придаёт сплавам железа прочность и твёрдость, снижая пластичность и вязкость.',
    },
    {
        name: 'Социализм',
        desc: 'Экономическая, социально-политическая система, характеризующаяся тем, что процесс производства и распределения доходов находится под контролем общества. Важнейшей категорией, которая объединяет различные направления социалистической мысли, является общественная собственность на средства производства, которая полностью или частично заменяет собой частную собственность.',
    },
    {
        name: 'Полеты',
        desc: 'С древних времен человек мечтал летать как птица. Люди экспериментировали с множеством средств для полета, начиная от огромных крыльев, заканчивая летательным аппаратом который стал прототипом вертолета. Однако все эти попытки были обречены на провал, так как все конструкции имели слишком большой вес. Первым же самолётом, который смог самостоятельно оторваться от земли и совершить управляемый горизонтальный полёт, стал «Флайер-1», построенный братьями Райт. С этого момента и началась история полетов.',
    },
    {
        name: 'Конвейер',
        desc: 'Конвейер — такая организация выполнения операций над объектами, при которой весь процесс воздействия разделяется на последовательность стадий с целью повышения производительности путём одновременного независимого выполнения операций над несколькими объектами, проходящими различные стадии. Конвейером также называют средство продвижения объектов между стадиями при такой организации.',
    },
    {
        name: 'Корпорации',
        desc: 'Корпорация — юридическое лицо, которое, будучи объединением физических лиц, при этом независимо от них (то есть самоуправляемо). Ну и вообще в широком смысле под корпорацией можно понимать всякое объединение с экономическими целями деятельности.<br>Юридическое отделение корпорации от её участников даёт ей преимущества, недоступные другим формам объединений, например обществам с ограниченной ответственностью. Конкретный правовой статус и правоспособность корпорации определяется местом её создания.',
    },
    {
        name: 'Атомная теория',
        desc: 'Материя состоит из атомов. Слово атом греческого происхождения, и переводится оно неделимый. Принято считать, что первым идею о том, что кажущаяся гладкой и непрерывной материя на самом деле состоит из великого множества мельчайших и потому невидимых частиц, выдвинул древнегреческий философ.',
    },
    {
        name: 'Автомобиль',
        desc: 'Первые известные чертежи автомобиля были созданы в средние века, однако ни действующего экземпляра, ни сведений о его существовании до наших дней не дошло. Созданию автомобиля предшествовало создание парового двигателя.<br>«Тележку самодвижную» считают предшественницей не только автомобиля, но и паровоза, поскольку она приводилась в движение силой пара. Позднее автомобиль модернизировался. На смену паровому двигателю пришел двигатель внутреннего сгорания, который был намного эффективнее своего предшественника.',
    },
    {
        name: 'Электроника',
        desc: 'Наука о взаимодействии электронов с электромагнитными полями и о методах создания электронных приборов и устройств, в которых это взаимодействие используется для преобразования электромагнитной энергии, в основном для передачи, обработки и хранения информации.',
    },
    {
        name: 'СМИ',
        desc: 'Периодические печатные издания, радио-, теле- и видеопрограммы, кинохроникальные программы, иные формы распространения массовой информации. Под массовой информацией законодатель понимает предназначенные для неограниченного круга лиц печатные, аудио-, аудиовизуальные и иные сообщения и материалы. Запрещено использование СМИ в целях совершения уголовно наказуемых деяний: для призыва к захвату власти, насильственному изменению конституционного строя и целостности государства, разжигания национальной, классовой, социальной, религиозной нетерпимости или розни.',
    },
    {
        name: 'Реактивные полеты',
        desc: 'Хотя принцип действия реактивного двигателя был известен в древности, тем не менее его практическое применение должно было ожидать своего времени. Только гораздно позднее стало возможным претворить на практике мечты многих изобретателей об использовании реактивной силы в качестве движущей силы для летательных аппаратов.<br>Газовая турбина была первоначально разработана как силовая установка промышленного типа, однако ее применение в авиационных турбореактивных и турбовинтовых двигателях мало обязано этой более ранней работе.<br>Первые промышленные и авиационные газовые турбины имели между собой мало общего, за исключением принципа действия, и конструкторы авиационных газотурбинных двигателей различных стран по существу создавали новый тип двигателя, а не приспосабливали двигатели существовавших типов к условиям работы на самолете.',
    },
    {
        name: 'Ядерная энергия',
        desc: 'Энергия деления ядер урана или плутония применяется в ядерном и термоядерном оружии (как пускатель термоядерной реакции).<br>Существовали экспериментальные ядерные ракетные двигатели, но испытывались они исключительно на Земле и в контролируемых условиях, по причине опасности радиоактивного заражения в случае аварии.<br>На атомных электрических станциях ядерная энергия используется для получения электроэнергии и для отопления.<br>Ядерные силовые установки решили проблему судов с неограниченным районом плавания (атомные ледоколы, атомные подводные лодки, атомные авианосцы).<br>В условиях дефицита энергетических ресурсов, ядерная энергетика считается наиболее перспективной в ближайшие десятилетия.',
    },
    {
        name: 'Информационные сети',
        desc: 'Совокупность взаимодействующих автоматических систем обработки информации (преимущественно ЭВМ), объединенных каналами передачи данных. Различают локальные (действующие в пределах предприятия, организации, хозяйства) и территориальные (охватывающие регионы, страны, континенты) информационные сети.',
    },
    {
        name: 'Космические полеты',
        desc: 'Впервые теоретические аспекты космических полётов исследовал русский учёный Константин Циолковский, который сформулировал основные математические положения ракетных двигателей и вывел формулу Циолковского. Немец Герман Оберт также установил в 1923 году основное уравнение ракетной техники и показал с помощью концепции многоступенчатой ракеты как Циолковский, как можно вывести выгодно больший полезный груз на желаемую орбиту.',
    },
    {
        name: 'Глобализация',
        desc: 'Процесс всемирной экономической, политической и культурной интеграции и унификации. Основным следствием этого является мировое разделение труда, миграция в масштабах всей планеты капитала, человеческих и производственных ресурсов, стандартизация законодательства, экономических и технологических процессов, а также сближение и слияние культур разных стран.<br>Это объективный процесс, который носит системный характер, то есть охватывает все сферы жизни общества. В результате глобализации мир становится более связанным и более зависимым от всех его субъектов. Происходит как увеличение количества общих для групп государств проблем, так и расширение числа и типов интегрирующихся субъектов.',
    },
    {
        name: 'Сверхпроводники',
        desc: 'Материалы, которые при определенных условиях приобретают сверхпроводящие свойства. Это достигается понижением температуры, при которой сопротивление материала понижается до нуля.<br>Переход вещества в сверхпроводящее состояние сопровождается изменением его тепловых свойств. Однако, это изменение зависит от рода рассматриваемых сверхпроводников.<br>Даже более важным свойством сверхпроводника, чем нулевое электрическое сопротивление, является так называемый эффект Мейсснера, заключающийся в выталкивании сверхпроводником магнитного потока.<br>Из этого экспериментального наблюдения делается вывод о существовании незатухающих токов внутри сверхпроводника, которые создают внутреннее магнитное поле, противоположнонаправленное внешнему, приложенному магнитному полю и компенсирующее его.',
    },
    {
        name: 'Терроризм',
        desc: 'Один из вариантов тактики политической борьбы, связанный с применением идеологически мотивированного насилия.<br>Суть терроризма — насилие с целью устрашения. Субъект террористического насилия — отдельные лица или неправительственные организации. Объект насилия — власть в лице отдельных государственных служащих или общество в лице отдельных граждан (в том числе иностранцев, или госслужащих иных государств). Кроме того — частное и государственное имущество, инфраструктуры, системы жизнеобеспечения. Цель насилия — добиться желательного для террористов развития событий — революции, дестабилизации общества, развязывания войны с иностранным государством, обретения независимости некоторой территорией, падения престижа власти, политических уступок со стороны власти и т.д.',
    },
    {
        name: 'Мореходство',
        desc: 'Мореходство зародилось в глубокой древности.<br>Мореходство — искусство управлять кораблем, отыскивать в открытом море нужное направление — передвижение товаров и лиц водным путем, оно бывает каботажным (прибрежным), или дальним . У древних мореплавание было почти исключительно прибрежным, переезды с острова на остров предпринимались лишь, если земля была видна.<br>Благодаря успехам морской техники, торговое мореходство развивается чрезвычайно быстро и оно уже не может сравняться с сухопутным. Опасности мореходства уменьшились благодаря правилам для маневрирования во время ураганов, а указания наиболее выгодных курсов дали возможность быстрее совершать рейсы.',
    },
    {
        name: 'Республика',
        desc: 'Республика (лат. res publica, «общее дело») — форма государственного правления, при которой верховная власть осуществляется выборными органами, избираемыми населением (но не всегда) на определённый срок. Первые республики возникли ещё в античности.<br>Республике присущи такие признаки как: существование единоличного главы государства; выборность главы государства на определенный срок; высшая власть основана на принципе разделении властей. При республике источником власти признается народ.<br>Однако не всегда республика является синонимом демократии. Во многих странах, официально республиках, отменяются выборы Президента, либо происходят на безальтернативной основе. В то же время во многих государствах-монархиях демократические институты широко распространены.',
    },
    {
        name: 'Химия',
        desc: 'Химия — наука о веществах, их свойствах, строении и превращениях, происходящих в результате химических реакций, а также фундаментальных законах, которым эти превращения подчиняются. Основная задача химии состоит в изучении взаимодействий между атомами и молекулами.<br>Зачатки химии возникли ещё со времён появления человека. Поскольку человек всегда, так или иначе, имел дело с химическими веществами, то его первые эксперименты с огнём, дублением шкур, приготовлением пищи можно назвать зачатками химии. Постепенно практические знания накапливались, и в самом начале развития цивилизации люди умели готовить некоторые краски, эмали, яды и лекарства.',
    },
    {
        name: 'Физика',
        desc: 'Наука о природе, изучающая простейшие и вместе с тем наиболее общие свойства материального мира. Также физика изучает наиболее общие свойства материи и законы ее движения. В соответствии с изучаемым видом движения материальных объектов физика подразделяется на механику, электродинамику, оптику, относительности теорию, квантовую механику, квантовую теорию поля, термодинамику и статистическую физику; по характеру объектов различают физику элементарных частиц, физику ядер, атомов и молекул, физику газов, жидкостей и твердых тел, физику плазмы и т.п.',
    },
    {
        name: 'Очистка',
        desc: 'Требования к свойствам материалов по мере развития техники непрерывно растут, причём подчас необходимо получить труднореализуемые либо даже несовместимые сочетания свойств. Это и порождает многообразие материалов. Возникают новые классы сложных комбинированных материалов. Материалы становятся всё более специализированные.',
    },
    {
        name: 'Магнетизм',
        desc: 'Магнетизм — форма взаимодействия движущихся электрических зарядов, осуществляемая на расстоянии посредством магнитного поля.<br>Первые упоминания о постоянных магнитах и их использовании в устройствах, например в компасе, встречаются в древнекитайских летописях, возраст которых составляет не менее 2000 лет. О некоторых свойствах магнитов были осведомлены и древние греки. Само название «магнит» предположительно происходит от названия города Магнезия в Азии, где добывались магнетитовые руды. Многие древнегреческие ученые пытались объяснить свойства магнитов. Все накопленные знания о магнитах подытожили лишь в XIX веке. Тогда был открыт закон электромагнитной индукции и впервые был введен в обращение термин «Магнитное поле»',
    },
    {
        name: 'Компас',
        desc: 'КОМПАС, прибор для определения горизонтальных направлений на местности. Применяется для определения направления, в котором движется морское, воздушное судно, наземное транспортное средство, направления на некоторый объект или ориентир. Предположительно, компас был изобретён в Китае при династии Сун и использовался для указания направления движения по пустыням',
    },
    {
        name: 'Партизанство',
        desc: 'Ополчение народа, партизаны, по крайней мере на первых порах, представляются обычно без правильной организации, без общего руководства, проникнутые непримиримой ненавистью к врагу; партизаны по духу, по убеждениям, по действию.',
    },
    {
        name: 'Генетика',
        desc: 'Наука о законах и механизмах наследственности и изменчивости. В зависимости от объекта исследования классифицируют генетику растений, животных, микроорганизмов, человека и другие; в зависимости от используемых методов других дисциплин — молекулярную генетику, экологическую генетику и другие. Идеи и методы генетики играют важную роль в медицине, сельском хозяйстве, микробиологической промышленности, а также в генетической инженерии.',
    },
    {
        name: 'Профсоюзы',
        desc: 'Добровольное общественное объединение людей, связанных общими интересами по роду их деятельности, на производстве, в сфере обслуживания, культуре и т. д.<br>Объединения создаются с целью представительства и защиты прав работников в трудовых отношениях, а также социально-экономических интересов членов организации, с возможностью более широкого представительства наемных работников.',
    },
    {
        name: 'Военное ремесло',
        desc: 'Первым оружием древнего человека были кулаки и камни. Затем для защиты от диких зверей стали применять палицу. Позднее появился каменный топор и пума — каменный шар, вшитый в кожу и имеющий гибкую рукоятку.',
    },
    {
        name: 'Пиратство',
        desc: 'У многих людей слово «пират» ассоциирует некий романтизм. Сундуки с золотом, старые потерянные карты, бочонки с ромом, одноногий кок с попугаем на плече, «Веселый Роджер», жестокие абордажные схватки и этот список можно продолжать бесконечно.<br>Пиратство — грабеж кораблей в море. Оно возникло в глубокой древности, вместе с зарождением торговли и мореплавания. В наиболее известной всем форме пиратство расцвело в XVII веке в Карибском море. Впервые идея ходить под собственным пиратским флагом появилась с целью деморализации и устрашения экипажа атакуемого корабля. Самым распространенным способом ведения морского боя пиратов был абордаж.',
    },
    {
        name: 'Верховая езда',
        desc: 'Лошадь сыграла важную роль в истории человечества, долгое время она была незаменима в военных действиях и при транспортировке грузов. Кто первым приручил лошадь — неизвестно. Пещерными людьми были оставлены рисунки лошади, на которых изображено нечто, напоминающее узду.',
    },
    {
        name: 'Кавалерия',
        desc: 'Кавалерия — род войск, в котором для ведения боевых действий и передвижения используется верховая лошадь. Обладая высокой скоростью, подвижностью и манёвренностью, кавалерия во многих сражениях играла решающую роль.<br>Впервые кавалерия стала применяться в персидской армии. Там она являлась основным видом войск и делилась на тяжёлую, имевшую мечи и пики, и лёгкую, вооружённую луками, дротиками и копьями. Появление в XIV веке огнестрельного оружия и возрастание в связи с этим роли пехоты и артиллерии существенно отразилось на развитии кавалерии. В XVI веке на первый план стала выдвигаться лёгкая кавалерия, вооружённая огнестрельным оружием. Это повлекло за собой изменение способов боевых действий кавалерии: вместо конной атаки и удара холодным оружием стала применяться стрельба шеренгами с коня, выдвигаемыми поочерёдно из глубины боевого порядка.',
    },
    {
        name: 'Повозки',
        desc: 'Первые повозки были массивными, их кузов должен был выдерживать езду без рессор и эластичных шин по грубым дорогам или бездорожью, а при боевом использовании колесниц служить бронёй. Колёса были составными из нескольких сегментов соединённых планками, позднее перешли к спицам, ступице и ободу.',
    },
    {
        name: 'Лидерство',
        desc: 'Один из механизмов координации социальной группы, т.е. когда человек, эффективно осуществляет формальное или неформальное руководство группой. Тип лидерства всегда связан с социальной природой общества и специфическим характером и структурой группы.',
    },
    {
        name: 'Теория тактики',
        desc: 'Тактика — составная часть военного искусства, включающая теорию и практику подготовки и ведения боя соединениями, частями (кораблями) и подразделениями различных видов вооружённых сил, родов войск и специальных войск на суше, в воздухе и на море; военно-теоретическая дисциплина. Тактика охватывает изучение, разработку, подготовку и ведение всех видов боевых действий: наступления, обороны, встречного боя, тактических перегруппировок и т. д.',
    },
    {
        name: 'Автоматическое оружие',
        desc: 'Автоматическое оружие — огнестрельное оружие, в котором перезаряжание и производство очередного выстрела выполняются автоматически за счёт образующейся при выстреле энергии пороховых газов или энергии других (посторонних) источников. Автоматическое оружие бывает одиночного (самозарядное) и непрерывного огня (самострельное).',
    },
    {
        name: 'Пластмассы',
        desc: 'Пластмассы — органические материалы, основой которых являются синтетические или природные высокомолекулярные соединения (полимеры). Исключительно широкое применение получили пластмассы на основе синтетических полимеров.<br>Название «пластмассы» означает, что эти материалы под действием нагревания и давления способны формироваться и сохранять после охлаждения или отвердения заданную форму. Процесс формования сопровождается переходом пластически деформируемого (вязкотекучего) состояния в стеклообразное состояние.',
    },
    {
        name: 'Радио',
        desc: 'Радио — разновидность беспроводной связи, при которой в качестве носителя сигнала используются радиоволны. Радиоволны распространяются как в пустоте, так и в атмосфере, однако они с трудом проходят через воду и землю. Интересно, что у радиосигнала есть некоторые особые эффекты, к примеру, радиосигнал хорошо принимается в точке земной поверхности, приблизительно противоположной передатчику. Первый в мире радиоприемник, разработанный в 1893 году, мог принимать сигналы на расстоянии до 60 метров от передатчика.',
    },
    {
        name: 'Бронетехника',
        desc: 'Боевые и военные бронированные машины на колёсном и гусеничном шасси, а также военные машины созданные на их базе или предназначенные для их обслуживания и мотоциклы.',
    },
    {
        name: 'Комбинированные армии',
        desc: 'Только рациональное распределение задач между разнообразно сочетающимися родами войск позволяет решать сложнейшие военные задачи, стоящие перед современными армиями.',
    },
    {
        name: 'Утилизация',
        desc: 'Повторное использование или возвращение в оборот отходов производства или мусора.<br>Наиболее распространена вторичная, третичная и т. д. переработка в том или ином масштабе таких материалов, как стекло, бумага, алюминий, асфальт, железо, ткани и различные виды пластика.<br>Также с глубокой древности используются в сельском хозяйстве органические сельскохозяйственные и бытовые отходы.Утилизация (От лат. Utilis — Полезный Utilitas — Польза) Дословный смысл — Извлечение из отходов пользы.',
    },
    {
        name: 'Ракетостроение',
        desc: 'Разработка технологий и теоретических обоснований для постройки летательных аппаратов, двигающихся в пространстве за счёт действия реактивной тяги, возникающей при отбросе ракетой части собственной массы (рабочего тела). Полёт ракеты не требует обязательного наличия окружающей воздушной или газовой среды и возможен не только в атмосфере, но и в вакууме.',
    },
    {
        name: 'Экология',
        desc: 'Экология — наука, изучающая взаимоотношения живой и неживой природы. Современное значение слова экология имеет более широкое значение, чем в первые десятилетия развития этой науки. Даже более того, сегодня чаще всего под экологическими вопросами понимаются, прежде всего, вопросы охраны окружающей среды. Во многом такое изменение смысла произошло благодаря всё более ощутимым последствиям влияния человека на окружающую среду.<br>Экология обычно рассматривается как подотрасль биологии. Живые организмы могут изучаться на различных уровнях, экология же изучает среду в которой они живут и её проблемы. Экология связана со многими другими науками именно потому, что она изучает организацию живых организмов на очень высоком уровне, исследует связи между организмами и их средой обитания.',
    },
    {
        name: 'Защита окружающей среды',
        desc: 'Охрана окружающей среды — комплекс мер, предназначенных для ограничения отрицательного влияния человеческой деятельности на природу. Такими мерами являются: ограничение выбросов в атмосферу и гидросферу с целью улучшения общей экологической обстановки; создание заповедников, заказников и национальных парков с целью сохранения природных комплексов; ограничение ловли рыбы, охоты с целью сохранения определённых видов; ограничение несанкционированного выброса мусора.<br>Сохраняйте и защищайте окружающую среду, так как защищаете себя. Ведь окружающая среда это то место, где мы живём.',
    },
    {
        name: 'Монотеизм',
        desc: 'Монотеизм или Единобожие — религиозное представление и учение о Едином Боге (в противоположность языческому многобожию, политеизму). В монотеизме Бог обычно персонифицируется, то есть является определённой «личностью». Древнейшей монотеистической религией, сохранившейся до настоящего времени, является зороастризм.',
    },
    {
        name: 'Мистицизм',
        desc: 'Древний человек был зависим от сил природы, поэтому старался найти способ повлиять на них, заручиться поддержкой этих непонятных для него сил. Древние шаманы и оракулы предлагали механизм такого взаимодействия, трактуя различные природные явления как знаки высших сил. Мистицизм давал древнему человеку восприятие окружающего мира на основе эмоций, интуиции и иррационализма.',
    },
    {
        name: 'Философия',
        desc: 'Философия (дословно с древнегреческого — любовь к мудрости) — наиболее общая теория, одна из форм мировоззрения, одна из форм человеческой деятельности, особый способ познания.<br>Общепринятого определения философии, равно как общепринятого представления о предмете философии, не существует. В истории существовало множество различных типов философии, отличающихся как своим предметом, так и методами. В самом общем виде под философией понимают деятельность, направленную на постановку и рациональное разрешение наиболее общих вопросов, касающихся сущности знания, человека и мира.<br>Специфика философского мировоззрения и философский способ решения вечных проблем человеческого бытия становятся очевидными при сравнении философии с наукой, религией и искусством.',
    },
    {
        name: 'Астрономия',
        desc: 'Наука о движении, строении и развитии небесных тел и их систем, вплоть до Вселенной в целом. Роль астрометрии долгое время состояла также в высокоточном определении географических координат и времени с помощью изучения движения небесных светил.<br>В частности, астрономия изучает Солнце, планеты Солнечной системы и их спутники, астероиды, кометы, метеороиды, межпланетное вещество, звёзды и внесолнечные планеты (экзопланеты), туманности, межзвёздное вещество, галактики и их скопления, пульсары, квазары, чёрные дыры и многое другое.',
    },
    {
        name: 'Мостостроение',
        desc: 'Мост является одним из древнейших инженерных изобретений человечества.<br>Мостостроительство — длительный и сложный процесс, связанный с необходимостью больших проектно-исследовательских работ и капиталовложений на создание и развитие промышленной базы. Первым (и самым дорогим — до 50 % расходов от общей стоимости строительства) этапом в построении моста является возведение опор. Пролётные строения обычно устанавливают на опоры монтажными кранами.<br>Мост, перекинутый через дорогу, называют путепроводом, мост через овраг или ущелье — виадуком. Многие мосты являются выдающимися памятниками зодчества и инженерного искусства.',
    },
    {
        name: 'Медицина',
        desc: 'Область научной и практической деятельности по исследованию нормальных и патологических процессов в организме человека, различных заболеваний и патологических состояний, по сохранению и укреплению здоровья людей.<br>В медицине выделяют теоретическую и практическую медицину.<br>Теоретическая или биомедицина — область науки, изучающая организм человека, его нормальное и патологическое строение и функционирование, заболевания, патологические состояния, методы их диагностики, коррекции и лечения с теоретических позиций.<br>Практическая, или клиническая, медицина — практическое применение накопленных медицинской наукой знаний, для лечения заболеваний и патологических состояний человеческого организма.',
    },
    {
        name: 'Всемирное тяготение',
        desc: 'В рамках классической механики гравитационное взаимодействие описывается законом всемирного тяготения Ньютона, который гласит, что сила гравитационного притяжения между двумя материальными точками массы m1 и m2, разделёнными расстоянием R, пропорциональна обеим массам и обратно пропорциональна квадрату расстояния между ними.',
    },
    {
        name: 'Теория относительности',
        desc: 'Геометрическая теория тяготения, развивающая специальную теорию относительности (СТО), опубликованная Альбертом Эйнштейном в 1915—1916 годах.<br>В рамках общей теории относительности, как и в других метрических теориях, постулируется, что гравитационные эффекты обусловлены не силовым взаимодействием тел и полей, находящихся в пространстве-времени, а деформацией самого пространства-времени, которая связана, в частности, с присутствием массы-энергии. Общая теория относительности отличается от других метрических теорий тяготения использованием уравнений Эйнштейна для связи кривизны пространства-времени с присутствующей в нём материей.',
    },
    {
        name: 'Оптика',
        desc: 'Раздел физики, рассматривающий явления, связанные с распространением электромагнитных волн преимущественно видимого и близких к нему диапазонов (инфракрасное и ультрафиолетовое излучение). Оптика описывает свойства света и объясняет связанные с ним явления. Методы оптики используются во многих прикладных дисциплинах, включая электротехнику, физику, медицину (в частности, офтальмологию). В этих, а также в междисциплинарных сферах широко применяются достижения прикладной оптики.',
    },
    {
        name: 'Баллистика',
        desc: 'Истоки баллистики теряются в древности. Самым первым ее проявлением было, несомненно, метание камней доисторическим человеком. Такие предшественники современного оружия, как лук, катапульта и баллиста, могут служить типичным примером самых ранних видов применения баллистики. На протяжении многих лет использовались разные способы ускорения метательных снарядов. Лук ускорял стрелу за счет энергии, запасенной в согнутом куске дерева; пружинами баллисты служили скручиваемые сухожилия животных. Прогресс в конструировании оружия привел к тому, что в наши дни артиллерийские орудия стреляют 90-килограммовыми снарядами на расстояния более 40 км.',
    },
    {
        name: 'Дипломатия',
        desc: 'Слово «дипломатия» происходит от греческого слова diploma (в Древней Греции этим словом назывались сдвоенные дощечки с нанесёнными на них письменами, выдававшиеся посланцам в качестве верительных грамот и документов, подтверждавших их полномочия). Как обозначение государственной деятельности в области внешних отношений слово «дипломатия» вошло в обиход в Западной Европе в конце XVIII века.<br>В рабовладельческом обществе дипломатические связи поддерживались лишь эпизодически посольствами, которые направлялись в отдельные страны с определённой миссией и возвращались после её выполнения.<br>В условиях феодальной раздробленности получила распространение «частная» дипломатия феодальных суверенов, которые в промежутках между войнами заключали мирные договоры, вступали в военные союзы, устраивали династические браки. Позднее с развитием международных отношений постепенно появляются постоянные представительства государств за границей.',
    },
    {
        name: 'Политеизм',
        desc: 'Политеизм (от греч. «многочисленный, много» + греч. «бог, божество») — буквально «многобожие» — религия, совокупность верований, основанная на вере в нескольких богов. Боги имеют собственные пристрастия, характер, вступают в отношения с другими богами и имеют специфическую сферу влияния.',
    },
    {
        name: 'Религия',
        desc: 'Религия — особая форма осознания мира, обусловленная верой в сверхъестественное, включающая в себя свод моральных норм и типов поведения, обрядов, культовых действий и объединение людей в организации (церковь, религиозную общину).<br>Религиозная система представления мира (мировоззрение) опирается на веру или мистический опыт и связана с отношением к непознаваемым и нематериальным сущностям. Религия, в отличие от науки, оперирует такими категориями, как добро и зло, нравственность, цель и смысл жизни и т. д.',
    },
    {
        name: 'Фундаментализм',
        desc: 'Фундаментализм (от лат. Fundamentum — основание) — общее наименование крайне консервативных религиозных течений. Основными его идеологическими положениями является необходимость строгого следования предписаниям, установленным в религиозных священных книгах, недопустимость критики, либо либерального толкования указанных текстов. Фундаментализм является реакцией на протекающие в современном обществе процессы глобализации и секуляризации и в качестве одной из основных своих задач рассматривает возвращение религиозным структурам господствующих позиций в обществе.',
    },
    {
        name: 'Богословие',
        desc: 'Богословие — совокупность доктрин о сущности и бытии Бога. Богословие возникает исключительно в рамках такого типа вероучений, как теизм. В строгом смысле о богословии принято говорить применительно к авраамическим религиям (иудаизму, христианству и исламу). Древние традиции, известные как (Веды), также относятся к теизму.<br>Поэтому под системой богословия понимается набор различных богословских дисциплин, каждая из которых излагает различные стороны вероучения и культа социальной группы.',
    },
    {
        name: 'Экономика',
        desc: 'Cфера деятельности людей, в результате которой создается богатство для удовлетворения разнообразных потребностей, как их самих, так и общества. Необходимость выбора в экономике обусловлена двумя объективными причинами: потребностью и ограниченностью ресурсов. Общество всегда стремится определить оптимальный вариант экономического развития, т.е. такой, при котором не только будут отсутствовать потери (прямые и косвенные), но и наилучшим образом использоваться факторы производства (средства производства и рабочая сила).',
    },
    {
        name: 'Левитация',
        desc: 'Для левитации необходимо наличие силы, компенсирующей силу тяжести. Источниками таких сил могут быть струи газа, сильные звуковые колебания, лазерные лучи и др.<br>Также научно была обнаружена и экспериментально доказана диамагнитная левитация.',
    },
    {
        name: 'Санитария',
        desc: 'Система мероприятий, обеспечивающих охрану здоровья и профилактику различных заболеваний, а также комплекс мер по практическому применению разработанных гигиенической наукой нормативов, санитарных правил и рекомендаций, обеспечивающих оптимизацию условий воспитания и обучения, быта, труда, отдыха и питания людей с целью укрепления и сохранения их здоровья.',
    },
    {
        name: 'Взрывчатые вещества',
        desc: 'Химическое соединение или их смесь, способное в результате определённых внешних воздействий или внутренних процессов взрываться, выделяя тепло и образуя сильно нагретые газы. Комплекс процессов который происходит в таком веществе, называется детонацией. Традиционно к взрывчатым веществам также относят соединения и смеси, которые не детонируют, а горят с определенной скоростью (метательные пороха, пиротехнические составы).<br>Существует ряд веществ, также способных к взрыву (например, ядерные и термоядерные материалы, антивещество). Также существуют методы воздействия на различные вещества, приводящие к взрыву (например, лазером или электрической дугой). Обычно такие вещества не называют «взрывчатыми».',
    },
    {
        name: 'Воинская повинность',
        desc: 'Долг и обязанность граждан с оружием в руках защищать государство и нести воинскую службу в рядах вооруженных сил. Воинская обязанность законодательно закреплена в большинстве стран мира, но во многих государствах существует воинская повинность, предполагающая несение службы, как в военное, так и в мирное время.<br>Изначально война была уделом аристократии. Но в периоды расцвета древних государств, которые сопровождались захватническими войнами, вводилась рекрутская повинность широких слоев населения, позволявшая набирать и пополнять необходимые для походов большие армии. В частности, рекрутские наборы существовали в Древнем Египте. В Древнем Риме военная служба также являлась обязанностью гражданина.',
    },
    {
        name: 'Миниатюризация',
        desc: 'Общая закономерность научно-технического развития во всех сферах человеческой деятельности — прогрессирующее усложнение, интеграция и интенсификация техники.',
    },
    {
        name: 'Нанотехнология',
        desc: 'Междисциплинарная область фундаментальной и прикладной науки и техники, имеющая дело с совокупностью теоретического обоснования, практических методов исследования, анализа и синтеза, а также методов производства и применения продуктов с заданной атомной структурой путём контролируемого манипулирования отдельными атомами и молекулами.',
    },
    {
        name: 'Компьютеры',
        desc: 'Первые компьютеры создавались исключительно для вычислений (что отражено в названиях «компьютер» и «ЭВМ»). Даже самые примитивные компьютеры в этой области во много раз превосходят людей (если не считать некоторых уникальных людей-счётчиков).<br>Вторым крупным применением были базы данных. Прежде всего, они были нужны правительствам и банкам. Базы данных требуют уже более сложных компьютеров с развитыми системами ввода-вывода и хранения информации.<br>Третьим применением было управление всевозможными устройствами. Здесь развитие шло от узкоспециализированных устройств (часто аналоговых) к постепенному внедрению стандартных компьютерных систем, на которых запускаются управляющие программы.',
    },
    {
        name: 'Робототехника',
        desc: 'Прикладная наука, занимающаяся разработкой автоматизированных технических систем.<br>Робототехника опирается на такие дисциплины как электроника, механика, программное обеспечение. Выделяют строительную, промышленную, бытовую, авиационную и экстремальную (военную, космическую, подводную) робототехнику.',
    },
    {
        name: 'Шпионаж',
        desc: 'Противозаконная разведывательная деятельность органов (их агентов) иностранных государств, что, как правило, предполагает похищение официально засекреченной информации (государственной тайны) спецслужбами недружественных государств.',
    },
    {
        name: 'Заморозка',
        desc: 'Заморозка раскрыла себя как выгодный с коммерческой точки зрения метод увеличения срока хранения скоропортящихся продуктов без искусственных консервантов. Ее открытие внесло существенный вклад в повышение общего уровня качества в пищевой промышленности. Как известно, именно скорость замораживания оказывает ключевое влияние на качество продукта. Преобладающая доля содержания воды в продукте должна максимально быстро перейти в мелкозернистую кристаллическую структуру, чтобы избежать повреждения клеточной ткани и распространения вредных микробиологических процессов.',
    },
    {
        name: 'Ядерный распад',
        desc: 'Это процесс взаимодействия атомного ядра с другим ядром или элементарной частицей, сопровождающийся изменением состава и структуры ядра и выделением вторичных частиц или квантов.В результате ядерных реакций могут образовываться новые радиоактивные изотопы, которых нет на Земле в естественных условиях.',
    },
    {
        name: 'Лазер',
        desc: 'Лазер (англ. laser, сокр. от Light Amplification by Stimulated Emission of Radiation — «усиление света посредством вынужденного излучения»), оптический квантовый генератор — устройство, преобразующее энергию накачки (световую, электрическую, тепловую, химическую и др.) в энергию когерентного, монохроматического, поляризованного и узконаправленного потока излучения.<br>Физической основой работы лазера служит квантовомеханическое явление вынужденного (индуцированного) излучения. Уникальные свойства излучения лазеров позволили использовать их в различных отраслях науки и техники, а также в быту, начиная с чтения и записи компакт-дисков и заканчивая исследованиями в области управляемого термоядерного синтеза.',
    },
    {
        name: 'Солнечная энергия',
        desc: 'Солнечная энергия — исходящие от солнца тепло и свет, то есть электромагнитные излучения, к которым относятся тепловые волны (инфракрасные лучи), световые и радиоволны. Поглощается лишь 35% солнечной энергии, достигающей земли: большая ее часть расходуется на испарение влаги при образовании облаков, а некоторое количество энергии превращается растениями в органическую химическую энергию в процессе фотосинтеза. Солнечные батареи используют для снабжения энергией аппаратуры космических кораблей; также проводятся эксперименты по накоплению солнечной энергии в жидкостях, из которых можно впоследствии генерировать электричество. Эффективное использование солнечной энергии затрудняется из-за суточного цикла, а также сезонных и климатических изменений.',
    },
    {
        name: 'Техническая невидимость',
        desc: 'Технология снижения заметности, является самостоятельным разделом военно-научной дисциплины «электронные средства противодействия», охватывающим диапазон техники и технологии изготовления военных самолетов, вертолетов, кораблей и ракет с целью снижения их заметности в радиолокационном, инфракрасном и других областях спектра обнаружения.<br>Технологии снижения заметности — комплекс методов маскировки боевых машин посредством специально разработанных геометрических форм, радиопоглощающих материалов и покрытий, позволяющих уменьшать силу и отражение сигнала в сторону источника излучения и за счет этого незамеченным находиться на территории противника. Добиться полного поглощения волн независимо от угла падения технологически невозможно, поэтому главной целью является отражение волн таким образом, чтобы отражённый сигнал не вернулся в точку, откуда он пришёл (к радиолокационной станции противника).',
    },
    {
        name: 'Кодекс чести',
        desc: 'Несмотря на то, что основные движущие силы всех высших приматов сводятся к таким простейшим желаниям как поесть, поспать, продолжить свой род и навязать свою волю окружающим особям, с развитием человеческой мысли, перемены затронули даже самую не гибкую и закостенелую часть общества, а именно ратников. Отрубить голову коллеге просто за то, что он вызывает смутную неприязнь, повсеместно стало считаться дурным тоном, а кое где еще и могло повлечь за собой суровое наказание. Само собой ситуацию необходимо было разрешить, поскольку если пехотинцы простолюдины и могли выпустить пар в тавернах, используя вино и кулаки, то богатые и благородные всадники и рыцари до такого опуститься не считали возможным. Вот тогда и появился кодекс чести, в котором просто и ясно было расписано, за какие огрехи можно вызвать на дуэль, или же какие виды позора требуют немедленного ритуального самоубийства.',
    },
    {
        name: 'Образование',
        desc: 'Целенаправленный процесс воспитания и обучения в интересах человека, общества, государства, сопровождающийся констатацией достижения обучающимся гражданином установленных государством образовательных уровней (образовательных цензов). Уровень общего и специального образования обуславливается требованиями производства, состоянием науки, техники и культуры, а также общественными отношениями. Первоначально существовали только церковно-приходские образовательные учреждения, но с ростом требований к рабочей силе начинали открываться и другие образовательные учреждения.',
    },
    {
        name: 'Техника',
        desc: 'Что это там грохочет...пищит и шпарит? Что за странные конструкции?<br>Основное назначение техники — избавление человека от выполнения физически тяжёлой или рутинной работы, чтобы предоставить ему больше времени для творческих занятий, облегчить его повседневную жизнь.<br>Различные технические устройства позволяют значительно повысить эффективность и производительность труда, более рационально использовать природные ресурсы, а также снизить вероятность ошибки человека при выполнении каких-либо сложных операций.',
    },
    {
        name: 'Национализм',
        desc: 'Национализм (фр. nationalisme) — идеология и направление политики, базовым принципом которых является тезис о ценности нации как высшей формы общественного единства и её первичности в государствообразующем процессе. Как политическое движение, национализм стремится к защите интересов национальной общности в отношениях с государственной властью.<br>В своей основе национализм проповедует верность и преданность своей нации, политическую независимость и работу на благо собственного народа, объединение национального самосознания для практической защиты условий жизни нации, её территории проживания, экономических ресурсов и духовных ценностей. Он опирается на национальное чувство, которое родственно патриотизму.',
    },
    {
        name: 'Научные исследования',
        desc: 'Научное исследование — процесс изучения, эксперимента, и проверки теории, связанный с получением научных знаний.<br>Была высказана идея, о том, что наука может и должна организовываться для изучения природы и для развития наций. Он закладывает основы научного исследования, институционализированного, окруженного научной политикой, принимающей участие в организации работ ученых, чтобы использовать лучше экономическое и военное достижение нации.<br>Позднее развиваются Академии, которые являются первой настоящей демонстрацией институционализации поиска, организованной по воле меценатов.<br>Первые исследователи-специалисты появляются чуть позднее.',
    },
    {
        name: 'Телевидение',
        desc: 'Телевидение — система связи для трансляции и приёма движущегося изображения и звука на расстоянии.<br>Телевидение основано на принципе последовательной передачи элементов кадра с помощью развёртки. Частота смены кадров выбирается, в основном, по критерию плавности передачи движения. Для сужения полосы частот передачи применяют чересстрочную развёртку, она позволяет вдвое увеличить частоту кадров (а значит, увеличить плавность передачи движущихся объектов).',
    },
    {
        name: 'Музыка',
        desc: 'Музыка — разновидность искусства, воплощающая идейно-эмоциональное содержание в звуковых художественных образах. Первые убедительные свидетельства о музыкальных опытах относят к эпохе палеолита, когда человек научился изготовлять инструменты из камня, кости и дерева, чтобы с их помощью производить различные звуки. Позже звуки извлекали с помощью граненого ребра из кости, и этот издаваемый звук напоминал скрежет зубов. Также изготавливали погремушки из черепов, которые заполнялись семенами или сушеными ягодами. Этот звук нередко сопровождал погребальную процессию. Самыми древними музыкальными инструментами были ударные. Вслед за ударными были изобретены духовые. Струнные инструменты также были изобретены в глубокой древности.',
    },
    {
        name: 'Биология',
        desc: 'Биология — одна из естественных наук, предметом изучения которой являются живые существа и их взаимодействие с окружающей средой. Как особая наука биология выделилась из естественных наук, когда учёные обнаружили, что живые организмы обладают некоторыми общими для всех характеристиками. Термин «биология» был введен уже позднее. Bios — жизнь, Logos — мысль. В основе современной биологии лежат пять фундаментальных принципов: клеточная теория, эволюция, генетика, гомеостаз и энергия.',
    },
    {
        name: 'Анатомия',
        desc: 'Анатомия — сборная группа разделов биологии, изучающих структуру организмов или их частей на уровне выше клеточного. Для филогенетически близких видов организмов показано сходство на уровне анатомического строения.',
    },
    {
        name: 'Слабый искусственный интеллект',
        desc: '',
    },
    {
        name: 'Ядерное оружие',
        desc: 'Это совокупность ядерных боеприпасов, средств их доставки к цели и средств управления; относится к оружию массового поражения (ОМП) наряду с биологическим и химическим оружием. Ядерный боеприпас — оружие взрывного действия, основанное на использовании ядерной энергии, высвобождающейся при цепной ядерной реакции деления тяжёлых ядер и/или термоядерной реакции синтеза лёгких ядер.',
    },
    {
        name: 'Национальная оборона',
        desc: 'Система мероприятий по подготовке к защите и по защите населения, материальных и культурных ценностей на территории страны от опасностей, возникающих при ведении военных действий или вследствие этих действий, а также при возникновении чрезвычайных ситуаций природного и техногенного характера. Организация и ведение гражданской обороны являются одними из важнейших функций государства, составными частями оборонного строительства, обеспечения безопасности государства.',
    },
    {
        name: 'Горное дело',
        desc: 'Когда древние люди обратили своё внимание на землю, то поняли, что она может дать им то, с чем будет легче защищаться от врагов, охотиться, разделывать пойманную добычу. В эпоху неолита появились первые подобия шахт. Однако тогда еще глубина ведения горных работ не могла быть ниже уровня грунтовых вод. Для переноски руды использовались кожаные сумки, ивовые корзины, корыта. В качестве лестниц для спуска в шахты использовали зарубленные бревна и высеченные ступеньки. Освещали рудники лучинами или масляными лампами.',
    },
    {
        name: 'Парус',
        desc: 'Первые парусные суда были небольшими, широкими с прямоугольным парусом. Кроме паруса на лодках были ещё и вёсла, поэтому движение не зависело только от ветра, хотя со временем люди изучили направления сезонных ветров и стали активно ими пользоваться.',
    },
    {
        name: 'Стрельба из лука',
        desc: 'Впервые использовать лук и стрелы начали в глубокой древности. Древнейшие луки были небольшие, слабые и применялись для метания деревянных неоперённых стрел с наконечником из естественного шипа или обточенного куска дерева. Такие луки применялись для охоты на мелких животных и птиц. Позднее размеры лука увеличились, стрелы стали делать с каменным или костяным наконечником, появилось оперение. В таком виде лук стал серьёзным оружием и начал вытеснять пращу и бумеранг.',
    },
    {
        name: 'Ковка',
        desc: 'Обработка давлением, посредством которой тягучий металл в нагретом состоянии уплотняется, сращивается, или получает желаемую форму, называется ковкой.<br>Ковать металлы начали в древности. Древние металлурги ковали сыродутное железо, медь, серебро и золото. Все эти металлы человек обрабатывал только в холодном состоянии при помощи каменного молота. Металлургия возникла, когда человек освоил процессы плавки рудного металла, горячей ковки и литья. Кузнецы пользовались особым почетом у народов древности, их искусство окружалось легендами и суевериями.',
    },
    {
        name: 'Драматургия',
        desc: 'Открывая для себя теорию драматургии, мы вступаем во вселенную, развивающуюся по законам, поражающим своей математической точностью и красотой. Космическая гармония, подобная произведениям Баха или Леонардо Да Винчи, строится на твердом основании теории драмы. Основной закон, которым руководствуется драматургия — это закон гармонического единства: драма, как и всякое произведение искусства, должна быть цельным художественным образом.',
    },
    {
        name: 'Государственный аппарат',
        desc: 'Государственный аппарат — система специальных органов и учреждений, посредством которых осуществляется государственное управление обществом и защита его основных интересов.<br>Аппарат любого государства – четко организованная, строго упорядоченная целостная система. В число факторов, оказывающих решающее воздействие на функционирование и постоянное развитие Г. а. как единой, целостной системы, входят: общность экономической основы различных гос. органов и организаций – системы хозяйства и различных форм собственности на средства производства; единство политической основы гос. органов, организаций и учреждений; наличие в некоторых странах единой официальной идеологии; морально-политическое и идейное единство различных частей общества; наличие общих принципов построения и функционирования различных гос. органов – составных частей госаппарата; общность конечных целей и задач, стоящих перед различными гос. органами и организациями.',
    },
    {
        name: 'Бюрократия',
        desc: 'Слой служащих в крупных организациях, возникших в различных сферах общества.<br>Бюрократии свойственны тенденции к превращению в привилегированный слой, независимый от большинства членов организации, что сопровождается нарастанием формализма и произвола, авторитаризма и конформизма, подчинением правил и задач деятельности организации главным образом целям ее укрепления и сохранения. Это находит крайнее выражение в авторитарных системах.',
    },
    {
        name: 'Бумага',
        desc: 'Бумага была изобретена учеными в древности. Изначально она изготовлялась из шелка. Однако впоследствии, в состав бумаги стали добавлять древесную золу и пеньку (волокна стеблей конопли). Бумага отличалась прочностью, легкостью в изготовлении и относительной дешевизной от других материалов для письма того времени. Бумага не растворяется в воде, однако при намокании многократно теряет прочность. Бумага, на удивление, хорошо горит.',
    },
    {
        name: 'Либерализм',
        desc: 'Либерализм получил свое название и сформировался как идеология когда умеренные буржуазные политики, поддержавшие революцию, но испуганные ее демократическими «эксцессами», предложили средний путь между революционной демократией и монархической реакцией.',
    },
    {
        name: 'Артиллерия',
        desc: 'Когда люди впервые сталкиваются с порохом, с этого момента начинается революция в военном деле. Первым артиллерийским оружием считается бомбарда. Они начинают активно применяться при осаде и обороне крепостей. Первые бомбарды изготавливались из железа. Они стреляли каменными ядрами, дальность стрельбы составляла около 700 метров.<br>На смену бомбардам пришли гаубицы. Они предназначались для стрельбы с закрытых огневых позиций, вне прямой видимости цели. В наше время гаубицы входят в состав войсковой артиллерии. Они имеют относительно высокую скорострельность, и большую дальность стрельбы (до 17 км).',
    },
    {
        name: 'Милитаризм',
        desc: 'Государственная идеология, направленная на оправдание политики постоянного наращивания военной мощи государства и одновременно с этим допустимости использования военной силы при решении международных и внутренних конфликтов. Милитаризму свойственна гонка вооружений, рост военных расходов бюджета государства, наращивание военного присутствия с политическими целями за рубежом, военное силовое вмешательство в дела других суверенных государств (как со стороны держав-агрессоров, так и со стороны агрессивных военно-политических блоков), усиление влияния военно-промышленного комплекса в экономике страны и ее внешней и внутренней политике, и, зачастую, как следствие всего этого — нарастание явлений внутреннего экономического кризиса, выражающегося в обогащении привилегированной военно-политической элиты страны, а также в истощении бюджетных ресурсов самого милитаристического государства, падении внутренних экономических его показателей. Однако под влиянием гонки вооружения в стране замечается научно-техническое развитие.',
    },
    {
        name: 'Спутники',
        desc: 'Спутник — объект, вращающийся по определённой траектории (орбите) вокруг другого объекта. Данные объекты предназначены для экспериментов по выводу в околоземное пространство полезной нагрузки, изучения влияния невесомости и радиации на живых существ, экспериментов по изучению свойств земной атмосферы и подготовки к первому пилотируемому космическому полёту.',
    },
    {
        name: 'Сельское хозяйство',
        desc: 'Возникновение сельского хозяйства связано с переходом от присваивающего хозяйства (охоты, собирательства и рыболовства) к производящему (земледелию и животноводству). Это привело к созданию культурных растений и одомашниванию животных. Предполагается, что пиво начали варить в древности, а уже много позже овладели технологией выпечки дрожжевого хлеба. Ещё ранее уже были первые одомашненные животные.',
    },
    {
        name: 'Животноводство',
        desc: 'В древности люди уже умели стричь овец и коз и из шерсти вырабатывать ткани. Скотоводы тех времен уже сталкивались с таким явлением, как вырождение животных, разводимых в близком родстве, особенно на первых порах их одомашнивания, когда прирученных экземпляров было еще очень мало и родственные спаривания были неизбежны. Некоторое ослабление их конституции как начальный этап вырождения на первой стадии одомашнивания было даже выгодным человеку, так как ослабленных животных было легче подчинить своей воле. Подчинив животных и изменив их для большей пригодности к хозяйственному использованию, человек выработал основные приёмы их разведения.',
    },
    {
        name: 'Военные машины',
        desc: 'Вспомогательные устройства и конструкции для разрушения или ослабления укреплённых оборонительных сооружений и городских зданий.<br>Спектр осадных орудий простирался от крайне сложных аппаратов, привозимых нападающими, до примитивных сооружений, создаваемых прямо на месте.',
    },
    {
        name: 'Картография',
        desc: 'Известно, что картография развивалась совершенно независимо в нескольких частях света. Например, на одних картах дороги отображались отпечатками ног, на других вырезались береговые карты на слоновой кости, а где-то строили рельефные карты из глины и камней. Помимо наскальных рисунков, до нас дошли древнейшие карты на глиняных табличках. Они показывают различные по величине объекты, от отдельного землевладения до крупной речной долины. На крышке одного саркофага изображена стилизованная карта дорог. Картография также восходит к глубокой древности. На Востоке очень давно и независимо от Запада были разработаны некоторые очень важные технические приемы, в том числе прямоугольная картографическая сетка, использовавшаяся для определения местонахождения объекта.',
    },
    {
        name: 'Сложные военные машины',
        desc: 'Машины различных видов и назначения, применявшиеся при осадах укрепленных городов. По своему назначению делились на метательные машины, стенобитные машины (разрушительные) и подступные машины.',
    },
    {
        name: 'Массовое производство',
        desc: 'Массовое производство характеризуется узкой номенклатурой и большим объемом выпуска изделий, непрерывно изготавливаемых или ремонтируемых в течение продолжительного времени. Коэффициент закрепления операций для массового производства равен или меньше единицы. Таким образом на каждом рабочем месте закрепляется выполнение одной постоянно повторяющейся операции. При этом используется специальное высокопроизводительное оборудование, которое расставляется по поточному принципу и во многих случаях связывается транспортирующими устройствами и конвейерами с постами промежуточного автоматического контроля, а также промежуточными складами-накопителями заготовок, снабженными автоматическими перегружателями (роботами-манипуляторами).',
    },
    {
        name: 'Лодки',
        desc: 'Связывая вместе несколько стволов деревьев и используя палку в качестве весла древний человек смог переплывать реку, но этот способ был неудобен. На плот заливалась вода и он не мог быстро двигаться, поэтому был придуман способ сделать лодку из ствола дерева, который выдалбливали изнутри. На такой лодке можно было гораздо быстрее передвигаться и она не пропускала воду, но она не могла перевозить столько же груза и легко опрокидывалась. Усовершенствуя лодку был сделан нос и корма для увеличения скорости. Для повышения устойчивости выровнено днище и сделаны выпуклые формы боков. Плот тоже усовершенствовался, была сделана платформа, предок палубы, надстроены борта. Со временем плоты и выдолбленные лодки стали иметь много общего. Закономерным было соединение лучших качеств каждой из них, в зависимости от того, какая лодка была нужна.',
    },
    {
        name: 'Ткани',
        desc: 'Необходимой предпосылкой для ткачества является наличие сырья. На этапе плетения это были полоски кожи животных, трава, тростник, лианы, молодые побеги кустов и деревьев. Первые виды плетеной одежды и обуви, подстилки, корзины и сети были первыми ткацкими изделиями. Считают, что ткачество предшествовало прядению, так как в виде плетения оно существовало еще до того, как человек открыл прядильную способность волокон некоторых растений, среди которых были дикорастущая крапива, «окультуренные» лен и конопля. Развившееся мелкое скотоводство обеспечивало различными видами шерсти и пуха.<br>Первые ткани были очень просты по структуре. Как правило, они вырабатывались полотняным переплетением. Однако довольно рано стали производить орнаментированные ткани, используя в качестве декоративных элементов религиозные символы, упрощенные фигуры людей и животных. Орнамент наносился на суровые ткани вручную. Позднее стали орнаментировать ткани вышивкой.',
    },
    {
        name: 'Метеорология',
        desc: 'Наука о строении и свойствах земной атмосферы и совершающихся в ней физических процессах. Во многих странах метеорологию называют физикой атмосферы, что в большей степени соответствует её сегодняшнему значению. Значительная часть метеорологов занимается моделированием прогноза погоды, климата, исследованием атмосферы (с помощью радаров, спутников и др.).',
    },
    {
        name: 'Мобильная связь',
        desc: 'Вид телекоммуникаций, при котором голосовая, текстовая и графическая информация передается на абонентские беспроводные терминалы, не привязанные к определенному месту или территории. Различаются спутниковая, сотовая, транкинговая и др. виды мобильной связи.',
    },
    {
        name: 'Корабельный руль',
        desc: 'Обеспечение поворотливости корабля достигается использованием средств управления и движения корабля. в зависимости от конструкции и характера их использования средства управления подразделяются на главные (ГСУ) и вспомогательные (ВСУ). К главным средствам управления относятся рули различных типов и поворотные насадки.<br>Корабельный руль представляет собой крыло симметричного профиля. По способу соединения пера руля с корпусом корабля рули бывают простые, полуподвесные и подвесные, по положению оси баллера относительно пера руля — небалансирные и балансирные.',
    },
    {
        name: 'Морская артиллерия',
        desc: 'Когда-то военные флоты являли собой большие десантно-транспортные отряды. И если корабли таких флотов вступали в противоборство, то просто становились борт о борт и решали дело рукопашными схватками. Однако с развитием морской артиллерии корабли все реже шли на абордаж и все чаще ограничивались огневым контактом.<br>Однажды в морской битве были введены в строй дредноуты». Это была первая победа в морском сражении только с помощью «артиллерии».<br>С изобретением и распространением пороха корабли получили новое, очень мощное по тем временам вооружение. Первой «прописалась» на флоте бомбарда, представлявшая собой крупнокалиберное артиллерийское орудие с цилиндрическим каналом.<br>Позднее усовершенствование техники металлургического производства позволило улучшить качество отливки орудий. Появились примитивные прицельные приспособления и клиновые устройства для изменения угла возвышения орудийного ствола.',
    },
    {
        name: 'Рыболовство',
        desc: 'Люди научились рыбной ловле ещё на заре цивилизации. Костяная булавка — предшественница рыболовного крючка использовалась с той же целью, что и собственно крючки, появившиеся значительно позже — через 2000 лет.',
    },
    {
        name: 'Арифметика',
        desc: 'Раздел математики, изучающий числа, их отношения и свойства. Предметом арифметики является понятие числа в развитии представлений о нём и его свойствах. В арифметике рассматриваются измерения, вычислительные операции и приёмы вычислений. Арифметика является древнейшей и одной из основных математических наук, она тесно связана с алгеброй, геометрией и теорией чисел',
    },
    {
        name: 'Полупроводники',
        desc: 'Полупроводни́к — материал, который по своей удельной проводимости занимает промежуточное место между проводниками и диэлектриками и отличается от проводников сильной зависимостью удельной проводимости от концентрации примесей, температуры и воздействия различных видов излучения. Основным свойством полупроводника является увеличение электрической проводимости с ростом температуры.',
    },
    {
        name: 'Зоология',
        desc: 'Издревле люди жили бок о бок с животными, изучая их, привыкая к ним. Одних боялись, других поедали, кого-то приручали в помощь по хозяйству. Наука зоология даёт нам представление не только о видах животных, но и об их характерах, пристрастиях, привычках, ареале обитания и возможности сосуществования в одной среде. Только мирное, уважительное и заботливое отношение к «братьям нашим меньшим» даст нам возможность получить в их лице верных друзей и надёжных помощников!',
    },
    {
        name: 'Геология',
        desc: 'Первые знания о геологии появились у человека ещё в незапамятные времена, когда он только начинал познавать окружающий мир. Наблюдая за миром, люди обнаруживали закономерности распределения залежей железа и меди, научились определять поверхностные признаки, указывающие на сокрытые богатства недр. С развитием человеческой цивилизации развивалась и геология — потребности в ресурсах росли и требовались все новые и новые месторождения. С изобретением двигателя внутреннего сгорания и следующим за ним огромным спросом на ископаемое топливо, геология становится востребованной как никогда ранее, помогая обнаруживать сотни месторождений нефти и газа, а так же и других полезных ископаемых.',
    },
    {
        name: 'Собирательство',
        desc: 'Одной из древнейших форм хозяйственной деятельности человека при первобытно-общинном строе было собирательство, заключавшееся в сборе дикорастущей растительной пищи — плодов, орехов, ягод, кореньев. В то время как мужчины охотились, строили жилища, собирательством, как правило, занимались женщины и дети. Постепенно древние люди стали использовать примитивные инструменты — палки-копалки, скребки, — и применять некоторые хитрости, чтобы сделать этот труд более эффективным — например, орошение, — что в будущем привело к возникновению ручного земледелия.',
    },
    {
        name: 'Геометрия',
        desc: '',
    },
    {
        name: 'Дистилляция',
        desc: 'Впервые искусство дистилляции жидкости было применено в незапамятные времена изготовителями благовоний для того, чтобы выделить ароматические масла из прекрасных цветов и душистых трав. Мирное поначалу, вскоре оно стало использоваться совсем для других целей: дистиллированные жидкости на основе спирта научились применять для создания пороха.',
    },
    {
        name: 'Архитектура',
        desc: '',
    },
    {
        name: 'География',
        desc: 'Дословно — описываю землю. Ещё тысячи лет назад человечество пыталось узнать, что находится за чертой горизонта или на другом берегу моря. С рождения человеком движет любознательность — география именно та наука, ставшая результатом такого движения! Моря, океаны, горы и равнины — всё стало возможным описать, зарисовать, измерить и нанести на карты — теперь мы знаем, как выглядит наша планета, где наш дом и куда стоит отправиться в путешествие!',
    },
    {
        name: 'Кораблестроение',
        desc: 'Бескрайний голубой океан — что может быть более захватывающим, романтичным и влекущим? Издавна человечество пыталось покорить водную стихию — сперва на плотах, пирогах, небольших лодках и галлерах, затем на огромных многомачтовых кораблях и лайнерах! Именно мастера плотники дали толчок к развитию мореплавательного дела! Они, путём многих проб и ошибок, сложнейших рассчетов и тяжелейшего физического труда возводят величественнейшие суда — флагманы с белыми парусами и бесстрашными морскими волками, готовыми открывать и покорять новые земли!',
    },
    {
        name: 'Механика',
        desc: '',
    },
    {
        name: 'Ботаника',
        desc: 'Так кто же они, эти пестики и тычинки? Какую роль они играют в природе? Ученые изучали окружающий нас мир — деревья, грибы, растения. Оказывается, их миллионы видов, разных по строению, среде обитания, выносливости, цвету и запаху. Ботаника помогает нам всё это классифицировать и систематизировать, а порой даже заранее предугадать форму и строение ещё не открытых, но наверняка существующих где-то видов!',
    },
    {
        name: 'Обработка древесины',
        desc: '',
    },
    {
        name: 'Мощение дорог',
        desc: '',
    },
    {
        name: 'Обработка камня',
        desc: '',
    },
    {
        name: 'Военное дело',
        desc: '',
    },
    {
        name: 'Рыцарство',
        desc: '',
    },
    {
        name: 'Плетение',
        desc: 'Наука плетения очень древняя. Заплетать волосы в косы и вплетать перья и травы, для пущей привлекательности или устрашения, люди начали с незапамятных времен. Позже научились плести силки и ловить себе дичь на обед; рыболовные сети и на столах появилась рыба, разнообразя меню. Нет обуви? Сплети лапти! Нечего надеть? Ячейки в сетке помельче, узлы покрасивее и вуали-модная ажурная кофточка! А некоторые народы даже письма писали хитроумно заплетая узелки и веревочки. Плетение интриг необходимое умение в дипломатии. Плетение не только целая наука, но и большое искусство.',
    },
    {
        name: 'Обработка кожи',
        desc: 'Если древние люди просто носили содранную со зверя шкуру, то с развитием общества появляются ремесленники – кожевники, специализирующиеся на выделке кожи. Из этого прочного материала начинают изготавливаться предметы одежды и обуви, колчаны и сумки. Самая твердая кожа применялась для изготовления доспехов, защищавших от стрел, рубящих и колющих ударов.',
    },
    {
        name: 'Домостроение',
        desc: '',
    },
    {
        name: 'Врачевание',
        desc: '',
    },
    {
        name: 'Фармакология',
        desc: '',
    },
    {
        name: 'Агрономия',
        desc: '',
    },
    {
        name: 'Селекция',
        desc: '',
    },
    {
        name: 'Микроскоп',
        desc: 'Мир не только больше, но и меньше чем мы думаем. Несколько правильно установленных линз, солнечный свет и вот перед глазами исследователя разворачивается удивительная жизнь микроорганизмов. Совершенствование знаний в оптики и стекольном деле помогут улучшить и сам микроскоп. Благодаря этому инструментов будет дан толчок в развитие химии, биологии, медицины, будут спасены тысячи жизней.',
    },
    {
        name: 'Телескоп',
        desc: '',
    },
    {
        name: 'Микробиология',
        desc: '',
    },
    {
        name: 'Математические науки',
        desc: '',
    },
    {
        name: 'Вакцинация',
        desc: 'В древности многие инфекционные болезни становились причиной вымирания городов. Уже тогда было замечено, что переболев единожды, человек становится невосприимчивым к недугу. Это и открыло дорогу к экспериментам с прививками. Введение в организм человека частей живых, но ослабленных микробов и вирусов позволяет добиться выработки иммунитета к конкретной болезни. С развитием микробиологии вакцинация превратилась в целую отрасль медицины, позволив последней сделать качественный рывок вперед.',
    },
    {
        name: 'Телеграф',
        desc: '',
    },
    {
        name: 'Теория электромагнитного поля',
        desc: '',
    },
    {
        name: 'Телефон',
        desc: '',
    },
    {
        name: 'Ветеринария',
        desc: '',
    },
    {
        name: 'Канализация',
        desc: 'Канализация была открыта одновременно во многих уголках планеты. При этом в разных местах она выполняла свою роль. В сильно дождливых регионах ее строили для отвода дождевой воды, в засушливых урбанизированных краях она использовалась для отвода отходов. Необходимость поддержки работоспособности этого сооружение археологи связывают с увеличением кастового неравенства. Абсолютно точно известно что городская канализация долгое время была расположена над землей, и лишь ряд масштабных эпидемий заставил человека убрать это сооружение под землю.',
    },
    {
        name: 'Огнестрельное оружие',
        desc: '',
    },
    {
        name: 'Витаминология',
        desc: 'Витаминология — учение о витаминах. Практика и опыт показали, что для нормального роста и развития организма человека одного поступления белков, жиров, углеводов, минеральных веществ и воды недостаточно. История путешествий и мореплавании, наблюдения врачей указывали на существование особых болезней, развитие которых непосредственно связано с неполноценным питанием, хотя оно как будто содержало все известные к этому времени питательные вещества.',
    },
    {
        name: 'Логика',
        desc: '',
    },
    {
        name: 'Криптография',
        desc: 'Криптография — одна из старейших наук, ее история уходит в глубокую древность, во времена, когда у самых первых стран и даже просто племен, появилась необходимость шифровать секретную информацию. Ведь именно криптография занимается изучением методов шифрования, которые обычно представляют собой преобразование исходного текста в шифрованный и обратно с использованием секретного алгоритма или ключа.',
    },
    {
        name: 'Педагогика',
        desc: '',
    },
    {
        name: 'Информатика',
        desc: '',
    },
    {
        name: 'История',
        desc: '',
    },
    {
        name: 'Часы',
        desc: 'История развития часов насчитывает тысячелетия: с солнечных и водяных часов древних цивилизаций ближнего и дальнего востока и до последних новинок от известных торговых марок. Но, пожалуй, самое революционное изменение произошло в эпоху нового времени, после массового распространения механических часов, позволяющих рассчитывать время с точностью до минуты. Изобретенные европейскими мастерами они совершили мощный толчок в развитии коммуникаций, и привели к появлению такого явления, как стресс.',
    },
    {
        name: 'Кинематограф',
        desc: '',
    },
    {
        name: 'Квантовая механика',
        desc: 'Ph’nglui mglw’nafh Wou’w G’lyph wgah’nagl fhtagn',
    },
    {
        name: 'Вычислительные машины',
        desc: '',
    },
    {
        name: 'Миномет',
        desc: 'Артиллерийское орудие, применяемое для навесной стрельбы. Короткий ствол, опорная плита для передачи импульса отдачи и устройство придания угла возвышения – вот и вся нехитрая конструкция, обуславливающая простоту применения. Большая крутизна траектории полёта мин (от 45 до 85 градусов) позволяет поражать закрытые цели, недоступные для стрелкового оружия. Все это, вкупе с мощностью боеприпасов, высокой скорострельностью и малой массой устройства, дало возможность миномету найти широкое применение.',
    },
    {
        name: 'Телекоммуникации',
        desc: '',
    },
    {
        name: 'Геопозиционирование',
        desc: 'Наука, возникшая в процессе развития геодезии. Однако мало знать рельеф местности и уметь ориентироваться по звёздам, иногда определение точки нахождения объекта требует максимальной точности и скорости. Здесь на помощь приходят орбитальные спутники и GPS навигаторы — в считанные секунды мы получаем 3-х мерные координаты своего местоположения! Теперь значительно упростилась морская и сухопутная навигация, стали безопаснее туристические экспедиции и монтаж спутникового оборудования.',
    },
    {
        name: 'Пилотируемые космические полеты',
        desc: '',
    },
    {
        name: 'Баллистические ракеты',
        desc: '',
    },
    {
        name: 'Межпланетные полеты',
        desc: '',
    },
    {
        name: 'Физика элементарных частиц',
        desc: '',
    },
    {
        name: 'Термодинамика',
        desc: 'Термодинамика изучает превращение теплоты в другие формы энергии. Ученые здесь рассматривают вещества и процессы в качестве макроскопических систем, законы которых не применимы к отдельным атомам. Изучая взаимодействие температуры и давления, термодинамика также имеет прикладное значение. Она используется в энергетике, разработке двигателей, химических реакциях, машиностроении, аэрокосмической отрасли, клеточной биологии.',
    },
    {
        name: 'Рентген',
        desc: '',
    },
    {
        name: 'Радиоактивность',
        desc: '',
    },
    {
        name: 'Стандартная модель',
        desc: '',
    },
    {
        name: 'Теория струн',
        desc: '',
    },
    {
        name: 'Военно-инженерное искусство',
        desc: '',
    },
    {
        name: 'Военно-морское искусство',
        desc: 'С появлением первых плавсредств, люди стали использовать их в военных целях. Со временем шаткие лодки сменились могучими военными кораблями, и чем сложнее становился корабль, тем дороже становилась его потеря в бою. Приходилось прибегать к тактическим и стратегическим решениям, чтобы достичь выполнения поставленной задачи с наименьшими потерями. Самые умелые капитаны предложили свой опыт своим странам для обучения молодых сложным премудростям военно-морского искусства.',
    },
    {
        name: 'Боевая подготовка',
        desc: 'Организованный процесс воинского обучения имеющий целью предоставить войскам возможность максимально эффективно использовать совокупность всех сведений, приёмов и навыков, необходимых вооружённым силам для боевой службы.',
    },
    {
        name: 'Юриспруденция',
        desc: 'Комплексная наука, изучающая свойства государства и права; совокупность правовых знаний; практическая деятельность юристов и систему их подготовки.',
    },
    {
        name: 'Севооборот',
        desc: 'Научно обоснованное чередование сельскохозяйственных культур и паров во времени и на территории или только во времени. Севообороты классифицируются по типам и видам. Основных типов три: полевой, кормовой и специальный.',
    },
];

Science.lib[Science.debt] = {
	name: 'Научная задолженность',
	desc: 'В случае изменения стоимости наук при введении обновления в игру вводится научная задолженность. Она компенсирует разницу в стоимости наук для игроков изучающих их по новым ценам.<br>Случаются в мире странные события. В какой-то краткий миг обратит божественная сила взор свой на людей и метания их. И в тот же миг те, кто изучил науки легче и проще других поймут, что нельзя все получить быстрее своего соседа. И тогда родится у них Научная задолженность. Придется и им потратить время и знания на полное постижение сложных научных тонкостей. И мир изменится. Восстановится справедливость. Кривда снова станет правдой.'
};

Science.lib[Science.no] = {
	name: '',
	desc: ''
};