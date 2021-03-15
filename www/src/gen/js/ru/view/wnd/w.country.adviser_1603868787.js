/**
	Интерфейс советника страны
*/

wCountryAdviser = function(){
	this.name = 'countryAdviser';
	this.hashName = 'countryAdviser';
	
	wCountryAdviser.superclass.constructor.apply(this, arguments);
	
	if( !this.id )
        this.id = wofh.country.id;
};

utils.extend(wCountryAdviser, Wnd);

WndMgr.regWnd('countryAdviser', wCountryAdviser);


wCountryAdviser.prototype.calcChildren = function() {   
    this.children.view = bCountryAdviser_view;
};



bCountryAdviser_view = function(){
	this.name = 'view';
	
	bCountryAdviser_view.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(bCountryAdviser_view, Block);


bCountryAdviser_view.prototype.getData = function(){
	var self = this;
	
	this.data.id = this.parent.id;
	
	this.countReq = 1;
	
	this.loaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'),
		0,
		function(){
			self.getCountryData();
			
			self.getStatData();
			
			self.dataReceived();	
		} 
	);
};

bCountryAdviser_view.prototype.dataReceived = function(){
    if( !(--this.countReq) ){
		contentLoader.stop(this.loaderId); 
		
		bCountryAdviser_view.superclass.dataReceived.apply(this, arguments);
	}
};

bCountryAdviser_view.prototype.calcChildren = function(){
    if( this.data.towns )
        this.children.town = tabCountryAdviserTown;
    if( this.data.resList )
        this.children.res = tabCountryAdviserRes;
    
	this.children.stat = tabCountryAdviserStat;
};

bCountryAdviser_view.prototype.beforeShowChildren = function(){   
    this.tabs = new Tabs(this.cont);
	
	this.tabs.addTabs(this.children);
};

bCountryAdviser_view.prototype.afterDraw = function(){
    this.tabs.openTab(this.getDefTabName());
};

bCountryAdviser_view.prototype.afterResize = function(firstShow){
	if( firstShow )
		this.parent.setHeaderCont(this.data);
};


bCountryAdviser_view.prototype.getDefTabName = function(){
	var tabName = 'stat';
    
    if( this.children.town )
		tabName = 'town';
    if( this.children.res )
        tabName = 'res';
	
	return tabName;
};

bCountryAdviser_view.prototype.getCountryData = function(){
	if( !wofh.country || this.data.id != wofh.country.id ){	
        this.countReq++;
		
		this.getReqData(function(){
			var self = this;
			
			reqMgr.getCountry(this.data.id, function(resp, reqId){
				self.tryProcessResp(
					resp, reqId,
					function(){
						if( !resp || !resp.country || !resp.country[this.data.id] ){
							this.parent.close();
							
							return;
						}
						
						this.data.country = resp.country[this.data.id];
						
						this.dataReceived(); 
					}
				);
			});
		}, {minReqId: true});
    } 
	else
        this.data.country = wofh.country;
};

bCountryAdviser_view.prototype.getStatData = function(){
	this.countReq++;
	
	this.getReqData(function(){
		var self = this;
		
		reqMgr.getCountryStatistics(this.data.id, function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
					resp.id = this.data.id;
					resp.country = this.data.country;
					
					this.data = resp;
					
					//округления 
					if(this.data.resList){
						var list = this.data.resList.getList();
						for (var res in list) {
							res = list[res];
							res.inc = utils.toInt(res.inc);
							res.cons = utils.toInt(res.cons);
							res.dec = utils.toInt(res.dec);
							res.fuel = utils.toInt(res.fuel);
							res.total = res.inc - res.cons - res.dec - res.fuel;
						}
						
						this.data.resList = this.data.resList.getSortList();
					}
					
					for (var snap in this.data.history){
						snap = this.data.history[snap];
						var food = 0;
						for (var res in snap.resinc.getList()){
							res = snap.resinc.getElem(res);

							if (res.isGrown())
								food += res.getCount();
						}
						
						if (food)
							snap.resinc.addCount(Resource.ids.food, food);
					}
					
					this.dataReceived();
				}
			);
		});
	}, {minReqId: true});
};



/******
 * Вкладка ресурсов
 */

tabCountryAdviserRes = function(){
    this.name = 'res';
    this.tabTitle = 'Ресурсы';
	
	tabCountryAdviserRes.superclass.constructor.apply(this, arguments);
};

utils.extend(tabCountryAdviserRes, Tab);

tabCountryAdviserRes.prototype.afterDraw = function(){
    this.table = new tblCountryAdviserRes(this, this.cont);
	
    this.table.toggleSort('res');
};

tabCountryAdviserRes.prototype.onDisplay = function(){
    this.table.display();
}


/******
 * Вкладка ресурсов - таблица
 */

tblCountryAdviserRes = function(parent, cont) {
    this.tmpl = tmplMgr.countryAdviser.res.table;
    
    this.data = {};
    this.data.list = parent.parent.data.resList.getList();
    
	tblCountryAdviserRes.superclass.constructor.apply(this, arguments);
    this.bind();
};

utils.extend(tblCountryAdviserRes, Table);

tblCountryAdviserRes.prototype.getSortVal = function(res, field) {
    if (field == 'prod') return res.inc;
    if (field == 'pop') return res.cons;
    if (field == 'army') return res.dec;
    if (field == 'fuel') return res.fuel;
    if (field == 'total') return res.total;
    
    return res.getId();
}

tblCountryAdviserRes.prototype.getDefSortDir = function(field){
    return field != 'res';
}



/******
 * Вкладка города
 */

tabCountryAdviserTown = function(){
    this.name = 'town';
    this.tabTitle = 'Города';
	
	tabCountryAdviserTown.superclass.constructor.apply(this, arguments);
    
    //this.data.townFilters = [];
};

utils.extend(tabCountryAdviserTown, Tab);


tabCountryAdviserTown.prototype.afterDraw = function(){
    var self = this;
    
    this.table = new tblCountryAdviserTown(this, this.cont);
    this.table.toggleSort('town');
    
    //фильтры
    this.cont.on('click', '.cAdv-towns-filter', function(){  
        var field = $(this).data('field');
        
        if (field == 'dist' || field == 'pop' || field == 'army' || field == 'aad') {
            var wnd = wndMgr.addWnd(wCountryAdviserTownFilterRange, {field: field, parent: self});
            wnd.setZ(999999);
        } else {
            var val = $(this).data('val');
            self.table.toggleFilter(field, val);
            self.showFilter();
        }
    });
};

tabCountryAdviserTown.prototype.onDisplay = function(){
    this.table.display();
}

tabCountryAdviserTown.prototype.showFilter = function(){
    var list = utils.clone(this.table.filter);
    
    //вместо кода передаём объекты
    for (var accPos in list.acc){
        var accId = list.acc[accPos];
        list.acc[accPos] = this.parent.data.accounts[accId];
    }
    for (var townPos in list.town){
        var townId = list.town[townPos];
        list.town[townPos] = this.parent.data.towns[townId];
    }
    for (var depPos in list.deposit){
        var depId = list.deposit[depPos];
        list.deposit[depPos] = new Deposit(depId);
    }
    for (var wonderPos in list.wonder){
        var wonderId = list.wonder[wonderPos];
        list.wonder[wonderPos] = new Slot(wonderId);
    }
    
    this.cont.find('.cAdv-town-filter').html(tmplMgr.countryAdviser.town.filter({list: list}));
};


/******
 * Вкладка города - таблица
 */

tblCountryAdviserTown = function(parent, cont) {
    this.tmpl = tmplMgr.countryAdviser.town.table;
    this.data = {};
    this.data.list = utils.objToArr(parent.parent.data.towns);
    
	tblCountryAdviserTown.superclass.constructor.apply(this, arguments);
    
    this.setOptions();
    
    this.bind();
};

utils.extend(tblCountryAdviserTown, Table);

tblCountryAdviserTown.townSpecNormalCount = 7;//число обычных нажималок
tblCountryAdviserTown.townSpecCount = tblCountryAdviserTown.townSpecNormalCount + Resource.getList().length;

tblCountryAdviserTown.prototype.setOptions = function(){
	this.options.useScroll = true;
    this.options.useBlocks = true;
    this.options.rowHeight = 26;
};

tblCountryAdviserTown.prototype.bind = function(){
    var self = this;
	
	tblCountryAdviserTown.superclass.bind.apply(this, arguments);
	
    //установка точки привязки для расчёта расстояния
    this.cont.on('click', '.cAdv-towns-dist', function(){
        var townId = $(this).parents('.cAdv-towns-town').data('id');
        
        var town = self.getTownById(townId);
        
        self.data.townSelect = town;
        self.turnOffSort('dist');
    });
    
    //установка контроля над городом
    this.cont.on('click', '.cAdv-towns-control', function(){   
        var townId = $(this).parents('.cAdv-towns-town').data('id');
        var town = self.getTownById(townId);
        
        //$(this).toggleClass('-active')
        
        //сохраняем     
        town.control = !town.control;
        self.saveStorageField(townId, 'control', ~~town.control);
        
        self.turnOffSort('control');
        
    });
    
    //редактирование комментария
    this.cont.on('click', '.cAdv-towns-comment', function(){   
        var townId = $(this).parents('.cAdv-towns-town').data('id');
        var town = self.getTownById(townId);
        
        wndMgr.addConfirm(tmplMgr.countryAdviser.town.comment(town)).onAccept = function(){
            //сохраняем        
            town.comment = this.wrp.find('textarea').val();
            
            self.turnOffSort('comment');
        
            self.saveStorageField(townId, 'comment', town.comment);
            
            self.show();
        };
    });
    
    //отметка о специализации города
    this.cont.on('click', '.cAdv-towns-spec', function(){   
        var townId = $(this).parents('.cAdv-towns-town').data('id');
        var town = self.getTownById(townId);
        
        town.spec = (town.spec+1) % tblCountryAdviserTown.townSpecCount;
        self.saveStorageField(townId, 'spec', town.spec);
        self.turnOffSort('spec');
    });
};

tblCountryAdviserTown.prototype.prepareData = function() {
    if(!this.data.townSelect){
        this.data.townSelect = this.data.list[0];
    }
    for (var town in this.data.list){
        town = this.data.list[town];
        town.dist = Trade.calcDistance(this.data.townSelect.pos, town.pos);

        town.specIcon = Math.min(town.spec, tblCountryAdviserTown.townSpecNormalCount);
        if (town.spec >= tblCountryAdviserTown.townSpecNormalCount) {
            town.specRes = Resource.getList()[town.spec - tblCountryAdviserTown.townSpecNormalCount];
        } else {
            delete town.specRes;
        }
    }
    
    this.filterData();
    
}

tblCountryAdviserTown.prototype.saveStorageField = function(townId, field, value) {
    var storeddata = this.parent.parent.data.storeddata;
    if (!storeddata.towns[townId]){
        storeddata.towns[townId] = {};
    }
    storeddata.towns[townId][field] = value;
	
    reqMgr.setCountryData(storeddata);
};


tblCountryAdviserTown.prototype.getTownById = function(townId) {  
    for (var town in this.data.list){
        town = this.data.list[town];
        if (town.id == townId) {
            return town;
        }
    }
};

tblCountryAdviserTown.prototype.filterData = function() {
    if (this.filter == '') return;
    for (var town in this.data.list) {
        town = this.data.list[town];
        
        var pass = true;
        for (var filterField in this.filter) {
            var filterData = this.filter[filterField];
            var passField = false;
            
            if (filterData.range) {//значения от минимума до максимума
                passField = filterData.min <= this.getSortVal(town, filterField) && filterData.max >= this.getSortVal(town, filterField)
            } else {//значения из списка
                for (var filterVal in filterData) {
                    var filterVal = filterData[filterVal]
                    if (this.getFilterVal(town, filterField, filterVal)){

                        passField = true;
                        break;
                    }
                }
            }
            
            if (!passField) {
                pass = false;
                break;
            }
        }
        
        town.filter = pass;
    }
}

tblCountryAdviserTown.prototype.getDefSortDir = function(field){
    var arr = ['control','terrWater', 'terrHill', 'pop', 'army', 'aad', 'spec'];
    return utils.inArray(arr, field);
}

tblCountryAdviserTown.prototype.getFilterVal = function(town, field, value) {
    if (field == 'control') return town.control == value;
    if (field == 'acc') return town.account.id == value;
    if (field == 'spec') return town.spec == value;
    if (field == 'town') return town.id == value;
    if (field == 'terrWater') return town.getType().water == value;
    if (field == 'terrHill') return town.getType().hill == value;
    if (field == 'climate') return town.climate == value;
    if (field == 'deposit') return town.deposit.id == value;
    if (field == 'depRes') return town.deposit.getRes().hasElem(value);
    if (field == 'wonder') return town.wonder ? town.wonder.id == value : false;
    if (field == 'comment') return town.comment.length>0 && value;
};

tblCountryAdviserTown.prototype.getSortVal = function(town, field) {
    if (field == 'dist') return town.dist;
    if (field == 'control') return town.control||false;
    if (field == 'acc') return town.account.name.toUpperCase();
    if (field == 'spec') return town.spec;
    if (field == 'town') return town.name.toUpperCase();
    if (field == 'terrWater') return town.getType().water;
    if (field == 'terrHill') return town.getType().hill;
    if (field == 'climate') return town.climate;
    if (field == 'deposit') return town.deposit.getName()||'я';
    if (field == 'depRes') {
        var res = town.deposit.getRes().getFirst();
        return res? res.id: -1;
    }
    if (field == 'pop') return town.pop;
    if (field == 'army') return town.armypop;
    if (field == 'wonder') return town.wonder?(town.wonder.getName()+(town.wonder.isActive()?0:1)):'я';
    if (field == 'aad') return town.ad||0;
    if (field == 'comment') return town.comment;
    return town.id;//сортировка по умолчанию - если нет вообще сортировки или если значения совпадают
};



wCountryAdviserTownFilterRange = function(data){
	wCountryAdviserTownFilterRange.superclass.constructor.apply(this, arguments);
    
    this.data.cont = tmplMgr.countryAdviser.town.filterPeriod();
	
    this.options.inactive = false;
    
    this.parentWnd = data.parent;
	
    this.initSliderData(data.field);
};

utils.extend(wCountryAdviserTownFilterRange, TooltipWnd);

wCountryAdviserTownFilterRange.prototype.showVal = function(){
    this.cont.find('.cAdv-towns-filterRange-val.-type-min').html(this.data.valMin);
    this.cont.find('.cAdv-towns-filterRange-val.-type-max').html(this.data.valMax);
};

wCountryAdviserTownFilterRange.prototype.initSliderData = function(field){
    this.data.field = field;
    
    this.data.max = Math.ceil(this.parentWnd.table.getMaxVal(this.data.field));

    if (this.parentWnd.table.filter[this.data.field]) {
        this.data.valMin = this.parentWnd.table.filter[this.data.field].min;
        this.data.valMax = this.parentWnd.table.filter[this.data.field].max;
    } else {
        this.data.valMin = 0;
        this.data.valMax = this.data.max;
    }
};

wCountryAdviserTownFilterRange.prototype.bindEvent = function(){
    var self = this;
	
    snip.sliderHandler(this.cont.find('.sliderRange'), {
        range: true,
        min: 0, 
        max: self.data.max,
        values: [self.data.valMin, self.data.valMax],
        slide: function( event, ui ) {
            self.data.valMin = ui.values[0];
            self.data.valMax = ui.values[1];
            self.showVal();
        }
    });
	
    this.cont.on('click', 'button', function(){
        self.parentWnd.table.toggleFilterRange(self.data.field, self.data.valMin, self.data.valMax);
        self.parentWnd.showFilter();
        self.close();
    });
	
    this.showVal();
};

wCountryAdviserTownFilterRange.prototype.setAutoPos = Wnd.prototype.setAutoPos;



/******
 * Вкладка статичтики
 */
        
tabCountryAdviserStat = function(parent, cont){
    this.name = 'stat';
    this.tabTitle = 'Графики';
	
	tabCountryAdviserStat.superclass.constructor.apply(this, arguments);
};

    utils.extend(tabCountryAdviserStat, Tab);
    
    tabCountryAdviserStat.prototype.getData = function(){
        this.data = this.parent.data.history;
        
        this.dataReceived();
    };
    
    tabCountryAdviserStat.prototype.getTmplData = function(){
        var data = {list: this.data, id: this.parent.data.id};
		
        return data;
    };
    
    tabCountryAdviserStat.prototype.bindEvent = function(){
		if( !this.data ) return;
		
        var self = this;
        
        this.colors = {
            knowledge: '#006837',
            army: '#b92121',
            pop: '#00b7ff',
            accounts: '#1b1464',
            resinc: '#f15a24',
            towns: '#72ff00',
            res: {min: '705314', max: 'f1b22b', range: 25},
            unit: {min: '440000', max: 'ff0000', range: 120},
			train: '#a27e00'
        };
		
        this.btnsInited = {}//какие блоки кнопок инициализированы
		
        this.graphT = 10;//отступ сверху
        this.graphLR = 10;//отступ по бокам
        this.graphW = 900;//ширина чарта
        this.graphH = 250;//высота чарта

        this.maxYSpread = 0.3//диапазон распределения графиков
		
        //this.graphB = this.graphT + this.graphH;//позиция низа чарта
        this.graphL = this.graphLR;//положение левой границы чарта
        this.graphR = this.graphL + this.graphW;//положение левой границы чарта
        this.graphWLR = this.graphW + 2 * this.graphLR;//ширина чарта с учётом отступов

        this.yList = ['army', 'resinc', 'knowledge', 'pop', 'towns', 'accounts', 'train'];
		
        this.graphs = {};

        //графики
        this.wrp.on('click', '.cAdv-stat-btn.-type-graph', function(){
            if ($(this).hasClass('-disabled')) return;
            var field = $(this).data('field');
            var param = $(this).data('param');
            self.toggleGraph(field, param);
            self.showGraphs();
            self.saveChartStatus();
        });
        this.wrp.on('mouseover', '.cAdv-stat-btn.-type-graph', function(){
            var field = $(this).data('field');
            var param = $(this).data('param');

            var graph = self.getGraph(field, param);
            if (graph && graph.active) {
                self.hoverGraph(field, param);
                self.showTooltip(field, param, ~~(Math.random() * self.timeArr.length));
            }
        });
        this.wrp.on('mouseout', '.cAdv-stat-btn.-type-graph', function(){
            self.hideTooltip();
        });

        //графики юнитов и ресов
        this.wrp.on('click', '.cAdv-stat-btn.-type-toggle', function(){
            self.toggleBtns($(this).data('field'));
        });


        //выделение графиков
        this.wrp.on('mousemove', '.cAdv-stat-graphHover', function(event){
            var field = $(this).data('field');
            var param = $(this).data('param');

            //находим ближайшуую точку
            var distMax = 9999;
            for (var pos in self.timeArr) {
                var posX = self.timeArr[pos];
                var dist = Math.abs(posX - event.offsetX)
                if (dist < distMax){
                    distMax = dist;
                } else {
                    pos--;
                    break;
                }
            }

            self.showTooltip(field, param, pos);

        });
        this.wrp.on('mouseleave', '.cAdv-stat-graphHover', function(event){
            var elem = $(event.relatedTarget);
            if (!elem.is('.cAdv-stat-popup,.cAdv-stat-point') && elem.parents('.cAdv-stat-popup,.cAdv-stat-point').length == 0) {
                self.hideTooltip();
            }
        });

        this.wrp.on('mouseleave', '.cAdv-stat-popup', function(){
            self.hideTooltip();
        });

        //скрываем пустые кнопки
        this.wrp.on('click', '.cAdv-stat-hideEmpty', function(){
            self.wrp.find('.cAdv-stat-hideEmpty').toggleClass('-hidden');
            self.showEmptyBtns = +!self.showEmptyBtns;
            self.toggleEmptyBtns();
        });
    };
    
	tabCountryAdviserStat.prototype.toggleEmptyBtns = function(){
        ls.setCountryAdvEmptyBtn(this.showEmptyBtns);
		
        this.wrp.find('.cAdv-stat-btn.-disabled').toggleClass('-hidden', this.showEmptyBtns == 0);
    };
	
    tabCountryAdviserStat.prototype.afterDraw = function(){
        if( !this.data ) return;
		
		var self = this;
		
        $('#svgintro').svg({onLoad: function(obj){
            self.svg = obj;

            self.calcTimeArr();

            self.g = self.svg.group({transform: 'translate('+self.graphLR+','+self.graphT+')'}); 
            self.drawTimeline();

            var graphs = ls.getCountryAdvStat();
            if (graphs) {
                graphs = JSON.parse(graphs);
                for (var field in graphs){
                    var data = graphs[field];
                    if (data == 1) {
                        self.toggleGraph(field)
                    } else {
                        for (var param in data) {
                            self.toggleGraph(field, data[param])
                        }
                    }
                }
            }
            self.showGraphs();
        }});
		
        this.showEmptyBtns = ls.getCountryAdvEmptyBtn(0);
        this.toggleEmptyBtns();
    };

    tabCountryAdviserStat.prototype.saveChartStatus = function(){
        var status = {};

        for (var graphName in this.graphs) {
            var graph = this.graphs[graphName];
            if (graph.folder){
                /*status[graphName] = [];
                for (var subgraph in graph.folder){
                    if (graph.folder[subgraph].active){
                        status[graphName].push(+subgraph);
                    }
                }
                if (utils.sizeOf(status[graphName]) == 0){
                    delete status[graphName];
                }*/
            } else {
                if (graph.active) {
                    status[graphName] = 1;
                }
            }
        }

        ls.setCountryAdvStat(JSON.stringify(status));
    };


    tabCountryAdviserStat.prototype.getGraph = function(field, param){
        var graph = this.graphs[field];
        if ( graph && typeof (param) != 'undefined' ) graph = graph.folder[param];
        return graph;
    };

    tabCountryAdviserStat.prototype.hoverGraph = function(field, param){
        //выделяем график
        this.cont.find('.cAdv-stat-graph[data-field="'+field+'"]'+(typeof (param) != 'undefined'?'[data-param="'+param+'"]':'')).addClass('-hover');
        //выделяем кнопку
        this.cont.find('.cAdv-stat-btn[data-field="'+field+'"]'+(typeof (param) != 'undefined'?'[data-param="'+param+'"]':'')).addClass('-highlight');
    }

    tabCountryAdviserStat.prototype.showTooltip = function(field, param, pos){
        if (this.tooltip && this.tooltip.pos == pos && this.tooltip.field == field && this.tooltip.param == param) return;
		
        this.hideTooltip();
		
        this.tooltip = {pos: pos, field: field, param: param};
		
        var graph = this.getGraph(field, param);
		
        this.hoverGraph(field, param);
		
        //собираем данные для тултипа
        var time = this.data[pos].time;
        var val = this.getValue(graph, pos);
		
        //показываем тултип
        var tooltip = $(tmplMgr.countryAdviser.stat.popup({field: field, param: param, time: time, val: val, color: graph.color}));
        this.wrp.find('.cAdv-stat-graphsWrp').append(tooltip);
		
        //переносим в нужное место
        var x = this.timeArr[pos] + this.graphLR;
        var y = this.calcPointY(graph, pos) + this.graphT;
        tooltip.css({top: y, left: x});
		
        //показываем точку
        this.drawPoint(graph, pos);
    };

    tabCountryAdviserStat.prototype.hideTooltip = function(){
        if (this.tooltip) {
            var graph = this.getGraph(this.tooltip.field, this.tooltip.param);
            this.svg.remove(graph.point);
        }
        delete this.tooltip;
        this.cont.find('.cAdv-stat-graph').removeClass('-hover');
        this.cont.find('.cAdv-stat-btn').removeClass('-highlight');

        this.cont.find('.cAdv-stat-popup').remove();

    }

    tabCountryAdviserStat.prototype.toggleGraph = function(field, param, active){
        if(field == 'army' || field == 'unit'){
            if(this.parent.data.id != wofh.country.id) return;
            if(!wofh.account.isAdviser() && !wofh.account.isHead() && !wofh.account.isGeneral())return;
        }
        if(field == 'knowledge' || field == 'resinc'){
            if(this.parent.data.id != wofh.country.id) return;
            if(!wofh.account.isAdviser() && !wofh.account.isHead())return;
        }
        
        var graph = this.graphs[field];
        if (graph && typeof (param) != 'undefined') graph = graph.folder[param];
        //var graph = this.getGraph(field, param);

        if (!graph) {
            graph = this.calcGraph(field, param);
        }
		
        graph.active = typeof(active) != 'undefined' ? active : !graph.active;

        this.cont.find('.cAdv-stat-btn[data-field="'+field+'"]'+(typeof (param) != 'undefined'?'[data-param="'+param+'"]':'')).toggleClass('-active', graph.active);
    };

    tabCountryAdviserStat.prototype.hideGraph = function(graph){
        if (graph.group) {
            this.svg.remove(graph.group);
            delete graph.group;
        }
    }


    tabCountryAdviserStat.prototype.calcBtnList = function(field, listCls){
        var total = new listCls();
        for (var frame in this.data) {
            frame = this.data[frame];
            var list = frame[field];
            for (var elem in list.getList()){
                total.addElem(elem);
            }
        }
        return total;
    };


    tabCountryAdviserStat.prototype.toggleBtns = function(field){
        this.cont.find('.cAdv-stat-btn.-type-toggle[data-field="'+field+'"]').toggleClass('-active');

        var wrp = this.cont.find('.cAdv-stat-btns-'+field+'Wrp');

        if (field == 'res') {
            var list = this.calcBtnList('resinc', ResList);
            var listAll = ResList.getAll().sortByDefault();
        } else {
            var list = this.calcBtnList('army', Army);
            var listAll = Army.getAll();
        }

        if (typeof(this.btnsInited[field]) == 'undefined') {
            wrp.html(tmplMgr.countryAdviser.stat.addBtns({type: field, list: list, listAll: listAll}));
        }

        this.btnsInited[field] = !this.btnsInited[field];

        for (var elem in list.getList()) {
            this.toggleGraph(field, elem, this.btnsInited[field]);
        }
        this.showGraphs();

        this.toggleEmptyBtns();
    };

    tabCountryAdviserStat.prototype.calcTimeArr = function(){
        this.minTime = this.data[0].time;
        this.maxTime = this.data[this.data.length-1].time;
		
        this.scaleX = this.graphW / (this.maxTime - this.minTime);

        this.timeArr = [];
        for (var i=0; i<this.data.length; i++) {
            this.timeArr.push(this.calcTimePos(this.data[i].time));
        }
    };
	
    tabCountryAdviserStat.prototype.calcTimePos = function(time){
        return (time - this.minTime) * this.scaleX;
    }

    //вычисляем скорость
    tabCountryAdviserStat.prototype.calcGraph = function(field, param) {
        var graph = {};
		
        if (typeof(param)!= 'undefined') {
            if( !this.graphs[field] )
                this.graphs[field] = {folder: {}, field: field};
            
            this.graphs[field].folder[param] = graph;
            graph.param = param;
            graph.startY = 0;
            graph.noScale2 = true;
        } else {
            this.graphs[field] = graph;
        }
		
        graph.field = field;
		
		graph.min = this.getValue(graph, 0);
		graph.max = graph.min;
		for (var i=1; i<this.data.length; i++) {
			var val = this.getValue(graph, i);
			if (graph.max < val) graph.max = val;
			if (graph.min > val) graph.min = val;
		}          
		//var start = min;//стартовая позиция от которой график отрисовывается
		if( graph.noScale2 ) {
			graph.scaleTmp = graph.max;
		} else {
			if (graph.min == 0){
				graph.noScale = true;
				graph.scaleTmp = graph.max-graph.min;
			} else {
				graph.scaleTmp = graph.max/graph.min;
			}
		}

		graph.color = this.calcColor(graph);

		graph.active = false;

        return graph;
    };

    tabCountryAdviserStat.prototype.calcColor = function(graph) {	
        var color = this.colors[graph.field];
        if (typeof(color) == 'string'){
            return color;
        } else {
            var rMin = parseInt(color.min.slice(0,2), 16);
            var gMin = parseInt(color.min.slice(2,4), 16);
            var bMin = parseInt(color.min.slice(4,6), 16);

            var rMax = parseInt(color.max.slice(0,2), 16);
            var gMax = parseInt(color.max.slice(2,4), 16);
            var bMax = parseInt(color.max.slice(4,6), 16);

            var rInc = rMax == rMin ? 0 : 10//Math.max((rMax-rMin) / color.range, 10);
            var gInc = gMax == gMin ? 0 : 10//Math.max((gMax-gMin) / color.range, 10);
            var bInc = bMax == bMin ? 0 : 10//Math.max((bMax-bMin) / color.range, 10);

            var r = rInc ? (rInc * graph.param) % (rMax-rMin) + rMin: rMin;
            var g = gInc ? (gInc * graph.param) % (gMax-gMin) + gMin : gMin;
            var b = bInc ? (bInc * graph.param) % (bMax-bMin) + bMin : bMin;

            return '#' + utils.twoDigits(r.toString(16)) + utils.twoDigits(g.toString(16)) + utils.twoDigits(b.toString(16));
        }
    };



    tabCountryAdviserStat.prototype.checkBorders = function(elem) {
    }

    tabCountryAdviserStat.prototype.calcScale = function(folder){
        var scale = 0;
        for (var graph in folder) {
            graph = folder[graph];
            if (graph.active && !graph.noScale) {
                scale = Math.max(scale, graph.scaleTmp);
            }
            /*if (graph.active && graph.noScale) {
                graph.scale = graph.scaleTmp;
            }*/
        }
        return scale;
    }

    tabCountryAdviserStat.prototype.calcYSpread = function(){
        var count = 0;
        for (var graph in this.graphs) {
            graph = this.graphs[graph];
            if (graph.active) {
                count++;
            }
        }
        var ySpread = count>1 ? this.maxYSpread / (count-1) : 0;
        return ySpread * this.graphH;
    }



    tabCountryAdviserStat.prototype.getValue = function(graph, i){
        if (graph.field == 'res') {
            var val = this.data[i].resinc.getCount(graph.param)||0;
        } else if (graph.field == 'unit') {
            var unit = this.data[i].army.getElem(graph.param);
            var val = unit? /*unit.getPopCost() * */unit.getCount() : 0;
        } else {
            var val = this.data[i][graph.field];
            if (graph.field == 'resinc') val = val.calcSum();
            if (graph.field == 'army') val = val.calcPop();
        }
        return ~~val;
    };

    tabCountryAdviserStat.prototype.calcPointY = function(graph, i) {
        var val = this.getValue(graph, i);
        if (graph.noScale2) {
            return graph.scale ? (1 - val / graph.scale) * this.graphH : 0;
        } else if (graph.noScale) {
           /* if(i ==0){
                console.log('graph.max', graph.max)
                console.log('graph.max', val)
                console.log('graph.scaleTmp', graph.scaleTmp)
                console.log('this.lengthY', this.lengthY)
                console.log('this.graphH', this.graphH)
                console.log('graph.startY', graph.startY)
            }*/
            //return (graph.max - val) / graph.scaleTmp * this.lengthY * this.graphH - graph.startY;
            return (graph.max - val) / graph.scaleTmp * this.lengthY * this.graphH + (1-this.lengthY) * this.graphH - graph.startY;
        } else {
            var val = graph.scale == 1 ? 1 : (1 - (val - graph.min) / (graph.scale - 1) / (graph.min) * this.lengthY);
            return val * this.graphH - graph.startY;
        }
    }

    //отрисовка чарта
    tabCountryAdviserStat.prototype.showGraphs = function(){
        //обычные графики
        var scale = this.calcScale(this.graphs);//масштаб графиков по Y
        var ySpread = this.calcYSpread();//смещение графика по Y
        this.lengthY = (ySpread==0? 1: (1-this.maxYSpread)) ;//максимальная высота графика

        var y = 0;
        for (var graph in this.yList) {
            graph = this.graphs[this.yList[graph]];
            if (graph) {
                this.hideGraph(graph);
                if (graph.active) {

                    graph.startY = y * ySpread;
                    y ++;
                    graph.scale = graph.noScale? graph.scale: scale

                    this.drawGraph(graph);
                }
            }
        }

        //графики ресурсов и армий
        for (var graphFolder in this.graphs) {
            graphFolder = this.graphs[graphFolder].folder;
            if (graphFolder) {
                var scale = this.calcScale(graphFolder);
                for (var graph in graphFolder) {
                    graph = graphFolder[graph];
                    graph.scale = scale;
                    this.hideGraph(graph);
                    if (graph.active) {
                        this.drawGraph(graph);
                    }
                }
            }
        }
    }

    tabCountryAdviserStat.prototype.drawGraph = function(graph) {
        graph.group = this.svg.group(this.g);

        var pathArea = ['M0,'+this.graphH];
        var pathLine = [];

        for (var i = 0; i < this.data.length; i++) {
            var x = this.timeArr[i];
            var y = this.calcPointY(graph, i);
            /*
            if(i == 0){
                console.log('POINT0', graph, y);
            }*/

            pathArea.push('L'+x+','+y);
            pathLine.push((i?'L':'M')+x+','+y);

            //круг реагирующий на наведение
            //this.svg.circle(this.g, x, y, 10, {opacity: '0', class: 'countryadv-stat-point', 'data-field': field, 'data-pos': i}); 
        }
        pathArea.push('L'+this.graphW+','+this.graphH);
        //this.svg.path(this.graphs[field], pathArea.join(''), {fill: 'url(#grad1)', class: "countryadv-stat-graph"});
        this.svg.path(graph.group, pathLine.join(''), {fill: 'none', stroke: graph.color/*, 'vector-effect': "non-scaling-stroke"*/, class: "cAdv-stat-graph", 'data-field': graph.field, 'data-param': graph.param});
        this.svg.path(graph.group, pathLine.join(''), {fill: 'none', stroke: graph.color, strokeWidth: 15, opacity: 0, class: "cAdv-stat-graphHover", 'data-field': graph.field, 'data-param': graph.param});
    };

    tabCountryAdviserStat.prototype.drawPoint = function(graph, i) {
        var x = this.timeArr[i];
        var y = this.calcPointY(graph, i)
        graph.point = this.svg.circle(graph.group, x, y, 5, {fill: '#fff', stroke: graph.color, strokeWidth: 3, class: "cAdv-stat-point"}); 
    }

    tabCountryAdviserStat.prototype.drawTimeline = function() {
        var padTop = 5;
        var dateWidth = 20;//ширина метки с датой

        this.timeline = this.svg.group(this.g, {transform: 'translate(0,'+(this.graphH+padTop)+')'})
        this.svg.line(this.timeline, 0, 0, this.graphW, 0, {stroke: 'black', strokeWidth: 2});


        var time = timeMgr.startDay(this.minTime);
        if (time != this.minTime){
            time = timeMgr.addDay(time);
        }
        var month = '';

        var lastX = 0;
        while (time < this.maxTime){
            var x = Math.round(this.calcTimePos(time));

            //вертикальная линия
            this.svg.line(this.timeline, x, - this.graphH - padTop, x, 0, {stroke: '#555', strokeWidth: 0.3});

            //дата
            if(lastX == 0 || x-lastX >dateWidth) {
                lastX = x;
                this.svg.text(this.timeline, x, 13, timeMgr.fMomentFormat(time, 'D'));

            }

            //месяц
            var monthNew = timeMgr.fMomentFormat(time, 'MMM')
            if (monthNew != month) {
                month = monthNew;
                this.svg.text(this.timeline, x, 25, month);
            }

            time = timeMgr.addDay(time);
        }
        this.cont.find('.cAdv-stat-period').html(timeMgr.fMomentDate(timeMgr.startDay(this.minTime)) + ' - ' + timeMgr.fMomentDate(timeMgr.startDay(this.maxTime)));
    }