/**
	Окно денег
*/

wMoney = function(){
	wMoney.superclass.constructor.apply(this, arguments);
};

utils.extend(wMoney, Wnd);

WndMgr.regWnd('money', wMoney);


// Лимит налоговой задожености (НЗ) акка. Если денег более 500, НЗ не показывается в окне денег 
wMoney.debtLimit = 500;

wMoney.updTime = 5000;

wMoney.moneyMoveText = {};
wMoney.moneyMoveText[Trade.moneyMoveType.trade] = 'Торговля';
wMoney.moneyMoveText[Trade.moneyMoveType.pledge] = 'Залог';
wMoney.moneyMoveText[Trade.moneyMoveType.admin] = 'Торговый путь';
wMoney.moneyMoveText[Trade.moneyMoveType.credit] = 'Кредит';
wMoney.moneyMoveText[Trade.moneyMoveType.subsidy] = 'Субсидия';
wMoney.moneyMoveText[Trade.moneyMoveType.deposit] = 'Депозит';
wMoney.moneyMoveText[Trade.moneyMoveType.send] = 'Передача';
wMoney.moneyMoveText[Trade.moneyMoveType.tax] = 'Налоги';
wMoney.moneyMoveText[Trade.moneyMoveType.budget] = 'Бюджетные выплаты';
wMoney.moneyMoveText[Trade.moneyMoveType.slot] = 'Покупка места в городе';
wMoney.moneyMoveText[Trade.moneyMoveType.buildOff] = 'Отключение строения';
wMoney.moneyMoveText[Trade.moneyMoveType.stamp] = 'Состояние';
wMoney.moneyMoveText[Trade.moneyMoveType.buildOn] = 'Включение строения';
wMoney.moneyMoveText[Trade.moneyMoveType.added] = 'Добавлено';
wMoney.moneyMoveText[Trade.moneyMoveType.luckBonus] = 'Бонус удачи';
wMoney.moneyMoveText[Trade.moneyMoveType.trainUnits] = 'За обучение войск';


wMoney.prototype.calcName = function(){
	return 'money';
};

wMoney.prototype.getData = function(){
	this.data.money = utils.clone(wofh.account.money);
	
	var towns = [];
	for(var town in wofh.towns){
		town = wofh.towns[town];
		var townMoney = new Town();
		
		var stockMoney = town.stock.getElem(Resource.ids.money);
		
		townMoney.id = town.id;
		townMoney.name = town.name;
		townMoney.budget = utils.clone(town.budget);
		townMoney.dec = -stockMoney.dec;
		townMoney.inc = stockMoney.incom;
		townMoney.streaminc = stockMoney.streaminc;
		townMoney.streamdec = stockMoney.streamdec;
		townMoney.stream = stockMoney.stream;
		
		townMoney.taxes = utils.clone(town.taxes);
		townMoney.taxes.sum *= -1;
		
		townMoney.lasvegasdec = -(town.stock.lasvegasdec||0);
		townMoney.lasvegasinc = town.stock.lasvegasinc||0;
		
		towns.push(townMoney);
	}
	
	towns.sort(function(a,b){
		return a.id > b.id ? 1 : -1;
	});
	
	var totals = {inc: 0, dec: 0, stream: 0, streamdec: 0, streaminc: 0, profit: 0, taxes: {pop:0, prod:0, streamSum:0, deposit:0, sum:0}, budget:{}, budgetSum: 0, lasvegasdec:0};
	for(var town in towns){
		town = towns[town];
		
		/* Сумма бюджетных выплат */
		town.budgetSum = 0;
		for(var budgetType in town.budget){
			var budget = town.budget[budgetType];
			
			if( !(budget instanceof Object) ){
				if( !totals.budget[budgetType] )
					totals.budget[budgetType] = 0;
				
				totals.budget[budgetType] += +budget;
				town.budgetSum += +budget;
				
				continue;
			}
			
			if( !totals.budget[budgetType] )
				totals.budget[budgetType] = {};
			
			for(var item in budget){
				if( !totals.budget[budgetType][item] )
					totals.budget[budgetType][item] = 0;
				
				totals.budget[budgetType][item] += budget[item];
				town.budgetSum += budget[item];
			}
		}
		
		town.profit = town.inc+town.dec+town.stream+town.budgetSum+town.taxes.sum;
		
		totals.inc += town.inc;
		totals.dec += town.dec;
		totals.streamdec += town.streamdec;
		totals.streaminc += town.streaminc;
		totals.stream += town.stream;
		
		for(var tax in town.taxes){
			totals.taxes[tax] += town.taxes[tax];
		}
		
		totals.budgetSum += town.budgetSum;
		
		totals.profit += town.profit;
	}
	
	this.data.towns = towns;
	
	totals.profit -= this.data.money.credites.inc||0;
	totals.profit += this.data.money.deposites.inc||0;
	totals.profit += this.data.money.budget.subsidy||0;
	
	this.data.money.inc = wofh.account.getMoneyInc();
	
	totals.debt = Math.abs(utils.toInt(this.data.money.inc - totals.profit));
	
	this.data.townTotals = totals;
	
	if( wofh.country )
		this.data.countryTax = utils.clone(wofh.country.taxes);
	
	this.dataReceived();
};

wMoney.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accMoney, Notif.ids.countryMoney];
};

wMoney.prototype.calcChildren = function(){
	this.children = {};
	
	this.children.balance = bMoney_balance;
	this.children.towns = bMoney_towns;
	this.children.deposites = bMoney_deposites;
	this.children.credites = bMoney_credites;
};

wMoney.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('input', '.js-moneyInput', function(){
			var maxLimit = 0;
			
			if( $(this).hasClass('js-inpPayCredit') )
				maxLimit = Math.max(0,utils.toInt(Math.min(self.data.credit.sum, self.data.money.sum - self.data.money.reserve)));
			else if ( $(this).hasClass('js-inpGetDeposit') )
				maxLimit = Math.max(0, utils.toInt(self.data.deposit.sum));

			utils.checkInputInt(this, {max: maxLimit, min: 0});

			// Делаем неактивными кнопки кредитов и депозитов если введен 0
			var inpClass;
			if( $(this).hasClass('js-inpGetDeposit') )
				inpClass = 'getDeposit';
			else if( $(this).hasClass('js-inpPayCredit') )
				inpClass = 'payCredit';
			
			self.setInputActivity(inpClass, !!(+$(this).val()));
		})
		// Транзакции
		.on('click', '.money_moves_link', function(){
			wndMgr.addSimple(tmplMgr.money.trans({}), {
				header: 'История операций',
				callbacks: {
					calcName: function(){return 'moneyMoves';},
					
					bindEvent: function(){
						var wnd = this;
						
						wnd.wrp
							.on('click', '.money_moves_add', function(){
								wnd.showTrans();
							});
					},
					getTmplData: function(){
						this.data.transTime = 0;
						
						return this.data;
					},
					afterDraw: function(){
						this.showTrans();
						
						this.initScroll();
					},
					
					showTrans: function(){
						var wnd = this;
						
						var loaderId = contentLoader.start(
							wnd.cont, 
							400,
							function(){
								reqMgr.moneyMove(wnd.data.transTime, self.moneyup ? 1 : undefined, function(resp){
									contentLoader.stop(loaderId);

									wnd.wrp.find('.money_moves_add').toggleClass('dN', !resp.next);

									for(var item in resp.list){
										item = resp.list[item];
										
										wnd.data.transTime = item.time;
									}

									wnd.wrp.find('.js-moneyMoves tbody').append(tmplMgr.money.transData(resp.list));
									
									if( !wnd.data.firstDraw ){
										wnd.data.firstDraw = true;
										
										wnd.afterResize(wnd.data.firstDraw);
									}
								});
							}
						);
					}
				}
			});
		})
		// Запрещаем вызов нотификации если находимся в поле ввода
		.on('focus', 'input', function(e, useUpd){
			if( !useUpd ){
				self.clearTimeout(self.data.noUpdTimeoutId);
				
				self.data.noUpd = true;
			}
		})
		// Разрешаем вызов нотификации при потере фокуса ввода (с задержкой в wMoney.updTime)
		.on('focusout', 'input', function(){
			self.data.noUpdTimeoutId = self.setTimeout(self.resetNoUpd, wMoney.updTime);
		});
};

wMoney.prototype.show = function(){
	if( this.data.noUpd ) return;
	
	wMoney.superclass.show.apply(this, arguments);
};

wMoney.prototype.afterDraw = function(){
	this.cont.find('.js-moneyInput').trigger('input', [true]);
	
	this.initScroll();
};

wMoney.prototype.resetNoUpd = function(){
	this.data.noUpd = false;
};



wMoney.prototype.checkInputVal = function(el, maxVal) {
	var $el = $(el),
		val = $el.val(),
		oldVal = $el.attr('value'),
		valid = true; // Валидация изменения значения в инпуте. Если значение валидно (не вставлялись символы и т.п.) не производим ручную вставку в инпут ($el.val(val)), дабы не сбрасывать положение каретки
	
	val = ~~val.replace(/[^\d]/gi, "");
	
	if( maxVal !== undefined && val > maxVal ){
		val = maxVal;
		valid = false;
	}
	
	val = '' + (val||'0');
	
	if( oldVal == val )
		valid = false;
	
	if( !valid )
		$el.val(val);
	
	$el.attr('value', val);
};

wMoney.prototype.setInputActivity = function(inpClass, activity){
	this.data['can' + utils.upFirstLetter(inpClass)] = activity;
	
	this.cont.find('.js-' + inpClass).toggleClass('-disabled', !activity); // Меняем активность кнопки
	this.cont.find('.js-inp' + utils.upFirstLetter(inpClass)).prop('readonly', !activity); // Меняем активность инпута
};





// Информация о балансе игрока
bMoney_balance = function(parent){
	this.name = 'balance';
	bMoney_balance.superclass.constructor.apply(this, arguments);
};
	utils.extend(bMoney_balance, Block);
	
	bMoney_balance.prototype.getData = function(){
		this.data.money = this.parent.data.money;
		this.data.townTotals = this.parent.data.townTotals;
		
		if( this.data.money.inc < 0 )
			this.data.timeLeft = -this.data.money.sum / this.data.money.inc * 3600;
		
		this.dataReceived();
	};
	
	bMoney_balance.prototype.calcChildren = function(){
		this.children = {};
		
		this.children.treasury = bMoney_balance_treasury;
		this.children.reserve = bMoney_balance_reserve;
		this.children.sum = bMoney_balance_sum;
		this.children.duty = bMoney_balance_duty;
	};
		
		bMoney_balance_treasury = function(parent){
			this.name = 'treasury';
			bMoney_balance_treasury.superclass.constructor.apply(this, arguments);
		};
			utils.extend(bMoney_balance_treasury, Block);
			
			bMoney_balance_treasury.prototype.addNotif = function(){
				this.notif.show = [Notif.ids.accMoneyIter];
			};
			
			
			
		bMoney_balance_reserve = function(parent){
			this.name = 'reserve';
			bMoney_balance_reserve.superclass.constructor.apply(this, arguments);
		};
			utils.extend(bMoney_balance_reserve, Block);
			
			bMoney_balance_reserve.prototype.addNotif = function(){
				//this.notif.show = [Notif.ids.accMoneyIter];
			};
			
			bMoney_balance_reserve.prototype.bindEvent = function(){
				var self = this;

				this.wrp
					.on('input', '.balance-reserve-input', function(){
						utils.checkInputInt(this, {max: lib.account.moneyreservemax, min: 0});
						
						self.wrp.find('.balance-reserve-changeReserve').toggleClass('-hidden', $(this).val() == wofh.account.money.reserve);
					})
					.on('submit', '.js-moneyReserve', function(){
						var data = utils.urlToObj($(this).serialize());

						self.changeReserve(data.savemoney);

						return false;
					});
					
				snip.input1Handler(this.wrp, {spinbox: {}});
			};
			
			bMoney_balance_reserve.prototype.changeReserve = function(savemoney){
				var self = this;

				var loaderId = contentLoader.start( 
					this.cont.find('.balance-reserve-changeReserve'), 
					0, 
					function(){
						self.parent.parent.resetNoUpd(); // Включаем обновление по нотификации
						
						var callback = function(){
							contentLoader.stop(loaderId);
						};
						
						reqMgr.moneyReserve(savemoney, {onSuccess: callback, onFail: callback});
					},
					{icon: ContentLoader.icon.small, cssPosition: {right: 9, top: 9}} 
				);
			};
			
			
			
		bMoney_balance_sum = function(parent){
			this.name = 'sum';
			bMoney_balance_sum.superclass.constructor.apply(this, arguments);
		};
			utils.extend(bMoney_balance_sum, Block);
			
			bMoney_balance_sum.prototype.addNotif = function(){
				this.notif.show = [Notif.ids.accMoneyIter];
			};
			
			
			
		bMoney_balance_duty = function(parent){
			this.name = 'duty';
			bMoney_balance.superclass.constructor.apply(this, arguments);
		};
			utils.extend(bMoney_balance_duty, Block);
			
			bMoney_balance_duty.prototype.canDisplay = function(){
				return utils.toInt(wofh.account.money.duty);
			};
			
			bMoney_balance_duty.prototype.addNotif = function(){
				this.notif.show = [Notif.ids.accMoneyIter];
			};



// Информация о финансах в городах

bMoney_towns = function(parent){
	this.name = 'towns';
	bMoney_towns.superclass.constructor.apply(this, arguments);
};
	utils.extend(bMoney_towns, Block);
	
	bMoney_towns.prototype.getData = function(){
		this.data.money = this.parent.data.money;
		this.data.towns = this.parent.data.towns;
		this.data.townTotals = this.parent.data.townTotals;
		
		this.dataReceived();
	};
	
	
	
// Информация о вкладах

bMoney_deposites = function(parent){
	this.name = 'deposites';
	bMoney_deposites.superclass.constructor.apply(this, arguments);
};
	utils.extend(bMoney_deposites, Block);
	
	bMoney_deposites.prototype.getData = function(){
		var countryTax = this.parent.data.countryTax;
		
		if( countryTax ){
			this.data.money = this.parent.data.money;
			
			// Вклады
			countryTax.deposit.sum = utils.toInt(this.data.money.deposites.sum); // Вклад игрока
			countryTax.deposit.maxSum = Math.min(countryTax.deposit.maxp - countryTax.deposit.sum, countryTax.deposit.maxc - wofh.country.money.deposites.sum); // Максимально возможная сумма депозита которую можно вложить (берется минимальная из доступного депозита для игрока и доступного депозита страны)
			countryTax.deposit.maxSum = Math.min(countryTax.deposit.maxSum, this.data.money.sum - this.data.money.reserve); // Учитываем казну игрока
			countryTax.deposit.maxSum = utils.toInt(Math.max(0, countryTax.deposit.maxSum));
			
			if( countryTax.deposit.maxSum || countryTax.deposit.sum )
				this.parent.data.deposit = this.data.deposit = countryTax.deposit;
		}
		
		this.dataReceived();
	};
	
	bMoney_deposites.prototype.canDisplay = function(){
		return this.data.deposit;
	};
	
	bMoney_deposites.prototype.bindEvent = function(){
		var self = this;
		
		this.wrp
			// Вложить в депозит
			.on('click', '.js-putDeposit', function(){
				wndMgr.addConfirm(tmplMgr.money.putDeposit(self.data), {
					okText: 'Вложить', 
					cancelText: 'Закрыть',
					callbacks: {
						bindEvent: function(){
							var wnd = this;
							
							this.wrp
								.on('submit', 'form', function(){
									wnd.close(true);

									return false;
								})
								.on('input', '.js-depositSum', function(){
									utils.checkInputInt(this, {max: self.data.deposit.maxSum, min: 0});

									var pay = utils.toInt($(this).val()) * self.data.deposit.rate * 0.001;

									wnd.wrp.find('.money_depositPut_pay').html(tmplMgr.money.putDeposit.pay({pay: pay}));
								});
						},
						afterDraw: function(){
							snip.input1Handler(this.cont, {spinbox:{}});

							this.wrp.find('.js-depositSum').trigger('input');
						},
						onAccept: function(){
							var formData = utils.urlToObj(this.wrp.find('form').serialize());

							self.changeDeposit(formData.sum, function(){});
						}
					}
				});
				
				return false;
			})
			// Снять с депозита
			.on('click', '.js-getDeposit', function(){
				if( !self.parent.data.canGetDeposit )
					return false;
				
				self.parent.setInputActivity('getDeposit', false);
				
				var loaderId = contentLoader.start( 
					$(this), 
					0, 
					function(){
						var val = +self.wrp.find('.js-inpGetDeposit').val();
						
						self.changeDeposit(-val, function(){
							contentLoader.stop(loaderId);
						});
					}.bind(this),
					{icon: ContentLoader.icon.small, cssPosition: {right: 5, top: 5}}
				);
				
				return false;
			})
			.on('input', '.js-inpGetDeposit', function(event, init){
				if( init )
					return;
				
				$(this).closest('.money-deposit-get').addClass('-active');
			})
			.on('click', '.js-resetGetDeposit', function(){
				var $input = $(this).closest('.money-deposit-get').removeClass('-active').find('.js-inpGetDeposit');
				
				$input.val($input.attr('value')).trigger('input', [true]);
			});
			
		snip.input1Handler(this.wrp, {spinbox: {}});
	};
	
	
	bMoney_deposites.prototype.changeDeposit = function(sum, callback){
		this.parent.resetNoUpd(); // Включаем обновление по нотификации
		
		reqMgr.depositMove(sum, {onSuccess: callback, onFail: callback});
	};
	
	
	
// Информация о кредитах

bMoney_credites = function(parent){
	this.name = 'credites';
	bMoney_credites.superclass.constructor.apply(this, arguments);
};
	utils.extend(bMoney_credites, Block);
	
	bMoney_credites.prototype.getData = function(){
		var countryTax = this.parent.data.countryTax;
		
		if( countryTax ){
			this.data.money = this.parent.data.money;

			countryTax.credit.sum = utils.toInt(this.data.money.credites.sum); // Кредит игрока
			countryTax.credit.maxSum = Math.min(countryTax.credit.maxp - countryTax.credit.sum, countryTax.credit.maxc - wofh.country.money.credites.sum); // Максимально возможная сумма кредита которую можно взять (берется минимальная из доступного кредита для игрока и доступного кредита страны)
			countryTax.credit.maxSum = utils.toInt(Math.max(0, countryTax.credit.maxSum));

			if( countryTax.credit.maxSum || countryTax.credit.sum )
				this.parent.data.credit = this.data.credit = countryTax.credit;
		}
		
		this.dataReceived();
	};
	
	bMoney_credites.prototype.canDisplay = function(){
		return this.data.credit;
	};
	
	bMoney_credites.prototype.bindEvent = function(){
		var self = this;
		
		this.wrp
			// Взять кредит
			.on('click', '.js-getCredit', function(){
				wndMgr.addConfirm(tmplMgr.money.getCredit(self.data), {
					okText: 'Взять кредит', 
					cancelText: 'Закрыть',
					callbacks: {
						bindEvent: function(){
							var wnd = this;
							
							this.wrp
								.on('submit', 'form', function(){
									wnd.close(true);

									return false;
								})
								.on('input', '.js-creditSum', function(){
									utils.checkInputInt(this, {max: self.data.credit.maxSum, min: 0});
						
									var overpay = utils.toInt($(this).val()) * self.data.credit.rate * 0.001;

									wnd.wrp.find('.money_creditGet_overpay').html(tmplMgr.money.getCredit.overpay({overpay: overpay}));
								});
						},
						afterDraw: function(){
							snip.input1Handler(this.cont, {spinbox:{}});
							
							this.wrp.find('.js-creditSum').trigger('input');
						},
						onAccept: function(){
							var formData = utils.urlToObj(this.wrp.find('form').serialize());
							
							self.changeCredit(formData.sum, function(){});
						}
					}
				});
				
				return false;
			})
			// Погасить кредит
			.on('click', '.js-payCredit', function(){
				if( !self.parent.data.canPayCredit )
					return false;
				
				self.parent.setInputActivity('payCredit', false);
				
				var loaderId = contentLoader.start( 
					$(this), 
					0, 
					function(){
						var val = +self.wrp.find('.js-inpPayCredit').val();;
						self.changeCredit(-val, function(){
							contentLoader.stop(loaderId);
						});
					}.bind(this),
					{icon: ContentLoader.icon.small, cssPosition: {right: 5, top: 5}, callback: function(){
						self.cont.find('.js-moneyInput').trigger('input');
					}}
				);

				return false;
			})
			.on('input', '.js-inpPayCredit', function(event, init){
				if( init )
					return;
				
				$(this).closest('.money-credit-pay').addClass('-active');
			})
			.on('click', '.js-resetPayCredit', function(){
				var $input = $(this).closest('.money-credit-pay').removeClass('-active').find('.js-inpPayCredit');
				
				$input.val($input.attr('value')).trigger('input', [true]);
			});
			
		snip.input1Handler(this.wrp, {spinbox: {}});
	};
	
	
	bMoney_credites.prototype.changeCredit = function(sum, callback){
		this.parent.resetNoUpd(); // Включаем обновление по нотификации
		
		reqMgr.creditMove(sum, {onSuccess: callback, onFail: callback});
	};