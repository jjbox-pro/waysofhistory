function Country (data, unknow) {
	if( unknow )
		data = utils.clone(Country.unknownCountry);
	
	if( data )
		this.parse(data);
};

	utils.extend(Country, BaseItem);

	Country.prototype.parseArr = function(arr){
		var obj = {};

		obj.id = +arr[0];
		obj.name = arr[1];
		obj.flag = arr[2];

		return obj;
	};

	Country.prototype.clone = function (opt) {
		opt = opt||{};
		
		var clone = new Country();
		
		utils.copyProperties(clone, this, opt);
		
		return clone;
	};
	
	Country.prototype.cloneBase = function(){
		var clone = new Country();
		
		clone.id = this.id;
		clone.name = this.name;
		clone.flag = this.flag;
		
		if( this.relations )
			clone.relations = utils.clone(this.relations);
		
		return clone;
	};
	
	Country.prototype.updLinks = function(){};

	Country.prototype.unpack = function () {
	    if( this.checkLvl2() ){
	    	this.unpackAccounts();
			
		    this.unpackInvited();
			
		    this.unpackArmy();
			
		    this.unpackRelations();
			
			this.unpackScience();
	    }

	    if( this.checkLvl3() )
		    this.unpackMoney();
	};


	//Страна инициализируется массивом вида[123, 145, 1567]
	Country.prototype.unpackAccounts = function (checkInvited) {
		if( this.accountslist ){
			this.accounts = this.accountslist;
			
			delete this.accountslist;
		}
		
		if( !this.accounts || this.accounts instanceof CountryAccounts ) return;

		var accountsRaw = this.accounts;
		
		this.accounts = new CountryAccounts();
		
	    for(var acc in accountsRaw){
	    	var accData = accountsRaw[acc];
			
			if( accData instanceof Account ){
				this.accounts[accData.id] = accData;
			}
	    	else if ( accData instanceof Object ) {
	    		var accId = accData.acc;
	    		this.accounts[accId] = wofh.world.getAccount(accId);// для aj_data
	    		this.accounts[accId].parse(accData);
	    	} else {
	    		var accId = accData;
	        	this.accounts[accId] = wofh.world.getAccount(accId);
	    	}
	    }
		
		if( checkInvited ){
			// Удаляем приглашённых
			for(var accId in this.invited){
				if(this.accounts[accId])
					delete this.invited[accId];
			}
		}
	};
	
	Country.prototype.unpackScience = function(){
		if ( !this.science || this.science instanceof CountryScience ) return;
		
		this.science = new CountryScience(this.science);
		
		this.science.incReal = this.isScienceDipOff() ? 0 : this.science.inc;
		
		this.science.progress = this.science.progress||{};
		this.science.progressWas = utils.clone(this.science.progress);
		
		this.science.debtWas = this.science.debt = this.science.debt||0;
		// Добавляем НЗ в очередь изучения
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
		
		this.science.current = this.science.queue[0];
	};
	
	//распаковка приглашений
	Country.prototype.unpackInvited = function (){
		this.invited = this.invited||{};
		
		if( !utils.isArray(this.invited) )
			return;
		
		var invitedRaw = this.invited;
		
		this.invited = {};
		
		for (var acc in invitedRaw){
			acc = invitedRaw[acc];
			
			this.invited[acc] = wofh.world.getAccount(acc);
		}
	};

	Country.prototype.unpackArmy = function (){
		if ( !(this.army instanceof Army) )
			this.army = new Army(this.army);
		
	    if ( !(this.armytraining instanceof Army) )
			this.armytraining = new Army(this.armytraining);
	};
	
	Country.prototype.unpackRelations = function (){
	    this.relations = this.relations||{};
	};
	
	Country.prototype.unpackMoney = function(){
		this.money = this.money||{};
		this.taxes = this.taxes||{};
		
		this.money.credites = this.money.credites instanceof Object ? this.money.credites : {sum: this.money.credites};
		this.money.deposites = this.money.deposites instanceof Object ? this.money.deposites : {sum: this.money.deposites};
		
		this.money.credites.sum = this.money.credites.sum||0;
		this.money.deposites.sum = this.money.deposites.sum||0;
		this.money.credites.inc = this.money.credites.inc||0;
		this.money.deposites.inc = this.money.deposites.inc||0;
		
		this.money.creditPayment = this.money.credites.sum * (this.taxes.credit.rate * 0.001) / 24;
		this.money.depositPayment = this.money.deposites.sum * (this.taxes.deposit.rate * 0.001) / 24;
		
		this.money.taxes =  this.money.taxes||{};
		
		this.money.taxes.pop = this.money.taxes.pop||0;
		this.money.taxes.prod = this.money.taxes.prod||0;
		this.money.taxes.stream = this.money.taxes.stream||Trade.taxes.stream.def;
		this.money.taxes.streamSum = utils.calcObjSum(this.money.taxes.stream);
		this.money.taxes.deposit = this.money.taxes.deposit||0;
		this.money.taxes.sum = this.money.taxes.pop + this.money.taxes.prod + this.money.taxes.streamSum + this.money.taxes.deposit;
		
		this.money.budget = this.money.budget||{};
		
		this.taxes.budget = this.taxes.budget||{};
		this.taxes.budget.prod = this.taxes.budget.prod||[];
		this.taxes.budget.subsidy = this.taxes.budget.subsidy||[];
		
		this.money.budgetSum = this.calcBudgetInc();
		
		this.money.balance = this.money.taxes.sum - this.money.budgetSum + this.money.creditPayment - this.money.depositPayment;
	};
	
	Country.prototype.calcBudgetInc = function(){
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
	
	Country.prototype.calcTaxesBudgetProdSum = function(){
		return utils.calcObjSum(this.taxes.budget.prod.slice(1)); // slice(1) - исключаем знания
	};
	
	Country.prototype.calcTaxesTaxProdSum = function(){
		return utils.calcObjSum(this.taxes.tax.prodx); // slice(1) - исключаем знания
	};
	
	Country.prototype.hasTaxesBudgetProdSum = function(){
		return !!this.calcTaxesBudgetProdSum();
	};
	
	Country.prototype.hasTaxesTaxProdSum = function(){
		return !this.hasTaxesBudgetProdSum();
	};
	
	//включаем или отключаем приглашение
	Country.prototype.toggleInvite = function (invite, toggle) {
		if(toggle){
			this.invited[invite] = wofh.world.getAccount(invite);
		}
		else{
			delete this.invited[invite];
		}
	}

	Country.prototype.checkLvl2 = function(){
		if( this.hasOwnProperty('accounts') || this.hasOwnProperty('accountslist') )
			return true;
		
		return false;
	};

	Country.prototype.checkLvl3 = function(){
		return this.hasOwnProperty('money');
	};
	
	Country.prototype.checkLvl4 = function(){
		return this.hasOwnProperty('players');
	};
	
	Country.prototype.checkUnknown = function(){
		if( this.name == Country.unknown ){
			this.name = 'Nichtexistentes Land';
			this.unknown = true;
		}
	};
	
	
	Country.prototype.getName = function () {
		return this.name;
	};
	
	Country.prototype.getAccountByPost = function(post){
		for (var account in this.accounts) {
			account = this.accounts[account];
			if (account.hasPost(post)) {
				return account;
			}
		}
		return false;
	};

	//необходимо для данного количества игроков
	Country.prototype.diplomacyNeed = function(accCount) {
	    if(typeof(accCount) == 'undefined') accCount = utils.sizeOf(wofh.country.accounts);
		return 10 * Math.pow(accCount-1, 2);
	};

	Country.prototype.diplomacyEnough = function() {
		return this.diplomacy >= this.diplomacyNeed();
	};
	
	Country.prototype.isScienceDipOff = function() {
		return !!this.science.off;
	};

	Country.prototype.getRelStatus = function(countryId){
		if (this.id == countryId) return Tile.relation.self;
	    return this.relations ? this.relations[countryId]||Tile.relation.none : Tile.relation.none;
	}

	Country.prototype.getCountriesByRel = function(rel){
		var list = {};
		
		for (var countryId in this.relations) {
			if (this.relations[countryId] == rel) {
				var country = wofh.world.getCountry(countryId);
				
				list[countryId] = country;
			}
		}
		
		return list;
	};

	Country.prototype.getMoneySum = function(){
		return this.money.sum;
	};
	
	Country.prototype.getMoneyBalance = function(){
		return this.money.balance;
	};
	

	Country.prototype.isAlly = function(countryId){
	    return this.getRelStatus(countryId) == Tile.relation.ally;
	}

	Country.prototype.isEnemy = function(countryId){
	    return this.getRelStatus(countryId) == Tile.relation.enemy;
	}
    
    Country.prototype.hasAttackIn = function(){
	    return (wofh.account.isPremium() && this.atkin)||0;
	};
    

	//сортировка аккаунтов по умолчанию - по населению
	Country.prototype.getSortedAccounts = function() {
		var list = utils.objToArr(this.accounts)

		list.sort(function(a, b){
			return (~~a.pop < ~~b.pop) ? 1 : -1;
		});

		return list;
	}

	//проверка битых ссылок 
	Country.prototype.isActive = function(){
		return this.flag != '';
	};
	
	Country.prototype.isUnknown = function(){
		return this.unknown;
	};
	
	Country.prototype.getAccCount = function(){
		if (this.accounts){
			return utils.sizeOf(this.accounts);
		} else {
			return this.players;
		}
	};
	
	Country.prototype.getMccCount = function(){
		return (this.wonder||{}).mcc||0;
	};
	
	Country.prototype.canLaunchSpaceship = function(){
		return this.getMccCount() >= lib.spaceship.controlcenterssum;
	};
	
	Country.prototype.getAuraWonders = function(aura){
		return (this.wonder||{})[aura]||0;
	};
	
	
	
	Country.prototype.hasOrdersRes = function(){
		return !!wofh.country.ordersAccess;
	};
	
	Country.prototype.useOrders = function(){
		return wofh.country.hasOrdersRes() || wofh.account.isAccountant();
	};
	
	Country.prototype.useMoney = function(){
		return Science.get(Science.ids.money).isKnown(true) || wofh.country.getMoneySum() || wofh.country.getMoneyBalance();
	};
	
	

Country.posts = {
    0: {name: 'head', title: 'Oberhaupt'},
    1: {name: 'science', title: 'Weiser'},
    2: {name: 'war', title: 'Kriegsherr'},
    3: {name: 'economics', title: 'Schatzmeister'},
    4: {name: 'warHelp1', title: 'Kriegsherr-Helfer'},
    5: {name: 'warHelp2', title: 'Kriegsherr-Helfer'},
    6: {name: 'adviser', title: 'Ratgeber'},
	7: {name: 'accountant', title: 'Buchhalter'},
	8: {name: 'accountantHelp1', title: 'Buchhalter-Helfer'},
	9: {name: 'accountantHelp2', title: 'Buchhalter-Helfer'}
};

utils.createIds(Country.posts, Country.postIds = {});

Country.getPostsBinFilter = function(){
	var filter = 0;
	
	for(var postId in Country.postIds){
		postId = Country.postIds[postId];
		
		filter ^= (1 << postId);
	}
	
	return filter;
};

Country.unknown = '-';

Country.unknownCountry = {id:0, name:Country.unknown, flag:''};

Country.blankCountry = new Country({name: 'Nicht in Land'});
