/**
	Окно настроек
*/

wOptions = function(){
	wOptions.superclass.constructor.apply(this, arguments);
};
	
	utils.extend(wOptions, Wnd);
	
	WndMgr.regWnd('options', wOptions);
	
	
	wOptions.prepareData = function(){
	    return {};
	};
	
    
    wOptions.prototype.calcName = function() {
	    return 'options';
	};
    
	wOptions.prototype.calcChildren = function() {
	    this.children = {
	    	general: tabOptGeneral,
	    	proxy: tabOptProxy,
	    	rep: tabOptRep,
	    	audio: tabOptAudio,
	    	acc: tabOptAcc,
	    };
		
		if( Quest.isAvail(Quest.ids.bldAltair1) ){
			this.children.chat = tabOptChat;
		}
	};

	wOptions.prototype.beforeShowChildren = function() {   
	    this.tabs = new Tabs(this.cont);

		this.tabs.addTabs(this.children);
	};

	wOptions.prototype.afterDraw = function() {
		var tabName = 'general';
		
		if( Quest.isActive(Quest.ids.introduce) )
			tabName = 'acc';
		
		this.tabs.openTab(tabName);
	};
	
	
	
	tabOptGeneral = function(){
	    this.name = 'general';
	    this.tabTitle = 'Интерфейс';
	    
		tabOptGeneral.superclass.constructor.apply(this, arguments);
	};

		utils.extend(tabOptGeneral, Tab);

		tabOptGeneral.prototype.bindEvent = function(){
			var self = this;
			
			//смена языка
			this.wrp
				.on('change', '.options-lang', function(){
					var loaderId = contentLoader.start( 
						self.wrp.find('.options-lang-loader'), 
						0, 
						function(){
							var val = $(this).val();

							reqMgr.setLanguage(val);

							return false;		
						}.bind(this),
						{icon: ContentLoader.icon.small, cssPosition: {top: 5, left: 5}} 
					);

				})
				//смена интерфейса
				.on('change', '.options-iface', function(){
					ls.setGameIf($(this).val(), {servStorageDelay: false});

					appl.reload();

					return false;
				})
				//фиксация зума
				.on('change', '.options-zoomLock', function(){
					var val = $(this).val();

					ls.setTownZoomLock(+(val != 'auto'));
					
					if( val != 'auto' ){
						val = +val;
						
						ls.setTownZoom(val);
					}
					else
						val = false;
					
					notifMgr.runEvent(Notif.ids.townZoom, val);

					return false;
				})
				//запоминание положений окон
				.on('change', '.options-useWndPos', function(){
					var checked = $(this).is(':checked');
					ls.setWndPos(checked? {}: false);// обнуляем данные или создаем пустой объект
					ls.setDependentWndPos(checked? {}: false);// обнуляем данные или создаем пустой объект для зависимого окна (пример: окно передвижения торговцев зависимое от других окон)
					if (checked) {
						//пишем открытые окна
						var wndList = wndMgr.getWndList();

						for(var wnd in wndList){
							wndList[wnd].saveWndPos();
						}
					}
				})
				// Анимация пешеходов
				.on('change', '.options-moversAnim', function(){
					ls.setMoversAnim($(this).prop('checked'));
					
					notifMgr.runEvent(Notif.ids.townChange);
				})
				// Кеширование дорог
				.on('change', '.options-roadsCache', function(){
                    ls.setRoadsCache($(this).prop('checked'));
                    
                    iMap.clearChunks();
				})
				// Сглаживание
				.on('change', '.options-antialiasing', function(){
					ls.setAntialiasing($(this).prop('checked'));
					
					appl.setAntialiasing();
				});
		};
		
		tabOptGeneral.prototype.addNotif = function(){
			this.notif.show.push(Notif.ids.accOptions);
		};
		
		
        
	tabOptProxy = function(){
	    this.name = 'proxy';
	    this.tabTitle = 'Заместительство';
	    
		tabOptProxy.superclass.constructor.apply(this, arguments);
	};

		utils.extend(tabOptProxy, Tab);

		tabOptProxy.prototype.getTmplData = function(){
			var data = {};    

			data.assistant = utils.clone(wofh.account.assistant)||{};
			
			if( data.assistant.account ){
				data.assistant.account = wofh.world.getAccount(data.assistant.account);
				data.assistant.assistingDays = (timeMgr.getNow() - data.assistant.time) * timeMgr.invDtS; // Время прошедшее с момента начала замещения (в днях)
				data.assistant.minDays = lib.account.assistmin * timeMgr.invDtS; // Минимальный срок замещения (2 дня)
				if( data.assistant.minDays - data.assistant.assistingDays > 0 ){
					data.assistant.days = data.assistant.days - data.assistant.minDays;
					data.assistant.minDaysLeft = data.assistant.minDays - data.assistant.assistingDays; // Остаток от минимального срока замещения
					// Если количество оставшихся дней меньше минимального срока замещения, то используем этот остаток
					if( data.assistant.days < 0 ){
						data.assistant.minDaysLeft += data.assistant.days;
						data.assistant.days = 0;
					}
				}
				else
					data.assistant.days = data.assistant.days - data.assistant.assistingDays;
			}
			

			data.period = lib.account.noassistperiod - (timeMgr.servTime - wofh.account.regtime);

			if (wofh.account.bonus && wofh.account.bonus.assistlevel) {
				data.assistprice = Math.floor(utils.oddFunc(lib.luckbonus.assistprice, wofh.account.bonus.assistlevel));
			}
			data.assistadddays = lib.luckbonus.assistadddays;
			
			data.coins = wofh.account.getCoinsBoughtMoved();

			if (wofh.account.assistfor) {
				data.assistfor = utils.clone(wofh.account.assistfor);
				for( var assist in data.assistfor ){
					assist = data.assistfor[assist];
					assist.acc = wofh.world.getAccount(assist.acc);
				}
			}
			
			data.isassist = wofh.account.isassist || 0;
			
	        return data;
		};

		tabOptProxy.prototype.bindEvent = function(){
			var self = this;
			//вход под игроком
			this.wrp
				.on('click', '.js-enterAsPlayer', function () {
					var accId = $(this).data('id');
					var account = wofh.world.getAccount(accId);

					reqMgr.getAssistantKey(accId, function(resp){
						reqMgr.login(account.name, resp.data.pass, resp.data.key, function(resp){
							reqMgr.startAssist(resp.data.session);
						});
					});

					return false;
				})
				.on('input', 'input[name="assistant"]', function (){
					if( (wofh.account.assistant||{}).days ){
						var val = $(this).val();

						var canSetAssist = Account.checkNameLimits(val);

						self.wrp.find('.js-setAssist').toggleClass('-hidden', !canSetAssist);
					}
					
					return false;
				})
				.on('click', '.js-setAssist', function () {
				var name = self.wrp.find('input[name="assistant"]').val();
				
				reqMgr.getPlayerIdByName(name, function(data){
					if (data.id)
						reqMgr.setAssist(data.id);
					else
						wndMgr.addAlert('Такого игрока не существует.<br>Убедись, что имя указано верно');
				});
				
				return false;
			})
				.on('click', '#clearassist', function () {
				wndMgr.addConfirm().onAccept = function(){
					reqMgr.clearAssist();
				};
				return false;
			})
				.on('click', '#option-replAcc', function () {
				wndMgr.addConfirm().onAccept = function(){
	                reqMgr.addAccBonus(LuckBonus.ids.accountAssist, 'add');
				}.bind(this);
				return false;
			});
		};
		
		tabOptProxy.prototype.addNotif = function(){
			this.notif.show.push(Notif.ids.accOptions);
			this.notif.show.push(Notif.ids.accAssist);
			this.notif.show.push(Notif.ids.accBonus);
		};
		
		

	tabOptRep = function(){
	    this.name = 'rep';
	    this.tabTitle = 'Отчеты';
	    
		tabOptRep.superclass.constructor.apply(this, arguments);
	};

		utils.extend(tabOptRep, Tab);
		
		tabOptRep.prototype.getTmplData = function(){
			var data = {};

			var deleteReports = {};
			if (wofh.account.delreports) {
				var reportsOld = utils.dec2bin(wofh.account.delreports, true);
				for (var i = 0; i < reportsOld.length; i++) {
					deleteReports['r' + i] = reportsOld[i] > 0 ? true : false;
				}
			}
			data.deleteReports = deleteReports;
			
	        return data;
		};

		tabOptRep.prototype.bindEvent = function(){
			var self = this;
			
			this.wrp.on('change', 'input', function () {
				var data = utils.urlToObj(self.wrp.find('input').serialize(), true);
				
				reqMgr.setDelRep(data);
			});
		};
		
		

	tabOptAcc = function(){
	    this.name = 'acc';
	    this.tabTitle = 'Аккаунт';
	    
		tabOptAcc.superclass.constructor.apply(this, arguments);
	};

		utils.extend(tabOptAcc, Tab);

		tabOptAcc.prototype.bindEvent = function(){
			var self = this;
			
			this.wrp
				.on('input', 'input[name="email"]', function () {
				self.wrp.find('.js-chooseEmail').removeClass('-hidden');
				return false;
			})
				.on('click', '.js-chooseEmail', function () {			
					$(this).addClass('-hidden');
					reqMgr.setEmail(self.wrp.find('input[name="email"]').val(), function(resp){
						wndMgr.addAlert('На указанный адрес отправлено письмо с инструкциями');
					});
					return false;
				})
				.on('input', '.opt-changePass input', function () {
					var data = utils.urlToObj(self.wrp.find('.opt-changePass input').serialize(), true);

					var dataReady = data.oldpass && data.newpass && data.newpass2;

					self.wrp.find('.js-newPassword').toggleClass('-disabled', !dataReady);
					self.data.canNewPassword = dataReady;

					return false;
				})
				.on('click', '.js-newPassword', function () {
					var $inputs = self.wrp.find('.opt-changePass input');
					var data = utils.urlToObj($inputs.serialize(), true);

					if( self.data.canNewPassword ){
						if( data.newpass == data.newpass2){
							var loaderId = contentLoader.start( 
								$(this), 
								0, 
								function(){
									reqMgr.setPassword(data.oldpass, data.newpass, function(resp){
										if( resp.error == ErrorX.ids.WEok ){
											contentLoader.stop(loaderId, true);
											$inputs.val('');
										}
										else{
											contentLoader.stop(loaderId, false, true);
										}
									});
								},
								{icon: ContentLoader.icon.short, cssPosition: {left: 85}} 
							);
						}
						else{
							wndMgr.addAlert('Пароль повторен неверно');
						}
					}
					return false;
				})
				/*удаление аккаунта */
				.on('click', '#btn-del-acc', function () {
					var $this = $(this),
						password = $('#pass-del-acc').val();

					if( $this.hasClass('-disabled') )
						return false;

					var _delAcc = function(){
						$this.addClass('-disabled');

						var loaderId = contentLoader.start( 
							$this, 
							0, 
							function(){
								set.acc.tryDelAcc();

								reqMgr.delAcc(password, {onFail: function(){
									set.acc.tryDelAcc(false);

									$this.removeClass('-disabled');

									contentLoader.stop(loaderId);
								}});
							},
							{icon: ContentLoader.icon.small, cssPosition: {top: 11, right: -2}}
						);
					};

					if( !self.data.delAccConfirmShown ){
						wndMgr.addConfirm(tmplMgr.confirm.delAcc()).onAccept = function(){
							self.data.delAccConfirmShown = true;

							_delAcc();
						};
					}
					else
						_delAcc();

					return false;
				})
				//разблокируем кнопку изменения текста
				.on('input', 'textarea[name="text"]', function () {
					self.wrp.find('.js-setAccText').toggleClass('-hidden', wofh.account.text == $(this).val());
					return false;
				})
				//установка текста
				.on('click', '.js-setAccText', function () {
					var text = self.wrp.find('textarea[name="text"]').val();
					reqMgr.setAccText(text);
					return false;
				});
		};
		
		tabOptAcc.prototype.afterDraw = function(){
			utils.assignLengthCounter(this.wrp.find('textarea'), lib.account.aboutmaxlen, this.wrp.find('.options-chrLeft'));
		};
		
		tabOptAcc.prototype.addNotif = function(){
			this.notif.show.push(Notif.ids.accOptions);
		};
		
		

	tabOptAudio = function(){
	    this.name = 'audio';
	    this.tabTitle = 'Аудио';
	    
		tabOptAudio.superclass.constructor.apply(this, arguments);
	};

		utils.extend(tabOptAudio, Tab);
		
		tabOptAudio.prototype.afterDraw = function(){
			var self = this;

			this.data.soundEventTrack = sndMgr.getRandomTrack(EventSnd.trackList);
			
			if ( debug.isTest('later') ) {
				snip.sliderHandler(this.wrp.find('.js-options-audio-global-slider'), {
					min: Snd.volume.min,
					max: Snd.volume.max * Snd.volumeBase,
					value: SndMgr.storageGlobalVolume() * Snd.volumeBase,
					slide: function(event, ui){
						set.sound.globalVolume(ui.value / Snd.volumeBase);
					},
					change: function(event, ui){
						set.sound.globalVolume(ui.value / Snd.volumeBase, true); // Записываем данные в хранилище
					}
				});
				snip.sliderHandler(this.wrp.find('.js-options-audio-music-slider'), {
					min: Snd.volume.min,
					max: Snd.volume.max * Snd.volumeBase,
					value: MusicSnd.storageVolume() * Snd.volumeBase,
					slide: function(event, ui){
						set.sound.volume(ui.value / Snd.volumeBase, MusicSnd);
						
						var snd = sndMgr.getFirstSndByType(MusicSnd);
						
						if( ui.value ){
							if( !snd )
								sndMgr.addSnd(MusicSnd);
							else if( !snd.isPlaying() && !sndMgr.stoped )
								snd.playRandomTrack();
						} else if( snd ){
							snd.stop();
						}
					}
				});
				
				snip.sliderHandler(this.wrp.find('.js-options-audio-ambient-slider'), {
					min: Snd.volume.min,
					max: Snd.volume.max * Snd.volumeBase,
					value: AmbientSnd.storageVolume() * Snd.volumeBase,
					slide: function(event, ui){
						set.sound.volume(ui.value / Snd.volumeBase, AmbientSnd);
						
						var snd = sndMgr.getFirstSndByType(AmbientSnd);
						
						if( ui.value ){
							if( !snd )
								sndMgr.addSnd(AmbientSnd);
							else if( !snd.isPlaying() && !sndMgr.stoped )
								snd.play();
						} else if( snd ){
							snd.stop();
						}
					}
				});
				snip.sliderHandler(this.wrp.find('.js-options-audio-noise-slider'), {
					min: Snd.volume.min,
					max: Snd.volume.max * Snd.volumeBase,
					value: NoiseSnd.storageVolume() * Snd.volumeBase,
					slide: function(event, ui){
						set.sound.volume(ui.value / Snd.volumeBase, NoiseSnd);
						
						var snd = sndMgr.getFirstSndByType(NoiseSnd);
						
						if( ui.value ){
							if( !snd )
								sndMgr.addSnd(NoiseSnd);
							else if( !snd.isActive() && !sndMgr.stoped )
								snd.playRandomTrack();
						} else if( snd ){
							snd.stop();
						}
					}
				});
			}
			
			snip.sliderHandler(this.wrp.find('.js-options-audio-event-slider'), {
				min: Snd.volume.min,
				max: Snd.volume.max * Snd.volumeBase,
				value: EventSnd.storageVolume() * Snd.volumeBase,
				slide: function(event, ui){
					sndMgr.stopEventSnd();
					
					set.sound.volume(ui.value / Snd.volumeBase, EventSnd);
					
					if( ui.value ){
						if( !sndMgr.getFirstSndByType(EventSnd) )
							sndMgr.addSnd(EventSnd);
						
						sndMgr.playEventSnd(self.data.soundEventTrack);
					}
				}
			});
		};
		
		
	
	tabOptChat = function(){
	    this.name = 'chat';
	    this.tabTitle = 'Чат';
	    
		tabOptChat.superclass.constructor.apply(this, arguments);
	};

		utils.extend(tabOptChat, Tab);
		
		
		tabOptChat.bgColors = [
			'0,0,0',
			'153,51,51',
			'102,102,0',
			'51,102,51',
			'51,102,102',
			'0,102,102',
			'51,51,102',
			'102,0,102'
		];
		tabOptChat.defStyles = {
			bgcolor: '0,0,0',
			alpha: '0.5',
			fontSize: '9'
		};

		
		tabOptChat.prototype.getData = function(){
			this.data = {};
			
			this.data.styles = ls.getChatStyles(tabOptChat.defStyles);
			
			this.data.styles.alpha = utils.servRound(1 - this.data.styles.alpha) * 100;
			
	        this.dataReceived();
		};
		
        tabOptChat.prototype.addNotif = function(){
			this.notif.show = [Notif.ids.accBonus];
		};
        
		tabOptChat.prototype.bindEvent = function(){
			var self = this;
			
			this.wrp
				.on('change', '.js-options-chat-display', function () {
					ls.setChatDisplay($(this).prop('checked'));
					
					notifMgr.runEvent(Notif.ids.chatDisplay);
				})
				.on('input', '.js-options-chat-fontSize', function (e){
					utils.checkInputInt(this, {max: 30, min: 9, manualInput: !e.isTrigger});
					
					self.cont.find('.js-options-chat-fontSize-slider').slider({value: $(this).val()});
					
					self.setFontSize($(this).val());
					
					return false;
				})
				.on('input', '.js-options-chat-opacity', function (){
					utils.checkInputInt(this, {max: 100, min: 0});
					
					self.cont.find('.js-options-chat-opacity-slider').slider({value: $(this).val()});
					
					self.setOpacity($(this).val());
					
					return false;
				})
				.on('click', '.options-chat-bgButton', function (){
					var styles = ls.getChatStyles(tabOptChat.defStyles);
					
					styles.bgcolor = $(this).data('bgcolor');
					
					ls.setChatStyles(styles);
					
					self.checkColorSelected();
					
					notifMgr.runEvent(Notif.ids.chatStyles);
					
					return false;
				});
		};
		
		tabOptChat.prototype.afterDraw = function(){
            var self = this;
            
            snip.sliderHandler(this.wrp.find('.js-options-chat-fontSize-slider'), {
				min: 9,
				max: 30,
				value: this.data.styles.fontSize,
				step: 2,
				slide: function(event, ui){
					self.cont.find('.js-options-chat-fontSize').val(ui.value);
					
					self.setFontSize(ui.value);
				}
			});
            
			snip.sliderHandler(this.wrp.find('.js-options-chat-opacity-slider'), {
				min: 0,
				max: 100,
				value: this.data.styles.alpha,
				slide: function(event, ui){
					self.cont.find('.js-options-chat-opacity').val(ui.value);
					
					self.setOpacity(ui.value);
				}
			});
			
			snip.input1Handler(this.cont, {spinbox: {}});
            
			this.checkColorSelected();
		};
		
		
		tabOptChat.prototype.setOpacity = function(opacity){
			var styles = ls.getChatStyles(tabOptChat.defStyles);
			
			styles.alpha = utils.servRound(1 - opacity * 0.01);

			ls.setChatStyles(styles);

			notifMgr.runEvent(Notif.ids.chatStyles);
		};
		
		tabOptChat.prototype.setFontSize = function(size){
			var styles = ls.getChatStyles(tabOptChat.defStyles);
					
			styles.fontSize = size;
			
			ls.setChatStyles(styles);
			
			notifMgr.runEvent(Notif.ids.chatStyles, {fontSize:true});
		};
		
		tabOptChat.prototype.checkColorSelected = function(){
			this.cont.find('.options-chat-bgButton').each(function(){
				$(this).toggleClass('-active', ls.getChatStyles(tabOptChat.defStyles).bgcolor == $(this).data('bgcolor'));
			});
		};