/**
	Окно страны
*/

wCountry = function(id, data){
	wCountry.superclass.constructor.apply(this, arguments);
};

utils.extend(wCountry, Wnd);

WndMgr.regWnd('country', wCountry);


wCountry.reqTimeLimit = 30;

wCountry.prepareData = function(){
    return wofh.country ? {} : false;
};


wCountry.prototype.calcName = function(){
    return 'country';
};

wCountry.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.countryPost];
	
	this.notif.other[Notif.ids.countryChange] = this.changeNotifCountry;
	this.notif.other[Notif.ids.accInvite] = this.showInvite;
};

wCountry.prototype.calcChildren = function(){
	this.children.view = bCountry_view;
};

wCountry.prototype.bindEvent = function(){
    var self = this;
	
	if( utils.isTouchDevice() )
		utils.mobileClick(this.wrp, {cls:'.js-country-name, .country-title-flag'});
	
	this.wrp
			.on('click', '.js-country-name', function(){
				if( !wofh.account.isHead() || $(this).hasClass('-state-editing') )
					return;
				else
					$(this).addClass('-state-editing');
				
				$(this).html(tmplMgr.country.header.edit({name:wofh.country.name, lastRenameTime: self.data.lastRenameTime}));
				
				$(this).find('.js-country-editName').select();
			})
			.on('click', '.country-title-flag', function(){
				hashMgr.showWnd('editFlag');
			})
			.on('input', '.js-country-editName', function(){
				self.toggleRenameBtns($(this));
			})
			.on('focusout', '.js-country-editName', function(){
				var $parent = $(this).closest('.js-country-name');
				
				if( $parent.find('.country-rename-wrp').hasClass('-hidden') )
					$parent.removeClass('-state-editing').html(wofh.country.name);	
			})
			.on(utils.isTouchDevice() ? 'mouseup' : 'click', '.js-country-cancelName', function(){
				var $parent = $(this).parents('.js-country-name');
				
				$parent.removeClass('-state-editing').html(wofh.country.name);
				
				return false;
			})
			.on(utils.isTouchDevice() ? 'mouseup' : 'click', '.js-country-acceptName', function(){
				var $parent = $(this).parents('.js-country-name'),
					name = $parent.find('.js-country-editName').val();
					
				if( wofh.country.name != name )
					reqMgr.countryRename(name, function(){
						$parent.removeClass('-state-editing').html(name);
						
						servBuffer.temp.timer.countryRename = timeMgr.getNow();
						servBuffer.apply();
					});
				
				return false;
			})
			.on(utils.isTouchDevice() ? 'mouseup' : 'click', '.js-country-randomName', function(){
				$(this)	.closest('.js-country-name')
						.find('.js-country-editName')
						.val(utils.genLimitName(lib.country.namelimit[1], {sex: utils.random(2)}))
						.trigger('input');
				
				return false;
			})
			.on('change', '.js-setPost', function(){
				if( !(wofh.account.isMarshal() || wofh.account.isHead()) ) return;
				
				var accId = +$(this).val(),
					accPost = +$(this).data('post'),
					account = accId;

				for( var acc in self.data.accounts ){
					acc = self.data.accounts[acc];
					
					if( accId == acc.id ){
						account = acc;
						break;
					}
				}
				
				var $this = $(this);
				
				wndMgr.addConfirm(tmplMgr.country.postConfirm({post:wCountry.postConfirm[accPost], account:account}), {
					callbacks: {
						onAccept: function(){
							reqMgr.setPost(accId, accPost);
						},
						onCancel: function(){
							$this.find('option[selected="selected"]').prop('selected', 'selected');
						}
					}
				});
				
				return false;
			})
			//приглашение в страну
			.on('click', '.country-invite', function(){
				if( wofh.account.invites.length == 1 ) {
					var countryId = wofh.account.invites[0].country;
					
					wndMgr.addWnd(wCountryJoin, countryId);
				}
				else
					wndMgr.addWnd(wCountryJoinSelect);
			});
};

wCountry.prototype.afterDraw = function(){
	this.showInvite();
};


wCountry.prototype.changeNotifCountry = function(){
	if ( wofh.country )
		this.wrp.find('.country-title-block').html(tmplMgr.country.header.text());
	else
		this.close(); // Если вышли из страны
};


wCountry.prototype.toggleRenameBtns = function($el){
	$el.closest('.js-country-name').find('.country-rename-wrp').toggleClass('-hidden', $el.val().length < lib.country.namelimit[0]);
};

wCountry.prototype.showInvite = function(){
	this.wrp.find('.js-country-invite-block').html(tmplMgr.country.invite());
};



bCountry_view = function(id, data){
	this.name = 'view';
	
	bCountry_view.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(bCountry_view, Block);


bCountry_view.prototype.calcChildren = function(){
	this.children.info = tabMyCountryInfo;
	
	this.children.description = tabMyCountryDescription;
	
	if ( wofh.country.useMoney() )
		this.children.money = tabMyCountryMoney;
	
	if( wofh.account.isScientist() || wofh.account.isHead() )
		this.children.science = tabMyCountryScience;
	
	this.children.adviser = tabMyCountryAdviser;
	
	if( wofh.account.isGeneral() || wofh.account.isHead() )
		this.children.army = tabMyCountryArmy;
	
	if ( wofh.country.useOrders() )
		this.children.orders = tabMyCountryOrders;
	
	if( this.data.hasSpaceship )
		this.children.space = tabMyCountrySpace;
};

bCountry_view.prototype.getData = function(){
	var self = this;
	
	this.loaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'), 
		0, 
		function(){
			self.countReq = 1;
			
			self.getMyCountryData(self.dataReceived.bind(self));
			
			self.getSpaceshipsState();
		}
	);
};

bCountry_view.prototype.dataReceived = function(){
	if( !(--this.countReq) )
		bCountry_view.superclass.dataReceived.apply(this, arguments);
};

bCountry_view.prototype.beforeShowChildren = function(){   
    this.tabs = new Tabs(this.cont);
	
	this.tabs.addTabs(this.children);
};

bCountry_view.prototype.afterShow = function(){
	this.wrp.removeClass('-state-loading');

	contentLoader.stop(this.loaderId);

	this.tabs.openTab('info');
};


bCountry_view.prototype.tryUpdNotif = function(tab, callback){
	// Не вызывать запрос чаще чем раз в wCountry.reqTimeLimit сек
	if( tab.lastReqTime && timeMgr.getNow() - tab.lastReqTime < wCountry.reqTimeLimit )
		return;
	
	tab.lastReqTime = timeMgr.getNow();
	
	this.updNotif(callback);
};

bCountry_view.prototype.updNotif = function(callback){
	var self = this;
	
	this.clearTimeout(this.notifTimeout);
	
	this.notifTimeout = this.setTimeout(function(){
		self.getMyCountryData(callback);
	}, Notif.sDelay);
};

bCountry_view.prototype.close = function(){
	this.parent.close();
};


bCountry_view.prototype.getMyCountryData = function(callback) {
	this.getReqData(function(){
		var self = this;
		
		reqMgr.getMyCountryData(function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
					if( !resp || !resp.country ){
						this.parent.close();
						
						return;
					}
					
					var country = resp.country;
					
					this.data.accounts = [];
					this.data.invited = [];
					this.data.accPosts = {};
					
					var accountsTotal = {towns:0, pop:0, duty:0, taxesSum:0, showArmyPop: wofh.account.isGeneral()||wofh.account.isHead(), online: !!wofh.account.getPost(), showScience: wofh.account.isScientist()||wofh.account.isHead(), inc: 0, dec: 0},
						takes = (wofh.country.science||[]).takes||[]; // Массив городов страны, которые вкладывают в науку
					
					for(var account in country.accounts){
						account = country.accounts[account];
						account = wofh.world.getAccount(account.id, true).parse(account);

						account.inc = account.inc||0;
						account.dec = account.dec||0;

						if (account.power) {
							for (var postId in Country.posts) {
								if (account.power & (1<<postId))
									this.data.accPosts[postId] = account;
							}
						}

						if( account.armypop !== undefined ){
							if( accountsTotal.armypop === undefined ){
								accountsTotal.armypop = 0;
							}
							accountsTotal.armypop += account.armypop;
						}
						if( account.fleetpop !== undefined ){
							if( accountsTotal.fleetpop === undefined ){
								accountsTotal.fleetpop = 0;
							}
							accountsTotal.fleetpop += account.fleetpop;
						}
						if( account.airpop !== undefined ){
							if( accountsTotal.airpop === undefined ){
								accountsTotal.airpop = 0;
							}
							accountsTotal.airpop += account.airpop;
						}
						if( account.diplomacy !== undefined ){
							if( accountsTotal.diplomacy === undefined ){
								accountsTotal.diplomacy = 0;
							}
							accountsTotal.diplomacy += account.diplomacy;
						}
						if( account.death !== undefined ){
							if( accountsTotal.death === undefined ){
								accountsTotal.death = 0;
							}
							accountsTotal.death += account.death;
						}

						account.townslist = account.townslist||[]; // на всякий

						if( accountsTotal.showScience && takes.length ){
							account.inc = 0;
							account.dec = 0;
							var factor,
								science = wofh.country.science,
								spm = lib.science.spm[science.bonus],
								spmOther;

							for(var i = 0; i < account.townslist.length; i++){
								var townId = account.townslist[i];

								for(var j = 0; j < takes.length; j++){
									var take = takes[j];

									if( take[0] == townId ){
										account.inc += take[1]; // Производство
										if( science.bonusother && science.bonusother[townId] !== undefined )
											spmOther = lib.science.spm[science.bonusother[townId]];

										// + 1 - смещение позиции города на 1-цу
										if( spmOther ){
											factor = Math.min(Science.calcSpm(spm, j), Science.calcSpm(spmOther, j));
											spmOther = undefined;
										}
										else{
											factor = Science.calcSpm(spm, j);
										}

										account.dec += take[1] * factor; // Вложение

										break;
									}
								}
							}

							accountsTotal.inc += account.inc;
							accountsTotal.dec += account.dec;
						}

						account.towns = account.townslist.length;
						account.taxesSum = account.budget - account.taxes;
						accountsTotal.taxesSum += account.taxesSum;
						accountsTotal.duty += account.duty;
						accountsTotal.towns += account.towns;
						accountsTotal.pop += account.pop;

						this.data.accounts.push(account);
					}
					
					accountsTotal.dipNeedNow = wofh.country.diplomacyNeed(this.data.accounts.length);
					accountsTotal.dipNeedInvite = wofh.country.diplomacyNeed(this.data.accounts.length+1);
					
					this.data.accountsTotal = accountsTotal;
					
					// Приглашённые в страну
					for(var account in country.invited){
						account = country.invited[account];
						account = wofh.world.getAccount(account.id).clone().parse(account);

						this.data.invited.push(account);
					}

					resp.countrynotes = resp.countrynotes||[];

					resp.countrynotes.sort(function(a,b){return b.time-a.time;});

					var maxNotes = Math.min(10, resp.countrynotes.length),
						dateNotes = {}, // Объект событий по дате
						note,
						date;

					for(var i = 0; i < maxNotes; i++){
						note = resp.countrynotes[i];
						date = timeMgr.fMomentDate(note.time);

						if( dateNotes[date] === undefined )
							dateNotes[date] = [];

						dateNotes[date].push(note);
					}

					this.data.dateNotes = dateNotes;

					this.parent.data.lastRenameTime = this.getLastRenameTime(resp.countrynotes);

					// Голосовалка
					this.data.myvote = country.myvote;
					this.data.myvotes = country.myvotes;

					callback();
				}
			);
		});
	});
};

bCountry_view.prototype.getSpaceshipsState = function(){
	if( lib.mode.winmode == 2 || !wofh.account.isHead() ) return;
	
	this.countReq++;
	
	this.getReqData(function(){
		var self = this;
		
		reqMgr.getSpaceshipsState(function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
					this.data.hasSpaceship = false;
					
					for(var spaceship in resp.list){
						spaceship = resp.list[spaceship];

						if( 
							spaceship.country.id == wofh.country.id && 
							(spaceship.status == Build.spaceship.goes || spaceship.status == Build.spaceship.win)
						){
							this.data.hasSpaceship = true;
							
							break;
						}
					}
					
					this.dataReceived(); 
				}
			);
		});
	}, {minReqId: true});
};

bCountry_view.prototype.getLastRenameTime = function(countrynotes){
	var lastRenameTime = servBuffer.serv.timer.countryRename;
	
	for(var note in countrynotes){
		if( countrynotes[note].type == 2 ){
			lastRenameTime = countrynotes[note].time;
			break;
		}
	}
	
	return lastRenameTime;
};



/******
 * Вкладка info
 */

tabMyCountryInfo = function(){
    this.name = 'info';
	this.tabTitle = 'Обзор';
	
	tabMyCountryInfo.superclass.constructor.apply(this, arguments);
};

utils.extend(tabMyCountryInfo, Tab);


tabMyCountryInfo.getAccountsMaxHeight = function(){
	return Math.max(utils.getWindowHeight(-380 + (ls.getСountryInfoBrief(false) ? 100 : 0), 0), 150);
};


tabMyCountryInfo.prototype.getData = function(){
	this.data = {};
	
	this.data.accounts = this.parent.data.accounts;
	this.data.invited = this.parent.data.invited;
	this.data.dateNotes = this.parent.data.dateNotes;
	this.data.accPosts = this.parent.data.accPosts;
	this.data.accountsTotal = this.parent.data.accountsTotal;
	
	this.accSort(this.data.sortField = 'pop', this.data.sortDir = false);
	
    this.dataReceived();
};

tabMyCountryInfo.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.country-accounts-table thead td', function(){
			var $sort = $(this).find('.js-sort');
			
			self.data.sortField = $sort.data('field');
			self.data.sortDir = $sort.hasClass('-active') ? +!$sort.data('dir') : $sort.data('dir');
			
			self.accSort(self.data.sortField, self.data.sortDir);
			
			self.wrp.find('.country-accounts-table').html(tmplMgr.country.info.accounts.table(self.data));
		})
		.on('click', '.js-leave', function(){
			wndMgr.addWnd(wCountryExit, wofh.account).onAccept = function(){
				reqMgr.leaveCountry(self.parent.close.bind(self.parent));
			};
		})	
		.on('click', '.js-country-mission-edit .link', function(){
			self.data.linkClick = true;
		})
		.on('click', '.js-country-mission-edit', function(){
			// Запрещаем показывать окно если был клик по ссылке
			if( self.data.linkClick ){
				delete self.data.linkClick;
				
				return;
			}
			
			wndMgr.addTextEdit(wofh.country.mission, {
				header: 'Редактирование миссии',
				data: {
					maxlength: lib.country.missionmaxlen,
					alert: snip.alertTmpl.blocked.message()
				},
				callbacks: {
					calcName: function(){return 'country-editMission';},
					
					afterContSet: function(){
						this.toggleEdit(wofh.account.canMessage());
					},
					
					saveText: function(){
						if( this.isEditDisabled() )
							return;
						
						var wnd = this;
						
						var loaderId = contentLoader.start(
							this.wrp.find('.wnd-cont-wrp'), 
							0, 
							function(){
								reqMgr.setMission(wnd.getEditedText(), function(){
									contentLoader.stop(loaderId);
									
									wnd.close();
								});
							}
						);
					}
				}
			});
		})
		.on('click', '.js-setPost', function(){
			var post = +$(this).data('post');
				
				wndMgr.addSelect(self.data.accounts, {
					data: {
						defElem: self.data.accPosts[post]||new Account(),
						elemTmpl: tmplMgr.country.info.post.select
					}
				}).onSelect = function(elem, defElem){
					var wnd = this;
					
					if( elem.id != defElem.id ){
						var account = elem;
						
						wndMgr.addConfirm(tmplMgr.country.postConfirm({post:wCountry.postConfirm[post], account:account})).onAccept = function(){
							reqMgr.setPost(account, post);
							
							wnd.close();
						};
						
						return true;
					}
					else{
						// Должности могут пустовать
						if( post == Country.postIds.adviser || post == Country.postIds.warHelp1 || post == Country.postIds.warHelp2 ){
							wndMgr.addConfirm(tmplMgr.country.postConfirm({post:wCountry.postConfirm[post]})).onAccept = function(){
								reqMgr.setPost(0, post);

								wnd.close();
							};

							return true;
						}

						wnd.close();
					}
				};
		})
		.on('click', '.js-subsidy-button', function(){
			if( !utils.toInt(wofh.country.money.sum) ) return false;
			
			var account = self.data.accounts[$(this).parents('.js-country-account').data('index')];
			
			wndMgr.addModal(tmplMgr.country.subsidy({account:account}), {
				callbacks: {
					bindEvent: function(){
						var wnd = this;
						
						this.wrp
							.on('input', '.js-country-subsidy-moneyInput', function(event){
								wnd.checkSubsidy(this, event);
							})
							.on('click', '.js-country-subsidy-comment-title', function(){
								$(this).remove();
								
								wnd.wrp.find('.js-country-subsidy-comment-text').removeClass('-hidden');
							})
							.on('click', '.js-country-subsidy-setSubsidy', function(){
								wndMgr.addConfirm('Сделать перевод для ' + snip.accLink(account)).onAccept = function(){
									var sum = wnd.wrp.find('.js-country-subsidy-moneyInput').val(),
										text = wnd.wrp.find('.js-country-subsidy-comment-text').val();
									
									reqMgr.subsidy(account, sum, text, function(){
										wnd.close();
									});
								};
							});
							
						snip.input1Handler(this.wrp, {spinbox: {}});
					},
					afterDraw: function(){
						var wnd = this;
						
						this.data.$subsidyMoneyInput = wnd.wrp.find('.js-country-subsidy-moneyInput');
						
						snip.sliderHandler(wnd.wrp.find('.js-country-subsidy-moneySlider'), {
							min: 1,
							max: utils.toInt(wofh.country.money.sum),
							slide: function(event, ui) {
								wnd.checkSubsidy(wnd.data.$subsidyMoneyInput.val(ui.value));
								
								$(this).slider('option', 'step', event.shiftKey ? 5 : 1);
							}
						});
					},
					
					checkSubsidy: function(el, event){
						utils.checkInputInt(el, {max: utils.toInt(wofh.country.money.sum), min: 1, manualInput: event && !event.isTrigger});
					}
				}
			});
		})
		.on('click', '.js-country-info-brief', function(){
			ls.setСountryInfoBrief(self.wrp.find('.country-info-block').toggleClass('-brief').hasClass('-brief'));
			
			self.actualizeHeight();
		});
};

tabMyCountryInfo.prototype.addNotif = function(){
	this.notif.show.push(Notif.ids.countryMission);
	
	this.notif.other[Notif.ids.countryNotes] = 
	this.notif.other[Notif.ids.countryAccounts] = this.updNotif;
	this.notif.other[Notif.ids.countryInvite] = this.inviteNotif;
	this.notif.other[Notif.ids.countryMoney] = this.taxesUpdNotif;
};

tabMyCountryInfo.prototype.afterDraw = function(){
	this.initScroll({scrollbarPosition: 'outside'});
};

tabMyCountryInfo.prototype.afterOpenTab = function(){
	//ls.setLastCountryTab(this.name);
};


tabMyCountryInfo.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'country');
};


tabMyCountryInfo.prototype.accSort = function(sortField, sortDir) {
	sortDir = sortDir ? 1 : -1;
	
	switch( sortField ) {
		case 'online':
			this.data.accounts.sort(function(a,b){
				var aVal = a.id == wofh.account.id? -1: a.online;
				var bVal = b.id == wofh.account.id? -1: b.online;
				return aVal > bVal ? sortDir : -sortDir;
			});
			break;
		case 'name':
			this.data.accounts.sort(function(a,b){
				return a.getName().toLowerCase() < b.getName().toLowerCase() ? sortDir : -sortDir;
			});
			break;
		case 'towns':
			this.data.accounts.sort(function(a,b){
				return a.towns > b.towns ? sortDir : -sortDir;
			});
			break;
		case 'pop':
			this.data.accounts.sort(function(a,b){
				return a.pop > b.pop ? sortDir : -sortDir;;
			});
			break;
		case 'diplomacy':
			this.data.accounts.sort(function(a,b){
				return a.diplomacy > b.diplomacy ? sortDir : -sortDir;
			});
			break;
		case 'inc':
			this.data.accounts.sort(function(a,b){
				return a.inc > b.inc ? sortDir : -sortDir;
			});
			break;
		case 'taxes':
			this.data.accounts.sort(function(a,b){
				return a.taxesSum > b.taxesSum ? sortDir : -sortDir;
			});
			break;
		case 'duty':
			this.data.accounts.sort(function(a,b){
				return a.duty > b.duty ? sortDir : -sortDir;
			});
			break;
		case 'armypop':
			this.data.accounts.sort(function(a,b){
				return a.armypop > b.armypop ? sortDir : -sortDir;
			});
			break;
		case 'fleetpop':
			this.data.accounts.sort(function(a,b){
				return a.fleetpop > b.fleetpop ? sortDir : -sortDir;
			});
			break;
		case 'death':
			this.data.accounts.sort(function(a,b){
				return a.death > b.death ? sortDir : -sortDir;;
			});
			break;
	}
};

// Обрабатываем изменение налогов в стране
tabMyCountryInfo.prototype.taxesUpdNotif = function(data){
	if( data && data.taxes ) this.parent.updNotif(this.show.bind(this)); // Обновляем сразу, без учета reqTimeLimit, т.к. налоги меняются редко
};

tabMyCountryInfo.prototype.updNotif = function(){
	this.parent.tryUpdNotif(this, this.show.bind(this));
};

tabMyCountryInfo.prototype.inviteNotif = function(data){
	if( data.toggle )
		this.updNotif();
	else{
		for(var i = 0; i < this.data.invited.length; i++){
			var account = this.data.invited[i];
			
			if( !wofh.country.invited[account.id] ){
				this.data.invited.splice(i, 1);
				
				this.show();
				
				break;
			}
		}
	}
};

tabMyCountryInfo.prototype.actualizeHeight = function(){
    var $wrp = this.wrp.find('.country-accounts-block').css('max-height', tabMyCountryInfo.getAccountsMaxHeight());

    IScroll.do($wrp.get(0), 'update');
};


/******
 * Вкладка description
 */

tabMyCountryDescription = function(){
    this.name = 'description';
	this.tabTitle = 'Описание';
	
	tabMyCountryDescription.superclass.constructor.apply(this, arguments);
};

utils.extend(tabMyCountryDescription, Tab);

tabMyCountryDescription.prototype.getData = function(){
	if( !wofh.country ) return; // Если вышли из страны
	
	this.data = {};
	
	this.data.accounts = this.parent.data.accounts;
	
	this.data.myvote = this.parent.data.myvote;
	this.data.myvotes = this.parent.data.myvotes;
	
	// Отношения с другими странами
	var relations = [];
	for( var countryId in wofh.country.relations ){
		var relCountry = wofh.world.getCountry(+countryId, true);
		relCountry.relation = wofh.country.relations[+countryId];
		relations.push(relCountry);
	}
	
	this.data.relations = relations;
	
    this.dataReceived();
};

tabMyCountryDescription.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.js-country-text-edit .link', function(){
			self.data.linkClick = true;
		})
		.on('click', '.js-country-text-edit', function(){
			// Запрещаем показывать окно если был клик по ссылке
			if( self.data.linkClick ){
				delete self.data.linkClick;
				
				return;
			}
			
			wndMgr.addTextEdit(wofh.country.text, {
				header: 'Редактирование описания',
				data: {
					maxlength: lib.country.descriptionmaxlen,
					alert: snip.alertTmpl.blocked.message()
				},
				callbacks: {
					afterContSet: function(){
						this.toggleEdit(wofh.account.canMessage());
					},
					
					saveText: function(){
						if( this.isEditDisabled() )
							return;
						
						var wnd = this;
						
						var loaderId = contentLoader.start(
							this.wrp.find('.wnd-cont-wrp'), 
							0, 
							function(){
								reqMgr.countryDescription(wnd.getEditedText(), function(){
									contentLoader.stop(loaderId);
									
									wnd.close();
								});
							}
						);
					}
				}
			});
		})
		.on('change', '.js-country-vote', function(){
			reqMgr.leaderVote($(this).val(), function(){
				notifMgr.runEvent(Notif.ids.countryVote);
			});
		})
		.on('click', '.js-delRelation', function(){
			reqMgr.countrySetDiplomacy($(this).data('id'), 0);
		});
};

tabMyCountryDescription.prototype.addNotif = function(){
	this.notif.show.push(Notif.ids.countryChange);
	this.notif.show.push(Notif.ids.countryText);
	
	this.notif.other[Notif.ids.countryVote] = this.updNotif;
};

tabMyCountryDescription.prototype.afterDraw = function(){
	this.initScroll({scrollbarPosition: 'outside'});
};

tabMyCountryDescription.prototype.afterOpenTab = function(){
	//ls.setLastCountryTab(this.name);
};

tabMyCountryDescription.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'description');
};


tabMyCountryDescription.prototype.updNotif = function(){
	this.parent.tryUpdNotif(this, this.show.bind(this));
};



/******
 * Вкладка money
 */

tabMyCountryMoney = function(){
    this.name = 'money';
	this.tabTitle = 'Финансы';
	
	tabMyCountryMoney.superclass.constructor.apply(this, arguments);
};

utils.extend(tabMyCountryMoney, Tab);


tabMyCountryMoney.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.timerCountryMoney];
	
	this.notif.other[Notif.ids.countryArmy] = 
	this.notif.other[Notif.ids.countryMoney] = this.updNotif;
};

tabMyCountryMoney.prototype.getData = function(){
	this.updData();
	
    this.dataReceived();
};

tabMyCountryMoney.prototype.updData = function(){
	this.data = wofh.country.clone({cloneProp: true});
	
	this.data.accounts = {};
	
	var accounts = this.parent.data.accounts,
		creditRate = this.data.taxes.credit.rate * 0.001,
		depositRate = this.data.taxes.deposit.rate * 0.001;
	
	for(var account in accounts){
		account = accounts[account];
		
		account.credit = account.credit||0;
		account.creditPayment = account.credit * creditRate * timeMgr.invDtH;
		account.deposit = account.deposit||0;
		account.depositPayment = account.deposit * depositRate * timeMgr.invDtH;
		
		this.data.accounts[account.id] = account;
	}
	
	this.data.accCount = utils.sizeOf(this.data.accounts);
	
	this.data.taxes.budget.army = this.data.taxes.budget.army||{};
	this.data.taxes.budget.army.liveu = this.data.taxes.budget.army.liveu||{};
	this.data.taxes.budget.army.train = this.data.taxes.budget.army.train||{};
	this.data.taxes.budget.buildings = this.data.taxes.budget.buildings||{};
	this.data.money.budget.army = this.data.money.budget.army||{};
	this.data.money.budget.buildings = this.data.money.budget.buildings||{};

	wCountryMoneyUnits.prepareParentData(this.data.taxes.budget.army);
	wCountryMoneyDep.prepareParentData(this.data.taxes.tax);
	wCountryMoneyTrainUnits.prepareParentData(this.data.taxes.budget.army);
};


tabMyCountryMoney.prototype.bindEvent = function(){
    var self = this;
	
	if( wofh.account.isEconomist() ){
		this.wrp
			.on('input', '.country-money-cont input', function(){
				var $this = $(this);
				
				if( $this.hasClass('-type-float') )
					utils.checkInputFloat($this, $this.data('limit'), 0, $this.data('spinbox-fixed'));
				else
					utils.checkInputInt($this, {max: $this.data('limit'), min: 0});
			})
			.on('input', 'input', function(e, notCheck){
				if( notCheck || $(this).hasClass('js-ignoreEvent-input') )
					return;
				
				self.checkForm();
			})
			.on('click', '.js-country-money-taxes-addAlly', function (){
				self.getAlliances(true);
				
				return false;
			})
			.on('click', '.js-country-money-taxes-delAlly', function (){
				wndMgr.addConfirm().onAccept = function(){
					var id = $(this).data('id');
					
					self.cont.find('.js-country-money-taxes-ally-custom[data-id="' + id + '"]').remove();

					delete self.data.taxes.customs_[id];
					
					$(this).parents('.country-money-taxes-ally-block').remove();

					self.getAlliances(true, true);

					wndMgr.getWndByType(wCustoms).forEach( function(item) {
						item.close();
					});
					
					self.checkTaxesBlockHeight();
					
					self.checkForm();
				}.bind(this);
				
				return false;
			})
			.on('submit', '#js-country-setTax', function (){
				if( !self.data.canSubmit || !wofh.account.isEconomist() )
					return false;
				
				self.setCanSubmit(false);
				
				var data = utils.urlToObj($(this).serialize(), true),
					reqData = utils.clone(wofh.country.taxes);
					
				delete reqData.customs;
				
				reqData.budget.knowledgetakes = utils.servRound(parseFloat(data.knowledge_takes));
				
				reqData.budget.army = {};
				reqData.budget.army.death = utils.servRound(parseFloat(data.army_death));
				reqData.budget.army.live = self.data.taxes.budget.army.live;
				reqData.budget.army.liveu = self.data.taxes.budget.army.liveu;
				reqData.budget.army.train = self.data.taxes.budget.army.train;

				reqData.budget.buildings = {};
				reqData.budget.buildings.strategy = utils.servRound(parseFloat(data.buildings_strategy));
				reqData.budget.buildings.diplomacy = utils.servRound(parseFloat(data.buildings_diplomacy));


				reqData.budget.buildings.war = utils.servRound(parseFloat(data.buildings_war));
				reqData.budget.buildings.science = utils.servRound(parseFloat(data.buildings_science));
				reqData.budget.buildings.defence = utils.servRound(parseFloat(data.buildings_defence));

				reqData.budget.subsidy = self.data.taxes.budget.subsidy;

				reqData.budget.prod = self.data.taxes.budget.prod;
					
				reqData.tax.prodx = self.data.taxes.tax.prodx;
				
				reqData.tax.pop = parseFloat(data.tax);
				reqData.tax.trade = parseFloat(data.taxtr);
				
				reqData.tax.deposit = self.data.taxes.tax.deposit;

				// Получаем пошлины торговых союзов
				reqData.customs_ = self.data.taxes.customs_;
				
				reqData.deposit.maxp = utils.toInt(data.dep_maxp);
				reqData.deposit.maxc = utils.toInt(data.dep_maxc);
				reqData.deposit.rate = utils.toInt(data.dep_rate * 10);
				reqData.deposit.reserve = utils.toInt(data.dep_reserve);
				
				reqData.credit.maxp = utils.toInt(data.cred_maxp);
				reqData.credit.maxc = utils.toInt(data.cred_maxc);
				reqData.credit.rate = utils.toInt(data.cred_rate * 10);
				reqData.credit.reserve = utils.toInt(data.cred_reserve);
				
				
				self.data.isSettingTax = true;
				
				contentLoader.start(
					self.wrp, 
					100, 
					function(){
						reqMgr.setTax(reqData, function(){ // onFail
							self.data.isSettingTax = false;
						});
					}
				);

				return false;
			});
	}
	
	if( wofh.account.isHead() ){
		this.wrp.on('change', 'input[name="switchbarter"]', function (){
			var $this = $(this),
				on = $this.prop('checked');

			$this.prop({disabled: true, checked: !on});

			var loaderId = contentLoader.start(
				$this.closest('.checkboxBarter'), 
				0, 
				function(){
					reqMgr.setCountryBarter(on, function(){
						self.setTimeout(function(){
							contentLoader.stop(loaderId);
						}, 1500);
					});
				},
				{icon: ContentLoader.icon.small, cssPosition: {top: 8, left: 8}, hideNoPing: true, callback: function(loader){
					$this.prop('disabled', false);

					if( !loader.noPing )
						$this.prop('checked', on);
				}}
			);
		});
	}
	
	this.wrp
		.on('click', '.js-country-money-budget-units', function (){
			wndMgr.addWnd(wCountryMoneyUnits, self);
			
			return false;
		})
		.on('click', '.js-country-money-budget-helps', function (){
			wndMgr.addWnd(wCountryHelps, self);
			
			return false;
		})
		.on('click', '.js-country-money-taxes-ally', function(){
			var data = {};
			data.ally = wofh.tradeAllies.getElem($(this).data('id'));
			
			var allyId = data.ally.country ? 0 : data.ally.id;
			
			data.customs_ = self.data.taxes.customs_[allyId];
			data.parent = self;
			data.newAlly = !wofh.country.taxes.customs_[allyId];
			
			wndMgr.addWnd(wCustoms, data);
			
			return false;
		})
		.on('click', '.js-country-money-production', function(){
			var data = {
				budgetProd: self.data.taxes.budget.prod,
				taxesProd: self.data.taxes.tax.prodx,
				parent: self
			};
			
			wndMgr.addWnd(wProduction, false, data);
			
			return false;
		})
		.on('click', '.js-country-money-taxes-dep', function (){
			wndMgr.addWnd(wCountryMoneyDep, self);
		})
		.on('click', '.js-country-money-budget-trainUnits', function (){
			wndMgr.addWnd(wCountryMoneyTrainUnits, self);
			
			return false;
		})
		.on('input', 'input[name=dep_maxc]', function(){
			utils.checkInputInt(this, {max: lib.country.financeslimits.deposit.cou, min: 0});

			var sum = +$(this).val();

			sum -= self.data.money.deposites.sum;

			if(sum < 0) sum = 0;

			self.wrp.find('.js-country-deposit-avail').html( utils.formatNum(sum, {int:true, stages:true}) );
		})
		.on('input', 'input[name=cred_maxc]', function(){
			utils.checkInputInt(this, {max: lib.country.financeslimits.credit.cou, min: 0});

			var sum = +$(this).val();

			sum -= self.data.money.credites.sum;

			if(sum < 0) sum = 0;

			self.wrp.find('.js-country-credit-avail').html( utils.formatNum(sum, {int:true, stages:true}) );
		})
		.on('click', '.js-country-updMoneyData', function(){
			self.parent.updNotif(self.show.bind(self));
			
			return false;
		});
		
	snip.input1Handler(this.wrp);
};

tabMyCountryMoney.prototype.afterDraw = function(){
	if( wofh.account.isEconomist() ){
		this.$setTaxForm = this.wrp.find('#js-country-setTax');
		
		this.oldFormValues = utils.serializeToObject(this.$setTaxForm.serialize(), true);
		
		snip.spinboxHandler(this.wrp.find('.country-money-cont'));
	}
	else
		this.wrp.find('input').attr('readonly', 'readonly');
	
	// Получаем список торговых союзов
	this.getAlliances(false, false);
	
	this.wrp.find('input[name=dep_maxc]').trigger('input', [true]); // notCheck:[true] - отменяем вызов checkForm на событие input общего обработчика для всех input'ов
	this.wrp.find('input[name=cred_maxc]').trigger('input', [true]);
	
	this.checkForm();
	
	this.checkTaxesBlockHeight();
	
	this.initScroll({scrollbarPosition: 'outside'});
};

tabMyCountryMoney.prototype.afterOpenTab = function(){
	//ls.setLastCountryTab(this.name);
};

tabMyCountryMoney.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'money');
};


tabMyCountryMoney.prototype.updNotif = function(){
	this.clearTimeout(this.notifTimeout);
	
	this.notifTimeout = this.setTimeout(function(){
		if( !this.data.isSettingTax )
			this.cont.find('.js-country-updMoneyData-block').removeClass('-hidden');
		else
			this.show();
	}, Notif.sDelay);
};

tabMyCountryMoney.prototype.checkTaxesBlockHeight = function(){
	var $budget = this.wrp.find('.country-money-budget'),
		$taxes = this.wrp.find('.country-money-taxes');
	
	var minHeight = Math.max($budget.height(), $taxes.height());
	
	$budget.css('min-height', minHeight);
	$taxes.css('min-height', minHeight);
};



tabMyCountryMoney.prototype.getAlliances = function(addList, checkEmpty) {
	var self = this;
	
	// Список торговых союзов
	var alliances = {},
		showAddList = false,
		list = wofh.tradeAllies.getList();
	
	for(var ally in list){
		ally = list[ally];

		if((ally.incCountry && !ally.country) || utils.inArray(ally.members||[], wofh.country.id + BaseAccOrCountry.countryK)) {
			if( addList ){
				if( !this.data.taxes.customs_[ally.id] )
					alliances[ally.id] = ally.clone();
			}
			else{
				if( this.data.taxes.customs_[ally.id] )
					alliances[ally.id] = ally.clone();
				else
					if( !showAddList ){ // Проверяем есть ли торговые союзы в списке на добовление
						this.wrp.find('.js-country-money-taxes-addAlly-block').toggleClass('-hidden', false);
						showAddList = true;
					}
			}
		}
	}
	
	if( checkEmpty ){	
		this.wrp.find('.js-country-money-taxes-addAlly-block').toggleClass('-hidden', !utils.sizeOf(alliances));
		
		return;
	}
	
	if( addList ){
		wndMgr.addSelect(alliances, {
			data: {
				elemTmpl: tmplMgr.country.money.ally.select
			}
		}).onSelect = function(elem){
			wndMgr.addWnd(wCustoms, {
				ally: wofh.tradeAllies.getElem(elem.id),
				customs_: [],
				parent: self,
				newAlly: true
			});
		};
	}
	else{
		this.appendAlly(tmplMgr.country.money.taxes.allyButtonList, {alliances:alliances});
	}
};

//установка значения налогов от юнитов - данные получаем от wCountryMoneyUnits
tabMyCountryMoney.prototype.setUnitTaxes = function(data) {
    //преобразуем значения
    this.data.taxes.budget.army.live = data.baseRate;
	
	var taxes = this.data.taxes.budget.army.liveu;
	
    for(var unit in data.army.getList()){
        unit = data.army.getElem(unit);
        if ( unit.rate != null ){
            taxes[unit.id] = +unit.rate;
        } else {
        	delete taxes[unit.id];
        }
    }
	
    this.data.money.budget.army.live = data.totalSum;
	
    this.checkForm({checkUnits:true});
};

//установка значения налогов от местородов - данные получаем от wCountryMoneyDep
tabMyCountryMoney.prototype.setDepTaxes = function(data) {
    //преобразуем значения
    for(var deposit in data.deposits.getList()){
        deposit = data.deposits.getElem(deposit);
        
		this.data.taxes.tax.deposit[deposit.getOffsetId()] = +deposit.rate; 
    }
	
    this.checkForm();
};

//установка значения бюджетных выплат на тренировку юнитов - данные получаем от wCountryMoneyTrainUnits
tabMyCountryMoney.prototype.setTrainUnitsTaxes = function(data) {	
	var taxes = this.data.taxes.budget.army.train;
	
    for(var unit in data.army.getList()){
        unit = data.army.getElem(unit);
		if ( unit.rate != null && unit.rate )
			taxes[unit.id] = +unit.rate;
        else
			delete taxes[unit.id];
        
    }
	
    this.checkForm({checkTrainUnits:true});
};

//установка значения налогов субсидий - данные получаем от wCountryHelps
tabMyCountryMoney.prototype.setHelpsTaxes = function(accounts) {
	var subsidy = [];

	var total = 0;
	for( var account in accounts){
		account = accounts[account];

		total += account.subsidy.sum;

		if( account.subsidy.sum ){
			subsidy.push({
				sum: account.subsidy.sum,
				acc: account.id
			});
		}
	}

	this.data.taxes.budget.subsidy = subsidy;
	
    this.checkForm({checkSubsidy:true, data: {totalSubsidy:total}});
};

//установка производственных налогов/дотаций - данные получаем от wProduction
tabMyCountryMoney.prototype.setProductionTaxes = function(budgetProd, taxesProd){
	this.data.taxes.budget.prod = budgetProd;
	
	this.data.taxes.tax.prodx = taxesProd;
	
	this.checkForm({checkProd: true});
};

//установка значения налоговых пошлин торговых союзов - данные получаем от wCustoms
tabMyCountryMoney.prototype.setCustomsTaxes = function(ally, customs_) {
	var allyId = ally.country ? 0 : ally.id;
	
	if( !this.data.taxes.customs_[allyId] ){
		this.setCustoms(allyId, customs_);
		
		this.appendAlly(tmplMgr.country.money.taxes.allyButton, {ally:ally});
		
		this.getAlliances(true, true);
	}
	
	this.setCustoms(allyId, customs_);
	
    this.checkForm();
};

tabMyCountryMoney.prototype.setCustoms = function(allyId, customs_){
	this.data.taxes.customs_[allyId] = customs_;
};

tabMyCountryMoney.prototype.appendAlly = function(tmpl, data){
	this.wrp.find('.js-country-money-taxes-ally-before').before(tmpl(data));
	
	this.checkTaxesBlockHeight();
};



tabMyCountryMoney.prototype.checkForm = function(opt){
	var self = this,
		opt = opt||{};
	
	if( !wofh.account.isEconomist() )
		return false;
	
	// Проверка на изменения данных налоговой политики
	var isSame =	self.data.sameTrainUnits === false || 
					self.data.sameUnits === false || 
					self.data.sameSubsidy === false ||
					self.data.sameProd === false
					? false : true; 
	
	// Налоги на юнитов
	if( opt.checkUnits ){
		var sameUnits = true,
			oldTaxArmy = wofh.country.taxes.budget.army||{},
			oldMonArmy = wofh.country.money.budget.army||{},
			newTaxArmy = this.data.taxes.budget.army,
			newMonArmy = this.data.money.budget.army;
		
		sameUnits = (oldTaxArmy.live||0).toFixed(2) == (newTaxArmy.live||0).toFixed(2);
		
		if( sameUnits ){ 
			sameUnits = utils.isEqual(oldTaxArmy.liveu||{}, newTaxArmy.liveu, function(a, b){
				return a.toFixed(2) != b.toFixed(2);
			});
		}
		
		if( sameUnits ) sameUnits = (oldMonArmy.live||0).toFixed(2) == (newMonArmy.live||0).toFixed(2);
		
		if( sameUnits ){
			// Показываем стфрую сумму
			this.cont.find('.js-country-money-budget-armyLive-sum').html(utils.stages(utils.toInt(oldMonArmy.live))).removeClass('-warn');
			this.cont.find('.js-country-money-budget-armyLive-alert').addClass('-hidden');
		}
		else{
			// Показываем новую сумму
			this.cont.find('.js-country-money-budget-armyLive-sum').html(utils.stages(utils.toInt(newMonArmy.live))).addClass('-warn');
			this.cont.find('.js-country-money-budget-armyLive-alert').removeClass('-hidden');
		}
		
		isSame = self.data.sameUnits = sameUnits;
	}
	
	// Налоги выплоты на тренировку юнитов
	if( opt.checkTrainUnits ){
		var oldTaxArmy = wofh.country.taxes.budget.army||{},
			newTaxArmy = this.data.taxes.budget.army;
		
		sameUnits = utils.isEqual(oldTaxArmy.train||{}, newTaxArmy.train, function(a, b){
			return (a||0).toFixed(2) != (b||0).toFixed(2);
		});
		
		if( sameUnits )
			this.cont.find('.js-country-money-budget-trainUnits-alert').addClass('-hidden');
		else
			this.cont.find('.js-country-money-budget-trainUnits-alert').removeClass('-hidden');
		
		isSame = self.data.sameTrainUnits = sameUnits;
	}
	
	// Субсидии
	if( opt.checkSubsidy ){
		var sameSubsidy = true,
			newSubsidy = this.data.taxes.budget.subsidy,
			oldSubsidy = (wofh.country.taxes.budget||{}).subsidy||[];
		
		if( newSubsidy.length == oldSubsidy.length ){
			function _getSubsidyByAccId(accId, subsidy){
				for( var i = 0; i < subsidy.length; i++ ){
					if( accId == subsidy[i].acc ){
						return subsidy[i];
					}
				}

				return false;
			}

			for( var i = 0; i < newSubsidy.length; i++ ){
				var newSub = newSubsidy[i];
				var oldSub = _getSubsidyByAccId(newSub.acc, oldSubsidy);
				if( !oldSub || oldSub.sum != newSub.sum ){
					sameSubsidy = false;
					break;
				}
			}
		}
		else
			sameSubsidy = false;
		
		if( sameSubsidy ){
			this.cont.find('.js-country-subsidySum').text(utils.stages(~~wofh.country.money.budget.subsidy)).removeClass('cl-red');
			this.cont.find('.js-country-money-budget-helps-alert').addClass('-hidden');
		}
		else{
			this.cont.find('.js-country-subsidySum').text(utils.stages(~~opt.data.totalSubsidy)).addClass('cl-red');
			this.cont.find('.js-country-money-budget-helps-alert').removeClass('-hidden');	
		}
		
		isSame = self.data.sameSubsidy = sameSubsidy;
	};
	
	// Производственные налоги
	if( opt.checkProd ){
		var sameProd = true;

		sameProd = utils.isEqual(self.data.taxes.budget.prod, wofh.country.taxes.budget.prod);

		if( sameProd )
			sameProd = utils.isEqual(self.data.taxes.tax.prodx, wofh.country.taxes.tax.prodx);

		this.cont.find('.js-country-money-production-alert').toggleClass('-hidden', sameProd);

		isSame = self.data.sameProd = sameProd;
	}
	
	// Налоги на месторождения
	if( isSame )
		isSame = utils.isEqual(self.data.taxes.tax.deposit, wofh.country.taxes.tax.deposit);
	
	// Налоги торговых союзов
	if( isSame )
		isSame = utils.isEqual(self.data.taxes.customs_, wofh.country.taxes.customs_);
	
	// Все остольные поля формы
	if( isSame ){
		var curFormValues = utils.serializeToObject(this.$setTaxForm.serialize(), true);

		if( utils.sizeOf(curFormValues) == utils.sizeOf(this.oldFormValues) ){
			for(var key in curFormValues){
				if( +curFormValues[key] != +this.oldFormValues[key] ){
					isSame = false;
					break;
				}
			}
		}
		else
			isSame = false;
	}
	
	this.setCanSubmit(!isSame);
};

tabMyCountryMoney.prototype.setCanSubmit = function(state){
	if( this.data.canSubmit != state ){
		this.data.canSubmit = state;
		
		this.cont.find('.js-country-setTaxBtn').toggleClass('-disabled', !state);
	}
};


tabMyCountryMoney.taxes = {};

tabMyCountryMoney.taxes.prodType = {
	budget: 0,
	taxes: 1
};



/******
 * Вкладка science
 */

tabMyCountryScience = function(){
    this.name = 'science';
	this.tabTitle = 'Наука';
	
	tabMyCountryScience.superclass.constructor.apply(this, arguments);
};

utils.extend(tabMyCountryScience, Tab);

tabMyCountryScience.prototype.getData = function(){
	this.data = {};
	
	var takes = wofh.country.science.takes;
	
	this.data.towns = [];
	
	if( !takes ){
		this.dataReceived();
		
		return;
	}
	
	var factor,
		science = wofh.country.science,
		spm = lib.science.spm[science.bonus],
		spmOther,
		town;
	
	for (var index in takes){
		town = wofh.world.getTown(takes[index][0], true).parse({inc:takes[index][1], index: +index});

		if( science.bonusother && science.bonusother[town.id] !== undefined )
			spmOther = lib.science.spm[science.bonusother[town.id]];

		// + 1 - смещение позиции города на 1-цу
		if( spmOther ){
			factor = Math.min(Science.calcSpm(spm, town.index), Science.calcSpm(spmOther, town.index));
			spmOther = undefined;
		}
		else{
			factor = Science.calcSpm(spm, town.index);
		}

		town.dec = town.inc * factor; // Вложение
		town.efficiency = factor * 100;

		this.data.towns.push(town);
	}
	
    this.dataReceived();
};

tabMyCountryScience.prototype.bindEvent = function(){};

tabMyCountryScience.prototype.addNotif = function(){
	this.notif.show.push(Notif.ids.countryTowns);
};

tabMyCountryScience.prototype.afterDraw = function(){
	this.table = new tblMyCountryScience(this, this.cont);
	
	this.table.toggleSort('efficiency');
};

tabMyCountryScience.prototype.afterOpenTab = function(){
	//ls.setLastCountryTab(this.name);
};

tabMyCountryScience.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'science');
};



tblMyCountryScience = function(parent, cont) {
    this.tmpl = tmplMgr.country.science.table;
    this.data = {};
    this.data.list = parent.data.towns;
    
	tblMyCountryScience.superclass.constructor.apply(this, arguments);
	
	this.options.useScroll = true;
	
    this.bind();
};

utils.extend(tblMyCountryScience, Table);

tblMyCountryScience.prototype.getSortVal = function(town, field, exField) {
	if (field == 'acc') return town.account.name.toLowerCase();
    if (field == 'efficiency') return town.efficiency;
	if (field == 'dec') return town.dec;
	if (field == 'inc') return town.inc;
	
	if (exField == 'acc')
		return -town.inc;
	
    return town.inc;
};

tblMyCountryScience.prototype.afterDraw = function() {
	var showTable = !this.data.list.length;
	
	if( this.showTable != showTable ){
		this.parent.wrp.find('.tbl').toggleClass('-hidden', showTable);
		
		this.showTable = showTable;
	}
};



/******
 * Вкладка adviser
 */

tabMyCountryAdviser = function(){
    this.name = 'adviser';
	this.tabTitle = 'Статистика';
	
	tabMyCountryAdviser.superclass.constructor.apply(this, arguments);
};

utils.extend(tabMyCountryAdviser, Tab);


tabMyCountryAdviser.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'adviser');
};

tabMyCountryAdviser.prototype.getHref = function(){
	return hashMgr.getWndHref('countryAdviser');
};

tabMyCountryAdviser.prototype.isClickable = function(){
	return false;
};


/******
 * Вкладка army
 */

tabMyCountryArmy = function(){
    this.name = 'army';
	this.tabTitle = 'Война';
	
	tabMyCountryArmy.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(tabMyCountryArmy, Tab);

tabMyCountryArmy.prototype.show = function(){
	if( this.canShow() )
		tabMyCountryArmy.superclass.show.apply(this, arguments);
};

tabMyCountryArmy.prototype.getData = function(){
	this.data.filterUnits = ls.getCountryArmyUnitFilter({land: true, fleet: true, air: true, noattack: true});
		
	this.getReqData(function(){
		var self = this;
		
		reqMgr.getCountryArmies(function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
					resp.list = resp.list||[];
		
					var minTimeEvent = {};
					minTimeEvent.ai = {count:0};
					minTimeEvent.ao = {count:0};
					minTimeEvent.di = {count:0};
					minTimeEvent.do = {count:0};

					for( var armyData in resp.list ){
						armyData = resp.list[armyData];

						armyData.army = new Army(armyData.army);

						if( armyData.ai.count ){
							if( minTimeEvent.ai.time === undefined ){
								minTimeEvent.ai.time = armyData.ai.time;
							}
							else if( armyData.ai.time < minTimeEvent.ai.time ){
								minTimeEvent.ai.time = armyData.ai.time;
							}

							minTimeEvent.ai.count += armyData.ai.count;
						}
						if( armyData.ao.count ){
							if( minTimeEvent.ao.time === undefined ){
								minTimeEvent.ao.time = armyData.ao.time;
							}
							else if( armyData.ao.time < minTimeEvent.ao.time ){
								minTimeEvent.ao.time = armyData.ao.time;
							}

							minTimeEvent.ao.count += armyData.ao.count;
						}
						if( armyData.di.count ){
							if( minTimeEvent.di.time === undefined ){
								minTimeEvent.di.time = armyData.di.time;
							}
							else if( armyData.di.time < minTimeEvent.di.time ){
								minTimeEvent.di.time = armyData.di.time;
							}

							minTimeEvent.di.count += armyData.di.count;
						}
						if( armyData.do.count ){
							if( minTimeEvent.do.time === undefined ){
								minTimeEvent.do.time = armyData.do.time;
							}
							else if( armyData.do.time < minTimeEvent.do.time ){
								minTimeEvent.do.time = armyData.do.time;
							}

							minTimeEvent.do.count += armyData.do.count;
						}
					}

					this.data.armyList = resp.list;
					this.data.minTimeEvent = minTimeEvent;

					this.findMinTimeEvent();

					var defFilter = {a: {i:0, o:0}, d: {i:0, o:0}, all: [1]};

					this.data.filter = ls.getCountryArmyFilter(defFilter);
					if( !this.data.filter.all ){
						this.data.filter.all = [1];
						ls.setCountryArmyFilter(defFilter);
					}

					this.parent.tabs.reload();

					this.dataReceived();
				}
			);
		});
	});
};

tabMyCountryArmy.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.countryAttack];
};

tabMyCountryArmy.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.filter-input', function(){
			self.data.filter[$(this).data('type')][$(this).data('dir')] = +$(this).prop('checked');
			
			ls.setCountryArmyFilter(self.data.filter);
			
			self.table.show();
		})
		.on('click', '.filter-units', function(){
			self.data.filterUnits[$(this).data('type')] = $(this).prop('checked');
			
			ls.setCountryArmyUnitFilter(self.data.filterUnits);
			
			self.table.show();
		});
};

tabMyCountryArmy.prototype.afterDraw = function(){
	if( this.table ){
		// Восстанавливаем параметры сортировки, которые были до обнавления
		var field = this.table.field,
			dirDown = this.table.dirDown;
	}
	
	this.table = new tblMyCountryArmy(this, this.cont);
	
	// После сортировки производим фильтрацию
	this.table.prepareData = function(){
		this.filter();
	}.bind(this);
	
	this.table.toggleSort(field||'armypop', dirDown);
};

tabMyCountryArmy.prototype.afterOpenTab = function(){
	//ls.setLastMyCountryTab(this.name);
	if( this.table && this.table.getBlockHeight() )
		this.table.show();
};

tabMyCountryArmy.prototype.getIcon = function(){
	if( wofh.country.hasAttackIn() )
		return snip.wrp('-anim-blink', snip.eventIconArmy('a', 'i'));
	
	return snip.icon(snip.c.tabIcon, 'army');
};

tabMyCountryArmy.prototype.getCls = function(){
	if( wofh.country.hasAttackIn() )
		return '-type-hasCountryAttackIn';
};


tabMyCountryArmy.prototype.updNotif = function(){
	//ls.setLastCountryTab(this.name);
};

tabMyCountryArmy.prototype.filter = function() {
	var armyList = this.data.armyList;
	for(var army in armyList){
		army = armyList[army];
		
		army.show = false;
		
		if( 
			(this.data.filter.a.i && army.ai.count) || 
			(this.data.filter.a.o && army.ao.count) || 
			(this.data.filter.d.i && army.di.count) || 
			(this.data.filter.d.o && army.do.count) ||
			(this.data.filter.all[0] && !army.ai.count && !army.ao.count && !army.di.count && !army.do.count)
		){
			army.show = true;
		} 
	}
};

tabMyCountryArmy.prototype.canShow = function() {
	//Не вызывать запрос чаще чем раз в wCountry.reqTimeLimit сек
	if( this.lastReqTime && timeMgr.getNow() - this.lastReqTime < wCountry.reqTimeLimit )
		return false;
	
	this.lastReqTime = timeMgr.getNow();
	
	return true;
};

tabMyCountryArmy.prototype.findMinTimeEvent = function(){
	this.clearTimeout(this.minTimeEventId);
	
	var minTimeEvent;
	for(var timeEvent in this.data.minTimeEvent){
		timeEvent = this.data.minTimeEvent[timeEvent].time;
		
		if( timeEvent ){
			if( minTimeEvent === undefined )
				minTimeEvent = timeEvent;
			else if( timeEvent < minTimeEvent )
				minTimeEvent = timeEvent;
		}
	}
	
    minTimeEvent = minTimeEvent||0;

    minTimeEvent = (minTimeEvent + tabMyCountryArmy.minTimeEventDelay) - timeMgr.getNow();

	if( minTimeEvent > 0 )
		this.minTimeEventId = this.setTimeout(function(){
			delete this.lastReqTime;
			
			this.show();
		}, minTimeEvent * timeMgr.StMS );
};



tabMyCountryArmy.minTimeEventDelay = 5; // Задержка в 5 секунд, чтобы исскуственно завершенное событие не обновляло вкладку по нескольку раз.



tblMyCountryArmy = function(parent, cont) {
    this.tmpl = tmplMgr.country.army.table;
    this.data = {};
    this.data.list = parent.data.armyList;
    this.data.filter = parent.data.filter;
	this.data.filterUnits = parent.data.filterUnits;
    
	tblMyCountryArmy.superclass.constructor.apply(this, arguments);
    
    this.options.useScroll = true;
    this.options.useBlocks = true;
    
    this.bind();
};

utils.extend(tblMyCountryArmy, Table);

tblMyCountryArmy.prototype.getSortVal = function(army, field) {
	if (field == 'online') return army.town.account.online;
    if (field == 'armypop') return army.armypop;
	if (field == 'time') {
        var min = 9999999999999;
        var filter = this.parent.data.filter;
        if (filter.a.i) min = Math.min(min, army.ai.time);
        if (filter.a.o) min = Math.min(min, army.ao.time);
        if (filter.d.i) min = Math.min(min, army.di.time);
        if (filter.d.o) min = Math.min(min, army.do.time);
        return min;
    }
	if (field == 'acc') return army.town.account.name.toLowerCase();
	
    return army.armypop;
};



/******
 * Вкладка orders
 */

tabMyCountryOrders = function(){
    this.name = 'orders';
	this.tabTitle = 'Заказы ресурсов';
	
	tabMyCountryOrders.superclass.constructor.apply(this, arguments);
};

utils.extend(tabMyCountryOrders, Tab);


tabMyCountryOrders.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'orders');
};

tabMyCountryOrders.prototype.getHref = function(){
	return hashMgr.getWndHref('countryOrders');
};

tabMyCountryOrders.prototype.isClickable = function(){
	return false;
};



/******
 * Вкладка space
 */

tabMyCountrySpace = function(){
    this.name = 'space';
	this.tabTitle = '';
	
	tabMyCountrySpace.superclass.constructor.apply(this, arguments);
};

utils.extend(tabMyCountrySpace, Tab);

tabMyCountrySpace.prototype.getData = function(){
	this.data = {};
	
    this.dataReceived();
};

tabMyCountrySpace.prototype.addNotif = function(){
	
};

tabMyCountrySpace.prototype.afterOpenTab = function(){
	
};

tabMyCountrySpace.prototype.getIcon = function(){
	return snip.icon(snip.c.tabIcon, 'space');
};

tabMyCountrySpace.prototype.getHref = function(){
	return hashMgr.getWndHref('countrySpace');
};

tabMyCountrySpace.prototype.isClickable = function(){
	return false;
};



wCountry.postConfirm = {};
wCountry.postConfirm[Country.postIds.head] = 'Главы ';
wCountry.postConfirm[Country.postIds.science] = 'Мудреца ';
wCountry.postConfirm[Country.postIds.war] = 'Воеводы ';
wCountry.postConfirm[Country.postIds.economics] = 'Казначея ';
wCountry.postConfirm[Country.postIds.warHelp1] = 'Помощника воеводы ';
wCountry.postConfirm[Country.postIds.warHelp2] = 'Помощника воеводы ';
wCountry.postConfirm[Country.postIds.adviser] = 'Советника ';
wCountry.postConfirm[Country.postIds.accountant] = 'Учётчика ';
wCountry.postConfirm[Country.postIds.accountantHelp1] = 'Помощника учётчика';
wCountry.postConfirm[Country.postIds.accountantHelp2] = 'Помощника учётчика';





/**
	Окно таможенных пошлин
*/

wCustoms = function(id, data){
	this.name = 'custom';
	
	wCustoms.superclass.constructor.apply(this, arguments);
};

utils.extend(wCustoms, Wnd);

wCustoms.prepareData = function(data){
    return data;
};


wCustoms.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('submit', '.js-country-money-taxes-customs', function (){
			if( !wofh.account.isEconomist() ){
				self.close();
				
				return false;
			}

			if( !self.data.canSave )
				return false;

			var customs_ = [];

			$(this).find('input').each(function(){
				customs_[~~$(this).data('index')] = ~~$(this).val();
			});

			// Зануляем undefined элементы, чтоб сервер нормально принял массив
			var sum = 0;
			for(var i = 0; i < customs_.length; i++){
				sum += customs_[i] = customs_[i]||0;
			}

			// Не добавляем под налоги НОВЫЙ союз, если в нем небыло изменений
			if( !(self.data.newAlly && !sum) )
				self.data.parent.setCustomsTaxes(self.data.ally, customs_);

			self.close();

			return false;
		});
	
	if( wofh.account.isEconomist() ){
		this.wrp
			.on('input', 'input', function (){
				$(this).attr('value', utils.checkInputInt(this, {max: 100, min: 0}));

				if( self.data.newAlly )
					self.checkCanSave();
				else
					self.setCanSave(true);
			})
			.on('click', '.js-delCustoms', function (){
				self.data.parent.wrp.find('.js-country-money-taxes-delAlly[data-id="' + self.data.ally.id + '"]').click();
			});
		
		snip.input1Handler(this.cont, {spinbox:{}});
		
		this.setCanSave(false);
	}
	else
		this.wrp.find('input').attr('readonly', 'readonly');
};

wCustoms.prototype.setCanSave = function(state){
	if( this.data.canSave != state ){
		this.data.canSave = state;
		
		this.wrp.find('.js-country-money-taxes-saveCustoms').toggleClass('-disabled', !state);
	}
};

wCustoms.prototype.checkCanSave = function(){
	this.setCanSave(this.wrp.find('input[value!=0]').length);
};





/**
	Окно производственных налгов/дотаций
*/

wProduction = function(id, data){
	wProduction.superclass.constructor.apply(this, arguments);
};

utils.extend(wProduction, Wnd);


wProduction.prepareData = function(id, extData){
    return extData;
};


wProduction.prototype.calcName = function(){
	return 'production';
};

wProduction.prototype.bindEvent = function(){
    var self = this;
	
	if( wofh.account.isEconomist() ){
		this.wrp
			.on('submit', '.js-country-money-production', function (){
				if( !self.data.canSave )
					return false;

				var budgetProd = utils.clone(self.data.budgetProd),
					taxesProd = utils.clone(self.data.taxesProd);
				
				$(this).find('input.-type-budget').each(function(){
					var val = $(this).val();
					
					if( ls.getCountryMoneyProdFloat(true) )
						val = (val * 1000) + Appl.C_EPSILON1000;
					
					budgetProd[utils.toInt($(this).data('resid'))] = utils.toInt(val);
				});

				$(this).find('input.-type-taxes').each(function(){
					var val = $(this).val();
					
					if( ls.getCountryMoneyProdFloat(true) )
						val = (val * 1000) + Appl.C_EPSILON1000;
					
					taxesProd[utils.toInt($(this).data('resid'))] = utils.toInt(val);
				});

				self.data.parent.setProductionTaxes(budgetProd, taxesProd);
				
				self.close();
				
				return false;
			})
			.on('change', '.js-prod-float', function (){
				self.wrp.find('.js-country-money-production input').each(function(){
					var val = $(this).val();
					
					if( ls.getCountryMoneyProdFloat(true) )
						val = utils.formatNum((val * 1000) + Appl.C_EPSILON1000, {int: true});
					else
						val = utils.formatNum(val * 0.001, {fixed: 3});
					
					$(this).val(val);
				});
				
				ls.setCountryMoneyProdFloat($(this).prop('checked'));
			})
			.on('input', '.js-production-res input', function (){
				if( ls.getCountryMoneyProdFloat(true) )
					utils.checkInputFloat(this, $(this).data('limit'), 0, 3);
				else
					utils.checkInputInt(this, $(this).data('limit'), 0);
					
				$(this).removeClass('-type-reseted');
				
				$(this).toggleClass('-type-zero', !+$(this).val());
				
				$(this)
						.closest('.js-production-res')
						.find('input.-type-'+$(this).data('reset-type'))
						.val(utils.formatNum(0, {fixed: ls.getCountryMoneyProdFloat(true) ? 3 : 0}))
						.addClass('-type-reseted');
				
				self.setCanSave(true);
			});
		
		snip.input1Handler(this.cont, {spinbox:{}});
		
		this.setCanSave(false);
	}
	else
		this.wrp.find('input').attr('readonly', 'readonly');
};

wProduction.prototype.afterShow = function(){
	this.initScroll({scrollbarPosition: 'outside'});
};

wProduction.prototype.setCanSave = function(state){
	if( this.data.canSave != state ){
		this.data.canSave = state;
		
		this.cont.find('.js-country-money-taxes-saveProduction').toggleClass('-disabled', !state);
	}
};





wCountryExit = function(id, data){
	data.isExclude = data.account.id != wofh.account.id;
	
	wCountryExit.superclass.constructor.apply(this, [tmplMgr.country.exit(data), {
		header: data.isExclude ? 'Исключение из страны' : 'Выход из страны'
	}]);
	
	this.options.rubber = true;
};

utils.extend(wCountryExit, ConfirmWnd);


wCountryExit.prepareData = function(account){
	return {account: account};
};


wCountryExit.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp.on('change', 'input', function(){
		self.checkCanConfirm();
	});
	
	this.checkCanConfirm();
};


wCountryExit.prototype.checkCanConfirm = function(){
	var	canConfirm = this.wrp.find('input:checkbox').length == this.wrp.find('input:checkbox:checked').length;
	
	this.toggleAccept(!canConfirm);
};





/**
	Окно армий страны
*/

wCountryArmy = function(){
	this.name = 'countryArmy';
	this.hashName = 'countryArmy';
	
	wCountryArmy.superclass.constructor.apply(this, arguments);
};

utils.extend(wCountryArmy, Wnd);

WndMgr.regWnd('countryArmy', wCountryArmy);


wCountryArmy.prepareData = function(id, extData) {
	if( !wofh.account.isGeneral() )
		return false;
	
	return {};
};


wCountryArmy.prototype.getData = function(){
	this.data.list = Army.getAll().setSorted(true).filter(function(unit){
		unit.all = wofh.country.army.getElem(unit.getId()).getCount();
		unit.train = wofh.country.armytraining.getElem(unit.getId()).getCount();
		unit.has = unit.all - unit.train;
		
		return !(unit.getHoliday());
	}).getList();
	
	this.data.filterUnits = {land: true, fleet: true, air: true, noattack: true};
	
	this.dataReceived();
};

wCountryArmy.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('click', '.filter-units', function(){
			self.data.filterUnits[$(this).data('type')] = $(this).prop('checked');
			
			self.table.show();
		})
		.on('input', '.countryArmy-filterUnitName', function(){
			self.table.data.filterName = $(this).val();
			
			self.table.show();
		});
		
	snip.input1Handler(this.wrp);
};

wCountryArmy.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.countryArmy];
};

wCountryArmy.prototype.afterDraw = function(){
	this.table = new tblCountryArmy(this, this.cont);
	
	this.table.toggleSort('era');
};



tblCountryArmy = function(parent, cont) {
    this.tmpl = tmplMgr.countryArmy.table;
    this.data = {};
    this.data.list = parent.data.list;
	this.data.filterUnits = parent.data.filterUnits;
    
	tblMyCountryArmy.superclass.constructor.apply(this, arguments);
    
    this.options.useScroll = true;
    
    this.bind();
};

utils.extend(tblCountryArmy, Table);

tblCountryArmy.prototype.getSortVal = function(unit, field) {
	if (field == 'era') return -unit.getEra();
    if (field == 'has') return unit.has;
	if (field == 'train') return unit.train;
	if (field == 'all') return unit.all;
	
    return -unit.getId();
};