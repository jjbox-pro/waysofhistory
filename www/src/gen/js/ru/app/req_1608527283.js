/**
	Проведение запросов
    
    Формат названий запросов:
    1. глагол set/get/create/pay и т.п.
    2. список блоков по нисходящей Town, TownBudget, ArmyOwn, AccNotes 
   Итого setTown, getAccountMoney, renameTown
*/

function ReqMgr(){
	var self = this;
	
    var _reqCount = 40,
		_resetPeriod = 60, // Время после которого, счетчик (_reqCounter) сбрасывается к дефолтовому значению (_limit)
		_minDelay = 15,
		_reqCounter = _reqCount,
		_lastResetMoment = 0;
	
    this.iface = 'ajax';
	
	this.reqId = 0;
	
    this.init = function(){
        this.iface = 'socket';
		
		this.initBaseNames();
    };
    
	
    this.respList = {};
	
	this.addTown = function(req, town){
		req = req||{};
		
        if( req.town ) return req;
		
        if( !town ) town = wofh.town;
		
		req.town = Element.getId(town);
		
		return req;
	};

	this.addFrom = function(req, from){
		if (!req) req = {};
        if (req.from) return req;
		if (!from) from = wofh.town;
		req.from = Element.getId(from);
		return req;
	};
	
	this.addNA = function(req){
		if( !req ) req = {};
        
		if( wofh.account && wofh.account.isNA && wofh.account.isNA() )
			req.na = 1;
		
		return req;
	};
    /*
     * options.metod - метод отправки [GET,POST], умолч: POST
     * options.onSuccess - если ответ получен, ошибки нет function(resp.data)
    */
   
    this.send = function(command, params, options){
        options = options||{};

        options.err = options.err||{};

        options.ignoreList = options.ignoreList||[ErrorX.ids.WEok, ErrorX.ids.WEok3, ErrorX.ids.WEnoUpdate];

        if (options.ignoreListAdd)
            options.ignoreList = options.ignoreList.concat(options.ignoreListAdd);

        options.method = options.method || 'POST';

        this.initCallbacks(options);

        params = this.addNA(params);

        var iface = utils.upFirstLetter(options.iface||this.iface);

        if( this['send'+iface](command, params, options) )
            return;
        
        this.checkSend();
    };
    
        this.checkSend = function(command, params, options) {
            var now = timeMgr.getNowLoc(),
                dt = now - _lastResetMoment;

            if( dt > _resetPeriod ){
                _reqCounter = _reqCount;

                _lastResetMoment = now;
            }
            else if( dt < 0 ){ // Учитываем перевод часов и возможные проблемы со временем на машине пользователя
                _lastResetMoment = now - (_resetPeriod * 0.5); // Если время отстало, считаем, что прошла половина периода для сброса счётчика запросов

                dt = now - _lastResetMoment;
            }

            if( _reqCounter < 1 ){
                if( !this.wReqBlock ){
                    var delayTime = Math.max(_minDelay, _resetPeriod - dt);

                    this.wReqBlock = wndMgr.addSmoothModal('Игра не поспевает за твоей активной деятельностью. Поэтому некоторые твои действия пока не принесут ожидаемого результата. Нужно немного подождать...<br>'+snip.timer(timeMgr.getNow() + delayTime, 'dec', timeMgr.fPeriod(delayTime)), {
                        canClose: false,

                        callbacks: {
                            calcName: function(){return 'reqBlock';}
                        }
                    });

                    setTimeout(function(){
                        self.wReqBlock.close();

                        delete self.wReqBlock;
                    }, delayTime * 1000); // Минимальное время отображения 15 сек
                }
            }
            else if( utils.isDocVisible() )
                _reqCounter--;
        };
    
	this.sendAjax = function(command, params, options){
        console.log('sendAjax', command, params, options);
		
		command = this.prepareRequestUrl(command);
		
        $.ajax({
            method: options.method,
            type: options.method,
            url: this.isAbsoluteUrl(command) ? command : appl.getOriginHost()+'/'+command,
            data: params,
            dataType: 'json'
        }).done(function(resp) {
            reqMgr.processResp(resp, options);
        });
    };
	
    this.sendSocket = function(command, params, options){
        if( typeof(webSocketMgr) == 'undefined' ){
			params.acc = ls.getAdminAcc(undefined); // Добавление параметра acc для админки
			
            this.sendAjax(command, params, options);
            
			return;
        }
		
        console.log('----> sendSocket', command, params, options);
        
		this.updReqId();
		
        var data = {};
        
		data.uid = this.getCurReqId();
		
		this.setRespOptions(data.uid, options);
		
		data.query = command;
        
        for (var i in params){
            if( typeof(params[i]) == 'string' )
                params[i] = encodeURIComponent(params[i]);
        }
		
        params = utils.objToUrl(params);
        
        if (options.method == 'GET'){
			if( params )
				data.query += (data.query.indexOf('?') == -1 ? '?' : '&') + params;
        }
		else
            data.post = params;
        
        data = JSON.stringify({com: 2, data: data});
		
		options.sendTime = Timer.getNowLoc();
		
		webSocketMgr.send(data);
    };
	
	this.sendWorker = function(command, params, options){
		console.log('----> sendWorker', command, params, options);
        
		this.updReqId();
        
		params.uid = this.getCurReqId();
		
		this.setRespOptions(params.uid, options);
		
		params[command] = true;
		
		workerMgr.postMessage(params);
		
		return true;
	};
	
	this.setRespOptions = function(uid, options){
		this.respList[uid] = options;
	};
	
	this.unsetRespOptions = function(uid){
		this.respList[uid] = null;
		
		delete this.respList[uid];
	};
	
	this.respSocket = function(resp, reqId, time){
        var options = this.respList[reqId];
        
		if( !options )
			return;
		
		timeMgr.syncTime(options.sendTime, time);
		
        this.processResp(resp, options, reqId);
        
        this.unsetRespOptions(reqId);
    };
	
	this.respWorker = function(resp, reqId){
        var options = this.respList[reqId];
		
        if( !options )
            return;
        
        this.processResp(resp, options, reqId);
        
        this.unsetRespOptions(reqId);
    };
	
    //обработка ответа
    this.processResp = function(resp, options, reqId){
        if ( resp && resp.error !== undefined && !utils.inArray(options.ignoreList, resp.error) && !options.ignoreAll) {
            var error = '';
			
			if ( resp.error == ErrorX.ids.WEnoLogin )
				this.logOut();
			else if ( options.err[resp.error] !== undefined ) {
				error = options.err[resp.error]; // Если пустая строка - алерт показан не будет
				
				error = error instanceof Function ? error(resp) : error;
            }
			else if( options.errDef )
				error = options.errDef;
			else
                error = tmplMgr.alert.def(resp.error);
			
			this.showAlert(error);
			
			if (options.callback.onFail)
				options.callback.onFail(resp, reqId);
        } else {
			if ( !options.noConvertData )
				this.convertData(resp, options);
        	
            if ( options.unpack )
            	resp = options.unpack(resp) || resp;
			
            if ( options.callback.onSuccess ) 
				options.callback.onSuccess(resp, reqId);
        }
		
		if ( options.callback.onOver ) 
			options.callback.onOver(resp, reqId);
    };
	
	this.updReqId = function(){
		this.reqId++;
	};
	
	this.getCurReqId = function(){
		return this.reqId;
	};
	
    this.initCallbacks = function(options) {
        if( options.callback instanceof Function )
        	options.callback = {onSuccess: options.callback};
        else if( options.callback instanceof Array ){
            options.callback = {
                onSuccess: options.callback[0],
                onFail: options.callback[1],
                onOver: options.callback[2]
            };
        }
        else
        	options.callback = options.callback||{};	
    };
    
    this.sendCrossDomain = function(command, params, options) {
        if (!options.domain)
            options.domain = lib.main.maindomain;
		
        $.getJSON(location.protocol + '//'+options.domain+'/'+command+'?'+utils.objToUrl(params), function(resp) {
            reqMgr.processResp(resp, options);
        });
    };
    
	this.showAlert = function(text){
		if( text )
			wndMgr.addAlert( text );
	};
	
	this.prepareRequestUrl = function(url){
		if( appl.environment.domain ){
			if( !this.isAbsoluteUrl(url) )
				url = appl.environment.domain + (url[0] == '/' ? '' : '/') + url;
		}
		
		return url;
	 };
	
	this.isAbsoluteUrl = function(url){
		 return /^(https|http)/.test(url);
	};
	
////КОНВЕРТАЦИЯ ДАННЫХ
	this.initBaseNames = function(){
		this.baseNames = {
			list: {
				towns: Town,
				accounts: Account,
				countries: Country,
				town: Town,//запросы aj_data
				account: Account,
				country: Country,
			},
			single: {
				town: Town,
				account: Account,
				country: Country,
			},
		};
	};
	
	this.convertData = function(data, options){		
		var baseNames = this.getConvertNames(options);
		
		//массив, в который будем складывать все данные по типам
		var refArrays = {accounts: {}, countries: {}, towns: {}};
		
		//конвертация данных
		this.convertBaseData(data, baseNames, refArrays);
		
		//дополнительная нестандартная конвертация
		if( options.addConvert )
			options.addConvert(data);
		
		if( wofh.world )
			wofh.world.updateLinks(refArrays);
		
		//объединение данных по ссылкам
		BaseItem.joinData(refArrays);
		
		this.joinConvertedData(data, refArrays, baseNames);
	};
	//собираем массив названий параметров для конвертации
    this.getConvertNames = function(options){
    	return options.baseNames||utils.clone(this.baseNames);
    };
    //преобразует страны, аккаунты и города в объекты
    this.convertBaseData = function(data, baseNames, refArrays){
		for (var param in data) {
			if( !data.hasOwnProperty(param) )
				continue;
			
			var parData = data[param];
			
			if( parData == null ){
				//массивы всегда должны быть массивами
				if( baseNames.list[param] )
					data[param] = {};
				
				continue;
			}
			
			if( parData instanceof Object )
				this.convertBaseData(parData, baseNames, refArrays);	

			if( parData instanceof Town || parData instanceof Account || parData instanceof Country )
				continue;
			
			var cls = baseNames.single[param];
			
			if( cls ){
				if (parData.id || parData.name || (typeof(parData[0]) == 'string' || typeof(parData[0]) == 'number')) {
					data[param] = new cls().parse(parData);
					
					this.addElemToRef(data[param], refArrays);
					
					continue;
				}
			}
			
			cls = baseNames.list[param];
			
			if( cls ){
				if( parData instanceof Object ){
					for (var id in parData) {
						var elemRaw = parData[id];
						
						if( !(elemRaw instanceof Object) )
							continue;
						
						//массив обычных данных
						if( utils.isArray(elemRaw) )
							var elem = new cls().parseIdData(id, elemRaw);
						else{
							//массив расширенных данных	
							if (elemRaw.data || elemRaw.main) {
								var elem = new cls().parseIdData(id, elemRaw.data || elemRaw.main);
								
								delete elemRaw.data;
								
								elem.extend(elemRaw);
							} 
							else
								var elem = new cls().parseIdData(id, elemRaw);
						}
						
						parData[id] = elem;
						
						this.addElemToRef(elem, refArrays);
					}
				}
			}
		}
    };
	
    this.addElemToRef = function(elem, ref){
		if( wofh.world )
			wofh.world.addElem(elem);
		
    	var list,
			worldList;
		
		if( elem instanceof Town ){
			list = ref.towns;
			
			worldList = (wofh.world||{}).towns;
		}
		
		if( elem instanceof Account ){
			list = ref.accounts;
			
			worldList = (wofh.world||{}).accounts;
		}
		
		if( elem instanceof Country ){
			list = ref.countries;
			
			worldList = (wofh.world||{}).countries;
		}
		
		if( worldList && worldList[elem.id] )
			elem.extend(worldList[elem.id]);
		
		list[elem.id] = elem;
    };
	
    //заменяет коды данных на сами данные
    /*
    	data-объект с данными
    	baseNames-объект для преобразования
    */
    this.joinConvertedData = function(data, ref, baseNames){
		for (var param in data) {
			if( !data.hasOwnProperty(param) )
				continue;

			var parData = data[param];

			if( parData instanceof BaseItem )
				continue;

			var cls = baseNames.single[param];
			
			if( cls && typeof(parData) == 'number' ){
				if( !wofh || !wofh.world )
					return;
				
				var list = wofh.world.getListByCls(cls, parData),
					id = BaseAccOrCountry.clearId(parData),
					obj = ref[list][id];
				
				if( obj )
					data[param] = obj;
			}
			else if( typeof(parData) == 'object' ) // instanceof Object - нельзя т.к. у функции (класса) вернёться true (произайдёт зацикливание). typeof(parData) == 'object' в таком случае вернёт false.
				this.joinConvertedData(parData, ref, baseNames);
		}
    };
	
////КОНВЕРТАЦИЯ ДАННЫХ
	
	this.getSocketInitData = function(callback){
		var req = utils.urlToObj();
		
        this.send('aj_socketdata', req, {callback: callback, iface: 'ajax', method: 'GET'});
	};
	
	this.getInitData = function(callback){
		var req = {};

        this.send('aj_initdata', req, {callback: callback})
	}

	this.getRequestHistory = function(accId, page, callback){
    	var req = {};

    	req.id = accId;
    	if (page) {
    		req.p = page;
    	}

        this.send('aj_history', req, {unpack: function(resp){
            for (var row in resp.list) {
            	var rowRaw = resp.list[row];
            	var row = resp.list[row] = {};
            	
                row.date = rowRaw[0];
                row.time = rowRaw[1];
                row.town = rowRaw[2];
                row.ip = rowRaw[3];
                row.req = rowRaw[5];
                row.post = rowRaw[6];
            }
        }, callback: callback});
	};

    this.setLanguage = function(lang, callback){
    	var req = {};

    	req.lang = lang;

        this.send('aj_language', req, {callback: callback});
	}
    //получить подарунок от демоорка
    this.getGift = function(messageId, days, key, callback){
    	var req = {};

    	req.id = messageId;
    	req.d = days;
    	req.key = key;

        this.send('aj_gift', req, {callback: callback});
    }
    
    this.getCountryTowns = function(callback) {
        this.send('aj_countrytowns', {}, {unpack: function(resp){
            for (var town in resp) {
                resp[town] = {id: town, pos: {x: resp[town][0], y: resp[town][1]}};
            }
        }, callback: callback});        
    };
	
	this.setTownBudget = function (slots, autoinc) {
		var req = this.addTown();
		
		var data = {};
		for (var slot in slots){
			slot = slots[slot];
			for (var res in slot.pop.getList()) {
				
				res = slot.pop.getElem(res);
				
				if (!data[slot.getPos()]) {
					data[slot.getPos()] = {};
				}
				
				data[slot.getPos()][res.getId()] = res.getCount();
			}
		}
		
        req.data = JSON.stringify({
            work: data,
            auto: autoinc,
        });
		
		
        this.send('aj_work', req)
	}
	
	this.renameTown = function (town, name, callback) {
		var req = {};
		req.town = town;        
		req.name = name;
        
		var err = {};;
        err[ErrorX.ids.WEbadCharacter] = 'В тексте присутствует недопустимый символ, а, быть может, даже несколько.';
		
        this.send('aj_rename', req, {err: err, callback: callback});
	};
	
	this.slotBuy = function(slot, callback){
		var req = {};
        req.pos = slot.getPos();
        req.town = slot.town.id;
		
        this.send('aj_buyslot', req, {callback: callback});
	}
	
	this.swapSlots = function(townId, slot1, slot2, callback){
		var req = this.addTown(false, townId);
        req.slot1 = slot1;
        req.slot2 = slot2;
		
        this.send('aj_swapslots', req, {callback: callback});
	};
	// Установка науки
    this.chooseScience = function(scienceId, pos){
        var req = {}
        req.science = scienceId;
        req.pos = pos;
                
        this.send('aj_choosescience', req);
	};
    
	this.getSpecialists = function(callback){
        var req = {};
        
		this.send('aj_data?specialists', req, {callback: callback});
	};
    
	this.setSpecialist = function(town, spec, callback){
        var req = {};
		req.town = town;
		req.spec = spec;
		
        this.send('aj_usespecialist', req, {callback: callback});
	};
	//ускорение события
	this.eventImm = function(event, callback){
		var req = this.addTown();
        req.id = event.getId();
        req.town = event.getTown1();
		
        this.send('aj_immediate', req, {callback: callback});
	};
    
	this.eventDel = function(event, callback){
		var req = this.addTown();
        req.id = event.getId();
		
        this.send('aj_movecancel', req, {callback: callback});
    };
	//ускорение в очереди
	this.buildQueueImm = function(town, callback){
		var req = this.addTown(false, town);
		
        this.send('aj_immediateb', req, {callback: callback});
	};
	// Отмена строительства в очереди
	this.buildQueueCancel = function(pos, town, callback){
		var req = {q: pos};
		
		this.addTown(req, town);
		
        this.send('aj_cancel', req, {callback: callback});
	};
	
	this.clickClickers = function(data, town) {
        var req = {data: data, town: town};
        
        this.send('aj_click', req);
        //set.town.clickers(data, town);
	};
	//поставить тренировку
	this.trainAdd = function (town, pos, unit, count, fromunit, callback) {
        var req = {};
		req.town = town; 
        req.pos = pos; 
        req.unit = unit.getId();
        req.count = count;
        if (fromunit) {
            req.fromunit = fromunit.getId();
        }
		
        this.send('aj_train', req, {callback: callback});
	};
	//отмена тренировки: событие, позиция тренировки
	this.trainDel = function(event, trainPos) {
		var req = {town: event.getTown2(), pos: event.getSlot(), q: trainPos}
		req = this.addTown(req);
		
        this.send('aj_traincancel', req);
	};
    
    this.trainTakeAway = function(town){
        var req = {};
        req.town = Element.getId(town);
        
        this.send('aj_takeaway', req, {method: 'GET'});
    };
	
	this.slotBuild = function(slot, buildId, lvl20, callback) {
		var req = {};
        req.town = slot.getTown().id;
        req.pos = slot.getPos();
        req.id = buildId !== undefined && buildId !== false ? buildId : slot.getId();
        if( lvl20 ) req.lvl20 = 1;
		
        this.send('aj_buildup', req, {callback: callback, ignoreListAdd: [ErrorX.ids.WElimit]});
	};
	
	this.slotDestroy = function(slot, oneLevel, callback) {
		var req = {
            town: slot.getTown().id,
            pos: slot.getPos(),
        }
        if (oneLevel) {
            req.onelevel = 1;
        }
		
        this.send('aj_destroy', req, {callback: callback});
	}
	
	this.slotRebuild = function(slot, callback) {
		var req = {
            town: slot.getTown().id,
            pos: slot.getPos()
        };
		
        this.send('aj_rebuild', req, {callback: callback});
	};
	
	this.slotSwitch = function(slot, active) {
		var req = this.addTown({}, slot.getTown());
        
		req.pos = slot.getPos();
		req[active? 'on': 'off'] = true;
		
        this.send('aj_switch', req);
	};
	
	this.questGetPrize = function(quest, callback) {
		var req = this.addTown();
		req.q = quest.getId();
        
        
        this.send('aj_getprize', req, {ignoreListAdd: [ErrorX.ids.WEnoDataInBd], callback: callback});
	};
    
	this.questComplete = function(quest) {
        //дополнительные проверки админа и готовности квеста
        if(!quest.isStatusActive() || wofh.account.isAdmin()){
            return;
        }
        quest.setStatus(Quest.status.done);
        
		var req = this.addTown();
		req.id = quest.getId();
        
        this.send('aj_questdone', req);
    };
	
	this.getWondersList = function(wonderId, area, town, callback){
		var req = this.addTown(false, town);
		
		req.w = wonderId;
		
		if(area) req.c = 1;
		
		req.all = 1;
        
        this.send('aj_wonder', req, {method: 'GET', unpack: function(resp){
			var list = [];
			
			resp = resp||{};
			
			for (var item in resp.list){
				item = resp.list[item];
				
				if( item.twn == town.id )
					continue;
				
				var slot = new Slot(item.id === undefined ? wonderId : item.id, item.level);
				
				slot.launch = item.launch;
				slot.active = slot.level > lib.build.maxlevel;
				slot.town = wofh.world.towns[item.twn];
				
				list.push(slot);
			}
			
			return list;
        }, callback: callback});
	};
	
	this.createCountry = function(name, callback){
		var req = {name: name};
        
        var err = {};
        err[ErrorX.ids.WEbadName] = 'Имя уже занято';
        
        if (name.length < lib.country.namelimit[0] || name.length > lib.country.namelimit[1]) return;//Должно быть какое либо сообщение об ошибке
        
        this.send('aj_createcountry', req, {callback: function(resp){
			set.acc.channelCountry(resp.data.chat.country);
			
			if( callback ) callback();
		}, err: err});
	};
    
	this.countrySetDiplomacy = function(countryId, diplomacy, callback){
		var req = {};
		req.c = countryId;
		req.d = diplomacy;
		
		var err = {};
        err[ErrorX.ids.WElimit] = 'Достигнут допустимый предел союзников и врагов. Может стоит быть чуть разборчивей?';
		
        this.send('aj_setdiplomacy', req, {err: err, callback: callback});
	};
	
	this.setMission = function(text, callback){
		var req = {};
		req.text = text;
		
        this.send('aj_setmission', req, {callback: callback});
	};
	
	/*
	Изменение приоритета потребления пищи
	data - массив ресурсов отсортированных по приоритету потребления
	*/
	this.setFoodPriority = function(data, callback){
		var req = this.addTown();
		
		for( var i = 0; i < data.length; i++ ) {
			req['r'+(i+1)] = data[i];
        }
		
        this.send('aj_foodpriority', req, {callback: callback});
	};
	/*
	Изменение эффекта потребления ресурсов
	data - объект содержащий список растишек
	*/
	this.setResConsumption_form = function(dataReq, callback, town){
		var req = dataReq;
		
		req = this.addTown(req, town);
		
        this.send('aj_consumption', req, {callback: callback});
	};

	this.resConsumption = function(list, callback, town){
		var reqData = {};
		
		for (var elem in list){
			reqData['r'+list[elem].id] = 1;
		}
		
        this.setResConsumption_form(reqData, callback, town);
	};
    
	this.armyCommanderCreate = function(act, target, time, newbattlesystem, callback){
        var req = {
			act: act,
			town: target,
			time: time
		};
		
		if( newbattlesystem )
			req.newbattlesystem = newbattlesystem;
        
        var err = {};
        err[ErrorX.ids.WElimit] = 'Достигнут предел числа действующих военных операций';
        
        this.send('aj_commander', req, {err: err, ignoreListAdd: [ErrorX.ids.WEbadTime], callback: callback});
    };
	
    this.armyCommanderInfo = function(eventId, eventKey, callback){
        var req = {
            id: eventId,
            key: eventKey,
        }
        
        this.send('aj_commander?info', req, {method: 'GET', callback: callback});
    }
	
    this.armyCommanderAssign = function(eventId, eventKey){
        var req = {
            id: eventId,
            key: eventKey,
        }
        
        this.send('aj_commander?join', req);
    };
    
    this.armyCommanderDrop = function(eventId, groupId, callback){
        var req = {
            id: eventId,
			groupid: groupId
        };
        
        this.send('aj_commander?drop', req, {callback: callback});
    };
	
    this.armyJoinGroup = function(reinfArray, groupId, groupKey, callback){
        var req = {};
        
		req.defs = JSON.stringify(reinfArray);
		req.groupid = groupId;
		if( groupKey !== undefined )
			req.key = groupKey;
		
        this.send('aj_joinbattlegroup', req, {callback: callback});  
    };
	
	this.armyJoinToBattle = function(groupId, callback){
        var req = {};
        
		req.group = groupId;
		
		var err = {};
		err[ErrorX.ids.WEbadState] = 'К этому бою присоединиться на данный момент нельзя';
		
        this.send('aj_jointobattle', req, {err:err, callback: callback});
    };
	
	// Заменяет armyWithdrawReinf
	this.sendBack = function(id, army, byspeed, callback){
        var req = {};
        
		req.id = id;
		req.army = army.toString();
		if( byspeed )
			req.byspeed = byspeed;
		
		var err = {};
		err[ErrorX.ids.WE14] = 'Город под атакой. Нельзя отозвать войска.';
		err[ErrorX.ids.WEbadArmy] = 'Невозможно отозвать компоненты Космического Корабля из города с построенным космодромом';
		
        this.send('aj_sendback', req, {err:err, callback: callback});
    };
	
	this.sendBackAll = function(town, byspeed, callback){
        var req = {};
        
		req.town = town;
		if( byspeed )
			req.byspeed = byspeed;
		
        this.send('aj_sendbackall', req, {callback: callback});
    };
	
	this.armyDismiss = function(army, callback){
		var req = this.addTown();
        
		req.army = army.toString();
		
        this.send('aj_dismiss', req, {callback: callback});
    };
	
	this.getBufferData = function(callback){
        var req = {};
		req.storeddata = true;
		
        this.send('aj_data', req, {method: 'GET', unpack: function(resp){
            return resp && resp.storeddata ? reqMgr.getBufferData.parse(resp.storeddata) : {};
        }, callback: callback});
    };
	
        this.getBufferData.parse = function(storeddata){
            try{
                return JSON.parse(storeddata);
            }
            catch(e){
                return reqMgr.getBufferData.tryToRestore(storeddata, e);;
            }
        };
        
        this.getBufferData.tryToRestore = function(storeddata, e){
            var simbols = {'{': '༃', '}': '༂', '[': '༇', ']': '༈', ',': '༉', '\"': '༎'},
                simbolsRev = {'༃': '{', '༂': '}', '༇': '[', '༈': ']', '༉': ',', '༎': '\\"'},
                regExpRev = new RegExp('[' + Object.values(simbols).join('') + ']', 'g'),
                depth = 0,
                servBufferArr = [];
                
            storeddata
                .replace(/(^{)|(}$)/g, '') // Убираем фигурки в конце и начале строки
                .replace(/\\"/g, simbols['\"']) // Переопределяем экранированные кавычки
                .replace(/".*?"/g, function(match){ // Ищем всё, что в кавычках
                    return match.replace(/[}{\]\[]/g, function(match){ // Переопределяем фигурные и квадратные скобки внутри кавычек
                        return simbols[match];
                    });
                })
                .replace(/[{}]/g, function(match){ // Переопределяем фигурные скобки с учётом вложенности (не переопределяем верхний уровень)
                    if( match == '{' ){
                        ++depth;

                        return depth > 1 ? simbols[match] : match;
                    }
                    else{
                        --depth;

                        return depth > 0 ? simbols[match] : match;    
                    }
                })
                .replace(/{.*?}/g, function(match){ // Выделяем всё, что находится в оставшихся фигурных скобках
                    return match.replace(/[\]\[,]/g, function(match){ // Переопределяем запятые внутри фигурных скобок
                        return simbols[match];
                    });
                })
                .replace(/[\[\]]/g, function(match){ // Переопределяем квадратные скобки с учётом вложенности (не переопределяем верхний уровень)
                    if( match == '[' ){
                        ++depth;

                        return depth > 1 ? simbols[match] : match;
                    }
                    else{
                        --depth;

                        return depth > 0 ? simbols[match] : match;    
                    }
                })
                .replace(/[.*?]/g, function(match){ // Выделяем всё, что находится в оставшихся квадратных скобках
                    return match.replace(/[,]/g, function(match){ // Переопределяем запятые внутри фигурных скобок
                        return simbols[match];
                    });
                })
                .split(',') // Разбиваем по оставшимся запятым (получаем верхний уровень обьекта)
                .forEach(function(val){
                    if( !ServBufferMgr.sections[((val||'').match(new RegExp('^"([^"]+)"'))||[])[1]] )
                        return;
                    
                    try{
                        val = val.replace(regExpRev, function(match){
                            return simbolsRev[match];
                        });
                        
                        JSON.parse('{' + val + '}');
                    }
                    catch(e){
                        console.warn(val);            
                        
                        return;
                    }

                    servBufferArr.push(val);
                });
            
            try{
                return JSON.parse('{' + servBufferArr.join(',') + '}');
            }
            catch(e){
                return {}; // Если не удалось всстановить данные, возвращаем пустой обьект
            }
            finally{
                setTimeout(function(){
                    throw e; // Сигналим, что была проблема в данных серверного хранилища
                }, 100); // Чтобы страница не падала
            }
        };
        
	this.setBufferData = function(data, callback){
        var req = {};
		
		req.data = JSON.stringify(data);
		
        this.send('aj_storedata', req, {callback: callback});
    };
	
	this.setTactic = function(groupid, tacticData, callback){
        var req = {};
        
		req.groupid = groupid;
		req.data = JSON.stringify(tacticData);
		
		var err = {};
		err[ErrorX.ids.WEbadTime] = 'Тактику можно выставить за 4 часа до прихода войск при наличии боя в городе.';
		
        this.send('aj_tactics', req, {err:err, callback: callback});
    };
	
	this.stream = function(t2, res, count, cost, fuel, wayType, callback){
		var req = this.addTown();
		req.t2 = t2;
        req.res = res;
		req.count = count;
		req.cost = cost;
		if( fuel )
			req.fuel = fuel;
		req.wayType = wayType;
		
		var err = {};
		err[ErrorX.ids.WEnoMoney] = 'Покупатель не может оплатить';
		err[ErrorX.ids.WEnoResources] = 'Не хватает ресурсов для залога';
		err[ErrorX.ids.WEnoTraders] = 'Не хватает торговцев';
		err[ErrorX.ids.WElimit] = 'Превышен лимит открытых предложений этому городу';
		
		this.send('aj_stream', req, {err: err, callback: callback});
	};
	//Сделать приглашение в страну
	this.invite = function(id, callback){
		var req = {id: id};
		
        var err = {};
        err[ErrorX.ids.WElimit] = 'Недостаточно очков дипломатии';
        
		this.send('aj_invite', req, {err: err, callback: callback});
	};
	// Исключить игрока из состава страны
	this.exclude = function(id, callback, account){
		var req = {id: id};
		
		var err = {};
		err[ErrorX.ids.WEnoAccess] = snip.countryExcludeError.bind(this, {account:account});
		
		this.send('aj_exclude', req, {err:err, callback: callback});
	};
	// Отменить приглашение в страну со стороны страны
	this.uninvite = function(id, callback){
		var req = {id: id};

		this.send('aj_uninvite', req, {callback: callback});
	};
	
	this.sendMoney = function(money, player, callback){
		var req = {};
		req.money = money;
		req.player = player;
		
		this.send('aj_sendmoney', req, {callback: callback});
	};
	
	this.storeAccountNote = function(account, text, callback){
		var req = {};
		req.account = account;
		req.text = text;
		
		this.send('aj_storeaccountnote', req, {callback: callback});
	};
	
	this.getAccountNote = function(account, callback){
		var req = {};
		req.account = account;
		
		this.send('aj_accountnote', req, {method: 'GET', callback: callback});
	};
	// Отменить приглашение в страну со стороны игрока-получателя письма
	this.rejectInvitation = function(countryId, callback){
		var req = {id: countryId};

		this.send('aj_delinvite', req, {callback: callback});
	}
	
	this.setTimeZone = function(timezone, callback){
		servBuffer.temp.options.timeZone = timezone;
		servBuffer.apply(function(){if(callback) callback();});
	};
	
	this.delAcc = function(password, callback){
		var req = {delpass:password};
		
		var err = {};
		err[ErrorX.ids.WEnoAccess] = 'Нельзя удалить, не установлен e-mail';
		err[ErrorX.ids.WEbadPassword] = 'Неправильно указан пароль';
		err[ErrorX.ids.WElimit] = 'Отказано. Повторите попытку завтра';
		
		this.send('aj_delacc', req, {
			err: err,
			callback: callback
		});
	};
	
	this.clearAssist = function(callback){
		this.setAssist(0, callback);
	};
	
	this.setAssist = function(id, callback){
		var req = {};
		req.account = id;
		
		var err = {};
		err[ErrorX.ids.WEalreadyUsed] = 'Нельзя включить заместительство на столь короткий срок. Необходимо хотя бы ' + (lib.account.assistmin / (24 * 3600)) + ' дн.'; // не достаточно дней заместительства
		err[ErrorX.ids.WEbadAccount] = 'Такого игрока не существует.<br>Убедись, что имя указано верно';
		
		this.send('aj_setassistant', req, {
			err: err,
			callback: callback
		});
	};
	
	this.getAssistantKey = function(id, callback){
		var req = {};
		req.acc = id;
		
		this.send('aj_getassistantkey', req, {callback: callback});
	};
	
	this.setAccText = function(text, callback){
		var req = {};
		req.text = text;
		
		var err = {};
		err[ErrorX.ids.WEbadData] = 'Недопустимая ссылка в тексте о себе'; // недопустимая ссылка в тексте

		this.send('aj_setacctext', req, {
			err: err,
			callback: callback
		});
	};
	
	this.setDelRep = function(repList, callback){
		var req = {};
		for( var rep in repList ){
			req[rep] = repList[rep];
		}
		
		this.send('aj_setdelrep', req, {
			callback: callback
		});
	};
	
	this.setPassword = function(lastpass, newpass, callback){
		var req = {};
		req.lastpass = lastpass;
		req.newpass = newpass;

		var err = {};
		err[ErrorX.ids.WEbadPassword] = 'Неправильная длина пароля'; // недопустимый размер пароля
		err[ErrorX.ids.WEnoAccess] = 'Старый пароль указан неверно'; // неправильный старый пароль
		
		this.send('aj_newpassword', req, {
			err: err,
			callback: callback
		});
	};
	
	this.setEmail = function(email, callback){
		var req = {};
		req.email = utils.escapeHtml(email);

		var err = {};
		err[ErrorX.ids.WEbadEmail] = 'E-mail указан некорректно'; // некорректная почта
		err[ErrorX.ids.WEusedEmail] = 'Данный e-mail уже используется на другом аккаунте'; // почта уже используется
		err[ErrorX.ids.WElimit] = 'Отказано. Повторите попытку завтра'; // достигнут предел отправленных писем
		err[ErrorX.ids.WEbadState] = 'Превышена частота попыток установки e-mail. Повтори попытку позже.';

		
		this.send('aj_chooseemail', req, {
			err: err,
			callback: callback
		});
	};
	
	this.getPlayerIdByName = function(name, callback){
		var req = {};
		req.name = name;
		
		this.send('aj_playerid', req, {method: 'GET', callback: callback});
	};
	
	this.getAnnounceData = function(callback){
        var req = {};
		//req = this.addNA(req);
		
        this.send('aj_announce', req, {method: 'GET', callback: callback});
    };
	
	this.addAccBonus = function(type, act, callback){
        var req = {};
		req.type = type;
		req.act = act;
		
        this.send('aj_bonusact', req, {callback: callback});
    };
	
	this.selectAccSpecialist = function(type, callback){
        var req = {};
		req.type = type;
		
        this.send('aj_bonusact?specialist', req, {callback: callback});
    };
	
	this.accountRename = function(name, password, callback){
        var req = {};
		req.name = name;
		req.password = password;
		
		var err = {};
        err[ErrorX.ids.WEbadPassword] = 'Неправильный пароль';
		err[ErrorX.ids.WEalreadyUsed] = 'Это имя уже занято';
		
        this.send('aj_bonusact?rename', req, {err:err, callback: callback});
    };
    
	this.addBonus = function(type, act, town, callback, effect){
        var req = {};
		req.type = type;
		req.act = act;
		req.data = effect;
        if (typeof(town) != 'undefined') {
            req.town = town;
        }

		var err = {};
        err[ErrorX.ids.WEnoResources] = 'Использовать мгновенный бонус не удалось.<br>Попробуй чуть позже.';
        err[ErrorX.ids.WEnoLuck] = tmplMgr.snipet.noCoins;
		
        this.send('aj_bonusact', req, {err:err, callback: callback});
    };
    
	this.coinsTransfer = function(name, count, callback){
        var req = {};
		req.name = name;
		req.sum = count;
		
		var err = {};
		err[ErrorX.ids.WEnoAccess] = 'Нельзя произвести перевод Монет Удачи между вашими аккаунтами';
		err[ErrorX.ids.WEbadName] = 'Ошибка в имени друга. Убедись, что все корректно.';
		err[ErrorX.ids.WElimit] = 'Превышена частота попыток, попробуй позже';
		       
        this.send('aj_bonusact?take', req, {err: err, callback: callback});
    };
	
	this.announcePublic = function(icon, luck, text, callback){
        var req = {};
		req.icon = icon;
		req.luck = luck;
		req.text = text;
		
		//this.addNA(req);
		
        this.send('aj_announcepublic', req, {callback: callback, ignoreAll: true});
    };
	
	this.announceDel = function(id, callback){
        var req = {};
		req.id = id;
		
        this.send('aj_announcedel', req, {callback: callback});
    };
	
	this.announceProlong = function(id, luck, callback){
        var req = {};
		req.id = id;
		req.luck = luck;
		
        this.send('aj_announceprolong', req, {callback: callback, ignoreAll: true});
    };

    this.openChest = function(callback) {
        var req = {};
		
		var err = {}
		err[ErrorX.ids.WEbadState] = '';
		
        this.send('aj_usedayprize', req, {err: err, callback: callback});
    };

    this.getReports = function(disp, showArchived, filter, callback) {
        var req = this.addTown();

        req.n = disp||0;
        if (showArchived) {
        	req.archive = showArchived;	
        }
        req.filter = filter;
		
		var baseNames = utils.clone(this.baseNames);
		
		baseNames.single.town1 = Town;
		baseNames.single.town2 = Town;
		baseNames.single.owner = Account;
		baseNames.single.townowner = Account;
		
		//отчёт о приглашениях
		baseNames.single.inviter = Account;
		
        this.send('aj_reports', req, {
        	method: 'GET', 
        	callback: callback, 
        	baseNames: baseNames,
			unpack: function(data){
				if( data ){
					for(var rep in data.reps){
						reqMgr.getReport.unpack(data.reps[rep]);
					}
				}
			}
		});
    };
	
    this.getReport = function(reportId, reportCode, noLogin, callback) {
        var req = {};
        req.id = reportId;
        if (reportCode) req.code = reportCode;
		
        this.send('aj_report' + (noLogin ? '_no_login' : ''), req, {
        	method: 'GET', 
        	callback: callback,
        	baseNames: this.getReport.getBaseNames(),
			unpack: function(report){
				reqMgr.getReport.unpack(report);
			}
		});
    };
		this.getReport.getBaseNames = function(){
			var baseNames = utils.clone(reqMgr.baseNames);
			
			baseNames.single.town1 = Town;
			baseNames.single.town2 = Town;
			baseNames.single.owner = Account;
			baseNames.single.townowner = Account;
			baseNames.single.inviter = Account; // Отчёт о приглашениях
			
			return baseNames;
		};
		
		this.getReport.unpack = function(report){
			if( report && Report.type.battleFull == report.type && report.data.townowner && report.town1.account.id == Account.barbarian.id ){
				report.town1.townowner = report.data.townowner;
			}
		};
	
	this.shareReport = function(id, open, ha, hd, haa, hda, callback) {
        var req = {};
		req.id = id;
		if( open ) req.open = open;
		if( ha ) req.ha = ha;
		if( hd ) req.hd = hd;
		if( haa ) req.haa = haa;
		if( hda ) req.hda = hda;
		
        this.send('aj_report?share', req, {callback: callback});
    };
	
    this.restoreReport = function(reportId, callback) {
        var req = {};
        req.id = reportId;
        
        this.send('aj_reportrestore', req, {method: 'GET', callback: callback});
    };
    
    this.deleteReports = function(all, filter, selected, callback) {
        var req = {};
        if( all ) req.all = all;
		if( filter ) req.filter = filter;
		if( selected ) req.data = JSON.stringify(selected);
		
        this.send('aj_delreports', req, {callback: callback});
    };
    
	this.deleteReport = function(reportId, callback) {
        var req = {};
        req.id = reportId;
        
        this.send('aj_delreport', req, {method: 'GET', callback: callback});
    }
	
    this.archiveReport = function(reportId, toggle, callback) {
        var req = {};
        req.id = reportId;
        req.archive = +toggle;
        
        this.send('aj_report', req, {method: 'GET', callback: callback});
    }
    
    this.markReportAsRead = function(id, callback){
        var req = {};
        req.ids = id;
        
        this.send('aj_report_read', req, {callback: callback});
    }
    //присоединиться к стране
    this.joinCountry = function(country, callback){
        var req = {};
        req.id = country.id;
        
        
        var err = {};
        err[ErrorX.ids.WEbadDistance] = 'Ближайший город '+snip.countryLink(country)+' находится на неразведанной территории или далее '+lib.country.joindistance+' полей от тебя.';
        err[ErrorX.ids.WElimit] = 'У '+snip.countryLink(country)+' недостаточно '+snip.icon(snip.c.anyIcon, 'diplomacyPoints')+'очков дипломатии для принятия еще одного члена.';
		err[ErrorX.ids.WEbadState] = 'В связи с ограничениями по космической программе, нельзя вступить в ' + snip.countryLink(country) + '.<br>' + 'Подробнее в ' + snip.pediaLink('win', 'Энциклопедии') + '.';
		err[ErrorX.ids.WEbadCountry] = 'Даже Великих Империй жизнь бывает скоротечна.<br>' + 'Так и здесь. Нет более той страны в которую ты пытаешься вступить.<br>' + 'Смирись и забудь...';
		err[ErrorX.ids.WEnoDataInBd] = 'Приглашение в ' + snip.countryLink(country) + ' было аннулировано.';
		if( wofh.country )
			err[ErrorX.ids.WEnoAccess] = tmplMgr.alert.leaveCountry();
		
        //TODO: добавить ошибки
        this.send('aj_join', req, {callback: callback, err: err});
    };
    
	this.supportOpen = function(topic, text, callback) {
        var req = {};
        req.topic = topic;
        req.text = text;
		
		var err = {};
		err[ErrorX.ids.WEbadCharacter] = 'В тексте присутствует недопустимый символ, а, быть может, даже несколько.';
		err[ErrorX.ids.WElimit] = 'Нельзя держать более ' + lib.ticket.maxopen + ' запросов открытыми';
		
        this.send('aj_support?open', req, {err: err, callback: callback});
    };
	
	this.supportAddTemplate = function(text, callback) {
        var req = {};
        req.text = text;
		
		var err = {};
		err[ErrorX.ids.WEbadCharacter] = 'В тексте присутствует недопустимый символ, а, быть может, даже несколько.';
		
        this.send('aj_support?addtemplate', req, {err:err, callback: callback});
    };
	
	this.supportDelTemplate = function(ttid, callback) {
        var req = {};
        req.ttid = ttid;
		
        this.send('aj_support?deltemplate', req, {callback: callback});
    };
	
	this.supportWrite = function(id, text, callback) {
        var req = {};
        req.id = id;
		req.text = text;
		
		var err = {};
		err[ErrorX.ids.WEbadCharacter] = 'В тексте присутствует недопустимый символ, а, быть может, даже несколько.';
		
        this.send('aj_support?write', req, {err:err, callback: callback});
    };
	
	this.supportDelMessage = function(id, tmid) {
        var req = {};
        req.id = id;
		req.tmid = tmid;
		
        this.send('aj_support?delmessage', req);
    };
	
	this.supportClose = function(id, callback) {
        var req = {};
        req.id = id;
		
		//this.addNA(req);
		
        this.send('aj_support?close', req, {callback: callback});
    };

	this.supportHold = function(ticketId, time, callback) {
        var req = {};
        req.id = ticketId;
        req.h = (time/3600).toFixed(3)
		
		//this.addNA(req);
		
        this.send('aj_support?hold', req, {callback: callback});
    };
	
	this.supportInfo = function(id, text, callback) {
        var req = {};
        req.id = id;
		req.text = text;
		
		var err = {};
		err[ErrorX.ids.WEbadCharacter] = 'В тексте присутствует недопустимый символ, а, быть может, даже несколько.';
		
        this.send('aj_support?info', req, {err:err, callback: callback});
    };
	
	this.supportRate = function(id, rate) {
        var req = {};
        req.id = id;
		req.rate = rate;
		
		//this.addNA(req);
		
        this.send('aj_support?rate', req);
    };
	
	this.getSupportDataList = function(p, callback) {
        var req = {};
		if( p ) req.p = p;
		
		this.addNA(req);
		
        this.send('aj_supportdata?list', req, {method: 'GET', callback: callback});
    };
	
	this.getSupportData = function(callback) {
        var req = {};
		
        this.send('aj_supportdata', req, {method: 'GET', callback: callback});
    };
	
	this.getTicketData = function(id, callback) {
        var req = {};
		req.id = id;
		
		this.addNA(req);
		
        this.send('aj_supportdata', req, {method: 'GET', callback: callback});
    };
	
	this.getTicketTemplates = function(callback) {
        var req = {};
		
        this.send('aj_supportdata?template', req, {method: 'GET', callback: callback});
    };
	
	this.depositMove = function(sum, callback) {
        var req = {};
        req.sum = sum;
		
		var err = {};
		err[ErrorX.ids.WEnoMoney] = sum > 0 ? 'В казне игрока недостаточно денег' : 'В казне страны недостаточно денег';
		
        this.send('aj_depositmove', req, {err:err, callback: callback});
    };
	
	this.creditMove = function(sum, callback) {
        var req = {};
        req.sum = sum;
		
		var err = {};
		err[ErrorX.ids.WEnoMoney] = sum > 0 ? 'В казне страны недостаточно денег' : 'В казне игрока недостаточно денег';
		err[ErrorX.ids.WEbadData] = sum > 0 ? 'Взять кредит не удалось' : 'Погасить кредит не удалось';
		
        this.send('aj_creditmove', req, {err:err, callback: callback});
    };
	
	this.moneyReserve = function(savemoney, callback) {
        var req = {};
        req.savemoney = savemoney;
		
        this.send('aj_moneyreserve', req, {errDef: 'Неправильно указан денежный резерв', callback: callback});
    };
	
	this.moneyMove = function(time, moneyup, callback) {
        var req = {};
        req.time = time;
		req.moneyup = moneyup;
		
        this.send('aj_moneymove', req, {method: 'GET', callback: callback});
    };

	this.getTransport = function(target, callback) {
        var req = {};
        req = this.addFrom(req);
        req.transport = target;
		
        this.send('aj_data', req, {method: 'GET', callback: callback});
	};
	
	this.getCountry = function(id, callback, opt) {
        var req = {};
        
		req = this.addFrom(req);
        
		req.country = id instanceof Array ? id.join(',') : id;
		
		opt = opt||{};
		
		if( opt.full ) req.full = opt.full;
		
		if( opt.alliesIds ) 
			this.getAllyInfo.packReq(req, opt.alliesIds);
		
		var baseNames = utils.clone(this.baseNames);
		
		delete baseNames.list.country;

        this.send('aj_data', req, {
        	method: 'GET', 
	        callback: callback,
        	baseNames: baseNames,
	        addConvert: function(resp){
	        	for (var countryId in resp.country) {
	        		var country = new Country(resp.country[countryId]);
	        		country.id = countryId;
					resp.country[countryId] = country;
	        	}
	        }
    	});
    };
	
	this.getMyCountryData = function(callback, opt) {
        var req = {};
		
		var baseNames = utils.clone(this.baseNames);
		
		delete baseNames.single.country;
		delete baseNames.list.country;
		
		opt = opt||{};
		
		opt.method = 'GET'; 
		opt.baseNames = baseNames;
		opt.addConvert = function(resp){
			// Проанализировать данную обработку. Возможно можно оптимизировать.
			var accounts = resp.country.accounts;
			
			delete resp.country.accounts;
			
			var invited = {};
			for (var inviteRaw in resp.country.invited){
				inviteRaw = resp.country.invited[inviteRaw];
				
				var invite = wofh.world.getAccount(inviteRaw.id).extend(inviteRaw);
				
				invited[invite.id] = invite;
			}
			resp.country.invited = invited;
			
			resp.country = wofh.world.getCountry(resp.country.id).extend(resp.country);
			resp.country.accounts = {};
			for (var account in accounts){
				account = accounts[account];
				
				resp.country.accounts[account.id] = wofh.world.getAccount(account.id).extend(account);
			}
		};
		opt.unpack = function(data){
			var accounts = data.country.accounts;
			
			for (var account in accounts){
				account = accounts[account];

				account.unpackMoney();
			}
		};
		opt.callback = callback;
		
        this.send('aj_mycountry', req, opt);
    };
	
	this.getCountryNotes = function(callback) {
        var req = this.addTown();
        req = this.addFrom(req);
		req.countrynotes = true;
        
        this.send('aj_data', req, {method: 'GET', callback: callback});
    };
	
	this.addCountryOrder = function(town, resList, text, group, callback) {
        var req = {};
        req.town = town;
		req.res = resList.toString();
		if( text )
			req.text = text;
		if( group )
			req.group = group;
        
        this.send('aj_orderadd', req, {callback: callback});
    };
	
	this.moderateCountryOrder = function(ids, status, callback) {
        var req = {};
		
		req.ids = ids instanceof Array ? ids.join(',') : ids;
        req.status = status;
		
        this.send('aj_ordermoderate', req, {callback: callback});
    };
	
	this.confirmCountryOrder = function(ids, callback) {
        this.moderateCountryOrder(ids, ResOrder.statusIds.confirmed, callback);
    };
	
	this.rejectCountryOrder = function(ids, callback) {
        this.moderateCountryOrder(ids, ResOrder.statusIds.rejected, callback);
    };
	
	this.closeCountryOrder = function(ids, callback) {
        this.moderateCountryOrder(ids, ResOrder.statusIds.closed, callback);
    };
	
	this.getCountryOrders = function(resbin, p, status, sort, accId, callback, from) {
        var req = this.addFrom(from);
		
		req.resbin = resbin;
		req.p = p||0;
		if( status !== undefined )
			req.status = status;
		if( !sort )
			sort = ResOrdersList.sort.no;
		req.sort = sort;
		if( accId )
			req.acc = accId;	
        
        this.send('aj_orders', req, {
			method: 'GET',
			unpack: function(resp){
				resp.list = new ResOrdersList(resp.list);
				
				return resp;
			}, 
			callback: callback
		});
    };
	
	this.setCountryOrdersAccess = function(resbin, callback) {
        var req = {};
		
		req.resbin = resbin;
        
        this.send('aj_ordersaccess', req, {callback:callback});
    }; 
	
	this.setPost = function(account, post, callback) {
        var req = {};
		req.account = Element.getId(account);
		req.post = post;
		
        this.send('aj_setpost', req, {callback: callback});
    };
	
	this.streamAccept = function(id, callback) {
        var req = {};
        req.id = id;
		
		var err = {};
		
		err[ErrorX.ids.WEnoMoney] = 'Покупатель не может оплатить';
		err[ErrorX.ids.WEnoResources] = 'Не хватает ресурсов для залога';
		err[ErrorX.ids.WEnoTraders] = 'Не хватает торговцев';
		err[ErrorX.ids.WElimit] = 'Превышен лимит открытых предложений этому городу';
		err[ErrorX.ids.WEnoDataInBd] = callback; // При данной ошибке (предложение уже было принято), вызываем функцию обработчик по умолчанию
		
        this.send('aj_streamaccept', req, {err: err, callback: callback});
    };

	this.getFlag = function(data, callback) {
        var req = data;
		
        this.send('aj_getflag', req, {method: 'GET', ignoreAll: true, callback: callback});
    };
	
	this.setFlag = function(data, callback) {
        var req = data;
		
        this.send('aj_setflag', req, {ignoreAll: true, callback: callback});
    };
	
	this.getAccount = function(id, callback, opt) {        
        var req = this.addFrom();

		this.getAccount.packReq(req, id);
		
		opt = opt||{};
		
		if( opt.full ) req.full = opt.full;
		
		if( opt.alliesIds ) 
			this.getAllyInfo.packReq(req, opt.alliesIds);
		
		var baseNames = utils.clone(this.baseNames);
		
		baseNames.list.townslist = Town;
		
        this.send('aj_data', req, {
			method: 'GET', 
			baseNames: baseNames, 
			addConvert: function(resp){
				//переносим power из страны в аккаунт
				for (var account in resp.account){
					account = resp.account[account];
					if (account.country) {
						account.power = account.country.power;
						
						// Дозаписываем недостающие данные
						if( !account.country.name && resp.countries )
							account.country.extend(resp.countries[account.country.id]);
					}
				}
			}, 
			callback: callback
		});
    };
		
		this.getAccount.packReq = function(req, accIds){
			req.account = accIds instanceof Array ? accIds.join(',') : accIds;
			
			return req;
		};
	
    this.sciencePrognosis = function(science, callback){
		var req = {s: science.getId()};
        
		this.send('aj_prognosis', req, {method: 'GET', callback: callback});
    };
	
	this.leaveCountry = function(callback){
		var req = {};
		
		var err = {};
        err[ErrorX.ids.WEnoAccess] = tmplMgr.alert.leaveCountry();
        
		this.send('aj_leavecountry', req, {err: err, callback: callback});
	};
    
	this.setMission = function(text, callback){
		var req = {};
		req.text = text;
        
		this.send('aj_setmission', req, {callback: callback});
	};
	 
    this.getCountryStatistics = function(countryId, callback){
		var req = {};
        
        req.country = countryId;
		
		this.send('aj_countrystatistics', req, {unpack: function(resp){
			//блоб страны
            resp.storeddata = resp.storeddata ? JSON.parse(resp.storeddata) : {};
            resp.storeddata.towns = resp.storeddata.towns||{};
            
            //пересчёт списка ресурсов
            if(resp.statistics){
                var cons = new ResList(resp.statistics.consumption);//потребл населением
                var dec = new ResList(resp.statistics.resdec);//армия
                var inc = new ResList(resp.statistics.resinc);//доход
                var fuel = new ResList(resp.statistics.fuel);//доход


                resp.resList = ResList.getAll();
                var resFood = resp.resList.getElem(Resource.ids.food);
                resFood.cons = 0;
                resFood.dec = 0;
                resFood.inc = 0;

                for (var resId in resp.resList.getList()) {
                    var res = resp.resList.getElem(resId);
                    res.cons = cons.getCount(resId);
                    res.dec = dec.getCount(resId);
                    res.inc = inc.getCount(resId);
                    res.fuel = fuel.getCount(resId);


                    if (!res.cons && !res.dec && !res.inc && resId != Resource.ids.food) {
                        resp.resList.delElem(resId);
                    }

                    if (res.isGrown()) {
                        resFood.cons += ~~res.cons;
                        resFood.dec += ~~res.dec;
                        resFood.inc += ~~res.inc;
                    }
                }
            }
            
            //пересчёт городов
            resp.accounts = {};
			resp.towns = resp.townslist;
		    
            for (var townId in resp.towns){
                var town = new Town(resp.towns[townId]);
                resp.towns[townId] = town;
                resp.accounts[town.account.id] = town.account;
                var storeddtown = resp.storeddata.towns[town.id] || {};
                
                town.control = storeddtown.control || false;
                town.comment = storeddtown.comment || '';
                town.spec = storeddtown.spec || 0;
            }
            
            //пересчёт статистики
            for (var snapshot in resp.history) {
                snapshot = resp.history[snapshot];
				
                snapshot.army = new Army(snapshot.army);
				
                snapshot.resinc = new ResList(snapshot.resinc);
            }
            
            if(resp.towns)
                resp.towns = utils.arrToObj(resp.towns);
			
			return resp;
        }, callback: callback});
	};
    
	this.setCountryData = function(data){
		var req = {};
		req.data = JSON.stringify(data);
		
		this.send('aj_storecountrydata', req, {
		});
	};
	
	this.countryRename = function(name, callback){
		var req = {};
		req.name = name;
        
		var err = {};
        err[ErrorX.ids.WEbadName] = 'Это название уже занято. Прояви фантазию. Попробуй что-то иное.';
		
        if (name.length < lib.country.namelimit[0] || name.length > lib.country.namelimit[1]) return;//Должно быть какое либо сообщение об ошибке
		
		this.send('aj_countryrename', req, {err: err, callback:callback});
	};
	
	this.countryDescription = function(text, callback){
		var req = {};
		
		req.text = text;
		
		this.send('aj_description', req, {callback: callback});
	};
	
	this.leaderVote = function(id, callback){
		var req = {};
		
		req.id = id;
		
		this.send('aj_leadervote', req, {callback: callback});
	};
	
	this.subsidy = function(player, sum, text, callback){
		var req = {};
		
		req.player = Element.getId(player);
		req.sum = sum;
		req.text = text;

		var err = {};
		err[ErrorX.ids.WEnoMoney] = 'Субсидия не была выдана. Запрашиваемая сумма выше доступных средств в казне страны.';
		
		this.send('aj_subsidy', req, {err: err, callback: callback});
	};
	
	this.getTileData = function(mappost, path, town, callback, route) {
        var req = this.addFrom();

        if (mappost) req.mappost = JSON.stringify(mappost);
        if (path) req.path_ = JSON.stringify(path);
		if (town) req.town = town;
		if( route !== undefined ) req.route = route;
		
        this.send('aj_data', req, {method: 'GET', callback: callback});
    };
	
	this.login = function(login, password, key, callback){
		var req = {};
		req.login = utils.unescapeHtml(login);
		req.password = password;
		req.key = key;
		
		var err = {};
		err[ErrorX.ids.WEnoAccess] = tmplMgr.alert.login;
		
		this.send('aj_login', req, {err:err, callback: callback});
	};
	
	this.buildEnv = function(dx, dy, type, level, callback){
		var req = this.addTown();
		req.dx = dx;
		req.dy = dy;
		req.type = type;
		req.l = level;
		
		var err = {};
		err[ErrorX.ids.WEbadPlace] = function(){
			wndMgr.show();
		};
		
		this.send('aj_env', req, {err:err, callback: callback});
	};
    
	this.buildRoad = function(dx, dy, dir, callback){
		var req = this.addTown();
		req.dx = dx;
		req.dy = dy;
		req.dir = dir;
		
		this.send('aj_road', req, {ignoreListAdd: [ErrorX.ids.WEnotResearched], callback: callback});
	};
    
	this.postMessage = function(o, x, y, text, callback){
		var req = this.addTown();
		req.o = o;
		req.x = x;
		req.y = y;
		req.text = text;
		
		this.send('aj_postmessage', req, {callback: callback});
	};
	
	this.townArmyHistory = function(town, callback){
		var req = {};
		req.town = town;
		
		this.send('aj_townarmyhistory', req, {callback: callback});
	};
	
	this.getTownAttacks = function(town, callback){
		var req = {};
		req.town = town;
		
		this.send('aj_townattacks', req, {
			method: 'GET',
			callback: callback
		});
	};
	
    //принимает объект города, ид, список ид
	this.getTown = function(town, callback, opt){
		var req = {};
		
        req = this.addFrom(req);
		req = this.addNA(req);
		
		req.town = town instanceof Array ? town.join(',') : town;
        req.town = Element.getId(req.town);
		
		var baseNames = utils.clone(this.baseNames);
		
		delete baseNames.single.town;
		delete baseNames.list.town;
		
		opt = opt||{};
		
		opt.method = 'GET';
		opt.baseNames = baseNames;
		opt.addConvert = function(resp){
			for (var townId in resp.town){
				var town = new Town(resp.town[townId]);
				town.account = resp.accounts[town.account.id||town.account];
				resp.town[townId] = town;
			}
		};
		opt.callback = callback;
		
		this.send('aj_data', req, opt);
	};
	
	this.newTown = function(dx, dy, callback){
		var req = this.addTown();
		req.dx = dx;
		req.dy = dy;
		
		var err = {};
		err[ErrorX.ids.WEbadPlace] = function(){
			wndMgr.show();
		};
		err[ErrorX.ids.WEnoArmy] = '';
		
		this.send('aj_newtown', req, {err: err, callback: callback});
	};
	
	this.depositGet = function(dx, dy, callback){
		var req = this.addTown();
		req.dx = dx;
		req.dy = dy;
		
		this.send('aj_depositget', req, {callback: callback});
	};
	
	this.depositFree = function(town, callback){
		var req = {};
		req.town = town;
		
		this.send('aj_depositfree', req, {callback: callback});
	};
	
	this.explore = function(dx, dy, callback){
		var req = this.addTown();
		req.dx = dx;
		req.dy = dy;
				
		this.send('aj_explore', req, {callback: callback});
	};
    
	this.sendArmy = function(req, callback){
		req = this.addTown(req);
        
        var err = {};
        err[ErrorX.ids.WE14] = 'Нельзя отправить войска из города, где идет бой';
		err[ErrorX.ids.WEnotAllFleet] = 'Недостаточно транспортных кораблей';
		err[ErrorX.ids.WEbadData2] = 'Город не может принять компоненты для постройки космического корабля до полного завершения строительства собственного космодрома.';
		err[ErrorX.ids.WEnoArmy] = 'Часть войск отсутствует в городе.';
        
		this.send('aj_sendarmy', req, {err: err, ignoreListAdd: [ErrorX.ids.WEbadTime], callback: callback});
	};
    
	this.sendSpy = function(req, callback){
		req = this.addTown(req);
        
        var err = {};
        err[ErrorX.ids.WE14] = 'Нельзя отправить войска из города, где идет бой';
		err[ErrorX.ids.WEnoArmy] = 'Часть войск отсутствует в городе.';
        
		this.send('aj_sendspy', req, {err: err, callback: callback});
	}; 
	
    this.setTradeConsumption = function (town, l, w, callback){
        var req = {};
        req.town = town;
        req.l = l;
        req.w = w;
		this.send('aj_tradeconsumption', req, {callback: callback});
    };
    
    this.setUseMap = function (usemask, callback){
        var req = this.addTown();
        req.usemask = usemask;
		this.send('aj_usemap', req, {callback: callback});
    };
    
    this.reserveTraders = function (town, count, callback){
        var req = {town: town, count: count};
        
		var err = {};
		err[ErrorX.ids.WEbadData] = 'Не удалось совершить операцию';
		
		this.send('aj_reserve', req, {err: err, callback: callback});
    };
	
	this.countryBattleGroup = function (id, callback){
        var req = {id:id};
        
		this.send('aj_countrybattlegroup', req, {callback: callback});
    };
	
	this.getCountryArmies = function (callback, opt){
        var req = {};
        
		opt = opt||{};
		opt.method = 'GET';
		opt.callback = callback;
		
		this.send('aj_armylist', req, opt);
    };
	
	this.getBonusDropPlaces = function (callback){
        var req = {};
        
		this.send('aj_settlecount', req, {callback: callback});
    };
    
	this.setBonusDrop = function (count, radius, callback){
        var req = {};
        
        req.count = count;
        req.radius = radius;
        
        var err = {};
        err[ErrorX.ids.WEnoLuck] = 'Недостаточно Монет Удачи';
        err[ErrorX.ids.WEbadDistance] = 'Недостаточно мест для подселения';
        err[ErrorX.ids.WElimit] = 'Для выбранного радиуса подселения не найдено достаточно мест заселения';
        
		this.send('aj_bonusact?settle', req, {err: err, callback: callback});
    };
	// Получение координат точки в своих координатах
	this.getMapCoord = function (o, callback){
        var req = this.addTown();
        req.o = o;
		
		this.send('aj_mapcoord', req, {method: 'GET', callback: callback, ignoreAll: true});
    };
	// Завершить военную операцию защиты с отзывом войск
	this.commanderSendBack = function (groupid, byspeed, callback){
        var req = {};
        
		req.groupid = groupid;
		if( byspeed )
			req.byspeed = byspeed;
		
		this.send('aj_commander?sendback', req, {callback: callback});
    };
	// Завершить военную операцию защиты без отзыва войск (если empty истина - отменяется ВО, в которой нет войск)
	this.commanderDelete = function (groupid, empty, callback){
        var req = {};
        
		req.groupid = groupid;
		
		this.send('aj_commander?delete' + (empty ? '&empty' : ''), req, {callback: callback});
    };
	//Пометить все отчеты как прочитанные
	this.readRep = function (time, callback){
        var req = {};
		req.t = time;
		
		this.send('aj_readrep', req, {callback: callback});
    };
 	
	this.getPathData = function (path, transportSpeed, armySpeed, callback){
		var req = {};
        req = this.addFrom(req);
		
		req.path_ = JSON.stringify(path);
        
		if( transportSpeed )
            req.transport = transportSpeed;
		if( armySpeed )
            req.army = armySpeed;
		
        this.send('aj_data', req, {method: 'GET', callback: callback});
	};
	
	this.getAccountInfo = function (id, callback){
		var req = {};
		req.id = id;
		
        this.send('aj_accountinfo', req, {method: 'GET', addConvert: function(resp){
        	var account = wofh.world.getAccount(req.id);
        	resp.id = account.id;
        	resp.name = account.name;
        	resp.sex = account.sex;
        	resp.race = account.race;


        	for (var assist in resp.assist){
        		var accId = resp.assist[assist];
        		resp.assist[assist] = resp.accounts[accId];
        	}
        	for (var accId in resp.ip.same){
        		var acc = resp.accounts[accId].clone();
        		acc.live = resp.ip.same[accId].live;
        		resp.ip.same[accId] = acc;
        	}
        	if (!resp.mult) {
        		resp.mult = {};
        	}
        	for (var accId in resp.mult.ip){
        		var acc = resp.accounts[accId].clone();
        		acc.count = resp.mult.ip[accId].count;
        		acc.assist = resp.mult.ip[accId].assist;
        		resp.mult.ip[accId] = acc;
        	}
        	for (var accId in resp.mult.cookie){
        		var acc = resp.accounts[accId].clone();
        		acc.count = resp.mult.cookie[accId].count;
        		acc.assist = resp.mult.cookie[accId].assist;
        		resp.mult.cookie[accId] = acc;
        	}
        	if (!resp.punishment){
        		resp.punishment = {};
        	}
        	if (!resp.punishment.notes){
        		resp.punishment.notes = [];
        	}
        }, callback: callback});
	};

	this.punish = function(req, callback){

		this.send('aj_a_punish', req, {callback: callback});
	};
	
	this.dropList = function (callback){
        var req = {};
		
		var baseNames = utils.clone(this.baseNames);
		
		baseNames.single.acc = Account;
		
		this.send('aj_settlelist', req, {method: 'GET', baseNames:baseNames, callback: callback});
    };
	
	this.dropCancel = function (callback){
		var req = {};

		this.send('aj_bonusact?settlecancel', req, {method: 'GET', callback: callback});
	};
	
	this.getTargetData  = function (town, from, transport, callback){
		var req = this.addNA();
        req = this.addFrom(req, from);
		req.town = town;
        
		if( transport !== undefined )
            req.transport = transport;
		
		this.send('aj_data', req, {method: 'GET', callback: callback});
	};
	
	this.getCommandingData  = function (commandgroup, commandkey, callback){
		var req = this.addNA();
        req = this.addFrom(req);
		req.commandgroup = commandgroup;
		req.commandkey = commandkey;
		
		this.send('aj_data', req, {method: 'GET', callback: callback});
	};
    
    this.assembleSpaceship = function(callback){
        var req = {};
        req.town = wofh.town.id;
        
        var err = {};
        err[ErrorX.ids.WEbadState] = 'Разное научное состояние игроков страны. Сборка невозможна';
        
		this.send('aj_assemble', req, {err: err, callback: callback});
    }
    
    this.setReferalQuest = function(questStr, callback){
        var req = this.addTown();
        req.data = questStr;
        
		this.send('aj_refquest', req, {callback: callback});
    };
    
    this.launchSpaceship = function(callback){
        var req = this.addTown();
        
		this.send('aj_launch', req, {callback: callback});
    }
    
    this.getSpaceshipsState = function(callback){
        var req = {};
        
		this.send('aj_spaceshipsstate', req, {callback: callback});
    };
	
	this.sendRes = function(town1, town2, res_, wayType, fuel, order, callback){
        var req = {};
        req.town1 = town1;
		req.town2 = town2;
		req.res_ = res_.toString();
		req.wayType = wayType;
		if( fuel ) req.fuel = fuel;
		if( order ) req.order = Element.getId(order);
		
		var err = {};
		err[ErrorX.ids.WEnoResources] = 'Не хватает ресурсов';
		err[ErrorX.ids.WEnoTraders] = 'Не хватает торговцев';
		err[ErrorX.ids.WEnoFuel] = 'Не хватает ресурсов для залога';
        
		this.send('aj_sendres', req, {err: err, callback: callback});
    };
    
	this.getWorlds = function(callback){
        var req = {};
        
        this.send('aj_statistics', req, {iface: 'CrossDomain', unpack: function(resp){
            for(var worldId in resp.worlds){
                var world = resp.worlds[worldId];
                world.id = worldId;
            }
        }, callback: callback});
    };
    
	this.getReferals = function(world, accUId, refKey, callback){
        var req = {};
        
        req.parent = accUId;
        req.key = refKey;
        
		var baseNames = utils.clone(this.baseNames);
		
		baseNames.single.account = Account;
		
        this.send('aj_referals', req, {iface: 'CrossDomain', domain: world, baseNames:baseNames, callback: callback});
    };
	
	this.getMyBarterOffers = function(callback, town){
		var req = this.addTown(false, town);
		
        this.send('aj_market?my&offer', req, {method:'GET'});
    };
	
	this.setBarterOffer = function(id, sellid, sellcount, buyid, buycount, count, dist, ally, callback, town){
		var req = this.addTown(false, town);
		
		if( id ) req.id = id;
		
		if( sellid == Resource.ids.luck ) sellid = Resource.ids.science;
		if( buyid == Resource.ids.luck ) buyid = Resource.ids.science;
		
		req.sellid = sellid;
		req.buyid = buyid;
		req.sellcount = sellcount;
		req.buycount = buycount;
		req.count = count;
		req.dist = dist;
		if( ally )
			req.ally = Element.getId(ally);
		else
			req.noAlly = true;
		
		
		var err = {};
        err[ErrorX.ids.WEnoResources] = 'Не хватает ресурсов';
		err[ErrorX.ids.WEbadData] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEalreadyUsed] = 'Такое предложение уже существует';
		
        this.send('aj_barter?set', req, {err: err, callback: callback});
    };
	
	this.delBarterOffer = function(id, callback){
		var req = this.addTown();
		req.id = id;
		
        this.send('aj_barter?del', req, {callback: callback});
    };
	
	this.getBarterOffers = function(s, b, n, bydist, onlycountry, callback){
		var req = this.addTown();
		req.s = s;
		req.b = b;
		req.n = n;
		if( bydist !== undefined )
			req.bydist = bydist;
		if( onlycountry !== undefined )
			req.onlycountry = onlycountry;
		
        this.send('aj_market?buy&trade', req, {method: 'GET', ignoreAll: true, callback: callback});
    };
	
	this.makeBarter = function(id, count, callback){
		var req = this.addTown();
		req.id = id;
		req.count = count;
		
		var err = {};
        err[ErrorX.ids.WEnoResources] = 'Не хватает ресурсов';
		err[ErrorX.ids.WEnoDataInBd] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEbadData] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEnoTraders] = 'Не хватает торговцев';
		err[ErrorX.ids.WEnoLuck] = 'Недостаточно Монет Удачи';
		
        this.send('aj_barter', req, {err: err, callback: callback});
    };
	
	this.getMyTradeOffers = function(callback, town){
		var req = this.addTown(false, town);
		
        this.send('aj_market?adv&my&offer', req, {method:'GET'});
    };
	
	this.setTradeOffer = function(id, type, res, cost, limit, dist, ally, callback, town){
		var req = this.addTown(false, town);
		if( id ) req.id = id;
		req.type = type;
		req.res = res == Resource.ids.luck ? Resource.ids.science : res;
		req.cost = cost;
		req.limit = limit;
		req.dist = dist;
		if( ally )
			req.ally = ally;
		else
			req.noAlly = true;
		
		var err = {};
        err[ErrorX.ids.WEnoResources] = 'Не хватает ресурсов';
		err[ErrorX.ids.WEbadData] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEalreadyUsed] = 'Такое предложение уже существует';
		
		this.send('aj_trade?set', req, {err: err, callback: callback});
    };
	
	this.delTradeOffer = function(id, callback){
		var req = this.addTown();
		req.id = id;
		
        this.send('aj_trade?del', req, {callback: callback});
    };
	
	this.getTradeOffers = function(res, type, n, sortField, ally, callback){
		var req = this.addTown();
		req.res = res == Resource.ids.luck ? Resource.ids.science : res;
		req.type = type;
		req.n = n;
		if (sortField == 'dist') req.bydist = 1;
		if (sortField == 'ally') req.byally = 1;
		if (ally !== undefined && ally != TradeAlly.undif)
			req.ally = ally;
		
        this.send('aj_market?adv&buy&trade', req, {method: 'GET', ignoreAll:true, callback: callback});
    };
	
	this.makeTrade = function(id, cost, count, callback){
		var req = this.addTown();
		req.id = id;
		req.cost = cost; // Цена за 1000 едениц товара
		req.count = count;
		
		var err = {};
        err[ErrorX.ids.WEnoResources] = 'Не хватает ресурсов';
		err[ErrorX.ids.WEbadData] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEnoDataInBd] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEnoTraders] = 'Не хватает торговцев';
		err[ErrorX.ids.WEnoLuck] = 'Недостаточно Монет Удачи';
		err[ErrorX.ids.WEnoMoney] = 'Покупатель не может оплатить';
		err[ErrorX.ids.WEunknown] = 'Не удалось совершить сделку';
		err[ErrorX.ids.WEalreadyUsed] = 'Не удалось совершить сделку';
		err[ErrorX.ids.WEcantPayTax] = 'Продавец не может совершить сделку';
		
        this.send('aj_trade', req, {err: err, callback: callback});
    };
	
	this.makeTradeFreeMarket = function(res, count, cost, sell, maxdist, maxpath, ally, callback){
		var req = this.addTown();
		req.res = res == Resource.ids.luck ? Resource.ids.science : res;
		req.count = count;
		req.cost = cost; // Цена за 1000 едениц товара
		
		if( sell )
			req.sell = 1;
		if( maxdist )
			req.maxdist = maxdist;
		if( maxpath )
			req.maxpath = maxpath;
		if( ally )
			req.ally = ally;
		
		req.bydist = '';
		
		var err = {};
        err[ErrorX.ids.WEnoResources] = 'Не хватает ресурсов';
		err[ErrorX.ids.WEbadData] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEnoDataInBd] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEnoTraders] = 'Не хватает торговцев';
		err[ErrorX.ids.WEnoMoney] = 'Покупатель не может оплатить';
		err[ErrorX.ids.WEunknown] = 'Не удалось совершить сделку';
		err[ErrorX.ids.WEalreadyUsed] = 'Не удалось совершить сделку';
		err[ErrorX.ids.WEcantPayTax] = 'Продавец не может совершить сделку';
		
        this.send('aj_trade?mass', req, {err:err, callback: callback});
    };
	
	this.setStreamOffer = function(id, sell, res, count, tcost, cost, dist, ally, text, callback, town){
		var req = this.addTown(false, town);
		if( id ) req.id = id;
		if( sell )
			req.sell = 1;
		req.res = res;
		req.count = count;
		req.tcost = tcost;
		req.cost = cost;
		req.dist = dist;
		if( ally )
			req.ally = ally;
		else
			req.noAlly = true;
		if( text )
			req.text = text;
		
		var err = {};
        err[ErrorX.ids.WEnoResources] = 'Не хватает ресурсов';
		err[ErrorX.ids.WEbadData] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEalreadyUsed] = 'Такое предложение уже существует';
		
		this.send('aj_tradestream?set', req, {err: err, callback: callback});
    };
	
	this.delStreamOffer = function(id, callback, town){
		var req = this.addTown(false, town);
		req.id = id;
		
        this.send('aj_tradestream?del', req, {callback: callback});
    };
	
	this.getStreamOffers = function(res, n, sell, onlycountry, callback){
		var req = this.addTown();
		req.res = res;
		req.n = n;
		if( sell )
			req.sell = 1;
		if( onlycountry !== undefined )
			req.onlycountry = onlycountry;
		
        this.send('aj_market?stream', req, {method: 'GET', ignoreAll:true, callback: callback/*function(resp){
        	for (var item in resp.offers){
        		item = resp.offers[item];
        		item.town = wofh.world.getTown(item.town);
        	}
        	callback(resp);
        }*/});
    };
	
	this.getStreams = function(town, callback){
		var req = {};
		req.town = town;
		
		this.send('aj_market?my&stream', req, {method: 'GET', callback: callback});
	};
	
	this.makeStream = function(id, traders, count, callback){
		var req = this.addTown();
		req.id = id;
		
		if( traders )
			req.traders = traders;
		if( count )
			req.count = count;
		
		var err = {};
        err[ErrorX.ids.WEnoResources] = 'Не хватает ресурсов для доставки. А быть может и для ускорения. Или же, вообще, для залога.';
		err[ErrorX.ids.WEbadData] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEnoDataInBd] = 'Это предложение более не доступно на рынке.';
		err[ErrorX.ids.WEnoTraders] = 'Не хватает торговцев';
		err[ErrorX.ids.WEnoLuck] = 'Недостаточно Монет Удачи';
		err[ErrorX.ids.WEnoMoney] = 'Покупатель не может оплатить';
		err[ErrorX.ids.WEunknown] = 'Не удалось совершить сделку';
		err[ErrorX.ids.WEalreadyUsed] = 'Не удалось совершить сделку';
		
        this.send('aj_tradestream', req, {err: err, ignoreListAdd: [ErrorX.ids.WEbadSize, ErrorX.ids.WElimit], callback: callback});
    };
	
	this.closeStream = function(id, type, callback){
		var req = this.addTown();
		req.id = id;
		req.type = type;
		
        this.send('aj_streamclose', req, {callback: callback});
    };
	
	// Необязательный параметр stream - поток, который меняется
	this.updateStream = function(id, count, traders, cost, tcost, fuelId, stream, town, callback){
		var req = this.addTown(false, town);
		req.id = id;
		req.count = count;
		req.traders = traders;
		req.cost = cost;
		req.tcost = tcost;
		req.fuel = fuelId;
		
		var err = {};
        err[ErrorX.ids.WEnoResources] = 'Не хватает ресурсов';
		err[ErrorX.ids.WEnoMoney] = 'Покупатель не может оплатить';
		err[ErrorX.ids.WEnoTraders] = stream ? 'Для осуществления снабжения не хватает свободных торговцев в ' + snip.town(stream.town1) : 'Не хватает торговцев' ;
		err[ErrorX.ids.WEbadData] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEnoFuel] = 'Не хватает ресурсов для залога';
		err[ErrorX.ids.WEnoFuel] = 'Не хватает ресурсов для залога';
		err[ErrorX.ids.WElimit] = 'Для увеличения объема снабжения необходимо задействовать дополнительных торговцев, создав новый временный поток. Но ты исчерпал лимит активных предложений для этого города. Можно пересоздать этот поток снабжения с нуля, но с большим объемом.';
		err[ErrorX.ids.WEunknown] = 'На данный момент это невозможно'; // Временная ошибка
		
        this.send('aj_streamcorrect', req, {err: err, callback: callback});
    };
	
	this.getTradeStory = function(town, time, callback){
		var req = {};
		req.town = town;
		req.time = time;
		
        this.send('aj_tradestory', req, {method: 'GET', addConvert: function(resp){
			for(var item in resp.list){
				item = resp.list[item];
				item.town1 = resp.towns[item.town1];
				item.account1 = item.town1.account;
				item.res1 = new ResList(item.res1);

				item.town2 = resp.towns[item.town2];
				item.account2 = item.town2.account;
				item.res2 = new ResList(item.res2);
			}
        }, callback: callback});
    };
	
	this.getArmyData = function(callback){
		var req = this.addTown();
		req = this.addNA(req);
        req = this.addFrom(req);
		//req.events = true; //- берем из инит данных
		//req.fleets = true; //- берем из инит данных
		//req.def = true; //- берем из инит данных
		req.battles = true;
		req.commanding = true;
		
		this.send('aj_data', req, {method: 'GET', callback: callback});
	};
    
	this.getCommandingInfo = function(callback){
		var req = this.addTown();
		req = this.addNA(req);
        req = this.addFrom(req);
		req.commanding = true;
		
		this.send('aj_data', req, {method: 'GET', callback: callback});
	};
	
    //рейтинг одним числом описывающий игрока
	this.getSingleRate = function(accountsIds, prefix, callback){
        var req = {};
        req = this.addFrom(req);
        
        req.rate = prefix+accountsIds.join(','+prefix);
        
        console.log('this.getSingleRate', req.rate);
		this.send('aj_data', req, {method: 'GET', callback: callback});
    };
	
	this.getRate = function(req, callback){
		req = this.addNA(req);
		req.t = wofh.town.id;
        
		var baseNames = utils.clone(this.baseNames);
		
		baseNames.single.twn = Town;
		
		this.send('aj_rate', req, {method: 'GET', callback: callback, baseNames: baseNames});
    };
	
	this.getPlayerRate = function(type, pos, name, addr, filterC, show, friends, callback){
        var req = {};
		
		req.player = true;
		if( type !== undefined ) req.type = type;
		if( pos !== undefined ) req.pos = pos;
		if( name !== undefined ) req.name = name;
		if( addr !== undefined ) req.addr = addr;
		if( filterC ) req[filterC] = true;
		if( show !== undefined ) req.show = show;
		if( friends ) {
			req.accounts = [];
			for(var user in wndMgr.interfaces.town.friends.users)
				req.accounts.push(wndMgr.interfaces.town.friends.users[user].id);
			
			req.accounts = req.accounts.join(',');
		}
		
		reqMgr.getRate(req, callback);
    };
	
	this.getTownRate = function(pos, filterC, friends, callback){
		var req = {};
		
		req.town = true;
		if( pos !== undefined ) req.pos = pos;
		if( filterC ) req[filterC] = true;
		if( friends ) {
			req.accounts = [];
			for(var user in wndMgr.interfaces.town.friends.users)
				req.accounts.push(wndMgr.interfaces.town.friends.users[user].id);
			
			req.accounts = req.accounts.join(',');
		}
		
		reqMgr.getRate(req, callback);
	};
	
	this.getCountryRate = function(pos, callback){
		var req = {};
		
		req.country = true;
		if( pos !== undefined ) req.pos = pos;
		
		reqMgr.getRate(req, callback);
	};
	
	this.getTradersMove = function(callback){
		var req = this.addTown();
		
		this.send('aj_market?my&move', req, {method: 'GET', callback: callback});
	};
    
    this.win = function(message, callback){
		var req = {};
        req.text = message;
        
		this.send('aj_win', req, {callback: callback});
    };
	
	this.getAllyInfo = function(id, callback, opt){
		var req = {};
		
        req = this.addFrom(req);
		
		this.getAllyInfo.packReq(req, id);
		
		opt = opt||{};
		opt.method = 'GET';
		opt.callback = callback;
		
		this.send('aj_data', req, opt);
	};
		
		this.getAllyInfo.packReq = function(req, alliesIds){
			req = req||{};

			req.tradeallyinfo = alliesIds instanceof Array ? alliesIds.join(',') : alliesIds;

			return req;
		};
	
	this.createTradeAlly = function(name, text, callback){
		var req = {};
		req.name = name;
		req.text = text;
		
		var err = {};
		
        err[ErrorX.ids.WElimit] = 'Слишком много торговых союзов';
		err[ErrorX.ids.WEbadName] = 'Имя уже занято';
		err[ErrorX.ids.WEbadData] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEbadAccount] = 'Нет такого игрока';
		err[ErrorX.ids.WEbadSize] = 'Название слишком короткое';
		
		// Проверка длины названия
		if( name.length < lib.tradeally.namelimit[0] ){
			wndMgr.addAlert(err[ErrorX.ids.WEbadSize]);
			return false;
		}
		else if(wofh.tradeAllies.getMyCount() >= lib.tradeally.maxown ){ // Проверка количества своих союзов
			wndMgr.addAlert(err[ErrorX.ids.WElimit]);
			return false;
		}
		
		this.send('aj_tradeallycreate', req, {err:err, callback: callback});
	};
	
	this.changeTradeAlly = function(id, owner, name, text, callback){
		var req = {};
		req.id = id;
		req.owner = owner;
		req.name = name;
		req.text = text;
		
		var err = {};
		
		err[ErrorX.ids.WEbadName] = 'Имя уже занято';
		err[ErrorX.ids.WEbadData] = 'Не удалось совершить операцию';
		err[ErrorX.ids.WEbadAccount] = 'Нет такого игрока';
		err[ErrorX.ids.WEbadSize] = 'Название слишком короткое';
		
		// Проверка длины названия
		if( name.length < lib.tradeally.namelimit[0] ){
			wndMgr.addAlert(err[ErrorX.ids.WEbadSize]);
			return false;
		}
		
		this.send('aj_tradeallychange', req, {err:err, callback: callback});
	};
	
	this.addTradeAllyMember = function(id, member, callback){
		var req = {};
		req.id = id;
		req.member = member;
		req.add = true;
		
		this.send('aj_tradeallymember', req, {callback: callback});
	};
	
	this.deleteTradeAllyMember = function(id, member, callback){
		var req = {};
		req.id = id;
		req.member = member;
		
		this.send('aj_tradeallymember', req, {callback: callback});
	};
    
    //получить список сообщений в переписке
	this.getMessageThread = function(threadId, from, callback){
		var req = {};
		req.thread = threadId;
		req.from = from||0;
		
		var baseNames = utils.clone(this.baseNames);
		
		baseNames.single.account1 = BaseAccOrCountry;
		baseNames.single.account2 = BaseAccOrCountry;
		
		this.send('aj_message', req, {
			method: 'GET', 
			callback: callback, 
        	baseNames: baseNames,
        	unpack: function(resp){
        		if (!resp) resp = {};
        		return resp;
        	}
        });
	};
	
	this.getLastReadMessagePos = function(threadId, time, callback){
		var req = {};
		req.thread = threadId;
		req.time = time;
		
		this.send('aj_message', req, {method: 'GET', noConvertData: true, callback: callback, unpack: function(resp){
			if( resp )
				return {msgPos:resp.timepos};
		}});
	};
	
	this.readMes = function(time, callback){
		var req = this.addNA();
		req.t = time;
		
		this.send('aj_readmes', req, {callback: callback});
	};

    //получить список сообщений в переписке
	this.getMessageList = function(from, callback){
		var req = {};
		req.from = from||0;
		
		var baseNames = utils.clone(this.baseNames);
		
		baseNames.single.account1 = BaseAccOrCountry;
		baseNames.single.account2 = BaseAccOrCountry;
		
		this.send('aj_message', req, {
			method: 'GET', 
			callback: callback, 
        	baseNames: baseNames});
	};
    
	this.getMessageNote = function(callback){
		var req = {};
		
		this.send('aj_message?note', req, {method: 'GET', callback: callback});
	};
	
	this.storeMessageNote = function(text, callback){
		var req = {};
		req.text = text;
		
		var err = {};
		err[ErrorX.ids.WEnoAccess] = 'Данная возможность временно заблокирована для вас';
		err[ErrorX.ids.WEbadCountry] = 'Указан адресат для массового сообщения';
		err[ErrorX.ids.WEbadSize] = 'Отсутствует текст сообщения';
		err[ErrorX.ids.WEbadData] = 'Недопустимая ссылка в тексте';
		err[ErrorX.ids.WElimit] = 'Спам запрещен';
		err[ErrorX.ids.WEbadAccount] = 'Нет игрока с таким именем';
		err[ErrorX.ids.WEbadState] = 'Недопустимая ссылка в тексте';
		
		this.send('aj_storenote', req, {err: err, callback: callback});
	};
	
	this.sendMessage = function(to, topic, text, mass, access, callback, admin){
		var req = this.addNA();
		if( to ) req.to = to;
		req.topic = topic;
		req.text = text;
		
		if( mass !== undefined ) {
			req.mass = '';
			
			req.access = access||0;
		}
		if( admin ) req.admin = +admin;
		
		var err = {};
		err[ErrorX.ids.WEnoAccess] = 'Данная возможность временно заблокирована для вас';
		err[ErrorX.ids.WEbadCountry] = 'Указан адресат для массового сообщения';
		err[ErrorX.ids.WEbadSize] = 'Отсутствует текст сообщения';
		err[ErrorX.ids.WEbadData] = 'Недопустимая ссылка в тексте';
		err[ErrorX.ids.WElimit] = 'Спам запрещен';
		err[ErrorX.ids.WEbadAccount] = 'Нет игрока с таким именем';
		err[ErrorX.ids.WEbadState] = 'Недопустимая ссылка в тексте';
		err[ErrorX.ids.WEbadCharacter] = 'В тексте присутствует недопустимый символ, а, быть может, даже несколько.';
		err[ErrorX.ids.WEunknown] = 'В тексте присутствует недопустимый символ, а, быть может, даже несколько.';
		
		this.send('aj_sendmessage', req, {err: err, callback: callback});
	};
	
	this.deleteMessages = function(all, selected, callback){
		var req = this.addNA();
		if( all ) req.all = all;
		if( selected ) $.extend(req, selected);
		
		this.send('aj_delmessages', req, {callback: callback});
	};
	
    //ответить на сообщение в переписке
	this.answerMessage = function(text, threadId, callback){
		var req = {};
		req.text = text;
		req.thread = threadId;
        
		var err = {};
		err[ErrorX.ids.WEnoAccess] = 'Данная возможность временно заблокирована для вас';
		err[ErrorX.ids.WEbadCountry] = 'Указан адресат для массового сообщения';
		err[ErrorX.ids.WEbadSize] = 'Отсутствует текст сообщения';
		err[ErrorX.ids.WEbadData] = 'Недопустимая ссылка в тексте';
		err[ErrorX.ids.WElimit] = 'Спам запрещен';
		err[ErrorX.ids.WEbadAccount] = 'Нет игрока с таким именем';
		err[ErrorX.ids.WEbadState] = 'Для того, чтобы использовать ссылки в переписке необходимо пройти еще несколько начальных заданий';
		err[ErrorX.ids.WEunknown] = 'В тексте присутствует недопустимый символ, а, быть может, даже несколько.';
        err[ErrorX.ids.WEbadCharacter] = 'В тексте присутствует недопустимый символ, а, быть может, даже несколько.';
		
		this.send('aj_answer', req, {err: err, callback: callback});
	};
    
    this.getMapChunks = function(center, chunks, callback){
		var req = this.addTown();
        
        req.o = center;
        
		var arr_s = [];
		for(var i=0; i<chunks.length; i++){
            if (typeof(chunks[i].x)=='undefined') {
                arr_s[i] = chunks[i].join(',');
            } else {
                arr_s[i] = chunks[i].x+','+chunks[i].y;
            }
		}
		req.c = '['+arr_s.join('][')+']';
        
		this.send('aj_map', req, {method: 'GET', callback: callback});
    };
	
	this.setTax = function (data, callback){
        var req = {};
        req.data = JSON.stringify(data);
        
		var err = {};
		err[ErrorX.ids.WEnoMoney] = 'В казне нет денег для бюджетных выплат.';
        
		this.send('aj_settax', req, {err: err, callback: {onFail: callback}});
    };
    
	this.setCountryBarter = function (on, callback){
        var req = {};
        
		req.on = on ? 1 : 0;
		
		this.send('aj_countrybarter', req, {callback: callback});
    };
	
	this.findAccTown = function(data){
		var req = {
			data: data
		};
		
		this.send('aj_accounttown', req);
	};
	
	this.genInfoReport = function(town, types, text, callback){
		var req = {};
			
		if( !town )
			req.town = 0;
		else
			this.addTown(req, town);
		
		if( types !== undefined )
			req.types = types;
		
		if( text )
			req.text = text;
		
		this.send('aj_inforeport', req, {callback: callback});
	};
	
	this.getInfoReportTime = function(callback){
		var req = {};
		
		this.send('aj_inforeportstime', req, {callback: callback});
	};
	
	this.storeTactic = function(id, name, data, callback){
		var req = {};
		
		if( id ) req.id = id;
		if( name ) req.name = name;
		if( data ){
			if( data.data )
			data.data = JSON.stringify(data.data);
			
			req.data = JSON.stringify(data);
		}
		/*
			WEbadData - невалидные данные
			WEalreadyUsed - такая тактика уже есть
			WElimit - превышен лимит тактик (war.tactics.max)
			WEnoDataInBd - редактирование несуществующей или чужой тактики 
		*/
		
		this.send('aj_tacticsstore', req, {callback: callback});
	};
	
	this.getTacticsList = function(callback){
		var req = {};
		
		this.send('aj_tacticslist', req, {
			addConvert: function(resp){
				for(var item in resp)
					reqMgr.getTactic.addConvert(resp[item]);
			}, 
			unpack: function(resp){
				return new TacticsList(resp);
			}, 
			callback: callback
		});
	};
	
	this.getTactic = function(id, secret, callback){
		var req = {};
		
		req.id = id;
		req.secret = secret;
		
		this.send('aj_tacticsdata', req, {
			addConvert: function(resp){
				reqMgr.getTactic.addConvert(resp);
			}, 
			unpack: function(resp){
				if( resp )
					return new Tactic(resp);
			}, callback: callback});
	};
		
		this.getTactic.addConvert = function(tacticData){
			if( tacticData ){
				tacticData.data = JSON.parse(tacticData.data);
				
				if( tacticData.data.data )
					tacticData.data.data = JSON.parse(tacticData.data.data);
			}
		};
	
    //платёж через РБК
	this.buyRBK = function (coins, callback){
        var req = {};
        req.coins = coins;
        
        this.send('aj_rbk_buy', req, {ignoreListAdd: [ErrorX.ids.WEnoMoney], callback: callback});
    };
	
	//платёж через РБК
	this.getXsollaToken = function (pack, coins, callback){
        var req = {};
		req.pack = pack;
        if( coins )  req.coins = coins;
        
        this.send('aj_xsollatoken', req, {callback: callback});
    };
	
	this.logOut = function(getParams){
		if( getParams ){
			if( getParams[0] != '&' )
				getParams = '&' + getParams;
		}
		
		appl.setLocation(appl.getOriginHost()+'/logout' + location.search + (getParams||''));
	};
	
	this.startAssist = function(session){
		appl.setLocation('/start?session=' + session + '&assist&uid=' + utils.urlToObj().gid);
	};
	
	this.calcFutureBuilds = function(deepness, account, callback){
		var req = {};
		
		account = account||wofh.account;
		
		req.deepness = deepness;
		
		req.account = account.cloneBase();
		req.account.research = account.research;
		req.account.science = utils.copyProperties({}, account.science);
		
		delete req.account.science.futureBuilds;
		
		this.send('calcFutureBuilds', req, {iface: 'worker', callback: callback, noConvertData: true, unpack: function(resp){
			var builds = new BuildList();
			
			for(var build in resp.builds){
				build = resp.builds[build];
				
				var slot = new Slot(build.id, build.level);
				
				slot.needScience = new ScienceList(build.needScience);
				
				delete slot.town;
				
				builds.addElem(slot);
			}
			
			return builds;
		}});
	};
    
    this.prepareChunks = function(data, callback){
		var req = {};
		
        req.chunks = data.chunks;
        req.map = data.map;
        req.world = data.world;
        req.account = wofh.account.cloneBase();
        req.country = wofh.country ? wofh.country.cloneBase() : wofh.country;
        req.town = wofh.town.cloneBase();
		
		this.send('prepareChunks', req, {iface: 'worker', callback: callback, noConvertData: true});
	};
    
    this.updWorker = function(reqData, callback){
		var req = reqData||{};
		
		this.send('updWorker', req, {iface: 'worker', callback: callback, noConvertData: true});
	};
};


reqMgr = new ReqMgr();