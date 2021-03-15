wReports = function(){
	wReports.superclass.constructor.apply(this, arguments);
};

utils.extend(wReports, Wnd);

WndMgr.regWnd('reports', wReports);


wReports.types = {
	townReports: 8
};

wReports.defFilter = 255;

wReports.getIcons = function(report){
	var icons = [];
	if (report.archived) {
		icons.push(95);
	}
	switch (report.type) {
		case Report.type.science:
			icons.push(71);
			break;
		case Report.type.tax:
			icons.push(80);
			break;
		case Report.type.battleShort:
			icons.push(20);
			
			var army = new Army(report.data.army);
			var survived = new Army(report.data.survived||"");
			var dead = army.clone().diffList(survived).onlyPositive();
			
			if( dead.isEmpty() ){
				var ic = 1;
				if (wofh.account.id == report.town1.account.id) {
					ic += 11;
				}
				icons.push(ic);
			}
			else{
				var ic = 0;
				if (wofh.account.id == report.town1.account.id) {
					ic += 10;
				}
				icons.push(ic);
			}
			
			
			if (army.isSpam()) {
				icons.push(24);
			}
			break;
		case Report.type.battleFull:	
			icons.push(20);
			var ic = 2 + report.data.result;
			if (wofh.account.id == report.town1.account.id) {
				ic += 10;
			}
			icons.push(ic);

			var attackers = 0,
				spamers = 0,
				army;
			for (var i in report.data.attackers) {
				army = new Army(report.data.attackers[i].army);
				if (army.isSpam()) {
					++spamers;
				}
				++attackers;
			}
			if (spamers > 0 && spamers == attackers) {
				icons.push(24);
			}

            var robbed = new ResList();
            var survived = new Army();
            for (var attacker in report.data.attackers){
                attacker = report.data.attackers[attacker];
                robbed.addList(new ResList(attacker.robbed));
                survived.addList(new Army(attacker.survived));
            }
            var capacity = utils.toInt(survived.calcCapacity()),
				fullload = capacity && robbed.calcSum() == capacity;
			if (fullload) {
				icons.push(90);
			}
			break;
		case Report.type.attackAir:
			var army = new Army(report.data.army1);
			icons.push(army.isNuclear() ? 23 : 22);
			var ic = 2;
			if (wofh.towns[report.town1[0]]) {
				ic += 10;
			}
			icons.push(ic);

			var army1 = new Army(report.data.army1);
			var army2 = new Army(report.data.army1);
			var survived1 = new Army(report.data.survived1);
			var survived2 = new Army(report.data.survived2);

			if (report.data.army1.length <= 5 && report.data.army1 != report.data.survived1 && !report.data.destroy && army1.isSpam() && survived2 == army2) {
				icons.push(24);
			}
			break;
		case Report.type.attackWater:
			icons.push(21);
			var ic = 1;
			if (wofh.towns[report.town1[0]]) {
				ic += 10;
			}
			icons.push(ic);
			
            var capacity = utils.toInt((new Army(report.data.survived1)).calcCapacity()),
				fullload = capacity && (new ResList(report.data.grabbed)).calcSum() == capacity;
			if (fullload) {
				icons.push(90);
			}
			
			break;
		case Report.type.spy:
			icons.push(wofh.towns[report.town1[0]] ? 60 : 61);
			break;
		case Report.type.congrat:
			icons.push(96);
			break;
		case Report.type.sendRes:
			icons.push(41);
			break;
		case Report.type.tradeBarter:
			icons.push(40);
			break;
		case Report.type.tradeMoney:
			icons.push(report.data && report.data.sell != 0 ? 42 : 43);
			break;
		case Report.type.streamOffer:
			icons.push(53);
			break;
		case Report.type.streamChangeCost:
			icons.push(18);
			break;
		case Report.type.stream:
			switch (report.data.type) {
				case 0:
					icons.push(54);
					break; //предложение
				case 1:
					icons.push(50);
					break; //запуск
				case 3:
					icons.push(51);
					break; //закрыт
				default:
					icons.push(52);
					break; //окончание
			}
			break;
		case Report.type.countryJoin:
		case Report.type.countryLeave:
			icons.push(92);
			break;
		case Report.type.reinfDeath:
			icons.push(report.data.survive == report.data.army ? 33: 32);
			break;
		case Report.type.hunger:
			icons.push(94);
			
			if( report.isHungerSpecReason() )
				icons.push(99);
			
			break;
		case Report.type.subsidy:
			icons.push(81);
			break;
		case Report.type.revolution:
			icons.push(103);
			break;
		case Report.type.createTown:
			icons.push(report.data.town != 0? 100 : 102);
			break;
		case Report.type.getDeposit:
			icons.push(report.data.result > 0 ? 97 : 101);
			break;
		case Report.type.credit:
			icons.push(83);
			break;
		case Report.type.depositMove:
			icons.push(105);
			break;
		case Report.type.consumption:
			icons.push(55);
			break;
		case Report.type.switchOff:
			icons.push(93);
			break;
		case Report.type.sendMoney:
			icons.push(82);
			break;
		case Report.type.reinf:
			switch (report.data.operation) {
				case Report.reinfOperation.gone:
					icons.push(30);
					break;
				case Report.reinfOperation.back:
					icons.push(31);
					break;
				case Report.reinfOperation.withdraw:
					icons.push(31);
					break;
			}
			break;
		case Report.type.payment:
			icons.push(8);
			icons.push( report.data.cancel ? 107 : 106 );
			break;
		case Report.type.luckMove:
		case Report.type.bonusCode:
			icons.push(8);
			icons.push(80);
			break;
		case Report.type.settle:
		case Report.type.worldStop:
			icons.push(8);
			break;
		case Report.type.bonusEnded:
			icons.push({icon:snip.res(Resource.ids.luck)});
			break;
		case Report.type.infoReport:
			var icon = 109;
			
			if( report.isAccReport )
				icon++;
			
			icons.push(icon);
			break;
		case Report.type.noFuel:
			var icon = 111;
			
			icons.push(icon);
			break;
	}
	return icons;
};


wReports.prototype.calcName = function(){
	return 'reports';
};

wReports.prototype.addNotif = function(){
    this.notif.other[Notif.ids.refreshReports] = function(){
		this.wrp.find('.reports-select-all').prop('checked', false);
	};
};

wReports.prototype.calcChildren = function(){
    this.children.view = bReports_view;
};

wReports.prototype.getData = function(){
	this.data.openTime = timeMgr.getNow(); // Фиксируем время открытия окна
	
	wReports.superclass.getData.apply(this, arguments);
};

wReports.prototype.cacheCont = function(){
	this.$footer = this.cont.find('.wnd-footer');
	
	wReports.superclass.cacheCont.apply(this, arguments);
};

wReports.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.reports-del-selected', function(){
			var selected = [],
				params = utils.urlToObj(self.wrp.find('.reports-form').serialize(), true);
                
			for( var reportId in params )
				selected.push(parseInt(reportId));
            
			reqMgr.deleteReports(false, false, selected, function(){
				notifMgr.runEvent(Notif.ids.refreshReports);
			});
		})
		.on('click', '.reports-read-all', function() {
			reqMgr.readRep(self.data.openTime, function(){
				notifMgr.runEvent(Notif.ids.refreshReports);
			});
		})
		.on('click', '.reports-del-all', function() {
			self.children.view.delAll();
		})
		.on('change', '.reports-select-all', function(){
			utils.toggleAttr(self.cont.find('.tbl-reports :checkbox[data-arch="0"]'), 'checked', $(this).is(':checked'));
		});
};


wReports.prototype.getReportsList = function(){
	if( this.children.view )
		return this.children.view.data.reportsList;
};

wReports.prototype.toggleFooter = function(toggle){
	this.$footer.toggleClass('-hidden', toggle);
};




bReports_view = function(){
	this.name = 'view';
	
	bReports_view.superclass.constructor.apply(this, arguments);
	
	this.options.clearData = false;
	this.options.hasReqData = false;
};

utils.extend(bReports_view, Block);


bReports_view.prototype.calcName = function(){
    return 'view';
};

bReports_view.prototype.getData = function(){
	var self = this;
	
	if( this.data.filterBin === undefined ){
		this.data.filterBin = utils.toInt(ls.getReportFilters(wReports.defFilter));
		this.data.filterBin = this.data.filterBin & (1 << wReports.types.townReports) ? this.data.filterBin ^ (1 << wReports.types.townReports) : this.data.filterBin; // Сброс фильтра "Отчеты только данного города
		
		this.getFilter();
	}
	
	if( this.data.num === undefined )
		this.data.num = 0;
	
	var	filter = this.data.filterBin;

	if( this.data.type !== undefined ){
		filter = 1 << utils.toInt(this.data.type);
		
		if( this.data.filterBin & (1 << wReports.types.townReports) )
			filter += (1 << wReports.types.townReports);
	}
	
	var loaderId = contentLoader.start( 
		this.parent.wrp.find('.wnd-cont-wrp'),
		20, 
		function(){
			self.getReqData(function(){
				reqMgr.getReports(self.data.num, self.data.filterArch, filter, function(resp, reqId){
					self.tryProcessResp(
						resp, reqId,
						function(){
							contentLoader.stop(loaderId);
							
							this.data.reportsList = resp.reps;
							this.data.next = resp.next;
							this.data.prev = resp.prev;
							
							if(this.data.reportsList == null && this.data.num){
								this.data.num -= 15;
								
								notifMgr.runEvent(Notif.ids.refreshReports);
								
								return;
							}
							
							this.data.filtersHide = false;
							
							if (!this.data.filterArch){
								if( this.data.filterBin == wReports.defFilter && this.data.type === undefined )
									if(this.data.reportsList && this.data.reportsList.length <= 15 && this.data.prev === undefined && this.data.next === undefined)
										this.data.filtersHide = true;
							}
							
							this.storeReports();
							
							this.dataReceived();
						}
					);
				});
			});
		}
	);
};

bReports_view.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.refreshReports];
	
    this.notif.other[Notif.ids.townStreamOfferDelete] = this.notifStreamOfferDelete;
	this.notif.other[Notif.ids.accReportMarkAsRead] = this.markAsRead;
};

bReports_view.prototype.bindEvent = function(){
    var self = this;
	
    this.wrp
		.on('click', '.js-show-type', function() {
			self.data.type = utils.toInt($(this).data('type'));
			self.data.num = 0;

			if( self.cont.find('#lab1').prop('checked') )
				self.data.filterBin = self.data.filterBin | (1 << wReports.types.townReports);
			else{
				if( self.data.filterBin & (1 << wReports.types.townReports) )
					self.data.filterBin = self.data.filterBin ^ (1 << wReports.types.townReports);
			}

			ls.setReportFilters(utils.toInt(self.data.filterBin));

			notifMgr.runEvent(Notif.ids.refreshReports);
		})
		.on('click', '.reports-filter-arch', function(){
			self.data.filterArch = true;
			self.data.filterBin = wReports.defFilter;
            
			notifMgr.runEvent(Notif.ids.refreshReports);
		})
		.on('submit', '#reports-filter', function(e) {
            e.preventDefault();
            
			var	params = utils.urlToObj($(this).serialize(), true);

			self.setNewFilter(params);

			delete self.data.type;
            
			notifMgr.runEvent(Notif.ids.refreshReports);
		})
		.on('click', '#types-select-all', function(){
			var $filter = self.cont.find('#reports-filter'),
				$checkers = $filter.find('.reports-filter-cb'),
				checkersLen = $checkers.length,
				checked = 0;

			$checkers.each(function() {
				if( $(this).is(':checked') )
					++checked;
			});

			if( checked == checkersLen )
				$checkers.removeAttr('checked');
			else
				$checkers.prop('checked',true);
		})
		.on('click', '.js-show-next.-active', function(e) {
            e.preventDefault();
            
			self.data.num = $(this).data('next');

			notifMgr.runEvent(Notif.ids.refreshReports);
		})	
		.on('click', '.js-show-prev.-active', function(e) {
            e.preventDefault();
            
			self.data.num = $(this).data('prev');

			notifMgr.runEvent(Notif.ids.refreshReports);
		});
};

bReports_view.prototype.afterDraw = function(){
	if( !debug.isAdmin() ) {
		ls.setReportTime(timeMgr.getNow() + 10);
		
		notifMgr.runEvent(Notif.ids.accReportNew);
	}
	
	this.parent.toggleFooter(!this.data.reportsList);
};


bReports_view.prototype.notifStreamOfferDelete = function(offer){
	for(var report in this.data.reportsList){
		report = this.data.reportsList[report];
		
		if( report.type == Report.type.streamOffer && report.id == offer.id ){
			this.show();
			
			return;
		}
	}
};


bReports_view.prototype.getFilter = function(){
    this.data.filters = this.data.filterBin.toString(2).split('').reverse();
};

bReports_view.prototype.setNewFilter = function(params){
	this.data.filterBin = 0;
	
	this.data.filterArch = params.arch == 'on';
	
	for (var name in params) {
		if (name != 'arch')
			this.data.filterBin += 1 << utils.toInt(name.substr(1,1));
	}
	
    this.getFilter();
	
	ls.setReportFilters(this.data.filterBin);
};

bReports_view.prototype.storeReports = function(){
    for (var report in this.data.reportsList) {
		this.data.reportsList[report] = new Report(this.data.reportsList[report]);
		
        report = this.data.reportsList[report];
		
        wofh.reports[report.id] = report;
    }
};

bReports_view.prototype.showFilter = function(){  
    if( this.data.filters )
        this.wrp.find('.reports-filter-wrp').html(this.data.filtersHide ? '' : tmplMgr.reports.filter(this.data));
};

bReports_view.prototype.markAsRead = function(id) {
	if( this.wrp )
		this.wrp.find('a[data-id="' + id + '"]').removeClass('-type-unread');
};

bReports_view.prototype.delAll = function() {
	var self = this;
	
    wndMgr.addConfirm('Ты действительно хочешь удалить все отчеты?').onAccept = function(){
		reqMgr.deleteReports(timeMgr.servTime, self.data.type ? (1 << self.data.type) : self.data.filterBin, false, function(){
			notifMgr.runEvent(Notif.ids.refreshReports);
		});
	};
};