/**
	Диспетчер обновлений
*/

var notifMgr = {
	notifs: {},
    
    handler: 0, // Счетчик обработчиков
    
    getHandler: function(){
        return ++this.handler;
    },
    
	toArray: function(params){
        return utils.isArray(params) ? params : [params];
    },
    
	// Добавление обработчика к нотификации - с проверкой списка параметров
    // Нотификация, к которой присоединяется обработчик(id или {id: id, params: params} или {id: id, params: params, callback:callback})
    // Уникальное имя колбэка обработчика
    // Функция обработчика
	addListener: function (notif, handler, callback, context) {
		var paramsArr;
		
        if( typeof(notif) === 'object' ) {
			if( notif.params !== undefined )
				paramsArr = this.toArray(notif.params);
			
            callback = notif.callback||callback;
			
			notif = notif.id;
        }
		else if( callback && callback.params !== undefined )
			paramsArr = this.toArray(callback.params);
        
		if( !this.notifs[notif] )
			this.notifs[notif] = {};
		
		this.notifs[notif][handler] = {params: paramsArr, callback: callback, context: context};
	},
    
    // Удаляем конкретный обработчик нотификации
	removeListener: function (notif, handler) {
		if( notif instanceof Object )
            notif = notif.id;
		
		delete this.notifs[notif][handler];
	},
    
    // Удаляем все обработчики нотификации
	removeListeners: function (handler, list) {
		list = list||this.notifs;
		
		if( utils.isArray(list) )
			for(var notif in list)
				this.removeListener(list[notif], handler);
		else
			for(var notif in list)
				this.removeListener(notif, handler);
    },
    
	// Запуск обработчика на произошедшее событие
	runEvent: function (notifId, params) {
		if( !this.notifs[notifId] )
            return;
		
		// Пробегаемся по списку обработчиков нотификации
		for (var handler in this.notifs[notifId]) {
            handler = this.notifs[notifId][handler];
			
            if ( handler.params ) {
				// Если указаны параметры, params обязан быть массивом, если нет, преобразовываем
				var paramsArr = this.toArray(params);
				// Ищем пересечение списков
                for (var id in paramsArr) {
                    if( utils.inArray(handler.params, paramsArr[id]) )
                        handler.callback.call(handler.context, paramsArr, notifId, paramsArr[id]);
                }
            }
			else
                handler.callback.call(handler.context, params, notifId);
		}
	}
};

Notif = {};
Notif.ids = {
    townCur: 0,//смена текущего города
	townAttacks: 1,//атаки на город
	townPop: 2,//количество населения
	townPopHas: 3,//количество населения
	townPopSpread: 4,//распределение населения
	townTraders: 5,//количество торговцев
	townStockCapacity: 6,//вместимость склада
	townRes: 7,//ресурсы - глобальное
	townResHas: 8,//количество отдельного ресурса
    townResAlter: 9,
	townGarrison: 10,//гарнизон (весь)
	townBuildings: 11,//постройки в городе
	townBuildQueue: 12,//очередь построек
    townBuildQueuePerc: 13,//процент по текущему строительству
	townName: 14,
    townClickers: 15,//кликеры города
	townStream: 16, // Торговля - потоки
    townArmyGroups: 17,
	townBarter: 18, // Торговля - бартер
	townTradersMove: 19, // Событие передвижения торговцев
	townOwnGarrison: 20, // Гарнизон (свой) 
	townStreamMarketOffer: 21, // Торговля - свои предложения (создание, редактирование, обновление)
	townTrain: 22, // Тренеровка
	townUpd: 23, // Обновление города
	townFuel: 24, // Ресурс ускорение для города
	townFleet: 25, // Новый флот
	townFleetUpd: 26, // Обновление флота
	townFleetDel: 27, // Удаление флота
	townZoom: 28,//изменение масштаба города
	townRainbow: 29,// Радуга сияние
	townStreamOfferDelete: 30, // Удаление предложения потока
	townWonderActivity: 31, // Изменилось состояние активности ЧС в городе
	townAirdef: 32, // Нанесен урон авиации
	townModeChange: 33, // Режим отображения города
	townFreeMarket: 34, // Произведена свободная покупка
	townTradeOffers: 35, 
	townTrainUnitsHide: 36,
	townSwapSlot: 37,
	townSwapSlotTimer: 38,
	townSwapSlotHold: 39,
	townMovers: 40,
	townEvent: 41,
	anyTownBuildings: 41,// Постройки в городах
	townResUpd: 42,
	townBuildResCollected: 43,
	townChange: 44,
	townImpBuilt: 45,
	townEnter: 46,
	townStartDrawView: 47,
	townToggleStock: 48,
	townToggleGarrison: 49,
    townChanged: 50,
    townUpdEconomics: 51,
    accScience:100,//внешнее событие
    accScienceHas:101,//изменение прогресса
    accMoney:102,//
    accMessage:103,//новое сообщение
    accMessageNew:104,//изменения статуса непрочитанности сообщений
    accReportNew:105,//изменения статуса непрочитанности отчётов
    accQuests: 106,//состояние квестов
    accLuck: 107,//состояние квестов
    accAbilities: 108,//возможности аккаунта
    accAbilitiesWnd: 109,//возможности аккаунта - срабатывает в момент показа окна
	accTicketNew: 110,//состояния прочтения тикетов
	accEmail: 111,//новое мыло игрока
	accAssist: 112,//новый зам
	accOptions: 113,//новые опции
    accTownBonus: 114,//бонусы по городам
	accTownBonusAlarm: 115,
    accTowns: 120,//изменение количества городов
	accTradeAlly: 121,//изменение торговых союзов
	accBonus: 122,//изменение бонусов для акка(подселение, ЦА и т.п.)
	accInvite: 123,//приглашение в страну
	accMap: 124,//изменение карты-открыто что то новое
	accChest: 125,//сундук-галактика-бонусы
	accMoneyIter: 126, // Итератор денег
	accSpecialists: 127, // ВГ акка
	accNewSpecialists: 128, // новый ВГ
	accQuestViewed: 129,// Квест просмотрен
	accReport: 130, // Пришел отчет
	accReadMessage: 131, // Прочитали сообщение
	accTacticsChange: 132,
	accTacticRestore: 133,
	accNewCenterTown: 134, // Изменился город центр
	accFutureBuilds: 135, // Получены строения, которые в скором времени сможет строить акк
	accQuestsMgr: 136, // Сперва обрабатываем в менеджере
	accQuestViewedMgr: 137,// Сперва обрабатываем в менеджере
	accQuestsNew: 138,
	accResearch: 139,
	accMessageBlock:140,
	accReportMarkAsRead: 141,
	event: 200,//какое-либо событие
	eventArmy: 201,//событие армии
	eventSendArmy: 202,//событие отправки армии
	сhangeMarketType: 203, // Изменился тип окна торговли
    wsChatMessage: 300,//сообщение в чате
    wsOpen: 301,//открытие веб-сокета
	wsAnn: 302,//объявления
	wsUpdate: 304,
	support: 400,// Поддержка
	supportTicketRead: 401,// Поддержка
	countryAccounts:500,
	countryArmy: 501,//армия страны
	countryAttack: 502,//атака на страну
	countryChange:503,
	countryInvite: 504,//приглашения страны
	countryMission: 505,// Миссия страны
	countryMoney:506,//
	countryNotes:507,
	countryPost:508,
	countryText: 509,// Описание страны
	countryVote: 510,//голосовалка
	countryTowns: 511,//города
	countryWonder: 512,// ЧС страны
	countryOrdersChecked: 513,// Обновления списка провреренных заказов
	countryOrdersNoChecked: 514, // Обновления списка непровреренных заказов
	countryOrdersMy: 515, // Обновления списка непровреренных заказов
	countryOrders: 516, // Обновления списка заказов активной вкладки
	countryBarter: 517,
	countryOrdersAccess: 518,
    applFramed: 600,//приложение поменяло режим
	applResize: 601,
    platformFBinited: 700,//фэйсбук инициализирован
    chatChannelRemove: 800,//удаление канала
    chatMessageAdd: 801,//добавление нового сообщения - сообщение
    chatChannelLog: 802,//прибытие лога - канал
    chatMessageDel: 803,//удаление сообщения - время
    chatChannelInfo: 804,//информация по каналу - модераторы, админы и т.п.
    chatAccess: 805,//получение доступов к каналам
	chatChannelReady: 806,
	chatStyles: 807, // Стили для чата
	chatRefreshChldStyles: 808, // Обновление потомков при изменении стилей
	chatDisplay: 809, // Состояние отображенрия чата
	chatRefreshMsg: 810,
	chatScroll: 811, // События скролла
	chatSize: 812,
    mapZoom: 901,//изменение зума
    mapMode: 902,//изменение режима
    mapTileSelect: 903,//активный тайл
    mapTileSelectInfo: 904,//активный тайл - пришла дополнительная информация
    mapTileHover: 905,//тайл на который навели мышью
    mapSettings: 906,//реакция на изменение настроек(кроме зума)
    mapChunkLoaded: 907,//на загрузку чанка
    mapMove: 908,//двигаем карту(возможно в пределах одного тайла)
    mapMoving: 909,//карта вошла в процесс перемещения или вышла из него
    mapIfResize: 910,//изменение размеров интерфейса
	mapShowRoute: 911,// Реакция на изменеие маршрута
    mapRouteReceived: 912,// Реакция на получение маршрута
	mapRequestRoute: 913,// Запрос данных по маршруту
	mapRender: 914,
	mapTileHold: 915, // Удержание клавиши мыши на клетке
	mapShow: 916,
	updView: 917,
	mapToggleFilters: 918,
	mapToggleMapR: 919,
	mapToggleActions: 920,
	mapToggleMapMini: 921,
    mapVersion: 922,
    mapResLoaded: 923,
	resize: 1000,
	sndEnable: 1200,// Вкл/Выкл звуковых источников
	sndVolume: 1201,// Меняем звук
	sndGlobalVolume: 1202,// Меняем звук - общий
	sndBackChange: 1203,//переключение фоновой музыки
	global: 1300, // Приходит при изменении числа действующих висячих садов или пирамид в мире. Так же при победе.
	ifShown: 1301,
	timerCountryMoney: 1400,
	sysCloseDependentWnd: 1500, // Закрыть зависимые окна (пример: закрытие окна перемещения торговцев в ответ на закрытие окна отправки ресов),
	sysStopWndSwipe: 1501,
	sysWndListClosed: 1502,
	sysTicketChangeLabel: 1503,
	sysConsoleError: 1504,
	sysDragToggled: 1505,
    sysFullScreen: 1506,
	workerMapChunks: 1600, // Воркер обработал чанки и вернул результат
	refreshReports: 2000,
	reqGetMapChunks: 3000,
	reqGetCountryTowns: 3001,
	
	mobToggleBars: 5000,
	mobTownChildren: 5001,
	
    mobBarExpandEnd: 5002,
    mobBarExpandStart: 5003,
    
	mobAppMiniMapOnToggle: 6000,
	mobAppMActionsOnToggle: 6001,
	mobAppScreenSwipe: 6002,
    mobAppTownToggleInfoExt: 6003,
    mobAppMapToggleInfoExt: 6004,
    mobAppMapToggleInfo: 6005,
    mobAppMapInfoToggleEnd: 6006,
    mobAppMapRenderTile: 6007,
    
    test1: 6505,
    test2: 6506
};

// Время задержки после, которого будет выполняться обновление контента для всех впришедших за это время нотификаций
Notif.delay = 500; 
Notif.sDelay = 250;

//цепочки событий
notifMgr.addListener(Notif.ids.townCur, 'refr', function(){
	notifMgr.runEvent(Notif.ids.townChange);
	notifMgr.runEvent(Notif.ids.townAttacks);
	notifMgr.runEvent(Notif.ids.townPop);
	notifMgr.runEvent(Notif.ids.townTraders);
	notifMgr.runEvent(Notif.ids.townStockCapacity);
	notifMgr.runEvent(Notif.ids.townRes, {forceUpdate: true});
	notifMgr.runEvent(Notif.ids.townGarrison);
	notifMgr.runEvent(Notif.ids.townBuildings);
	notifMgr.runEvent(Notif.ids.townBuildQueue);
	notifMgr.runEvent(Notif.ids.townClickers);
    
    notifMgr.runEvent(Notif.ids.townChanged);
});
notifMgr.addListener(Notif.ids.townStockCapacity, 'refr', function(){
    notifMgr.runEvent(Notif.ids.townRes);
});
notifMgr.addListener(Notif.ids.wsUpdate, 'refr', function(){
	notifMgr.runEvent(Notif.ids.event);
	
	notifMgr.runEvent(Notif.ids.countryChange);
});


