/**
	Хранилище всех данных
*/

function Info(){}


Info.prototype.init = function(rawData){
	// wofh может переинициализироваться после разрыва соединения!
	// this.rawData = rawData; 22.09.2020
	
	// Глобальные ауры
	this.global = rawData.global;
	
	// Общие данные по миру (города, акки и страны)
	this.world = this.world||((new World()).init());

	this.world.parse(rawData.townsinfo, rawData.accountsinfo, rawData.countriesinfo);

	if( rawData.country ){
		this.country = new Country(rawData.country);

		this.world.addElem(this.country.cloneBase());
	}
	else
		delete this.country;

	this.account = rawData.account;

	if( this.account.quest ){
		this.account.quests = this.account.quest.state;

		delete this.account.quest;
	}

	rawData.account.invites = rawData.invites||[];

	this.account = new Account(rawData.account);
	
	this.account.unpackMoneyWas();

	this.world.addElem(this.account.cloneBase());

	this.account.bonus = this.account.bonus||{};

	this.announces = rawData.announces||[];

	for(var ann in this.announces){
		ann = this.announces[ann];

		ann.account = rawData.accountsinfo[ann.account];
	}

	if( rawData.tradeally )
		this.tradeAllies = new TradeAllyList(rawData.tradeally);
	else
		delete this.tradeAllies;

	this.account.research.build = this.account.research.build||[];
	this.account.science.incReal = this.account.science.inc;

	// События
	this.events = new EventList();

	// Cписок городов
	this.towns = {};
	for(var town in rawData.townslist){
		town = rawData.townslist[town];

		town = this.towns[town.id] = new Town(town);

		this.world.addElem(town.cloneBase());
	}

	this.barterOffers = new BarterOfferList(rawData.barter); // Список бартерных предложений для всех городов акка
	this.tradeOffers = new TradeOfferList(rawData.trade); // Список торговых предложений для всех городов акка
	this.streamOffers = new StreamOfferList(rawData.streamoffers); // Список потоковых предложений для всех городов акка
	this.streams = new StreamList(rawData.streams); // Данные по открытым потокам для всех городов акка
	this.streamPersonalOffers = new StreamPersonalOfferList(rawData.streampersonaloffers); // Данные по потокам ждущим подтверждения для всех городов акка

	this.fleets = new FleetList(rawData.fleets); // Задействованные флоты.
	this.reinforcements = new ReinforceList(rawData.reinforcements); // Список подкреплений всех городов 
	this.commanding = new CommandingList(rawData.commanding); // Список ВО

	this.events.parseEvents(rawData.events);

	this.battles = new BattleList(rawData.battles);
	
	if( rawData.battles )
		this.events.parseBattles(rawData.battles);
	
	this.reports = this.reports||{};

	this.contacts = new ContactsList(ls.getContacts(false));
    
    this.linkadd = rawData.linkadd;
    
    this.gameEvent = new GameEvent(lib.main.eventstatus);
};

Info.prototype.update = function(rawData){
	this.init(rawData);
};


wofh = new Info();