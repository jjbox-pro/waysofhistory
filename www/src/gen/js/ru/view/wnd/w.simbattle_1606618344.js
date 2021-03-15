wSimbattle = function(id, data){
	wSimbattle.superclass.constructor.apply(this, arguments);
};

utils.extend(wSimbattle, Wnd);

WndMgr.regWnd('simbattle', wSimbattle);


wSimbattle.maxUnitLimit = 500;

wSimbattle.defHashStr = 'b1=0&b2=0&dt=0&dl=1'; 

wSimbattle.prepareData = function(id){
	return {hash: id};
};


wSimbattle.prototype.calcName = function(){
	return 'simbattle';
};

wSimbattle.prototype.initWndOptions = function(){
	wSimbattle.superclass.initWndOptions.apply(this, arguments);
    
    this.options.noBlur = true;
};

wSimbattle.prototype.getData = function(){
	var data = this.data,
		hash = data.hash||ls.getSimbattle(wSimbattle.defHashStr);
	
	delete data.hash;
	
	if( hash ){
        var hashParameters = hash.split('&');
		
        for (var i = 0; i < hashParameters.length; i++) {
            var param = hashParameters[i].split('=');
            
            switch( param[0] ){
                case 'a1': {
                    data['a1'] = new Army(param[1]);
                    break;
                }
                case 'a2': {
                    data['a2'] = new Army(param[1]);
                    break;
                }
                case 'b1': {
                    data['b1'] = param[1] ? param[1] : 0;
                    break;
                }
                case 'b2': {
                    data['b2'] = param[1] ? param[1] : 0;
                    break;
                }
                case 'map': {
                    if( param[1] == 'map2' )
						data['map'] = param[1];
                    break;
                }
				case 'dt': {
                    data['dt'] = param[1] ? param[1] : 0;
                    break;
                }
				case 'dl': {
                    data['dl'] = param[1] ? param[1] : 0;
                    break;
                }
            }
        }
    }
	
	data.tactics = {};
	data.allowSimulationFlag = false;  
	
	wSimbattle.superclass.getData.apply(this, arguments);
};

wSimbattle.prototype.modifyCont = function(){
	this.$armyAtt = this.cont.find('.simbattle-unitval.-sim-army-attack');
	this.$armyDef = this.cont.find('.simbattle-unitval.-sim-army-defense');
	
	this.$b1 = this.cont.find('.sh[name="b1"]');
	this.$b2 = this.cont.find('.sh[name="b2"]');
	
	this.$dt = this.cont.find('input[name="dt"]');
	this.$dl = this.cont.find('input[name="dl"]');
};

wSimbattle.prototype.bindEvent = function(){
    var self = this,
		noAttackUnits = {}; // Юниты со способностью миротворец
	
    this.wrp
		.on('input', '.simbattle-unitval', function(){
			utils.checkInputInt(this, {min: 0, noZero: true});
			
			self.checkUnitEmpty(this);
			
			self.createHash();
		})
		// Военный бонус
		.on('input', '.sh[name="b1"], .sh[name="b2"]', function(){
		   utils.checkInputInt(this, {max: 100, min: 0});
		   
		   self.createHash();
		})
		// Тип карты
		.on('change', 'input[name="simbattle_map"]', function(){
			self.createHash();
		})
		.on('focusout', '.spinbox-wrp input', function(){
			self.createHash();
		})
		.on('mousedown', '.simbattle-run', function(event){
			if( utils.getMouseButton(event) == Appl.mouseButton.middle ){
				$(this).trigger('click');
				
				return false;
			}
		})
		.on('click', '.simbattle-run', function(event){	
			if( !self.data.allowSimulationFlag )
				return false;
			
			var params = self.wrp.find('.simbattle-unitval').serialize();
			
			var army1 = {}, army1Count = 0;
			var army2 = {}, army2Count = 0;
			
			var maxBonus = 100,
				addBonus = 100;
			
			var gets = params.split('&');
			
			for (var i = 0; i < gets.length; i++) {
				var get = gets[i].split('=');
				
				if( get[0].replace(/[^ad]/g, "") == 'a' ){
					if( !isNaN(parseInt(get[1])) ){
						army1[get[0].replace(/[a]/g, "")] = parseInt(get[1]);
						army1Count += parseInt(get[1]);
					}
				}
				else{
					if( !isNaN(parseInt(get[1])) ){
						army2[get[0].replace(/[d]/g, "")] = parseInt(get[1]);
						army2Count += parseInt(get[1]);
					}
				}
			}
			
			var damageBonusAtt = parseInt(self.$b1.val()); 
			var damageBonusDef = parseInt(self.$b2.val());

			if( !isNaN(damageBonusAtt) ){
				if( damageBonusAtt > maxBonus )
					damageBonusAtt = maxBonus;
				else if( damageBonusAtt < 0 )
					damageBonusAtt = 0;

				damageBonusAtt += addBonus;
			}
			else
				damageBonusAtt = 0;

			if( !isNaN(damageBonusDef) ){
				if( damageBonusDef > maxBonus )
					damageBonusDef = maxBonus;
				else if( damageBonusDef < 0 )
					damageBonusDef = 0;

				damageBonusDef += addBonus;
			}
			else
				damageBonusDef = 0;

			// Старый формат
			var armyAtt = army1;
			var armyDef = army2;

			// Тип карты
			var map = false && self.wrp.find('input[name="simbattle_map"]').prop('checked') ? 'map2' : 'map1';

			var buildDefId = self.$dt.val();
			var buildLevel = self.$dl.val();

			var buildings = [1,1,1];

			if (buildDefId == 3) {
				var l = buildLevel - 2;
				buildings.push(Math.max(utils.toInt(l / 6) + utils.toInt(l % 6 >= 1), 1));
				buildings.push(Math.max(utils.toInt(l / 6) + utils.toInt(l % 6 >= 2), 1));
				buildings.push(Math.max(utils.toInt(l / 6) + utils.toInt(l % 6 >= 3), 1));
				buildings.push(Math.max(utils.toInt(l / 6) + utils.toInt(l % 6 >= 4), 1));
				buildings.push(Math.max(utils.toInt(l / 6) + utils.toInt(l % 6 >= 5), 1));
				buildings.push(Math.max(utils.toInt(l / 6) + utils.toInt(l % 6 >= 6), 1));
			}
			else if (buildDefId == 19) {
				var l = buildLevel - 2;
				buildings.push(3 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 1));
				buildings.push(3 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 2));
				buildings.push(3 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 3));
				buildings.push(3 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 4));
				buildings.push(3 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 5));
				buildings.push(3 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 6));
			}
			else if (buildDefId == 38) {
				var l = buildLevel - 2;
				buildings.push(6 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 1));
				buildings.push(6 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 2));
				buildings.push(6 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 3));
				buildings.push(6 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 4));
				buildings.push(6 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 5));
				buildings.push(6 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 6));
			}
			else if (buildDefId == 57) {
				var l = buildLevel - 2;
				buildings.push(9 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 1));
				buildings.push(9 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 2));
				buildings.push(9 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 3));
				buildings.push(9 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 4));
				buildings.push(9 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 5));
				buildings.push(9 + utils.toInt(l / 6) + utils.toInt(l % 6 >= 6));
			}
			else {
				buildings.push(1);
				buildings.push(1);
				buildings.push(1);
				buildings.push(1);
				buildings.push(1);
				buildings.push(1);
			}

			// Правило сокращения домиков (может быть включено к примеру для скоростного мира)
			if( lib.mode.decbattletowers ){
				buildings[4] = 1;
				buildings[6] = 1;
				buildings[7] = 1;
			}

			var simBattleInfo = {
				"buildings":buildings,
				members:{
					"0":{
						"army":armyDef,
						"damageBonus":damageBonusDef,
						"fraction":0
					},
					"1":{
						"army":armyAtt,
						"damageBonus":damageBonusAtt,
						"fraction":1
					}
				},
				"map":map
			};

			if( utils.sizeOf(self.data.tactics) ){
				var tactics = {};

				self.prepareTactics(tactics);

				tactics.army0 = (new Army(armyDef)).toString();
				tactics.damageBonus0 = damageBonusDef;

				tactics.army1 = (new Army(armyAtt)).toString();
				tactics.damageBonus1 = damageBonusAtt;

				simBattleInfo.tactics = tactics;

				delete simBattleInfo.members;
			}

			reqMgr.questComplete(new Quest(Quest.ids.simulator));

			var linkParams = {simulation: encodeURIComponent(JSON.stringify(simBattleInfo))};
			
			var link = snip.getBattleLink(linkParams);
			
			if( utils.getMouseButton(event) == Appl.mouseButton.left || !wofh.platform.battletabs )
				wndMgr.addWnd(wBattle, encodeURIComponent(link));
			else
				window.open(link);
			
			return false;
		})
		.on('click', '#changeArmy', function(){
			if( !self.data.allowSimulationFlag )
				return false;
			
			var tempVal = null, tempObj = null;
			
			tempVal = self.$b1.val();
			tempObj = self.$b2;
			
			self.$b1.val( tempObj.val() );
			tempObj.val(tempVal);
			
			if( utils.sizeOf(self.data.tactics) ){
				var tmpTactic = self.data.tactics[0];
				
				self.data.tactics[0] = self.data.tactics[1];
				self.data.tactics[1] = tmpTactic;
				
				for(var member in self.data.tactics)
					self.setTactic(self.data.tactics[member], self.wrp.find('.simbattle-setTactic[data-member="'+member+'"]'));
			}
			
			self.$armyDef.each(function() {
				var unitId = $(this).data('id');
				
				tempVal = $(this).val();
				tempObj = self.$armyAtt.filter('[data-id="' + unitId + '"]');
				
				if( tempObj.length ){
					$(this).val(tempObj.val());
					tempObj.val(tempVal);
					
					self.checkUnitEmpty(tempObj);
				}
				else{
					if( noAttackUnits[unitId] ){
						$(this).val(noAttackUnits[unitId]);
						delete noAttackUnits[unitId];
					}
					else{
						if( tempVal ){
							noAttackUnits[unitId] = tempVal;
							$(this).val('');
						}
					}
				}
				
				self.checkUnitEmpty(this);
			});
			
			var existingArmy = self.filterExistingArmy(self.$armyAtt);
			
			if( !existingArmy.length )
				self.allowSimulation(false);
			
			return false;
		})
		.on('click', '#resetArmy', function(){
			self.data = {};
			
			ls.setSimbattle(wSimbattle.defHashStr);
			
			self.show();
			
			self.createHash();
		})
		.on('click', '.js-setTactic', function(){
			var $this = $(this),
				tactic = self.data.tactics[$this.data('member')];
			
			if( tactic ){
				var tacticId = tactic.getId(),
					tacticSecret = tactic.getSecret();
			}
			 
			wndMgr.addWnd(wTactics, {callback:function(tactic){
				if( self.isRemoved() )
					return;
					
				self.setTactic(tactic, $this);
			}, id:tacticId, secret:tacticSecret, mustSaveBeforeUse:true});   
			
			return false;
		})
		.on('click', '.js-setAlertTactic', function(){
			self.wrp.find('.js-setTactic[data-member="1"]').trigger('click');
		})
		.on('click', '.simbattle-delTactic', function(){
			var $tactic = $(this).closest('.simbattle-setTactic-wrp').find('.simbattle-setTactic');
			
			self.setTactic(false, $tactic);
			
			return false;
		})
		// Фортификация
		.on('input', 'input[name="dl"]', function(event){
			utils.checkInputInt(this, {max: lib.build.maxlevel, min: 1, manualInput: !event.isTrigger});
			
			self.createHash();
		})
		.on('smplSelect-changed', '.smplSelect', function(event, elem){ // Пользовательское событие (вызывается только програмно)
			var bldId = +elem.getVal();
			
			self.wrp.find('.simbattle-defLevel-wrp').toggleClass('-hidden', !bldId);
			
			self.createHash();
		})
		.on('click', '.js-randomSimBattle', function(event){
			self.wrp.find('.simbattle-unitval').each(function(){
				$(this).val(1 + utils.random(10));
			});
			
			self.createHash();
			
			event.preventDefault();
		})
		.on('change', '.report-battleView', function(){
			ls.setAttDefViewSimbattle($(this).prop('checked'));
			
			self.show();
		});
};

wSimbattle.prototype.afterDraw = function(){
	this.wrp.find('a.info-page').attr('tabindex', '-1');
	
	snip.input1Handler(this.cont, {spinbox: {}});
	
	var selectList = new smplSelectList(),
		bldList = BuildList.getAll().getList();
	
	selectList.addElem({
		text: 'Без укреплений',
		val: 0
	});
	
	for(var build in bldList){
		build = bldList[build];
		
		if( build.getType() == Build.type.defence ){
			var elem = selectList.addElem({
				text: build.getName(),
				val: build.getId()
			});
			
			if( build.getId() == this.data['dt'] )
				selectList.setSelected(elem);
		}
	}
	
	snip.smplSelectHandler(this.cont, selectList);
	
	this.initScroll({
		scrollbarPosition: 'outside', 
		advanced:{
			autoScrollElementOffset: 30
		}
	});
};


wSimbattle.prototype.prepareTactics = function(tactics){
	for( var member in this.data.tactics ){
		var tactic = this.data.tactics[member];
		
		tactics['tactics' + member] = {
			id: tactic.getId(),
			secret: tactic.getSecret()
		};
	}
};

wSimbattle.prototype.allowSimulation = function(allow, alert){
    if( this.data.allowSimulationFlag != allow ){
		this.data.allowSimulationFlag = allow;
		this.wrp.find('.simbattle-run').toggleClass('-disabled', !allow);
		this.wrp.find('#changeArmy').toggleClass('-hidden', !allow);
	}
	
	if( alert !== undefined )
		this.wrp.find('.simbattle-simhead-alert').html(alert||'');
};

wSimbattle.prototype.allowReset = function(allow){      
	this.wrp.find('#resetArmy').toggleClass('-hidden', !allow);
};

wSimbattle.prototype.checkUnitEmpty = function(el){      
	$(el).closest('.simbattle-unitval-wrp').find('.simbattle-unit').toggleClass('-type-empty', !$(el).val());
};

wSimbattle.prototype.filterExistingArmy = function($selector, callback){
	var result;
	
	return $selector.filter(function(){
		result = !!$(this).val();
		
		if( callback && result )
			callback($(this));
		
		return result;
	});
};

wSimbattle.prototype.setTactic = function(tactic, $tactic){
	var data = {};
	
	if( tactic ){
		this.data.tactics[$tactic.data('member')] = tactic;
		
		data.tactic = tactic;
	}
	else
		delete this.data.tactics[$tactic.data('member')];
	
	$tactic.html(tmplMgr.simbattle.tactic(data));
	
	this.createHash();
};

wSimbattle.prototype.createHash = function(){
	var hashString = '',
		armies = {};
	
	this.filterExistingArmy(this.$armyAtt, function($unit){
		if( !armies.att )
			armies.att = new Army();

		armies.att.addCount($unit.data('id'), $unit.val());
	});
	this.filterExistingArmy(this.$armyDef, function($unit){
		if( !armies.def )
			armies.def = new Army();

		armies.def.addCount($unit.data('id'), $unit.val());
	});
	
	if( armies.att || armies.def ){
		if( armies.att )
			hashString += 'a1=' + armies.att.toString();
		
		if( armies.def ){
			if( hashString )
				hashString += '&';
			
			hashString += 'a2=' + armies.def.toString();
		}
	}
	
	var allowSim = armies.att && armies.def,
		allowSimAlert = '';
	
	if( allowSim ){
		allowSim = armies.att.calcSum() <= wSimbattle.maxUnitLimit && armies.def.calcSum() <= wSimbattle.maxUnitLimit || utils.sizeOf(this.data.tactics);

		if( !allowSim )
			allowSimAlert = snip.alert()+' В симуляции боя без '+snip.tactic('тактики', {cls: 'link crP js-setAlertTactic'})+' можно использовать не более '+wSimbattle.maxUnitLimit+' единиц с каждой стороны.';
	}
	
	this.allowSimulation(allowSim, allowSimAlert);
	
	if( hashString ) 
		hashString += '&';
	
	hashString += 'b1=' + (this.$b1.val()||0);
	hashString += '&b2=' + (this.$b2.val()||0);
	
	// Пока выпилино
	if( false && this.wrp.find('input[name="simbattle_map"]').is(':checked') )
		hashString += '&map=map2';
	
	var defBuildId = this.$dt.val();
	
	if( defBuildId )
		hashString += '&dt=' + defBuildId + '&dl=' + this.$dl.val();
	
	this.allowReset( armies.att || armies.def || hashString != wSimbattle.defHashStr );
	
	ls.setSimbattle(hashString);
	
	// Хэш может меняться часто. Выставляем небольшую задержку.
	this.clearTimeout(this.setIdTimeout);
	
	this.setIdTimeout = this.setTimeout(function(){
		this.setId(hashString);
		
		wndMgr.setHash(this);
	}, 250);
};