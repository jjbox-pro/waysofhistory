wReport = function(){
	wReport.superclass.constructor.apply(this, arguments);
};

utils.extend(wReport, Wnd);

WndMgr.regWnd('report', wReport);


wReport.logsPath = 'gen/battle/';

wReport.prepareData = function(id){
	var data = {};
	
	if( typeof(id) == 'number' )
        data.id = id;
    else{
        var arr = id.split('-');
		
        data.id = arr[0];
		
        if(arr.length == 2)
            data.code = arr[1];
    }
	
	return data;
};


wReport.prototype.calcName = function(){
	return 'report';
};

wReport.prototype.initWndOptions = function(){
    wReport.superclass.initWndOptions.apply(this, arguments);
	
    this.options.clipboard = true;
    this.options.canClose = !!wofh.town;
};

wReport.prototype.calcChildren = function(){
	this.children.view = bReport_view;
};

wReport.prototype.afterResize = function(){
	wReport.superclass.afterResize.apply(this, arguments);

	if( wofh.account.noAcc )
		this.moveToPos({y: 0});
};
// Убираем проверку на конфликтующие окна
wReport.prototype.getConflictWnd = wReport.prototype.getIdentWnd;


wReport.prototype.moveToTop = function(){
	this.setAutoPos();
	
	this.cont.css('top', 0);
};



bReport_view = function(){
	this.name = 'view';
	
	bReport_view.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(bReport_view, Block);


bReport_view.prototype.getData = function(){
    if( wofh.account.id )
        reqMgr.questComplete(new Quest(Quest.ids.rep));
	
	this.data.id = this.parent.data.id;
	this.data.code = this.parent.data.code;
    
    if( wofh.reports && wofh.reports[this.data.id] ) {
        this.data = wofh.reports[this.data.id];
        
        if( !this.data.read && !debug.isAdmin() )
            this.markAsRead(this.data.id);
		
        this.dataReceived();
    } 
	else{
		var self = this;
		
		var loaderId = contentLoader.start( 
			this.parent.wrp.find('.wnd-cont-wrp'), 
			0,
			function(){
				self.getReqData(function(){
					reqMgr.getReport(self.data.id, self.data.code, !wofh.town, function(resp, reqId){
						self.tryProcessResp(
							resp, reqId,
							function(){
								contentLoader.stop(loaderId);
								
								if( !resp ) {
									this.parent.close();
									
									wndMgr.addAlert('Некорректная ссылка');
									
									return;
								}
								
								if( !wofh.town )
									resp.code = this.data.code||resp.code;
								
								this.data = new Report(resp);
								
								if( !(debug.isAdmin() || resp.read || resp.code) )
									this.markAsRead(this.data.id);
								
								if( wofh.reports )
									wofh.reports[this.data.id] = this.data;
								
								this.dataReceived();
							}
						);
					});
				});
			}
		);
    }
};

bReport_view.prototype.dataReceived = function(){
	if( !this.prepareData() )
		return;
	
	bReport_view.superclass.dataReceived.apply(this, arguments);
};


bReport_view.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.js-report-restore', function () {
			reqMgr.restoreReport(self.data.id, function(){
				self.refreshReports();
				self.parent.close();
			});
		})
		.on('click', '.js-report-delete', function () {
			reqMgr.deleteReport(self.data.id, function(){
				self.refreshReports();
				self.parent.close();
			});
		})
		.on('click', '.js-report-archive', function () {
			reqMgr.archiveReport(self.data.id, !self.data.archived, function(){
				self.refreshReports();
				self.parent.close();
			});
		})
		.on('focusin', '.share-url', function () {
			if( !$(this).hasClass('js-focused') ){
				$(this).addClass('js-focused');
				
				$(this).select();
			}
		})
		.on('focusout', '.share-url', function () {
			$(this).removeClass('js-focused');
		})
		.on('submit', '.frm-share', function () {
			var data = utils.urlToObj($(this).serialize(), true);
			
			var share = [
				data.open ? 1 : 0,
				data.ha ? 1 : 0,
				data.hd ? 1 : 0,
				data.haa ? 1 : 0,
				data.hda ? 1 : 0
			];
			
			reqMgr.shareReport(self.data.id, data.open, data.ha, data.hd, data.haa, data.hda, function (code) {
				if( wofh.reports && wofh.reports[self.data.id] ){
					//вместо удаления проще апать переменные
					wofh.reports[self.data.id].share = share;
					wofh.reports[self.data.id].code = code;
				}

				self.parent.close();

				wndMgr.addWnd(wReport, code? self.data.id+'-'+code: self.data.id);//код меняется, поэтому просто перерисовать нельзя

				self.refreshReports();
			});
			
			return false;
		})
		.on('click', '.trade_stream_offerAccept', function () {
			reqMgr.streamAccept($(this).data('id'), function(){
				self.parent.close();
			});

			return false;
		})
		.on('click', '.report-bonusEnded-repeat', function () {
			var town = wofh.towns[$(this).data('town')];
			var bonus = town.getLuckBonus($(this).data('bonus'));

			wBonusTakeNow.show(bonus);

			return false;
		})
		//пост на стенку в ВК
		.on('click', '.report-postToWall', function () {
            self.postToWall();
		})
		.on('mouseenter', '.report-postToWall, .report-info', function(){
			self.cont.find('.report-postToWall-arrow-wrp').toggleClass('dN');
			
			return false;
		})
		.on('mouseleave', '.report-postToWall, .report-info', function(){
			self.cont.find('.report-postToWall-arrow-wrp').toggleClass('dN');
			
			return false;
		})
		.on('click', '.js-report-battle-log', function () {
			wndMgr.addSimple(tmplMgr.report.battleLog({logs: self.data.data.logs}), {
				callbacks: {
					afterDraw: function(){
						this.initScroll();
					}
				}
			});
		})
		//фильтры в боевом отчёте
		.on('click', '.report-armies-filter', function () {
			var countryId = $(this).data('id');
			$(this).toggleClass('-active');
			var active = $(this).hasClass('-active');
			$(this).parents('.report-block').find('.report-fighter').each(function(){
				if ($(this).data('country') == countryId) {
					$(this).toggleClass('-hidden', !active);
				}
			});
		})
		.on('click', '.report-infoReport-sci-compare', function () {
			self.cont.find('.report-infoReport-sci-showSame').trigger('change');
			
			self.cont.find('.-type-hidden').removeClass('-type-hidden');
			self.cont.find('.report-infoReport-sciTbl-block').removeClass('-half');
			
			$(this).parents('.report-infoReport-sci-compare-block').remove();
			
			self.cont.find('.report-infoReport-sci-filter').first().trigger('change');
			
			var account = self.data.account,
				accFlasks = 0,
				myFlasks = 0;
			
			for(var sciId in account.science.state){
				// Считаем вложенные колбы для акка отчета
				var science = Science.get(sciId);
				
				if( account.science.state[sciId] == Science.known.done )
					accFlasks += science.getCost();
				else
					accFlasks += account.science.progress[sciId]||0;
					
				// Считаем вложенные колбы для собственного акка
				if( wofh.account.science.state[sciId] == Science.known.done )
					myFlasks += science.getCost();
				else
					myFlasks += wofh.account.science.progress[sciId]||0;
			}
			
			self.cont.find('.sci-compFlasks-acc').html(snip.resBigCount(Resource.ids.science, snip.coloredNum(accFlasks-myFlasks, {sign: true, int: true, stages: true}), {noPrepare: true}));
			self.cont.find('.sci-compFlasks-my').html(snip.resBigCount(Resource.ids.science, snip.coloredNum(myFlasks-accFlasks, {sign: true, int: true, stages: true}), {noPrepare: true}));
			
			self.cont.find('.report-infoReport-sci-compFlasks-wrp').removeClass('-hidden');
		})
		.on('click', '.report-infoReport-sci-showAll', function () {
			self.cont.find('.-notShow').removeClass('-notShow');
			
			$(this).remove();
		})
		.on('change', '.report-infoReport-sci-showSame', function () {
			if( $(this).prop('checked') ){
				// Ресетим фильтры
				self.cont.find('.report-infoReport-sciFilter').data('filter', 7);
				self.cont.find('.report-infoReport-sci-filter').prop('checked', true);
				self.cont.find('.report-infoReport-sciTbl .-type-hidden, .report-infoReport-sciTbl .-hidden').removeClass('-type-hidden -hidden');
				
				self.cont.find('.-hide-sameSci').removeClass('-hide-sameSci');
				
				var progressOwner = self.data.account.science.progress,
					stateOwner = self.data.account.science.state,
					progressSelf = wofh.account.science.progress,
					stateSelf = wofh.account.science.state,
					percentOwner,
					percentSelf,
					science;
				
				self.cont.find('.report-infoReport-sci.-type-owner').each(function(){
					science = Science.get($(this).data('id'));
					percentOwner = utils.formatNum(stateOwner[science.id] == Science.known.unavail || stateOwner[science.id] == Science.known.avail?((progressOwner[science.id]||0) / science.getCost() * 100):100, {fixed:2});
					percentSelf = utils.formatNum(stateSelf[science.id] == Science.known.unavail || stateSelf[science.id] == Science.known.avail?((progressSelf[science.id]||0) / science.getCost() * 100):100, {fixed:2});
					
					if( percentOwner == percentSelf ){
						$(this).parents('tr').addClass('-type-sameSci');
					}
				});
				
				var count = self.cont.find('.-type-sameSci').length;
				
				if( count )
					self.cont.find('.report-infoReport-sci-sameCount-wrp').html(snip.nobr('('+count+')'));
			}
			else
				self.cont.find('.-type-sameSci').addClass('-hide-sameSci');
		})
		// Фильтрация для наук
		.on('change', '.report-infoReport-sci-filter', function() {
			var $showAll = self.cont.find('.report-infoReport-sci-showAll');
			if( $showAll.length ){
				self.cont.find('.-notShow').removeClass('-notShow');
				
				$showAll.remove();
			}
			
			var $parent = $(this).parents('.report-infoReport-sciFilter'),
				type = $parent.data('type'),
				filter = +$parent.data('filter');
			
			var filterId = +$(this).data('filter');
			
			if( $(this).prop('checked') ){
				filter = filter | filterId;
			} else {
				filter = filter ^ filterId;
			}
			
			$parent.data('filter', filter);
			
			var account = type == 'owner' ? self.data.account : wofh.account,
				show,
				ind,
				known,
				hideSci = self.cont.find('.report-infoReport-sciTbl-block').hasClass('-half'),
				hideSameSci;
				
			self.cont.find('.report-infoReport-sci.-type-'+type).each(function(){
				known = account.science.state[$(this).data('id')];
				
				if( known == Science.known.unavail ){
					ind = 0;
				} else if( known == Science.known.avail ){
					ind = 1;
				} else {
					ind = 2;
				}
				
				show = utils.inMask(ind, filter);
				
				$(this).toggleClass('-type-hidden', !show);
				
				hideSameSci = $(this).siblings('.-type-' + (type == 'owner' ? 'self' : 'owner')).hasClass('-type-hidden');
				
				$(this).parents('tr').toggleClass('-hidden', (hideSci || hideSameSci) && !show);
			});
		})
		// Переход к другому отчету;
		.on('click', '.report-nav-prev-wrp, .report-nav-next-wrp', function () {
			self.parent.close();
		})
		// Передаем данные боевого отчета в симулятор
		.on('click', '.js-toSimbattle', function () {
			var repData = self.data.data,
				simbattleHash = utils.urlToObj(wSimbattle.defHashStr),
				atkArmy = new Army(),
				defArmy = new Army();
			
			for(var attacker in repData.attackers){
				attacker = repData.attackers[attacker];
				
				atkArmy.addList(new Army(attacker.army));
			}
			
			simbattleHash.a1 = atkArmy.toString();
			
			for(var defender in repData.defenders){
				defender = repData.defenders[defender];
				
				defArmy.addList(new Army(defender.army));
			}
			
			simbattleHash.a2 = defArmy.toString();
			
			if( repData.defstruct !== undefined ){
				var slot = new Slot(repData.defstruct, repData.deflevel);
				
				if( !slot.isEmpty() && slot.getLevel() ){
					simbattleHash.dt = slot.getId();
					simbattleHash.dl = slot.getLevel();
				}
			}
			
			hashMgr.showWnd('simbattle', utils.objToUrl(simbattleHash));
		})
		.on('change', '.report-battleView', function(){
			ls.setAttDefViewReport(!$(this).prop('checked'));
			
			self.show();
		});
		
	if( !this.data.read && wofh.platform && wofh.platform.postToWall && (this.data.type == Report.type.battleFull || this.data.type == Report.type.science) )
        this.postToWall(true);
	
	this.checkNavReport();
};

bReport_view.prototype.afterDraw = function(){
	if( this.data.code )
		this.parent.setClipboard({tag:'r' + this.data.id + '/' + this.data.code});
	
	this.parent.setHeaderCont(this.data);
	
	this.initScroll({scrollbarPosition: 'outside'});
};

bReport_view.prototype.initScroll = function(opt){
	var $repCont = this.wrp.find('.report-content');
	
	if( $repCont.height() > 320 ){
		$repCont.addClass('js-scroll-wrp').css('max-height', Math.max(utils.getWindowHeight(-180, 0), 320));
		
		bReport_view.superclass.initScroll.apply(this, arguments);
	}
};


bReport_view.prototype.prepareData = function(){
	var report = this.data;
	
	switch( report.type ){
		case Report.type.bonusEnded: {
			if( report.data.bonus == LuckBonus.ids.subscription ){
				report.data.isSubscription = true;
				
				report.data.bonus = LuckBonus.ids.accountPremium;
			}
			
			break;
		}
	}
	
	return true;
};

bReport_view.prototype.checkNavReport = function() {
	var wndReports = wndMgr.getFirstWndByType(wReports);
	
	if( !wndReports ) 
		return;
	
	var reportsList = wndReports.getReportsList();
	
	for(var reportI in reportsList){
		if( reportsList[reportI].id == this.data.id ){
			this.showNav(reportsList[+reportI-1], 'prev');
			this.showNav(reportsList[+reportI+1], 'next');
			
			break;
		}
	}
};

bReport_view.prototype.showNav = function(report, dir){
	var $nav = this.wrp.find('.report-nav-'+dir+'-wrp');
	
    if( !report ){
		$nav.remove();
		
		return;
	}
	
	$nav.html(snip.link(hashMgr.getWndHref('report', report.id+(report.code>0?'-'+report.code:'')), '', 'page-nav-'+dir));
};

bReport_view.prototype.postToWall = function (auto) {
    if( wofh.platform.wndIsOpen )
        return;
    
	var message;
	
    if(this.data.type == Report.type.battleFull)
        message = 'Трепещите! Кровопролитное, зубодробительное, эпическое противостояние. Посмотри запись моего боя из мира «Путей Истории» '+appl.cnst.protocol+'://'+lib.main.domain+'/report#'+this.data.id + (this.data.code ? ('-' + this.data.code) : '') + '. Восславим героев! Теперь в 3D... Присоединяйся ко мне в Путях Истории!';
    else
        message = 'Спешу сообщить! Мною была изучена наука «'+new Science(this.data.data.science).getName()+'». Это одна из 240 наук мира «Путей Истории». Далекий космос на шаг ближе. Скорее присоединяйся ко мне в Путях Истории!';
    
    if(wofh.platform.name == 'vk'){
        var pic = this.data.type == Report.type.battleFull? '-17762326_405756861': '-17762326_405756854';
        VK.api('wall.post', {v: '5.124', message: message, attachments: "photo"+pic+",https://vk.com/ways_of_history"}); 
    } else if (wofh.platform.name == 'fb'){
        var domain = 'https://'+lib.main.maindomain;
        var link = 'https://apps.facebook.com/waysofhistory';
        var pic = this.data.type == Report.type.battleFull? 'https://test.waysofhistory.com/img/gui/social/wall-war.jpg': 'https://test.waysofhistory.com/img/gui/social/wall-sci.jpg';

		var data = {
			method: 'feed',  
            commandType: 'link',
			message: message,
			display: 'iframe',
			picture: domain + pic,    
			link: link,  // Go here if user click the picture
            caption: 'Пути Истории',
            name: 'Пути Истории',
			description: message
		};
        
        wofh.platform.wndIsOpen = true;
		
		FB.ui(data, function(resp){
            wofh.platform.wndIsOpen = false;
        });
        
        if( !auto )
            this.parent.close();
    }
};

bReport_view.prototype.markAsRead = function (id) {
    reqMgr.markReportAsRead(id, function(){
		notifMgr.runEvent(Notif.ids.accReportMarkAsRead, id);
    });
};

bReport_view.prototype.refreshReports = function(){          
	notifMgr.runEvent(Notif.ids.refreshReports);
};