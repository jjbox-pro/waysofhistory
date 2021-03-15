LS = {
	storage: {}
};
 
	//параметры нужны только для того, чтобы было понятно, что вообще может храниться в хранилище.
	//во избежание мертвых душ, отсутствующих элементов, для создания единообразия
LS.params = {
	NA: 'NA',//режим NA
	TownId: 'tid', //код текущего города
	TownZoom: 'townZoom',
	TownZoomLock: 'townZoomLock',//заблокировано ли изменение зума города
    TownTab: 'townTab',//вкладка города (для мобильных интерфейсов)
	//чат
	ChatChannels: 'chat',
	ChatSize: 'ifChatSize',
	FavSmiles: 'favSml', //список любимых смайлов
	//панельки города 1.4
	StockTab: 'stockTab',
	AdminShow: 'adminShow',
	AdminAdditionShow: 'AdminAdditionShow',
	SMenuShow: 'smenuShow',
    SlotsShow: 'slotsShow',
    PAdminShow: 'pAdminShow',
    FriendsShow: 'friendsShow',
    BonusShow: 'bonusShow',
	//карта
	MapZoom: 'MapZoom',
	MapMiniType: 'MapMiniType',
	MapAuraShow: 'MapAuraShow',
	MapIFaceShow: 'MapIFaceShow',
	MapFilterShow: 'MapFilterShow',
	MapRightPanShow: 'MapRightPanShow',
	MapIFace: 'MapFilter',
	MapFilter: 'MapFilter2',
    MapVersion: 'MapVers',
	//слот
	SlotNewTab: 'SlotNewTab',
	SlotNewConflict: 'SlotNewConflict',
	//окно нотификаций об оплате
    RefNotif: 'RefNotif',
    Groundhog: 'Groundhog',
    //Фильтр отчетов
    ReportFilters: 'ReportFilters',
    //Фильтр страницы армии
    ArmyFilter: 'ArmyFilter',
	//Фильтр армий страны
    CountryArmyFilter: 'CountryArmyFilter',
    //энциклопедия
    PediaScienceFilter: 'PediaScienceFilter',
    //статистика в советнике страны
    CountryAdvStat: 'CountryAdvStat',
    CountryAdvEmptyBtn: 'CountryAdvEmptyBtn',
	//показать окно с информацией о городе на карте
	ShowMapTownInfo: 'ShowMapTownInfo',
    // Позиции квестов в списке (новые вверху)
	QuestsPos: 'QuestsPos',
	// Вид списка квестов (изображения/текст)
	QuestListView : 'QuestListView',
	// Настройки для отправки реса
	SendLoadOptions : 'SendLoadOptions',
	// Флаг - открывать ли окно вместе с транспортировкой и бартером
	TradersMoveAutoStart: 'TradersMoveAutoStart',
	SendArmyAutoClose: 'SendArmyAutoClose',
    WndPos: 'WndPos',//Позиции окон. Ассоциативный массив
	DependentWndPos: 'DependentWndPos',//Позиции окон. Ассоциативный массив для окон, положение которых может зависить от других окон
    //сообщения
    NewMessageBackup: 'NewMessageBackup',
    //аккаунт
    AccAdmToggleBlock: 'AccAdmToggleBlock',//показывать ли админский блок на странице аккаунта
    //сортировка списка групп на складе
    StockGroups: 'StockGroups',
	//торговля
    LastTradeWnd: 'LastTradeWnd',//Тип последнего открытого окна торговли (торговля за деньги, бартер, потоки)
	LastBarterTab: 'LastBarterTab',//последний открытый таб
	LastTradeTab: 'LastTradeTab',//последний открытый таб
	LastStreamTab: 'LastStreamTab',//последний открытый таб
	LastTownsTab: 'LastTownsTab',//последний открытый таб
    
    GameIf: 'gameIf',// интерфейс игры
    //звуки
    AudioMusicOn: 'AudioMusicOn',
    AudioEventOn: 'AudioEventOn',
    AudioAmbientOn: 'AudioAmbientOn',
    AudioNoiseOn: 'AudioNoiseOn',
	
	AudioGlobalVolume: 'AudioGlobalVolume',
	
	AudioMusicVolume: 'AudioMusicVolume',
	AudioEventVolume: 'AudioEventVolume',
	AudioAmbientVolume: 'AudioAmbientVolume',
	AudioNoiseVolume: 'AudioNoiseVolume',
	MessageBackup: 'MessageBackup', // Хранит последнее набранное сообщение для каждой переписки
	// Данные последнего выставленного предлажения
	TradeOfferLastData: 'TradeOfferLastData',
	StreamOfferLastData: 'StreamOfferLastData',
	BarterOfferLastData: 'BarterOfferLastData',
	AdminAcc: 'AdminAcc', // Убить после переезда админки в окно
	Lang: 'Lang',
	LastCountryTab: 'LastCountryTab',//последний открытый таб
	СountryInfoBrief: 'СountryInfoBrief', // Краткая или полная информация 
	CountryArmyUnitFilter : 'CountryArmyUnitFilter', // Фильтрация юнитов по тактикам (сухопутные, флот и т.п) 
	TownRainbow : 'TownRainbow', // Радуга и сияние
	NewSpecialists : 'NewSpecialists', // Новые ВГ
    AccSpecialists : 'AccSpecialists',
	NewBattleSys : 'NewBattleSys', // Новая боевая система (пока в учениях)
	MoversAnim : 'MoversAnim', // Анимция передвижения людей в городе
	PediaSciBonusFilter: 'PediaSciBonusFilter', // Фильтр по плюшка наук в педии
	PediaUnitFilter: 'PediaUnitFilter', // Фильтр по доступности юнитов в педии
	PediaUnitBonusFilter: 'PediaUnitBonusFilter', // Фильтр по плюшка юнитов в педии
	ChatStyles: 'ChatStyles', // Стили для чата
	PediaDepFilter: 'PediaDepFilter',
	PediaDepResFilter: 'PediaDepResFilter',
	TicketTxtBackup: 'TicketTxtBackup',
	ChatDisplay: 'ChatDisplay',
	MapCentering: 'MapCentering',
	PediaBuildFilter: 'PediaBuildFilter',
	PediaBuildBonusFilter: 'PediaBuildBonusFilter',
	HelpSection: 'HelpSection',
	TownsCollectedTypes: 'TownsCollectedTypes', // Состояние чекеров в информаториуме
	AutoShowOrders: 'AutoShowOrders',
	Simbattle: 'Simbattle',
	BarterFilter: 'BarterFilter',
	TradeFilter: 'TradeFilter',
	StreamFilter: 'StreamFilter',
	FreeMarketFilter: 'FreeMarketFilter',
	LessPopLimit: 'LessPopLimit',
	MakeOrderUseStock: 'MakeOrderUseStock',
	EconomicsInfoComment: 'EconomicsInfoComment',
	MapToggleMenu: 'MapToggleMenu',
	WondersRivalMode: 'WondersRivalMode',
	CountryMoneyProdFloat: 'CountryMoneyProdFloat',
	RoadsCache: 'RoadsCache',
	Contacts: 'Contacts',
	MobileAccept: 'MobileAccept',
	TicketsData: 'TicketsData',
	TicketsFilter: 'TicketsFilter',
	ConsoleErrors: 'ConsoleErrors',
	Antialiasing: 'Antialiasing',
	ApplLastUpd: 'ApplLastUpd',
	AttDefViewSimbattle: 'AttDefViewSimbattle',
	AttDefViewReport: 'AttDefViewReport',
	
    HideDayprize: 'HideDayprize',
    
	MobileApp: 'MobileApp',
    
    Test1: 'Test1',
    Test2: 'Test2'
};

// Имена параметров, которые буду записаны в серверное хранилище в случае если локальное не доступно.
LS.servStorageParams = {};
LS.servStorageParams[LS.params.GameIf] = true;
LS.servStorageParams[LS.params.AudioGlobalVolume] = true;
LS.servStorageParams[LS.params.AudioEventVolume] = true;
LS.servStorageParams[LS.params.ChatSize] = true;
LS.servStorageParams[LS.params.MapToggleMenu] = true;
LS.servStorageParams[LS.params.RoadsCache] = true;
LS.servStorageParams[LS.params.MobileAccept] = true;


LS.init = function(ls, params){
	ls = ls||{};
	params = params||LS.params;
	
	for (var id in params){
		var name = params[id];
		
		LS.addFunctions(ls, id, name);
	}
	
	return ls;
};

LS.addFunctions = function(ls, id, name) {
	ls['get'+id] = function(def, opt){return LS.get(name, def, opt);};
	ls['set'+id] = function(data, opt){LS.set(name, data, false, opt);};
	ls['clean'+id] = function(){LS.clean(name);};
};


LS.get = function(name, def, opt){
	opt = opt||{};
	
	var data;
	
	try{
		data = localStorage[name];
	}
	catch(e){		
		// Если локальное хранилище не работает, пишем в специальную область серверного хранилищая.
		// В данном случае для доступа к данным используется временная переменная temp, 
		// т.к. при установке значения нет смысла ожидать корректного сохранения данных в буфер.
		if( LS.servStorageParams[name] && window.servBuffer && !debug.noAdminSave() )
			data = servBuffer.temp.storage[name];
		else{
			console.warn("Sorry, but we can't get data from ls!");
			
			if( opt.callback )
				return opt.callback();
			
			data = LS.storage[name];
		}
	}
	
	if ( data === undefined )
		return def;
	
	if ( data == '' )
		return data;
	
	return JSON.parse(data);
};

LS.set = function(name, data, try2, opt){
	opt = opt||{};
	
	data = data === undefined || try2 ? data : JSON.stringify(data);
	
	try{
		localStorage[name] = data;
	}
	catch(e){
		if( LS.servStorageParams[name] && window.servBuffer && !debug.noAdminSave() ){
			servBuffer.temp.storage[name] = data;
			
			LS.saveServStorage({delay: opt.servStorageDelay});
		}
		else{
			if( try2 ){
				console.warn("Sorry, but we can't save data to ls!");
				
				if( opt.callback )
					opt.callback();
				else
					LS.storage[name] = data;
			} 
			else{
				if( !window.servBuffer )
					this.clean();
				
				this.set(name, data, true, opt);
			}
		}
	}
	
	return data;
};

LS.clean = function(name, storage, fullClean){
	try{
		storage = storage||localStorage;
	}
	catch(e){
		if( window.servBuffer && !debug.noAdminSave() ){
			storage = servBuffer.temp.storage;
			
			var isServStorage = true;
		}
		else{
			console.warn("Sorry, but we can't clean data from ls!");
			
			storage = LS.storage[name];
		}
	}
	
	if( name ){
		delete storage[name];
	}
	else{
		var i = 0;
		
		for (var name in storage) {
			if( name.substr(0,5) == 'chunk' || fullClean ){
				delete storage[name];
				
				i++;
			}
		}
	}
	
	if( isServStorage )
		LS.saveServStorage();
};

LS.saveServStorage = function(opt){
	opt = opt||{};
	
	clearTimeout(LS.servStorageTimeout);
	
	// Если false, сразу же сохраняем данные на сервере.
	// Нужно для случаев, когда после установки параметра сразу же происходит перезагрузка (при смени иф и т.д.).
	if( opt.delay === false ){
		servBuffer.apply();
		
		return;
	}
	
	LS.servStorageTimeout = setTimeout(function(){
		servBuffer.apply();
	}, opt.delay||5000);
};

LS.isReady = function(){
	try {
		return window.localStorage != undefined;
	} catch (err) {
		return false;
	}
};

LS.getActualLS = function(){
	var storage = {};
	
	try{
		for(var key in localStorage){
			if( localStorage.hasOwnProperty(key) )
				storage[key] = localStorage[key];
		}
	}
	catch(e){
        for(var key in LS.storage){
			if( LS.storage.hasOwnProperty(key) )
				storage[key] = LS.storage[key];
		}
    }
	
	return storage;
};


LS.newMessageBackup = {
    to: '',
	topic: '',
	text: ''
};

LS.mapIFace = {
    default: '000000',
    defaultQuest: '010000',//после получения какого то квеста
    grid: 0,
    colonization: 1,
    zoom: 2,
    navigation: 3,
    depLinks: 4,
};

LS.mapFilter2 = {
    default: '2.2.0.2.128.2.0.-1.-1.-1',
    mount: 0,
    hill: 1,
    town: 2,
    mapimp: 3,
    road: 4,
    deposit: 5,
    wonder: 6,
	
    wonderId: 7,
    depositId: 8,
    mapimpId: 9,
};

LS.def = {
	Antialiasing: true,
	MobileAccept: false
};

ls = LS.init();

//ПИЗДЕЦ КОСТЫЛЬ

ls.setMessageTime = function(time){
	if( !LS.isReady() )
		return;
	
    localStorage['message'+wofh.account.id] = time;
};

ls.getMessageTime = function(){
	if( !LS.isReady() ) 
		return 0;
	
    return +localStorage['message'+wofh.account.id] || 0;
};

ls.setReportTime = function(time){
	if( !LS.isReady() )
		return;
	
    localStorage['report'+wofh.account.id] = time;
};

ls.getReportTime = function(){
	if( !LS.isReady() )
		return 0;
	
    return +localStorage['report'+wofh.account.id] || 0;
};

//КОНЕЦ ЕБУЧЕГО КОСТЫЛЯ