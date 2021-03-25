function Account (data) {
	'use strict';
	
	if( data )
		this.parse(data);
}

	utils.extend(Account, BaseItem);
    
    
    Account.admin = {//правильный
        id: 1000000,
        name: 'Admin'
    };

    Account.admin0 = {
        id: 0,
        name: 'Admin'
    };
    
    Account.barbarian = {//варвар
        id: 0,
        name: 'Barbaren'
    };

    Account.hermit = {//отшельник
        id: 999999,
        name: 'Alter Einsiedler'
    };

    Account.bot = {//автоматические сообщения
        id: 999998,
        name: ''
    };

    Account.specialAcc = {};
    Account.specialAcc[Account.barbarian.id] = Account.barbarian;
    Account.specialAcc[Account.admin.id] = Account.admin;
    Account.specialAcc[Account.hermit.id] = Account.hermit;
    Account.specialAcc[Account.bot.id] = Account.bot;

    Account.def = {
        id: -1,
        name: 'Игрок',
        sex: 1,
        race: 1,
        country: 0
    };

    Account.access = {
      assistant: 0,
      owner: 1,
      likeOwner: 2,
      moderator: 3,
      admin: 4
    };
    
    
    Account.calcRelation = function(acc, country, diplomacy){
        acc = Element.getId(acc);
        country = country ? Element.getId(country) : false;

        var townColor = Tile.relation.none;

        if( acc == wofh.account.id )
            townColor = Tile.relation.self;
        else if( country ){
            if( wofh.country && wofh.country.id == country )
                townColor = Tile.relation.country;
            else{
                if( diplomacy === undefined && wofh.country && wofh.country.relations )
                    diplomacy = wofh.country.relations[country];

                if( diplomacy )
                    townColor = diplomacy;
            }
        }
        return townColor;
    };
    
    Account.checkNameLimits = function(name){
        return utils.checkLimits(name, lib.account.namelimit);
    };
    
    
	Account.prototype.parseArr = function(arr){
		var obj = {};

		obj.id = +arr[0];
		obj.name = arr[1];
		obj.sex = arr[2];
		obj.race = arr[3];
		obj.country = arr[4];

		return obj;	
	};
    
	Account.prototype.clone = function(){
		var clone = new Account();
		
		clone.race = this.race instanceof Race ? this.race.clone() : this.race;
		
		clone.country = this.country && this.country instanceof Country ? this.country.clone(): this.country;
		
		utils.copyProperties(clone, this, {noObjects: true});
		
		return clone;
	};
	
	Account.prototype.cloneBase = function(){
		var clone = new this.constructor();
		
		clone.id = this.id;
		clone.name = this.name;
		clone.sex = this.sex;
		clone.race = this.race instanceof Race ? this.race.clone() : this.race;
		clone.country = this.country && this.country instanceof Country ? this.country.cloneBase(): this.country;this.country && this.country instanceof Country ? this.country.cloneBase() : this.country;
		
		return clone;
	};
	
	Account.prototype.unpack = function(){
		if( this.checkLvl2() )
			this.unpackAbility();
		
		this.unpackScience();
		
		this.unpackInvites();
		
		// Армия всех городов
		this.unpackArmy();
		
		//удача
		this.unpackCoins();
		
		//деньги
		this.unpackMoney();
		
		this.unpackAssistants(); 
		
		this.unpackName();
		
		this.unpackRace();
		
		this.unpackCountry();
		
		this.unpackRainbow();
        
		this.unpackSpecialists();
		
		this.unpackFutureBuilds();
	};
	
	Account.prototype.updLinks = function(){
		this.country = wofh.world.getCountry(Element.getId(this.country));
	};

	Account.prototype.unpackName = function(){
	    if (this.getSpecial()) {
	        this.name = this.getSpecial().name;
	    }
	};
	
	Account.prototype.unpackAbility = function(){
		if( !this.ability )
			this.ability = new Ability();
	};

	Account.prototype.unpackRace = function(){
		if( this.race == undefined || this.race instanceof Race ) return;
		
		this.race = new Race(Element.getId(this.race));
	};

	Account.prototype.unpackScience = function(){
		if ( !this.science || this.science instanceof AccountScience ) return;
		
		this.science = new AccountScience(this.science);
		
		this.science.incReal = this.science.inc;
		
		this.science.progress = this.science.progress||{};
		
		this.science.progressWas = utils.clone(this.science.progress);
		
		this.science.debtWas = this.science.debt = this.science.debt||0;
		// Добавляем НЗ в очередь изучения
		if( this.science.debt ){
			if( this.science.debt ){
				var needPushDebt = true;
				for(var science in this.science.queue){
					if( this.science.queue[science] == Science.no ){
						this.science.queue[science] = Science.debt;
						
						needPushDebt = false;
						
						break;
					}
				}

				if( needPushDebt ){
					this.science.queue.push(Science.debt);
				}
			}
		}
		
		this.science.current = this.science.queue[0];
	};

	Account.prototype.unpackInvites = function(){
		this.invites = this.invites||[];
	};

	Account.prototype.unpackCoins = function(){
		if( this.coins instanceof AccountCoins ) return;
		
		this.coins = new AccountCoins(this.coins);
	};

	Account.prototype.unpackAssistants = function(){
		var assistants = {};

		for (var account in this.assistfor){
			if (this.assistfor[account] instanceof Account) return;//уже распаковано
			var accountId = this.assistfor[account];
			assistants[accountId] = wofh.world.getAccount(accountId);
		}
		this.assistfor = assistants;
	}

	Account.prototype.unpackMoney = function(){
		this.money = this.money||{};
		this.money.inc = this.money.inc||0;
		this.money.sum = this.money.sum||0;
		this.money.stream = this.money.stream||0;
		this.money.duty = this.money.duty||0;
		this.money.reserve = this.money.reserve||0;
		this.money.budget = this.money.budget||{};
		this.money.deposites = this.money.deposites||{inc: 0, sum: 0};
		this.money.credites = this.money.credites||{inc: 0, sum: 0};
		
		this.money.taxes = this.money.taxes||{};
		this.money.taxes.pop = this.money.taxes.pop||0;
		this.money.taxes.prod = this.money.taxes.prod||0;
		this.money.taxes.stream = this.money.taxes.stream||Trade.taxes.stream.def;
		this.money.taxes.streamSum = utils.calcObjSum(this.money.taxes.stream);
		this.money.taxes.deposit = this.money.taxes.deposit||0;
		this.money.taxes.sum = this.money.taxes.pop + this.money.taxes.prod + this.money.taxes.streamSum + this.money.taxes.deposit;
		
		if( this.credit )
			this.money.credites.sum = this.credit;
			
		if( this.deposit )
			this.money.deposites.sum = this.deposit;
		
		if( this.duty )
			this.money.duty = this.duty;
	};
	
	Account.prototype.unpackMoneyWas = function(){
		this.money.sumWas = this.money.sum;
		this.money.dutyWas = this.money.duty;
	};
	
	Account.prototype.unpackCountry = function(){
		if (this.country instanceof Country) return;
		
		if (this.country && wofh.world && wofh.world.getCountry(this.country)){
			this.country = wofh.world.getCountry(this.country);
		}
	};
	
	Account.prototype.unpackRainbow = function(){
		if( wofh.account && wofh.account.id == this.id ){
			clearTimeout(this.rainbowTimeOut);
			
			var timeout = (this.rainbowmode||0) - timeMgr.getNow();

			if( timeout > 0 ){
				this.rainbowTimeOut = setTimeout(function(){
					this.rainbowmode = 0;

					notifMgr.runEvent(Notif.ids.townRainbow);
				}.bind(this), timeout * 1000);
			}
		}
	};
	
	Account.prototype.unpackArmy = function () {
		if ( !(this.army instanceof Army) ){
			this.army = new Army(this.army);
		}
		if ( !(this.armytraining instanceof Army) ){
			this.armytraining = new Army(this.armytraining);
		}	
	};
	
	Account.prototype.unpackFutureBuilds = function(){
		if( this.science && !this.futureBuilds )
			this.futureBuilds = this.science.calcFutureBuilds(2, this);
	};
	
    Account.prototype.unpackSpecialists = function(specialistsRaw){
		if( this.specialists === undefined || this.specialists instanceof SpecialistList )
            return;
        
        specialistsRaw = specialistsRaw||this.specialists;
        
		this.specialists = new SpecialistList(specialistsRaw, false);
        
        this.checkNewSpecialists(ls.getAccSpecialists(null));
        
        ls.setAccSpecialists(specialistsRaw); // Храним данные о текущих ВГ аккаунта в ЛС, что-бы можно было отследить получение новых ВГ за время отсутствия игрока в игре
        
        return this;
	};
    
    Account.prototype.checkNewSpecialists = function(specialistsRaw){
        var newSpecialists = this._calcNewSpecialists(specialistsRaw);
        
        if( newSpecialists ){
            ls.setNewSpecialists(newSpecialists);
            
            notifMgr.runEvent(Notif.ids.accNewSpecialists);
        }
        
        return this;
	};
        
        Account.prototype._calcNewSpecialists = function(specialistsRawWas){
            var newSpecialists = false,
                curSpecialists = this.getSpecialists().getList(),
                spec;
            
            specialistsRawWas = specialistsRawWas||[];
            
            for(var specId in curSpecialists){
                spec = curSpecialists[specId];
                
                if( spec.getCount() - (specialistsRawWas[specId]||0) > 0 ){
                    newSpecialists = newSpecialists||{};
                    
                    newSpecialists[specId] = true;
                }
            }
            
            return newSpecialists;
        };
        
    Account.prototype.setSpecialists = function(specialists){
		this.specialists = specialists;
		
        this.unpackSpecialists();
        
        return this;
	};
    
	Account.prototype.getSpecialists = function(){
		return this.specialists||new SpecialistList(false, false);
	};
	
	Account.prototype.getFutureBuilds = function(){
		if( this.futureBuilds ){
			return this.futureBuilds.cloneDef({extElemClone: function(buildClone, build){
				buildClone.needScience = build.needScience; // needScience копируется по ссылке!
			}});
		}

		return new BuildList();
	};
	
	Account.prototype.getDoneQuests = function(){
		var list = [];
		for(var i in this.quests){
			var sign = this.quests[i];
			
			if (sign == Quest.status.done) {
				list.push(new Quest(+i));
			}
		}

		return list;	
	};
	
	Account.prototype.getActiveQuests = function(onlyFirst){
		var list = [],
			quest;
		
		for(var i in this.quests){
			var sign = this.quests[i];
			
			if( sign == Quest.status.active || sign == Quest.status.bonus ){
				quest = new Quest(+i);
				
				if( !quest.isDelayed() ){
					list.push(quest);
					
					if( onlyFirst )
						return list;
				}
			}	
		}

		return list;
	};
	
	Account.prototype.getBonusQuests = function(){
		var list = [];
		for(var i in this.quests){
			var sign = this.quests[i];
			if (sign == Quest.status.bonus) {
				list.push(new Quest(+i));
			}
		}

		return list;
	};
	
	Account.prototype.getQuestsBuilds = function(){
		var list = [];
		
		for(var i in this.quests){
			var sign = this.quests[i];
			if ( sign == Quest.status.active ) {
				var quest = new Quest(i);
				list = list.concat(quest.getBlinkBuilds());
			}
		}
		
		return list;
	};
	
	Account.prototype.isSameTactic = function (tactic1, tactic2){
		tactic1.waves = tactic1.waves||[];
		tactic1.rules = tactic1.rules||[];
		tactic1.reserve2 = tactic1.reserve2||"";

		tactic2.waves = tactic2.waves||[];
		tactic2.rules = tactic2.rules||[];
		tactic2.reserve2 = tactic2.reserve2||"";

		if( tactic1.waves.length != tactic2.waves.length || tactic1.rules.length != tactic2.rules.length || tactic1.reserve2 != tactic2.reserve2 )
			return false;

		for(var i = 0; i < tactic1.waves.length; i++){
			var wave1 = tactic1.waves[i];
			var wave2 = tactic2.waves[i];

			if( wave1.army != wave2.army || wave1.count != wave2.count ) return false;
		}

		for(var i = 0; i < tactic1.rules.length; i++){
			var rule1 = tactic1.rules[i];
			var rule2 = tactic2.rules[i];

			if( rule1.army != rule2.army || rule1.rule != rule2.rule ) return false;
		}

		return true;
	};
	
	Account.prototype.getCoinsLuckBonus = function(checkTime, checkSum){
		if( this.coins && this.coins.bonus ){
			if( checkTime && !(this.coins.bonus.time > timeMgr.getNow()) )
				return false;
			if( checkSum && !(this.coins.bonus.sum > 0) )
				return false;
			
			return this.coins.bonus;
		}
			
		return false;
	};
	
	Account.prototype.getCoinsSpecialistBonus = function(checkTime){
		if( this.coins && this.coins.bonusspecialist ){
			if( checkTime && !(this.coins.bonusspecialist.time > timeMgr.getNow()) )
				return false;
			
			return this.coins.bonusspecialist;
		}
			
		return false;
	};
	
	Account.prototype.getName = function () {
		return this.name;
	};

	Account.prototype.getText = function () {
		// about для старого интерфейса
		return this.text;
	};

	Account.prototype.getEmail = function () {
		return this.email;
	};

	Account.prototype.getTimeZone = function () {
		return servBuffer.serv.options.timeZone;
	};

	Account.prototype.getSex = function () {
		return this.sex;
	};

	Account.prototype.isMale = function () {
		return this.getSex() == 1;
	};

	Account.prototype.getAssistant = function () {
		return this.assistant;
	};

	Account.prototype.getAssistFor = function () {
		return this.assistfor;
	};

	Account.prototype.getCoins = function () {
		return this.coins||false;
	};
	
	Account.prototype.getCoinsAll = function () {
		if( this.coins )
			return (this.coins.bought||0) + (this.coins.moved||0) + (this.coins.free||0);
		
		return 0;
	};
	
	Account.prototype.getCoinsBought = function () {
		if( this.coins )
			return this.coins.bought||0;
		
		return 0;
	};
	
	Account.prototype.getCoinsMoved = function () {
		if( this.coins )
			return this.coins.moved||0;
		
		return 0;
	};
	
	Account.prototype.getCoinsFree = function () {
		if( this.coins )
			return this.coins.free||0;
		
		return 0;
	};
	
	Account.prototype.getCoinsBoughtMoved = function () {
		if( this.coins )
			return (this.coins.bought||0) + (this.coins.moved||0);
		
		return 0;
	};

	Account.prototype.hasAbility = function(ability){
		return Account.hasAbility(ability, this);
	};

	Account.prototype.knowsMoney = function () {
		return this.hasAbility(Science.ability.money);
	};

	Account.prototype.getScienceProgressInc = function (byCountry) {
		return ((timeMgr.getNow() - Science.getScienceData(byCountry).updated)/3600) * (Science.getScienceData(byCountry).inc||0);
	};
	
	// checkProdSci - флаг проверки на науки, которые дают домику производство реса.
	// Если установлен в true и есть науки, которые дают рес то не включаем такой домик в список изученных наук
	Account.prototype.getResearchedBuilds = function(checkProdSci) {
		var builds = new BuildList();
		
		if( !this.research )
			return builds;
		
		for(var bldId in this.research.build){//проверка на изученность
			var level = this.research.build[bldId],
				build = new Slot(bldId, level);

			if( checkProdSci ){
				// Если нет науки, которая дает производство реса возвращается true
				if( !build.isProdSciStudied() )
					continue;
			}

			builds.addElem(build);
		}
		
		return builds;	
	};

	//список построек, которые может построить аккаунт
	//принимает список доступных построек. Или фильтрует другой список
	//все постройки первого уровня
	Account.prototype.getAvailBuilds = function(buildsRaw) {
		buildsRaw = (buildsRaw||this.getResearchedBuilds()).getList();
		
		var builds = new BuildList();

		for(var build in buildsRaw){//проверка на изученность
			build = buildsRaw[build];
			
			build.level = 1;
			
			if( !build.getRaces().hasRace(this.race) ) 
				continue;// проверка на расу
			if( build.getType() == Build.type.embassy && this.diplomacy ) 
				continue;//проверка на строительство 2го посольства
			
			builds.addElem(build);
		}
		
		return builds;
	};

	Account.prototype.getMoneyInc = function (noDeck) {
		var deck = this.money.deck === undefined || noDeck ? 1 : this.money.deck; // Не учитываем частичное/полное отключение налогов
		
		return	this.money.inc + this.calcBudgetInc() + this.money.deposites.inc - this.getMoneyTaxInc()*deck + this.money.stream;
	};
	
	Account.prototype.calcBudgetInc = function(){
		var moneyBudget = this.money.budget,
			budgetSum = 0;
		
		for(var budget in moneyBudget){
			budget = moneyBudget[budget];
			
			if( !(budget instanceof Object) ){
				budgetSum += +budget;
				
				continue;
			}
			
			for(var item in budget)
				budgetSum += budget[item];
		}
		
		return budgetSum;
	};
	
	Account.prototype.getMoneyTaxInc = function () {
		return this.money.credites.inc + this.money.taxes.sum;
	};
	
	Account.prototype.isMoneyTaxOff = function () {
		var inc = this.getMoneyInc();
		
		return wofh.country && (this.money.sum <= 300 || (inc < 0 && this.money.sum <= -1 * inc * 24));
	};
	
	Account.prototype.isSpecWasObtained = function () {
		if( this.getSpecialists().getLength() ) 
			return true;
		
		for(var town in wofh.towns){
			if( wofh.towns[town].getSpecialists().getLength() ) 
				return true;
		}
		
		return false;
	};
	
	Account.prototype.getTownsCount = function(){
		return utils.sizeOf(wofh.towns);
	}

	Account.prototype.getDepositDamage = function(){
		return lib.war.colonydestroy[0] * Math.pow(this.getTownsCount(), lib.war.colonydestroy[1]);
	}

	//момент после которого игрок может вступать в страну или создать новую
	Account.prototype.getNewCountryMoment = function(){
		return this.countrytime + lib.country.jointime;
	}


	Account.prototype.calcStockScienceBonus = function () {
		return this.research.town.store * Science.getBonusMult(Science.bonus.store);
	};

	Account.prototype.calcCultScienceBonus = function () {
		return this.research.town.culture * Science.getBonusMult(Science.bonus.culture);
	};

	Account.prototype.calcGrownScienceBonus = function () {
		return this.research.town.grown * Science.getBonusMult(Science.bonus.grown);
	};

	Account.prototype.calcTradersScienceBonus = function() {
		return this.research.town.traders * Science.getBonusMult(Science.bonus.trader);
	};

	Account.prototype.calcCorruption = function() {
		return (utils.sizeOf(wofh.towns) - 1) * lib.town.production.corruption[0];
	};

	/*Должность в стране*/
	Account.prototype.getPost = function() {
		if (!(this.country||wofh.country)) return 0;
		return this.power;
	};

	Account.prototype.hasPost = function(postId) {
		return this.getPost() & (1<<postId);
	};

	Account.prototype.getSpecial = function () {
	    var spec = Account.specialAcc[this.id];
	    return spec? spec: false;
	};

	Account.prototype.isBarbarian = function () {
	    return this.id == Account.barbarian.id;
	};


	Account.prototype.isAdmin = function() {
		if( this.id == wofh.account.id )
			return this.status == Account.access.moderator || this.status == Account.access.admin;
	};

	Account.prototype.isAssistant = function() {
		return this.status == Account.access.assistant;
	};

	Account.prototype.isSuperAdmin = function() {
		return wofh.account.status == Account.access.admin;
	};

	Account.prototype.isNA = function() {
		return wofh.account.status == Account.access.likeOwner;
	};


	Account.prototype.isPremium = function() {
		if( this.bonus && this.bonus.premium )
			return this.bonus.premium > timeMgr.getNow();
		
		return false;
	};
	
	Account.prototype.canMessage = function() {
		return (this.messageblock || 0) < timeMgr.getNow() || debug.isAdmin();
	};
	
	Account.prototype.hasScienceDebt = function() {
		return !!Science.getScienceData(wofh.country).debt;
	};

	//последнее приглашение в страну
	Account.prototype.getLastInvite = function(){
		var maxTime = 0;

		var invites = this.invites;
		if (invites) {
			for (var invite in invites) {
				invite = invites[invite];
				maxTime = Math.max(maxTime, invite.time);
			}
		}

		return maxTime;
	}

	Account.prototype.isScientist = function() {
	    return !wofh.country||this.hasPost(Country.postIds.science);
	};

	Account.prototype.isAdviser = function() {
	    return this.hasPost(Country.postIds.adviser);
	}

	Account.prototype.isEconomist = function() {
	    return this.hasPost(Country.postIds.economics);
	}

	Account.prototype.isHead = function() {
	    return this.hasPost(Country.postIds.head);
	}

	Account.prototype.isMarshal = function() {
	    return this.hasPost(Country.postIds.war);
	};
	
	Account.prototype.isGeneral = function() {
	    return this.hasPost(Country.postIds.war) || this.hasPost(Country.postIds.warHelp1) || this.hasPost(Country.postIds.warHelp2);
	};
	
	Account.prototype.isChiefAccountant = function() {
	    return this.hasPost(Country.postIds.accountant);
	};
	
	Account.prototype.isAccountant = function() {
	    return this.hasPost(Country.postIds.accountant) || this.hasPost(Country.postIds.accountantHelp1) || this.hasPost(Country.postIds.accountantHelp2);
	};
	
	Account.prototype.hasRainbowMode = function() {
	    return (this.rainbowmode && this.rainbowmode > timeMgr.getNow()) || ls.getTownRainbow(0);
	};
	
	Account.prototype.getLuckBonus = function (bonusId) {
		return new LuckBonus(bonusId, this);
	};
	
	Account.prototype.getWonders = function(wonderId, onlyActive, onlyCount) {
		var wonders = new SlotList();
		
		if( wonderId ){
			for(var town in wofh.towns){
				var wonder = wofh.towns[town].getWonder();

				if( wonder && wonder.getId() == wonderId ){
					if( onlyActive && !wonder.isActive() )
						continue;

					if( !onlyCount )
						wonder = wonder.clone();

					wonders.addElem(wonder);
				}
			}
		}
		
		return onlyCount ? wonders.getLength() : wonders;
	};
	
	Account.prototype.getAuraWonders = function(aura) {
		var wonderId = TownAura.getWonderId(aura);
		
		return this.getWonders(wonderId, true, true);
	};

	Account.prototype.checkLvl2 = function(){
		return this.hasOwnProperty('coins');
	};
	
	Account.prototype.checkLvl3 = function(){
		return this.hasOwnProperty('towns');
	};
	
	Account.prototype.hasCounrtyBarter = function(){
		return wofh.country && wofh.country.barter;
	};
	
	Account.prototype.canTransfOperToCountry = function(group){
		return this.isGeneral() || this.isHead() || group.army.calcPop() >= lib.war.countrybattlegrouppop;
	};
	
	Account.getData = function () {
		return wofh.account;
	};

	Account.isLogin = function () {
		return wofh.account && wofh.account.name ? true : false;
	};
    

	Account.getRace = function () {
		return this.isLogin() ? this.getData().race : new Race(1);
	};

	Account.getResearchBuild = function(id) {
		return this.getData().research.build[id] || 0;
	};

	Account.areAllDelayedQuests = function () {
		var state = this.getData().quests,
			questsLength = state.length, // quests.length
			delayedCounter = 0,
			skipCounter = 0;

		for (var i = 0; i < state.length; i++) {
			if (state[i] == '-' || state[i] == '+') {
				++skipCounter;
			}
			if (state[i] == '=') {
				++delayedCounter;
			}
		}
		var diff = questsLength - skipCounter;
		
		return (delayedCounter == diff && diff > 0) ? true : false;
	};

	Account.isKnownMoney = function () {
		return Account.hasAbility(Science.ability.money);
	};

	Account.hasAbility = function (ability, account) {
		account = account||wofh.account;
		
		return account.research && utils.inMask(ability, account.research.ability);
	};
	

	Account.prototype.calcScienceInc = function () {
		var science = Science.getScienceData(wofh.country ? true : false);
		
		if ( wofh.country ) {
			var takes = science.takes||[],
				inc = 0,
				factor,
				spm = lib.science.spm[science.bonus],
				spmOther;
			
			for (var i = 0; i < takes.length; i++){
				var town = takes[i];
				
				if( wofh.towns[town[0]] ){
					if( science.bonusother && science.bonusother[town[0]] !== undefined )
						spmOther = lib.science.spm[science.bonusother[town[0]]];

					// + 1 - смещение позиции города на 1-цу
					if( spmOther ){
						factor = Math.min(Science.calcSpm(spm, i), Science.calcSpm(spmOther, i));
						spmOther = undefined;
					}
					else{
						factor = Science.calcSpm(spm, i);
					}

					inc += town[1] * factor;
				}
			}
			return inc;
		} else {
			return science.inc;
		}
	};

	Account.prototype.getColonizationCost = function(){
		return utils.toInt(utils.oddFunc(lib.resource.workersneed, utils.sizeOf(wofh.towns)));
	};

	Account.prototype.hasNewReports = function(){
		return wofh.account.newreports > ls.getReportTime();
	};

	Account.prototype.hasNewMessages = function(){
		return wofh.account.newmessages > ls.getMessageTime()
	}

	Account.prototype.getAvailFuel = function(wayType){
		var resList = Resource.getFuelSpeedList(wayType),
			sciences = Resource.fuelScience;

		var availFuel = new ResList();
		for (var res in resList.getList()) {
			res = sciences.getElem(res);
			var science = Science.get(res.count);

			if (science.isKnown() || science.isEmpty()){
				availFuel.addElem(resList.getElem(res));
			}
		}

		return availFuel;
	};
	
	Account.prototype.switchTown = function(dirLeft){
		if( wofh.account.id != this.id || !this.isPremium() ) return;
		
		var townsArr = Towns.getArray(),
			townId = wofh.town.id;

		for(var i = 0; i < townsArr.length; i++){
			if( townsArr[i].id == townId ){
				if( dirLeft )
					townId = (townsArr[--i]||townsArr[townsArr.length-1]).id;
				else
					townId = (townsArr[++i]||townsArr[0]).id;

				break;
			}
		}

		if( townId != wofh.town.id ) 
            appl.setTown(townId);
	};
	
	Account.prototype.updateTownsAura = function(){
		for(var town in wofh.towns){
			town = wofh.towns[town];
			
			town.unpackAura(true);
		}
	};
	
	Account.prototype.getCenterTown = function(){
		for(var town in wofh.towns){
			town = wofh.towns[town];
			
			if( town.isCoorCenter() )
				return town;
		}
		
		return false;
	};
	
	Account.prototype.getFirstTown = function(){
		if( this.townslist )
			return wofh.towns[this.townslist[0]];
			
		return false;
	};
	
	Account.prototype.getNextTownLuckBonusOver = function(now){
		now = now||timeMgr.getNow();
		
		var selected = false,
			bonus;
		
		for(var town in wofh.towns){
			town = wofh.towns[town];
			
			bonus = town.getNextLuckBonusOver(now);
			
			if( bonus && (!selected || bonus.time < selected.time) )
				selected = bonus;
		}
		
		return selected;
	};
	
	Account.prototype.isMoneyEnough = function(){
		if( this.money && this.money.inc < 0 )
			 return -this.money.sum / this.money.inc * timeMgr.HtS > timeMgr.DtS;

		return true;
	};