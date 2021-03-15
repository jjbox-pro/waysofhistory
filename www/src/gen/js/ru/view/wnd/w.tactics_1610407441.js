/**
	Окно тактик 
*/

wTactics = function(id){
	wTactics.superclass.constructor.apply(this, arguments);
	
	if( typeof(id) !== 'string' )
		delete this.id;
};

utils.extend(wTactics, Wnd);

WndMgr.regWnd('tactics', wTactics);


wTactics.uplsDef = 1;

wTactics.maxWaveRange = 10000;

wTactics.prepareData = function(id){
	var data = {};
	
	if( id ){
		if( typeof(id) === 'string' ){
			data = utils.urlToObj(id);
		}
		else{
			data.id = id.id;
			data.secret = id.secret;
			
			data.groupId = id.groupId;
			data.noTacticsChange = id.noTacticsChange;
			
			data.callback = id.callback;
			data.mustSaveBeforeUse = id.mustSaveBeforeUse;
			
			if( id.usedTactic )
				data.unknownTactic = new Tactic({data:id.usedTactic});
		}
	}
	
    return data;
};

wTactics.checkTmplUnitInWave = function(army, tmplUnit){
	if( army.hasElem(tmplUnit) ){ // если в отряде уже есть ШЮ 
		return true;
	}
	
	/*
	else if( !tmplUnit.getTmplSecondTag() ){ // если в отряде уже есть полностью обратный ШЮ (пока убрано)
		var negTmplUnit = tmplUnit.clone();
		negTmplUnit.changeTmplFirstTagNeg();
		
		if( army.hasElem(negTmplUnit) )
			return true;
	}
	*/
	
	if( tmplUnit.getTmplPriority() == Unit.tmplPriority.and && tmplUnit.getTmplSecondTag() ){
		var swapTmplUnit = tmplUnit.clone();
		swapTmplUnit.swapTmplTags();
		
		if( army.hasElem(swapTmplUnit) )
			return true;
	}
	
	return false;
};


wTactics.prototype.calcName = function(){
	return 'tactics';
};

wTactics.prototype.getData = function(){
	var self = this;
	
	this.data.tacticsData = utils.clone(servBuffer.temp.tacticsData); // Клонируем данные из хранилища для сохранения изменений отдельных тактиик и шаблонов
	
	reqMgr.getTacticsList(function(tactics){
		if( self.data.id ){
			var myTactic = tactics.getElemById(self.data.id);
			
			if( myTactic ){
				myTactic.setUpd(timeMgr.getNow());
				
				self.data.defTabName = 'edit';
				
				self.tacticsReceived(tactics);
			}
			else{
				reqMgr.getTactic(self.data.id, self.data.secret, function(tactic){
					if( tactic )
						self.data.unknownTactic = tactic;
					else
						wndMgr.addAlert('Такой тактики не существует');
					
					self.tacticsReceived(tactics);
				});
			}
		}
		else
			self.tacticsReceived(tactics);
	});
};

wTactics.prototype.bindEvent = function(){
	this.wrp
		// Получить ЦА
		.on('click', '.js-getPremium', function(){
			wndMgr.addWnd(wNoPremium);
			
			return false;
		});
};

wTactics.prototype.calcChildren = function(){
	this.children = {};
	
	this.children.list = tabTacticsList;
	this.children.edit = tabTacticsEdit;
};

wTactics.prototype.beforeShowChildren = function(){
	var self = this;
	
    this.tabs = new Tabs(this.cont);
	this.tabs.notOpenTab = function(tab){
		if( self.tabs.activeTab && self.tabs.activeTab.name == 'edit' ){
			self.children.edit.checkTacticChanges(function(result){
				self.tabs.openTab(tab, true);
				if( result )
					notifMgr.runEvent(Notif.ids.accTacticRestore);
			}.bind(this));
			
			return true;
		}
	};
	
	this.tabs.addTabs(this.children);
};

wTactics.prototype.afterDraw = function(){
    this.tabs.openTab(this.data.defTabName||'list');
	
	this.moveWnd();
};

wTactics.prototype.beforeClose = function(result){
	var self = this;
	
	if( this.tabs.activeTab.name == 'edit' && !result ){
		this.children.edit.checkTacticChanges(function(){
			self.close(true);
		}, true);
		
		return true;
	}
};

wTactics.prototype.moveWnd  = function(){
	// Центрируем окно
	if( !this.centering ){
		this.setAutoPos();
		
		this.centering = true;
	}
};


wTactics.prototype.tacticsReceived = function(tactics) {
	this.prepareTacticsData(tactics);
	
	this.dataReceived();
};

wTactics.prototype.prepareTacticsData = function(tactics) {
	var tacticsData = this.data.tacticsData;
	
	// Парсим тактики
	tacticsData.tactics = tactics;
	
	// Парсим переданную из вне тактику тактику
	this.prepareUnknownTactic(this.data.unknownTactic);
	
	// Парсим шаблоны
	tacticsData.templates = new TacticItemTmplsList(tacticsData.templates);
	
	// Парсим шаблонные юниты
	tacticsData.unitTemplates = new Army(tacticsData.unitTemplates);
};

wTactics.prototype.prepareUnknownTactic = function(unknownTactic) {
	var tactics = this.data.tacticsData.tactics;
	
	if( unknownTactic ){
		if( !unknownTactic.getAccount() )
			var knownTactic = tactics.findEqualElem(unknownTactic);
		
		var tactic = knownTactic||unknownTactic;
		
		// Если не нашли совпадений создаем новую тактику
		if( !knownTactic ){
			if( !tactic.getName() )
				tactic.setName('Новый шаблон тактики');
			
			tactics.addElem(tactic);
		}
		
		tactic.setUpd(timeMgr.getNow());
		
		this.data.defTabName = 'edit';
	}
};

wTactics.prototype.useTactic = function(tactic, callback){
	var self = this;
	
	if( tactic === undefined ) return;
	
	if( this.getGroupId() !== undefined ){
		reqMgr.setTactic(this.getGroupId(), tactic.extractData(), function(resp){
			if( callback ) callback();
			
			self.close();
			
			if( !resp.error )
				notifMgr.runEvent(Notif.ids.eventArmy);
		});
	}
	
	if( this.getCallback() ){
		this.getCallback()(tactic);
		
		if( callback ) callback();
		
		this.close();
	}
};

wTactics.prototype.getGroupId = function() {
	return this.data.groupId;
};

wTactics.prototype.getCallback = function() {
	return this.data.callback;
};

wTactics.prototype.canUseTactic = function() {
	return this.getGroupId() || this.getCallback();
};



/******
 * Вкладка list
 */

tabTacticsList = function(){
    this.name = 'list';
	this.tabTitle = 'Перечень';
	
	tabTacticsList.superclass.constructor.apply(this, arguments);
};

utils.extend(tabTacticsList, Tab);

tabTacticsList.prototype.getData = function(){
	this.data = {};
	
	this.data.tactics = this.parent.data.tacticsData.tactics;
	this.data.mustSaveBeforeUse = this.parent.data.mustSaveBeforeUse;
	
    this.dataReceived();
};

tabTacticsList.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accTacticsChange, Notif.ids.accBonus];
};

tabTacticsList.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
			// Добавить новую тактику
			.on('click', '.view-tactics-listItem.-addNewTactic', function(){
				self.parent.tabs.openTab('edit').cont
												.find('.view-tactics-editMain-addNewTactic')
												.trigger('click');
			})
			// Выбрать элемент
			.on('click', '.view-tactics-listItem', function(){
				if( $(this).hasClass('-active') || $(this).hasClass('-tagging') ){
					$(this).removeClass('-tagging');
					
					return;
				}	
				
				self.cont.find('.view-tactics-listItem.-active').removeClass('-active');

				$(this).addClass('-active');
			})
			// Редактировать тактику
			.on('click', '.view-tactics-listItemOption.-editTactic', function(){
				self.parent.tabs.openTab('edit').cont
												.find('.view-tactics-editMain-tacticNameWrp[data-index="' + $(this).parent().data('index') + '"]')
												.removeClass('-active')
												.trigger('click');
			})
			// Удалить тактику
			.on('click', '.view-tactics-listItemOption.-deleteTactic', function(){
				wndMgr.addConfirm().onAccept = function(){
					self.parent.children.edit.deleteTactic($(this).parent().data('index'), function(){
						self.show();
					});
				}.bind(this);
			})
			// Использовать тактику
			.on('click', '.js-useTactic', function(){
				if( !self.parent.data.noTacticsChange ){
					var tactic = self.data.tactics.getElem($(this).parents('.view-tactics-listItem').data('index'));
					
					self.parent.useTactic(tactic);
				}

				return false;
			})
			// Прекращение дальнейшей обработки нажатия при клике по тегу (блокировка появления кнопок) 
			.on('click', '.view-tactics-listItemNameTag', function(){
				$(this).closest('.view-tactics-listItem').addClass('-tagging');
			});
};

tabTacticsList.prototype.afterDraw = function(){
	this.initScroll({scrollbarPosition: 'outside'});
	
	this.checkUseTactic();
};

tabTacticsList.prototype.getScrollTag = function(){
	return this.cont;
}; 


tabTacticsList.prototype.checkUseTactic = function(){
	if( this.parent.canUseTactic() )
		this.cont.find('.view-tactics-listItemRulesArmy').addClass('-canHide'); // Если отображается кнопка использовать - правила скрываются
	else
		this.cont.find('.view-tactics-listItemOption.-useTactic').remove();

	if( this.parent.data.noTacticsChange ){
		this.cont.find('.js-useTactic').addClass('-disabled');

		this.cont.find('.js-useTacticAlert').html( snip.alert('Нельзя изменить тактику во время боя') );
	}
};



/******
 * Вкладка edit
 */

tabTacticsEdit = function(){
    this.name = 'edit';
	this.tabTitle = 'Редактирование';
	
	tabTacticsEdit.superclass.constructor.apply(this, arguments);
	
	this.options.clearData = false;
};

utils.extend(tabTacticsEdit, Tab);

tabTacticsEdit.prototype.getData = function(){
	this.data.canUseTactic = this.parent.canUseTactic();
	
	this.data.tactics = this.parent.data.tacticsData.tactics;
	this.data.templates = this.parent.data.tacticsData.templates;
	this.data.unitTemplates = this.parent.data.tacticsData.unitTemplates;
	this.data.noTacticsChange = this.parent.data.noTacticsChange;
	this.data.mustSaveBeforeUse = this.parent.data.mustSaveBeforeUse;
	
	if( !this.data.activeTactic )
		this.data.activeTactic = this.data.tactics.getLastUpd();
	
	if( this.data.activeTactic )
		this.data.activeTactic.active = true;
	
    this.dataReceived();
};

tabTacticsEdit.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accTacticRestore, Notif.ids.accBonus];
	
	this.notif.other[Notif.ids.accTacticsChange] = function(data){
		data = data||{};
		
		if( data.canSaveTactic !== undefined )
			this.setCanSaveTactic(data.canSaveTactic);
		if( data.canUseTactic !== undefined )
			this.setCanUseTactic(data.canUseTactic);
		
		this.checkCanAddTactic();
	};
};

tabTacticsEdit.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		// Добавить новую тактику
		.on('click', '.view-tactics-editMain-addNewTactic', function(){
			// Проверяем. Если были изменения в ранее выбранной тактике то уведомляем пользователя о возможной потере данных и предлагаем сохранить изменения.
			self.checkTacticChanges(function(){
				// Проверяем на переполнение стека тактик
				if( self.data.tactics.isMaxOverflow() ) {
					wndMgr.addWnd(wNoPremium).beforeClose = function(result){
						if( result ){
							self.data.newTacticRequestPremium = true;
							
							setTimeout(function(){
								delete self.data.newTacticRequestPremium;
							}, 5000);
						}
					};
					
					return;
				}
				
				var tactic = self.data.tactics.getLastElem(); // Индекс новой тактики (всегда в конце массива)
				
				// Проверяем есть ли уже созданная "новая тактика"
				if( !tactic || tactic.getId() ){
					tactic = self.getNewTactic();
					
					self.data.tactics.addElem(tactic);
					
					self.cont.find('.view-tactics-editMain-tacticList').append(tmplMgr.tactics.tacticName({tactic:tactic}));
				}
				else{
					// Если новая тактика ранее была активной, сбрасываем активность (чтобы избежать редактирования имени). Также устанавливаем имя заново, т.к. оно могло быть изменено ранее
					if( !self.data.activeTactic || self.data.activeTactic.getIndex() == tactic.getIndex() )
						self.cont.find('.view-tactics-editMain-tacticNameWrp.-active').removeClass('-active');			
				}
				
				self.cont.find('.view-tactics-editMain-tacticNameWrp[data-index="' + tactic.getIndex() + '"]').trigger('click');
			});
		})
		// Удалить тактику
		.on('click', '.view-tactics-editMain-deleteTactic', function(){
			wndMgr.addConfirm().onAccept = function(){
				self.deleteTactic($(this).parent().data('index'));
			}.bind(this);
			
			return false;
		})
		// Выбрать тактику для редактирования
		.on('click', '.view-tactics-editMain-tacticNameWrp', function(e){
			var $this = $(this);
			
			// Если текущая вкладка уже активна
			if( $this.hasClass('-active') ){
				// Если редактируется имя тактики не обрабатываем клики
				if( $this.hasClass('-nameEditing') ) 
					return false;

				var tacticName = self.data.activeTactic.getName(),
					$tacticNameEdit = $(tmplMgr.tactics.tacticNameEdit({name: tacticName}));
				
				$this.find('.view-tactics-editMain-tacticName').html($tacticNameEdit);
				
				$tacticNameEdit.data('tacticName', tacticName);
				
				self.setFocusToElem($tacticNameEdit);
				
				$this.addClass('-nameEditing');
				
				self.updTacticsListScroll($this, {$nameEdit: $tacticNameEdit});
				
				return false;
			}
			else{
				// Проверяем. Если были изменения в ранее выбранной тактике то уведомляем пользователя о возможной потере данных и предлагаем сохранить изменения.
				self.checkTacticChanges(function(){
					self.cont
						.find('.view-tactics-editMain-tacticNameWrp.-active')
						.removeClass('-active')
						.attr('data-title', 'Перейти к этой тактике');
					
					$this.addClass('-active');
					
					if( self.data.activeTactic ) 
						delete self.data.activeTactic.active;
					
					self.data.activeTactic = self.data.tactics.getElem($this.data('index'));
					
					self.data.activeTactic.active = true;
					
					self.showActiveTactic();
					
					self.updTacticsListAsync(function(){
						this.updTacticsListScroll($this);
					}, 300);
					
					self.setCanUseTactic(true);
				});
			}
			
			return false;
		})
		// Выход из режима редактирования имени
		.on('focusout', '.view-tactics-editMain-tacticNameEdit', function(){
			var $this = $(this);
			
			self.setTimeout(function(){
				var $tacticNameWrp = $this.closest('.view-tactics-editMain-tacticNameWrp');
				
				$tacticNameWrp.removeClass('-nameEditing');
				
				$tacticNameWrp.find('.view-tactics-editMain-tacticName').html($this.data('tacticName'));
				
				this.updTacticsListScroll($tacticNameWrp);
			}, 100);
			
			return false;
		})
		// Сохранить имя тактики
		.on('mousedown', '.view-tactics-editMain-saveTacticName', function(){
			var $newNameEdit = $(this).parent().find('.view-tactics-editMain-tacticNameEdit'),
				newName = $newNameEdit.val();
			
			if( $newNameEdit.data('tacticName') != newName ){
				self.data.activeTactic.setName(newName);
				
				$newNameEdit.data('tacticName', newName);
				
				self.setCanSaveTactic(true);
			}
		})
		// Добавить новую волну
		.on('click', '.view-tactics-editMain-addNewWave', function(){
			var $this = this,
				wave = self.getNewWave();
			
			self.editWRTR('Создание нового отряда', wave, function(){
				self.addNewWave(wave);

				if( self.data.activeTactic.getWaves().getLength() >= lib.war.tactics.maxwaves )
					$this.hide().droppable('disable');
			});
		})
		// Редактировать волну
		.on('click', '.view-tactics-editMain-waveData', function(){
			var $this = $(this),
				wave = self.data.activeTactic.getWaves().getElem($this.parent().data('index'));
			
			self.editWRTR('Редактирование отряда', wave, function(){
				$this.closest('.view-tactics-editMain-wave').html(tmplMgr.tactics.wave.cont({wave:wave}));
					
				self.setCanSaveTactic(true);
			});
		})
		// Удалить волну
		.on('click', '.view-tactics-editMain-deleteWave', function(){
			wndMgr.addConfirm().onAccept = function(){
				var index = $(this).parent().data('index');
				
				var delWave = self.deleteWave(index);
				
				self.shiftWavesRange((index-1), delWave.range.start, delWave.range.end, true);
				
				self.cont.find('.view-tactics-editMain-wavesWrp').html(tmplMgr.tactics.waves({waves:self.data.activeTactic.getWaves()}));
				
				self.setCanSaveTactic(true);
				
				if( self.data.activeTactic.getWaves().getLength() < lib.war.tactics.maxwaves )
					self.cont.find('.view-tactics-editMain-addNewWave').show().droppable('enable');
				
			}.bind(this);
		})
		// Изменить диапазон волны
		.on('click', '.view-tactics-editMain-waveRange', function(){
			var index = $(this).parent().data('index'),
				wave = self.data.activeTactic.getWaves().getElem(index),
				range = wave.range.val ? (wave.range.val + 1) : 1,
				maxVal = Math.min(wTactics.maxWaveRange, utils.toInt((range*0.1)*10 + 10));
			
			wndMgr.addModal(tmplMgr.tactics.wave.range(), {
				callbacks: {
					bindEvent: function(){
						var wnd = this;
						
						this.wrp
							.on('click', '.js-saveWaveRange', function(){
								var waveRange = wnd.wrp.find('.view-tactics-editMain-waveRangeCounter').text() - 1;
								
								if( waveRange != wave.range.val ){
									wave.range.val = waveRange;
									wave.data.count = waveRange + 1;
									wave.range.end = waveRange ? wave.range.start + waveRange : undefined;
									
									self.shiftWavesRange(index, wave.range.start, wave.range.end);
									
									self.setCanSaveTactic(true);
								}
								
								wnd.close();
								
								self.wrp.find('.view-tactics-editMain-wavesWrp').html(tmplMgr.tactics.waves({waves: self.data.activeTactic.getWaves()}));
							});
					},
					afterDraw: function(){
						snip.sliderHandler(this.wrp.find('.view-tactics-editMain-waveRangeSlider'), {
							min: 1,
							max: maxVal,
							step: 1,
							value: range,
							create: function( event, ui ) {
								$(this).find('a').html('<span class="view-tactics-editMain-waveRangeCounter">' + range + '</span>');
							},
							slide: function( event, ui ) {
								$(this).find('.view-tactics-editMain-waveRangeCounter').text(ui.value);
							},
							change: function( event, ui ) {
								if( ui.value >= maxVal ){
									maxVal = Math.min(wTactics.maxWaveRange, maxVal*=2);

									$(this).slider('option', 'max', maxVal);
								}
							}
						});
					}
				}
			});
		})
		// Сохранить тактику в буфер
		.on('click', '.js-saveTactic', function(){
			if( !self.data.canSaveTactic || self.data.saving )
				return false;
			
			self.setSaving(true);
				
			self.loaderId = contentLoader.start( 
				$(this), 
				0, 
				function(){
					self.saveTacticChanges(function(){
						self.loaderId = contentLoader.stop(self.loaderId);

						// Если после сохранения тактики их количество больше одной, возвращаем кнопку удалить у первой тактики
						if( self.data.tactics.getLength() > 1 ){
							self.cont.find('.view-tactics-editMain-oneTactic').remove();
						}
					}.bind(this));
				}.bind(this),
				{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}, callback:function(){self.setSaving(false);}} 
			);

		})
		// Использовать тактику
		.on('click', '.js-useTactic', function(){
			if( self.data.canUseTactic ){
				var $this = $(this);
				
				self.checkTacticChanges(function(){
					self.loaderId = contentLoader.start( 
						$this, 
						0, 
						function(){
							self.useTactic(function(){
								self.loaderId = contentLoader.stop(self.loaderId);

								self.setCanSaveTactic(false);
							});
						},
						{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}}
					);
					
				}, true, self.data.mustSaveBeforeUse);
			}
			
			return false;
		})
		// Добавить новое правило
		.on('click', '.view-tactics-editMain-addNewRule', function(){
			var rule = self.getNewRule();
			
			self.editWRTR('Создание нового правила', rule, function(){
				self.addNewRule(rule);
			});
		})
		// Выделение правила
		.on('click', '.view-tactics-editMain-rule', function(){
			if( $(this).hasClass('-active') )
				return false;
			
			self.cont.find('.view-tactics-editMain-rule.-active').removeClass('-active');
			
			$(this).addClass('-active');
		})
		// Выделение шаблона
		.on('click', '.view-tactics-editTemplates-template', function(){
			
			if( $(this).hasClass('-active') )
				return false;
			
			self.cont.find('.view-tactics-editTemplates-template.-active').removeClass('-active');
			
			$(this).addClass('-active');
			
		})
		// Добавить волну в шаблон
		.on('click', '.view-tactics-editMain-appendToTemplate', function(){
			if( self.data.saving ) return false;
		
			self.setSaving(true);
			
			self.loaderId = contentLoader.start( 
				self.cont.find('.js-view-tactics-editTemplates'), 
				0, 
				function(){
					var wave = self.data.activeTactic.getWaves().getElem($(this).parent().data('index'));
					
					var template = self.getNewTemplate(wave);
					
					self.saveTemplate(template, function(){
						self.loaderId = contentLoader.stop(self.loaderId);
						
						self.addNewTemplate(template);
					});
				}.bind(this),
				{callback:function(){self.setSaving(false);}} 
			);
			
		})
		// Редактирование шаблона/правила 
		.on('click', '.-editTemplate, .-editRule', function(){
			if( $(this).hasClass('-editRule') ){
				var $rule = $(this).parent(),
					rule = self.data.activeTactic.getRules().getElem($rule.data('index'));
				
				self.editWRTR('Редактирование правила', rule, function(){
					$rule.find('.view-tactics-editMain-ruleData').html(tmplMgr.tactics.rule.data({rule:rule}));
					
					self.setCanSaveTactic(true);
				});
			}
			else{
				var $template = $(this).parent(),
					template = self.data.templates.getElem($template.data('index'));
				
				self.editWRTR('Редактирование шаблона', template, function(){
					if( template.getConds().getLength() )
						$template.addClass('js-hasRule');
					
					$template.find('.view-tactics-editTemplates-templateData').html(tmplMgr.tactics.template.data({template:template}));
				});
			}
		})
		// Удаление шаблона/правила
		.on('click', '.-deleteTemplate, .-deleteRule', function(){
			wndMgr.addConfirm().onAccept = function(){
				var index = $(this).parent().data('index');
				
				if( $(this).hasClass('-deleteRule') ){
					self.deleteRule(index);
					
					if( self.data.activeTactic.getRules().getLength() < lib.war.tactics.maxrules )
						self.cont.find('.view-tactics-editMain-rulesWrp').droppable('enable');
					
					var $rules = self.cont.find('.view-tactics-editMain-rules');
					
					$rules.html(tmplMgr.tactics.rules({rules:self.data.activeTactic.getRules()}));
					// Реинитим драг
					self.initDraggable($rules.find('.view-tactics-editMain-rule'), {
						appendTo: self.getDragAppendTo(),
						helper: 'clone',
						handle: '.view-tactics-editMain-ruleData',
						opacity: 0.7,
						zIndex: 15,
						revert: true,
						distance: 3,
						containment: self.getDragContainment()
					});
					
					self.setCanSaveTactic(true);
				}
				else{
					if( self.data.saving ) 
						return false;
		
					self.setSaving(true);
					
					self.loaderId = contentLoader.start( 
						self.cont.find('.js-view-tactics-editTemplates'), 
						0, 
						function(){
							self.deleteTemplate(self.data.templates.getElem(index), function(){
								self.loaderId = contentLoader.stop(self.loaderId);
								self.cont.find('.view-tactics-editTemplates-templateList').html(tmplMgr.tactics.templates({templates:self.data.templates}));
								// Реинитим ДД
								self.initDraggable(self.cont.find('.view-tactics-editTemplates-template'), {
									appendTo: self.getDragAppendTo(),
									helper: 'clone',
									opacity: 0.7,
									zIndex: 15,
									revert: true,
									distance: 3,
									containment: self.getDragContainment()
								});
							});
						}.bind(this),
						{callback:function(){self.setSaving(false);}} 
					);
				}
				
			}.bind(this);
		})
		// Редактировать резерв
		.on('click', '.view-tactics-editMain-reserve2Wrp', function(){
			var $this = $(this);
			
			self.editWRTR('Войска второго резерва', self.data.activeTactic.getReserve2(), function(){
				$this.find('.view-tactics-editMain-reserve2').html(tmplMgr.tactics.reserve2({reserve2:self.data.activeTactic.getReserve2()}));
				
				self.setCanSaveTactic(true);
			});
		})
		// Редактирование юнито-мест отряда
		.on('input', '.view-tactics-editMain-upls', function(event){
			var $wave = $(this).parents('.view-tactics-editMain-wave'),
				wave = self.data.activeTactic.getWaves().getElem($wave.data('index'));
			
			utils.checkInputInt(this, {max: 1000, min: 10, manualInput: !event.isTrigger});
			
			wave.setUpls($(this).val() * 0.01);
			
			$(this).parent().toggleClass('cl-grey', utils.formatNum(wave.getUpls(), {toPercent:true, epsilon:true, int:true}) == utils.formatNum(wTactics.uplsDef, {toPercent:true}));
			
			$wave.find('.view-tactics-editMain-waveData').html(tmplMgr.tactics.wave.data({wave:wave}));
			
			self.setCanSaveTactic(true);
		});
		
		snip.input1Handler(this.wrp, {spinbox: {}});
};

tabTacticsEdit.prototype.cacheCont = function(){
	tabTacticsEdit.superclass.cacheCont.apply(this, arguments);
	
	this.$shadow = this.cont.find('.view-tactics-editShadow');
};

tabTacticsEdit.prototype.afterDraw = function(){
	// Если тактика не своя, разришаем сохранение
	// Если окно перерисовало себя, восстанавливаем состояние
	var wasCanSaveTactic = this.data.canSaveTactic;
	
	delete this.data.canSaveTactic;
	
	this.setCanSaveTactic(!!(this.data.activeTactic && (!this.data.activeTactic.getId() || wasCanSaveTactic)), true);
	
	if( this.data.canUseTactic )
		this.setCanUseTactic(!this.parent.data.unknownTactic); // Если уже установленной тактики нет, включаем возможность устоновить тактику сразу
	
	this.initScroll();
	
	this.initDragAndDrop();
	
	this.checkCanAddTactic();
};


tabTacticsEdit.prototype.updTacticsListAsync = function(callback, delay){
	this.clearTimeout(this.updTacticsListTO);
	
	this.updTacticsListTO = this.setTimeout(function(){
		callback.call(this);
	}, delay||300);
};


tabTacticsEdit.prototype.initScroll = function(){
    IScroll.add(this.cont.find('.js-scroll-wrp'));

    IScroll.add(this.cont.find('.activeTactic-scroll-block'), {
        scrollbarPosition: 'outside'
    });

    this.tacticsListScroll = IScroll.add(this.cont.find('.view-tactics-editMain-tacticListScroll'), {
        axis: 'x',
        scrollbarPosition: 'outside'
    });
};

tabTacticsEdit.prototype.updTacticsListScroll = function($elem, opt){
    opt = opt||{};

    if( !this.tacticsListScroll || !$elem )
        return;

    var scrollArea = this.tacticsListScroll.getScrollArea(),
        elem = $elem.get(0);

    var needScroll = opt.onTabOpen && !this.alreadyScrolledOnTabOpen;

    if( needScroll )
        return this.scrollTacticsList($elem);

    var outerWidth = $elem.outerWidth(true);
    // Не листаем скролл, если блок полностью вмещается в клиентскую область скролл
    if( (elem.offsetLeft + 1) > scrollArea.scrollLeft && elem.offsetLeft + outerWidth < (scrollArea.scrollLeft + scrollArea.clientWidth + 1) )
        return;

    var val;

    if( scrollArea.scrollLeft > elem.offsetLeft )
        val = $elem;
    else{
        // Вычисляем какая часть блока скрыта за правой стороной 
        var hiddenWidth = outerWidth - ((scrollArea.scrollLeft + scrollArea.clientWidth) - elem.offsetLeft);

        val = scrollArea.scrollLeft + hiddenWidth;
    }

    this.scrollTacticsList(val);
};

    tabTacticsEdit.prototype.scrollTacticsList = function(val){
        this.tacticsListScroll.update();

        this.tacticsListScroll.scrollTo(val, {scrollInertia: 300});
    };

tabTacticsEdit.prototype.afterOpenTab = function(){
    this.updTacticsListAsync(function(){
        this.updTacticsListScroll(this.tacticsListScroll.$getCont().find('.-active'), {onTabOpen: true});
    });
};


tabTacticsEdit.prototype.initDragAndDrop = function(){
	var self = this;
	
	this.initSortable(this.cont.find('.view-tactics-editMain-rules'), {
		revert: false,
		items: '> .view-tactics-editMain-rule',
		handle: '.view-tactics-editMain-ruleSorter',
		tolerance: 'pointer',
		update: function() {
			var tmpRules = new TacticRulesList(),
				lastRule;

			$(this).find('> .view-tactics-editMain-rule').each(function(index){
				var rule = self.data.activeTactic.getRules().getElem($(this).data('index'));

				tmpRules.addElem(rule);

				lastRule = this;

				$(this).data('index', index).attr('data-index', index);
			});

			$(lastRule).before( $(this).find('.js-lastRule') );

			self.data.activeTactic.setRules(tmpRules);

			self.setCanSaveTactic(true);
		}
	});
	
	this.initSortable(this.cont.find('.view-tactics-editMain-wavesWrp'), {
		tolerance: 'pointer',
		update: function() {
			var tmpWaves = new TacticWavesList(),
				nextStart = 1,
				range;

			$(this).find('> .view-tactics-editMain-wave').each(function(index){
				var wave = self.data.activeTactic.getWaves().getElem($(this).data('index'));
				
				range = wave.clacRange(nextStart);
				
				nextStart = wave.getRangeLimit();
				
				tmpWaves.addElem(wave);
				
				$(this).data('index', index).attr('data-index', index);
				$(this).find('.view-tactics-editMain-waveRange').html(range.start + (range.end ? '-' + range.end : ''));
			});
			
			self.data.activeTactic.setWaves(tmpWaves);
			
			self.setCanSaveTactic(true);
		}
	});
	
	var opt = {
		appendTo: self.getDragAppendTo(),
		helper: 'clone',
		opacity: 0.7,
		zIndex: 15,
		revert: true,
		distance: 3,
		containment: self.getDragContainment()
	};
	
	this.initDraggable(this.cont.find('.view-tactics-editTemplates-template'), opt);
	
	opt.handle = '.view-tactics-editMain-ruleData';
	
	this.initDraggable(this.cont.find('.view-tactics-editMain-rule'), opt);
	
	this.cont.find('.view-tactics-editMain-addNewWave').droppable({
		accept: '.view-tactics-editTemplates-template',
		drop: function( event, ui ) {
			var template = self.data.templates.getElem(ui.draggable.data('index'));
			var wave = self.getNewWave(template);
			self.addNewWave(wave);
		},
		activate: function() {
			$(this).css({zIndex: 15, background:'rgba(200, 200, 200, 0.9)'});
			
			self.toggleShadow(true);
		},
		deactivate: function() {
			$(this).removeAttr('style');
			
			self.toggleShadow(false);
			
			if( self.data.activeTactic.getWaves().getLength() >= lib.war.tactics.maxwaves )
				$(this).hide().droppable('disable');
		},
		disabled : (!self.data.activeTactic || self.data.activeTactic.getWaves().getLength() >= lib.war.tactics.maxwaves)
	});
	this.cont.find('.view-tactics-editMain-rulesWrp').droppable({
		accept: '.view-tactics-editTemplates-template.js-hasRule',
		drop: function( event, ui ) {
			var template = self.data.templates.getElem(ui.draggable.data('index'));
			var rule = self.getNewRule(template);

			if( !self.hasRule(rule) ) self.addNewRule(rule);
		},
		activate: function() {
			$(this).css({zIndex: 15, background:'rgba(255, 255, 255, 0.8)'});
			
			self.toggleShadow(true);
		},
		deactivate: function() {
			$(this).removeAttr('style');
			
			self.toggleShadow(false);
		},
		disabled : (!self.data.activeTactic || self.data.activeTactic.getRules().getLength() >= lib.war.tactics.maxrules)
	});
	this.cont.find('.view-tactics-editTemplates-templateList').droppable({
		accept: '.view-tactics-editMain-rule',
		drop: function(event, ui) {
			if( self.data.saving ) return false;

			self.setSaving(true);

			self.loaderId = contentLoader.start( 
				self.cont.find('.js-view-tactics-editTemplates'), 
				0, 
				function(){
					var rule = self.data.activeTactic.rules.getElem(ui.draggable.data('index'));
					
					var template = self.getNewTemplate(rule);
					
					self.saveTemplate(template, function(){
						self.loaderId = contentLoader.stop(self.loaderId);
						
						self.addNewTemplate(template);
					});
				}.bind(this),
				{callback:function(){self.setSaving(false);}} 
			);
		},
		activate: function(event, ui) {
			ui.helper.find('.view-tactics-editMain-ruleArrow').hide();
			
			if( ui.helper.prevObject ){
				$(this).css({zIndex: 15, background:'rgba(255, 255, 255, 0.8)'});
				
				self.toggleShadow(true);
			}
			else
				ui.helper.addClass('-dragging');
		},
		deactivate: function(event, ui) {
			if( ui.helper.prevObject ){
				$(this).removeAttr('style');
				
				self.toggleShadow(false);
			}
			else{
				ui.helper.find('.view-tactics-editMain-ruleArrow').show();
				
				ui.helper.removeAttr('style').removeClass('-dragging');
			}
		}
	});
};

tabTacticsEdit.prototype.initSortable = function($el, opt){
	return $el.sortable(opt);
};

tabTacticsEdit.prototype.initDraggable = function($el, opt){
	return $el.draggable(opt);
};

	tabTacticsEdit.prototype.getDragAppendTo = function(){
		return this.cont.find('.view-tactics-editWrp');
	};
	
	tabTacticsEdit.prototype.getDragContainment = function(){
		return this.cont.find('.view-tactics-editWrp');
	};

tabTacticsEdit.prototype.toggleShadow = function(toggle){
	this.$shadow.toggleClass('-active', toggle);
};

tabTacticsEdit.prototype.setSaving = function(state){	
	if( this.data.saving != state ){
		this.data.saving = state;
		
		this.cont.find('.js-view-tactics-editSaving').toggleClass('-active', state);
	}
};

// Задает состояние - можно ли сохранить текущую активную тактику
tabTacticsEdit.prototype.setCanSaveTactic = function(state, init){
	var isMaxOverflow = this.data.tactics.isMaxOverflow(true),
		isEmpty = !this.data.activeTactic || this.data.activeTactic.isEmpty();
	
	if( state && !isEmpty && !this.data.mustSaveBeforeUse )
		this.setCanUseTactic(state);
	
	if( isEmpty || isMaxOverflow ) state = false;
	
	if( this.data.mustSaveBeforeUse ){
		this.setCanUseTactic(state);
		
		this.cont.find('.view-tactics-editMain-useTactic-wrp').html(state?'Сохранить и использовать':'Использовать');
	}
	
	if( this.data.canSaveTactic != state ){
		this.data.canSaveTactic = state;
		
		this.cont.find('.js-saveTactic').toggleClass('-disabled', !state);
	}
	
	this.cont.find('.view-tactics-editMain-saveTacticAlertWrp').toggleClass('-type-active', isMaxOverflow).html(isMaxOverflow ? tmplMgr.alert.tactics.overflow({count:this.data.tactics.getMaxOverflowCount()}) : '');
};

// Задает состояние - можно ли применить текущую активную тактику
tabTacticsEdit.prototype.setCanUseTactic = function(state){
	if( !this.data.activeTactic || this.data.activeTactic.isEmpty() || this.data.noTacticsChange ) state = false;
	
	if( this.data.canUseTactic != state ){
		this.data.canUseTactic = state;
		
		this.cont.find('.js-useTactic').toggleClass('-disabled', !state);
	}
};

// Проверка на возможность создания новой тактики
tabTacticsEdit.prototype.checkCanAddTactic = function(){
	var show = true,
		$addNewTactic = this.cont.find('.view-tactics-editMain-addNewTactic');
	
	if( !this.data.tactics.getLength() ) {
		show = false;
		
		// Если в списке не оказалось тактик, скрываем кнопку добавления и создаем новую тактику
		$addNewTactic.trigger('click');
	}
	else if( this.data.tactics.isMaxOverflow() ){
		if( wofh.account.isPremium() )
			show = false;
		else
			$addNewTactic.attr('data-title', 'Увеличить хранилище тактик');
	}
	
	$addNewTactic.toggleClass('-hidden', !show);
	
	this.parent
		.tabs
		.getTab('list')
		.cont
		.find('.view-tactics-listItem.-addNewTactic')
		.toggleClass('-hidden', !show);
	
	// Если была попытка активации ЦА при добавлении новой тактики, открываем новую тактику после получения ЦА.
	if(	this.data.newTacticRequestPremium ){
		delete this.data.newTacticRequestPremium;
		
		if( show )
			$addNewTactic.trigger('click');
	}
};

// Проверяет были ли изменения активной тактики и если да показывает подтверждалку (срабатывает при смене активной тактики, закрытии окна и т.п.)
tabTacticsEdit.prototype.checkTacticChanges = function(callback, notRollBack, noCheck){
	var self = this;
	
	if( this.data.canSaveTactic && !noCheck ){
		wndMgr.addConfirm('Все не сохраненные изменения в шаблоне будут утеряны. Продолжить?').onAccept = function(){
			// Если истина, не нужно откатываться к начальному состоянию тактики (к примеру в случае если не прошел запрос на использование тактики)
			if( !notRollBack )
				self.restoreTacticChanges(self.data.activeTactic, callback);
			else if( callback )
				callback(true);
		};
	}
	else if( callback ){
		callback();
	}
};

tabTacticsEdit.prototype.restoreTacticChanges = function(tactic, callback){
	var self = this;
	
	var _restoreTactic = function(unmodifiedTactiс){
		unmodifiedTactiс.active = true;
		
		self.data.activeTactic = self.data.tactics.insertElem(tactic.getIndex(), unmodifiedTactiс);
		
		// Откатываем имя тактики в интерфейсе
		self.cont.find('.view-tactics-editMain-tacticNameWrp.-active .view-tactics-editMain-tacticName').text(self.data.activeTactic.getName());
		
		self.showActiveTactic();
		
		self.setCanSaveTactic(false);
		
		if( callback ) callback(true);
	};
	
	if( tactic.getId() ){
		self.setSaving(true);
		
		var loaderId = contentLoader.start( 
			self.parent.cont, 
			300, 
			function(){
				reqMgr.getTactic(tactic.getId(), tactic.getSecret(), function(unmodifiedTactiс){
					contentLoader.stop(loaderId);
					
					unmodifiedTactiс.setId(tactic.getId());
					
					_restoreTactic(unmodifiedTactiс);
				});
			},
			{callback:function(){self.setSaving(false);}}
		);
	}
	else
		_restoreTactic(self.getNewTactic());
};

// Cохранить изменения выбранной (активной) тактики
tabTacticsEdit.prototype.saveTacticChanges = function(callback){
	var self = this;
	
	if( !this.data.activeTactic ){
		if( callback ) callback();
		
		return false;
	}
	
	this.saveTactic(this.data.activeTactic, function(){
		self.setCanSaveTactic(false);
		
		if( callback ) callback();
	});
};

tabTacticsEdit.prototype.showActiveTactic = function(){
	this.cont.find('.view-tactics-editMain-tacticData').html(tmplMgr.tactics.tactic.data({tactic:this.data.activeTactic}));
	
	this.afterShowActiveTactic();
};
	
	tabTacticsEdit.prototype.afterShowActiveTactic = function(){
		this.initDragAndDrop();
		
		snip.spinboxHandler(this.cont);
	};
	
tabTacticsEdit.prototype.getNewTactic = function(){
	var tactic = new Tactic();
	
	tactic.setName('Новый шаблон тактики');
	
	return tactic;
};

tabTacticsEdit.prototype.saveTactic = function(tactic, callback){
	reqMgr.storeTactic(tactic.getId(), tactic.getName(), tactic.extractData(), function(resp){
		if( resp && resp.data ){
			if( resp.data.id )
				tactic.setId(resp.data.id);
			
			if( resp.data.secret )
				tactic.setSecret(resp.data.secret);
		}
		
		if( callback ) callback();
		
		notifMgr.runEvent(Notif.ids.accTacticsChange, {canSaveTactic:false});
	});
};

tabTacticsEdit.prototype.useTactic = function(callback){
	var self = this;
	
	if( this.data.mustSaveBeforeUse && self.data.canSaveTactic )
		this.saveTacticChanges(function(){
			self.parent.useTactic(self.data.activeTactic, callback);
		});
	else
		this.parent.useTactic(this.data.activeTactic, callback);
};

tabTacticsEdit.prototype.deleteTactic = function(index, callback){
	var self = this,
		tactic = self.data.tactics.getElem(index);

	if( !debug.isTest('later') && false ){
		if( self.data.tactics.getLength() < 2 )
			return false;
	}
	
	var _removeTactic = function(){
		var delTactic = self.data.tactics.deleteElem(tactic.getIndex());
		
		if( delTactic.active ){
			delete self.data.activeTactic;
			self.cont.find('.view-tactics-editMain-tacticData').html('');
		}

		self.cont.find('.view-tactics-editMain-tacticList').html(tmplMgr.tactics.namesList({tactics:self.data.tactics}));
		
		self.updTacticsListScroll();

		if( callback ) callback();
		
		notifMgr.runEvent(Notif.ids.accTacticsChange, {canSaveTactic:false, canUseTactic:false});
	};
	
	if( tactic.getId() ){
		if( this.data.saving ) 
			return false;
		
		self.loaderId = contentLoader.start( 
			this.wrp, 
			0, 
			function(){
				// Вызов может осуществляться со вкладки списка тактик, где нет класса view-tactics-editMain-deleteTactic:visible
				if( self.loaderId )
					this.setSaving(true);
				
				reqMgr.storeTactic(tactic.getId(), false, false, function(){
					self.loaderId = contentLoader.stop(self.loaderId);
					
					_removeTactic();
				});
			}.bind(this),
			{icon: ContentLoader.icon.small, cssPosition: {left: 8, top: 8}, callback:function(){self.setSaving(false);}} 
		);
	}
	else
		_removeTactic();
};

tabTacticsEdit.prototype.isMaxTacticsOverflow = function(strict){	
	if( this.data.tactics.isMaxOverflow(strict) ){
		if( wofh.account.isPremium() )
			wndMgr.addAlert(tmplMgr.alert.tactics.overflow({count:this.data.tactics.getMaxOverflowCount(), noPremium:true}));
		else
			wndMgr.addWnd(wNoPremium);
		
		return true;
	}
	
	return false;
};

// Работа с волнами
tabTacticsEdit.prototype.addNewWave = function(wave){
	this.data.activeTactic.getWaves().addElem(wave);
	
	var $wavesCont = this.cont.find('.view-tactics-editMain-wavesWrp').append(tmplMgr.tactics.wave({wave:wave}));
	
	snip.spinboxHandler($wavesCont); // Инитим spinbox для новой волны
	
	this.setCanSaveTactic(true);
};

tabTacticsEdit.prototype.getNewWave = function(tacticItem){
	var wave = new TacticWave();
		
	if( tacticItem )
		wave.setDataFrom(tacticItem);
	
	var lastWave = this.data.activeTactic.getWaves().getLastElem(),
		startRange = lastWave ? lastWave.getRangeLimit() : 1;
	
	wave.clacRange(startRange);

	wave.setIndex(this.data.activeTactic.getWaves().getLength());

	return wave;
};

tabTacticsEdit.prototype.deleteWave = function(index){
	return this.data.activeTactic.getWaves().deleteElem(index);
};

tabTacticsEdit.prototype.shiftWavesRange = function(index, start, end, isDelete){
	this.data.activeTactic.getWaves().shiftRanges(index, start, end, isDelete);
};

// Работа с правилами
tabTacticsEdit.prototype.addNewRule = function(tacticRule){
	this.data.activeTactic.getRules().addElem(tacticRule);

	var $rules = this.cont.find('.view-tactics-editMain-rules');

	$rules.html(tmplMgr.tactics.rules({rules:this.data.activeTactic.getRules()}));
	// Реинитим драг
	this.initDraggable($rules.find('.view-tactics-editMain-rule'), {
		appendTo: this.cont.find('.view-tactics-editWrp'),
		helper: 'clone',
		handle: '.view-tactics-editMain-ruleData',
		opacity: 0.7,
		zIndex: 15,
		revert: true,
		distance: 3,
		containment: this.cont.find('.view-tactics-editWrp')
	});

	if( this.data.activeTactic.getRules().getLength() >= lib.war.tactics.maxrules ){
		this.cont.find('.view-tactics-editMain-addNewRule').remove();
		this.cont.find('.view-tactics-editMain-rulesWrp').droppable('disable');
	}

	this.setCanSaveTactic(true);
};

tabTacticsEdit.prototype.getNewRule = function(tacticItem){
	var tacticRule = new TacticRule();
	
	if( tacticItem )
		tacticRule.setDataFrom(tacticItem);
	
	tacticRule.setIndex(this.data.activeTactic.getRules().getLength());
	
	return tacticRule;
};

tabTacticsEdit.prototype.deleteRule = function(index){
	return this.data.activeTactic.getRules().deleteElem(index);
};

tabTacticsEdit.prototype.hasRule = function(tacticRule){
	var has = this.data.activeTactic.getRules().hasRule(tacticRule);
	
	if( has )
		wndMgr.addAlert('Такое правило уже установлено!');
		
	return has;
};

// Работа с шаблонами
tabTacticsEdit.prototype.addNewTemplate = function(template){
	var self = this;
	
	this.data.templates.addElem(template);
	
	var $template = $(tmplMgr.tactics.template({template:template}));
		
	this.initDraggable($template, {
		appendTo: self.getDragAppendTo(),
		helper: 'clone',
		opacity: 0.7,
		zIndex: 15,
		revert: true,
		distance: 3,
		containment: self.getDragContainment()
	});
	
	this.cont.find('.view-tactics-editTemplates-templateList .js-emptyTemplate').before($template);
};

tabTacticsEdit.prototype.getNewTemplate = function(tacticItem){
	var tacticItemTemplate = new TacticItemTmpl();
	
	if( tacticItem )
		tacticItemTemplate.setDataFrom(tacticItem);
	
	tacticItemTemplate.setIndex(this.data.templates.getLength());
	
	return tacticItemTemplate;
};

tabTacticsEdit.prototype.saveTemplate = function(template, callback){
	servBuffer.temp.tacticsData.templates[template.getIndex()] = template.extractData();
	
	this.checkBufferSize(function(canSave){
		if( canSave ){
			this.saveServBuffer(function(){
				if( callback ) callback();
			});
		}
		else{ // Если нельзя сохранить, откатываемся к старому состоянию шаблона в буфере
			var originTemplate = servBuffer.serv.tacticsData.templates[template.getIndex()];
            
			if( originTemplate )
				servBuffer.temp.tacticsData.templates[template.getIndex()] = utils.clone(originTemplate);
			else
				servBuffer.temp.tacticsData.templates.splice(template.getIndex(), 1);
		}
	}.bind(this), 'template');
};

tabTacticsEdit.prototype.deleteTemplate = function(template, callback){
	if( !template )
        return false;
	
	var self = this;
	
	servBuffer.temp.tacticsData.templates.splice(template.getIndex(), 1);
	
	this.saveServBuffer(function(){
		self.data.templates.deleteElem(template.getIndex());
		
		if( callback ) callback();
	});
};

// Работа с шаблонными юнитами
tabTacticsEdit.prototype.saveUnitTemplates = function(unitTemplates, callback){
	servBuffer.temp.tacticsData.unitTemplates = unitTemplates.toString(true);

	this.checkBufferSize(function(canSave){
		if( canSave ){
			this.saveServBuffer(function(){
				if( callback ) callback();
			});
		}
		else{ // Если нельзя сохранить, откатываемся к старому состоянию шаблонных юнитов в буфере
			servBuffer.temp.tacticsData.unitTemplates = servBuffer.serv.tacticsData.unitTemplates;
		}
	}.bind(this), 'unitTemplate');
};

// WRTR - сокращение от waveOrRuleOrTemplateOrReserve, т.к. с точи зрения структурной организации это "почти" одна и тажк сущность
tabTacticsEdit.prototype.editWRTR = function(header, WRTR, callback){
	wndMgr.addWnd(wEditWRTR, '', {
		parentWnd: this,
		WRTR: WRTR,
		header: header,
		callback: callback,
		unitTemplates: this.data.unitTemplates
	});
};

tabTacticsEdit.prototype.checkBufferSize = function(callback, type){
	var self = this,
		tempBufferByteLength = servBuffer.getTempByteLength(),
		servBufferByteLength = servBuffer.getServByteLength();

	if( tempBufferByteLength > lib.account.storagesize ){
		this.loaderId = contentLoader.stop(this.loaderId);

		wndMgr.addAlert(tmplMgr.tactics.alertBufferSize({type:type, err:true}));

		callback(false);
	}
	else if( tempBufferByteLength > lib.account.storagesize * 0.9 && tempBufferByteLength > servBufferByteLength ){
		// Определяем нужно ли заблокировать элементы окна во время сохранения буфера
		if( this.data.saving )
			var needSaving = true;

		var loader = contentLoader.getLoader(this.loaderId); // Получаем экземпляр текущего loader'a
		this.loaderId = contentLoader.stop(this.loaderId); // Останавливаем его
		
		wndMgr.addConfirm(tmplMgr.tactics.alertBufferSize({type:type}), {
			okText: 'Сохранить', 
			rubber: true,
			callbacks: {
				onAccept: function(){
					if( needSaving )
						self.setSaving(true);

					self.loaderId = contentLoader.restart(loader); // Реинитим loader

					callback(true);
				},
				onCancel: function(){
					callback(false);
				}
			}
		});
	}
	else
		callback(true);
};

tabTacticsEdit.prototype.saveServBuffer = function(callback){
	servBuffer.apply(function(resp){
		if( callback ) callback();
		
		notifMgr.runEvent(Notif.ids.accTacticsChange);
	});
};

tabTacticsEdit.prototype.setFocusToElem = function($elem){
	$elem.focus().select();;
};



wEditWRTR = function(id, data){
	wEditWRTR.superclass.constructor.apply(this, arguments);
};

utils.extend(wEditWRTR, Wnd);


wEditWRTR.prepareData = function(id, data){
	data = data||{};
	
	if( !data.WRTR || !data.parentWnd )
		return false;
	
	data.originWRTR = data.WRTR;
	data.WRTR = data.originWRTR.clone();
	
	return data;
};


wEditWRTR.prototype.calcName = function(){
	return 'editWRTR';
};

wEditWRTR.prototype.getTmplData = function(){
	var data = this.data;
	
	data.army = data.WRTR.getArmy();
	data.maxPercent = 100;
	data.minPercent = 10;
	data.delta = 5;
	data.lastModified = undefined;;
	data.activeUnit = undefined;;
	data.canSave = false;
	data.canSaveTmplUnit = undefined;;
	data.tagFilter = "";

	data.army.maxLength = utils.toInt(data.maxPercent/data.minPercent);

	// Переопределение некотрых функций и переменных для работы с резервом
	if( data.WRTR.isReserve2() ){
		data.army.isReserve = true;
		data.delta = 10;

		delete data.army.maxLength;

		this.selectUnit = this.selectUnitR2;
		this.unSelectUnit = this.unSelectUnitR2;
		this.unitModify = this.unitModifyR2;
		this.stepUnitModify = this.stepUnitModifyR2;
	}
	else if( data.WRTR.isRule() || data.WRTR.isTemplate() ){
		data.ruleConds = data.WRTR.getConds();

		if( !data.ruleConds.getLength() )
			data.ruleConds.addElem(new TacticRuleCond());
	}

	// Данные шаблонов юнитов
	data.activeTmplUnit = undefined;
	data.unitTmplEditId = undefined;
	data.unitTmplEditMode = false;

	return data;
};
				
wEditWRTR.prototype.bindEvent = function(){
	var wnd = this;

	this.wrp
			.on('click', '.js-selectUnit', function(){
				var unitId = $(this).data('id');

				if( $(this).hasClass('-unitTemplate') ){
					if( wnd.data.unitTmplEditMode ){
						if( $(this).hasClass('-editing') )
							return false;

						var $prevEditingUnit = wnd.wrp.find('.view-tactics-editWave-unitsTemplates .-editing');
						var prevEditingUnitId = $prevEditingUnit.data('id');

						if( prevEditingUnitId !== undefined ){
							wnd.changeEditingTmplUnit(wnd.data.unitTemplates.getElem(prevEditingUnitId));
						}
						else{
							wnd.changeEditingTmplUnit(undefined, 'Создать шаблон');
						}

						$prevEditingUnit.removeClass('-editing');

						$(this).addClass('-editing');

						wnd.data.activeTmplUnit = new Unit(unitId);

						wnd.data.unitTmplEditId = unitId;

						wnd.wrp.find('.view-tactics-editWave-unitsSettingWrp').html(tmplMgr.tactics.unitsSetting(wnd.data.activeTmplUnit));

						wnd.setCanSaveTmplUnit(false);
					}
					else{
						if( $(this).hasClass('-selected') ) return false;

						var newUnit = new Unit(unitId);

						wnd.selectUnit(newUnit, function(){
							wnd.updateUnitsTamplate(false, wnd.data.tagFilter);
						}.bind(this));
					}
				}
				else{
					if( $(this).hasClass('-selected') ) return false;

					wnd.selectUnit(new Unit(unitId), function(){$(this).addClass('-selected');}.bind(this));
				}

			})
			.on('click', '.js-selectArmyUnit', function(){
				if( $(this).hasClass('-active') )
					return;

				wnd.wrp.find('.js-selectArmyUnit.-active').removeClass('-active');

				$(this).addClass('-active');

				wnd.data.activeUnit = wnd.data.army.getElem($(this).parent().data('id'));
			})
			.on('click', '.js-selectArmyUnit .-reduce', function(){
				if( wnd.data.activeUnit.getCount() - wnd.data.delta < wnd.data.minPercent ) return false;

				wnd.stepUnitModify(wnd.data.delta);

				return false;
			})
			.on('click', '.js-selectArmyUnit .-increase', function(){
				if( wnd.data.activeUnit.getCount() + wnd.data.delta > wnd.data.maxPercent ) return false;

				wnd.stepUnitModify(-wnd.data.delta);

				return false;
			})
			// Ручной ввод процентов
			.on('click', '.js-selectArmyUnit.-active .view-tactics-editWave-armyUnitPercent.-canChange', function(){
				var $this = $(this);

				if( $this.hasClass('js-percentSetting') )
					return false;

				$this.addClass('js-percentSetting');

				$this.html(tmplMgr.tactics.editWaveArmyUnitPercent({count:wnd.data.activeUnit.getCount()}));

				snip.spinboxHandler($this);

				// Костыль для FF
				wnd.setTimeout(function(){
					$this.find('.js-percentSet').focus().select();
				}, 50);

				return false;
			})
			.on('focusout', '.js-percentSet', function(){
				var count = +$(this).val(),
					maxVal = wnd.data.maxPercent - (wnd.data.WRTR.isReserve2() ? 0 : (wnd.data.army.getLength() - 1) * wnd.data.minPercent),
					minVal = wnd.data.minPercent;

				if( count > maxVal )
					count = maxVal;
				else if( count < minVal )
					count = minVal;

				$(this).closest('.view-tactics-editWave-armyUnitPercent').removeClass('js-percentSetting').html(tmplMgr.tactics.editWaveArmyUnitPercentText({percent:count}));

				wnd.stepUnitModify(wnd.data.activeUnit.getCount() - count);
			})
			// Проверка на ввод процентов
			.on('input', '.js-percentSet', function(){
				utils.checkInputInt(this, {max: wnd.data.maxPercent, min: 0});
			})
			.on('click', '.js-saveWaveArmy', function(){
				if( wnd.data.canSave ){
					if( wnd.data.WRTR.isEqual(wnd.data.originWRTR) ){
						wnd.close();

						return;
					}

					var _changeTacticItem = function(){
						delete wnd.data.army.maxLength;

						wnd.data.originWRTR.setArmy(wnd.data.army);
						if( wnd.data.WRTR.isRule() || wnd.data.WRTR.isTemplate() )
							wnd.data.originWRTR.setConds(wnd.data.ruleConds);
						wnd.data.originWRTR.setUpls(wnd.data.WRTR.getUpls());

						wnd.data.callback();

						wnd.close();
					};

					if( wnd.data.WRTR.isTemplate() ){
						wnd.parentWnd.loaderId = contentLoader.start( 
							wnd.wrp.find('.js-saveWaveArmy'), 
							0, 
							function(){
								wnd.parentWnd.saveTemplate(wnd.data.WRTR, function(){
									wnd.parentWnd.loaderId = contentLoader.stop(wnd.parentWnd.loaderId);

									_changeTacticItem();
								});
							},
							{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}} 
						);
					}
					else if( wnd.data.WRTR.isRule() ){
						if( !wnd.parentWnd.hasRule(wnd.data.WRTR) ) _changeTacticItem();
					}
					else
						_changeTacticItem();
				}
			})
			.on('click', '.js-selectArmyUnit .-deleteArmyUnit', function(){
				wnd.wrp.find('.js-selectArmyUnit.-active').removeClass('-active');

				wnd.unSelectUnit();
			})
			// Добавить шаблон юнита
			.on('click', '.js-addUnitTemplate', function(){
				if( $(this).hasClass('-editing') )
					return false;

				if( wnd.data.unitTmplEditMode ){
					wnd.data.activeTmplUnit = new Unit(-1);

					wnd.wrp.find('.view-tactics-editWave-unitsSettingWrp').html(tmplMgr.tactics.unitsSetting(wnd.data.activeTmplUnit));

					if( wnd.data.unitTmplEditId !== undefined ){
						wnd.changeEditingTmplUnit(wnd.data.unitTemplates.getElem(wnd.data.unitTmplEditId));

						wnd.data.unitTmplEditId = undefined;
					}

					wnd.wrp.find('.view-tactics-editWave-unitsTemplates .-editing').removeClass('-editing');


					if( wnd.data.unitTemplates.getLength() )
						$(this).addClass('-editing');
				}
				else
					wnd.setUnitTmplEditMode(true);

				return false;
			})
			// Включение режима редактирования
			.on('click', '.view-tactics-editWave-unitsTemplatesEditModeOn', function(){
				wnd.setUnitTmplEditMode(true);

				return false;
			})
			// Выключение режима редактирования
			.on('click', '.view-tactics-editWave-unitsTemplatesEditModeOff', function(){
				wnd.setUnitTmplEditMode(false);

				return false;
			})
			// Выделение шаблона юнита
			.on('click', '.view-tactics-editWave-unitTemplate', function(){
				if( $(this).hasClass('-active') )
					return;

				wnd.wrp.find('.view-tactics-editWave-unitTemplate.-active').removeClass('-active');

				$(this).addClass('-active');

				return;
			})
			// Выбирать тег
			.on('click', '.js-selectTag', function(){
				var tagCode = $(this).data('code');

				if( wnd.data.activeTmplUnit.isTemplate() ){
					var code = wnd.data.activeTmplUnit.getCode();

					if( code[0] == code[1] && code[0] != tagCode ){
						var newActiveTmplUnit = new Unit(utils.charToInt(code[0]+tagCode), 1);

						newActiveTmplUnit.setTmplPriority();

						if( wnd.data.activeTmplUnit.isTmplFirstTagNeg() ){
							newActiveTmplUnit.setTmplFirstTagNeg();
						}

						wnd.data.activeTmplUnit = newActiveTmplUnit;
					}
				}
				else
					wnd.data.activeTmplUnit = new Unit(utils.charToInt(tagCode+tagCode));

				wnd.wrp.find('.view-tactics-editWave-unitsSettingWrp').html(tmplMgr.tactics.unitsSetting(wnd.data.activeTmplUnit));

				wnd.changeEditingTmplUnit(wnd.data.activeTmplUnit);

				return false;
			})
			// Убрать оба тега (клик по обязательному тегу)
			.on('click', '.js-selectTag.-selected.js-necessarily', function(){
				wnd.data.activeTmplUnit = new Unit(-1);

				wnd.wrp.find('.view-tactics-editWave-unitsSettingWrp').html(tmplMgr.tactics.unitsSetting(wnd.data.activeTmplUnit));

				wnd.changeEditingTmplUnit();

				return false;
			})
			// Убрать желательный тег
			.on('click', '.js-selectTag.-selected.js-desirable', function(){
				var code = wnd.data.activeTmplUnit.getCode();

				var newActiveTmplUnit = new Unit(code[0]+code[0], 1);

				if( wnd.data.activeTmplUnit.isTmplFirstTagNeg() ){
					newActiveTmplUnit.setTmplFirstTagNeg();
				}

				wnd.data.activeTmplUnit = newActiveTmplUnit;

				wnd.wrp.find('.view-tactics-editWave-unitsSettingWrp').html(tmplMgr.tactics.unitsSetting(wnd.data.activeTmplUnit));

				wnd.changeEditingTmplUnit(wnd.data.activeTmplUnit);

				return false;
			})
			// Сделать тег негативным (обратным)
			.on('change', '.js-negativeFirstTag, .js-negativeSecondTag', function(){
				if( $(this).hasClass('js-negativeFirstTag') ){
					wnd.data.activeTmplUnit.changeTmplFirstTagNeg();
				}
				else{
					wnd.data.activeTmplUnit.changeTmplSecondTagNeg();
				}

				wnd.data.activeTmplUnit.setCount(1);

				wnd.wrp.find('.view-tactics-editWave-unitsSettingWrp').html(tmplMgr.tactics.unitsSetting(wnd.data.activeTmplUnit));

				wnd.changeEditingTmplUnit(wnd.data.activeTmplUnit);
			})
			// Поменять приоретет шаблонному юниту
			.on('click', '.view-tactics-editWave-unitsSetting-tagsChangePriority', function(){
				if( wnd.data.activeTmplUnit.getTmplSecondTag() ){
					wnd.data.activeTmplUnit.changeTmplPriority();	
					wnd.wrp.find('.view-tactics-editWave-unitsSettingWrp').html(tmplMgr.tactics.unitsSetting(wnd.data.activeTmplUnit));

					wnd.changeEditingTmplUnit(wnd.data.activeTmplUnit);
				}
				return false;
			})
			// Сохранить шаблон юнита
			.on('click', '.js-saveUnitTemplate', function(){
				if( !wnd.data.activeTmplUnit.isTemplate() || !wnd.data.canSaveTmplUnit )
					return false;

				var unitTemplatesTemp = wnd.data.unitTemplates.clone();

				if( wnd.data.unitTmplEditId )
					unitTemplatesTemp.delElem(wnd.data.unitTmplEditId);

				unitTemplatesTemp.addElem(wnd.data.activeTmplUnit);

				wnd.parentWnd.loaderId = contentLoader.start( 
					wnd.wrp.find('.js-saveUnitTemplate'), 
					0, 
					function(){
						wnd.parentWnd.saveUnitTemplates(unitTemplatesTemp, function(){
							wnd.parentWnd.loaderId = contentLoader.stop(wnd.parentWnd.loaderId);

							wnd.data.unitTemplates = wnd.parentWnd.data.unitTemplates = unitTemplatesTemp;

							if( wnd.data.unitTmplEditId ){
								// Удаление совпадающего ШЮ
								var $sameTmplUnit = wnd.wrp.find('.view-tactics-editWave-unitsTemplates .view-tactics-editWave-unit.-unitTemplate[data-id="' + wnd.data.activeTmplUnit.getId() + '"]');

								$sameTmplUnit.each(function(){
									if( !$(this).hasClass('-editing') ){
										$(this).remove();
									}
								});

								var $editableTmplUnit = wnd.wrp.find('.view-tactics-editWave-unit.-unitTemplate.-editing');
								$editableTmplUnit.data('id', wnd.data.activeTmplUnit.getId());
								$editableTmplUnit.attr('data-id', wnd.data.activeTmplUnit.getId());
								$editableTmplUnit.html(snip.unitIcon(wnd.data.activeTmplUnit));
							}
							else{
								wnd.data.activeTmplUnit = new Unit(-1);

								wnd.wrp.find('.view-tactics-editWave-unitsSettingWrp').html(tmplMgr.tactics.unitsSetting(wnd.data.activeTmplUnit));

								wnd.updateUnitsTamplate(true);
							}

							wnd.setCanSaveTmplUnit(false);
						});
					},
					{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}} 
				);
				return false;
			})
			// Удалить шаблон юнита
			.on('click', '.js-deleteUnitTemplate', function(){
				var unitTemplatesTemp = wnd.data.unitTemplates.clone();

				if( wnd.data.unitTmplEditId ){

					unitTemplatesTemp.delElem(wnd.data.unitTmplEditId);

					wnd.parentWnd.loaderId = contentLoader.start( 
						wnd.wrp.find('.js-deleteUnitTemplate'), 
						0, 
						function(){
							wnd.parentWnd.saveUnitTemplates(unitTemplatesTemp, function(){
								wnd.parentWnd.loaderId = contentLoader.stop(wnd.parentWnd.loaderId);

								wnd.data.unitTemplates = wnd.parentWnd.data.unitTemplates = unitTemplatesTemp;

								wnd.updateUnitsTamplate(true);

								wnd.data.activeTmplUnit = new Unit(-1);

								wnd.wrp.find('.view-tactics-editWave-unitsSettingWrp').html(tmplMgr.tactics.unitsSetting(wnd.data.activeTmplUnit));

								wnd.data.unitTmplEditId = undefined;
							});

						}.bind(this),
						{icon: ContentLoader.icon.small, cssPosition: {left: -30, top: 10}} 
					);

				}
				else{
					wnd.data.activeTmplUnit = new Unit(-1);

					wnd.changeEditingTmplUnit(undefined, 'Создать шаблон');

					wnd.wrp.find('.view-tactics-editWave-unitsSettingWrp').html(tmplMgr.tactics.unitsSetting(wnd.data.activeTmplUnit));

					wnd.data.unitTmplEditId = undefined;
				}

				return false;
			})
			// Фильтрация тегов (при клике убирает всех неподходящих юнитов)
			.on('click', '.js-tagFilter', function(){
				var tag = $(this).data('code');

				if( wnd.data.tagFilter.match(tag) ){ 
					wnd.data.tagFilter = wnd.data.tagFilter.replace(tag, '');
					$(this).removeClass('-tagFiltering');
				}
				else{ 
					wnd.data.tagFilter += tag;
					$(this).addClass('-tagFiltering');
				}
				wnd.setFilter(wnd.data.tagFilter, '-unitLongFiltered');

				$(this).trigger('mouseenter');
			})
			// При наведении на тег делает полупрозрачными всех неподходящих юнитов 
			.on('mouseenter', '.js-tagFilter', function(){
				var tag = $(this).data('code');
				wnd.setFilter(tag, '-unitFiltered');
			})
			// Сбрасывает полупрозрачность при выходе с тега
			.on('mouseleave', '.view-tactics-editWave-unitsWrp.-unitsLegend', function(){
				wnd.wrp.find('.view-tactics-editWave-unit, .view-tactics-editWave-ruleUnit').removeClass('-unitFiltered');
			})
			// При наведении на шаблон делает полупрозрачными всех неподходящих под шаблон юнитов 
			.on('mouseenter', '.js-unitTemplate', function(){
				if( wnd.data.unitTmplEditMode || $(this).hasClass('ui-draggable-dragging') )
					return false;

				var unit = new Unit(+$(this).data('id')),
					filter = unit.getTagsCodes().split(''),
					filterNeg = '';

				if( unit.isTmplFirstTagNeg() )
					filterNeg += filter.shift();

				if( unit.getTmplSecondTag() && unit.isTmplEqualPriority() ){
					var checkTagsSequence = !filterNeg;

					if( unit.isTmplSecondTagNeg() )
						filterNeg += filter.pop();
				}
				else
					filter.pop();

				wnd.setFilter(filter.join(''), '-unitFiltered', filterNeg, checkTagsSequence);
			})
			// Сбрасывает полупрозрачность при выходе с шаблона
			.on('mouseleave', '.js-unitTemplate', function(){
				wnd.wrp.find('.-unitFiltered').removeClass('-unitFiltered');
			})
			// Изменение параметров правила
			.on('change', '.js-ruleEquality, .js-ruleSide', function(){
				wnd.setRule(this);
			})
			.on('change', '.js-ruleCount', function(){
				if( $(this).hasClass('-type-input') ) return;

				wnd.setRule(this);
			})
			.on('input', '.js-ruleCount', function(event){
				utils.checkInputInt(this, {max: $(this).data('max'), min: $(this).data('min'), manualInput: !event.isTrigger});

				wnd.setRule(this);
			})
			.on('click', '.js-ruleCountType', function(){
				if( $(this).hasClass('-type-fixCountType') )
					return;

				var type = $(this).data('type') == TacticRuleCond.countType.percent ? TacticRuleCond.countType.numeric : TacticRuleCond.countType.percent;

				$(this).data('type', type);

				wnd.setRule(this, true);
			})
			.on('click', '.js-addRuleCond', function(){
				if( wnd.data.ruleConds.isEmpty() )
					return;

				var $condList = $(this).closest('.view-tactics-editWave-ruleWrp').find('.view-tactics-editWave-condList'),
					condCount = $condList.find('.view-tactics-editWave-rule').length;

				if( condCount < TacticRuleCondsList.maxCount ){
					var newRuleCond = new TacticRuleCond();

					newRuleCond.setUnit(new Unit(Unit.ids.any));

					wnd.data.ruleConds.addElem(newRuleCond);

					$condList.html(tmplMgr.editWRTR.conditions({ruleConds: wnd.data.ruleConds}));

					snip.spinboxHandler($condList);

					wnd.initDragAndDrop(true);

					wnd.setRule($condList.find('.view-tactics-editWave-rule[data-index="'+condCount+'"]'));

					$(this).toggleClass('-hidden', !(++condCount < TacticRuleCondsList.maxCount));
				}
			})
			.on('click', '.js-delRuleCond', function(){
				var $cond = $(this).closest('.view-tactics-editWave-rule'),
					$condList = $cond.closest('.view-tactics-editWave-condList');

				wnd.data.ruleConds.deleteElem($cond.data('index'));

				$condList.closest('.view-tactics-editWave-ruleWrp').find('.js-addRuleCond').toggleClass('-hidden', !(wnd.data.ruleConds.getLength() < TacticRuleCondsList.maxCount));

				$condList.html(tmplMgr.editWRTR.conditions({ruleConds: wnd.data.ruleConds}));

				wnd.initDragAndDrop(true);

				wnd.setRule();
			})
			.on('click', '.js-changeRuleCond', function(){
				var ruleCondsType = $(this).data('cond') == TacticRuleCondsList.type.AND ? TacticRuleCondsList.type.OR : TacticRuleCondsList.type.AND;

				wnd.data.ruleConds.setType(ruleCondsType);

				$(this).closest('.view-tactics-editWave-condList').find('.view-tactics-editWave-ruleCond').html(tmplMgr.editWRTR.ruleCond({ruleCondsType:ruleCondsType}));

				wnd.setRule();
			})
			// Изменение юнитомест для отряда
			.on('input', '.view-tactics-editWave-upls', function(event){
				utils.checkInputInt(this, {max: 1000, min: 10, manualInput: !event.isTrigger});

				wnd.data.WRTR.setUpls($(this).val() * 0.01);

				wnd.updArmyCont();

				wnd.setCanSave(true);
			})
			.on('change', 'input[name="showbattlecost"]', function(){
				$(this).closest('.view-tactics-editWaveWrp').find('.view-tactics-editWave-units').toggleClass('-type-showBattleCost', $(this).prop('checked'));
			});

	snip.input1Handler(this.wrp, {spinbox: {}});
};

wEditWRTR.prototype.cacheCont = function(){
	wEditWRTR.superclass.cacheCont.apply(this, arguments);
	
	this.$shadow = this.cont.find('.view-tactics-editShadow');
};

wEditWRTR.prototype.afterDraw = function(){
	this.initDragAndDrop();

	this.initScroll({scrollbarPosition: 'outside'});
};


wEditWRTR.prototype.setData = function(data){
	this.parentWnd = data.parentWnd;
	
	delete data.parentWnd;
	
	wEditWRTR.superclass.setData.apply(this, arguments);
};

wEditWRTR.prototype.initWndOptions = function(){
	wEditWRTR.superclass.initWndOptions.apply(this, arguments);
	
	this.options.setHash = false;
	
	this.options.showBack = true;
	
	this.options.clearData = false;
};

wEditWRTR.prototype.getHeaderCont = function(){
	return this.data.header;
};

wEditWRTR.prototype.hasHeader = wEditWRTR.prototype.getHeaderCont;


wEditWRTR.prototype.setCanSave = function(state){
	if( (!this.data.WRTR.isReserve2() && !this.data.army.getLength()) || (this.data.WRTR.isRule() && this.data.ruleConds.isEmpty()) ) state = false;

	if( this.data.canSave != state ){
		this.data.canSave = state;

		if( this.data.canSave )
			this.wrp.find('.js-saveWaveArmy').removeClass('-disabled');
		else
			this.wrp.find('.js-saveWaveArmy').addClass('-disabled');
	}
};

wEditWRTR.prototype.setUnitTmplEditMode = function(state){
	var wnd = this;

	if( this.data.unitTmplEditMode != state ){
		this.data.unitTmplEditMode = state;
		
		var animTime = 333,
			unitsTemplatesWidth = this.getUnitsTemplatesBlockWidth();
		
		var $unitsTemplates = this.wrp.find('.view-tactics-editWave-unitsTemplates');
		var $unitSettings = $unitsTemplates.next();
		var $activeEditMode = this.wrp.find('.view-tactics-editWave-unitsTemplatesEditModeOn');

		if( this.data.unitTmplEditMode ){
			var $addUnitTemplate = this.wrp.find('.js-addUnitTemplate');

			this.data.activeTmplUnit = new Unit(-1);

			$unitSettings.html(tmplMgr.tactics.unitsSetting(this.data.activeTmplUnit));
			$unitsTemplates.animate({width: unitsTemplatesWidth.width}, animTime, function(){
				$unitsTemplates.addClass('-editMode');
				$unitsTemplates.find('.-selected, .-unitLongFiltered').removeClass('-selected -unitLongFiltered');
				$addUnitTemplate.addClass('-editing').removeClass('-addUnitTemplate').html(tmplMgr.tactics.cleanTmplUnit({title:'Создать шаблон'}));
			});
			$unitSettings.animate({width: 'show', height: 'show'}, animTime);

			$activeEditMode.fadeOut(animTime, function() {
				$activeEditMode.next().fadeIn(animTime);
			});
		}
		else{
			$activeEditMode = this.wrp.find('.view-tactics-editWave-unitsTemplatesEditModeOff');

			$unitSettings.animate({width: 'hide', height: 'hide'}, animTime, function(){
				$unitSettings.hide();
			});
			$unitsTemplates.animate({width: unitsTemplatesWidth.maxWidth}, animTime, function(){
				$unitsTemplates.removeClass('-editMode');

				wnd.updateUnitsTamplate(false, wnd.data.tagFilter);
			});

			$activeEditMode.fadeOut(animTime, function() {
				$activeEditMode.prev().fadeIn(animTime);
			});

			this.data.unitTmplEditId = this.data.activeTmplUnit = undefined;
		}
	}
};

wEditWRTR.prototype.getUnitsTemplatesBlockWidth = function(){
	return {width: 175, maxWidth: 406};
};

wEditWRTR.prototype.initDragAndDrop = function(ruleOnly){
	if( this.data.WRTR.isRule() || this.data.WRTR.isTemplate() ){
		var wnd = this;

		if( !ruleOnly )
			this.parentWnd.initDraggable(this.wrp.find('.view-tactics-editWave-unit'), {
				cancel: '.js-addUnitTemplate, .-type-noDrag',
				appendTo: this.getDragAppendTo(),
				helper: 'clone',
				zIndex: 15,
				opacity: 0.7,
				revert: true,
				distance: 3,
				cursorAt: this.getDragCursorAt(),
				containment: this.getDragContainment()
			});

		this.wrp.find('.view-tactics-editWave-ruleUnit').droppable({
			accept: '.view-tactics-editWave-unit',
			drop: function(event, ui){
				var unit = new Unit(ui.draggable.data('id'));

				$(this).html(snip.unitIcon(unit)).data('id', unit.getId());
				$(this).attr('data-id', unit.getId());

				wnd.setRule(this, true);

				return false;
			},
			activate: function() {
				$(this).css({zIndex: 15});
				
				wnd.toggleShadow(true);
			},
			deactivate: function(){
				$(this).removeAttr('style');

				wnd.toggleShadow(false);
			}
		});
	}
};

	wEditWRTR.prototype.getDragAppendTo = function(){
		return this.wrp.find('.view-tactics-editWaveWrp');
	};
	
	wEditWRTR.prototype.getDragContainment = function(){
		return this.wrp.find('.view-tactics-editWaveWrp');
	};
	
	wEditWRTR.prototype.getDragCursorAt = function(){
		return false;
	};

wEditWRTR.prototype.setRule = function(el, updTmpl){
	if( el ){
		var $rule = $(el).closest('.view-tactics-editWave-rule'),
			$ruleUnit = $rule.find('.view-tactics-editWave-ruleUnit'),
			unitId = $ruleUnit.data('id');
	}

	if( unitId !== undefined ){
		var unit = new Unit(unitId),
			index = $rule.data('index'),
			cond = this.data.ruleConds.getElem(index);

		// Учитываем фильтр 
		if( this.data.tagFilter && !this.data.tagFilter.match('[' + unit.getTagsCodes() + ']') )
			$ruleUnit.addClass('-unitLongFiltered');
		else
			$ruleUnit.removeClass('-unitLongFiltered');

		cond.setSide($rule.find('.js-ruleSide').val());
		cond.setUnit(unit);
		cond.setEquality($rule.find('.js-ruleEquality').val());

		cond.setCountType($rule.find('.js-ruleCountType').data('type')||TacticRuleCond.countType.percent);

		if( updTmpl ){
			$rule.find('.view-tactics-editWave-ruleCountWrp').html(tmplMgr.tactics.editWaveUnitCount({ruleCond:cond}));

			snip.spinboxHandler($rule);
		}

		cond.setCount(utils.toInt($rule.find('.js-ruleCount').val()));

		if( updTmpl )
			this.wrp.find('.view-tactics-editWave-units .view-tactics-editWave-unit[data-id="'+Unit.ids.fort+'"]').toggleClass('-type-noDrag', this.data.ruleConds.hasFortUnit());
	}

	this.wrp.find('.view-tactics-editWave-ruleWrp').toggleClass('-noRule', this.data.ruleConds.isEmpty());

	this.setCanSave(!this.data.ruleConds.isEmpty());
};

wEditWRTR.prototype.setFilter = function(filter, sClass, filterNeg, checkTagsSequence){
	this.wrp.find('.view-tactics-editWave-unit, .view-tactics-editWave-ruleUnit').each(function(){
		var tagsCodes = '[' + (new Unit(+$(this).data('id')).getTagsCodes()) + ']',
			toggle;

		filter = filter||'';
		filterNeg = filterNeg||'';

		if( checkTagsSequence ){ // Учитывает последовательность тегов при фильтрации
			toggle =	((filter[0] && !filter[0].match(tagsCodes)) || (filter[1] && !filter[1].match(tagsCodes)))
						||
						(filterNeg[0] && filterNeg[0].match(tagsCodes));
		}
		else
			toggle = (filter && !filter.match(tagsCodes)) || (filterNeg && filterNeg.match(tagsCodes));

		$(this).toggleClass(sClass, !!toggle);
	});
};

wEditWRTR.prototype.changeEditingTmplUnit = function(editingTmplUnit, title){
	var cont = editingTmplUnit ? snip.unitIcon(editingTmplUnit) : tmplMgr.tactics.cleanTmplUnit({title:title||''});
	this.wrp.find('.view-tactics-editWave-unitsTemplates .-editing').html(cont);

	this.setCanSaveTmplUnit(true);
};

wEditWRTR.prototype.setCanSaveTmplUnit = function(state){
	if( this.data.canSaveTmplUnit != state ){

		this.data.canSaveTmplUnit = state;

		if( this.data.canSaveTmplUnit )
			this.wrp.find('.js-saveUnitTemplate').removeClass('-disabled');
		else
			this.wrp.find('.js-saveUnitTemplate').addClass('-disabled');
	}
};

wEditWRTR.prototype.updateUnitsTamplate = function(editMode, filter){
	var params = {};
	params.army = this.data.army;
	params.unitTemplates = this.data.unitTemplates;
	params.editMode = editMode;
	params.tagFilter = filter;

	this.wrp.find('.view-tactics-editWave-unitsTemplates').html(tmplMgr.editWRTR.editWaveUnitsTemplates(params));

	this.initDragAndDrop();
};

wEditWRTR.prototype.updArmyCont = function(){
	this.wrp.find('.view-tactics-editWave-army').html(tmplMgr.tactics.editWaveArmyUnits({army: this.data.army, tagFilter: this.data.tagFilter, upls: this.data.WRTR.getUpls()}));
}; // Обновляем контент с выбранными юнитами

wEditWRTR.prototype.selectUnit = function(newUnit, callback){
	var newArmyLength = this.data.army.getLength() + 1;

	var newUnitPercent = utils.toInt(this.data.maxPercent/newArmyLength);

	if( newUnitPercent < this.data.minPercent )
		return;

	// Пропорционально изменяем соотношение юнитов
	var newMaxPercent = this.data.maxPercent - newUnitPercent;

	var tmpUnitList = {length:0, newRestMaxPercent:0}; // Юниты у которых после распределения процент больше чем минимально возможный
	var unitList = this.data.army.getList();
	for(var unit in unitList){
		unit = unitList[unit];
		var unitPercent = unit.getCount();

		unitPercent *= newMaxPercent * 0.01;

		if( unitPercent > this.data.minPercent ){
			newUnitPercent += (unitPercent - utils.toInt(unitPercent));
			unitPercent = utils.toInt(unitPercent);

			unit.restPercent = unitPercent - this.data.minPercent;
			tmpUnitList.newRestMaxPercent += unit.restPercent;
			tmpUnitList[unit.getId()] = unit;
			tmpUnitList.length++;
		}
		else{
			newUnitPercent -= (this.data.minPercent - unitPercent);
			unitPercent = this.data.minPercent;
		}

		unit.setCount(unitPercent);
	}

	newUnitPercent = Math.round(newUnitPercent);

	if( newUnitPercent < this.data.minPercent ){
		var percent = this.data.minPercent - newUnitPercent;
		var newRestMaxPercent = tmpUnitList.newRestMaxPercent;

		delete tmpUnitList.newRestMaxPercent;
		delete tmpUnitList.length;
		for(var unit in tmpUnitList){
			unit = tmpUnitList[unit];
			var dRestUnitPercent = unit.restPercent/newRestMaxPercent;
			unit.addCount(-Math.round(percent*dRestUnitPercent));
		}

		newUnitPercent = this.data.minPercent;
	}

	newUnit.setCount(newUnitPercent);

	this.data.army.addElem(newUnit);

	this.updArmyCont();

	if( callback ) callback();

	this.setCanSave(true);
}; // Добавить юнита в отряд

wEditWRTR.prototype.unSelectUnit = function(){
	this.data.army.delElem(this.data.activeUnit.getId());

	var armyLength = this.data.army.getLength();

	if( armyLength ){
		var percent = this.data.activeUnit.getCount()/armyLength;
		var rest = Math.round((percent - utils.toInt(percent))*armyLength);
		percent = utils.toInt(percent);

		var unitList = this.data.army.getList();
		for(var unit in unitList){
			unit = unitList[unit];
			unit.addCount(percent);

			// Распределяем остаток равномерно
			if( rest ){
				unit.addCount(1);
				rest--;
			}
		}
	}

	this.updArmyCont();

	if( this.data.activeUnit.isTemplate() ){
		if( !this.data.unitTmplEditMode ){
			this.updateUnitsTamplate(false, this.data.tagFilter);
		}
	}
	else
		this.wrp.find('.view-tactics-editWave-units .-selected[data-id="' + this.data.activeUnit.getId() + '"]').removeClass('-selected');

	this.data.activeUnit = undefined;

	this.initDragAndDrop();

	this.setCanSave(true);
}; // Перераспределение процентов при исключении юнита из отряда 

wEditWRTR.prototype.unitModify = function(delta, fromBeginning){
	var armyLength = this.data.army.getLength() - 1;

	if( armyLength ){
		var needModify = false;
		var wasModify = false;
		var unitList = this.data.army.getList();
		for(var unit in unitList){
			unit = unitList[unit];

			if( unit.getId() != this.data.activeUnit.getId() ){
				if( wasModify ) return;

				if( !needModify ){
					if( this.data.lastModified === undefined ){
						needModify = true;
					}
					else if ( this.data.lastModified == unit.getId() ){
						needModify = true;
						continue;
					}
					else
						continue;
				}

				if( needModify ){
					var newUnitCount = unit.getCount() - delta;

					if( newUnitCount < this.data.minPercent ) continue;

					unit.setCount( newUnitCount );
					this.data.activeUnit.setCount( this.data.activeUnit.getCount() + delta );

					var $unit = this.wrp.find('.view-tactics-editWave-armyUnitWrp[data-id="' + unit.getId() + '"]');

					var percent = unit.getCount();
					$unit.css('width', percent + '%');
					$unit.find('.view-tactics-editWave-armyUnitPercent').html(tmplMgr.tactics.editWaveArmyUnitPercentText({percent:percent}));
					$unit.find('.view-tactics-editWave-armyUnitPlaces').html(tmplMgr.tactics.editWaveUnitPlaces({unit:unit, upls:this.data.WRTR.getUpls()}));

					var $activeUnit = this.wrp.find('.view-tactics-editWave-armyUnitWrp[data-id="' + this.data.activeUnit.getId() + '"]');

					var percent = this.data.activeUnit.getCount();
					$activeUnit.css('width', percent + '%');
					$activeUnit.find('.view-tactics-editWave-armyUnitPercent').html(tmplMgr.tactics.editWaveArmyUnitPercentText({percent:percent}));
					$activeUnit.find('.view-tactics-editWave-armyUnitPlaces').html(tmplMgr.tactics.editWaveUnitPlaces({unit:this.data.activeUnit, upls:this.data.WRTR.getUpls()}));

					this.data.lastModified = unit.getId();

					wasModify = true;

					this.setCanSave(true);
				}

			}
			else if( this.data.activeUnit.getId() == this.data.lastModified ){
				this.data.lastModified = undefined;
			}
		}

		this.data.lastModified = undefined;

		// Если изменений небыло - просматриваем список заново
		if( !wasModify && !fromBeginning )
			this.unitModify(delta, true);
	}
}; // Модификация процентного соотношения

wEditWRTR.prototype.stepUnitModify = function(count){
	var delta = count > 0 ? -1 : 1;

	count = Math.abs(count);

	for(var i = 0; i < count; i++){
		this.unitModify(delta);
	}
}; // Ручное зменение процентного соотношения

wEditWRTR.prototype.selectUnitR2 = function(newUnit, callback){
	newUnit.setCount(this.data.maxPercent);

	this.data.army.addElem(newUnit);

	this.updArmyCont();

	if( callback ) callback();

	this.setCanSave(true);
};

wEditWRTR.prototype.unSelectUnitR2 = function(){
	this.data.army.delElem(this.data.activeUnit.getId());

	this.updArmyCont();

	if( this.data.activeUnit.isTemplate() )
		this.wrp.find('.view-tactics-editWave-unitsTemplates .-selected[data-id="' + this.data.activeUnit.getId() + '"]').removeClass('-selected');
	else
		this.wrp.find('.view-tactics-editWave-units .-selected[data-id="' + this.data.activeUnit.getId() + '"]').removeClass('-selected');

	this.data.activeUnit = undefined;

	this.setCanSave(true);
};

wEditWRTR.prototype.unitModifyR2 = function(delta){
	this.data.activeUnit.addCount(delta);

	this.wrp.find('.view-tactics-editWave-armyUnitWrp[data-id="' + this.data.activeUnit.getId() + '"] .view-tactics-editWave-armyUnitPercent').html(tmplMgr.tactics.editWaveArmyUnitPercentText({percent:this.data.activeUnit.getCount()}));

	this.setCanSave(true);
};

wEditWRTR.prototype.stepUnitModifyR2 = function(count){
	this.unitModify(-count);
}; // Ручное зменение процентного соотношения

wEditWRTR.prototype.toggleShadow = function(toggle){
	this.$shadow.toggleClass('-active', toggle);
};